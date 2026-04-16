'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { CurriculumModule } from '@/types';
import { DEFAULT_MODULES } from '@/data/curriculum-modules';

const STORAGE_KEY = 'curriculum_tracker_data';
const STORAGE_META_KEY = 'curriculum_tracker_meta';

interface DataMeta {
  updatedAt: string;
  count: number;
}

interface CurriculumDataContextType {
  modules: CurriculumModule[];
  dataMeta: DataMeta | null;
  replaceData: (modules: CurriculumModule[]) => void;
}

const CurriculumDataContext = createContext<CurriculumDataContextType>({
  modules: [],
  dataMeta: null,
  replaceData: () => {},
});

export function CurriculumDataProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<CurriculumModule[]>(DEFAULT_MODULES);
  const [dataMeta, setDataMeta] = useState<DataMeta | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const meta = localStorage.getItem(STORAGE_META_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setModules(parsed);
        }
      }
      if (meta) {
        setDataMeta(JSON.parse(meta));
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const replaceData = useCallback((newModules: CurriculumModule[]) => {
    const meta: DataMeta = { updatedAt: new Date().toISOString(), count: newModules.length };
    setModules(newModules);
    setDataMeta(meta);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newModules));
      localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
    } catch {
      // ignore
    }
  }, []);

  return (
    <CurriculumDataContext.Provider value={{ modules, dataMeta, replaceData }}>
      {children}
    </CurriculumDataContext.Provider>
  );
}

export function useCurriculumData() {
  return useContext(CurriculumDataContext);
}
