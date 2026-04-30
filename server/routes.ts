import type { Express } from "express";
import type { Server } from "http";
import passport from "passport";
import { db } from "./db";
import {
  counter,
  users,
  customers,
  categories,
  transactions,
  invoices,
  invoiceItems,
  type User,
} from "../shared/schema";
import { and, eq, desc } from "drizzle-orm";
import { setupAuth, hashPassword, requireAuth } from "./auth";
import Anthropic from "@anthropic-ai/sdk";
import PDFDocument from "pdfkit";
import axios from "axios";
import multer from "multer";
import Papa from "papaparse";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(httpServer: Server, app: Express) {
  // ── Auth setup (must come before routes) ─────────────────────────
  setupAuth(app);

  // ── Auth routes ──────────────────────────────────────────────────
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      // Check if user already exists
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);

      if (existing) {
        return res
          .status(400)
          .json({ error: "An account with this email already exists" });
      }

      const passwordHash = await hashPassword(password);

      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase().trim(),
          passwordHash,
          name: name || null,
        })
        .returning();

      // Seed default categories
      const defaultCategories = [
        ...["Salary", "Sales", "Freelance", "Other Income"].map((c) => ({
          userId: newUser.id,
          name: c,
          type: "income",
        })),
        ...["Rent", "Utilities", "Food", "Travel", "Other Expense"].map(
          (c) => ({ userId: newUser.id, name: c, type: "expense" }),
        ),
      ];
      await db.insert(categories).values(defaultCategories);

      // Auto-login after registration
      req.login(newUser, (err) => {
        if (err) return next(err);
        const { passwordHash: _, ...safeUser } = newUser;
        return res.status(201).json(safeUser);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate(
      "local",
      (err: Error | null, user: User | false, info: { message: string }) => {
        if (err) return next(err);
        if (!user) {
          return res
            .status(401)
            .json({ error: info?.message || "Invalid credentials" });
        }
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          const { passwordHash: _, ...safeUser } = user;
          return res.json(safeUser);
        });
      },
    )(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { passwordHash: _, ...safeUser } = req.user as User;
    return res.json(safeUser);
  });

  // ── Dashboard routes ─────────────────────────────────────────────
  app.get("/api/dashboard/summary", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;

      // 1. Transactions for Revenue, Expenses, and Recent
      const userTransactions = await db
        .select({
          transaction: transactions,
          categoryName: categories.name,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date), desc(transactions.createdAt));

      const totalRevenue = userTransactions
        .filter((t) => t.transaction.type === "income")
        .reduce((sum, t) => sum + Number(t.transaction.amount), 0);

      const totalExpenses = userTransactions
        .filter((t) => t.transaction.type === "expense")
        .reduce((sum, t) => sum + Number(t.transaction.amount), 0);

      const netProfit = totalRevenue - totalExpenses;

      const recentTransactions = userTransactions.slice(0, 5).map((t) => ({
        ...t.transaction,
        categoryName: t.categoryName || "Uncategorized",
      }));

      // 2. Invoices for Outstanding totals and Status counts
      const userInvoices = await db
        .select({
          invoice: invoices,
          items: invoiceItems,
        })
        .from(invoices)
        .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
        .where(eq(invoices.userId, userId));

      let outstandingInvoices = 0;
      const invoiceStatusCounts = { draft: 0, sent: 0, paid: 0 };

      // Group by invoice id to calculate totals and counts properly
      const invoiceGroups: Record<string, { status: string; total: number }> =
        {};

      for (const row of userInvoices) {
        if (!invoiceGroups[row.invoice.id]) {
          invoiceGroups[row.invoice.id] = {
            status: row.invoice.status,
            total: 0,
          };
        }
        if (row.items) {
          invoiceGroups[row.invoice.id].total +=
            Number(row.items.quantity) * Number(row.items.unitPrice);
        }
      }

      for (const invId in invoiceGroups) {
        const inv = invoiceGroups[invId];
        if (inv.status === "draft") invoiceStatusCounts.draft++;
        if (inv.status === "sent") invoiceStatusCounts.sent++;
        if (inv.status === "paid") invoiceStatusCounts.paid++;

        if (inv.status === "draft" || inv.status === "sent") {
          outstandingInvoices += inv.total;
        }
      }

      return res.json({
        totalRevenue: totalRevenue.toString(),
        totalExpenses: totalExpenses.toString(),
        netProfit: netProfit.toString(),
        outstandingInvoices: outstandingInvoices.toString(),
        recentTransactions,
        invoiceStatusCounts,
      });
    } catch (err) {
      next(err);
    }
  });

  // ── Customer routes ──────────────────────────────────────────────
  app.get("/api/customers", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const rows = await db
        .select()
        .from(customers)
        .where(eq(customers.userId, userId))
        .orderBy(customers.name);
      return res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/customers", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { name, email, phone, address } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: "Name is required" });
      }

      const [newCustomer] = await db
        .insert(customers)
        .values({
          userId,
          name: name.trim(),
          email: email || null,
          phone: phone || null,
          address: address || null,
        })
        .returning();

      return res.status(201).json(newCustomer);
    } catch (err) {
      next(err);
    }
  });

  app.put("/api/customers/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;
      const { name, email, phone, address } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: "Name is required" });
      }

      const [updated] = await db
        .update(customers)
        .set({
          name: name.trim(),
          email: email || null,
          phone: phone || null,
          address: address || null,
        })
        .where(
          and(eq(customers.id, id as string), eq(customers.userId, userId)),
        )
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Customer not found" });
      }

      return res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/customers/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;

      const [deleted] = await db
        .delete(customers)
        .where(
          and(eq(customers.id, id as string), eq(customers.userId, userId)),
        )
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }

      return res.json({ message: "Customer deleted" });
    } catch (err) {
      next(err);
    }
  });

  // ── Category routes ──────────────────────────────────────────────
  app.get("/api/categories", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const rows = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId))
        .orderBy(categories.name);
      return res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/categories", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { name, type } = req.body;

      if (!name?.trim() || !["income", "expense"].includes(type)) {
        return res.status(400).json({ error: "Invalid category data" });
      }

      const [newCategory] = await db
        .insert(categories)
        .values({ userId, name: name.trim(), type })
        .returning();

      return res.status(201).json(newCategory);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;

      const relatedTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.categoryId, id as string),
            eq(transactions.userId, userId),
          ),
        );

      if (relatedTransactions.length > 0) {
        return res.status(400).json({
          error: `Cannot delete — ${relatedTransactions.length} transactions use this category`,
        });
      }

      const [deleted] = await db
        .delete(categories)
        .where(
          and(eq(categories.id, id as string), eq(categories.userId, userId)),
        )
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }

      return res.json({ message: "Category deleted" });
    } catch (err) {
      next(err);
    }
  });

  // ── AI routes ────────────────────────────────────────────────────
  app.post("/api/ai/suggest-category", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { description, type } = req.body;

      if (!description || !type) {
        return res
          .status(400)
          .json({ error: "Description and type are required" });
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ error: "Anthropic API key is not configured" });
      }

      // Fetch user categories filtered by type
      const userCategories = await db
        .select()
        .from(categories)
        .where(and(eq(categories.userId, userId), eq(categories.type, type)));

      if (userCategories.length === 0) {
        return res.json({ suggestedCategory: null });
      }

      const categoryNames = userCategories.map((c) => c.name).join(", ");
      const prompt = `You are a bookkeeping assistant. Given this transaction description and type, suggest the most appropriate category from this list: [${categoryNames}]. Respond with only the category name, nothing else.\n\nDescription: ${description}\nType: ${type}`;

      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 50,
        messages: [{ role: "user", content: prompt }],
      });
      const responseText = (message.content[0] as { text: string }).text.trim();

      // Ensure the suggested category actually exists in the user's list
      const matchedCategory = userCategories.find(
        (c) => c.name.toLowerCase() === responseText.toLowerCase(),
      );

      return res.json({
        suggestedCategoryId: matchedCategory ? matchedCategory.id : null,
        suggestedCategoryName: matchedCategory ? matchedCategory.name : null,
      });
    } catch (err) {
      console.error("AI Category Suggestion Error:", err);
      // Return 200 with null so it doesn't break the UI
      return res.json({ suggestedCategory: null });
    }
  });

  // ── Transaction routes ───────────────────────────────────────────
  app.delete("/api/transactions", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      await db.delete(transactions).where(eq(transactions.userId, userId));
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/transactions", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { type, categoryId } = req.query;

      let conditions = [eq(transactions.userId, userId)];

      if (type && typeof type === "string") {
        conditions.push(eq(transactions.type, type));
      }
      if (categoryId && typeof categoryId === "string") {
        conditions.push(eq(transactions.categoryId, categoryId));
      }

      const rows = await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.date), desc(transactions.createdAt));

      return res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/transactions", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const {
        amount,
        type,
        categoryId,
        customerId,
        invoiceId,
        description,
        date,
      } = req.body;

      if (
        !amount ||
        isNaN(Number(amount)) ||
        !["income", "expense"].includes(type) ||
        !date
      ) {
        return res.status(400).json({ error: "Invalid transaction data" });
      }

      const [newTx] = await db
        .insert(transactions)
        .values({
          userId,
          amount: amount.toString(),
          type,
          categoryId: categoryId || null,
          customerId: customerId || null,
          invoiceId: invoiceId || null,
          description: description || null,
          date,
        })
        .returning();

      return res.status(201).json(newTx);
    } catch (err) {
      next(err);
    }
  });

  app.put("/api/transactions/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;
      const {
        amount,
        type,
        categoryId,
        customerId,
        invoiceId,
        description,
        date,
      } = req.body;

      if (
        !amount ||
        isNaN(Number(amount)) ||
        !["income", "expense"].includes(type) ||
        !date
      ) {
        return res.status(400).json({ error: "Invalid transaction data" });
      }

      const [updatedTx] = await db
        .update(transactions)
        .set({
          amount: amount.toString(),
          type,
          categoryId: categoryId || null,
          customerId: customerId || null,
          invoiceId: invoiceId || null,
          description: description || null,
          date,
        })
        .where(
          and(
            eq(transactions.id, id as string),
            eq(transactions.userId, userId),
          ),
        )
        .returning();

      if (!updatedTx) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      return res.json(updatedTx);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/transactions/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;

      const [deleted] = await db
        .delete(transactions)
        .where(
          and(
            eq(transactions.id, id as string),
            eq(transactions.userId, userId),
          ),
        )
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      return res.json({ message: "Transaction deleted" });
    } catch (err) {
      next(err);
    }
  });

  // ── Invoice routes ───────────────────────────────────────────────
  app.get("/api/invoices", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;

      const rows = await db
        .select({
          invoice: invoices,
          customerName: customers.name,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(eq(invoices.userId, userId))
        .orderBy(desc(invoices.issuedDate), desc(invoices.createdAt));

      // We need to fetch items to calculate total, ideally in a single query but
      // for simplicity we can just fetch all items for these invoices
      if (rows.length === 0) return res.json([]);

      const invoiceIds = rows.map((r) => r.invoice.id);

      // Could be large, but fine for small business
      const allItems = await db.select().from(invoiceItems); // In a real app we'd filter by invoiceIds

      const result = rows.map((r) => {
        const items = allItems.filter((i) => i.invoiceId === r.invoice.id);
        const total = items.reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
          0,
        );

        return {
          ...r.invoice,
          customerName: r.customerName,
          total: total.toString(),
        };
      });

      return res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/invoices/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id as string), eq(invoices.userId, userId)));

      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      let customer = null;
      if (invoice.customerId) {
        const [cust] = await db
          .select()
          .from(customers)
          .where(eq(customers.id, invoice.customerId));
        customer = cust;
      }

      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoice.id));

      return res.json({
        ...invoice,
        customer,
        items,
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/invoices/:id/pdf", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id as string), eq(invoices.userId, userId)));

      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      let customer = null;
      if (invoice.customerId) {
        const [cust] = await db
          .select()
          .from(customers)
          .where(eq(customers.id, invoice.customerId));
        customer = cust;
      }

      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoice.id));

      const doc = new PDFDocument({ margin: 50 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${invoice.invoiceNumber}.pdf`,
      );

      doc.pipe(res);

      // Header
      doc.fontSize(20).text("INVOICE", { align: "right" });
      doc
        .fontSize(10)
        .text(`Invoice Number: ${invoice.invoiceNumber}`, { align: "right" });
      doc.text(
        `Issued Date: ${new Date(invoice.issuedDate).toLocaleDateString()}`,
        { align: "right" },
      );
      if (invoice.dueDate) {
        doc.text(
          `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
          { align: "right" },
        );
      }
      doc.text(`Status: ${invoice.status.toUpperCase()}`, { align: "right" });
      doc.moveDown();

      // Customer Info
      if (customer) {
        doc.fontSize(12).text("Billed To:");
        doc.fontSize(10).text(customer.name);
        if (customer.email) doc.text(customer.email);
        if (customer.address) doc.text(customer.address);
      }
      doc.moveDown(2);

      // Table Header
      let y = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Description", 50, y);
      doc.text("Qty", 300, y, { width: 50, align: "right" });
      doc.text("Unit Price", 350, y, { width: 80, align: "right" });
      doc.text("Total", 430, y, { width: 80, align: "right" });

      doc
        .moveTo(50, y + 15)
        .lineTo(510, y + 15)
        .stroke();
      doc.font("Helvetica");
      y += 20;

      // Table Rows
      let grandTotal = 0;
      for (const item of items) {
        const qty = Number(item.quantity);
        const price = Number(item.unitPrice);
        const lineTotal = qty * price;
        grandTotal += lineTotal;

        doc.text(item.description, 50, y, { width: 240 });
        doc.text(qty.toString(), 300, y, { width: 50, align: "right" });
        doc.text(`$${price.toFixed(2)}`, 350, y, { width: 80, align: "right" });
        doc.text(`$${lineTotal.toFixed(2)}`, 430, y, {
          width: 80,
          align: "right",
        });
        y += 20;
      }

      doc
        .moveTo(50, y + 5)
        .lineTo(510, y + 5)
        .stroke();
      y += 15;

      // Grand Total
      doc.font("Helvetica-Bold");
      doc.text("Grand Total:", 350, y, { width: 80, align: "right" });
      doc.text(`$${grandTotal.toFixed(2)}`, 430, y, {
        width: 80,
        align: "right",
      });

      // Notes
      if (invoice.notes) {
        doc.moveDown(3);
        doc.font("Helvetica-Bold").text("Notes:");
        doc.font("Helvetica").text(invoice.notes);
      }

      doc.end();
    } catch (err) {
      console.error("PDF Generation Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { customerId, issuedDate, dueDate, notes, items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "At least one item is required" });
      }

      // Generate invoiceNumber (e.g. INV-0001)
      const existingInvoices = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(eq(invoices.userId, userId));

      const count = existingInvoices.length + 1;
      const invoiceNumber = `INV-${count.toString().padStart(4, "0")}`;

      // Insert invoice
      const [newInvoice] = await db
        .insert(invoices)
        .values({
          userId,
          customerId: customerId || null,
          invoiceNumber,
          issuedDate: issuedDate || new Date().toISOString().split("T")[0],
          dueDate: dueDate || null,
          notes: notes || null,
          status: "draft",
        })
        .returning();

      // Insert items
      const itemsToInsert = items.map((item) => ({
        invoiceId: newInvoice.id,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
      }));

      await db.insert(invoiceItems).values(itemsToInsert);

      return res.status(201).json(newInvoice);
    } catch (err) {
      next(err);
    }
  });

  app.put("/api/invoices/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;
      const { status, customerId, issuedDate, dueDate, notes, items } =
        req.body;

      // Get original invoice to check previous status
      const [original] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id as string), eq(invoices.userId, userId)));

      if (!original)
        return res.status(404).json({ error: "Invoice not found" });

      let updated;

      // Check if this is a full update or just a status update
      if (items) {
        if (!Array.isArray(items) || items.length === 0) {
          return res
            .status(400)
            .json({ error: "At least one item is required" });
        }

        // Update invoice
        const [invoiceResult] = await db
          .update(invoices)
          .set({
            customerId: customerId || null,
            issuedDate: issuedDate || new Date().toISOString().split("T")[0],
            dueDate: dueDate || null,
            notes: notes || null,
            status: status || original.status,
          })
          .where(
            and(eq(invoices.id, id as string), eq(invoices.userId, userId)),
          )
          .returning();

        if (!invoiceResult)
          return res.status(404).json({ error: "Invoice not found" });

        updated = invoiceResult;

        // Update items: delete old ones and insert new ones
        await db
          .delete(invoiceItems)
          .where(eq(invoiceItems.invoiceId, id as string));

        const itemsToInsert = items.map((item) => ({
          invoiceId: id as string,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
        }));

        await db.insert(invoiceItems).values(itemsToInsert);
      } else if (status) {
        if (!["draft", "sent", "paid"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }

        const [invoiceResult] = await db
          .update(invoices)
          .set({ status })
          .where(
            and(eq(invoices.id, id as string), eq(invoices.userId, userId)),
          )
          .returning();

        if (!invoiceResult)
          return res.status(404).json({ error: "Invoice not found" });

        updated = invoiceResult;
      } else {
        return res.status(400).json({ error: "No data provided for update" });
      }

      // If status changed to paid, create a transaction
      if (updated.status === "paid" && original.status !== "paid") {
        const itemsList = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoiceId, id as string));

        const total = itemsList.reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
          0,
        );

        // Find a category for income
        const userCategories = await db
          .select()
          .from(categories)
          .where(
            and(eq(categories.userId, userId), eq(categories.type, "income")),
          );

        // Try to find "Sales" or use the first income category
        const category =
          userCategories.find((c) => c.name === "Sales") || userCategories[0];

        await db.insert(transactions).values({
          userId,
          amount: total.toString(),
          type: "income",
          categoryId: category?.id || null,
          customerId: updated.customerId,
          invoiceId: updated.id,
          description: `Payment for Invoice ${updated.invoiceNumber}`,
          date: new Date().toISOString().split("T")[0],
        });
      }

      return res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  app.post(
    "/api/invoices/:id/payment-link",
    requireAuth,
    async (req, res, next) => {
      try {
        const userId = (req.user as User).id;
        const { id } = req.params;

        const [invoice] = await db
          .select()
          .from(invoices)
          .where(
            and(eq(invoices.id, id as string), eq(invoices.userId, userId)),
          );

        if (!invoice)
          return res.status(404).json({ error: "Invoice not found" });

        if (invoice.status !== "sent") {
          return res.status(400).json({
            error: "Payment links can only be generated for 'sent' invoices",
          });
        }

        const items = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoiceId, invoice.id));

        const total = items.reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
          0,
        );
        const totalInKobo = Math.round(total * 100);

        const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
        if (!paystackSecret) {
          return res
            .status(500)
            .json({ error: "Paystack secret key is not configured" });
        }

        let customer = null;
        if (invoice.customerId) {
          const [cust] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, invoice.customerId));
          customer = cust;
        }

        const paystackRes = await axios.post(
          "https://api.paystack.co/transaction/initialize",
          {
            email: customer?.email || "customer@example.com",
            amount: totalInKobo,
            metadata: {
              invoice_number: invoice.invoiceNumber,
              invoice_id: invoice.id,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
              "Content-Type": "application/json",
            },
          },
        );

        const paymentLinkUrl = paystackRes.data?.data?.authorization_url;

        if (!paymentLinkUrl) {
          return res
            .status(500)
            .json({ error: "Failed to generate Paystack payment link" });
        }

        await db
          .update(invoices)
          .set({
            paymentLinkUrl,
            paymentLinkAmount: total.toString(),
          })
          .where(eq(invoices.id, invoice.id));

        return res.json({
          paymentLinkUrl,
          paymentLinkAmount: total.toString(),
        });
      } catch (err: any) {
        console.error("Paystack API Error:", err.response?.data || err.message);
        next(err);
      }
    },
  );

  app.post(
    "/api/transactions/import",
    requireAuth,
    upload.single("file"),
    async (req, res, next) => {
      try {
        const userId = (req.user as User).id;
        if (!req.file)
          return res.status(400).json({ error: "No file uploaded" });

        const csvData = req.file.buffer.toString("utf-8");
        const results = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
        });

        const userCategories = await db
          .select()
          .from(categories)
          .where(eq(categories.userId, userId));

        let imported = 0;
        const errors: string[] = [];

        for (const row of results.data as any[]) {
          try {
            const { date, description, amount, type, category } = row;

            if (!date || !amount || !type) {
              errors.push(
                `Missing required fields in row: ${JSON.stringify(row)}`,
              );
              continue;
            }

            if (type !== "income" && type !== "expense") {
              errors.push(
                `Invalid type "${type}" in row: ${description}. Must be "income" or "expense"`,
              );
              continue;
            }

            let categoryId = null;
            if (category) {
              const matched = userCategories.find(
                (c) =>
                  c.name.toLowerCase() === category.toLowerCase() &&
                  c.type === type,
              );
              if (matched) {
                categoryId = matched.id;
              } else {
                errors.push(
                  `Category "${category}" of type "${type}" not found for row: ${description}`,
                );
                continue;
              }
            }

            await db.insert(transactions).values({
              userId,
              amount: amount.toString(),
              type: type as "income" | "expense",
              categoryId,
              description: description || null,
              date: new Date(date).toISOString().split("T")[0],
            });
            imported++;
          } catch (err: any) {
            errors.push(`Error processing row: ${err.message}`);
          }
        }

        res.json({ imported, errors });
      } catch (err) {
        next(err);
      }
    },
  );

  app.delete("/api/invoices/:id", requireAuth, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, id as string), eq(invoices.userId, userId)));

      if (!invoice) return res.status(404).json({ error: "Invoice not found" });

      if (invoice.status !== "draft") {
        return res
          .status(400)
          .json({ error: "Can only delete draft invoices" });
      }

      await db.delete(invoices).where(eq(invoices.id, id as string));

      return res.json({ message: "Invoice deleted" });
    } catch (err) {
      next(err);
    }
  });

  // ── Counter routes (existing) ────────────────────────────────────
  app.get("/api/counter", async (_req, res) => {
    const rows = await db.select().from(counter).where(eq(counter.id, 1));
    if (rows.length === 0) {
      const inserted = await db
        .insert(counter)
        .values({ id: 1, count: 0 })
        .returning();
      return res.json({ count: inserted[0].count });
    }
    return res.json({ count: rows[0].count });
  });

  app.post("/api/counter/increment", async (_req, res) => {
    const rows = await db.select().from(counter).where(eq(counter.id, 1));
    if (rows.length === 0) {
      const inserted = await db
        .insert(counter)
        .values({ id: 1, count: 1 })
        .returning();
      return res.json({ count: inserted[0].count });
    }
    const updated = await db
      .update(counter)
      .set({ count: rows[0].count + 1 })
      .where(eq(counter.id, 1))
      .returning();
    return res.json({ count: updated[0].count });
  });
}
