import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import { config } from "../config/configuration";
import { assetTypes } from "./schema/asset-type.schema";
import { accounts } from "./schema/account.schema";

async function seed() {
  const pool = new Pool({
    host: config.DATABASE_HOST,
    port: config.DATABASE_PORT,
    user: config.DATABASE_USER,
    password: config.DATABASE_PASSWORD,
    database: config.DATABASE_NAME,
    ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : false,
  });

  const db = drizzle(pool);

  console.log("Seeding database...");

  // 1. Asset Types
  const assetTypeData = [
    {
      name: "Gold Coins",
      symbol: "GC",
      description: "Primary in-game currency",
    },
    {
      name: "Diamonds",
      symbol: "DM",
      description: "Premium currency",
    },
    {
      name: "Loyalty Points",
      symbol: "LP",
      description: "Reward points",
    },
  ];

  const insertedAssetTypes: any[] = [];
  for (const at of assetTypeData) {
    const [existing] = await db
      .select()
      .from(assetTypes)
      .where(eq(assetTypes.symbol, at.symbol));
    if (existing) {
      insertedAssetTypes.push(existing);
      console.log(`  Asset type '${at.symbol}' already exists, skipping.`);
    } else {
      const [inserted] = await db.insert(assetTypes).values(at).returning();
      insertedAssetTypes.push(inserted);
      console.log(`  Created asset type: ${at.name} (${at.symbol})`);
    }
  }

  // 2. System Accounts (Treasury + Revenue per asset type)
  for (const at of insertedAssetTypes) {
    for (const name of ["Treasury", "Revenue"]) {
      const externalId = `SYSTEM_${name.toUpperCase()}_${at.symbol}`;
      const [existing] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.externalId, externalId));
      if (!existing) {
        await db.insert(accounts).values({
          externalId,
          accountType: "SYSTEM",
          name: `${name} (${at.symbol})`,
          assetTypeId: at.id,
          balance: "0",
        });
        console.log(`  Created system account: ${name} (${at.symbol})`);
      } else {
        console.log(
          `  System account '${name} (${at.symbol})' already exists, skipping.`
        );
      }
    }
  }

  // 3. User Accounts with initial balances (via top-up from treasury)
  const users = [
    {
      name: "Alice",
      email: "alice@example.com",
      balances: { GC: "1000.0000", DM: "50.0000", LP: "500.0000" },
    },
    {
      name: "Bob",
      email: "bob@example.com",
      balances: { GC: "500.0000", DM: "25.0000", LP: "200.0000" },
    },
  ];

  for (const user of users) {
    for (const at of insertedAssetTypes) {
      const externalId = `USER_${user.name.toUpperCase()}_${at.symbol}`;
      const balance =
        user.balances[at.symbol as keyof typeof user.balances] || "0";

      const [existing] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.externalId, externalId));

      if (!existing) {
        await db.insert(accounts).values({
          externalId,
          accountType: "USER",
          name: `${user.name} (${at.symbol})`,
          email: user.email,
          assetTypeId: at.id,
          balance,
        });
        console.log(
          `  Created user account: ${user.name} (${at.symbol}) with balance ${balance}`
        );
      } else {
        console.log(
          `  User account '${user.name} (${at.symbol})' already exists, skipping.`
        );
      }
    }
  }

  console.log("Seeding completed.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
