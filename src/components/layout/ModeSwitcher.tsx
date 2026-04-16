'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ModeSwitcher() {
  const pathname = usePathname();
  const isMaster = pathname.startsWith('/master');

  return (
    <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
      <Link
        href="/curriculum"
        className={cn(
          'flex-1 text-center px-3 py-1.5 rounded-md text-[11px] font-semibold transition-smooth',
          !isMaster
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Curriculum
      </Link>
      <Link
        href="/master"
        className={cn(
          'flex-1 text-center px-3 py-1.5 rounded-md text-[11px] font-semibold transition-smooth',
          isMaster
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Master Tracker
      </Link>
    </div>
  );
}
