'use client';

import type { DashboardStats } from '@/types';

interface PhaseComparisonProps {
  data: DashboardStats['assets_by_phase'];
}

export default function PhaseComparison({ data }: PhaseComparisonProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Phase Progress</h3>
      <div className="space-y-4">
        {data.map((phase) => {
          const rate = phase.total > 0 ? Math.round((phase.completed / phase.total) * 100) : 0;
          return (
            <div key={phase.phase} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{phase.phase || 'Unknown'}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {phase.completed}/{phase.total}
                  </span>
                  <span className="text-sm font-bold text-foreground">{rate}%</span>
                </div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${rate}%`,
                    background: rate >= 80
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : rate >= 50
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #6366f1, #818cf8)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
