'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DashboardStats } from '@/types';

interface AssetTypeBreakdownProps {
  data: DashboardStats['assets_by_type'];
}

export default function AssetTypeBreakdown({ data }: AssetTypeBreakdownProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-bold text-foreground mb-4">Asset Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#1a1a1a',
                border: '1px solid #2e2e2e',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#ededed',
              }}
              itemStyle={{ color: '#a1a1a1' }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#a1a1a1' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
