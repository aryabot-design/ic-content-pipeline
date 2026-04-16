'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DashboardStats } from '@/types';

interface VendorWorkloadProps {
  data: DashboardStats['assets_by_vendor'];
}

export default function VendorWorkload({ data }: VendorWorkloadProps) {
  // Show top 8 vendors
  const chartData = data.slice(0, 8).map(d => ({
    name: d.vendor.length > 15 ? d.vendor.slice(0, 15) + '...' : d.vendor,
    Completed: d.completed,
    Pending: d.pending,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Vendor Workload (Top 8)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: -10, right: 10 }}>
            <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" angle={-20} textAnchor="end" height={50} />
            <YAxis fontSize={11} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
