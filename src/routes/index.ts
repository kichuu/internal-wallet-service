import { Router } from "express";
import healthRoute from "./health.route";
import accountRoute from "./account.route";
import transactionRoute from "./transaction.route";
import assetTypeRoute from "./asset-type.route";

const router = Router();

router.use("/health", healthRoute);
router.use("/accounts", accountRoute);
router.use("/transactions", transactionRoute);
router.use("/asset-types", assetTypeRoute);

export default router;
