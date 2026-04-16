import type { CurriculumModule } from '@/types';

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        row.push(current.trim());
        current = '';
        if (row.length > 1) rows.push(row);
        row = [];
        if (ch === '\r') i++;
      } else {
        current += ch;
      }
    }
  }
  if (current || row.length) {
    row.push(current.trim());
    if (row.length > 1) rows.push(row);
  }
  return rows;
}

export function csvToModules(csvText: string): CurriculumModule[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const dataRows = rows.slice(1);
  const modules: CurriculumModule[] = [];

  dataRows.forEach(r => {
    if (r.length < 16 || !(r[3] || '').trim()) return;
    modules.push({
      phase: (r[0] || '').trim(),
      tpCode: (r[1] || '').trim(),
      thread: (r[3] || '').trim(),
      strand: (r[4] || '').trim(),
      gradeCode: (r[6] || '').trim(),
      chapterCode: (r[7] || '').trim(),
      chapterName: (r[8] || '').trim(),
      conceptCode: (r[9] || '').trim(),
      conceptName: (r[10] || '').trim(),
      conceptType: (r[11] || '').trim(),
      conceptDescription: (r[12] || '').trim(),
      status: (r[15] || '').trim() || 'Yet To Start',
      teamOwner: (r[18] || '').trim(),
      individualOwner: (r[19] || '').trim(),
      dateOfDelivery: (r[20] || '').trim(),
    });
  });

  return modules;
}
