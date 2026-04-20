'use client';

import Header from '@/components/layout/Header';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, ExternalLink, X, UploadCloud, Clock, CheckCircle2, FileEdit, ChevronDown, ChevronRight, FileSliders, Gamepad2, Video, CircleDashed } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Asset } from '@/types';

type Language = 'en' | 'id';
type AssetState = 'creator_wip' | 'ready' | 'uploaded' | 'completed' | 'no_content';

const STATE_LABEL: Record<AssetState, string> = {
  creator_wip: 'Creator WIP',
  ready: 'Ready for Upload',
  uploaded: 'Uploaded – Pending QC',
  completed: 'QC Completed',
  no_content: 'No Content',
};

const STATE_META: Record<AssetState, { dot: string; text: string; bg: string; icon: typeof Clock }> = {
  creator_wip: { dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500/10', icon: FileEdit },
  ready: { dot: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-300', bg: 'bg-indigo-500/10', icon: UploadCloud },
  uploaded: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-500/10', icon: Clock },
  completed: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  no_content: { dot: 'bg-slate-300 dark:bg-slate-700', text: 'text-muted-foreground', bg: 'bg-muted', icon: CircleDashed },
};

function classify(a: Asset, lang: Language): AssetState {
  const link = lang === 'en' ? a.link_en : a.link_id;
  const status = ((lang === 'en' ? a.upload_status_en : a.upload_status_id) || '').toLowerCase();

  if (status.includes('qc') && (status.includes('complet') || status.includes('done'))) return 'completed';
  if (status.includes('upload') && status.includes('complet')) return 'uploaded';
  if (status.includes('upload')) return 'uploaded';
  if (status.includes('progress') || status.includes('wip')) return 'creator_wip';
  if (link) return 'ready';
  return 'no_content';
}

function typeKey(assetType: string): 'slide' | 'applet' | 'video' | 'other' {
  const t = (assetType || '').toLowerCase();
  if (t.includes('slide')) return 'slide';
  if (t.includes('applet')) return 'applet';
  if (t.includes('video')) return 'video';
  return 'other';
}

function typeIcon(key: 'slide' | 'applet' | 'video' | 'other') {
  switch (key) {
    case 'slide': return FileSliders;
    case 'applet': return Gamepad2;
    case 'video': return Video;
    default: return CircleDashed;
  }
}

function typeColor(key: 'slide' | 'applet' | 'video' | 'other') {
  switch (key) {
    case 'slide': return 'text-indigo-500';
    case 'applet': return 'text-emerald-500';
    case 'video': return 'text-rose-500';
    default: return 'text-muted-foreground';
  }
}

interface ModuleGroup {
  mid: string;
  grade: string;
  chapter: string;
  owner: string;
  vendors: Set<string>;
  assets: Asset[];
  counts: Record<AssetState, number>;
  typeCounts: Record<'slide' | 'applet' | 'video' | 'other', { total: number; completed: number; uploaded: number; ready: number; wip: number }>;
}

export default function UploadsPage() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedChapter, setSelectedChapter] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedState, setSelectedState] = useState<'All' | AssetState>('All');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
    () => [...new Set(allAssets.map(a => a.grade_code).filter(Boolean))].sort(
      (a, b) => parseInt(a.replace('G', '')) - parseInt(b.replace('G', ''))
    ),
    [allAssets]
  );

  const chapters = useMemo(() => {
    const source = selectedGrade === 'All' ? allAssets : allAssets.filter(a => a.grade_code === selectedGrade);
    return [...new Set(source.map(a => a.chapter_code).filter(Boolean))].sort(
      (a, b) => parseInt(a.replace('C', '')) - parseInt(b.replace('C', ''))
    );
  }, [allAssets, selectedGrade]);

  useEffect(() => {
    if (selectedChapter !== 'All' && !chapters.includes(selectedChapter)) {
      setSelectedChapter('All');
    }
  }, [chapters, selectedChapter]);

  const vendors = useMemo(
    () => [...new Set(allAssets.map(a => a.allocated_to).filter(Boolean))].sort(),
    [allAssets]
  );

  const types = useMemo(
    () => [...new Set(allAssets.map(a => a.asset_type).filter(Boolean))].sort(),
    [allAssets]
  );

  const scopedAssets = useMemo(() => {
    let result = allAssets;
    if (selectedGrade !== 'All') result = result.filter(a => a.grade_code === selectedGrade);
    if (selectedChapter !== 'All') result = result.filter(a => a.chapter_code === selectedChapter);
    if (selectedVendor !== 'All') result = result.filter(a => a.allocated_to === selectedVendor);
    if (selectedType !== 'All') result = result.filter(a => a.asset_type === selectedType);
    if (selectedState !== 'All') result = result.filter(a => classify(a, language) === selectedState);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(a =>
        a.mid?.toLowerCase().includes(s) ||
        a.module_mid?.toLowerCase().includes(s) ||
        a.allocated_to?.toLowerCase().includes(s) ||
        a.asset_type?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [allAssets, language, selectedGrade, selectedChapter, selectedVendor, selectedType, selectedState, search]);

  const totalCounts = useMemo(() => {
    const c: Record<AssetState, number> = { creator_wip: 0, ready: 0, uploaded: 0, completed: 0, no_content: 0 };
    scopedAssets.forEach(a => { c[classify(a, language)]++; });
    return c;
  }, [scopedAssets, language]);

  const modules = useMemo<ModuleGroup[]>(() => {
    const map = new Map<string, ModuleGroup>();

    scopedAssets.forEach(a => {
      const mid = a.module_mid || 'Unknown';
      if (!map.has(mid)) {
        map.set(mid, {
          mid,
          grade: a.grade_code,
          chapter: a.chapter_code,
          owner: a.module_owner || '',
          vendors: new Set(),
          assets: [],
          counts: { creator_wip: 0, ready: 0, uploaded: 0, completed: 0, no_content: 0 },
          typeCounts: {
            slide: { total: 0, completed: 0, uploaded: 0, ready: 0, wip: 0 },
            applet: { total: 0, completed: 0, uploaded: 0, ready: 0, wip: 0 },
            video: { total: 0, completed: 0, uploaded: 0, ready: 0, wip: 0 },
            other: { total: 0, completed: 0, uploaded: 0, ready: 0, wip: 0 },
          },
        });
      }
      const group = map.get(mid)!;
      const state = classify(a, language);
      group.assets.push(a);
      group.counts[state]++;
      if (a.allocated_to) group.vendors.add(a.allocated_to);

      const tk = typeKey(a.asset_type);
      const tc = group.typeCounts[tk];
      tc.total++;
      if (state === 'completed') tc.completed++;
      else if (state === 'uploaded') tc.uploaded++;
      else if (state === 'ready') tc.ready++;
      else if (state === 'creator_wip') tc.wip++;
    });

    return Array.from(map.values()).sort((a, b) => {
      const ga = parseInt((a.grade || '').replace('G', '')) || 0;
      const gb = parseInt((b.grade || '').replace('G', '')) || 0;
      if (ga !== gb) return ga - gb;
      return a.mid.localeCompare(b.mid, undefined, { numeric: true });
    });
  }, [scopedAssets, language]);

  // Group by grade
  const byGrade = useMemo(() => {
    const map = new Map<string, ModuleGroup[]>();
    modules.forEach(m => {
      const g = m.grade || 'Unknown';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    });
    return Array.from(map.entries()).sort(([a], [b]) => {
      const na = parseInt(a.replace('G', '')) || 0;
      const nb = parseInt(b.replace('G', '')) || 0;
      return na - nb;
    });
  }, [modules]);

  const hasActiveFilters =
    search !== '' ||
    selectedGrade !== 'All' ||
    selectedChapter !== 'All' ||
    selectedVendor !== 'All' ||
    selectedType !== 'All' ||
    selectedState !== 'All';

  const clearFilters = () => {
    setSearch('');
    setSelectedGrade('All');
    setSelectedChapter('All');
    setSelectedVendor('All');
    setSelectedType('All');
    setSelectedState('All');
  };

  const toggle = (mid: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(mid)) next.delete(mid);
      else next.add(mid);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(modules.map(m => m.mid)));
  const collapseAll = () => setExpanded(new Set());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const scopedTotal = scopedAssets.length;
  const selectClass = 'text-sm bg-muted rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-accent/30';

  return (
    <>
      <Header
        title="Upload Queue"
        subtitle={`${modules.length} modules · ${scopedTotal.toLocaleString()} assets · ${language === 'en' ? 'English' : 'Indonesian'}`}
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
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-smooth"
          >
            Expand all
          </button>
          <button
            onClick={collapseAll}
            className="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-muted transition-smooth"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {(['ready', 'uploaded', 'completed', 'creator_wip', 'no_content'] as AssetState[]).map(key => {
          const meta = STATE_META[key];
          const Icon = meta.icon;
          const count = totalCounts[key];
          const pct = scopedTotal > 0 ? Math.round((count / scopedTotal) * 100) : 0;
          const isActive = selectedState === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedState(isActive ? 'All' : key)}
              className={cn(
                'text-left bg-card rounded-xl border border-border p-3 transition-smooth hover:border-foreground/20',
                isActive && 'ring-2 ring-accent/60 border-transparent'
              )}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon size={12} className={meta.text} />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{STATE_LABEL[key]}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{count.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{pct}%</span>
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
              placeholder="Search asset, module, vendor..."
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

          <select value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)} className={selectClass}>
            <option value="All">All Vendors</option>
            {vendors.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className={selectClass}>
            <option value="All">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
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

      {byGrade.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          Nothing matches. Try clearing filters.
        </div>
      )}

      <div className="space-y-6">
        {byGrade.map(([gradeCode, gradeModules]) => (
          <section key={gradeCode}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-sm font-semibold text-foreground">{gradeCode.replace('G', 'Grade ')}</span>
              <span className="text-xs text-muted-foreground">· {gradeModules.length} modules</span>
            </div>
            <div className="space-y-2">
              {gradeModules.map(mod => <ModuleCapsule key={mod.mid} mod={mod} isOpen={expanded.has(mod.mid)} onToggle={() => toggle(mod.mid)} language={language} />)}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function ModuleCapsule({ mod, isOpen, onToggle, language }: { mod: ModuleGroup; isOpen: boolean; onToggle: () => void; language: Language }) {
  const total = mod.assets.length;
  const done = mod.counts.completed;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const Chevron = isOpen ? ChevronDown : ChevronRight;
  const uploadedOrDone = mod.counts.uploaded + mod.counts.completed;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden transition-smooth">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-smooth text-left"
      >
        <Chevron size={16} className="text-muted-foreground shrink-0" />

        <div className="min-w-0 shrink-0">
          <div className="font-mono text-sm font-semibold text-foreground">{mod.mid}</div>
          {mod.owner && <div className="text-[10px] text-muted-foreground mt-0.5">{mod.owner}</div>}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap ml-2">
          {(['slide', 'applet', 'video'] as const).map(tk => {
            const counts = mod.typeCounts[tk];
            if (counts.total === 0) return null;
            const Icon = typeIcon(tk);
            const pendingCount = counts.total - counts.completed;
            const allDone = pendingCount === 0;
            return (
              <span
                key={tk}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium',
                  allDone ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted',
                )}
                title={`${tk}: ${counts.completed}/${counts.total} done · ${counts.uploaded} uploaded · ${counts.ready} ready · ${counts.wip} WIP`}
              >
                <Icon size={11} className={allDone ? '' : typeColor(tk)} />
                <span className="capitalize">{tk}s</span>
                <span className="text-muted-foreground/80 font-mono">{counts.completed}/{counts.total}</span>
              </span>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {mod.counts.ready > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />{mod.counts.ready} ready</span>}
            {mod.counts.uploaded > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{mod.counts.uploaded} uploaded</span>}
            {mod.counts.creator_wip > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />{mod.counts.creator_wip} WIP</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-medium text-muted-foreground tabular-nums">{done}/{total}</span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">Asset</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">Vendor</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">State</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">Raw Status</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">Link</th>
                </tr>
              </thead>
              <tbody>
                {mod.assets
                  .slice()
                  .sort((a, b) => (a.mid || '').localeCompare(b.mid || '', undefined, { numeric: true }))
                  .map(a => {
                    const state = classify(a, language);
                    const meta = STATE_META[state];
                    const Icon = meta.icon;
                    const link = language === 'en' ? a.link_en : a.link_id;
                    const rawStatus = language === 'en' ? a.upload_status_en : a.upload_status_id;
                    return (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2 font-mono text-xs">{a.mid}</td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">{a.asset_type}</td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">{a.allocated_to || '—'}</td>
                        <td className="px-4 py-2">
                          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium', meta.bg, meta.text)}>
                            <Icon size={11} />
                            {STATE_LABEL[state]}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">
                          {rawStatus || <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="px-4 py-2">
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Open <ExternalLink size={10} />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">No link</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
