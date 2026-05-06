'use client';

import { CurriculumDataProvider } from '@/lib/curriculum-data';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <CurriculumDataProvider>{children}</CurriculumDataProvider>;
}
