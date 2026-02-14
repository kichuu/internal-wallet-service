import { Request, Response, NextFunction } from "express";
import { HttpException } from "../errors/http-exception";

export function requireIdempotencyKey(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const key = req.headers["idempotency-key"];
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    throw new HttpException(400, "Idempotency-Key header is required");
  }
  next();
}
