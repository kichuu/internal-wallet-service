import {
  pgTable,
  uuid,
  pgEnum,
  decimal,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { transactions } from "./transaction.schema";
import { accounts } from "./account.schema";

export const entryTypeEnum = pgEnum("entry_type", ["DEBIT", "CREDIT"]);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transactionId: uuid("transaction_id")
      .references(() => transactions.id)
      .notNull(),
    accountId: uuid("account_id")
      .references(() => accounts.id)
      .notNull(),
    entryType: entryTypeEnum("entry_type").notNull(),
    amount: decimal("amount", { precision: 18, scale: 4 }).notNull(),
    balanceAfter: decimal("balance_after", { precision: 18, scale: 4 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_ledger_entries_transaction_id").on(table.transactionId),
    index("idx_ledger_entries_account_id_created_at").on(
      table.accountId,
      table.createdAt
    ),
    check("ledger_amount_positive", sql`${table.amount} > 0`),
  ]
);
