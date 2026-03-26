/**
 * @openapi
 * /dashboard:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get dashboard metrics
 *     responses:
 *       200:
 *         description: Dashboard metrics (totalRevenue, totalExpense, outstandingInvoice)
 */
import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController";

const router = Router();

router.get("/", getDashboard);

export default router;
