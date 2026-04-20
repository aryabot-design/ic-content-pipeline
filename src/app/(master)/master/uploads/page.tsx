'use client';

import Header from '@/components/layout/Header';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, ExternalLink, X, UploadCloud, Clock, CheckCircle2, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Asset } from '@/types';

type Language = 'en' | 'id';
type UploadStatus = 'ready_for_upload' | 'uploaded_pending_qc' | 'qc_completed' | 'not_ready';

const STATUS_LABEL: Record<UploadStatus, string> = {
  ready_for_upload: 'Ready for Upload',
  uploaded_pending_qc: 'Uploaded – Pending QC',
  qc_completed: 'QC Completed',
  not_ready: 'Not Ready',
};

const STATUS_META: Record<UploadStatus, { dot: string; bg: string; text: string; ring: string; icon: typeof Clock }> = {
  ready_for_upload: { dot: 'bg-indigo-500', bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-300', ring: 'ring-indigo-500/50', icon: UploadCloud },
  uploaded_pending_qc: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-300', ring: 'ring-amber-500/50', icon: Clock },
  qc_completed: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-300', ring: 'ring-emerald-500/50', icon: CheckCircle2 },
  not_ready: { dot: 'bg-slate-400', bg: 'bg-slate-500/10', text: 'text-slate-500 dark:text-slate-400', ring: 'ring-slate-500/50', icon: Ban },
};

function classifyUpload(asset: Asset, lang: Language): UploadStatus {
  const link = lang === 'en' ? asset.link_en : asset.link_id;
  const status = (lang === 'en' ? asset.upload_status_en : asset.upload_status_id) || '';
  const s = status.toLowerCase();

  if (s.includes('qc') && (s.includes('complet') || s.includes('done'))) return 'qc_completed';
  if (s.includes('upload')) return 'uploaded_pending_qc';
  if (link) return 'ready_for_upload';
  return 'not_ready';
}

function pickLink(asset: Asset, lang: Language) {
  return lang === 'en' ? asset.link_en : asset.link_id;
}

export default function UploadsPage() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [selectedStatus, setSelectedStatus] = useState<UploadStatus>('ready_for_upload');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedChapter, setSelectedChapter] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');

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

  // Apply the non-status filters first so the counts reflect the filtered scope
  const scoped = useMemo(() => {
    let result = allAssets;
    if (selectedGrade !== 'All') result = result.filter(a => a.grade_code === selectedGrade);
    if (selectedChapter !== 'All') result = result.filter(a => a.chapter_code === selectedChapter);
    if (selectedVendor !== 'All') result = result.filter(a => a.allocated_to === selectedVendor);
    if (selectedType !== 'All') result = result.filter(a => a.asset_type === selectedType);
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
  }, [allAssets, selectedGrade, selectedChapter, selectedVendor, selectedType, search]);

  const statusCounts = useMemo(() => {
    const c: Record<UploadStatus, number> = { ready_for_upload: 0, uploaded_pending_qc: 0, qc_completed: 0, not_ready: 0 };
    scoped.forEach(a => { c[classifyUpload(a, language)]++; });
    return c;
  }, [scoped, language]);

  const visible = useMemo(() => {
    return scoped
      .filter(a => classifyUpload(a, language) === selectedStatus)
      .sort((a, b) => {
        const ga = parseInt((a.grade_code || '').replace('G', '')) || 0;
        const gb = parseInt((b.grade_code || '').replace('G', '')) || 0;
        if (ga !== gb) return ga - gb;
        return (a.mid || '').localeCompare(b.mid || '', undefined, { numeric: true });
      });
  }, [scoped, language, selectedStatus]);

  const hasActiveFilters =
    search !== '' ||
    selectedGrade !== 'All' ||
    selectedChapter !== 'All' ||
    selectedVendor !== 'All' ||
    selectedType !== 'All';

  const clearFilters = () => {
    setSearch('');
    setSelectedGrade('All');
    setSelectedChapter('All');
    setSelectedVendor('All');
    setSelectedType('All');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const scopedTotal = scoped.length;
  const selectClass = 'text-sm bg-muted rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-accent/30';

  return (
    <>
      <Header
        title="Upload Queue"
        subtitle={`Work list for the upload team · ${language === 'en' ? 'English' : 'Indonesian'}`}
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
        <div className="text-xs text-muted-foreground">
          {scopedTotal.toLocaleString()} assets in scope
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {(Object.keys(STATUS_LABEL) as UploadStatus[]).map(key => {
          const meta = STATUS_META[key];
          const Icon = meta.icon;
          const count = statusCounts[key];
          const pct = scopedTotal > 0 ? Math.round((count / scopedTotal) * 100) : 0;
          const isActive = selectedStatus === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={cn(
                'text-left bg-card rounded-xl border border-border p-4 transition-smooth hover:border-foreground/20',
                isActive && `ring-2 ${meta.ring} border-transparent`
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide', meta.bg, meta.text)}>
                  <Icon size={11} />
                  {STATUS_LABEL[key]}
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

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full', STATUS_META[selectedStatus].dot)} />
            <span className="text-sm font-semibold text-foreground">{STATUS_LABEL[selectedStatus]}</span>
            <span className="text-xs text-muted-foreground">· {visible.length} {visible.length === 1 ? 'asset' : 'assets'}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/20 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Asset</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Module</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Grade</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Vendor</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Raw Status</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Link</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(a => {
                const link = pickLink(a, language);
                const rawStatus = language === 'en' ? a.upload_status_en : a.upload_status_id;
                return (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{a.mid}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.module_mid}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.grade_code}{a.chapter_code && <span className="text-muted-foreground/60"> · {a.chapter_code}</span>}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.asset_type}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.allocated_to || '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{rawStatus || <span className="text-muted-foreground/50">—</span>}</td>
                    <td className="px-4 py-2.5">
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Open <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">No link</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nothing here. Try a different status or clear filters.
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
