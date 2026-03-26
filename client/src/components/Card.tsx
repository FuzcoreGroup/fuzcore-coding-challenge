import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-md border border-[#24605215] p-5 transition-all duration-200 hover:shadow-lg hover:bg-[#24605208] cursor-default",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-[#246052] uppercase tracking-wider">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardValue({
  value,
  prefix,
}: {
  value: string | number;
  prefix?: string;
}) {
  return (
    <div className="mt-2">
      <span className="text-2xl font-bold text-gray-800">
        {prefix && (
          <span className="text-base mr-1 text-gray-500">{prefix}</span>
        )}
        {value}
      </span>
    </div>
  );
}
