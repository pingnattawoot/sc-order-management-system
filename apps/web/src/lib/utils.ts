import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format cents as currency (USD)
 * @example formatCurrency(15000) => "$150.00"
 */
export function formatCurrency(cents: number | null | undefined): string {
  if (cents == null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/**
 * Format number with comma separators
 * @example formatNumber(1234567) => "1,234,567"
 */
export function formatNumber(num: number | null | undefined): string {
  if (num == null) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format date string to locale format
 * @example formatDate("2024-01-15T10:30:00Z") => "Jan 15, 2024, 10:30 AM"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
