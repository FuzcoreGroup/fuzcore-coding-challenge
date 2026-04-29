import { useState, useRef, ChangeEvent } from 'react';
import { useTransactions } from '../contexts/TransactionContext';
import { useCategories, Category } from '../contexts/CategoryContext';
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
  category?: string;    // category name
  description?: string;
  date?: string;
}

interface ValidationError {
  row: number;
  message: string;
}

export function ImportTransactionsModal({ isOpen, onClose }: ImportTransactionsModalProps) {
  const { addTransaction, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);

  // Build a map from category name to id for quick lookup
  const categoryMap = new Map<string, string>();
  categories.forEach(cat => {
    categoryMap.set(cat.name.toLowerCase(), cat.id);
  });

  const validateRow = (row: CSVRow, index: number): ValidationError | null => {
    if (!row.amount || isNaN(parseFloat(row.amount)) || parseFloat(row.amount) <= 0) {
      return { row: index + 1, message: 'Invalid amount (positive number)' };
    }
    const typeLower = row.type?.toLowerCase();
    if (!typeLower || (typeLower !== 'income' && typeLower !== 'expense')) {
      return { row: index + 1, message: 'Type must be "income" or "expense"' };
    }
    if (!row.category) {
      return { row: index + 1, message: 'Category is required' };
    }
    const catId = categoryMap.get(row.category.toLowerCase());
    if (!catId) {
      return { row: index + 1, message: `Unknown category: "${row.category}". Create it first in Categories tab.` };
    }
    if (!row.description || !row.description.trim()) {
      return { row: index + 1, message: 'Description required' };
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!row.date || !dateRegex.test(row.date)) {
      return { row: index + 1, message: 'Invalid date format (YYYY-MM-DD)' };
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
        data.forEach((row, idx) => {
          const err = validateRow(row, idx);
          if (err) validationErrors.push(err);
        });
        setErrors(validationErrors);
        setPreviewData(data.slice(0, 5));
      },
      error: () => showToast('Failed to parse CSV', 'error'),
    });
  };

  const handleImport = async () => {
    if (!selectedFile || errors.length > 0) return;
    setImporting(true);

    Papa.parse<CSVRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let successCount = 0;
        for (const row of results.data) {
          const err = validateRow(row, 0);
          if (err) continue;
          try {
            await addTransaction({
              amount: parseFloat(row.amount!),
              type: row.type!.toLowerCase() as 'income' | 'expense',
              categoryId: categoryMap.get(row.category!.toLowerCase())!,
              description: row.description!.trim(),
              date: row.date!,
            });
            successCount++;
          } catch (e) {
            console.error('Import row failed', e);

            
          }
        }
        showToast(`Imported ${successCount} transactions`, 'success');
        addNotification({
          type: 'transaction',
          title: 'CSV Import',
          message: `Imported ${successCount} transactions from CSV.`,
        });
        onClose();
        setSelectedFile(null);
        setPreviewData([]);
        setErrors([]);
        setImporting(false);
      },
    });
  };

  const downloadTemplate = () => {
    const template = `amount,type,category,description,date
1000,income,Salary,Monthly salary,2026-04-01
50,expense,Food,Lunch,2026-04-02`;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Template downloaded', 'info');
  };

  if (!isOpen) return null;

  const loading = txLoading || catLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-[25px] w-full max-w-[700px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-6">
          <h2 className="font-semibold text-[24px] text-[#343c6a]">Import Transactions</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-[#f5f7fa]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5L15 15" stroke="#718EBF" strokeWidth="2"/></svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-[#e7edff] rounded-[15px] p-4">
            <p className="text-[14px] text-[#2d60ff] font-medium mb-1">CSV Requirements</p>
            <p className="text-[13px] text-[#2d60ff]">Columns: amount, type (income/expense), category (must match your existing category names), description, date (YYYY-MM-DD)</p>
            <button onClick={downloadTemplate} className="mt-2 text-[13px] text-[#2d60ff] underline">Download template</button>
          </div>

          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#dfeaf2] rounded-[15px] p-8 text-center cursor-pointer hover:border-[#2d60ff]">
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            {selectedFile ? (
              <p className="font-medium text-[16px] text-[#343c6a]">{selectedFile.name}</p>
            ) : (
              <p className="font-medium text-[16px] text-[#343c6a]">Click to select CSV file</p>
            )}
          </div>

          {errors.length > 0 && (
            <div className="bg-[#ffe0eb] border border-[#fe5c73] rounded-[15px] p-4">
              <p className="font-medium text-[14px] text-[#fe5c73] mb-2">Found {errors.length} error(s)</p>
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                {errors.slice(0, 10).map((e, i) => (
                  <p key={i} className="text-[13px] text-[#fe5c73]">Row {e.row}: {e.message}</p>
                ))}
              </div>
            </div>
          )}

          {previewData.length > 0 && errors.length === 0 && (
            <div>
              <h3 className="font-semibold text-[16px] mb-3">Preview (first 5 rows)</h3>
              <div className="border rounded-[15px] overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-[#f5f7fa]">
                    <tr><th className="p-2">Amount</th><th>Type</th><th>Category</th><th>Description</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">${row.amount}</td>
                        <td className="capitalize">{row.type}</td>
                        <td>{row.category}</td>
                        <td>{row.description}</td>
                        <td>{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 h-[50px] border rounded-[15px] text-[#718ebf] hover:bg-[#f5f7fa]">Cancel</button>
            <button onClick={handleImport} disabled={!selectedFile || errors.length > 0 || importing || loading}
              className="flex-1 h-[50px] bg-[#1814f3] text-white rounded-[15px] hover:bg-[#2d60ff] disabled:opacity-50">
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}