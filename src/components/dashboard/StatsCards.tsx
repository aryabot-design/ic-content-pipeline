'use client';

import { Package, CheckCircle2, Clock, ShieldCheck, Layers, BookOpen } from 'lucide-react';
import { cn, formatNumber, formatPercent } from '@/lib/utils';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Assets',
      value: formatNumber(stats.total_assets),
      icon: Package,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      sub: `${stats.total_modules} modules`,
    },
    {
      label: 'Completion Rate',
      value: formatPercent(stats.completion_rate),
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      sub: `${formatNumber(stats.uploaded_count)} uploaded`,
    },
    {
      label: 'Pending QC',
      value: formatNumber(stats.pending_qc),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      sub: 'awaiting review',
    },
    {
      label: 'QC Completed',
      value: formatNumber(stats.qc_completed),
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      sub: 'all QC passed',
    },
    {
      label: 'Grades',
      value: stats.total_grades.toString(),
      icon: Layers,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: `${stats.total_chapters} chapters`,
    },
    {
      label: 'Modules',
      value: formatNumber(stats.total_modules),
      icon: BookOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      sub: `across ${stats.total_grades} grades`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-smooth"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', card.bg)}>
              <card.icon size={16} className={card.color} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{card.value}</div>
          <div className="text-xs font-medium text-muted-foreground mt-0.5">{card.label}</div>
          <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
