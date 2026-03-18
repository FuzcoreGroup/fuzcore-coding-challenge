import type { Express, Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { customers, invoiceItems, invoices } from "../../shared/schema";
import { requireAuth } from "../middleware/requireAuth";

const invoiceItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().finite(),
});

const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  tax: z.coerce.number().finite().optional().default(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1),
});

function getUserId(req: Request): string | undefined {
  const userId = (req as any).user?.id;
  return typeof userId === "string" ? userId : undefined;
}

function normalizeId(idParam: string | string[] | undefined): string | undefined {
  if (!idParam) return undefined;
  return Array.isArray(idParam) ? idParam[0] : idParam;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function computeTotals(items: Array<{ quantity: number; unitPrice: number }>, tax: number) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const total = subtotal + (tax ?? 0);
  return { subtotal, tax: tax ?? 0, total };
}

export function registerInvoiceRoutes(app: Express) {
  const router = Router();

  router.get("/", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    let where: any = eq(invoices.userId, userId);
    if (status && (status === "draft" || status === "sent" || status === "paid")) {
      where = and(where, eq(invoices.status, status));
    }

    const rows = await db
      .select({
        invoiceId: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        tax: invoices.tax,
        total: invoices.total,
        customerId: invoices.customerId,
        customerName: customers.name,
      })
      .from(invoices)
      .leftJoin(customers, eq(customers.id, invoices.customerId))
      .where(where)
      .orderBy(invoices.issueDate);

    const items = rows.map((r) => ({
      ...r,
      subtotal: Number(r.subtotal as any),
      tax: Number(r.tax as any),
      total: Number(r.total as any),
    }));

    return res.json({ items });
  });

  router.get("/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = normalizeId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const inv = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .limit(1);
    if (inv.length === 0) return res.status(404).json({ message: "Invoice not found" });

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, inv[0].id))
      .orderBy(invoiceItems.id);

    return res.json({
      invoice: {
        ...inv[0],
        subtotal: Number(inv[0].subtotal as any),
        tax: Number(inv[0].tax as any),
        total: Number(inv[0].total as any),
      },
      items: items.map((it) => ({
        ...it,
        amount: Number(it.amount as any),
        unitPrice: Number(it.unitPrice as any),
      })),
    });
  });

  router.get("/next-number", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const rows = await db
      .select({
        maxNumber: sql<number>`max(${invoices.invoiceNumber})`,
      })
      .from(invoices)
      .where(eq(invoices.userId, userId));

    const current = rows[0]?.maxNumber ?? null;
    return res.json({ nextInvoiceNumber: (current ?? 0) + 1 });
  });

  router.post("/", requireAuth, async (req, res) => {
    const body = createInvoiceSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ message: "Invalid request body", details: body.error.flatten() });
    }

    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Ensure customer belongs to this user.
    const cust = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, body.data.customerId), eq(customers.userId, userId)))
      .limit(1);
    if (cust.length === 0) return res.status(400).json({ message: "Invalid customer" });

    const nextNumRow = await db
      .select({ maxNumber: sql<number>`max(${invoices.invoiceNumber})` })
      .from(invoices)
      .where(eq(invoices.userId, userId));
    const nextInvoiceNumber = (nextNumRow[0]?.maxNumber ?? 0) + 1;

    const issueDate = toISODate(body.data.issueDate);
    const dueDate = body.data.dueDate ? toISODate(body.data.dueDate) : null;

    const totals = computeTotals(
      body.data.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
      body.data.tax ?? 0,
    );

    const inserted = await db
      .insert(invoices)
      .values({
        userId,
        customerId: body.data.customerId,
        invoiceNumber: nextInvoiceNumber,
        status: "draft",
        issueDate,
        dueDate: dueDate ?? null,
        subtotal: totals.subtotal.toFixed(2),
        tax: totals.tax.toFixed(2),
        total: totals.total.toFixed(2),
        notes: body.data.notes ?? null,
      } as any)
      .returning();

    const inv = inserted[0];

    await db.insert(invoiceItems).values(
      body.data.items.map((it) => ({
        invoiceId: inv.id,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice.toFixed(2),
        amount: (it.quantity * it.unitPrice).toFixed(2),
      })),
    );

    return res.status(201).json({ invoice: { ...inv, subtotal: Number(inv.subtotal as any), tax: Number(inv.tax as any), total: Number(inv.total as any) } });
  });

  router.patch("/:id/status", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = normalizeId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const body = z.object({ status: z.enum(["draft", "sent", "paid"]) }).safeParse(req.body);
    if (!body.success) return res.status(400).json({ message: "Invalid request body", details: body.error.flatten() });

    const inv = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .limit(1);
    if (inv.length === 0) return res.status(404).json({ message: "Invoice not found" });

    const current = inv[0].status;
    const next = body.data.status;

    const allowed =
      current === "draft" ? next === "sent" || next === "draft" : current === "sent" ? next === "paid" || next === "sent" : next === "paid";

    if (!allowed) return res.status(409).json({ message: "Invalid status transition" });

    const updated = await db
      .update(invoices)
      .set({ status: next })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();

    return res.json({ invoice: updated[0] });
  });

  router.delete("/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = normalizeId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const inv = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .limit(1);
    if (inv.length === 0) return res.status(404).json({ message: "Invoice not found" });
    if (inv[0].status !== "draft") return res.status(409).json({ message: "Only draft invoices can be deleted" });

    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, inv[0].id));
    await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));

    return res.status(204).end();
  });

  app.use("/api/invoices", router);
}

