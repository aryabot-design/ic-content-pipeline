'use client';

import Header from '@/components/layout/Header';
import StatsCards from '@/components/dashboard/StatsCards';
import GradeProgressChart from '@/components/dashboard/GradeProgressChart';
import AssetTypeBreakdown from '@/components/dashboard/AssetTypeBreakdown';
import QCFunnel from '@/components/dashboard/QCFunnel';
import VendorWorkload from '@/components/dashboard/VendorWorkload';
import PhaseComparison from '@/components/dashboard/PhaseComparison';
import { useStats } from '@/lib/hooks';
import { Loader2 } from 'lucide-react';

export default function OverviewPage() {
  const { stats, loading, error } = useStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-sm text-red-600 font-medium mb-2">Failed to load data</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure your Google Service Account credentials are configured in .env.local
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      <Header
        title="Overview"
        subtitle="K-10 Mathematics Curriculum Project"
        lastSync={stats.last_sync}
      />

      <div className="space-y-6">
        {/* KPI Cards */}
        <StatsCards stats={stats} />

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GradeProgressChart data={stats.assets_by_grade} />
          </div>
          <AssetTypeBreakdown data={stats.assets_by_type} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QCFunnel data={stats.qc_pipeline} />
          <PhaseComparison data={stats.assets_by_phase} />
          <VendorWorkload data={stats.assets_by_vendor} />
        </div>
      </div>
    </>
  );
}
