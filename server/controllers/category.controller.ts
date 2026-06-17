import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Get all categories for the authenticated user
export const getCategories = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const type = req.query.type as string;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    let query = db.select().from(categories).where(eq(categories.userId, userId));
    
    if (type && (type === 'income' || type === 'expense')) {
      query = db.select().from(categories).where(
        and(eq(categories.userId, userId), eq(categories.type, type))
      );
    }
    
    const userCategories = await query;
    res.json(userCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

// Create a new category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, type, description, color, icon } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Validation
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }
    
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ message: 'Type must be income or expense' });
    }
    
    // Check if category with same name exists for this user
    const existingCategory = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId), 
          eq(categories.name, name)
        )
      )
      .limit(1);
    
    if (existingCategory.length > 0) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    
    // Create category
    const newCategory = await db.insert(categories).values({
      userId: userId,
      name: name,
      type: type,
      description: description || null,
      color: color || '#2d60ff',
      icon: icon || 'tag',
    }).returning();
    
    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
};

// Update a category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const categoryId = req.params.id;
    const { name, description, color, icon } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Check if category exists and belongs to user
    const existingCategory = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId), 
          eq(categories.userId, userId)
        )
      )
      .limit(1);
    
    if (existingCategory.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Update category
    const updatedCategory = await db
      .update(categories)
      .set({
        name: name || existingCategory[0].name,
        description: description !== undefined ? description : existingCategory[0].description,
        color: color || existingCategory[0].color,
        icon: icon || existingCategory[0].icon,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId))
      .returning();
    
    res.json(updatedCategory[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const categoryId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Check if category exists and belongs to user
    const existingCategory = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId), 
          eq(categories.userId, userId)
        )
      )
      .limit(1);
    
    if (existingCategory.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Delete category
    await db.delete(categories).where(eq(categories.id, categoryId));
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
};