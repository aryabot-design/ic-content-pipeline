'use client';

import Header from '@/components/layout/Header';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, ExternalLink, ChevronDown, ChevronRight, Globe, Languages, Filter } from 'lucide-react';
import { cn, getStatusColor } from '@/lib/utils';
import type { Asset } from '@/types';

const ASSET_TYPES = ['All', 'Slide', 'Video', 'Snapshot Applet', 'InWorld Applet', 'Learning Applet', 'Practice Applet'];

export default function TrackerPage() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedChapter, setSelectedChapter] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/data?type=assets')
      .then(res => res.json())
      .then(data => {
        setAllAssets(data.assets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Derive grades and chapters
  const grades = useMemo(() =>
    [...new Set(allAssets.map(a => a.grade_code))].sort((a, b) => {
      return parseInt(a.replace('G', '')) - parseInt(b.replace('G', ''));
    }),
    [allAssets]
  );

  const chapters = useMemo(() => {
    if (selectedGrade === 'All') return [];
    const chaps = [...new Set(
      allAssets.filter(a => a.grade_code === selectedGrade).map(a => a.chapter_code)
    )].sort((a, b) => parseInt(a.replace('C', '')) - parseInt(b.replace('C', '')));
    return chaps;
  }, [allAssets, selectedGrade]);

  // Reset chapter when grade changes
  useEffect(() => {
    setSelectedChapter('All');
    setExpandedModules(new Set());
  }, [selectedGrade]);

  // Filter assets
  const filtered = useMemo(() => {
    let result = [...allAssets];
    if (selectedGrade !== 'All') result = result.filter(a => a.grade_code === selectedGrade);
    if (selectedChapter !== 'All') result = result.filter(a => a.chapter_code === selectedChapter);
    if (selectedType !== 'All') result = result.filter(a => a.asset_type === selectedType);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(a =>
        a.mid?.toLowerCase().includes(s) ||
        a.module_mid?.toLowerCase().includes(s) ||
        a.asset_tag_en?.toLowerCase().includes(s) ||
        a.allocated_to?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [allAssets, selectedGrade, selectedChapter, selectedType, search]);

  // Group by chapter > module
  const grouped = useMemo(() => {
    const map = new Map<string, {
      chapter: string;
      grade: string;
      modules: Map<string, {
        mid: string;
        assets: Asset[];
        owner: string;
        phase: string;
      }>;
    }>();

    filtered.forEach(a => {
      const chapterKey = `${a.grade_code}${a.chapter_code}`;
      if (!map.has(chapterKey)) {
        map.set(chapterKey, {
          chapter: a.chapter_code,
          grade: a.grade_code,
          modules: new Map(),
        });
      }
      const ch = map.get(chapterKey)!;
      const mKey = a.module_mid || 'Unknown';
      if (!ch.modules.has(mKey)) {
        ch.modules.set(mKey, {
          mid: mKey,
          assets: [],
          owner: a.allocated_to,
          phase: a.phase,
        });
      }
      ch.modules.get(mKey)!.assets.push(a);
    });

    return map;
  }, [filtered]);

  const toggleModule = (mid: string) => {
    const next = new Set(expandedModules);
    next.has(mid) ? next.delete(mid) : next.add(mid);
    setExpandedModules(next);
  };

  const expandAll = () => {
    const allMids = new Set<string>();
    grouped.forEach(ch => ch.modules.forEach((_, mid) => allMids.add(mid)));
    setExpandedModules(allMids);
  };

  const collapseAll = () => setExpandedModules(new Set());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <Header title="Asset Tracker" subtitle={`${filtered.length} assets across ${grouped.size} chapters`} />

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Asset ID, Module, Vendor..."
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

          {chapters.length > 0 && (
            <select
              value={selectedChapter}
              onChange={e => setSelectedChapter(e.target.value)}
              className="text-sm bg-muted rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="All">All Chapters</option>
              {chapters.map(c => (
                <option key={c} value={c}>Chapter {c.replace('C', '')}</option>
              ))}
            </select>
          )}

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="text-sm bg-muted rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {ASSET_TYPES.map(t => (
              <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 ml-auto">
            <button onClick={expandAll} className="text-xs text-accent hover:underline px-2 py-1">Expand All</button>
            <span className="text-muted-foreground">|</span>
            <button onClick={collapseAll} className="text-xs text-accent hover:underline px-2 py-1">Collapse All</button>
          </div>
        </div>
      </div>

      {/* Grouped View */}
      <div className="space-y-4">
        {Array.from(grouped.entries())
          .sort(([a], [b]) => {
            const gA = parseInt(a.replace(/[^0-9]/g, '').slice(0, -1) || '0');
            const gB = parseInt(b.replace(/[^0-9]/g, '').slice(0, -1) || '0');
            if (gA !== gB) return gA - gB;
            return a.localeCompare(b);
          })
          .map(([chapterKey, chapter]) => {
            const chapterAssets = Array.from(chapter.modules.values()).flatMap(m => m.assets);
            const chapterCompleted = chapterAssets.filter(a =>
              a.upload_status_en?.toLowerCase().includes('complete')
            ).length;
            const chapterRate = chapterAssets.length > 0 ? Math.round((chapterCompleted / chapterAssets.length) * 100) : 0;

            return (
              <div key={chapterKey} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Chapter Header */}
                <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                      {chapter.grade}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      Chapter {chapter.chapter.replace('C', '')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {chapter.modules.size} modules, {chapterAssets.length} assets
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${chapterRate}%`,
                          backgroundColor: chapterRate >= 80 ? '#10b981' : chapterRate >= 50 ? '#f59e0b' : '#6366f1',
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-8 text-right">{chapterRate}%</span>
                  </div>
                </div>

                {/* Modules */}
                {Array.from(chapter.modules.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([mid, mod]) => {
                    const isExpanded = expandedModules.has(mid);
                    const modCompleted = mod.assets.filter(a =>
                      a.upload_status_en?.toLowerCase().includes('complete')
                    ).length;

                    // Separate EN and ID status
                    const enAssets = mod.assets.map(a => ({
                      ...a,
                      hasEnLink: !!a.link_en,
                      enLinkStatus: a.link_en_status,
                      uploadEn: a.upload_status_en,
                    }));
                    const idAssets = mod.assets.map(a => ({
                      ...a,
                      hasIdLink: !!a.link_id,
                      idLinkStatus: a.link_id_status,
                      uploadId: a.upload_status_id,
                    }));

                    const enComplete = enAssets.filter(a => a.enLinkStatus?.toLowerCase().includes('correct')).length;
                    const idComplete = idAssets.filter(a => a.idLinkStatus?.toLowerCase().includes('correct')).length;
                    const enMissing = enAssets.filter(a => a.enLinkStatus?.toLowerCase().includes('missing') || a.enLinkStatus?.toLowerCase().includes('wrong')).length;
                    const idMissing = idAssets.filter(a => a.idLinkStatus?.toLowerCase().includes('missing') || a.idLinkStatus?.toLowerCase().includes('wrong')).length;

                    return (
                      <div key={mid} className="border-b border-border/60 last:border-b-0">
                        {/* Module Header */}
                        <button
                          onClick={() => toggleModule(mid)}
                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-smooth"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                            <span className="text-xs font-mono font-bold text-foreground">{mid}</span>
                            <span className="text-xs text-muted-foreground">{mod.assets.length} assets</span>
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{mod.phase}</span>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* EN/ID Status badges */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1" title="English assets">
                                <Globe size={11} className="text-blue-500" />
                                <span className="text-[10px] font-medium">
                                  <span className="text-emerald-600">{enComplete}</span>
                                  {enMissing > 0 && <span className="text-red-500 ml-0.5">/{enMissing} issues</span>}
                                </span>
                              </div>
                              <div className="flex items-center gap-1" title="Indonesian assets">
                                <Languages size={11} className="text-orange-500" />
                                <span className="text-[10px] font-medium">
                                  <span className="text-emerald-600">{idComplete}</span>
                                  {idMissing > 0 && <span className="text-red-500 ml-0.5">/{idMissing} issues</span>}
                                </span>
                              </div>
                            </div>

                            <span className="text-xs text-muted-foreground">
                              {modCompleted}/{mod.assets.length}
                            </span>
                          </div>
                        </button>

                        {/* Expanded Asset Table */}
                        {isExpanded && (
                          <div className="px-5 pb-4">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-muted-foreground border-b border-border">
                                  <th className="text-left py-2 font-medium w-28">Asset ID</th>
                                  <th className="text-left py-2 font-medium w-28">Type</th>
                                  <th className="text-left py-2 font-medium">Vendor</th>
                                  <th className="text-left py-2 font-medium">Upload</th>
                                  <th className="text-left py-2 font-medium">QC</th>
                                  <th className="text-left py-2 font-medium">Final Status</th>
                                  <th className="text-center py-2 font-medium">
                                    <div className="flex items-center justify-center gap-1">
                                      <Globe size={10} className="text-blue-500" /> EN
                                    </div>
                                  </th>
                                  <th className="text-center py-2 font-medium">
                                    <div className="flex items-center justify-center gap-1">
                                      <Languages size={10} className="text-orange-500" /> ID
                                    </div>
                                  </th>
                                  <th className="text-center py-2 font-medium">Links</th>
                                </tr>
                              </thead>
                              <tbody>
                                {mod.assets.map(asset => (
                                  <tr key={asset.mid} className="border-b border-border/30 last:border-b-0 hover:bg-muted/20">
                                    <td className="py-2 font-mono font-medium text-foreground">{asset.mid}</td>
                                    <td className="py-2">
                                      <span className={cn(
                                        'px-2 py-0.5 rounded-full text-[10px] font-medium',
                                        asset.asset_type === 'Slide' ? 'bg-indigo-50 text-indigo-600' :
                                        asset.asset_type === 'Video' ? 'bg-rose-50 text-rose-600' :
                                        'bg-emerald-50 text-emerald-600'
                                      )}>
                                        {asset.asset_type}
                                      </span>
                                    </td>
                                    <td className="py-2 text-muted-foreground">{asset.allocated_to}</td>
                                    <td className="py-2">
                                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', getStatusColor(asset.upload_status_en))}>
                                        {asset.upload_status_en || '-'}
                                      </span>
                                    </td>
                                    <td className="py-2">
                                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', getStatusColor(asset.qc_teacher_portal || asset.qc_ifp))}>
                                        {asset.qc_teacher_portal || asset.qc_ifp || '-'}
                                      </span>
                                    </td>
                                    <td className="py-2">
                                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', getStatusColor(asset.final_status))}>
                                        {asset.final_status || '-'}
                                      </span>
                                    </td>
                                    {/* EN Status */}
                                    <td className="py-2 text-center">
                                      <LinkStatusDot
                                        status={asset.link_en_status}
                                        hasLink={!!asset.link_en}
                                        uploadStatus={asset.upload_status_en}
                                      />
                                    </td>
                                    {/* ID Status */}
                                    <td className="py-2 text-center">
                                      <LinkStatusDot
                                        status={asset.link_id_status}
                                        hasLink={!!asset.link_id}
                                        uploadStatus={asset.upload_status_id}
                                      />
                                    </td>
                                    {/* Links */}
                                    <td className="py-2 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        {asset.link_en && (
                                          <a href={asset.link_en} target="_blank" rel="noopener noreferrer"
                                            className="text-blue-500 hover:text-blue-700" title="English link">
                                            <Globe size={12} />
                                          </a>
                                        )}
                                        {asset.link_id && (
                                          <a href={asset.link_id} target="_blank" rel="noopener noreferrer"
                                            className="text-orange-500 hover:text-orange-700" title="Indonesian link">
                                            <Languages size={12} />
                                          </a>
                                        )}
                                        {!asset.link_en && !asset.link_id && (
                                          <span className="text-muted-foreground text-[10px]">-</span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            );
          })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No assets found matching your filters.
        </div>
      )}
    </>
  );
}

function LinkStatusDot({ status, hasLink, uploadStatus }: { status: string; hasLink: boolean; uploadStatus: string }) {
  if (!status && !hasLink && !uploadStatus) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-200" title="No data" />;
  }

  const s = status?.toLowerCase() || '';
  const u = uploadStatus?.toLowerCase() || '';

  if (s.includes('correct')) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title={status || 'Correct'} />;
  }
  if (s.includes('wrong')) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" title={status || 'Wrong link'} />;
  }
  if (s.includes('missing')) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" title={status || 'Missing'} />;
  }
  if (u.includes('complete') || u.includes('uploaded')) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" title={uploadStatus || 'Uploaded'} />;
  }
  if (hasLink) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400" title="Link present" />;
  }
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" title="Pending" />;
}
