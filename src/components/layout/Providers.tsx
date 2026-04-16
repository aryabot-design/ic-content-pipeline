'use client';

import { SessionProvider } from 'next-auth/react';
import { CurriculumDataProvider } from '@/lib/curriculum-data';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CurriculumDataProvider>
        {children}
      </CurriculumDataProvider>
    </SessionProvider>
  );
}
