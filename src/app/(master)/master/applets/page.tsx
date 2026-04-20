'use client';

import Header from '@/components/layout/Header';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Asset } from '@/types';

const MAX_SLOTS = 7;

type StatusKey = 'All' | 'Not Started' | 'In Progress' | 'Completed';
const STATUS_OPTIONS: StatusKey[] = ['All', 'Not Started', 'In Progress', 'Completed'];

function assetStatus(a: Asset): Exclude<StatusKey, 'All'> {
  const upload = (a.upload_status_en || '').toLowerCase();
  const final = (a.final_status || '').toLowerCase();
  if (final.includes('completed') || final.includes('all qc') || upload.includes('complete') || upload.includes('uploaded')) {
    return 'Completed';
  }
  if (upload || final || a.qc_teacher_portal || a.qc_ifp || a.ready_for_review) {
    return 'In Progress';
  }
  return 'Not Started';
}

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

function statusDot(status: Exclude<StatusKey, 'All'>): string {
  switch (status) {
    case 'Completed': return 'bg-emerald-500';
    case 'In Progress': return 'bg-amber-500';
    case 'Not Started': return 'bg-slate-400';
  }
}

export default function AppletsPage() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedChapter, setSelectedChapter] = useState('All');
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<StatusKey>('All');

  useEffect(() => {
    fetch('/api/data?type=assets')
      .then(res => res.json())
      .then(data => {
        setAllAssets(data.assets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const appletAssets = useMemo(
    () => allAssets.filter(a => (a.asset_type || '').toLowerCase().includes('applet')),
    [allAssets]
  );

  const grades = useMemo(
    () =>
      [...new Set(appletAssets.map(a => a.grade_code).filter(Boolean))].sort(
        (a, b) => parseInt(a.replace('G', '')) - parseInt(b.replace('G', ''))
      ),
    [appletAssets]
  );

  const chapters = useMemo(() => {
    const source = selectedGrade === 'All' ? appletAssets : appletAssets.filter(a => a.grade_code === selectedGrade);
    return [...new Set(source.map(a => a.chapter_code).filter(Boolean))].sort(
      (a, b) => parseInt(a.replace('C', '')) - parseInt(b.replace('C', ''))
    );
  }, [appletAssets, selectedGrade]);

  const owners = useMemo(
    () => [...new Set(appletAssets.map(a => a.module_owner).filter(Boolean))].sort(),
    [appletAssets]
  );

  const vendors = useMemo(
    () => [...new Set(appletAssets.map(a => a.allocated_to).filter(Boolean))].sort(),
    [appletAssets]
  );

  // Reset chapter when grade changes to an incompatible value
  useEffect(() => {
    if (selectedChapter !== 'All' && !chapters.includes(selectedChapter)) {
      setSelectedChapter('All');
    }
  }, [chapters, selectedChapter]);

  const rows = useMemo(() => {
    const byModule = new Map<string, { module: string; grade: string; chapter: string; owner: string; slots: Asset[] }>();

    appletAssets.forEach(a => {
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
      const sorted = [...row.slots].sort((x, y) =>
        (x.mid || '').localeCompare(y.mid || '', undefined, { numeric: true })
      );
      const padded: (Asset | undefined)[] = [];
      for (let i = 0; i < MAX_SLOTS; i++) padded.push(sorted[i]);
      return { ...row, slots: padded };
    });

    result.sort((a, b) => a.module.localeCompare(b.module, undefined, { numeric: true }));

    const s = search.toLowerCase();
    return result.filter(r => {
      if (selectedGrade !== 'All' && r.grade !== selectedGrade) return false;
      if (selectedChapter !== 'All' && r.chapter !== selectedChapter) return false;
      if (selectedOwner !== 'All' && r.owner !== selectedOwner) return false;
      if (selectedVendor !== 'All' && !r.slots.some(slot => slot?.allocated_to === selectedVendor)) return false;
      if (selectedStatus !== 'All' && !r.slots.some(slot => slot && assetStatus(slot) === selectedStatus)) return false;
      if (s) {
        const matches =
          r.module.toLowerCase().includes(s) ||
          r.owner.toLowerCase().includes(s) ||
          r.slots.some(slot => slot?.allocated_to?.toLowerCase().includes(s) || slot?.mid?.toLowerCase().includes(s));
        if (!matches) return false;
      }
      return true;
    });
  }, [appletAssets, selectedGrade, selectedChapter, selectedOwner, selectedVendor, selectedStatus, search]);

  const columnTotals = useMemo(() => {
    const counts = new Array(MAX_SLOTS).fill(0);
    rows.forEach(r => r.slots.forEach((s, i) => { if (s) counts[i]++; }));
    return counts;
  }, [rows]);

  const statusCounts = useMemo(() => {
    const c = { 'Not Started': 0, 'In Progress': 0, 'Completed': 0 } as Record<Exclude<StatusKey, 'All'>, number>;
    rows.forEach(r => r.slots.forEach(slot => {
      if (slot) c[assetStatus(slot)]++;
    }));
    return c;
  }, [rows]);

  const hasActiveFilters =
    search !== '' ||
    selectedGrade !== 'All' ||
    selectedChapter !== 'All' ||
    selectedOwner !== 'All' ||
    selectedVendor !== 'All' ||
    selectedStatus !== 'All';

  const clearFilters = () => {
    setSearch('');
    setSelectedGrade('All');
    setSelectedChapter('All');
    setSelectedOwner('All');
    setSelectedVendor('All');
    setSelectedStatus('All');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const totalApplets = columnTotals.reduce((a, b) => a + b, 0);
  const selectClass = 'text-sm bg-muted rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-accent/30';

  return (
    <>
      <Header
        title="Applet Allocations"
        subtitle={`${rows.length} modules · ${totalApplets} applets across A1–A${MAX_SLOTS}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { key: 'total' as const, label: 'Applets', value: totalApplets, sub: `${rows.length} modules`, dot: 'bg-foreground/40', text: 'text-foreground' },
          { key: 'Completed' as const, label: 'Completed', value: statusCounts.Completed, dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
          { key: 'In Progress' as const, label: 'In Progress', value: statusCounts['In Progress'], dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
          { key: 'Not Started' as const, label: 'Not Started', value: statusCounts['Not Started'], dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400' },
        ].map(card => {
          const clickable = card.key !== 'total';
          const isActive = clickable && selectedStatus === card.key;
          const pct = totalApplets > 0 && clickable ? Math.round((card.value / totalApplets) * 100) : null;
          return (
            <button
              key={card.label}
              disabled={!clickable}
              onClick={() => clickable && setSelectedStatus(isActive ? 'All' : card.key)}
              className={cn(
                'text-left bg-card rounded-xl border border-border p-4 transition-smooth',
                clickable && 'hover:border-foreground/20 cursor-pointer',
                isActive && 'ring-2 ring-accent/60 border-transparent'
              )}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className={cn('w-1.5 h-1.5 rounded-full', card.dot)} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn('text-2xl font-bold', card.text)}>{card.value.toLocaleString()}</span>
                {pct !== null && <span className="text-xs text-muted-foreground">{pct}%</span>}
              </div>
              {card.sub && <div className="text-[11px] text-muted-foreground mt-1">{card.sub}</div>}
            </button>
          );
        })}
      </div>

      <div className="sticky top-0 z-20 -mx-6 px-6 py-3 bg-background/85 backdrop-blur-md border-b border-border/50 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search module, owner, vendor, asset ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className={selectClass}>
            <option value="All">All Grades</option>
            {grades.map(g => (
              <option key={g} value={g}>{g.replace('G', 'Grade ')}</option>
            ))}
          </select>

          <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} className={selectClass}>
            <option value="All">All Chapters</option>
            {chapters.map(c => (
              <option key={c} value={c}>Chapter {c.replace('C', '')}</option>
            ))}
          </select>

          <select value={selectedOwner} onChange={e => setSelectedOwner(e.target.value)} className={selectClass}>
            <option value="All">All Owners</option>
            {owners.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <select value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)} className={selectClass}>
            <option value="All">All Vendors</option>
            {vendors.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value as StatusKey)} className={selectClass}>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted transition-smooth"
            >
              <X size={12} />
              Clear
            </button>
          )}
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
                  {row.slots.map((slot, i) => {
                    if (!slot) return <td key={i} className="px-2 py-2"><span className="inline-block w-full h-6" /></td>;
                    const status = assetStatus(slot);
                    const dimVendor = selectedVendor !== 'All' && slot.allocated_to !== selectedVendor;
                    const dimStatus = selectedStatus !== 'All' && status !== selectedStatus;
                    const dim = dimVendor || dimStatus;
                    return (
                      <td key={i} className="px-2 py-2">
                        <span
                          className={cn(
                            'relative inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium w-full',
                            vendorColor(slot.allocated_to),
                            dim && 'opacity-30'
                          )}
                          title={`${slot.mid} · ${slot.allocated_to || 'Unassigned'} · ${status}`}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot(status))} />
                          <span className="truncate">{slot.allocated_to || '—'}</span>
                        </span>
                      </td>
                    );
                  })}
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
