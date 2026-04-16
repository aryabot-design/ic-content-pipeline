import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

export function formatPercent(num: number): string {
  return `${Math.round(num)}%`;
}

export function getStatusColor(status: string): string {
  const s = status?.toLowerCase() || '';
  if (s.includes('complete') || s.includes('uploaded') || s.includes('ready') || s.includes('checked')) return 'text-emerald-600 bg-emerald-50';
  if (s.includes('progress') || s.includes('pending') || s.includes('review')) return 'text-amber-600 bg-amber-50';
  if (s.includes('error') || s.includes('wrong') || s.includes('missing')) return 'text-red-600 bg-red-50';
  return 'text-slate-600 bg-slate-50';
}

export function getAssetTypeColor(type: string): string {
  switch (type) {
    case 'Slide': return '#6366f1';
    case 'Video': return '#f43f5e';
    case 'Snapshot Applet': return '#10b981';
    case 'InWorld Applet': return '#f59e0b';
    case 'Learning Applet': return '#3b82f6';
    case 'Practice Applet': return '#8b5cf6';
    default: return '#94a3b8';
  }
}

export function getGradeLabel(code: string): string {
  const num = code.replace('G', '');
  return `Grade ${num}`;
}
