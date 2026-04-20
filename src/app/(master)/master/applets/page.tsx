'use client';

import Header from '@/components/layout/Header';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, X, ExternalLink, UploadCloud, Clock, CheckCircle2, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Asset } from '@/types';

const MAX_SLOTS = 7;

type Language = 'en' | 'id';
type AppletState = 'not_ready' | 'ready' | 'uploaded' | 'completed';
type StateFilter = 'All' | AppletState;

const STATE_LABEL: Record<AppletState, string> = {
  not_ready: 'Not Ready',
  ready: 'Ready for Upload',
  uploaded: 'Uploaded',
  completed: 'Completed',
};

const STATE_META: Record<AppletState, {
  dot: string;
  text: string;
  bg: string;
  ring: string;
  icon: typeof Clock;
  short: string;
}> = {
  not_ready: { dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500/10', ring: 'ring-slate-500/50', icon: FileEdit, short: 'WIP' },
  ready: { dot: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-300', bg: 'bg-indigo-500/10', ring: 'ring-indigo-500/50', icon: UploadCloud, short: 'RDY' },
  uploaded: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-500/10', ring: 'ring-amber-500/50', icon: Clock, short: 'UP' },
  completed: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/50', icon: CheckCircle2, short: 'OK' },
};

function classifyApplet(a: Asset, lang: Language): AppletState {
  const link = lang === 'en' ? a.link_en : a.link_id;
  const status = (lang === 'en' ? a.upload_status_en : a.upload_status_id) || '';
  const s = status.toLowerCase();

  if (s.includes('qc') && (s.includes('complet') || s.includes('done'))) return 'completed';
  if (s.includes('upload')) return 'uploaded';
  if (link) return 'ready';
  return 'not_ready';
}

function vendorColor(vendor: string): string {
  if (!vendor) return 'bg-muted text-muted-foreground';
  const v = vendor.toLowerCase();
  if (v.includes('skyloom')) return 'text-emerald-700 dark:text-emerald-300';
  if (v.includes('anabler')) return 'text-orange-700 dark:text-orange-300';
  if (v.includes('internal')) return 'text-blue-700 dark:text-blue-300';
  if (v.includes('aswin')) return 'text-blue-700 dark:text-blue-300';
  if (v.includes('nishant')) return 'text-purple-700 dark:text-purple-300';
  return 'text-slate-700 dark:text-slate-300';
}

export default function AppletsPage() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedChapter, setSelectedChapter] = useState('All');
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [selectedState, setSelectedState] = useState<StateFilter>('All');

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
      if (selectedState !== 'All' && !r.slots.some(slot => slot && classifyApplet(slot, language) === selectedState)) return false;
      if (s) {
        const matches =
          r.module.toLowerCase().includes(s) ||
          r.owner.toLowerCase().includes(s) ||
          r.slots.some(slot => slot?.allocated_to?.toLowerCase().includes(s) || slot?.mid?.toLowerCase().includes(s));
        if (!matches) return false;
      }
      return true;
    });
  }, [appletAssets, language, selectedGrade, selectedChapter, selectedOwner, selectedVendor, selectedState, search]);

  const columnTotals = useMemo(() => {
    const counts = new Array(MAX_SLOTS).fill(0);
    rows.forEach(r => r.slots.forEach((s, i) => { if (s) counts[i]++; }));
    return counts;
  }, [rows]);

  const stateCounts = useMemo(() => {
    const c: Record<AppletState, number> = { not_ready: 0, ready: 0, uploaded: 0, completed: 0 };
    rows.forEach(r => r.slots.forEach(slot => {
      if (slot) c[classifyApplet(slot, language)]++;
    }));
    return c;
  }, [rows, language]);

  const hasActiveFilters =
    search !== '' ||
    selectedGrade !== 'All' ||
    selectedChapter !== 'All' ||
    selectedOwner !== 'All' ||
    selectedVendor !== 'All' ||
    selectedState !== 'All';

  const clearFilters = () => {
    setSearch('');
    setSelectedGrade('All');
    setSelectedChapter('All');
    setSelectedOwner('All');
    setSelectedVendor('All');
    setSelectedState('All');
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
        subtitle={`${rows.length} modules · ${totalApplets} applets · ${language === 'en' ? 'English' : 'Indonesian'}`}
      />

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="inline-flex bg-muted rounded-lg p-1">
          {(['en', 'id'] as Language[]).map(l => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-smooth',
                language === l ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {l === 'en' ? 'English' : 'Indonesian'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {(Object.keys(STATE_LABEL) as AppletState[]).map(key => {
          const meta = STATE_META[key];
          const Icon = meta.icon;
          const count = stateCounts[key];
          const pct = totalApplets > 0 ? Math.round((count / totalApplets) * 100) : 0;
          const isActive = selectedState === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedState(isActive ? 'All' : key)}
              className={cn(
                'text-left bg-card rounded-xl border border-border p-4 transition-smooth hover:border-foreground/20',
                isActive && `ring-2 ${meta.ring} border-transparent`
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide', meta.bg, meta.text)}>
                  <Icon size={11} />
                  {STATE_LABEL[key]}
                </div>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
              <div className="text-3xl font-bold text-foreground">{count.toLocaleString()}</div>
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', meta.dot)} style={{ width: `${pct}%` }} />
              </div>
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
            {grades.map(g => <option key={g} value={g}>{g.replace('G', 'Grade ')}</option>)}
          </select>

          <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} className={selectClass}>
            <option value="All">All Chapters</option>
            {chapters.map(c => <option key={c} value={c}>Chapter {c.replace('C', '')}</option>)}
          </select>

          <select value={selectedOwner} onChange={e => setSelectedOwner(e.target.value)} className={selectClass}>
            <option value="All">All Owners</option>
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)} className={selectClass}>
            <option value="All">All Vendors</option>
            {vendors.map(v => <option key={v} value={v}>{v}</option>)}
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
                    {row.owner && <div className="text-[10px] text-muted-foreground mt-0.5">{row.owner}</div>}
                  </td>
                  {row.slots.map((slot, i) => {
                    if (!slot) return <td key={i} className="px-2 py-2"><span className="inline-block w-full h-6" /></td>;
                    const state = classifyApplet(slot, language);
                    const meta = STATE_META[state];
                    const Icon = meta.icon;
                    const dimVendor = selectedVendor !== 'All' && slot.allocated_to !== selectedVendor;
                    const dimState = selectedState !== 'All' && state !== selectedState;
                    const dim = dimVendor || dimState;
                    const vendorLabel = slot.allocated_to || '—';
                    const link = language === 'en' ? slot.link_en : slot.link_id;
                    const isNotReady = state === 'not_ready';
                    const tooltip = `${slot.mid} · ${vendorLabel} · ${STATE_LABEL[state]}${link ? '\nClick to open' : ''}`;
                    const pillBase = cn(
                      'relative flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium w-full min-w-0',
                      meta.bg,
                      isNotReady && 'border border-dashed border-slate-400/40'
                    );
                    const content = (
                      <>
                        <Icon size={11} className={cn('shrink-0', meta.text)} />
                        <span className={cn('truncate flex-1', vendorColor(slot.allocated_to))}>{vendorLabel}</span>
                        {link && <ExternalLink size={9} className="shrink-0 opacity-60" />}
                      </>
                    );
                    return (
                      <td key={i} className="px-2 py-2">
                        <div className={cn('flex items-center gap-1', dim && 'opacity-30')}>
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(pillBase, 'hover:ring-1 hover:ring-foreground/30 transition-smooth cursor-pointer')}
                              title={tooltip}
                            >
                              {content}
                            </a>
                          ) : (
                            <span className={pillBase} title={tooltip}>
                              {content}
                            </span>
                          )}
                        </div>
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

        <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-border bg-muted/20 text-[11px]">
          <span className="text-muted-foreground font-semibold uppercase tracking-wide">Legend</span>
          {(Object.keys(STATE_LABEL) as AppletState[]).map(key => {
            const meta = STATE_META[key];
            const Icon = meta.icon;
            return (
              <span key={key} className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md', meta.bg, meta.text)}>
                <Icon size={11} />
                {STATE_LABEL[key]}
              </span>
            );
          })}
          <span className="text-muted-foreground ml-auto">Dashed border = storyboard / work-in-progress (no applet link yet)</span>
        </div>
      </div>
    </>
  );
}
