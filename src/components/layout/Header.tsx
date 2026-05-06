'use client';

import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  lastSync?: string;
}

export default function Header({ title, subtitle, lastSync }: HeaderProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const handleRefresh = () => {
    setRefreshing(true);
    setMessage('Run refresh-data.sh on the server to update →');
    setTimeout(() => { setMessage(''); setRefreshing(false); }, 5000);
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {lastSync && (
          <span className="text-[11px] text-[var(--text-tertiary)]">{lastSync}</span>
        )}
        {message && (
          <span className="text-[11px] text-yellow-400">{message}</span>
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-[12px] font-medium bg-card border border-border rounded-lg px-3 py-1.5 text-foreground hover:border-[#444] transition-smooth disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>
    </div>
  );
}
