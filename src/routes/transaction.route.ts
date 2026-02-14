import { Router, Request, Response, NextFunction } from "express";
import { transactionService } from "../service/transaction.service";
import { requireIdempotencyKey } from "../middleware/idempotency.middleware";
import { validateBody } from "../middleware/validation.middleware";
import {
  topUpSchema,
  bonusSchema,
  spendSchema,
} from "../schema/transaction.schema";
import { jsonResponse, mapDataToDTO, mapArrayToDTO } from "../dto";
import { toTransactionDTO } from "../dto/transaction.dto";
import { extractPagination, buildPaginationMeta } from "../helper/pagination";

const router = Router();

// POST /transactions/top-up
router.post(
  "/top-up",
  requireIdempotencyKey,
  validateBody(topUpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idempotencyKey = req.headers["idempotency-key"] as string;
      const txn = await transactionService.topUp({
        idempotencyKey,
        ...req.body,
      });
      jsonResponse(res, 201, mapDataToDTO(txn, toTransactionDTO));
    } catch (err) {
      next(err);
    }
  }
);

// POST /transactions/bonus
router.post(
  "/bonus",
  requireIdempotencyKey,
  validateBody(bonusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idempotencyKey = req.headers["idempotency-key"] as string;
      const txn = await transactionService.bonus({
        idempotencyKey,
        ...req.body,
      });
      jsonResponse(res, 201, mapDataToDTO(txn, toTransactionDTO));
    } catch (err) {
      next(err);
    }
  }
);

// POST /transactions/spend
router.post(
  "/spend",
  requireIdempotencyKey,
  validateBody(spendSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idempotencyKey = req.headers["idempotency-key"] as string;
      const txn = await transactionService.spend({
        idempotencyKey,
        ...req.body,
      });
      jsonResponse(res, 201, mapDataToDTO(txn, toTransactionDTO));
    } catch (err) {
      next(err);
    }
  }
);

// GET /transactions/:id
router.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const txn = await transactionService.getTransaction(req.params.id);
      jsonResponse(res, 200, mapDataToDTO(txn, toTransactionDTO));
    } catch (err) {
      next(err);
    }
  }
);

// GET /transactions
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, offset } = extractPagination(req);
      const filters = {
        accountId: req.query.accountId as string | undefined,
        type: req.query.type as string | undefined,
        status: req.query.status as string | undefined,
      };

      const { data, total } = await transactionService.listTransactions(
        filters,
        limit,
        offset
      );

      jsonResponse(
        res,
        200,
        mapArrayToDTO(data, toTransactionDTO),
        buildPaginationMeta(page, limit, total)
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;
