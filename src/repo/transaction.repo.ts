import { eq, sql, desc, and, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { transactions } from "../db/schema/transaction.schema";

type Db = NodePgDatabase<any>;

export const transactionRepo = {
  async findById(db: Db, id: string) {
    const [txn] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return txn ?? null;
  },

  async findByIdempotencyKey(db: Db, key: string) {
    const [txn] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.idempotencyKey, key));
    return txn ?? null;
  },

  async create(
    db: Db,
    data: {
      idempotencyKey: string;
      type: "TOP_UP" | "BONUS" | "SPEND";
      status?: "PENDING" | "COMPLETED" | "FAILED";
      sourceAccountId: string;
      destAccountId: string;
      assetTypeId: string;
      amount: string;
      description?: string;
      referenceId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const [txn] = await db.insert(transactions).values(data).returning();
    return txn;
  },

  async updateStatus(
    db: Db,
    id: string,
    status: "PENDING" | "COMPLETED" | "FAILED"
  ) {
    const [txn] = await db
      .update(transactions)
      .set({ status, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return txn ?? null;
  },

  async findMany(
    db: Db,
    filters: {
      accountId?: string;
      type?: string;
      status?: string;
    },
    limit: number,
    offset: number
  ) {
    const conditions: SQL[] = [];

    if (filters.accountId) {
      conditions.push(
        sql`(${transactions.sourceAccountId} = ${filters.accountId} OR ${transactions.destAccountId} = ${filters.accountId})`
      );
    }
    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type as any));
    }
    if (filters.status) {
      conditions.push(eq(transactions.status, filters.status as any));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(transactions)
        .where(where)
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(where),
    ]);

    return { data, total: countResult[0].count };
  },
};
