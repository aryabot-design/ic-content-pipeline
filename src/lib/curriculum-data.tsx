'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { CurriculumModule } from '@/types';

interface DataMeta { updatedAt: string; count: number; }
interface CurriculumDataContextType {
  modules: CurriculumModule[];
  dataMeta: DataMeta | null;
  replaceData: (modules: CurriculumModule[]) => void;
}

const CurriculumDataContext = createContext<CurriculumDataContextType>({
  modules: [], dataMeta: null, replaceData: () => {},
});

export function CurriculumDataProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [dataMeta, setDataMeta] = useState<DataMeta | null>(null);

  useEffect(() => {
    fetch('/api/data?type=curriculum')
      .then(r => r.json())
      .then(d => {
        setModules(d.modules || []);
        setDataMeta({ updatedAt: new Date().toISOString(), count: d.total || 0 });
      })
      .catch(() => {});
  }, []);

  const replaceData = useCallback((newModules: CurriculumModule[]) => {
    const meta: DataMeta = { updatedAt: new Date().toISOString(), count: newModules.length };
    setModules(newModules);
    setDataMeta(meta);
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
