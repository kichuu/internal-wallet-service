import { Response } from "express";
import { ApiResponse, PaginationMeta } from "../types/app";

export function mapDataToDTO<T, R>(data: T, mapper: (item: T) => R): R {
  return mapper(data);
}

export function mapArrayToDTO<T, R>(data: T[], mapper: (item: T) => R): R[] {
  return data.map(mapper);
}

export function jsonResponse<T>(
  res: Response,
  statusCode: number,
  data?: T,
  pagination?: PaginationMeta
): void {
  const body: ApiResponse<T> = { success: true };
  if (data !== undefined) body.data = data;
  if (pagination) body.pagination = pagination;
  res.status(statusCode).json(body);
}
