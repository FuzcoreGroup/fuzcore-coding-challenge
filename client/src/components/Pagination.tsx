import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageLength: number;
  totalData: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageLengthChange: (pageLength: number) => void;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function Pagination({
  page,
  pageLength,
  totalData,
  totalPages,
  onPageChange,
  onPageLengthChange,
}: PaginationProps) {
  const from = Math.min((page - 1) * pageLength + 1, totalData);
  const to = Math.min(page * pageLength, totalData);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Rows per page:</span>
        <select
          value={pageLength}
          onChange={(e) => {
            onPageLengthChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#246052]/30"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="hidden sm:inline">
          {totalData > 0 ? `${from}–${to} of ${totalData}` : "No results"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 w-8"
        >
          <ChevronLeft size={14} />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "...")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, idx) =>
            p === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1 text-gray-400 text-sm"
              >
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(p as number)}
                className={`h-8 w-8 text-xs ${p === page ? "bg-[#246052] hover:bg-[#246052]/90" : ""}`}
              >
                {p}
              </Button>
            ),
          )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 w-8"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
