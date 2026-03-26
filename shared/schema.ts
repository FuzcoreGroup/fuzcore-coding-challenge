import {
  pgTable,
  uuid,
  text,
  varchar,
  json,
  foreignKey,
  serial,
  integer,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const counter = pgTable("counter", {
  id: serial("id").primaryKey(),
  count: integer("count").notNull().default(0),
});

// Users table
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Category table
export const category = pgTable("category", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transaction table
export const transaction = pgTable("transaction", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  amount: doublePrecision("amount").notNull().default(0.0),
  type: varchar("type", { length: 10 }).notNull(),
  categoryId: uuid("category_id").references(() => category.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoice table
export const invoice = pgTable("invoice", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  customerId: uuid("customer_id")
    .references(() => customers.id)
    .notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  items: json("items").notNull(), // Array of strings stored as JSON
  amount: doublePrecision("amount").notNull().default(0.0),
  paymentUrl: text("payment_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
