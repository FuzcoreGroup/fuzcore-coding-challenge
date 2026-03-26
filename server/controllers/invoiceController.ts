import { Response } from "express";
import { db } from "../db";
import { invoice, customers, transaction } from "../../shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth";
import { generatePaystackUrl } from "../clients/paystack";

function parsePagination(page?: string, pageLength?: string) {
  const p = Number(page || "1");
  const pl = Number(pageLength || "10");
  return {
    page: Number.isNaN(p) || p < 1 ? 1 : p,
    pageLength: Number.isNaN(pl) || pl < 1 ? 10 : pl,
  };
}

export async function getInvoices(req: AuthRequest, res: Response) {
  const { page, pageLength } = parsePagination(
    req.query.page as string,
    req.query.pageLength as string,
  );

  const totalDataQuery = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(invoice)
    .where(eq(invoice.userId, req.user!.userId));

  const total = Number(totalDataQuery[0]?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageLength));

  const rows = await db
    .select({
      id: invoice.id,
      customerId: invoice.customerId,
      status: invoice.status,
      items: invoice.items,
      amount: invoice.amount,
      paymentUrl: invoice.paymentUrl,
      createdAt: invoice.createdAt,
      customerName: customers.name,
    })
    .from(invoice)
    .leftJoin(
      customers,
      and(
        eq(invoice.customerId, customers.id),
        eq(invoice.userId, req.user!.userId),
      ),
    )
    .where(eq(invoice.userId, req.user!.userId))
    .limit(pageLength)
    .offset((page - 1) * pageLength);

  return res.json({
    page,
    pageLength,
    totalData: total,
    totalPages,
    data: rows,
  });
}

export async function getInvoiceById(req: AuthRequest, res: Response) {
  const id = String(req.params.id);
  const rows = await db
    .select({
      id: invoice.id,
      customerId: invoice.customerId,
      status: invoice.status,
      items: invoice.items,
      amount: invoice.amount,
      paymentUrl: invoice.paymentUrl,
      createdAt: invoice.createdAt,
      customerName: customers.name,
    })
    .from(invoice)
    .leftJoin(
      customers,
      and(
        eq(invoice.customerId, customers.id),
        eq(invoice.userId, req.user!.userId),
      ),
    )
    .where(and(eq(invoice.id, id), eq(invoice.userId, req.user!.userId)));

  if (!rows.length) {
    return res.status(404).json({ message: "Invoice not found" });
  }
  return res.json(rows[0]);
}

export async function createInvoice(req: AuthRequest, res: Response) {
  const { customerId, items, status, amount } = req.body;

  if (
    !customerId ||
    !items ||
    !Array.isArray(items) ||
    !status ||
    typeof amount !== "number"
  ) {
    return res.status(400).json({
      message: "customerId, items (array), status, and amount are required",
    });
  }

  // Verify customer belongs to user
  const customerCheck = await db
    .select()
    .from(customers)
    .where(
      and(eq(customers.id, customerId), eq(customers.userId, req.user!.userId)),
    );

  if (!customerCheck.length) {
    return res.status(400).json({ message: "Invalid customer" });
  }

  const paymentUrl = await generatePaystackUrl({
    email: "user@example.com",
    amount: Math.round(amount * 100),
    reference: `INV-${Date.now()}`,
  });

  const inserted = await db
    .insert(invoice)
    .values({
      userId: req.user!.userId,
      customerId,
      items,
      status,
      amount,
      paymentUrl,
    })
    .returning();

  // Fetch the created invoice with customer name
  const createdInvoice = await db
    .select({
      id: invoice.id,
      customerId: invoice.customerId,
      status: invoice.status,
      items: invoice.items,
      amount: invoice.amount,
      paymentUrl: invoice.paymentUrl,
      createdAt: invoice.createdAt,
      customerName: customers.name,
    })
    .from(invoice)
    .leftJoin(
      customers,
      and(
        eq(invoice.customerId, customers.id),
        eq(invoice.userId, req.user!.userId),
      ),
    )
    .where(
      and(eq(invoice.id, inserted[0].id), eq(invoice.userId, req.user!.userId)),
    );

  return res.status(201).json(createdInvoice[0]);
}

export async function updateInvoiceStatus(req: AuthRequest, res: Response) {
  const id = String(req.params.id);
  const { status } = req.body;
  if (!status || typeof status !== "string") {
    return res.status(400).json({ message: "status is required" });
  }

  const invRow = await db
    .select()
    .from(invoice)
    .where(and(eq(invoice.id, id), eq(invoice.userId, req.user!.userId)));
  if (!invRow.length) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  const updated = await db
    .update(invoice)
    .set({ status })
    .where(and(eq(invoice.id, id), eq(invoice.userId, req.user!.userId)))
    .returning();

  // If status is updated to "paid", create an income transaction
  if (status === "paid" && invRow[0].amount) {
    await db.insert(transaction).values({
      userId: req.user!.userId,
      type: "income",
      categoryId: null,
      amount: invRow[0].amount,
    });
  }

  const updatedInvoice = await db
    .select({
      id: invoice.id,
      customerId: invoice.customerId,
      status: invoice.status,
      items: invoice.items,
      amount: invoice.amount,
      paymentUrl: invoice.paymentUrl,
      createdAt: invoice.createdAt,
      customerName: customers.name,
    })
    .from(invoice)
    .leftJoin(
      customers,
      and(
        eq(invoice.customerId, customers.id),
        eq(invoice.userId, req.user!.userId),
      ),
    )
    .where(and(eq(invoice.id, id), eq(invoice.userId, req.user!.userId)));

  if (!updatedInvoice.length) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  return res.json(updatedInvoice[0]);
}
