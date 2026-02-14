import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  decimal,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { accounts } from "./account.schema";
import { assetTypes } from "./asset-type.schema";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "TOP_UP",
  "BONUS",
  "SPEND",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    idempotencyKey: varchar("idempotency_key", { length: 255 })
      .unique()
      .notNull(),
    type: transactionTypeEnum("type").notNull(),
    status: transactionStatusEnum("status").default("PENDING").notNull(),
    sourceAccountId: uuid("source_account_id")
      .references(() => accounts.id)
      .notNull(),
    destAccountId: uuid("dest_account_id")
      .references(() => accounts.id)
      .notNull(),
    assetTypeId: uuid("asset_type_id")
      .references(() => assetTypes.id)
      .notNull(),
    amount: decimal("amount", { precision: 18, scale: 4 }).notNull(),
    description: text("description"),
    referenceId: varchar("reference_id", { length: 255 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_transactions_idempotency_key").on(table.idempotencyKey),
    index("idx_transactions_source_account_id").on(table.sourceAccountId),
    index("idx_transactions_dest_account_id").on(table.destAccountId),
    check("amount_positive", sql`${table.amount} > 0`),
  ]
);
