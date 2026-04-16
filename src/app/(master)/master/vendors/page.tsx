'use client';

import Header from '@/components/layout/Header';
import { useVendors } from '@/lib/hooks';
import { Loader2, Users, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VendorsPage() {
  const { vendors, loading } = useVendors();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const totalAssets = vendors.reduce((sum, v) => sum + v.total, 0);

  return (
    <>
      <Header title="Vendors" subtitle={`${vendors.length} vendors / teams tracked`} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-indigo-600" />
            <span className="text-xs font-medium text-muted-foreground">Total Vendors</span>
          </div>
          <div className="text-2xl font-bold">{vendors.length}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground">Avg Assets/Vendor</span>
          </div>
          <div className="text-2xl font-bold">{vendors.length > 0 ? Math.round(totalAssets / vendors.length) : 0}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="text-xs font-medium text-muted-foreground">Top Completion</span>
          </div>
          <div className="text-2xl font-bold">
            {vendors.length > 0 ? `${Math.round(Math.max(...vendors.map(v => v.completion_rate)))}%` : '0%'}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-amber-600" />
            <span className="text-xs font-medium text-muted-foreground">Total Pending</span>
          </div>
          <div className="text-2xl font-bold">{vendors.reduce((sum, v) => sum + v.pending, 0)}</div>
        </div>
      </div>

      {/* Vendor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map((vendor) => {
          const rate = Math.round(vendor.completion_rate);
          return (
            <div
              key={vendor.name}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-smooth"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{vendor.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{vendor.total} assets assigned</p>
                </div>
                <span className={cn(
                  'text-lg font-bold',
                  rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-indigo-600'
                )}>
                  {rate}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${rate}%`,
                    backgroundColor: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#6366f1',
                  }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">{vendor.completed} done</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">{vendor.pending} pending</span>
                </div>
              </div>

              {/* Asset type breakdown */}
              {vendor.types && Object.keys(vendor.types).length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(vendor.types).map(([type, count]) => (
                      <span
                        key={type}
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-medium',
                          type === 'Slide' ? 'bg-indigo-50 text-indigo-600' :
                          type === 'Video' ? 'bg-rose-50 text-rose-600' :
                          'bg-emerald-50 text-emerald-600'
                        )}
                      >
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
