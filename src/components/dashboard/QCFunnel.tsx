'use client';

import type { DashboardStats } from '@/types';

interface QCFunnelProps {
  data: DashboardStats['qc_pipeline'];
}

export default function QCFunnel({ data }: QCFunnelProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-bold text-foreground mb-4">QC Pipeline</h3>
      <div className="space-y-3">
        {data.map((stage) => (
          <div key={stage.stage}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium text-muted-foreground">{stage.stage}</span>
              <span className="text-[12px] font-bold text-foreground">{stage.count}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(stage.count / maxCount) * 100}%`,
                  backgroundColor: stage.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
