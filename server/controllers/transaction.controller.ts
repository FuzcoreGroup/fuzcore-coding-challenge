import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { transactions } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

const getStringId = (id: string | string[] | undefined): string | null => {
  if (!id) return null;
  return Array.isArray(id) ? id[0] : id;
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));

    // Ensure amount is number (Drizzle returns as number if column type is real)
    const normalized = userTransactions.map(tx => ({
      ...tx,
      amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount
    }));
    res.json(normalized);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    let { amount, type, categoryId, description, date } = req.body;

    if (!amount || !type || !categoryId || !description || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Ensure amount is a number
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    const [newTransaction] = await db
      .insert(transactions)
      .values({
        userId,
        amount: numericAmount,
        type,
        categoryId,
        description,
        date: new Date(date),
      })
      .returning();

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating transaction' });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const paramId = getStringId(req.params.id);
    if (!paramId) return res.status(400).json({ message: 'Invalid transaction id' });

    const { amount, type, categoryId, description, date } = req.body;

    const existing = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, paramId), eq(transactions.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (type !== undefined) updateData.type = type;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, paramId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating transaction' });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const paramId = getStringId(req.params.id);
    if (!paramId) return res.status(400).json({ message: 'Invalid transaction id' });

    const existing = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, paramId), eq(transactions.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await db.delete(transactions).where(eq(transactions.id, paramId));
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting transaction' });
  }
};