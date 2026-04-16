'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useGrades } from '@/lib/hooks';
import { Loader2, ChevronRight, BookOpen, Layers, Package } from 'lucide-react';
import { cn, getGradeLabel } from '@/lib/utils';

export default function GradesPage() {
  const { grades, loading } = useGrades();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <Header title="Grades" subtitle="K-10 curriculum overview by grade" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {grades.map((grade) => {
          const rate = Math.round(grade.completion_rate);
          const ringSize = 80;
          const strokeWidth = 6;
          const radius = (ringSize - strokeWidth) / 2;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (rate / 100) * circumference;

          return (
            <Link
              key={grade.code}
              href={`/master/grades/${grade.code}`}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:border-accent/30 transition-smooth group"
            >
              {/* Completion Ring */}
              <div className="flex items-center justify-between mb-4">
                <div className="relative" style={{ width: ringSize, height: ringSize }}>
                  <svg width={ringSize} height={ringSize} className="-rotate-90">
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      fill="none"
                      stroke="#222"
                      strokeWidth={strokeWidth}
                    />
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      fill="none"
                      stroke={rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#6366f1'}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-foreground">{rate}%</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted-foreground group-hover:text-accent transition-smooth" />
              </div>

              {/* Grade Info */}
              <h3 className="text-base font-semibold text-foreground mb-3">
                {getGradeLabel(grade.code)}
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers size={13} />
                  <span>{grade.total_chapters} Chapters</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen size={13} />
                  <span>{grade.total_modules} Modules</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package size={13} />
                  <span>{grade.total_assets} Assets</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${rate}%`,
                    backgroundColor: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#6366f1',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>{grade.completed} done</span>
                <span>{grade.pending} pending</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
