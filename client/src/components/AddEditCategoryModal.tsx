import { useState, useEffect, FormEvent } from 'react';
import { Category, CategoryType, useCategories } from '../contexts/CategoryContext';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../contexts/NotificationContext';

interface AddEditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

export function AddEditCategoryModal({ isOpen, onClose, category }: AddEditCategoryModalProps) {
  const { addCategory, updateCategory, loading } = useCategories();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
    } else {
      setName('');
      setType('expense');
    }
    setErrors({});
  }, [category, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const categoryData = {
        name: name.trim(),
        type,
      };

      if (category) {
        await updateCategory(category.id, categoryData);
        showToast('Category updated successfully', 'success');
        addNotification({
          type: 'category',
          title: 'Category Updated',
          message: `${categoryData.name} category has been updated.`,
        });
      } else {
        await addCategory(categoryData);
        showToast('Category added successfully', 'success');
        addNotification({
          type: 'category',
          title: 'New Category Added',
          message: `${categoryData.name} (${categoryData.type}) category has been created.`,
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
      showToast('Failed to save category', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-[25px] w-full max-w-[500px] p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-[24px] text-[#343c6a]">
            {category ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#f5f7fa] flex items-center justify-center transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="type" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`h-[50px] rounded-[15px] border-2 font-medium text-[15px] transition-all ${
                  type === 'income'
                    ? 'border-[#16dbcc] bg-[#dcfaf8] text-[#16dbcc]'
                    : 'border-[#dfeaf2] bg-[#f5f7fa] text-[#718ebf]'
                }`}
                disabled={loading}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`h-[50px] rounded-[15px] border-2 font-medium text-[15px] transition-all ${
                  type === 'expense'
                    ? 'border-[#fe5c73] bg-[#ffe0eb] text-[#fe5c73]'
                    : 'border-[#dfeaf2] bg-[#f5f7fa] text-[#718ebf]'
                }`}
                disabled={loading}
              >
                Expense
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Category Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.name ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="Enter category name"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-[12px] text-[#fe5c73]">{errors.name}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[50px] border border-[#dfeaf2] text-[#718ebf] font-medium text-[16px] rounded-[15px] hover:bg-[#f5f7fa] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-[50px] bg-[#1814f3] text-white font-medium text-[16px] rounded-[15px] hover:bg-[#2d60ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : category ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
