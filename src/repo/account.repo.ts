import { eq, sql, SQL } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { accounts } from "../db/schema/account.schema";

type Db = NodePgDatabase<any>;

export const accountRepo = {
  async findById(db: Db, id: string) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id));
    return account ?? null;
  },

  async findByExternalId(db: Db, externalId: string) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.externalId, externalId));
    return account ?? null;
  },

  async findByIdForUpdate(db: Db, id: string) {
    const result = await db.execute(
      sql`SELECT * FROM accounts WHERE id = ${id} FOR UPDATE`
    );
    return (result.rows[0] as any) ?? null;
  },

  async lockAccountsInOrder(db: Db, ids: string[]) {
    const sorted = [...ids].sort();
    const locked: any[] = [];
    for (const id of sorted) {
      const account = await this.findByIdForUpdate(db, id);
      if (account) locked.push(account);
    }
    return locked;
  },

  async create(
    db: Db,
    data: {
      externalId?: string;
      accountType: "USER" | "SYSTEM";
      name: string;
      email?: string;
      assetTypeId: string;
      balance?: string;
    }
  ) {
    const [account] = await db.insert(accounts).values(data).returning();
    return account;
  },

  async updateBalance(
    db: Db,
    id: string,
    newBalance: string,
    expectedVersion: number
  ) {
    const [updated] = await db
      .update(accounts)
      .set({
        balance: newBalance,
        version: sql`${accounts.version} + 1`,
        updatedAt: new Date(),
      })
      .where(
        sql`${accounts.id} = ${id} AND ${accounts.version} = ${expectedVersion}`
      )
      .returning();
    return updated ?? null;
  },

  async findByAssetTypeId(db: Db, assetTypeId: string) {
    return db
      .select()
      .from(accounts)
      .where(eq(accounts.assetTypeId, assetTypeId));
  },
};
