// Data source: local JSON exports from PostgreSQL
// Replace with Supabase queries later

import type { Asset, DashboardStats } from '@/types';
import curriculumData from '@/data/dump_curriculum.json';
import assetData from '@/data/dump_assets.json';

function normalizeAssets(raw: any[]): Asset[] {
  return raw.map(r => ({
    id: r.asset_mid || '', mid: r.asset_mid || '',
    module_id: r.module_mid || '', module_mid: r.module_mid || '',
    grade_code: r.grade || '', chapter_code: r.chapter || '',
    chapter_name: r.chapter_name || '', module_name: r.module_name || '',
    asset_type: r.asset_type || '', allocated_to: r.allocated_to || '',
    module_owner: r.module_owner || '',
    upload_status_en: r.upload_status_en || '',
    upload_status_id: r.upload_status_id || '',
    ready_for_review: r.status || '',
    qc_teacher_portal: r.qc_teacher_portal || '',
    qc_ifp: r.qc_ifp || '',
    final_status: r.final_status || '',
    merdeka_final: r.merdeka_final === 'Checked' || r.merdeka_final === 'TRUE',
    cultural_fit: r.cultural_fit || '',
    link_en: r.link_en || '', link_id: r.link_id || '',
    link_en_status: r.english_links || '',
    link_id_status: r.indonesian_links || '',
    drop_date: r.drop_date || '', thumbnail: r.thumbnail || '',
    asset_tag_en: r.asset_tag_en || '', asset_tag_id: r.asset_tag_id || '',
    comments: r.comments || '', phase: r.phase || '',
  }));
}

const ASSETS: Asset[] = normalizeAssets(assetData);

export function fetchSheetData(): Asset[] {
  return ASSETS;
}

export function fetchCurriculumData(): CurriculumModule[] {
  return (curriculumData as any[]).map((r: any) => ({
    phase: '',
    tpCode: '',
    thread: r.thread || 'Uncategorized',
    strand: r.strand || '',
    gradeCode: (r.grade || '').replace(/^G0/, 'G'),
    chapterCode: r.chapter || '',
    chapterName: r.chapter_name || '',
    conceptCode: r.module_mid || '',
    conceptName: r.module_name || '',
    conceptType: r.concept_type || 'Learn',
    conceptDescription: '',
    status: r.team_owner === 'Done' ? 'Module Completed' : (r.team_owner && r.team_owner !== '' ? 'Content WIP' : 'Yet To Start'),
    teamOwner: r.team_owner || '',
    individualOwner: r.individual_owner || '',
    dateOfDelivery: r.delivery_date || '',
  }));
}

export function invalidateCache() {}
export function getCacheAge() { return 0; }

const colors = ['#0070f3','#8b5cf6','#0cce6b','#f5a623','#ec4899','#ee0000','#666'];

export function computeStats(assets: Asset[]): DashboardStats {
  const grades = [...new Set(assets.map(a => a.grade_code))].sort();
  const chs = new Set(assets.map(a => `${a.grade_code}${a.chapter_code}`));
  const mods = new Set(assets.map(a => a.module_mid).filter(Boolean));

  const uploaded = assets.filter(a =>
    a.upload_status_en?.toLowerCase().includes('complete') || a.upload_status_en?.toLowerCase().includes('uploaded'));
  const qcDone = assets.filter(a =>
    a.final_status?.toLowerCase().includes('completed') || a.final_status?.toLowerCase().includes('all qc'));
  const pendingQc = assets.filter(a => {
    const up = a.upload_status_en?.toLowerCase().includes('complete') || a.upload_status_en?.toLowerCase().includes('uploaded');
    const qc = a.final_status?.toLowerCase().includes('completed') || a.final_status?.toLowerCase().includes('all qc');
    return up && !qc;
  });

  const tm = new Map<string, number>();
  assets.forEach(a => tm.set(a.asset_type || 'Unknown', (tm.get(a.asset_type || 'Unknown') || 0) + 1));
  const at = Array.from(tm.entries()).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));

  const ag = grades.map(g => {
    const ga = assets.filter(a => a.grade_code === g);
    const c = ga.filter(a => a.final_status?.toLowerCase().includes('completed') || a.upload_status_en?.toLowerCase().includes('complete'));
    return { grade: g, total: ga.length, completed: c.length, pending: ga.length - c.length };
  });

  const vm = new Map<string, { total: number; completed: number }>();
  assets.forEach(a => {
    const v = a.allocated_to || 'Unassigned';
    if (!vm.has(v)) vm.set(v, { total: 0, completed: 0 });
    const e = vm.get(v)!; e.total++;
    if (a.upload_status_en?.toLowerCase().includes('complete') || a.upload_status_en?.toLowerCase().includes('uploaded')) e.completed++;
  });
  const av = Array.from(vm.entries()).map(([vendor, data]) => ({ vendor, ...data, pending: data.total - data.completed })).sort((a, b) => b.total - a.total);

  return {
    total_assets: assets.length, total_modules: mods.size, total_chapters: chs.size, total_grades: grades.length,
    completion_rate: assets.length ? Math.round((uploaded.length / assets.length) * 100) : 0,
    uploaded_count: uploaded.length, pending_qc: pendingQc.length, qc_completed: qcDone.length,
    assets_by_type: at, assets_by_grade: ag, assets_by_vendor: av, assets_by_phase: [],
    qc_pipeline: [
      { stage: 'Total Assets', count: assets.length, color: '#a1a1a1' },
      { stage: 'Uploaded', count: uploaded.length, color: '#0070f3' },
      { stage: 'Pending Review', count: pendingQc.length, color: '#f5a623' },
      { stage: 'QC Completed', count: qcDone.length, color: '#0cce6b' },
    ],
    last_sync: new Date().toISOString(),
  };
}
