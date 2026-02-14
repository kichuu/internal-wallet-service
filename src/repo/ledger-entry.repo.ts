import { eq, sql, desc } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { ledgerEntries } from "../db/schema/ledger-entry.schema";

type Db = NodePgDatabase<any>;

export const ledgerEntryRepo = {
  async create(
    db: Db,
    data: {
      transactionId: string;
      accountId: string;
      entryType: "DEBIT" | "CREDIT";
      amount: string;
      balanceAfter: string;
    }
  ) {
    const [entry] = await db.insert(ledgerEntries).values(data).returning();
    return entry;
  },

  async findByTransactionId(db: Db, transactionId: string) {
    return db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.transactionId, transactionId));
  },

  async findByAccountId(
    db: Db,
    accountId: string,
    limit: number,
    offset: number
  ) {
    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, accountId))
        .orderBy(desc(ledgerEntries.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(ledgerEntries)
        .where(eq(ledgerEntries.accountId, accountId)),
    ]);

    return { data, total: countResult[0].count };
  },
};
