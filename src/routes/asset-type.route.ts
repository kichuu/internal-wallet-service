import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { assetTypes } from "../db/schema/asset-type.schema";
import { jsonResponse } from "../dto";

const router = Router();

// GET /asset-types - List all asset types
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await db.select().from(assetTypes);
    jsonResponse(res, 200, types);
  } catch (err) {
    next(err);
  }
});

export default router;
