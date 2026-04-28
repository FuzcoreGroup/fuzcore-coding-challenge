import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  isDefault: boolean;
  createdAt: string;
}

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'isDefault'>) => Promise<void>;
  updateCategory: (id: string, category: Omit<Category, 'id' | 'createdAt' | 'isDefault'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategory: (id: string) => Category | undefined;
}

const CategoryContext = createContext<CategoryContextType | null>(null);

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Salary', type: 'income', isDefault: true, createdAt: '2026-01-01' },
  { id: '2', name: 'Freelance', type: 'income', isDefault: true, createdAt: '2026-01-01' },
  { id: '3', name: 'Investment', type: 'income', isDefault: true, createdAt: '2026-01-01' },
  { id: '4', name: 'Shopping', type: 'expense', isDefault: true, createdAt: '2026-01-01' },
  { id: '5', name: 'Food', type: 'expense', isDefault: true, createdAt: '2026-01-01' },
  { id: '6', name: 'Transport', type: 'expense', isDefault: true, createdAt: '2026-01-01' },
  { id: '7', name: 'Entertainment', type: 'expense', isDefault: true, createdAt: '2026-01-01' },
  { id: '8', name: 'Bills', type: 'expense', isDefault: true, createdAt: '2026-01-01' },
  { id: '9', name: 'Other', type: 'expense', isDefault: true, createdAt: '2026-01-01' },
];

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() => {
    const stored = localStorage.getItem('categories');
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  const addCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'isDefault'>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
      isDefault: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCategories(prev => [newCategory, ...prev]);
    setLoading(false);
  };

  const updateCategory = async (id: string, categoryData: Omit<Category, 'id' | 'createdAt' | 'isDefault'>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setCategories(prev =>
      prev.map(category =>
        category.id === id
          ? { ...category, ...categoryData }
          : category
      )
    );
    setLoading(false);
  };

  const deleteCategory = async (id: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    setCategories(prev => prev.filter(category => category.id !== id));
    setLoading(false);
  };

  const getCategory = (id: string) => {
    return categories.find(category => category.id === id);
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within CategoryProvider');
  }
  return context;
}
