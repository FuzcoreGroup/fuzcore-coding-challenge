import { Response } from "express";
import { db } from "../db";
import { transaction as transactionTable, category } from "../../shared/schema";
import { eq, like, and, sql } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth";
import { selectCategoryFromDescription } from "../clients/gemini";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

function parsePagination(page?: string, pageLength?: string) {
  const p = Number(page || "1");
  const pl = Number(pageLength || "10");
  return {
    page: Number.isNaN(p) || p < 1 ? 1 : p,
    pageLength: Number.isNaN(pl) || pl < 1 ? 10 : pl,
  };
}

export async function getTransactions(req: AuthRequest, res: Response) {
  const { page, pageLength } = parsePagination(
    req.query.page as string,
    req.query.pageLength as string,
  );
  const type = req.query.type as string | undefined;
  const categoryFilter = req.query.category as string | undefined;

  let qBase: any = db
    .select({
      id: transactionTable.id,
      type: transactionTable.type,
      categoryId: transactionTable.categoryId,
      categoryName: category.name,
      amount: transactionTable.amount,
      description: transactionTable.description,
      createdAt: transactionTable.createdAt,
    })
    .from(transactionTable)
    .leftJoin(
      category,
      and(
        eq(transactionTable.categoryId, category.id),
        eq(category.userId, req.user!.userId),
      ),
    )
    .where(eq(transactionTable.userId, req.user!.userId));

  if (type) {
    qBase = qBase.where(eq(transactionTable.type, type));
  }

  if (categoryFilter) {
    qBase = qBase.where(eq(transactionTable.categoryId, categoryFilter));
  }

  let qCount: any = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactionTable)
    .where(eq(transactionTable.userId, req.user!.userId));

  if (type) {
    qCount = qCount.where(eq(transactionTable.type, type));
  }

  if (categoryFilter) {
    qCount = qCount.where(eq(transactionTable.categoryId, categoryFilter));
  }

  const totalDataQuery = await qCount;
  const total = Number(totalDataQuery[0]?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageLength));

  const rows = await qBase.limit(pageLength).offset((page - 1) * pageLength);

  return res.json({
    page,
    pageLength,
    totalData: total,
    totalPages,
    data: rows,
  });
}

export async function createTransaction(req: AuthRequest, res: Response) {
  const { amount, type, categoryId, description } = req.body;

  if (typeof amount !== "number" || !type || typeof type !== "string") {
    return res.status(400).json({ message: "amount and type are required" });
  }

  const inserted = await db
    .insert(transactionTable)
    .values({
      userId: req.user!.userId,
      amount,
      type,
      categoryId: categoryId || null,
      description: description || null,
    })
    .returning();

  const createdTransaction = await db
    .select({
      id: transactionTable.id,
      type: transactionTable.type,
      categoryId: transactionTable.categoryId,
      categoryName: category.name,
      amount: transactionTable.amount,
      description: transactionTable.description,
      createdAt: transactionTable.createdAt,
    })
    .from(transactionTable)
    .leftJoin(
      category,
      and(
        eq(transactionTable.categoryId, category.id),
        eq(category.userId, req.user!.userId),
      ),
    )
    .where(
      and(
        eq(transactionTable.id, inserted[0].id),
        eq(transactionTable.userId, req.user!.userId),
      ),
    );

  return res.status(201).json(createdTransaction[0]);
}

export async function selectCategory(req: AuthRequest, res: Response) {
  const { description } = req.body;

  if (!description || typeof description !== "string") {
    return res.status(400).json({ message: "description is required" });
  }

  // Get all categories for the user
  const userCategories = await db
    .select()
    .from(category)
    .where(eq(category.userId, req.user!.userId));

  if (!userCategories.length) {
    return res.status(404).json({ message: "No categories found for user" });
  }

  const categoryNames = userCategories.map((cat) => cat.name);

  // Use AI to select category
  const selectedCategoryName = await selectCategoryFromDescription(
    description,
    categoryNames,
  );

  if (!selectedCategoryName) {
    return res.status(500).json({ message: "Failed to select category" });
  }

  // Find the full category object
  const selectedCategory = userCategories.find(
    (cat) => cat.name === selectedCategoryName,
  );

  if (!selectedCategory) {
    return res.status(500).json({ message: "Selected category not found" });
  }

  return res.json(selectedCategory);
}

export async function importTransactions(req: AuthRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: "CSV file is required" });
  }

  const results: any[] = [];
  const errors: string[] = [];

  // Parse CSV
  const stream = Readable.from(req.file.buffer);
  stream
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        // Validate headers
        if (results.length === 0) {
          return res.status(400).json({ message: "CSV file is empty" });
        }

        const firstRow = results[0];
        const requiredHeaders = ["category", "amount", "type", "description"];

        for (const header of requiredHeaders) {
          if (!(header in firstRow)) {
            return res.status(400).json({
              message: `Missing required header: ${header}. Required headers: ${requiredHeaders.join(", ")}`,
            });
          }
        }

        // Process each row
        const transactions = [];
        for (let i = 0; i < results.length; i++) {
          const row = results[i];

          try {
            const categoryName = row.category?.trim();
            const amount = parseFloat(row.amount);
            const type = row.type?.trim();
            const description = row.description?.trim();

            // Validate data
            if (!categoryName || isNaN(amount) || !type || !description) {
              errors.push(`Row ${i + 1}: Missing or invalid data`);
              continue;
            }

            if (!["income", "expense"].includes(type.toLowerCase())) {
              errors.push(`Row ${i + 1}: Type must be 'income' or 'expense'`);
              continue;
            }

            // Find category by name for this user
            const categoryRecord = await db
              .select()
              .from(category)
              .where(
                and(
                  eq(category.userId, req.user!.userId),
                  eq(category.id, categoryName),
                ),
              );

            if (!categoryRecord.length) {
              errors.push(
                `Row ${i + 1}: Category '${categoryName}' not found for user`,
              );
              continue;
            }

            transactions.push({
              userId: req.user!.userId,
              amount,
              type: type.toLowerCase(),
              categoryId: categoryRecord[0].id,
              description,
            });
          } catch (error) {
            errors.push(`Row ${i + 1}: Error processing row - ${error}`);
          }
        }

        // Insert valid transactions
        if (transactions.length > 0) {
          await db.insert(transactionTable).values(transactions);
        }

        return res.json({
          message: `Imported ${transactions.length} transactions successfully`,
          errors: errors.length > 0 ? errors : undefined,
          totalRows: results.length,
          successfulImports: transactions.length,
          failedImports: errors.length,
        });
      } catch (error) {
        console.error("Import error:", error);
        return res.status(500).json({ message: "Import failed" });
      }
    })
    .on("error", (error) => {
      console.error("CSV parsing error:", error);
      return res.status(400).json({ message: "Invalid CSV file" });
    });
}
