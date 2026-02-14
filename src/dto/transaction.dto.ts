import { parseDecimal } from "../helper/formatter";

export interface TransactionDTO {
  id: string;
  idempotencyKey: string;
  type: string;
  status: string;
  sourceAccountId: string;
  destAccountId: string;
  assetTypeId: string;
  amount: number;
  description: string | null;
  referenceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toTransactionDTO(txn: any): TransactionDTO {
  return {
    id: txn.id,
    idempotencyKey: txn.idempotencyKey ?? txn.idempotency_key,
    type: txn.type,
    status: txn.status,
    sourceAccountId: txn.sourceAccountId ?? txn.source_account_id,
    destAccountId: txn.destAccountId ?? txn.dest_account_id,
    assetTypeId: txn.assetTypeId ?? txn.asset_type_id,
    amount: parseDecimal(txn.amount),
    description: txn.description,
    referenceId: txn.referenceId ?? txn.reference_id ?? null,
    metadata: txn.metadata,
    createdAt: txn.createdAt ?? txn.created_at,
    updatedAt: txn.updatedAt ?? txn.updated_at,
  };
}
