import { Response } from "express";
import { db } from "../db";
import { category } from "../../shared/schema";
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

export async function getCategories(req: AuthRequest, res: Response) {
  const { page, pageLength, returnAll } = parsePagination(
    req.query.page as string,
    req.query.pageLength as string,
  );

  const totalDataQuery = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(category)
    .where(eq(category.userId, req.user!.userId));

  const total = Number(totalDataQuery[0]?.count || 0);
  const pageSize = returnAll ? total : pageLength;
  const totalPages =
    pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  let q: any = db
    .select()
    .from(category)
    .where(eq(category.userId, req.user!.userId));

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

export async function createCategory(req: AuthRequest, res: Response) {
  const { type, name } = req.body;

  if (!type || typeof type !== "string" || !name || typeof name !== "string") {
    return res.status(400).json({ message: "type and name are required" });
  }

  const inserted = await db
    .insert(category)
    .values({ userId: req.user!.userId, type, name })
    .returning();

  return res.status(201).json(inserted[0]);
}

export async function updateCategory(req: AuthRequest, res: Response) {
  const id = String(req.params.id);
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "name is required" });
  }

  const updated = await db
    .update(category)
    .set({ name })
    .where(and(eq(category.id, id), eq(category.userId, req.user!.userId)))
    .returning();

  if (!updated.length) {
    return res.status(404).json({ message: "Category not found" });
  }

  return res.json(updated[0]);
}

export async function deleteCategory(req: AuthRequest, res: Response) {
  const id = String(req.params.id);

  const deleted = await db
    .delete(category)
    .where(and(eq(category.id, id), eq(category.userId, req.user!.userId)))
    .returning();

  if (!deleted.length) {
    return res.status(404).json({ message: "Category not found" });
  }

  return res.status(204).json({});
}
