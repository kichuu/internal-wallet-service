export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: PaginationMeta;
}

export type TransactionType = "TOP_UP" | "BONUS" | "SPEND";
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";
export type AccountType = "USER" | "SYSTEM";
export type EntryType = "DEBIT" | "CREDIT";
