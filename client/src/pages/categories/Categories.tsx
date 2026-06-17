// client/src/pages/categories/Categories.tsx
import { useState } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { useCategories, Category, CategoryType } from '../../contexts/CategoryContext';
import { AddEditCategoryModal } from '../../components/AddEditCategoryModal';
import { DeleteCategoryModal } from '../../components/DeleteCategoryModal';
import { useToast } from '../../contexts/ToastContext';

export default function Categories() {
  const { categories, loading, deleteCategory } = useCategories();
  const { showToast } = useToast();
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | CategoryType>('all');

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsAddEditModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCategory) {
      try {
        await deleteCategory(selectedCategory.id);
        showToast('Category deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
      } catch (error: any) {
        showToast(error.message || 'Failed to delete category', 'error');
      }
    }
  };

  const filteredCategories = categories.filter((category) => {
    if (typeFilter === 'all') return true;
    return category.type === typeFilter;
  });

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <AppLayout title="Categories">
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Total Categories</p>
            <p className="font-semibold text-[24px] text-[#343c6a]">{categories.length}</p>
          </div>
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Income Categories</p>
            <p className="font-semibold text-[24px] text-[#16dbaa]">{incomeCategories.length}</p>
          </div>
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Expense Categories</p>
            <p className="font-semibold text-[24px] text-[#fe5c73]">{expenseCategories.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-[25px] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-semibold text-[22px] text-[#343c6a]">All Categories</h2>
            <button
              onClick={handleAddCategory}
              className="px-6 h-[40px] bg-[#1814f3] text-white font-medium text-[14px] rounded-[10px] hover:bg-[#2d60ff] transition-colors whitespace-nowrap"
            >
              Add Category
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="mb-6">
            <label className="block text-[12px] text-[#718ebf] mb-2">Filter by Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`flex-1 sm:flex-none sm:px-6 h-[40px] rounded-[10px] font-medium text-[14px] transition-all ${
                  typeFilter === 'all'
                    ? 'bg-[#1814f3] text-white'
                    : 'bg-[#f5f7fa] text-[#718ebf] hover:bg-[#e6eff5]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`flex-1 sm:flex-none sm:px-6 h-[40px] rounded-[10px] font-medium text-[14px] transition-all ${
                  typeFilter === 'income'
                    ? 'bg-[#16dbcc] text-white'
                    : 'bg-[#f5f7fa] text-[#718ebf] hover:bg-[#e6eff5]'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`flex-1 sm:flex-none sm:px-6 h-[40px] rounded-[10px] font-medium text-[14px] transition-all ${
                  typeFilter === 'expense'
                    ? 'bg-[#fe5c73] text-white'
                    : 'bg-[#f5f7fa] text-[#718ebf] hover:bg-[#e6eff5]'
                }`}
              >
                Expense
              </button>
            </div>
          </div>

          {/* Loading & Empty States */}
          {loading && categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-[60px] h-[60px] rounded-full border-4 border-[#e6eff5] border-t-[#2d60ff] animate-spin mb-4" />
              <p className="text-[#718ebf] text-[15px]">Loading categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-[80px] h-[80px] rounded-full bg-[#f5f7fa] flex items-center justify-center mb-4">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="8" y="8" width="24" height="24" rx="3" stroke="#718EBF" strokeWidth="2" />
                  <path d="M14 16H26M14 22H20" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="font-semibold text-[18px] text-[#343c6a] mb-2">No categories found</h3>
              <p className="text-[#718ebf] text-[14px] mb-6">
                {typeFilter !== 'all' ? 'Try adjusting your filter' : 'Get started by adding your first category'}
              </p>
              {typeFilter === 'all' && (
                <button
                  onClick={handleAddCategory}
                  className="px-6 h-[40px] bg-[#1814f3] text-white font-medium text-[14px] rounded-[10px] hover:bg-[#2d60ff] transition-colors"
                >
                  Add Your First Category
                </button>
              )}
            </div>
          ) : (
            /* Category Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="border border-[#dfeaf2] rounded-[15px] p-4 hover:border-[#2d60ff] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-[45px] h-[45px] rounded-full flex items-center justify-center ${
                          category.type === 'income' ? 'bg-[#dcfaf8]' : 'bg-[#ffe0eb]'
                        }`}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          {category.type === 'income' ? (
                            <path
                              d="M10 15V5M10 5L5 10M10 5L15 10"
                              stroke="#16DBCC"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ) : (
                            <path
                              d="M10 5V15M10 15L15 10M10 15L5 10"
                              stroke="#FE5C73"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-[16px] text-[#343c6a]">{category.name}</p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            category.type === 'income'
                              ? 'bg-[#dcfaf8] text-[#16dbcc]'
                              : 'bg-[#ffe0eb] text-[#fe5c73]'
                          }`}
                        >
                          {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#f3f3f5]">
                    <span className="text-[12px] text-[#718ebf]">Custom</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-colors bg-[#e7edff] hover:bg-[#2d60ff] text-[#2d60ff] hover:text-white"
                        title="Edit category"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M11.3333 2.00004C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6666 1.44775C12.9142 1.44775 13.1594 1.49653 13.3882 1.59129C13.617 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.383 14.4088 2.61182C14.5035 2.84063 14.5523 3.08584 14.5523 3.33337C14.5523 3.5809 14.5035 3.82611 14.4088 4.05493C14.314 4.28374 14.1751 4.49161 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-colors bg-[#ffe0eb] hover:bg-[#fe5c73] text-[#fe5c73] hover:text-white"
                        title="Delete category"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M2 4H3.33333H14M5.33333 4V2.66667C5.33333 2.31304 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31304 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31304 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31304 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddEditCategoryModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
      />

      <DeleteCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDeleteConfirm}
        category={selectedCategory}
        loading={loading}
      />
    </AppLayout>
  );
}