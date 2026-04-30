import {
  pgTable,
  serial,
  integer,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const counter = pgTable("counter", {
  id: serial("id").primaryKey(),
  count: integer("count").notNull().default(0),
});

// ── Users ────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  passwordHash: z.string(),
  name: z.string().optional(),
}).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// ── Customers ─────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers, {
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
}).omit({ id: true, userId: true, createdAt: true });

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

// ── Categories ────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
});

export const insertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1, "Name is required"),

  type: z.enum(["income", "expense"]),
}).omit({ id: true, userId: true });

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// ── Transactions ──────────────────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  amount: text("amount").notNull(), // Store as string (numeric) to avoid precision loss in JS
  type: text("type").notNull(), // 'income' | 'expense'
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  invoiceId: uuid("invoice_id").references(() => invoices.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  date: text("date").notNull(), // Store ISO date string
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: z.string().min(1, "Amount is required"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  invoiceId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  date: z.string(),
}).omit({ id: true, userId: true, createdAt: true });

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// ── Invoices ──────────────────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  invoiceNumber: text("invoice_number").notNull(), // e.g. INV-0001
  status: text("status").default("draft").notNull(), // 'draft' | 'sent' | 'paid'
  paymentLinkUrl: text("payment_link_url"),
  paymentLinkAmount: text("payment_link_amount"),
  issuedDate: text("issued_date").notNull(), // ISO string date
  dueDate: text("due_date"), // ISO string date
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices, {
  customerId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().optional(), // Server will auto-generate if missing
  status: z.enum(["draft", "sent", "paid"]).optional(),
  paymentLinkUrl: z.string().url().optional().nullable(),
  issuedDate: z.string(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).omit({ id: true, userId: true, createdAt: true });

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// ── Invoice Items ─────────────────────────────────────────────────────
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").notNull(),
  quantity: text("quantity").notNull().default("1"), // string for numeric
  unitPrice: text("unit_price").notNull(), // string for numeric
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems, {
  description: z.string().min(1, "Description is required"),
  quantity: z.string().min(1, "Quantity is required"),
  unitPrice: z.string().min(1, "Unit price is required"),
}).omit({ id: true, invoiceId: true });

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
