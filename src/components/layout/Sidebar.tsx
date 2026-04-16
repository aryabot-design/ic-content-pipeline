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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/grades', label: 'Grades', icon: GraduationCap },
  { href: '/tracker', label: 'Asset Tracker', icon: Table2 },
  { href: '/pipeline', label: 'QC Pipeline', icon: GitBranch },
  { href: '/vendors', label: 'Vendors', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col z-50 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm shrink-0">
          M
        </div>
        {!collapsed && (
          <span className="font-semibold text-white text-sm truncate">
            Master Dashboard
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth',
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-2 pb-4 space-y-2 shrink-0">
        <button
          onClick={handleSync}
          disabled={syncing}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-smooth',
            'text-sidebar-foreground hover:bg-white/5 hover:text-white',
            syncing && 'opacity-50'
          )}
        >
          <RefreshCw size={18} className={cn('shrink-0', syncing && 'animate-spin')} />
          {!collapsed && <span>{syncing ? 'Syncing...' : 'Refresh Data'}</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-sidebar-foreground hover:bg-white/5 hover:text-white transition-smooth"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
