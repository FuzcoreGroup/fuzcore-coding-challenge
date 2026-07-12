import { cn } from "@/lib/utils";

type Status = "draft" | "sent" | "paid";

const statusConfig: Record<Status, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-50 text-blue-600 border-blue-200",
  },
  paid: {
    label: "Paid",
    className: "bg-[#24605215] text-[#246052] border-[#24605230]",
  },
};

export function StatusPill({ status }: { status: Status }) {
  const config = statusConfig[status] ?? statusConfig.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
