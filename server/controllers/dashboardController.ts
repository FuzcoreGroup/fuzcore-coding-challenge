import { Response } from "express";
import { db } from "../db";
import { transaction, invoice } from "../../shared/schema";
import { sql } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth";

export async function getDashboard(req: AuthRequest, res: Response) {
  // Get total revenue (sum of income transactions)
  const revenueResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${transaction.amount}), 0)`,
    })
    .from(transaction)
    .where(
      sql`${transaction.type} = 'income' AND ${transaction.userId} = ${req.user!.userId}`,
    );

  // Get total expenses (sum of expense transactions)
  const expenseResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${transaction.amount}), 0)`,
    })
    .from(transaction)
    .where(
      sql`${transaction.type} = 'expense' AND ${transaction.userId} = ${req.user!.userId}`,
    );

  // Get outstanding invoices (sum of amounts where status = 'sent')
  const outstandingResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${invoice.amount}), 0)`,
    })
    .from(invoice)
    .where(
      sql`${invoice.status} = 'sent' AND ${invoice.userId} = ${req.user!.userId}`,
    );

  const totalRevenue = Number(revenueResult[0]?.total || 0);
  const totalExpense = Number(expenseResult[0]?.total || 0);
  const outstandingInvoice = Number(outstandingResult[0]?.total || 0);

  return res.json({
    totalRevenue,
    totalExpense,
    outstandingInvoice,
  });
}
