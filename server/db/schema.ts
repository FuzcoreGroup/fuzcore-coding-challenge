import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Helper for UUID generation
const uuid = () => crypto.randomUUID();

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(uuid),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Categories table
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(uuid),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'income' or 'expense'
  description: text('description'),
  color: text('color').default('#2d60ff'),
  icon: text('icon').default('tag'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Customers table
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().$defaultFn(uuid),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  company: text('company'),
  taxId: text('tax_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Transactions table – amount now a number
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(uuid),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  amount: real('amount').notNull(),                // changed from text to real
  type: text('type').notNull(),                    // 'income' or 'expense'
  description: text('description'),
  date: integer('date', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  receipt: text('receipt'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Invoices table – numeric fields already partly real, ensure subtotal, tax, discount are real
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey().$defaultFn(uuid),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  status: text('status').notNull().default('draft'),
  totalAmount: real('total_amount').notNull(),
  subtotal: real('subtotal'),                     // changed from text to real
  tax: real('tax'),                               // changed from text to real
  discount: real('discount'),                     // changed from text to real
  notes: text('notes'),
  terms: text('terms'),
  issuedDate: integer('issued_date', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  paidDate: integer('paid_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Invoice items table – quantity, price, total changed to real
export const invoiceItems = sqliteTable('invoice_items', {
  id: text('id').primaryKey().$defaultFn(uuid),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),           // changed from text to real
  price: real('price').notNull(),                 // changed from text to real
  total: real('total').notNull(),                 // changed from text to real
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;