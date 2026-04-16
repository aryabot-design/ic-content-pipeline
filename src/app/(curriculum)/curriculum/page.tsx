'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useCurriculumData } from '@/lib/curriculum-data';
import {
  computeCurriculumStats,
  THREADS,
  THREAD_COLORS,
  getUniqueValues,
  matchesSearch,
} from '@/lib/curriculum-stats';
import { Search } from 'lucide-react';

export default function CurriculumOverview() {
  const { modules, dataMeta } = useCurriculumData();
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => computeCurriculumStats(modules), [modules]);

  const threadData = useMemo(() => {
    return THREADS.map(thread => {
      const mods = modules.filter(m => m.thread === thread);
      const s = computeCurriculumStats(mods);
      const strands = getUniqueValues(mods, 'strand');
      return { thread, mods, stats: s, strands, color: THREAD_COLORS[thread] };
    });
  }, [modules]);

  const gradeData = useMemo(() => {
    const grades = getUniqueValues(modules, 'gradeCode');
    return grades.map(grade => {
      const mods = modules.filter(m => m.gradeCode === grade);
      const s = computeCurriculumStats(mods);
      return { grade, stats: s };
    });
  }, [modules]);

  const filtered = useMemo(() => {
    if (!searchQuery) return modules;
    return modules.filter(m => matchesSearch(m, searchQuery.toLowerCase()));
  }, [modules, searchQuery]);

  return (
    <>
      <Header
        title="Overview"
        subtitle="Curriculum Plan Tracker"
        lastSync={dataMeta?.updatedAt}
      />

      {/* Search */}
      <div className="mb-6">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 w-72">
          <Search size={14} className="text-[var(--text-tertiary)] shrink-0" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-foreground text-[13px] w-full placeholder:text-[var(--text-tertiary)]"
          />
        </div>
      </div>

      <div className="space-y-7 animate-fade-in">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard label="Total Modules" value={stats.total} sub={`Across ${THREADS.length} threads`} />
          <KPICard label="Completed" value={stats.completed} colorClass="text-success" sub="Module Completed" dotColor="bg-success" />
          <KPICard label="Content Ready" value={stats.contentReady} colorClass="text-info" sub="Content Completed" dotColor="bg-info" />
          <KPICard label="In Progress" value={stats.wip} colorClass="text-warning" sub="Content WIP" dotColor="bg-warning" />
          <KPICard label="Yet To Start" value={stats.yetToStart} sub="Not started" dotColor="bg-[var(--text-tertiary)]" />
          <KPICard
            label="Closure Rate"
            value={`${stats.closedPct}%`}
            colorClass={stats.closedPct >= 50 ? 'text-success' : stats.closedPct >= 25 ? 'text-warning' : ''}
            sub={`${stats.completed} of ${stats.total} modules`}
          />
        </div>

        {/* Thread Progress Cards */}
        <div>
          <div className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            Thread Progress
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)] bg-card border border-border px-2 py-0.5 rounded-full">
              {THREADS.length} threads
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {threadData.map(({ thread, stats: s, strands, color }) => (
              <Link
                key={thread}
                href={`/curriculum/${thread}`}
                className="bg-card border border-border rounded-xl p-5 hover:border-[#444] hover:-translate-y-px transition-smooth"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-bold text-foreground">{thread}</div>
                    <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                      {strands.length} strand{strands.length !== 1 ? 's' : ''} &middot; {s.total} modules
                    </div>
                  </div>
                  <div className="text-xl font-extrabold" style={{ color }}>{s.closedPct}%</div>
                </div>
                {/* Segmented progress bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden flex mb-3">
                  <div className="h-full bg-success" style={{ width: `${s.total ? (s.completed / s.total * 100) : 0}%` }} />
                  <div className="h-full bg-info" style={{ width: `${s.total ? (s.contentReady / s.total * 100) : 0}%` }} />
                  <div className="h-full bg-warning" style={{ width: `${s.total ? (s.wip / s.total * 100) : 0}%` }} />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <StatDot color="bg-success" label={`${s.completed} Done`} />
                  <StatDot color="bg-info" label={`${s.contentReady} Ready`} />
                  <StatDot color="bg-warning" label={`${s.wip} WIP`} />
                  <StatDot color="bg-[var(--text-tertiary)]" label={`${s.yetToStart} Pending`} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Grade Distribution */}
        <div>
          <div className="text-sm font-bold text-foreground mb-4">Grade Distribution</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {gradeData.map(({ grade, stats: s }) => (
              <div key={grade} className="bg-card border border-border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[13px] font-semibold text-foreground">Grade {grade.replace('G', '')}</span>
                  <span className="text-[13px] font-bold text-muted-foreground">{s.closedPct}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden flex mb-2">
                  <div className="h-full bg-success" style={{ width: `${s.total ? (s.completed / s.total * 100) : 0}%` }} />
                  <div className="h-full bg-info" style={{ width: `${s.total ? (s.contentReady / s.total * 100) : 0}%` }} />
                  <div className="h-full bg-warning" style={{ width: `${s.total ? (s.wip / s.total * 100) : 0}%` }} />
                </div>
                <div className="flex gap-3 text-[11px] text-[var(--text-tertiary)]">
                  <span>{s.total} modules</span>
                  <span>{s.completed} done</span>
                  <span>{s.yetToStart} pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function KPICard({ label, value, colorClass, sub, dotColor }: {
  label: string; value: number | string; colorClass?: string; sub: string; dotColor?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:border-[#444] transition-smooth">
      <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">{label}</div>
      <div className={`text-[28px] font-extrabold leading-none ${colorClass || 'text-foreground'}`}>{value}</div>
      <div className="text-[11px] text-[var(--text-tertiary)] mt-1.5 flex items-center gap-1">
        {dotColor && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} inline-block`} />}
        {sub}
      </div>
    </div>
  );
}

function StatDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <span className={`w-1.5 h-1.5 rounded-full ${color} inline-block`} />
      {label}
    </div>
  );
}
