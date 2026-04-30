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
    const { customerId, customerName, customerEmail, status, lineItems, subtotal, tax, total, date, dueDate } = req.body;

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
    const customer = await db.select({ name: customers.name, email: customers.email }).from(customers).where(eq(customers.id, customerId)).limit(1);

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
    const customer = await db.select({ name: customers.name, email: customers.email }).from(customers).where(eq(customers.id, updated[0].customerId)).limit(1);

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

// Send invoice email with PDF attachment (requires nodemailer)
import nodemailer from 'nodemailer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const sendInvoiceEmail = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { invoiceId, email } = req.body;
    if (!invoiceId || !email) return res.status(400).json({ message: 'Invoice ID and email required' });

    // Fetch invoice with details
    const inv = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId))).limit(1);
    if (inv.length === 0) return res.status(404).json({ message: 'Invoice not found' });

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    const customer = await db.select({ name: customers.name }).from(customers).where(eq(customers.id, inv[0].customerId)).limit(1);
    const customerName = customer[0]?.name || 'Customer';

    // Generate PDF (same as frontend logic)
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setTextColor(52, 60, 106);
    doc.text('INVOICE', 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(113, 142, 191);
    doc.text('BankDash Financial Services', 20, 32);
    doc.text('123 Business Street, Suite 100', 20, 37);
    doc.text('New York, NY 10001', 20, 42);

    doc.setFontSize(12);
    doc.setTextColor(52, 60, 106);
    doc.text(`Invoice #${inv[0].invoiceNumber}`, 150, 25);
    doc.setFontSize(10);
    doc.setTextColor(113, 142, 191);
    doc.text(`Date: ${new Date(inv[0].issuedDate).toLocaleDateString()}`, 150, 32);
    doc.text(`Due: ${inv[0].dueDate ? new Date(inv[0].dueDate).toLocaleDateString() : 'N/A'}`, 150, 37);

    doc.setDrawColor(230, 239, 245);
    doc.line(20, 50, 190, 50);

    doc.setFontSize(11);
    doc.setTextColor(52, 60, 106);
    doc.text('Bill To:', 20, 60);
    doc.setFontSize(10);
    doc.setTextColor(113, 142, 191);
    doc.text(customerName, 20, 67);
    doc.text(email, 20, 72);

    autoTable(doc, {
      startY: 85,
      head: [['Item', 'Quantity', 'Price', 'Total']],
      body: items.map(item => [
        item.description,
        item.quantity.toString(),
        `$${item.price.toFixed(2)}`,
        `$${item.total.toFixed(2)}`
      ]),
      theme: 'plain',
      headStyles: { fillColor: [245, 247, 250], textColor: [113, 142, 191], fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { textColor: [52, 60, 106], fontSize: 10 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.line(120, finalY + 10, 190, finalY + 10);
    doc.setFontSize(10);
    doc.setTextColor(113, 142, 191);
    doc.text('Subtotal:', 120, finalY + 20);
    doc.text('Tax (10%):', 120, finalY + 27);
    doc.setFontSize(12);
    doc.setTextColor(52, 60, 106);
    doc.text('Total:', 120, finalY + 37);
    doc.setTextColor(45, 96, 255);
    doc.text(`$${inv[0].totalAmount.toFixed(2)}`, 190, finalY + 37, { align: 'right' });
    doc.text(`$${inv[0].subtotal.toFixed(2)}`, 190, finalY + 20, { align: 'right' });
    doc.text(`$${inv[0].tax.toFixed(2)}`, 190, finalY + 27, { align: 'right' });

    const pdfBuffer = doc.output('arraybuffer');

    // Send email using nodemailer (configure with your SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Invoice ${inv[0].invoiceNumber} from BankDash`,
      text: `Dear ${customerName},\n\nPlease find attached invoice ${inv[0].invoiceNumber}.\n\nThank you for your business.\n\nBankDash Team`,
      attachments: [{ filename: `invoice-${inv[0].invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    // Update status to 'sent' if currently draft
    if (inv[0].status === 'draft') {
      await db.update(invoices).set({ status: 'sent', updatedAt: new Date() }).where(eq(invoices.id, invoiceId));
    }

    res.json({ message: 'Invoice sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending invoice email' });
  }
};