'use client';

import { Clock, RefreshCw } from 'lucide-react';
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
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {syncAgo && (
          <div className="flex items-center gap-1.5">
            <RefreshCw size={14} />
            <span>Synced {syncAgo}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>{time}</span>
        </div>
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
