import { Customer } from '../contexts/CustomerContext';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customer: Customer | null;
  loading: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  customer,
  loading,
}: DeleteConfirmationModalProps) {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[25px] w-full max-w-[450px] p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {/* Warning Icon */}
          <div className="w-[80px] h-[80px] rounded-full bg-[#ffe0eb] flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path
                d="M20 13.3333V20M20 26.6667H20.0167M35 20C35 28.2843 28.2843 35 20 35C11.7157 35 5 28.2843 5 20C5 11.7157 11.7157 5 20 5C28.2843 5 35 11.7157 35 20Z"
                stroke="#FE5C73"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="font-semibold text-[24px] text-[#343c6a] mb-2">
            Delete Customer
          </h2>

          <p className="text-[#718ebf] text-[15px] mb-6">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-[#343c6a]">{customer.name}</span>?
            This action cannot be undone.
          </p>

          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[50px] border border-[#dfeaf2] text-[#718ebf] font-medium text-[16px] rounded-[15px] hover:bg-[#f5f7fa] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-[50px] bg-[#fe5c73] text-white font-medium text-[16px] rounded-[15px] hover:bg-[#ff4b4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
