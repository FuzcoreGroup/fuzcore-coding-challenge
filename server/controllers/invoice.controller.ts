import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { invoices, invoiceItems, customers } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

const getStringId = (id: string | string[] | undefined): string | null => {
  if (!id) return null;
  return Array.isArray(id) ? id[0] : id;
};

// Helper to generate invoice number
const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Get all invoices for authenticated user with line items and customer info
export const getInvoices = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const userInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));

    // For each invoice, fetch its line items and customer details
    const invoicesWithDetails = await Promise.all(
      userInvoices.map(async (invoice) => {
        const items = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoiceId, invoice.id));
        const customer = await db
          .select({ name: customers.name, email: customers.email })
          .from(customers)
          .where(eq(customers.id, invoice.customerId))
          .limit(1);
        return {
          ...invoice,
          customerName: customer[0]?.name || '',
          customerEmail: customer[0]?.email || '',
          lineItems: items,
          date: invoice.issuedDate,
          dueDate: invoice.dueDate,
          total: invoice.totalAmount,
          subtotal: invoice.subtotal ?? 0,
          tax: invoice.tax ?? 0,
        };
      })
    );

    res.json(invoicesWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
};

// Create a new invoice
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { customerId, status, lineItems, subtotal, tax, total, date, dueDate } = req.body;

    if (!customerId || !lineItems || !subtotal) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create invoice
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        userId,
        customerId,
        invoiceNumber: generateInvoiceNumber(),
        status: status || 'draft',
        totalAmount: total,
        subtotal,
        tax: tax || 0,
        issuedDate: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
      })
      .returning();

    // Insert line items
    for (const item of lineItems) {
      await db.insert(invoiceItems).values({
        invoiceId: newInvoice.id,
        description: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      });
    }

    // Fetch created invoice with details
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, newInvoice.id));
    const customer = await db
      .select({ name: customers.name, email: customers.email })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    res.status(201).json({
      ...newInvoice,
      customerName: customer[0]?.name || '',
      customerEmail: customer[0]?.email || '',
      lineItems: items,
      date: newInvoice.issuedDate,
      dueDate: newInvoice.dueDate,
      total: newInvoice.totalAmount,
      subtotal: newInvoice.subtotal,
      tax: newInvoice.tax,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating invoice' });
  }
};

// Update invoice (only draft allowed)
export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const paramId = getStringId(req.params.id);
    if (!paramId) return res.status(400).json({ message: 'Invalid invoice id' });

    const { customerId, lineItems, subtotal, tax, total, date, dueDate, status } = req.body;

    // Check existing invoice
    const existing = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, paramId), eq(invoices.userId, userId)))
      .limit(1);

    if (existing.length === 0) return res.status(404).json({ message: 'Invoice not found' });
    if (existing[0].status !== 'draft') {
      return res.status(400).json({ message: 'Only draft invoices can be edited' });
    }

    // Update invoice
    const updateData: any = {};
    if (customerId !== undefined) updateData.customerId = customerId;
    if (subtotal !== undefined) updateData.subtotal = subtotal;
    if (tax !== undefined) updateData.tax = tax;
    if (total !== undefined) updateData.totalAmount = total;
    if (date !== undefined) updateData.issuedDate = new Date(date);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (status !== undefined) updateData.status = status;
    updateData.updatedAt = new Date();

    await db.update(invoices).set(updateData).where(eq(invoices.id, paramId));

    // Update line items: delete existing and insert new
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, paramId));
    if (lineItems && lineItems.length) {
      for (const item of lineItems) {
        await db.insert(invoiceItems).values({
          invoiceId: paramId,
          description: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        });
      }
    }

    // Return updated invoice
    const updated = await db.select().from(invoices).where(eq(invoices.id, paramId)).limit(1);
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, paramId));
    const customer = await db
      .select({ name: customers.name, email: customers.email })
      .from(customers)
      .where(eq(customers.id, updated[0].customerId))
      .limit(1);

    res.json({
      ...updated[0],
      customerName: customer[0]?.name || '',
      customerEmail: customer[0]?.email || '',
      lineItems: items,
      date: updated[0].issuedDate,
      dueDate: updated[0].dueDate,
      total: updated[0].totalAmount,
      subtotal: updated[0].subtotal,
      tax: updated[0].tax,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating invoice' });
  }
};

// Update invoice status only
export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const paramId = getStringId(req.params.id);
    if (!paramId) return res.status(400).json({ message: 'Invalid invoice id' });
    const { status } = req.body;

    const existing = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, paramId), eq(invoices.userId, userId)))
      .limit(1);

    if (existing.length === 0) return res.status(404).json({ message: 'Invoice not found' });

    await db.update(invoices).set({ status, updatedAt: new Date() }).where(eq(invoices.id, paramId));
    res.json({ message: 'Status updated', status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating status' });
  }
};

// Delete invoice (only draft)
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const paramId = getStringId(req.params.id);
    if (!paramId) return res.status(400).json({ message: 'Invalid invoice id' });

    const existing = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, paramId), eq(invoices.userId, userId)))
      .limit(1);

    if (existing.length === 0) return res.status(404).json({ message: 'Invoice not found' });
    if (existing[0].status !== 'draft') {
      return res.status(400).json({ message: 'Only draft invoices can be deleted' });
    }

    // Delete line items then invoice
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, paramId));
    await db.delete(invoices).where(eq(invoices.id, paramId));

    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting invoice' });
  }
};