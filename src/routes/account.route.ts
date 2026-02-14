import { Router, Request, Response, NextFunction } from "express";
import { accountService } from "../service/account.service";
import { ledgerService } from "../service/ledger.service";
import { db } from "../db";
import { validateBody } from "../middleware/validation.middleware";
import { createAccountSchema } from "../schema/account.schema";
import { jsonResponse, mapDataToDTO, mapArrayToDTO } from "../dto";
import { toAccountDTO } from "../dto/account.dto";
import { toLedgerEntryDTO } from "../dto/ledger-entry.dto";
import { extractPagination, buildPaginationMeta } from "../helper/pagination";

const router = Router();

// POST /accounts - Create a new user account
router.post(
  "/",
  validateBody(createAccountSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const account = await accountService.createAccount({
        ...req.body,
        accountType: "USER",
      });
      jsonResponse(res, 201, mapDataToDTO(account, toAccountDTO));
    } catch (err) {
      next(err);
    }
  }
);

// GET /accounts/:id - Get account details
router.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const account = await accountService.getAccount(req.params.id);
      jsonResponse(res, 200, mapDataToDTO(account, toAccountDTO));
    } catch (err) {
      next(err);
    }
  }
);

// GET /accounts/:id/balance - Get balance only
router.get(
  "/:id/balance",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const balance = await accountService.getBalance(req.params.id);
      jsonResponse(res, 200, balance);
    } catch (err) {
      next(err);
    }
  }
);

// GET /accounts/:id/ledger - Get ledger entries (paginated)
router.get(
  "/:id/ledger",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      await accountService.getAccount(req.params.id);

      const { page, limit, offset } = extractPagination(req);
      const { data, total } = await ledgerService.getEntriesByAccount(
        db,
        req.params.id,
        limit,
        offset
      );

      jsonResponse(
        res,
        200,
        mapArrayToDTO(data, toLedgerEntryDTO),
        buildPaginationMeta(page, limit, total)
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;
