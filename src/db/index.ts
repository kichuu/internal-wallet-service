import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config/configuration";
import * as assetTypeSchema from "./schema/asset-type.schema";
import * as accountSchema from "./schema/account.schema";
import * as transactionSchema from "./schema/transaction.schema";
import * as ledgerEntrySchema from "./schema/ledger-entry.schema";

export const pool = new Pool(
  config.DATABASE_URL
    ? { connectionString: config.DATABASE_URL, max: 20 }
    : {
        host: config.DATABASE_HOST,
        port: config.DATABASE_PORT,
        user: config.DATABASE_USER,
        password: config.DATABASE_PASSWORD,
        database: config.DATABASE_NAME,
        max: 20,
        ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : false,
      }
);

export const db = drizzle(pool, {
  schema: {
    ...assetTypeSchema,
    ...accountSchema,
    ...transactionSchema,
    ...ledgerEntrySchema,
  },
});

export type Database = typeof db;
