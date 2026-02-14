import { db } from "../db";
import { accountRepo } from "../repo/account.repo";
import { NotFoundError } from "../errors/not-found.error";
import { ConflictError } from "../errors/conflict.error";
import { parseDecimal } from "../helper/formatter";

export const accountService = {
  async createAccount(data: {
    externalId?: string;
    accountType: "USER" | "SYSTEM";
    name: string;
    email?: string;
    assetTypeId: string;
  }) {
    if (data.externalId) {
      const existing = await accountRepo.findByExternalId(db, data.externalId);
      if (existing) {
        throw new ConflictError(
          `Account with external ID '${data.externalId}' already exists`
        );
      }
    }

    return accountRepo.create(db, data);
  },

  async getAccount(id: string) {
    const account = await accountRepo.findById(db, id);
    if (!account) {
      throw new NotFoundError(`Account '${id}' not found`);
    }
    return account;
  },

  async getBalance(id: string) {
    const account = await accountRepo.findById(db, id);
    if (!account) {
      throw new NotFoundError(`Account '${id}' not found`);
    }
    return {
      accountId: account.id,
      balance: parseDecimal(account.balance),
      assetTypeId: account.assetTypeId,
    };
  },
};
