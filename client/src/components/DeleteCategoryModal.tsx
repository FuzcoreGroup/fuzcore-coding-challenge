import { Category } from '../contexts/CategoryContext';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  category: Category | null;
  loading: boolean;
}

export function DeleteCategoryModal({ isOpen, onClose, onConfirm, category, loading }: DeleteCategoryModalProps) {
  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-[25px] w-full max-w-[450px] p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="w-[70px] h-[70px] rounded-full bg-[#ffe0eb] flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z"
                stroke="#FE5C73"
                strokeWidth="2"
              />
              <path d="M16 11V17M16 21H16.01" stroke="#FE5C73" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <h2 className="font-semibold text-[22px] text-[#343c6a] mb-2">Delete Category</h2>
          <p className="text-[15px] text-[#718ebf] mb-1">
            Are you sure you want to delete the category:
          </p>
          <p className="font-semibold text-[16px] text-[#343c6a] mb-4">"{category.name}"</p>
          <p className="text-[14px] text-[#fe5c73] mb-6">
            This action cannot be undone. Existing transactions with this category will keep the category name.
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 h-[50px] border border-[#dfeaf2] text-[#718ebf] font-medium text-[16px] rounded-[15px] hover:bg-[#f5f7fa] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-[50px] bg-[#fe5c73] text-white font-medium text-[16px] rounded-[15px] hover:bg-[#e54a61] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
