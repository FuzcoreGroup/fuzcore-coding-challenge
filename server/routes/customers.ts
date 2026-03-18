import type { Express, Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "../db";
import { customers } from "../../shared/schema";
import { requireAuth } from "../middleware/requireAuth";

const createCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  phone: z.string().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  address: z.string().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});

const updateCustomerSchema = createCustomerSchema.partial();

function getUserId(req: Request): string | undefined {
  const userId = (req as any).user?.id;
  return typeof userId === "string" ? userId : undefined;
}

function normalizeId(idParam: string | string[] | undefined): string | undefined {
  if (!idParam) return undefined;
  return Array.isArray(idParam) ? idParam[0] : idParam;
}

export function registerCustomerRoutes(app: Express) {
  const router = Router();

  router.get("/", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10)) : 1;
    const pageSize = req.query.pageSize ? Math.max(1, parseInt(String(req.query.pageSize), 10)) : 20;

    const where =
      search && search.length > 0
        ? and(
            eq(customers.userId, userId!),
            or(
              ilike(customers.name, `%${search}%`),
              ilike(customers.email, `%${search}%`),
              ilike(customers.phone, `%${search}%`),
            ),
          )
        : eq(customers.userId, userId!);

    const rows = await db
      .select()
      .from(customers)
      .where(where)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .orderBy(customers.createdAt);

    return res.json({ items: rows, page, pageSize });
  });

  router.post("/", requireAuth, async (req, res) => {
    const body = createCustomerSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ message: "Invalid request body", details: body.error.flatten() });
    }
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const inserted = await db
      .insert(customers)
      .values({
        userId: userId!,
        name: body.data.name,
        email: body.data.email,
        phone: body.data.phone,
        address: body.data.address,
      })
      .returning();

    return res.status(201).json({ customer: inserted[0] });
  });

  router.get("/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = normalizeId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const rows = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.userId, userId)))
      .limit(1);
    if (rows.length === 0) return res.status(404).json({ message: "Customer not found" });
    return res.json({ customer: rows[0] });
  });

  router.put("/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = normalizeId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const body = updateCustomerSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ message: "Invalid request body", details: body.error.flatten() });
    }

    const updated = await db
      .update(customers)
      .set({
        name: body.data.name,
        email: body.data.email,
        phone: body.data.phone,
        address: body.data.address,
      })
      .where(and(eq(customers.id, id), eq(customers.userId, userId)))
      .returning();

    if (updated.length === 0) return res.status(404).json({ message: "Customer not found" });
    return res.json({ customer: updated[0] });
  });

  router.delete("/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = normalizeId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const deleted = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.userId, userId)))
      .returning();

    if (deleted.length === 0) return res.status(404).json({ message: "Customer not found" });
    return res.status(204).end();
  });

  app.use("/api/customers", router);
}

