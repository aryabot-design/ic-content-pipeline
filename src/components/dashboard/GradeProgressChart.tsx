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
      <h3 className="text-sm font-bold text-foreground mb-4">Progress by Grade</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} stroke="#666" />
            <YAxis type="category" dataKey="grade" width={65} fontSize={11} stroke="#666" />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Completion']}
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
            <Bar dataKey="completionRate" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.completionRate >= 80 ? '#0cce6b' : entry.completionRate >= 50 ? '#f5a623' : '#0070f3'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
