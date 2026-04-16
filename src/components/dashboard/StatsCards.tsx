'use client';

import { formatNumber, formatPercent } from '@/lib/utils';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Assets',
      value: formatNumber(stats.total_assets),
      colorClass: '',
      sub: `${stats.total_modules} modules`,
    },
    {
      label: 'Completion Rate',
      value: formatPercent(stats.completion_rate),
      colorClass: 'text-success',
      sub: `${formatNumber(stats.uploaded_count)} uploaded`,
    },
    {
      label: 'Pending QC',
      value: formatNumber(stats.pending_qc),
      colorClass: 'text-warning',
      sub: 'awaiting review',
    },
    {
      label: 'QC Completed',
      value: formatNumber(stats.qc_completed),
      colorClass: 'text-success',
      sub: 'all QC passed',
    },
    {
      label: 'Grades',
      value: stats.total_grades.toString(),
      colorClass: 'text-info',
      sub: `${stats.total_chapters} chapters`,
    },
    {
      label: 'Modules',
      value: formatNumber(stats.total_modules),
      colorClass: 'text-[var(--purple)]',
      sub: `across ${stats.total_grades} grades`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card rounded-xl border border-border p-5 hover:border-[#444] transition-smooth"
        >
          <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {card.label}
          </div>
          <div className={`text-[28px] font-extrabold leading-none ${card.colorClass || 'text-foreground'}`}>
            {card.value}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-1.5">
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
