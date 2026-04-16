'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAssets } from '@/lib/hooks';
import { Loader2, ChevronDown, ChevronRight, ArrowLeft, ExternalLink } from 'lucide-react';
import { cn, getGradeLabel, getStatusColor } from '@/lib/utils';
import { useState } from 'react';
import type { Asset } from '@/types';

export default function GradeDetailPage() {
  const params = useParams();
  const gradeCode = params.grade as string;
  const { assets, loading } = useAssets({ grade: gradeCode });
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Build tree
  const chapters = new Map<string, { assets: Asset[]; modules: Map<string, Asset[]> }>();
  assets.forEach(a => {
    const c = a.chapter_code;
    const m = a.module_mid;
    if (!chapters.has(c)) chapters.set(c, { assets: [], modules: new Map() });
    const chapter = chapters.get(c)!;
    chapter.assets.push(a);
    if (!chapter.modules.has(m)) chapter.modules.set(m, []);
    chapter.modules.get(m)!.push(a);
  });

  const toggleChapter = (c: string) => {
    const next = new Set(expandedChapters);
    next.has(c) ? next.delete(c) : next.add(c);
    setExpandedChapters(next);
  };

  const toggleModule = (m: string) => {
    const next = new Set(expandedModules);
    next.has(m) ? next.delete(m) : next.add(m);
    setExpandedModules(next);
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/grades" className="text-muted-foreground hover:text-foreground transition-smooth">
          <ArrowLeft size={18} />
        </Link>
        <Header title={getGradeLabel(gradeCode)} subtitle={`${assets.length} assets across ${chapters.size} chapters`} />
      </div>

      <div className="space-y-3">
        {Array.from(chapters.entries())
          .sort(([a], [b]) => {
            const numA = parseInt(a.replace('C', ''));
            const numB = parseInt(b.replace('C', ''));
            return numA - numB;
          })
          .map(([chapterCode, chapter]) => {
            const isExpanded = expandedChapters.has(chapterCode);
            const completed = chapter.assets.filter(a =>
              a.upload_status_en?.toLowerCase().includes('complete') ||
              a.final_status?.toLowerCase().includes('completed')
            ).length;
            const rate = Math.round((completed / chapter.assets.length) * 100);

            return (
              <div key={chapterCode} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapterCode)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-smooth"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="font-semibold text-sm">{chapterCode}</span>
                    <span className="text-sm text-muted-foreground">
                      {chapter.modules.size} modules, {chapter.assets.length} assets
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${rate}%`,
                          backgroundColor: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#6366f1',
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{rate}%</span>
                  </div>
                </button>

                {/* Modules */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {Array.from(chapter.modules.entries())
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([moduleMid, moduleAssets]) => {
                        const isModuleExpanded = expandedModules.has(moduleMid);
                        const moduleCompleted = moduleAssets.filter(a =>
                          a.upload_status_en?.toLowerCase().includes('complete')
                        ).length;

                        return (
                          <div key={moduleMid} className="border-b border-border last:border-b-0">
                            <button
                              onClick={() => toggleModule(moduleMid)}
                              className="w-full flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-smooth"
                            >
                              <div className="flex items-center gap-3">
                                {isModuleExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <span className="text-xs font-mono font-medium text-accent">{moduleMid}</span>
                                <span className="text-xs text-muted-foreground">
                                  {moduleAssets.length} assets
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {moduleCompleted}/{moduleAssets.length} complete
                              </span>
                            </button>

                            {/* Assets */}
                            {isModuleExpanded && (
                              <div className="px-6 pb-3">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-muted-foreground border-b border-border">
                                      <th className="text-left py-2 font-medium">Asset ID</th>
                                      <th className="text-left py-2 font-medium">Type</th>
                                      <th className="text-left py-2 font-medium">Allocated To</th>
                                      <th className="text-left py-2 font-medium">Upload Status</th>
                                      <th className="text-left py-2 font-medium">QC Status</th>
                                      <th className="text-left py-2 font-medium">Link</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {moduleAssets.map(asset => (
                                      <tr key={asset.mid} className="border-b border-border/50 last:border-b-0">
                                        <td className="py-2 font-mono font-medium">{asset.mid}</td>
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
                                            {asset.upload_status_en || 'N/A'}
                                          </span>
                                        </td>
                                        <td className="py-2">
                                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', getStatusColor(asset.final_status))}>
                                            {asset.final_status || asset.qc_teacher_portal || 'Pending'}
                                          </span>
                                        </td>
                                        <td className="py-2">
                                          {asset.link_en && (
                                            <a href={asset.link_en} target="_blank" rel="noopener noreferrer"
                                              className="text-accent hover:underline inline-flex items-center gap-1">
                                              <ExternalLink size={10} />
                                            </a>
                                          )}
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
                )}
              </div>
            );
          })}
      </div>
    </>
  );
}
