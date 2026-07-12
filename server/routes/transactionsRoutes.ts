/**
 * @openapi
 * /transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get paginated transactions
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: pageLength
 *         in: query
 *         schema:
 *           type: integer
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List transactions
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Create transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created
 * /api/transactions/select-category:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Select category using AI based on description
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Selected category object
 *       404:
 *         description: No categories found for user
 * /transactions/import:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Import transactions from CSV file
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with columns - category, amount, type, description
 *     responses:
 *       200:
 *         description: Import results
 *       400:
 *         description: Invalid file or data
 */
import { Router } from "express";
import {
  getTransactions,
  createTransaction,
  selectCategory,
  importTransactions,
} from "../controllers/transactionsController";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", getTransactions);
router.post("/", createTransaction);
router.post("/select-category", selectCategory);
router.post("/import", upload.single("file"), importTransactions);

export default router;
