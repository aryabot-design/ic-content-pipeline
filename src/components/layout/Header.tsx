'use client';

import { RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  lastSync?: string;
}

export default function Header({ title, subtitle, lastSync }: HeaderProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const syncAgo = lastSync
    ? getTimeAgo(new Date(lastSync))
    : null;

  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        {syncAgo && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
            <span>Synced {syncAgo}</span>
          </div>
        )}
        <span>{time}</span>
      </div>
    </header>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
