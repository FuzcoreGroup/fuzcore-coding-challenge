/**
 * @openapi
 * /invoice:
 *   get:
 *     tags:
 *       - Invoice
 *     summary: Get paginated invoices
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: pageLength
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List invoices
 *   post:
 *     tags:
 *       - Invoice
 *     summary: Create invoice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - items
 *               - status
 *               - amount
 *             properties:
 *               customerId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Invoice created
 * /invoice/{id}:
 *   get:
 *     tags:
 *       - Invoice
 *     summary: Get invoice by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice object
 *       404:
 *         description: Invoice not found
 *   put:
 *     tags:
 *       - Invoice
 *     summary: Update invoice status
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice updated
 */
import { Router } from "express";
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
} from "../controllers/invoiceController";

const router = Router();

router.get("/", getInvoices);
router.post("/", createInvoice);
router.get("/:id", getInvoiceById);
router.put("/:id", updateInvoiceStatus);

export default router;
