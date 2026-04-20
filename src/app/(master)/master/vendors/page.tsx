'use client';

import Header from '@/components/layout/Header';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, Search, ExternalLink, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Asset } from '@/types';

type StatusKey = 'not_started' | 'ready_for_upload' | 'in_progress' | 'completed';

const STATUS_LABEL: Record<StatusKey, string> = {
  not_started: 'Not Started',
  ready_for_upload: 'Ready for Upload',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const STATUS_ACCENT: Record<StatusKey, { bar: string; text: string; bg: string; ring: string }> = {
  not_started: { bar: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-500/10', ring: 'ring-slate-500/50' },
  ready_for_upload: { bar: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-300', bg: 'bg-indigo-500/10', ring: 'ring-indigo-500/50' },
  in_progress: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-500/10', ring: 'ring-amber-500/50' },
  completed: { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/50' },
};

function classifyStatus(a: Asset): StatusKey {
  const upload = (a.upload_status_en || '').toLowerCase();
  const final = (a.final_status || '').toLowerCase();
  const ready = (a.ready_for_review || '').toLowerCase();
  const hasQc = Boolean(a.qc_teacher_portal || a.qc_ifp);

  if (
    final.includes('completed') ||
    final.includes('all qc') ||
    upload.includes('complete') ||
    upload.includes('uploaded')
  ) {
    return 'completed';
  }

  if (upload || hasQc || final) {
    return 'in_progress';
  }

  if (ready && !ready.includes('no') && !ready.includes('not')) {
    return 'ready_for_upload';
  }

  return 'not_started';
}

function VendorsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedVendor = searchParams.get('vendor');
  const selectedStatus = searchParams.get('status') as StatusKey | null;

  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [listSearch, setListSearch] = useState('');
  const [detailSearch, setDetailSearch] = useState('');

  useEffect(() => {
    fetch('/api/data?type=assets')
      .then(res => res.json())
      .then(data => {
        setAllAssets(data.assets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const vendors = useMemo(() => {
    const map = new Map<string, { name: string; assets: Asset[]; counts: Record<StatusKey, number> }>();
    allAssets.forEach(a => {
      const name = a.allocated_to || 'Unassigned';
      if (!map.has(name)) {
        map.set(name, {
          name,
          assets: [],
          counts: { not_started: 0, ready_for_upload: 0, in_progress: 0, completed: 0 },
        });
      }
      const entry = map.get(name)!;
      entry.assets.push(a);
      entry.counts[classifyStatus(a)]++;
    });
    return Array.from(map.values()).sort((a, b) => b.assets.length - a.assets.length);
  }, [allAssets]);

  const vendor = useMemo(
    () => (selectedVendor ? vendors.find(v => v.name === selectedVendor) : null),
    [vendors, selectedVendor]
  );

  const setParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    const qs = params.toString();
    router.replace(qs ? `/master/vendors?${qs}` : '/master/vendors', { scroll: false });
  };

  const filteredVendors = useMemo(() => {
    if (!listSearch) return vendors;
    const s = listSearch.toLowerCase();
    return vendors.filter(v => v.name.toLowerCase().includes(s));
  }, [vendors, listSearch]);

  const detailAssets = useMemo(() => {
    if (!vendor) return [];
    let result = vendor.assets;
    if (selectedStatus) result = result.filter(a => classifyStatus(a) === selectedStatus);
    if (detailSearch) {
      const s = detailSearch.toLowerCase();
      result = result.filter(a =>
        a.mid?.toLowerCase().includes(s) ||
        a.module_mid?.toLowerCase().includes(s) ||
        a.asset_type?.toLowerCase().includes(s) ||
        a.grade_code?.toLowerCase().includes(s)
      );
    }
    return result.sort((a, b) =>
      (a.mid || '').localeCompare(b.mid || '', undefined, { numeric: true })
    );
  }, [vendor, selectedStatus, detailSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // ===== Vendor list view =====
  if (!vendor) {
    return (
      <>
        <Header title="Vendors" subtitle={`${vendors.length} vendors · click a vendor to drill in`} />

        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search vendor..."
              value={listSearch}
              onChange={e => setListSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Vendor</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Total</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Not Started</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Ready</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">In Progress</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Completed</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map(v => {
                const total = v.assets.length;
                const rate = total > 0 ? Math.round((v.counts.completed / total) * 100) : 0;
                return (
                  <tr
                    key={v.name}
                    onClick={() => setParams({ vendor: v.name, status: null })}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-smooth"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-muted-foreground" />
                        <span className="font-medium text-foreground">{v.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{total}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{v.counts.not_started || '—'}</td>
                    <td className="px-4 py-3 text-right text-indigo-500">{v.counts.ready_for_upload || '—'}</td>
                    <td className="px-4 py-3 text-right text-amber-500">{v.counts.in_progress || '—'}</td>
                    <td className="px-4 py-3 text-right text-emerald-500">{v.counts.completed || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-8 text-right">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredVendors.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No vendors found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // ===== Vendor detail view =====
  const total = vendor.assets.length;
  const completionRate = total > 0 ? Math.round((vendor.counts.completed / total) * 100) : 0;

  return (
    <>
      <Header title={vendor.name} subtitle={`${total} assets assigned · ${completionRate}% complete`} />

      <button
        onClick={() => setParams({ vendor: null, status: null })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-smooth"
      >
        <ArrowLeft size={14} />
        All vendors
      </button>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {(Object.keys(STATUS_LABEL) as StatusKey[]).map(key => {
          const count = vendor.counts[key];
          const accent = STATUS_ACCENT[key];
          const isActive = selectedStatus === key;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <button
              key={key}
              onClick={() => setParams({ status: isActive ? null : key })}
              className={cn(
                'text-left bg-card rounded-xl border border-border p-4 transition-smooth hover:border-foreground/20',
                isActive && `ring-2 ${accent.ring} border-transparent`
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide', accent.bg, accent.text)}>
                  {STATUS_LABEL[key]}
                </div>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
              <div className="text-3xl font-bold text-foreground">{count}</div>
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', accent.bar)} style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search asset, module, grade..."
              value={detailSearch}
              onChange={e => setDetailSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {detailAssets.length} {detailAssets.length === 1 ? 'asset' : 'assets'}
            {selectedStatus && ` · ${STATUS_LABEL[selectedStatus]}`}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Asset</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Module</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Grade</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Links</th>
              </tr>
            </thead>
            <tbody>
              {detailAssets.map(a => {
                const status = classifyStatus(a);
                const accent = STATUS_ACCENT[status];
                return (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{a.mid}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.module_mid}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.grade_code}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.asset_type}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium', accent.bg, accent.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', accent.bar)} />
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {a.link_en && (
                          <a href={a.link_en} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            EN <ExternalLink size={10} />
                          </a>
                        )}
                        {a.link_id && (
                          <a href={a.link_id} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            ID <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {detailAssets.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No assets match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function VendorsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
      <VendorsPageInner />
    </Suspense>
  );
}
