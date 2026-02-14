import { parseDecimal } from "../helper/formatter";

export interface AccountDTO {
  id: string;
  externalId: string | null;
  accountType: string;
  name: string;
  email: string | null;
  assetTypeId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toAccountDTO(account: any): AccountDTO {
  return {
    id: account.id,
    externalId: account.externalId ?? account.external_id ?? null,
    accountType: account.accountType ?? account.account_type,
    name: account.name,
    email: account.email,
    assetTypeId: account.assetTypeId ?? account.asset_type_id,
    balance: parseDecimal(account.balance),
    createdAt: account.createdAt ?? account.created_at,
    updatedAt: account.updatedAt ?? account.updated_at,
  };
}
