import { google } from 'googleapis';
import type { Asset, DashboardStats } from '@/types';
import { getAssetTypeColor } from './utils';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1Zwq5KamkZiVLDRAmHOMEXKs3hEC1jNsS6VSTnuc7hSQ';
const SHEET_NAME = 'All Grades';

// In-memory cache
let cachedData: Asset[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function fetchSheetData(accessToken?: string): Promise<Asset[]> {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  if (!accessToken) {
    // Return cached data even if stale, or empty array
    return cachedData || [];
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${SHEET_NAME}'!A1:AZ`,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map((h: string) => h?.trim?.() || '');
  const assets: Asset[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;

    const get = (colName: string) => {
      const idx = headers.findIndex((h: string) =>
        h.toLowerCase().includes(colName.toLowerCase())
      );
      return idx >= 0 ? (row[idx] || '').toString().trim() : '';
    };

    const getExact = (colName: string) => {
      const idx = headers.indexOf(colName);
      return idx >= 0 ? (row[idx] || '').toString().trim() : '';
    };

    const grade = get('Grade');
    const chapter = get('Chapter');
    const module = get('Module');
    const moduleMid = getExact('Module MID') || get('Module MID');
    const assetMid = getExact('Asset MID') || get('Asset MID');
    const assetType = getExact('Asset Type') || get('Asset Type');

    if (!grade || !assetMid) continue;

    assets.push({
      id: assetMid || `${grade}${chapter}${module}-${i}`,
      module_id: moduleMid,
      grade_code: grade,
      chapter_code: chapter,
      chapter_name: get('Chapter Name'),
      module_name: get('Module Name'),
      module_mid: moduleMid,
      mid: assetMid,
      asset_type: assetType,
      allocated_to: get('Allocated to'),
      module_owner: get('Module Owner'),
      upload_status_en: get('Upload Status - EN') || get('Upload Status'),
      upload_status_id: get('Upload Status - ID'),
      ready_for_review: get('Ready for Allocation'),
      qc_teacher_portal: get('QC (Teacher Portal)') || get('QC (TP)'),
      qc_ifp: get('QC (IFP') || get('QC (IFP - Indonesian)'),
      final_status: get('Final Status'),
      merdeka_final: get('Merdeka').toLowerCase() === 'true' || get('Merdeka') === '✓',
      cultural_fit: get('Cultural Fit'),
      link_en: get('Module/Storyboard/Applet/Video link - EN') || get('link - EN'),
      link_id: get('File Link (Bahasa)') || get('Link (Bahasa)'),
      link_en_status: get('English Links'),
      link_id_status: get('Indonesian Links'),
      drop_date: get('Drop Date'),
      thumbnail: get('Thumbnail'),
      asset_tag_en: get('Asset Tag - EN'),
      asset_tag_id: get('Asset Tag - ID'),
      comments: get('Comments'),
      phase: getExact('Phase') || get('Phase'),
    });
  }

  cachedData = assets;
  cacheTimestamp = now;
  return assets;
}

export function computeStats(assets: Asset[]): DashboardStats {
  const grades = [...new Set(assets.map(a => a.grade_code))].sort();
  const chapters = [...new Set(assets.map(a => `${a.grade_code}${a.chapter_code}`))];
  const modules = [...new Set(assets.map(a => a.module_mid).filter(Boolean))];

  const uploaded = assets.filter(a =>
    a.upload_status_en?.toLowerCase().includes('complete') ||
    a.upload_status_en?.toLowerCase().includes('uploaded')
  );

  const qcCompleted = assets.filter(a =>
    a.final_status?.toLowerCase().includes('completed') ||
    a.final_status?.toLowerCase().includes('all qc')
  );

  const pendingQc = assets.filter(a => {
    const hasUploaded = a.upload_status_en?.toLowerCase().includes('complete') ||
      a.upload_status_en?.toLowerCase().includes('uploaded');
    const hasCompleted = a.final_status?.toLowerCase().includes('completed') ||
      a.final_status?.toLowerCase().includes('all qc');
    return hasUploaded && !hasCompleted;
  });

  // Assets by type
  const typeMap = new Map<string, number>();
  assets.forEach(a => {
    const t = a.asset_type || 'Unknown';
    typeMap.set(t, (typeMap.get(t) || 0) + 1);
  });
  const assets_by_type = Array.from(typeMap.entries()).map(([name, value]) => ({
    name,
    value,
    color: getAssetTypeColor(name),
  }));

  // Assets by grade
  const assets_by_grade = grades.map(grade => {
    const gradeAssets = assets.filter(a => a.grade_code === grade);
    const completed = gradeAssets.filter(a =>
      a.final_status?.toLowerCase().includes('completed') ||
      a.final_status?.toLowerCase().includes('all qc') ||
      a.upload_status_en?.toLowerCase().includes('complete')
    );
    return {
      grade,
      total: gradeAssets.length,
      completed: completed.length,
      pending: gradeAssets.length - completed.length,
    };
  });

  // Assets by phase
  const phaseMap = new Map<string, { total: number; completed: number }>();
  assets.forEach(a => {
    const p = a.phase || 'Unknown';
    if (!phaseMap.has(p)) phaseMap.set(p, { total: 0, completed: 0 });
    const entry = phaseMap.get(p)!;
    entry.total++;
    if (a.final_status?.toLowerCase().includes('completed') || a.upload_status_en?.toLowerCase().includes('complete')) {
      entry.completed++;
    }
  });
  const assets_by_phase = Array.from(phaseMap.entries()).map(([phase, data]) => ({
    phase,
    ...data,
  }));

  // Assets by vendor
  const vendorMap = new Map<string, { total: number; completed: number }>();
  assets.forEach(a => {
    const v = a.allocated_to || 'Unassigned';
    if (!vendorMap.has(v)) vendorMap.set(v, { total: 0, completed: 0 });
    const entry = vendorMap.get(v)!;
    entry.total++;
    if (a.upload_status_en?.toLowerCase().includes('complete') || a.upload_status_en?.toLowerCase().includes('uploaded')) {
      entry.completed++;
    }
  });
  const assets_by_vendor = Array.from(vendorMap.entries())
    .map(([vendor, data]) => ({
      vendor,
      total: data.total,
      completed: data.completed,
      pending: data.total - data.completed,
    }))
    .sort((a, b) => b.total - a.total);

  // QC Pipeline
  const notStarted = assets.filter(a => !a.upload_status_en && !a.qc_teacher_portal && !a.qc_ifp && !a.final_status).length;
  const inUpload = assets.filter(a => a.upload_status_en && !a.upload_status_en.toLowerCase().includes('complete')).length;
  const uploadedPendingQc = pendingQc.filter(a => !a.qc_teacher_portal && !a.qc_ifp).length;
  const inTeacherQc = assets.filter(a => a.qc_teacher_portal && !a.qc_ifp && !a.final_status?.toLowerCase().includes('completed')).length;
  const inIfpQc = assets.filter(a => a.qc_ifp && !a.final_status?.toLowerCase().includes('completed')).length;

  const qc_pipeline = [
    { stage: 'Not Started', count: notStarted, color: '#94a3b8' },
    { stage: 'In Upload', count: inUpload, color: '#f59e0b' },
    { stage: 'Awaiting QC', count: uploadedPendingQc, color: '#3b82f6' },
    { stage: 'Teacher QC', count: inTeacherQc, color: '#8b5cf6' },
    { stage: 'IFP QC', count: inIfpQc, color: '#f43f5e' },
    { stage: 'Completed', count: qcCompleted.length, color: '#10b981' },
  ];

  return {
    total_assets: assets.length,
    total_modules: modules.length,
    total_chapters: chapters.length,
    total_grades: grades.length,
    completion_rate: assets.length > 0 ? (uploaded.length / assets.length) * 100 : 0,
    uploaded_count: uploaded.length,
    pending_qc: pendingQc.length,
    qc_completed: qcCompleted.length,
    assets_by_type,
    assets_by_grade,
    assets_by_phase,
    assets_by_vendor,
    qc_pipeline,
    last_sync: new Date().toISOString(),
  };
}

// Invalidate cache manually
export function invalidateCache() {
  cachedData = null;
  cacheTimestamp = 0;
}
