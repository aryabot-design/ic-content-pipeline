'use client';

import { useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useCurriculumData } from '@/lib/curriculum-data';
import {
  computeCurriculumStats,
  groupBy,
  getUniqueValues,
} from '@/lib/curriculum-stats';

export default function TeamsPage() {
  const { modules, dataMeta } = useCurriculumData();

  const stats = useMemo(() => computeCurriculumStats(modules), [modules]);
  const teams = useMemo(() => {
    const grouped = groupBy(modules, 'teamOwner');
    return Object.entries(grouped)
      .filter(([name]) => name && name !== '(None)')
      .sort((a, b) => b[1].length - a[1].length);
  }, [modules]);

  return (
    <>
      <Header title="Team Performance" subtitle="Curriculum Plan Tracker" lastSync={dataMeta?.updatedAt} />

      <div className="space-y-6 animate-fade-in">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Teams</div>
            <div className="text-[28px] font-extrabold text-foreground leading-none">{teams.length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Total Modules</div>
            <div className="text-[28px] font-extrabold text-foreground leading-none">{stats.total}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Overall Closure</div>
            <div className={`text-[28px] font-extrabold leading-none ${stats.closedPct >= 50 ? 'text-success' : 'text-foreground'}`}>
              {stats.closedPct}%
            </div>
          </div>
        </div>

        {/* Team Cards */}
        <div>
          <div className="text-sm font-bold text-foreground mb-4">Team Breakdown</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(([team, mods]) => {
              const s = computeCurriculumStats(mods);
              const members = groupBy(mods, 'individualOwner');
              const threads = getUniqueValues(mods, 'thread');

              return (
                <div key={team} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-foreground">{team}</span>
                    <span className="text-[12px] text-[var(--text-tertiary)]">{s.total} modules</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden flex mb-3">
                    <div className="h-full bg-success" style={{ width: `${s.total ? (s.completed / s.total * 100) : 0}%` }} />
                    <div className="h-full bg-info" style={{ width: `${s.total ? (s.contentReady / s.total * 100) : 0}%` }} />
                    <div className="h-full bg-warning" style={{ width: `${s.total ? (s.wip / s.total * 100) : 0}%` }} />
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3 flex-wrap mb-2">
                    <StatDot color="bg-success" label={`${s.completed} Done (${s.closedPct}%)`} />
                    <StatDot color="bg-info" label={`${s.contentReady} Ready`} />
                    <StatDot color="bg-warning" label={`${s.wip} WIP`} />
                    <StatDot color="bg-[var(--text-tertiary)]" label={`${s.yetToStart} Pending`} />
                  </div>

                  <div className="text-[11px] text-[var(--text-tertiary)] mb-3">
                    Threads: {threads.join(', ')}
                  </div>

                  {/* Individual Contributors */}
                  {Object.entries(members).filter(([name]) => name && name !== '(None)').length > 0 && (
                    <div className="border-t border-border pt-3 mt-1">
                      <div className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                        Individual Contributors
                      </div>
                      {Object.entries(members)
                        .filter(([name]) => name && name !== '(None)')
                        .map(([name, memberMods]) => {
                          const ms = computeCurriculumStats(memberMods);
                          return (
                            <div key={name} className="flex justify-between items-center py-1 text-[12px]">
                              <span className="text-muted-foreground">{name}</span>
                              <span className="text-[var(--text-tertiary)] font-semibold">
                                {ms.completed}/{ms.total} ({ms.closedPct}%)
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
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
