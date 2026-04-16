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
  const chartData = data.slice(0, 8).map(d => ({
    name: d.vendor.length > 15 ? d.vendor.slice(0, 15) + '...' : d.vendor,
    Completed: d.completed,
    Pending: d.pending,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-bold text-foreground mb-4">Vendor Workload (Top 8)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: -10, right: 10 }}>
            <XAxis dataKey="name" fontSize={10} stroke="#666" angle={-20} textAnchor="end" height={50} />
            <YAxis fontSize={11} stroke="#666" />
            <Tooltip
              contentStyle={{
                background: '#1a1a1a',
                border: '1px solid #2e2e2e',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#ededed',
              }}
              itemStyle={{ color: '#a1a1a1' }}
              labelStyle={{ color: '#ededed' }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#a1a1a1' }} />
            <Bar dataKey="Completed" stackId="a" fill="#0cce6b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Pending" stackId="a" fill="#f5a623" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
