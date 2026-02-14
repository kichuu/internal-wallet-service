import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ledgerEntryRepo } from "../repo/ledger-entry.repo";

type Db = NodePgDatabase<any>;

export const ledgerService = {
  async createDoubleEntry(
    db: Db,
    params: {
      transactionId: string;
      sourceAccountId: string;
      destAccountId: string;
      amount: string;
      sourceBalanceAfter: string;
      destBalanceAfter: string;
    }
  ) {
    const debitEntry = await ledgerEntryRepo.create(db, {
      transactionId: params.transactionId,
      accountId: params.sourceAccountId,
      entryType: "DEBIT",
      amount: params.amount,
      balanceAfter: params.sourceBalanceAfter,
    });

    const creditEntry = await ledgerEntryRepo.create(db, {
      transactionId: params.transactionId,
      accountId: params.destAccountId,
      entryType: "CREDIT",
      amount: params.amount,
      balanceAfter: params.destBalanceAfter,
    });

    return { debitEntry, creditEntry };
  },

  async getEntriesByTransaction(db: Db, transactionId: string) {
    return ledgerEntryRepo.findByTransactionId(db, transactionId);
  },

  async getEntriesByAccount(
    db: Db,
    accountId: string,
    limit: number,
    offset: number
  ) {
    return ledgerEntryRepo.findByAccountId(db, accountId, limit, offset);
  },
};
