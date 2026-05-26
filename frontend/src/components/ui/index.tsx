import { cn } from "@/lib/utils";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

// ─── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = "default" | "outline" | "ghost" | "destructive" | "secondary";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant = "default", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none",
        variant === "default" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "outline" && "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        variant === "ghost" && "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        variant === "destructive" && "bg-red-600 text-white hover:bg-red-700",
        variant === "secondary" && "bg-gray-100 text-gray-700 hover:bg-gray-200",
        size === "sm" && "text-xs px-2.5 py-1.5 h-7",
        size === "md" && "text-sm px-4 py-2 h-9",
        size === "lg" && "text-sm px-6 py-2.5 h-11",
        size === "icon" && "h-8 w-8 p-0",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "gray";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
        variant === "success" && "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
        variant === "warning" && "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20",
        variant === "error" && "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
        variant === "info" && "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20",
        variant === "gray" && "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20",
        className,
      )}
    >
      {children}
    </span>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  rtl?: boolean;
}

export function Input({ label, error, helper, rtl = false, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        id={id}
        className={cn(
          "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500",
          rtl && "direction-rtl text-right",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

// ─── Textarea ────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  rtl?: boolean;
}

export function Textarea({ label, error, helper, rtl = false, className, id, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        id={id}
        rows={3}
        className={cn(
          "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[80px]",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500",
          rtl && "direction-rtl text-right",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, helper, options, className, id, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        id={id}
        className={cn(
          "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none",
          error && "border-red-300",
          className,
        )}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps { className?: string; children: ReactNode; }

export function Card({ className, children }: CardProps) {
  return <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm", className)}>{children}</div>;
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn("px-6 py-4 border-b border-gray-100", className)}>{children}</div>;
}

export function CardBody({ className, children }: CardProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return <h3 className={cn("text-base font-semibold text-gray-900", className)}>{children}</h3>;
}

// ─── Table ───────────────────────────────────────────────────────────────────

export function Table({ className, children }: CardProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-sm text-left border-collapse", className)}>{children}</table>
    </div>
  );
}

export function Th({ className, children }: CardProps) {
  return <th className={cn("px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200", className)}>{children}</th>;
}

export function Td({ className, children }: CardProps) {
  return <td className={cn("px-4 py-3 text-sm text-gray-700 border-b border-gray-100", className)}>{children}</td>;
}

// ─── Alert ───────────────────────────────────────────────────────────────────

interface AlertProps { variant?: "info" | "warning" | "error" | "success"; className?: string; children: ReactNode; }

export function Alert({ variant = "info", className, children }: AlertProps) {
  return (
    <div className={cn(
      "rounded-md px-4 py-3 text-sm flex items-start gap-3",
      variant === "info" && "bg-blue-50 text-blue-800 border border-blue-200",
      variant === "warning" && "bg-yellow-50 text-yellow-800 border border-yellow-200",
      variant === "error" && "bg-red-50 text-red-800 border border-red-200",
      variant === "success" && "bg-green-50 text-green-800 border border-green-200",
      className,
    )}>
      {children}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600", className)} />
  );
}
