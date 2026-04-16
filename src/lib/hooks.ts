'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import type { DashboardStats, Asset } from '@/types';

async function fetchWithAuth(url: string) {
  const res = await fetch(url);
  const data = await res.json();

  // If 401, re-trigger sign in to get a fresh token
  if (res.status === 401 || data.error?.includes('Not authenticated')) {
    signIn('google');
    throw new Error('Redirecting to sign in...');
  }

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch');
  }

  return data;
}

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithAuth('/api/data?type=stats')
      .then(data => {
        if (data.total_assets !== undefined) {
          setStats(data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { stats, loading, error };
}

export function useAssets(params?: Record<string, string>) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams({ type: 'assets', ...params });
    fetchWithAuth(`/api/data?${searchParams}`)
      .then(data => {
        setAssets(data.assets || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [JSON.stringify(params)]);

  return { assets, total, loading, error };
}

export function useGrades() {
  const [grades, setGrades] = useState<Array<{
    code: string;
    total_assets: number;
    completed: number;
    pending: number;
    completion_rate: number;
    total_chapters: number;
    total_modules: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/data?type=grades')
      .then(data => {
        if (Array.isArray(data)) setGrades(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { grades, loading };
}

export function useVendors() {
  const [vendors, setVendors] = useState<Array<{
    name: string;
    total: number;
    completed: number;
    pending: number;
    completion_rate: number;
    types: Record<string, number>;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/data?type=vendors')
      .then(data => {
        if (Array.isArray(data)) setVendors(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { vendors, loading };
}
