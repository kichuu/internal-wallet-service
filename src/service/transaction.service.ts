import { sql } from "drizzle-orm";
import { db, pool } from "../db";
import { drizzle } from "drizzle-orm/node-postgres";
import { accountRepo } from "../repo/account.repo";
import { transactionRepo } from "../repo/transaction.repo";
import { ledgerService } from "./ledger.service";
import { NotFoundError } from "../errors/not-found.error";
import { InsufficientBalanceError } from "../errors/insufficient-balance.error";
import { HttpException } from "../errors/http-exception";
import { parseDecimal } from "../helper/formatter";

async function executeInSerializableTransaction<T>(
  fn: (txDb: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    const txDb = drizzle(client as any);
    const result = await fn(txDb);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getSystemAccount(
  txDb: any,
  name: string,
  assetTypeId: string
) {
  const result = await txDb.execute(
    sql`SELECT * FROM accounts WHERE account_type = 'SYSTEM' AND external_id = (
      SELECT 'SYSTEM_' || ${name.toUpperCase()} || '_' || at.symbol
      FROM asset_types at WHERE at.id = ${assetTypeId}
    ) AND asset_type_id = ${assetTypeId} LIMIT 1`
  );
  const account = result.rows[0] as any;
  if (!account) {
    throw new NotFoundError(`System account '${name}' not found for this asset type`);
  }
  return account;
}

export const transactionService = {
  async topUp(params: {
    idempotencyKey: string;
    accountId: string;
    assetTypeId: string;
    amount: number;
    referenceId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) {
    // Check for existing idempotent transaction
    const existing = await transactionRepo.findByIdempotencyKey(
      db,
      params.idempotencyKey
    );
    if (existing) return existing;

    return executeInSerializableTransaction(async (txDb) => {
      const treasury = await getSystemAccount(txDb, "Treasury", params.assetTypeId);

      // Lock accounts in UUID order to prevent deadlocks
      const lockedAccounts = await accountRepo.lockAccountsInOrder(txDb, [
        treasury.id,
        params.accountId,
      ]);

      const treasuryLocked = lockedAccounts.find(
        (a: any) => a.id === treasury.id
      );
      const userLocked = lockedAccounts.find(
        (a: any) => a.id === params.accountId
      );

      if (!userLocked) {
        throw new NotFoundError(`Account '${params.accountId}' not found`);
      }

      const amount = params.amount.toFixed(4);

      // Create transaction record
      const txn = await transactionRepo.create(txDb, {
        idempotencyKey: params.idempotencyKey,
        type: "TOP_UP",
        status: "PENDING",
        sourceAccountId: treasury.id,
        destAccountId: params.accountId,
        assetTypeId: params.assetTypeId,
        amount,
        description: params.description,
        referenceId: params.referenceId,
        metadata: params.metadata,
      });

      // Calculate new balances
      const newTreasuryBalance = (
        parseDecimal(treasuryLocked.balance) - params.amount
      ).toFixed(4);
      const newUserBalance = (
        parseDecimal(userLocked.balance) + params.amount
      ).toFixed(4);

      // Create double-entry ledger entries
      await ledgerService.createDoubleEntry(txDb, {
        transactionId: txn.id,
        sourceAccountId: treasury.id,
        destAccountId: params.accountId,
        amount,
        sourceBalanceAfter: newTreasuryBalance,
        destBalanceAfter: newUserBalance,
      });

      // Update balances with optimistic concurrency control
      const updatedTreasury = await accountRepo.updateBalance(
        txDb,
        treasury.id,
        newTreasuryBalance,
        Number(treasuryLocked.version)
      );
      if (!updatedTreasury) {
        throw new HttpException(409, "Concurrent modification on treasury account");
      }

      const updatedUser = await accountRepo.updateBalance(
        txDb,
        params.accountId,
        newUserBalance,
        Number(userLocked.version)
      );
      if (!updatedUser) {
        throw new HttpException(409, "Concurrent modification on user account");
      }

      // Mark transaction as completed
      const completed = await transactionRepo.updateStatus(
        txDb,
        txn.id,
        "COMPLETED"
      );

      return completed;
    });
  },

  async bonus(params: {
    idempotencyKey: string;
    accountId: string;
    assetTypeId: string;
    amount: number;
    description?: string;
    metadata?: Record<string, unknown>;
  }) {
    const existing = await transactionRepo.findByIdempotencyKey(
      db,
      params.idempotencyKey
    );
    if (existing) return existing;

    return executeInSerializableTransaction(async (txDb) => {
      const treasury = await getSystemAccount(txDb, "Treasury", params.assetTypeId);

      const lockedAccounts = await accountRepo.lockAccountsInOrder(txDb, [
        treasury.id,
        params.accountId,
      ]);

      const treasuryLocked = lockedAccounts.find(
        (a: any) => a.id === treasury.id
      );
      const userLocked = lockedAccounts.find(
        (a: any) => a.id === params.accountId
      );

      if (!userLocked) {
        throw new NotFoundError(`Account '${params.accountId}' not found`);
      }

      const amount = params.amount.toFixed(4);

      const txn = await transactionRepo.create(txDb, {
        idempotencyKey: params.idempotencyKey,
        type: "BONUS",
        status: "PENDING",
        sourceAccountId: treasury.id,
        destAccountId: params.accountId,
        assetTypeId: params.assetTypeId,
        amount,
        description: params.description,
        metadata: params.metadata,
      });

      const newTreasuryBalance = (
        parseDecimal(treasuryLocked.balance) - params.amount
      ).toFixed(4);
      const newUserBalance = (
        parseDecimal(userLocked.balance) + params.amount
      ).toFixed(4);

      await ledgerService.createDoubleEntry(txDb, {
        transactionId: txn.id,
        sourceAccountId: treasury.id,
        destAccountId: params.accountId,
        amount,
        sourceBalanceAfter: newTreasuryBalance,
        destBalanceAfter: newUserBalance,
      });

      const updatedTreasury = await accountRepo.updateBalance(
        txDb,
        treasury.id,
        newTreasuryBalance,
        Number(treasuryLocked.version)
      );
      if (!updatedTreasury) {
        throw new HttpException(409, "Concurrent modification on treasury account");
      }

      const updatedUser = await accountRepo.updateBalance(
        txDb,
        params.accountId,
        newUserBalance,
        Number(userLocked.version)
      );
      if (!updatedUser) {
        throw new HttpException(409, "Concurrent modification on user account");
      }

      return await transactionRepo.updateStatus(txDb, txn.id, "COMPLETED");
    });
  },

  async spend(params: {
    idempotencyKey: string;
    accountId: string;
    assetTypeId: string;
    amount: number;
    referenceId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) {
    const existing = await transactionRepo.findByIdempotencyKey(
      db,
      params.idempotencyKey
    );
    if (existing) return existing;

    return executeInSerializableTransaction(async (txDb) => {
      const revenue = await getSystemAccount(txDb, "Revenue", params.assetTypeId);

      const lockedAccounts = await accountRepo.lockAccountsInOrder(txDb, [
        params.accountId,
        revenue.id,
      ]);

      const userLocked = lockedAccounts.find(
        (a: any) => a.id === params.accountId
      );
      const revenueLocked = lockedAccounts.find(
        (a: any) => a.id === revenue.id
      );

      if (!userLocked) {
        throw new NotFoundError(`Account '${params.accountId}' not found`);
      }

      // Insufficient balance check
      if (parseDecimal(userLocked.balance) < params.amount) {
        throw new InsufficientBalanceError(
          `Insufficient balance. Available: ${userLocked.balance}, Required: ${params.amount}`
        );
      }

      const amount = params.amount.toFixed(4);

      const txn = await transactionRepo.create(txDb, {
        idempotencyKey: params.idempotencyKey,
        type: "SPEND",
        status: "PENDING",
        sourceAccountId: params.accountId,
        destAccountId: revenue.id,
        assetTypeId: params.assetTypeId,
        amount,
        description: params.description,
        referenceId: params.referenceId,
        metadata: params.metadata,
      });

      const newUserBalance = (
        parseDecimal(userLocked.balance) - params.amount
      ).toFixed(4);
      const newRevenueBalance = (
        parseDecimal(revenueLocked.balance) + params.amount
      ).toFixed(4);

      await ledgerService.createDoubleEntry(txDb, {
        transactionId: txn.id,
        sourceAccountId: params.accountId,
        destAccountId: revenue.id,
        amount,
        sourceBalanceAfter: newUserBalance,
        destBalanceAfter: newRevenueBalance,
      });

      const updatedUser = await accountRepo.updateBalance(
        txDb,
        params.accountId,
        newUserBalance,
        Number(userLocked.version)
      );
      if (!updatedUser) {
        throw new HttpException(409, "Concurrent modification on user account");
      }

      const updatedRevenue = await accountRepo.updateBalance(
        txDb,
        revenue.id,
        newRevenueBalance,
        Number(revenueLocked.version)
      );
      if (!updatedRevenue) {
        throw new HttpException(409, "Concurrent modification on revenue account");
      }

      return await transactionRepo.updateStatus(txDb, txn.id, "COMPLETED");
    });
  },

  async getTransaction(id: string) {
    const txn = await transactionRepo.findById(db, id);
    if (!txn) {
      throw new NotFoundError(`Transaction '${id}' not found`);
    }
    return txn;
  },

  async listTransactions(
    filters: { accountId?: string; type?: string; status?: string },
    limit: number,
    offset: number
  ) {
    return transactionRepo.findMany(db, filters, limit, offset);
  },
};
