-- Asset Types
INSERT INTO asset_types (id, name, symbol, description)
VALUES
  (gen_random_uuid(), 'Gold Coins', 'GC', 'Primary in-game currency'),
  (gen_random_uuid(), 'Diamonds', 'DM', 'Premium currency'),
  (gen_random_uuid(), 'Loyalty Points', 'LP', 'Reward points')
ON CONFLICT (symbol) DO NOTHING;

-- System Accounts (Treasury + Revenue per asset type)
INSERT INTO accounts (id, external_id, account_type, name, asset_type_id, balance)
SELECT gen_random_uuid(), 'SYSTEM_TREASURY_' || at.symbol, 'SYSTEM', 'Treasury (' || at.symbol || ')', at.id, 0
FROM asset_types at
ON CONFLICT (external_id) DO NOTHING;

INSERT INTO accounts (id, external_id, account_type, name, asset_type_id, balance)
SELECT gen_random_uuid(), 'SYSTEM_REVENUE_' || at.symbol, 'SYSTEM', 'Revenue (' || at.symbol || ')', at.id, 0
FROM asset_types at
ON CONFLICT (external_id) DO NOTHING;

-- User: Alice
INSERT INTO accounts (id, external_id, account_type, name, email, asset_type_id, balance)
SELECT gen_random_uuid(), 'USER_ALICE_' || at.symbol, 'USER', 'Alice (' || at.symbol || ')', 'alice@example.com', at.id,
  CASE at.symbol WHEN 'GC' THEN 1000 WHEN 'DM' THEN 50 WHEN 'LP' THEN 500 ELSE 0 END
FROM asset_types at
ON CONFLICT (external_id) DO NOTHING;

-- User: Bob
INSERT INTO accounts (id, external_id, account_type, name, email, asset_type_id, balance)
SELECT gen_random_uuid(), 'USER_BOB_' || at.symbol, 'USER', 'Bob (' || at.symbol || ')', 'bob@example.com', at.id,
  CASE at.symbol WHEN 'GC' THEN 500 WHEN 'DM' THEN 25 WHEN 'LP' THEN 200 ELSE 0 END
FROM asset_types at
ON CONFLICT (external_id) DO NOTHING;
