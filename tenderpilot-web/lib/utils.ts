import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function expiryLabel(dateStr: string | null | undefined): { label: string; status: "valid" | "expiring" | "expired" } {
  const days = daysUntil(dateStr);
  if (days === null) return { label: "No expiry set", status: "valid" };
  if (days < 0) return { label: `Expired ${Math.abs(days)} days ago`, status: "expired" };
  if (days === 0) return { label: "Expires today", status: "expiring" };
  if (days <= 30) return { label: `Expires in ${days} day${days === 1 ? "" : "s"}`, status: "expiring" };
  return { label: `Expires in ${days} days`, status: "valid" };
}

export function deadlineUrgency(closingDate: string): "urgent" | "warning" | "ok" {
  const days = daysUntil(closingDate);
  if (days === null) return "ok";
  if (days <= 3) return "urgent";
  if (days <= 7) return "warning";
  return "ok";
}
