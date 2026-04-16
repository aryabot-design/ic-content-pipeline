import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchSheetData, computeStats, invalidateCache } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    const accessToken = (session as any)?.accessToken;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    const grade = searchParams.get('grade');
    const assetType = searchParams.get('assetType');
    const vendor = searchParams.get('vendor');
    const phase = searchParams.get('phase');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const refresh = searchParams.get('refresh');

    if (refresh === 'true') {
      invalidateCache();
    }

    const assets = await fetchSheetData(accessToken);

    if (assets.length === 0 && !accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated. Please sign in with Google to load data.' },
        { status: 401 }
      );
    }

    if (type === 'stats') {
      const stats = computeStats(assets);
      return NextResponse.json(stats);
    }

    if (type === 'assets') {
      let filtered = [...assets];

      if (grade) filtered = filtered.filter(a => a.grade_code === grade);
      if (assetType) filtered = filtered.filter(a => a.asset_type === assetType);
      if (vendor) filtered = filtered.filter(a => a.allocated_to === vendor);
      if (phase) filtered = filtered.filter(a => a.phase === phase);
      if (status === 'completed') {
        filtered = filtered.filter(a =>
          a.upload_status_en?.toLowerCase().includes('complete') ||
          a.final_status?.toLowerCase().includes('completed')
        );
      } else if (status === 'pending') {
        filtered = filtered.filter(a =>
          !a.upload_status_en?.toLowerCase().includes('complete') &&
          !a.final_status?.toLowerCase().includes('completed')
        );
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(a =>
          a.mid?.toLowerCase().includes(s) ||
          a.module_mid?.toLowerCase().includes(s) ||
          a.asset_tag_en?.toLowerCase().includes(s) ||
          a.allocated_to?.toLowerCase().includes(s) ||
          a.asset_type?.toLowerCase().includes(s)
        );
      }

      return NextResponse.json({
        total: filtered.length,
        assets: filtered,
      });
    }

    if (type === 'grades') {
      const gradeMap = new Map<string, { total: number; completed: number; chapters: Set<string>; modules: Set<string> }>();
      assets.forEach(a => {
        const g = a.grade_code;
        if (!gradeMap.has(g)) gradeMap.set(g, { total: 0, completed: 0, chapters: new Set(), modules: new Set() });
        const entry = gradeMap.get(g)!;
        entry.total++;
        entry.chapters.add(a.chapter_code);
        entry.modules.add(a.module_mid);
        if (a.upload_status_en?.toLowerCase().includes('complete') || a.final_status?.toLowerCase().includes('completed')) {
          entry.completed++;
        }
      });

      const grades = Array.from(gradeMap.entries())
        .map(([code, data]) => ({
          code,
          total_assets: data.total,
          completed: data.completed,
          pending: data.total - data.completed,
          completion_rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
          total_chapters: data.chapters.size,
          total_modules: data.modules.size,
        }))
        .sort((a, b) => {
          const numA = parseInt(a.code.replace('G', ''));
          const numB = parseInt(b.code.replace('G', ''));
          return numA - numB;
        });

      return NextResponse.json(grades);
    }

    if (type === 'vendors') {
      const vendorMap = new Map<string, { total: number; completed: number; types: Map<string, number> }>();
      assets.forEach(a => {
        const v = a.allocated_to || 'Unassigned';
        if (!vendorMap.has(v)) vendorMap.set(v, { total: 0, completed: 0, types: new Map() });
        const entry = vendorMap.get(v)!;
        entry.total++;
        entry.types.set(a.asset_type, (entry.types.get(a.asset_type) || 0) + 1);
        if (a.upload_status_en?.toLowerCase().includes('complete') || a.final_status?.toLowerCase().includes('completed')) {
          entry.completed++;
        }
      });

      const vendors = Array.from(vendorMap.entries())
        .map(([name, data]) => ({
          name,
          total: data.total,
          completed: data.completed,
          pending: data.total - data.completed,
          completion_rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
          types: Object.fromEntries(data.types),
        }))
        .sort((a, b) => b.total - a.total);

      return NextResponse.json(vendors);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    );
  }
}
