'use client';

import Header from '@/components/layout/Header';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Globe, Languages, ArrowDown, Package, FileSliders, Gamepad2, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Asset } from '@/types';

export default function PipelinePage() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'creator' | 'grade'>('overview');
  const [selectedPhase, setSelectedPhase] = useState('All');

  useEffect(() => {
    fetch('/api/data?type=assets')
      .then(res => res.json())
      .then(data => {
        setAllAssets(data.assets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Derive available phases
  const phases = useMemo(() => {
    return [...new Set(allAssets.map(a => a.phase).filter(Boolean))].sort();
  }, [allAssets]);

  // Filter by phase
  const assets = useMemo(() => {
    if (selectedPhase === 'All') return allAssets;
    return allAssets.filter(a => a.phase === selectedPhase);
  }, [allAssets, selectedPhase]);

  // Compute module-level stats
  const moduleMap = useMemo(() => {
    const map = new Map<string, {
      mid: string;
      grade: string;
      owner: string;
      phase: string;
      assets: Asset[];
    }>();
    assets.forEach(a => {
      const m = a.module_mid || 'Unknown';
      if (!map.has(m)) {
        map.set(m, { mid: m, grade: a.grade_code, owner: a.allocated_to, phase: a.phase, assets: [] });
      }
      map.get(m)!.assets.push(a);
    });
    return map;
  }, [assets]);

  // EN pipeline stats (module-level)
  const enStats = useMemo(() => computePipelineStats(assets, moduleMap, 'en'), [assets, moduleMap]);
  const idStats = useMemo(() => computePipelineStats(assets, moduleMap, 'id'), [assets, moduleMap]);

  // Creator-wise breakdown (by Module Owner / SME)
  const creatorStats = useMemo(() => {
    const creators = new Map<string, Asset[]>();
    assets.forEach(a => {
      const c = a.module_owner || 'Unassigned';
      if (!creators.has(c)) creators.set(c, []);
      creators.get(c)!.push(a);
    });
    const result: { name: string; en: PipelineNumbers; id: PipelineNumbers; totalModules: number }[] = [];
    creators.forEach((creatorAssets, name) => {
      const cModMap = new Map<string, { mid: string; grade: string; owner: string; phase: string; assets: Asset[] }>();
      creatorAssets.forEach(a => {
        const m = a.module_mid || 'Unknown';
        if (!cModMap.has(m)) cModMap.set(m, { mid: m, grade: a.grade_code, owner: a.module_owner, phase: a.phase, assets: [] });
        cModMap.get(m)!.assets.push(a);
      });
      result.push({
        name,
        en: computePipelineNumbers(creatorAssets, cModMap, 'en'),
        id: computePipelineNumbers(creatorAssets, cModMap, 'id'),
        totalModules: cModMap.size,
      });
    });
    return result.sort((a, b) => b.totalModules - a.totalModules);
  }, [assets]);

  // Grade-wise breakdown
  const gradeStats = useMemo(() => {
    const grades = new Map<string, Asset[]>();
    assets.forEach(a => {
      const g = a.grade_code;
      if (!grades.has(g)) grades.set(g, []);
      grades.get(g)!.push(a);
    });
    const result: { name: string; en: PipelineNumbers; id: PipelineNumbers; totalModules: number }[] = [];
    grades.forEach((gradeAssets, name) => {
      const gModMap = new Map<string, { mid: string; grade: string; owner: string; phase: string; assets: Asset[] }>();
      gradeAssets.forEach(a => {
        const m = a.module_mid || 'Unknown';
        if (!gModMap.has(m)) gModMap.set(m, { mid: m, grade: a.grade_code, owner: a.allocated_to, phase: a.phase, assets: [] });
        gModMap.get(m)!.assets.push(a);
      });
      result.push({
        name,
        en: computePipelineNumbers(gradeAssets, gModMap, 'en'),
        id: computePipelineNumbers(gradeAssets, gModMap, 'id'),
        totalModules: gModMap.size,
      });
    });
    return result.sort((a, b) => {
      const numA = parseInt(a.name.replace('G', ''));
      const numB = parseInt(b.name.replace('G', ''));
      return numA - numB;
    });
  }, [assets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const totalModules = moduleMap.size;

  return (
    <>
      <Header title="Module Upload Pipeline" subtitle={`${totalModules} modules, ${assets.length} total assets`} />

      {/* Tabs + Phase Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
          {(['overview', 'creator', 'grade'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-smooth',
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'overview' ? 'Pipeline Overview' : t === 'creator' ? 'Creator-wise' : 'Grade-wise'}
            </button>
          ))}
        </div>

        <select
          value={selectedPhase}
          onChange={e => setSelectedPhase(e.target.value)}
          className="text-sm bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="All">All Phases</option>
          {phases.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* English Pipeline */}
          <PipelineCard
            title="English"
            icon={<Globe size={16} className="text-blue-500" />}
            color="blue"
            stats={enStats}
            totalModules={totalModules}
          />
          {/* Indonesian Pipeline */}
          <PipelineCard
            title="Indonesian"
            icon={<Languages size={16} className="text-orange-500" />}
            color="orange"
            stats={idStats}
            totalModules={totalModules}
          />
        </div>
      )}

      {tab === 'creator' && (
        <div className="space-y-6">
          <BreakdownTable
            title="Module Owner (SME) Breakdown"
            rows={creatorStats}
            nameLabel="Module Owner"
          />
        </div>
      )}

      {tab === 'grade' && (
        <div className="space-y-6">
          <BreakdownTable
            title="Grade-wise Breakdown"
            rows={gradeStats}
            nameLabel="Grade"
          />
        </div>
      )}
    </>
  );
}

/* ──────────── Types ──────────── */

interface PipelineNumbers {
  uploadedComplete: number;
  pendingReview: number;
  readyForUpload: number;
  inProgress: number;
  requireReUpload: number;
  // Asset-level counts by type for "Ready for Upload" and "In Progress"
  readySlides: number;
  readyApplets: number;
  readyVideos: number;
  progressSlides: number;
  progressApplets: number;
  progressVideos: number;
  totalSlides: number;
  totalApplets: number;
  totalVideos: number;
}

interface PipelineStats extends PipelineNumbers {
  totalModules: number;
  totalAssets: number;
}

/* ──────────── Compute helpers ──────────── */

function computePipelineNumbers(
  assets: Asset[],
  moduleMap: Map<string, { mid: string; assets: Asset[]; [key: string]: unknown }>,
  lang: 'en' | 'id'
): PipelineNumbers {
  const isEn = lang === 'en';

  // Count by asset type
  const slides = assets.filter(a => a.asset_type === 'Slide');
  const applets = assets.filter(a => a.asset_type?.includes('Applet'));
  const videos = assets.filter(a => a.asset_type === 'Video');

  let uploadedComplete = 0;
  let pendingReview = 0;
  let readyForUpload = 0;
  let inProgress = 0;
  let requireReUpload = 0;

  moduleMap.forEach(mod => {
    const status = getModuleUploadStatus(mod.assets, lang);
    if (status === 'uploaded') uploadedComplete++;
    else if (status === 'pending_review') pendingReview++;
    else if (status === 'ready') readyForUpload++;
    else if (status === 'reupload') requireReUpload++;
    else inProgress++;
  });

  const getAssetStatus = (a: Asset) => {
    const uploadStatus = isEn ? a.upload_status_en : a.upload_status_id;
    const linkStatus = isEn ? a.link_en_status : a.link_id_status;
    const u = uploadStatus?.toLowerCase() || '';
    const l = linkStatus?.toLowerCase() || '';
    if (u.includes('complete') || u.includes('uploaded')) return 'uploaded';
    if (l.includes('correct') || a.ready_for_review?.toLowerCase().includes('closed')) return 'ready';
    return 'progress';
  };

  const readyAssets = assets.filter(a => getAssetStatus(a) === 'ready');
  const progressAssets = assets.filter(a => getAssetStatus(a) === 'progress');

  return {
    uploadedComplete,
    pendingReview,
    readyForUpload,
    inProgress,
    requireReUpload,
    readySlides: readyAssets.filter(a => a.asset_type === 'Slide').length,
    readyApplets: readyAssets.filter(a => a.asset_type?.includes('Applet')).length,
    readyVideos: readyAssets.filter(a => a.asset_type === 'Video').length,
    progressSlides: progressAssets.filter(a => a.asset_type === 'Slide').length,
    progressApplets: progressAssets.filter(a => a.asset_type?.includes('Applet')).length,
    progressVideos: progressAssets.filter(a => a.asset_type === 'Video').length,
    totalSlides: slides.length,
    totalApplets: applets.length,
    totalVideos: videos.length,
  };
}

function computePipelineStats(
  assets: Asset[],
  moduleMap: Map<string, { mid: string; assets: Asset[]; [key: string]: unknown }>,
  lang: 'en' | 'id'
): PipelineStats {
  return {
    ...computePipelineNumbers(assets, moduleMap, lang),
    totalModules: moduleMap.size,
    totalAssets: assets.length,
  };
}

function getModuleUploadStatus(assets: Asset[], lang: 'en' | 'id'): string {
  const isEn = lang === 'en';
  const statuses = assets.map(a => {
    const upload = isEn ? a.upload_status_en : a.upload_status_id;
    const link = isEn ? a.link_en_status : a.link_id_status;
    const u = upload?.toLowerCase() || '';
    const l = link?.toLowerCase() || '';
    if (u.includes('complete') || u.includes('uploaded')) return 'uploaded';
    if (l.includes('wrong') || l.includes('re-upload')) return 'reupload';
    if (u.includes('pending') || u.includes('review')) return 'pending_review';
    if (l.includes('correct') || a.ready_for_review?.toLowerCase().includes('closed')) return 'ready';
    return 'progress';
  });

  if (statuses.every(s => s === 'uploaded')) return 'uploaded';
  if (statuses.some(s => s === 'reupload')) return 'reupload';
  if (statuses.some(s => s === 'pending_review')) return 'pending_review';
  if (statuses.every(s => s === 'uploaded' || s === 'ready')) return 'ready';
  return 'progress';
}

/* ──────────── Pipeline Card ──────────── */

function PipelineCard({ title, icon, color, stats, totalModules }: {
  title: string;
  icon: React.ReactNode;
  color: 'blue' | 'orange';
  stats: PipelineStats;
  totalModules: number;
}) {
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  // Funnel order: widest (total/in-progress) at top, narrowest (completed) at bottom
  const stages = [
    {
      label: 'In Progress',
      count: stats.inProgress,
      fill: '#ef4444',
      detail: `Slides ${stats.progressSlides} | Applets ${stats.progressApplets} | Videos ${stats.progressVideos}`,
    },
    {
      label: 'Require Re-Upload',
      count: stats.requireReUpload,
      fill: '#b91c1c',
      detail: '',
    },
    {
      label: 'Ready for Upload',
      count: stats.readyForUpload,
      fill: '#eab308',
      detail: `Slides ${stats.readySlides} | Applets ${stats.readyApplets} | Videos ${stats.readyVideos}`,
    },
    {
      label: 'Pending Review',
      count: stats.pendingReview,
      fill: '#f59e0b',
      detail: '',
    },
    {
      label: 'Uploaded - Complete',
      count: stats.uploadedComplete,
      fill: '#10b981',
      detail: '',
    },
  ];

  const svgWidth = 460;
  const segmentHeight = 56;
  const gap = 3;
  const totalHeight = stages.length * segmentHeight + (stages.length - 1) * gap;
  const maxWidth = svgWidth - 40; // padding
  const minWidthPct = 0.25; // minimum 25% width so small values are visible
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className={cn(
        'px-5 py-4 flex items-center justify-between',
        color === 'blue' ? 'bg-blue-600' : 'bg-orange-600'
      )}>
        <div className="flex items-center gap-2 text-white">
          {icon}
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <div className="text-right text-white">
          <div className="text-xs opacity-80">Total Modules</div>
          <div className="text-xl font-bold">{totalModules}</div>
        </div>
      </div>

      {/* Asset type summary */}
      <div className="px-5 py-3 bg-muted/30 border-b border-border flex items-center justify-around">
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center mb-0.5">
            <FileSliders size={12} className="text-indigo-500" />
            <span className="text-[10px] text-muted-foreground">Slides</span>
          </div>
          <span className="text-sm font-bold">{stats.totalSlides}</span>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center mb-0.5">
            <Gamepad2 size={12} className="text-emerald-500" />
            <span className="text-[10px] text-muted-foreground">Applets</span>
          </div>
          <span className="text-sm font-bold">{stats.totalApplets}</span>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center mb-0.5">
            <Video size={12} className="text-rose-500" />
            <span className="text-[10px] text-muted-foreground">Videos</span>
          </div>
          <span className="text-sm font-bold">{stats.totalVideos}</span>
        </div>
      </div>

      {/* Funnel */}
      <div className="p-5 flex justify-center">
        <svg width={svgWidth} height={totalHeight + 10} viewBox={`0 0 ${svgWidth} ${totalHeight + 10}`}>
          {stages.map((stage, i) => {
            // Width narrows as we go down the funnel
            const widthPct = stage.count > 0
              ? Math.max(minWidthPct, stage.count / maxCount)
              : minWidthPct * 0.5;
            const nextWidthPct = i < stages.length - 1
              ? (stages[i + 1].count > 0
                ? Math.max(minWidthPct, stages[i + 1].count / maxCount)
                : minWidthPct * 0.5)
              : widthPct * 0.7;

            const topWidth = widthPct * maxWidth;
            const bottomWidth = nextWidthPct * maxWidth;
            const y = i * (segmentHeight + gap) + 5;
            const centerX = svgWidth / 2;

            const topLeft = centerX - topWidth / 2;
            const topRight = centerX + topWidth / 2;
            const bottomLeft = centerX - bottomWidth / 2;
            const bottomRight = centerX + bottomWidth / 2;

            const pct = totalModules > 0 ? ((stage.count / totalModules) * 100).toFixed(1) : '0';
            const isHovered = hoveredStage === i;

            return (
              <g
                key={stage.label}
                onMouseEnter={() => setHoveredStage(i)}
                onMouseLeave={() => setHoveredStage(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Trapezoid shape */}
                <path
                  d={`M ${topLeft} ${y} L ${topRight} ${y} L ${bottomRight} ${y + segmentHeight} L ${bottomLeft} ${y + segmentHeight} Z`}
                  fill={stage.fill}
                  opacity={isHovered ? 1 : 0.85}
                  rx={4}
                  style={{ transition: 'opacity 0.2s' }}
                />

                {/* Label */}
                <text
                  x={centerX}
                  y={y + 22}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="600"
                >
                  {stage.label}
                </text>

                {/* Count and percentage */}
                <text
                  x={centerX}
                  y={y + 40}
                  textAnchor="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="700"
                >
                  {stage.count} ({pct}%)
                </text>

                {/* Hover tooltip - asset detail */}
                {isHovered && stage.detail && (
                  <text
                    x={centerX}
                    y={y + segmentHeight + gap + 12}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {stage.detail}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ──────────── Breakdown Table ──────────── */

function BreakdownTable({ title, rows, nameLabel }: {
  title: string;
  rows: { name: string; en: PipelineNumbers; id: PipelineNumbers; totalModules: number }[];
  nameLabel: string;
}) {
  return (
    <div className="space-y-6">
      {/* English Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 bg-blue-600 flex items-center gap-2 text-white">
          <Globe size={14} />
          <span className="text-sm font-semibold">{title} - English</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-semibold">{nameLabel}</th>
                <th className="text-center px-3 py-2.5 font-semibold">Total Modules</th>
                <th className="text-center px-3 py-2.5 font-semibold bg-red-50 text-red-700">In Progress</th>
                <th className="text-center px-3 py-2.5 font-semibold bg-red-50 text-red-700">Re-Upload</th>
                <th className="text-center px-3 py-2.5 font-semibold bg-yellow-50 text-yellow-700">Ready for Upload</th>
                <th className="text-center px-3 py-2.5 font-semibold bg-amber-50 text-amber-700">Pending Review</th>
                <th className="text-center px-3 py-2.5 font-semibold bg-emerald-50 text-emerald-700">Uploaded - Complete</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.name} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.name}</td>
                  <td className="text-center px-3 py-2.5 font-bold">{row.totalModules}</td>
                  <td className="text-center px-3 py-2.5">
                    <StatusCell value={row.en.inProgress} type="danger" />
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <StatusCell value={row.en.requireReUpload} type="danger" />
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <StatusCell value={row.en.readyForUpload} type="warning" />
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <StatusCell value={row.en.pendingReview} type="warning" />
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <StatusCell value={row.en.uploadedComplete} type="success" />
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-muted/50 font-bold border-t-2 border-border">
                <td className="px-4 py-2.5">Totals</td>
                <td className="text-center px-3 py-2.5">{rows.reduce((s, r) => s + r.totalModules, 0)}</td>
                <td className="text-center px-3 py-2.5 text-red-600">{rows.reduce((s, r) => s + r.en.inProgress, 0)}</td>
                <td className="text-center px-3 py-2.5 text-red-600">{rows.reduce((s, r) => s + r.en.requireReUpload, 0)}</td>
                <td className="text-center px-3 py-2.5 text-yellow-600">{rows.reduce((s, r) => s + r.en.readyForUpload, 0)}</td>
                <td className="text-center px-3 py-2.5 text-amber-600">{rows.reduce((s, r) => s + r.en.pendingReview, 0)}</td>
                <td className="text-center px-3 py-2.5 text-emerald-600">{rows.reduce((s, r) => s + r.en.uploadedComplete, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Indonesian Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 bg-orange-600 flex items-center gap-2 text-white">
          <Languages size={14} />
          <span className="text-sm font-semibold">{title} - Indonesian</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-semibold">{nameLabel}</th>
                <th className="text-center px-3 py-2.5 font-semibold">Total Modules</th>
                <th className="text-center px-3 py-2.5 font-semibold bg-red-50 text-red-700">In Progress</th>
                <th className="text-center px-3 py-2.5 font-semibold bg-red-50 text-red-700">Re-Upload</th>
                <th className="text-center px-3 py-2.5 font-semibold bg-yellow-50 text-yellow-700">Ready for Upload</th>
                <th className="text-center px-3 py-2.5 font-semibold bg-amber-50 text-amber-700">Pending Review</th>
                <th className="text-center px-3 py-2.5 font-semibold bg-emerald-50 text-emerald-700">Uploaded - Complete</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.name} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.name}</td>
                  <td className="text-center px-3 py-2.5 font-bold">{row.totalModules}</td>
                  <td className="text-center px-3 py-2.5">
                    <StatusCell value={row.id.inProgress} type="danger" />
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <StatusCell value={row.id.requireReUpload} type="danger" />
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <StatusCell value={row.id.readyForUpload} type="warning" />
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <StatusCell value={row.id.pendingReview} type="warning" />
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <StatusCell value={row.id.uploadedComplete} type="success" />
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-bold border-t-2 border-border">
                <td className="px-4 py-2.5">Totals</td>
                <td className="text-center px-3 py-2.5">{rows.reduce((s, r) => s + r.totalModules, 0)}</td>
                <td className="text-center px-3 py-2.5 text-red-600">{rows.reduce((s, r) => s + r.id.inProgress, 0)}</td>
                <td className="text-center px-3 py-2.5 text-red-600">{rows.reduce((s, r) => s + r.id.requireReUpload, 0)}</td>
                <td className="text-center px-3 py-2.5 text-yellow-600">{rows.reduce((s, r) => s + r.id.readyForUpload, 0)}</td>
                <td className="text-center px-3 py-2.5 text-amber-600">{rows.reduce((s, r) => s + r.id.pendingReview, 0)}</td>
                <td className="text-center px-3 py-2.5 text-emerald-600">{rows.reduce((s, r) => s + r.id.uploadedComplete, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusCell({ value, type }: { value: number; type: 'success' | 'warning' | 'danger' }) {
  if (value === 0) return <span className="text-muted-foreground">0</span>;
  const colors = {
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
  };
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-[11px] font-bold', colors[type])}>
      {value}
    </span>
  );
}
