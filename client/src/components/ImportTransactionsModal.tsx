import { useState, useRef, ChangeEvent } from 'react';
import { useTransactions, TransactionType, TransactionCategory } from '../contexts/TransactionContext';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../contexts/NotificationContext';
import Papa from 'papaparse';

interface ImportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CSVRow {
  amount?: string;
  type?: string;
  category?: string;
  description?: string;
  date?: string;
}

interface ValidationError {
  row: number;
  message: string;
}

const VALID_TYPES: TransactionType[] = ['income', 'expense'];
const VALID_CATEGORIES: TransactionCategory[] = [
  'Salary',
  'Freelance',
  'Investment',
  'Shopping',
  'Food',
  'Transport',
  'Entertainment',
  'Bills',
  'Other',
];

export function ImportTransactionsModal({ isOpen, onClose }: ImportTransactionsModalProps) {
  const { addTransaction, loading } = useTransactions();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);

  const validateRow = (row: CSVRow, index: number): ValidationError | null => {
    if (!row.amount || isNaN(parseFloat(row.amount)) || parseFloat(row.amount) <= 0) {
      return { row: index + 1, message: 'Invalid amount (must be a positive number)' };
    }

    if (!row.type || !VALID_TYPES.includes(row.type.toLowerCase() as TransactionType)) {
      return { row: index + 1, message: `Invalid type (must be "income" or "expense")` };
    }

    if (!row.category || !VALID_CATEGORIES.includes(row.category as TransactionCategory)) {
      return { row: index + 1, message: `Invalid category (must be one of: ${VALID_CATEGORIES.join(', ')})` };
    }

    if (!row.description || !row.description.trim()) {
      return { row: index + 1, message: 'Description is required' };
    }

    if (!row.date) {
      return { row: index + 1, message: 'Date is required' };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row.date)) {
      return { row: index + 1, message: 'Invalid date format (must be YYYY-MM-DD)' };
    }

    return null;
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }

    setSelectedFile(file);
    setErrors([]);
    setPreviewData([]);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        const validationErrors: ValidationError[] = [];

        data.forEach((row, index) => {
          const error = validateRow(row, index);
          if (error) {
            validationErrors.push(error);
          }
        });

        setErrors(validationErrors);
        setPreviewData(data.slice(0, 5));
      },
      error: (error) => {
        showToast('Failed to parse CSV file', 'error');
        console.error('CSV parse error:', error);
      },
    });
  };

  const handleImport = async () => {
    if (!selectedFile || errors.length > 0) return;

    setImporting(true);

    Papa.parse<CSVRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          let successCount = 0;

          for (const row of results.data) {
            const error = validateRow(row, 0);
            if (!error) {
              await addTransaction({
                amount: parseFloat(row.amount!),
                type: row.type!.toLowerCase() as TransactionType,
                category: row.category as TransactionCategory,
                description: row.description!.trim(),
                date: row.date!,
              });
              successCount++;
            }
          }

          showToast(`Successfully imported ${successCount} transactions`, 'success');
          addNotification({
            type: 'transaction',
            title: 'Transactions Imported',
            message: `Successfully imported ${successCount} transaction${successCount > 1 ? 's' : ''} from CSV file.`,
          });
          onClose();
          setSelectedFile(null);
          setPreviewData([]);
          setErrors([]);
        } catch (error) {
          console.error('Import failed:', error);
          showToast('Failed to import transactions', 'error');
        } finally {
          setImporting(false);
        }
      },
    });
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setErrors([]);
    onClose();
  };

  const downloadTemplate = () => {
    const template = `amount,type,category,description,date
1000,income,Salary,Monthly salary payment,2026-04-01
50,expense,Food,Lunch at restaurant,2026-04-02
200,expense,Shopping,New headphones,2026-04-03`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToast('Template downloaded', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white rounded-[25px] w-full max-w-[700px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-[24px] text-[#343c6a]">Import Transactions</h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full hover:bg-[#f5f7fa] flex items-center justify-center transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-[#e7edff] border border-[#2d60ff] rounded-[15px] p-4">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="10" cy="10" r="8" stroke="#2d60ff" strokeWidth="2" />
                <path d="M10 10V14M10 7H10.01" stroke="#2d60ff" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="flex-1">
                <p className="text-[14px] text-[#2d60ff] font-medium mb-1">CSV Format Requirements</p>
                <p className="text-[13px] text-[#2d60ff]">
                  Your CSV must include: <strong>amount</strong>, <strong>type</strong> (income/expense),{' '}
                  <strong>category</strong>, <strong>description</strong>, <strong>date</strong> (YYYY-MM-DD)
                </p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 text-[13px] text-[#2d60ff] font-medium underline hover:no-underline"
                >
                  Download template
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Select CSV File
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#dfeaf2] rounded-[15px] p-8 text-center cursor-pointer hover:border-[#2d60ff] hover:bg-[#f5f7fa] transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                className="mx-auto mb-4"
              >
                <rect x="12" y="8" width="24" height="32" rx="2" stroke="#718EBF" strokeWidth="2" />
                <path d="M20 18H28M20 24H28M20 30H24" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {selectedFile ? (
                <div>
                  <p className="font-medium text-[16px] text-[#343c6a] mb-1">{selectedFile.name}</p>
                  <p className="text-[14px] text-[#718ebf]">Click to change file</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-[16px] text-[#343c6a] mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-[14px] text-[#718ebf]">CSV files only</p>
                </div>
              )}
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-[#ffe0eb] border border-[#fe5c73] rounded-[15px] p-4">
              <div className="flex items-start gap-3 mb-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
                  <circle cx="10" cy="10" r="8" stroke="#fe5c73" strokeWidth="2" />
                  <path d="M10 6V11M10 14H10.01" stroke="#fe5c73" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-[14px] text-[#fe5c73] mb-2">
                    Found {errors.length} validation error{errors.length > 1 ? 's' : ''}
                  </p>
                  <div className="space-y-1 max-h-[120px] overflow-y-auto">
                    {errors.slice(0, 10).map((error, index) => (
                      <p key={index} className="text-[13px] text-[#fe5c73]">
                        Row {error.row}: {error.message}
                      </p>
                    ))}
                    {errors.length > 10 && (
                      <p className="text-[13px] text-[#fe5c73] font-medium">
                        ...and {errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewData.length > 0 && errors.length === 0 && (
            <div>
              <h3 className="font-semibold text-[16px] text-[#343c6a] mb-3">
                Preview (first 5 rows)
              </h3>
              <div className="border border-[#e6eff5] rounded-[15px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-[#f5f7fa]">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-[#718ebf]">Amount</th>
                        <th className="text-left py-2 px-3 font-medium text-[#718ebf]">Type</th>
                        <th className="text-left py-2 px-3 font-medium text-[#718ebf]">Category</th>
                        <th className="text-left py-2 px-3 font-medium text-[#718ebf]">Description</th>
                        <th className="text-left py-2 px-3 font-medium text-[#718ebf]">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-t border-[#e6eff5]">
                          <td className="py-2 px-3 text-[#343c6a]">${row.amount}</td>
                          <td className="py-2 px-3 text-[#343c6a] capitalize">{row.type}</td>
                          <td className="py-2 px-3 text-[#343c6a]">{row.category}</td>
                          <td className="py-2 px-3 text-[#343c6a]">{row.description}</td>
                          <td className="py-2 px-3 text-[#343c6a]">{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 h-[50px] border border-[#dfeaf2] text-[#718ebf] font-medium text-[16px] rounded-[15px] hover:bg-[#f5f7fa] transition-colors"
              disabled={importing}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || errors.length > 0 || importing || loading}
              className="flex-1 h-[50px] bg-[#1814f3] text-white font-medium text-[16px] rounded-[15px] hover:bg-[#2d60ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing...' : 'Import Transactions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
