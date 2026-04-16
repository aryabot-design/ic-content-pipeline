'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DashboardStats } from '@/types';

interface GradeProgressChartProps {
  data: DashboardStats['assets_by_grade'];
}

export default function GradeProgressChart({ data }: GradeProgressChartProps) {
  const chartData = data.map(d => ({
    ...d,
    grade: d.grade.replace('G', 'Grade '),
    completionRate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Progress by Grade</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} stroke="#94a3b8" />
            <YAxis type="category" dataKey="grade" width={65} fontSize={11} stroke="#94a3b8" />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Completion']}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="completionRate" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.completionRate >= 80 ? '#10b981' : entry.completionRate >= 50 ? '#f59e0b' : '#6366f1'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
