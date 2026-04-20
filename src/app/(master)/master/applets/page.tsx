'use client';

import Header from '@/components/layout/Header';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Asset } from '@/types';

const MAX_SLOTS = 7;

function vendorColor(vendor: string): string {
  if (!vendor) return 'bg-muted text-muted-foreground';
  const v = vendor.toLowerCase();
  if (v.includes('skyloom')) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
  if (v.includes('anabler')) return 'bg-orange-500/15 text-orange-700 dark:text-orange-400';
  if (v.includes('internal')) return 'bg-blue-500/15 text-blue-700 dark:text-blue-400';
  if (v.includes('aswin')) return 'bg-blue-500/15 text-blue-700 dark:text-blue-400';
  if (v.includes('nishant')) return 'bg-purple-500/15 text-purple-700 dark:text-purple-400';
  return 'bg-slate-500/15 text-slate-700 dark:text-slate-400';
}

export default function AppletsPage() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');

  useEffect(() => {
    fetch('/api/data?type=assets')
      .then(res => res.json())
      .then(data => {
        setAllAssets(data.assets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const grades = useMemo(
    () =>
      [...new Set(allAssets.map(a => a.grade_code).filter(Boolean))].sort(
        (a, b) => parseInt(a.replace('G', '')) - parseInt(b.replace('G', ''))
      ),
    [allAssets]
  );

  const rows = useMemo(() => {
    const applets = allAssets.filter(a => (a.asset_type || '').toLowerCase().includes('applet'));
    const byModule = new Map<string, { module: string; grade: string; chapter: string; owner: string; slots: (Asset | undefined)[] }>();

    applets.forEach(a => {
      const mid = a.module_mid || 'Unknown';
      if (!byModule.has(mid)) {
        byModule.set(mid, {
          module: mid,
          grade: a.grade_code,
          chapter: a.chapter_code,
          owner: a.module_owner || '',
          slots: [],
        });
      }
      byModule.get(mid)!.slots.push(a);
    });

    const result = Array.from(byModule.values()).map(row => {
      const sorted = (row.slots.filter(Boolean) as Asset[]).sort((x, y) =>
        (x.mid || '').localeCompare(y.mid || '', undefined, { numeric: true })
      );
      const padded: (Asset | undefined)[] = [];
      for (let i = 0; i < MAX_SLOTS; i++) padded.push(sorted[i]);
      return { ...row, slots: padded };
    });

    result.sort((a, b) =>
      a.module.localeCompare(b.module, undefined, { numeric: true })
    );

    let filtered = result;
    if (selectedGrade !== 'All') filtered = filtered.filter(r => r.grade === selectedGrade);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.module.toLowerCase().includes(s) ||
        r.slots.some(slot => slot?.allocated_to?.toLowerCase().includes(s))
      );
    }
    return filtered;
  }, [allAssets, selectedGrade, search]);

  const columnTotals = useMemo(() => {
    const counts = new Array(MAX_SLOTS).fill(0);
    rows.forEach(r => r.slots.forEach((s, i) => { if (s) counts[i]++; }));
    return counts;
  }, [rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const totalApplets = columnTotals.reduce((a, b) => a + b, 0);

  return (
    <>
      <Header
        title="Applet Allocations"
        subtitle={`${rows.length} modules · ${totalApplets} applets across A1–A${MAX_SLOTS}`}
      />

      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search module or vendor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <select
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value)}
            className="text-sm bg-muted rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="All">All Grades</option>
            {grades.map(g => (
              <option key={g} value={g}>{g.replace('G', 'Grade ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground sticky left-0 bg-muted/50 z-10">
                  Module
                </th>
                {Array.from({ length: MAX_SLOTS }).map((_, i) => (
                  <th key={i} className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    <div>A{i + 1}</div>
                    <div className="text-[10px] font-normal text-muted-foreground/70 mt-0.5">{columnTotals[i]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.module} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium sticky left-0 bg-card z-10">
                    <div className="text-foreground">{row.module}</div>
                    {row.owner && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{row.owner}</div>
                    )}
                  </td>
                  {row.slots.map((slot, i) => (
                    <td key={i} className="px-2 py-2">
                      {slot ? (
                        <span
                          className={cn(
                            'inline-block px-2 py-1 rounded-md text-xs font-medium w-full truncate',
                            vendorColor(slot.allocated_to)
                          )}
                          title={`${slot.mid} · ${slot.allocated_to || 'Unassigned'}`}
                        >
                          {slot.allocated_to || '—'}
                        </span>
                      ) : (
                        <span className="inline-block w-full h-6" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={MAX_SLOTS + 1} className="px-4 py-12 text-center text-muted-foreground">
                    No applets match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
