'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useCurriculumData } from '@/lib/curriculum-data';
import {
  computeCurriculumStats,
  THREADS,
  THREAD_COLORS,
  getUniqueValues,
  groupBy,
  matchesSearch,
  getStatusColor,
  getStatusLabel,
  getTypeColor,
} from '@/lib/curriculum-stats';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortKey = 'conceptCode' | 'conceptName' | 'conceptType' | 'gradeCode' | 'chapterName' | 'status' | 'teamOwner' | 'individualOwner' | 'dateOfDelivery';
type Filter = 'all' | 'completed' | 'content-ready' | 'wip' | 'not-started';

const STATUS_ORDER: Record<string, number> = {
  'Module Completed': 0,
  'Content Completed': 1,
  'Content WIP': 2,
  'Yet To Start': 3,
};

export default function ThreadPage() {
  const params = useParams();
  const thread = decodeURIComponent(params.thread as string);
  const { modules, dataMeta } = useCurriculumData();
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [sortCol, setSortCol] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const isValidThread = (THREADS as readonly string[]).includes(thread);
  const threadModules = useMemo(() => modules.filter(m => m.thread === thread), [modules, thread]);
  const stats = useMemo(() => computeCurriculumStats(threadModules), [threadModules]);
  const strands = useMemo(() => groupBy(threadModules, 'strand'), [threadModules]);
  const grades = useMemo(() => getUniqueValues(threadModules, 'gradeCode'), [threadModules]);
  const color = THREAD_COLORS[thread] || '#0070f3';

  const filtered = useMemo(() => {
    let result = threadModules;
    if (filter === 'completed') result = result.filter(m => m.status === 'Module Completed');
    else if (filter === 'content-ready') result = result.filter(m => m.status === 'Content Completed');
    else if (filter === 'wip') result = result.filter(m => m.status === 'Content WIP');
    else if (filter === 'not-started') result = result.filter(m => m.status === 'Yet To Start' || !m.status);

    if (sortCol) {
      result = [...result].sort((a, b) => {
        let va: string | number = a[sortCol] || '';
        let vb: string | number = b[sortCol] || '';
        if (sortCol === 'status') {
          va = STATUS_ORDER[va as string] ?? 4;
          vb = STATUS_ORDER[vb as string] ?? 4;
        } else {
          va = (va as string).toLowerCase();
          vb = (vb as string).toLowerCase();
        }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [threadModules, filter, sortCol, sortDir]);

  const handleSort = (col: SortKey) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  if (!isValidThread) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Thread &quot;{thread}&quot; not found.
      </div>
    );
  }

  // Progress ring
  const ringSize = 40;
  const strokeWidth = 3;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (stats.closedPct / 100) * circumference;

  return (
    <>
      <Header title={thread} subtitle="Thread Detail" lastSync={dataMeta?.updatedAt} />

      <div className="space-y-4 animate-fade-in">
        {/* Collapsible summary header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl hover:border-[#444] transition-smooth"
        >
          <div className="flex items-center gap-3.5">
            {/* Progress Ring */}
            <div className="relative" style={{ width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="#222" strokeWidth={strokeWidth} />
                <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
                  strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                  className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-foreground">
                {stats.closedPct}%
              </div>
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-foreground">{thread} — Closure Progress</span>
              <span className="text-[12px] text-[var(--text-tertiary)] ml-3">
                {stats.completed}/{stats.total} completed &middot; {Object.keys(strands).length} strands &middot; {grades.join(', ')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[var(--text-tertiary)]">{collapsed ? 'Show details' : 'Hide details'}</span>
            <ChevronDown size={16} className={cn('text-[var(--text-tertiary)] transition-transform', !collapsed && 'rotate-180')} />
          </div>
        </button>

        {/* Collapsible body */}
        <div className={cn(
          'overflow-hidden transition-all duration-300',
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        )}>
          <div className="space-y-5">
            {/* Thread KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <MiniKPI label="Total Modules" value={stats.total} sub={`${Object.keys(strands).length} strands`} />
              <MiniKPI label="Completed" value={stats.completed} colorClass="text-success" dotColor="bg-success" />
              <MiniKPI label="Content Ready" value={stats.contentReady} colorClass="text-info" dotColor="bg-info" />
              <MiniKPI label="In Progress" value={stats.wip} colorClass="text-warning" dotColor="bg-warning" />
              <MiniKPI label="Yet To Start" value={stats.yetToStart} dotColor="bg-[var(--text-tertiary)]" />
            </div>

            {/* Strand Breakdown */}
            <div>
              <div className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                Strand Breakdown
                <span className="text-[11px] font-semibold text-[var(--text-tertiary)] bg-card border border-border px-2 py-0.5 rounded-full">
                  {Object.keys(strands).length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Object.entries(strands).map(([strand, sMods]) => {
                  const s = computeCurriculumStats(sMods);
                  return (
                    <div key={strand} className="bg-card border border-border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[13px] font-semibold text-foreground">{strand}</span>
                        <span className={cn('text-[13px] font-bold',
                          s.closedPct >= 75 ? 'text-success' : s.closedPct >= 25 ? 'text-warning' : 'text-[var(--text-tertiary)]'
                        )}>{s.closedPct}%</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden flex mb-2">
                        <div className="h-full bg-success" style={{ width: `${s.total ? (s.completed / s.total * 100) : 0}%` }} />
                        <div className="h-full bg-info" style={{ width: `${s.total ? (s.contentReady / s.total * 100) : 0}%` }} />
                        <div className="h-full bg-warning" style={{ width: `${s.total ? (s.wip / s.total * 100) : 0}%` }} />
                      </div>
                      <div className="flex gap-3 text-[11px] text-[var(--text-tertiary)]">
                        <span>{s.total} modules</span>
                        <span>{s.completed} done</span>
                        <span>{s.wip} WIP</span>
                        <span>{s.yetToStart} pending</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Filter pills + Table */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div className="text-sm font-bold text-foreground flex items-center gap-2">
              {thread} Modules
              <span className="text-[11px] font-semibold text-[var(--text-tertiary)] bg-card border border-border px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
            </div>
            <div className="flex gap-1.5">
              {(['all', 'completed', 'content-ready', 'wip', 'not-started'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1 rounded-md text-[12px] font-medium border transition-smooth',
                    filter === f
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-muted-foreground border-border hover:border-[#444] hover:text-foreground'
                  )}
                >
                  {f === 'all' ? 'All' : f === 'completed' ? 'Completed' : f === 'content-ready' ? 'Content Ready' : f === 'wip' ? 'In Progress' : 'Yet To Start'}
                </button>
              ))}
            </div>
          </div>

          {/* Data table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-muted">
                    {[
                      { key: 'conceptCode', label: 'Code' },
                      { key: 'conceptName', label: 'Module' },
                      { key: 'conceptType', label: 'Type' },
                      { key: 'gradeCode', label: 'Grade' },
                      { key: 'chapterName', label: 'Chapter' },
                      { key: 'status', label: 'Status' },
                      { key: 'teamOwner', label: 'Team' },
                      { key: 'individualOwner', label: 'Owner' },
                      { key: 'dateOfDelivery', label: 'Delivery' },
                    ].map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key as SortKey)}
                        className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] border-b border-border cursor-pointer hover:text-muted-foreground select-none whitespace-nowrap"
                      >
                        {col.label}
                        <span className={cn('ml-1 text-[10px]', sortCol === col.key ? 'opacity-100' : 'opacity-30')}>
                          {sortCol === col.key ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : '\u25B2'}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-[var(--text-tertiary)]">No modules found</td>
                    </tr>
                  ) : (
                    filtered.map((m, i) => (
                      <tr key={`${m.conceptCode}-${i}`} className="hover:bg-muted/50 transition-smooth">
                        <td className="px-4 py-2.5 border-b border-[var(--border-light)] font-mono text-[11px] text-[var(--text-tertiary)]">{m.conceptCode}</td>
                        <td className="px-4 py-2.5 border-b border-[var(--border-light)] font-medium text-foreground">{m.conceptName}</td>
                        <td className="px-4 py-2.5 border-b border-[var(--border-light)]">
                          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded', getTypeColor(m.conceptType))}>
                            {m.conceptType || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 border-b border-[var(--border-light)]">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-muted-foreground">{m.gradeCode}</span>
                        </td>
                        <td className="px-4 py-2.5 border-b border-[var(--border-light)] text-muted-foreground max-w-[200px] truncate">{m.chapterName}</td>
                        <td className="px-4 py-2.5 border-b border-[var(--border-light)]">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap', getStatusColor(m.status))}>
                            <span className={cn('w-1.5 h-1.5 rounded-full',
                              m.status === 'Module Completed' ? 'bg-success' :
                              m.status === 'Content Completed' ? 'bg-info' :
                              m.status === 'Content WIP' ? 'bg-warning' : 'bg-[var(--text-tertiary)]'
                            )} />
                            {getStatusLabel(m.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 border-b border-[var(--border-light)] text-muted-foreground">{m.teamOwner || '-'}</td>
                        <td className="px-4 py-2.5 border-b border-[var(--border-light)] text-muted-foreground">{m.individualOwner || '-'}</td>
                        <td className="px-4 py-2.5 border-b border-[var(--border-light)] text-[var(--text-tertiary)]">{m.dateOfDelivery || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MiniKPI({ label, value, colorClass, sub, dotColor }: {
  label: string; value: number; colorClass?: string; sub?: string; dotColor?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{label}</div>
      <div className={`text-xl font-extrabold leading-none ${colorClass || 'text-foreground'}`}>{value}</div>
      {(sub || dotColor) && (
        <div className="text-[11px] text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
          {dotColor && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} inline-block`} />}
          {sub || getStatusLabel(label)}
        </div>
      )}
    </div>
  );
}
