import { parseDecimal } from "../helper/formatter";

export interface LedgerEntryDTO {
  id: string;
  transactionId: string;
  accountId: string;
  entryType: string;
  amount: number;
  balanceAfter: number;
  createdAt: Date;
}

export function toLedgerEntryDTO(entry: any): LedgerEntryDTO {
  return {
    id: entry.id,
    transactionId: entry.transactionId ?? entry.transaction_id,
    accountId: entry.accountId ?? entry.account_id,
    entryType: entry.entryType ?? entry.entry_type,
    amount: parseDecimal(entry.amount),
    balanceAfter: parseDecimal(entry.balanceAfter ?? entry.balance_after),
    createdAt: entry.createdAt ?? entry.created_at,
  };
}
