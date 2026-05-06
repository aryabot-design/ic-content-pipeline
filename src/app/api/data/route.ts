import { NextResponse } from 'next/server';
import { fetchSheetData, fetchCurriculumData, computeStats, invalidateCache } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    const refresh = searchParams.get('refresh');
    const grade = searchParams.get('grade');
    const assetType = searchParams.get('assetType');
    const vendor = searchParams.get('vendor');
    const phase = searchParams.get('phase');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (refresh === '1') invalidateCache();

    if (type === 'refresh') {
      invalidateCache();
      const assets = fetchSheetData();
      const stats = computeStats(assets);
      return NextResponse.json({ refreshed: true, stats });
    }

    const assets = fetchSheetData();

    if (type === 'stats') {
      const stats = computeStats(assets);
      const modules = fetchCurriculumData();
      stats.total_modules = modules.length;
      return NextResponse.json(stats);
    }

    if (type === 'assets') {
      let filtered = [...assets];
      if (grade) filtered = filtered.filter(a => a.grade_code === grade);
      if (assetType) filtered = filtered.filter(a => a.asset_type === assetType);
      if (vendor) filtered = filtered.filter(a => a.allocated_to === vendor);
      if (phase) filtered = filtered.filter(a => a.phase === phase);
      if (status === 'completed') filtered = filtered.filter(a => a.upload_status_en?.toLowerCase().includes('complete') || a.final_status?.toLowerCase().includes('completed'));
      else if (status === 'pending') filtered = filtered.filter(a => !a.upload_status_en?.toLowerCase().includes('complete') && !a.final_status?.toLowerCase().includes('completed'));
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(a => a.mid?.toLowerCase().includes(s) || a.module_mid?.toLowerCase().includes(s) || a.asset_tag_en?.toLowerCase().includes(s) || a.allocated_to?.toLowerCase().includes(s) || a.asset_type?.toLowerCase().includes(s));
      }
      return NextResponse.json({ total: filtered.length, assets: filtered.slice(0, 500) });
    }

    if (type === 'grades') {
      const gm = new Map<string, { total: number; completed: number; chs: Set<string>; mods: Set<string> }>();
      assets.forEach(a => {
        const g = a.grade_code;
        if (!gm.has(g)) gm.set(g, { total: 0, completed: 0, chs: new Set(), mods: new Set() });
        const e = gm.get(g)!;
        e.total++;
        e.chs.add(a.chapter_code);
        e.mods.add(a.module_mid);
        if (a.upload_status_en?.toLowerCase().includes('complete') || a.final_status?.toLowerCase().includes('completed')) e.completed++;
      });
      const grades = Array.from(gm.entries()).map(([code, data]) => ({
        code, total_assets: data.total, completed: data.completed, pending: data.total - data.completed,
        completion_rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        total_chapters: data.chs.size, total_modules: data.mods.size,
      })).sort((a, b) => parseInt(a.code.replace('G', '')) - parseInt(b.code.replace('G', '')));
      return NextResponse.json(grades);
    }

    if (type === 'vendors') {
      const vm = new Map<string, { total: number; completed: number; types: Map<string, number> }>();
      assets.forEach(a => {
        const v = a.allocated_to || 'Unassigned';
        if (!vm.has(v)) vm.set(v, { total: 0, completed: 0, types: new Map() });
        const e = vm.get(v)!;
        e.total++;
        e.types.set(a.asset_type, (e.types.get(a.asset_type) || 0) + 1);
        if (a.upload_status_en?.toLowerCase().includes('complete') || a.final_status?.toLowerCase().includes('completed')) e.completed++;
      });
      const vendors = Array.from(vm.entries()).map(([name, data]) => ({
        name, total: data.total, completed: data.completed, pending: data.total - data.completed,
        completion_rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        types: Object.fromEntries(data.types),
      })).sort((a, b) => b.total - a.total);
      return NextResponse.json(vendors);
    }

    if (type === 'curriculum') {
      const mods = fetchCurriculumData();
      return NextResponse.json({ total: mods.length, modules: mods });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed', details: String(error) }, { status: 500 });
  }
}
