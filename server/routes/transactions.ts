import type { Express, Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { and, eq, gte, ilike, lte } from "drizzle-orm";
import { db } from "../db";
import { transactions } from "../../shared/schema";
import { requireAuth } from "../middleware/requireAuth";

const createTransactionSchema = z.object({
  amount: z.coerce.number().finite(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1).max(200),
  description: z.string().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  date: z.coerce.date(),
  customerId: z.string().uuid().optional().nullable(),
});
const updateTransactionSchema = createTransactionSchema;

function getUserId(req: Request): string | undefined {
  const userId = (req as any).user?.id;
  return typeof userId === "string" ? userId : undefined;
}

function normalizeId(idParam: string | string[] | undefined): string | undefined {
  if (!idParam) return undefined;
  return Array.isArray(idParam) ? idParam[0] : idParam;
}

function toISODate(d: Date) {
  // Keep the date portion only (server stores `date`, not timestamp).
  return d.toISOString().slice(0, 10);
}

export function registerTransactionRoutes(app: Express) {
  const router = Router();

  router.get("/", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const typeRaw = typeof req.query.type === "string" ? req.query.type : undefined;
    const type: "income" | "expense" | undefined =
      typeRaw === "income" || typeRaw === "expense" ? typeRaw : undefined;

    const categoryRaw = typeof req.query.category === "string" ? req.query.category : undefined;
    const category = categoryRaw && categoryRaw.length > 0 ? categoryRaw : undefined;

    const customerIdRaw = typeof req.query.customerId === "string" ? req.query.customerId : undefined;
    const customerId = customerIdRaw && customerIdRaw.length > 0 ? customerIdRaw : undefined;

    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;

    let where: any = eq(transactions.userId, userId);

    if (type) {
      // Drizzle's `eq()` can return `SQL | undefined` when value types are too loose.
      // Explicitly narrowing `type` avoids that.
      where = and(where, eq(transactions.type, type));
    }
    if (category) where = and(where, ilike(transactions.category, `%${category}%`));
    if (customerId) where = and(where, eq(transactions.customerId, customerId));
    if (from) where = and(where, gte(transactions.date, from));
    if (to) where = and(where, lte(transactions.date, to));

    const rows = await db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(transactions.date)
      .limit(200);

    const items = rows.map((r) => ({
      ...r,
      amount: Number(r.amount as any),
      date: typeof r.date === "string" ? r.date : (r.date as any),
    }));

    return res.json({ items });
  });

  router.post("/", requireAuth, async (req, res) => {
    const body = createTransactionSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ message: "Invalid request body", details: body.error.flatten() });
    }

    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const inserted = await db
      .insert(transactions)
      .values({
        userId,
        amount: body.data.amount.toFixed(2),
        type: body.data.type as any,
        category: body.data.category,
        description: body.data.description ?? null,
        date: toISODate(body.data.date),
        customerId: body.data.customerId ?? null,
      } as any)
      .returning();

    const t = inserted[0];
    return res.status(201).json({
      transaction: {
        ...t,
        amount: Number(t.amount as any),
        date: typeof t.date === "string" ? t.date : (t.date as any),
      },
    });
  });

  router.get("/categories", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    // Simple approach: fetch distinct categories (MVP).
    const rows = await db
      .selectDistinct({ category: transactions.category })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    return res.json({ categories: rows.map((r) => r.category).filter((c): c is string => typeof c === "string") });
  });

  router.get("/summary", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;

    let where: any = eq(transactions.userId, userId);
    if (from) where = and(where, gte(transactions.date, from));
    if (to) where = and(where, lte(transactions.date, to));

    // MVP: compute totals in application code to avoid raw SQL typing complexity.
    const rows = await db
      .select({ type: transactions.type, amount: transactions.amount })
      .from(transactions)
      .where(where);

    let income = 0;
    let expense = 0;
    for (const r of rows) {
      const amt = Number(r.amount as any);
      if (r.type === "income") income += amt;
      else if (r.type === "expense") expense += amt;
    }

    return res.json({ income, expense });
  });

  // NOTE: `/:id` routes must come after fixed routes like `/summary` and `/categories`,
  // otherwise "summary" gets treated as an `id` parameter.
  router.get("/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = normalizeId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const rows = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    if (rows.length === 0) return res.status(404).json({ message: "Transaction not found" });
    const t = rows[0];
    return res.json({ transaction: { ...t, amount: Number(t.amount as any), date: t.date } });
  });

  router.put("/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = normalizeId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const body = updateTransactionSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ message: "Invalid request body", details: body.error.flatten() });
    }

    const updated = await db
      .update(transactions)
      .set({
        amount: body.data.amount.toFixed(2),
        type: body.data.type as any,
        category: body.data.category,
        description: body.data.description ?? null,
        date: toISODate(body.data.date),
        customerId: body.data.customerId ?? null,
      })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    if (updated.length === 0) return res.status(404).json({ message: "Transaction not found" });
    const t = updated[0];
    return res.json({ transaction: { ...t, amount: Number(t.amount as any), date: t.date } });
  });

  router.delete("/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = normalizeId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const deleted = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    if (deleted.length === 0) return res.status(404).json({ message: "Transaction not found" });
    return res.status(204).end();
  });

  app.use("/api/transactions", router);
}

