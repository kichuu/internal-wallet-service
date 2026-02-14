import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  decimal,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { assetTypes } from "./asset-type.schema";

export const accountTypeEnum = pgEnum("account_type", ["USER", "SYSTEM"]);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalId: varchar("external_id", { length: 255 }).unique(),
    accountType: accountTypeEnum("account_type").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    assetTypeId: uuid("asset_type_id")
      .references(() => assetTypes.id)
      .notNull(),
    balance: decimal("balance", { precision: 18, scale: 4 })
      .default("0")
      .notNull(),
    version: integer("version").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_accounts_asset_type_id").on(table.assetTypeId)]
);
