'use client';
import { useState, useEffect } from 'react';
import type { DashboardStats, Asset } from '@/types';

export function useDashboardStats(): DashboardStats | null {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  useEffect(() => {
    fetch('/api/data?type=stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);
  return stats;
}

export function useAssets(params?: Record<string, string>): { assets: Asset[]; total: number; loading: boolean } {
  const [data, setData] = useState<{ assets: Asset[]; total: number }>({ assets: [], total: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams(params || {});
    q.set('type', 'assets');
    fetch('/api/data?' + q.toString())
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [JSON.stringify(params)]);
  return { ...data, loading };
}

export function useStats() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/data?type=stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  return { stats, loading, error };
}

export function useGrades() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/data?type=grades')
      .then(r => r.json())
      .then(d => { setGrades(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  return { grades, loading };
}

export function useVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/data?type=vendors')
      .then(r => r.json())
      .then(d => { setVendors(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  return { vendors, loading };
}
