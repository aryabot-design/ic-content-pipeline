import type { CurriculumModule, CurriculumStats } from '@/types';

export const THREADS = ['Numbers', 'Algebra', 'Geometry', 'Measurement', 'Data'] as const;

export const THREAD_COLORS: Record<string, string> = {
  Numbers: '#0070f3',
  Algebra: '#8b5cf6',
  Geometry: '#0cce6b',
  Measurement: '#f5a623',
  Data: '#ec4899',
};

export function computeCurriculumStats(modules: CurriculumModule[]): CurriculumStats {
  const total = modules.length;
  const completed = modules.filter(m => m.status === 'Module Completed').length;
  const contentReady = modules.filter(m => m.status === 'Content Completed').length;
  const wip = modules.filter(m => m.status === 'Content WIP').length;
  const yetToStart = modules.filter(m => m.status === 'Yet To Start' || !m.status).length;
  const closedPct = total ? Math.round((completed / total) * 100) : 0;
  const progressPct = total ? Math.round(((completed + contentReady + wip) / total) * 100) : 0;
  return { total, completed, contentReady, wip, yetToStart, closedPct, progressPct };
}

export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  items.forEach(item => {
    const k = (item[key] as string) || '(None)';
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
  });
  return groups;
}

export function getUniqueValues(modules: CurriculumModule[], key: keyof CurriculumModule): string[] {
  return [...new Set(modules.map(m => m[key]).filter(Boolean))].sort();
}

export function matchesSearch(m: CurriculumModule, query: string): boolean {
  if (!query) return true;
  const fields = [m.conceptName, m.conceptCode, m.chapterName, m.strand, m.conceptType, m.teamOwner, m.individualOwner, m.conceptDescription];
  return fields.some(f => f && f.toLowerCase().includes(query));
}

export function getStatusClass(status: string): string {
  if (status === 'Module Completed') return 'completed';
  if (status === 'Content Completed') return 'content-ready';
  if (status === 'Content WIP') return 'wip';
  return 'not-started';
}

export function getStatusLabel(status: string): string {
  if (status === 'Module Completed') return 'Completed';
  if (status === 'Content Completed') return 'Content Ready';
  if (status === 'Content WIP') return 'In Progress';
  return 'Yet To Start';
}

export function getStatusColor(status: string): string {
  if (status === 'Module Completed') return 'bg-[var(--success-bg)] text-success';
  if (status === 'Content Completed') return 'bg-[var(--info-bg)] text-info';
  if (status === 'Content WIP') return 'bg-[var(--warning-bg)] text-warning';
  return 'bg-[rgba(102,102,102,0.1)] text-[var(--text-tertiary)]';
}

export function getTypeColor(type: string): string {
  const t = type?.toLowerCase() || '';
  if (t.includes('learn')) return 'bg-[var(--info-bg)] text-accent';
  if (t.includes('practice')) return 'bg-[var(--purple-bg)] text-[var(--purple)]';
  if (t.includes('challenge')) return 'bg-[rgba(236,72,153,0.1)] text-[var(--pink)]';
  return 'bg-[rgba(102,102,102,0.15)] text-muted-foreground';
}
