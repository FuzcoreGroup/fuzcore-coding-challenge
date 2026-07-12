import { Response } from "express";
import { db } from "../db";
import { customers } from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth";

function parsePagination(page?: string, pageLength?: string) {
  const p = Number(page || "1");
  const pl = Number(pageLength || "10");
  return {
    page: Number.isNaN(p) || p < 1 ? 1 : p,
    pageLength: Number.isNaN(pl) || pl < 1 ? 10 : pl,
    returnAll: !pageLength || pageLength === "null",
  };
}

export async function getCustomers(req: AuthRequest, res: Response) {
  const { page, pageLength, returnAll } = parsePagination(
    req.query.page as string,
    req.query.pageLength as string,
  );

  const totalData = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(customers)
    .where(eq(customers.userId, req.user!.userId));

  const total = Number(totalData[0]?.count || 0);
  const pageSize = returnAll ? total : pageLength;
  const totalPages =
    pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  let q: any = db
    .select()
    .from(customers)
    .where(eq(customers.userId, req.user!.userId));

  if (!returnAll) {
    q = q.limit(pageLength).offset((page - 1) * pageLength);
  }

  const rows = await q;
  return res.json({
    page: returnAll ? 1 : page,
    pageLength: pageSize,
    totalData: total,
    totalPages,
    data: rows,
  });
}

export async function createCustomer(req: AuthRequest, res: Response) {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "name is required" });
  }

  const inserted = await db
    .insert(customers)
    .values({ userId: req.user!.userId, name })
    .returning();

  return res.status(201).json(inserted[0]);
}

export async function updateCustomer(req: AuthRequest, res: Response) {
  const id = String(req.params.id);
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "name is required" });
  }

  const updated = await db
    .update(customers)
    .set({ name })
    .where(and(eq(customers.id, id), eq(customers.userId, req.user!.userId)))
    .returning();

  if (!updated.length) {
    return res.status(404).json({ message: "Customer not found" });
  }

  return res.json(updated[0]);
}

export async function deleteCustomer(req: AuthRequest, res: Response) {
  const id = String(req.params.id);

  const deleted = await db
    .delete(customers)
    .where(and(eq(customers.id, id), eq(customers.userId, req.user!.userId)))
    .returning();

  if (!deleted.length) {
    return res.status(404).json({ message: "Customer not found" });
  }

  return res.status(204).json({});
}
