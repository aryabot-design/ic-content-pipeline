'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GraduationCap,
  Table2,
  GitBranch,
  Users,
  RefreshCw,
  Hash,
  Activity,
  Triangle,
  Box,
  BarChart3,
  Upload,
  Grid3x3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';
import { useCurriculumData } from '@/lib/curriculum-data';
import { csvToModules } from '@/lib/csv-parser';
import ModeSwitcher from './ModeSwitcher';

const curriculumNav = [
  { href: '/curriculum', label: 'Overview', icon: LayoutDashboard },
  { href: '/curriculum/Numbers', label: 'Numbers', icon: Hash },
  { href: '/curriculum/Algebra', label: 'Algebra', icon: Activity },
  { href: '/curriculum/Geometry', label: 'Geometry', icon: Triangle },
  { href: '/curriculum/Measurement', label: 'Measurement', icon: Box },
  { href: '/curriculum/Data', label: 'Data', icon: BarChart3 },
  { href: '/curriculum/teams', label: 'Teams', icon: Users },
];

const masterNav = [
  { href: '/master', label: 'Overview', icon: LayoutDashboard },
  { href: '/master/grades', label: 'Grades', icon: GraduationCap },
  { href: '/master/tracker', label: 'Asset Tracker', icon: Table2 },
  { href: '/master/applets', label: 'Applet Matrix', icon: Grid3x3 },
  { href: '/master/pipeline', label: 'QC Pipeline', icon: GitBranch },
  { href: '/master/vendors', label: 'Vendors', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isMaster = pathname.startsWith('/master');
  const navItems = isMaster ? masterNav : curriculumNav;
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { replaceData } = useCurriculumData();

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/data?type=stats&refresh=true');
      window.location.reload();
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = csvToModules(text);
      if (parsed.length > 0) {
        replaceData(parsed);
        window.location.reload();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-sidebar border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="flex flex-col justify-center px-4 h-[60px] border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          <span className="font-bold text-[15px] text-foreground">
            {isMaster ? 'Master Tracker' : 'Curriculum Tracker'}
          </span>
        </div>
        <span className="text-[11px] text-[var(--text-tertiary)] mt-1 pl-[30px] uppercase tracking-wide">
          {isMaster ? 'K-10 Project Execution' : 'SMP Curriculum Plan'}
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="px-3 pt-3 pb-1">
        <ModeSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        <div className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide px-3 pt-2 pb-1.5">
          {isMaster ? 'Project' : 'Dashboard'}
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/curriculum' && item.href !== '/master' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-smooth',
                isActive
                  ? 'bg-sidebar-active text-foreground'
                  : 'text-sidebar-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-foreground rounded-sm" />
              )}
              <item.icon size={16} className="shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 shrink-0">
        {isMaster ? (
          <button
            onClick={handleSync}
            disabled={syncing}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium w-full transition-smooth',
              'text-sidebar-foreground hover:bg-muted hover:text-foreground',
              syncing && 'opacity-50'
            )}
          >
            <RefreshCw size={16} className={cn('shrink-0', syncing && 'animate-spin')} />
            <span>{syncing ? 'Syncing...' : 'Refresh Data'}</span>
          </button>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium w-full text-sidebar-foreground hover:bg-muted hover:text-foreground transition-smooth"
            >
              <Upload size={16} className="shrink-0" />
              <span>Upload CSV</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
