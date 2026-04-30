import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { customers } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const getStringId = (id: string | string[] | undefined): string | null => {
  if (!id) return null;
  return Array.isArray(id) ? id[0] : id;
};

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const userCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId));

    res.json(userCustomers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching customers' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, email, phone, address, company, taxId, status, balance } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone are required' });
    }

    const [newCustomer] = await db
      .insert(customers)
      .values({
        userId,
        name,
        email,
        phone,
        address: address || null,
        company: company || null,
        taxId: taxId || null,
        status: status || 'Active',
        balance: balance !== undefined ? balance : 0,
      })
      .returning();

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating customer' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const paramId = getStringId(req.params.id);
    if (!paramId) return res.status(400).json({ message: 'Invalid customer id' });

    const { name, email, phone, address, company, taxId, status, balance } = req.body;

    const existing = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, paramId), eq(customers.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (company !== undefined) updateData.company = company;
    if (taxId !== undefined) updateData.taxId = taxId;
    if (status !== undefined) updateData.status = status;
    if (balance !== undefined) updateData.balance = balance;
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, paramId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating customer' });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const paramId = getStringId(req.params.id);
    if (!paramId) return res.status(400).json({ message: 'Invalid customer id' });

    const existing = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, paramId), eq(customers.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await db.delete(customers).where(eq(customers.id, paramId));
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting customer' });
  }
};