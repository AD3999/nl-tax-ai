import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  color?: "blue" | "green" | "yellow" | "red" | "gray" | "indigo";
  className?: string;
}

const COLOR_MAP = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-600",   icon: "bg-blue-100" },
  green:  { bg: "bg-green-50",  text: "text-green-600",  icon: "bg-green-100" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-600", icon: "bg-yellow-100" },
  red:    { bg: "bg-red-50",    text: "text-red-600",    icon: "bg-red-100" },
  gray:   { bg: "bg-gray-50",   text: "text-gray-600",   icon: "bg-gray-100" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "bg-indigo-100" },
};

export function StatCard({ label, value, icon, trend, color = "blue", className }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4", className)}>
      {icon && (
        <div className={cn("p-2.5 rounded-lg flex-shrink-0", c.icon, c.text)}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{label}</p>
        <p className={cn("text-2xl font-bold mt-0.5", c.text)}>{value}</p>
        {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
      </div>
    </div>
  );
}
