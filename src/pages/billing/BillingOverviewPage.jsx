// src/pages/billing/BillingOverviewPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { apiBillingService } from '../../services/api/apiBillingService';
import { formatCurrency } from '../../utils/billingCalculations';
import { useSettings } from '../../utils/settingsCache';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { getProviderDisplayName } from '../../utils/providerFilterUtils';
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Layers, Filter, RefreshCw, AlertTriangle } from 'lucide-react';

export const BillingOverviewPage = () => {
  const settings = useSettings();
  const { activeProviderFilter, setProviderFilter } = useUIStore();
  const [data, setData] = useState({
    kpis: { totalBilled: 0, amountCollected: 0, totalAdjustments: 0, outstandingBalance: 0, past90Overdue: 0 },
    agingBuckets: { current: 0, past30: 0, past60: 0, past90: 0, over90: 0, grandTotal: 0 },
    providers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiBillingService.getOverviewStats(activeProviderFilter);
      if (res) {
        setData({
          kpis: res.kpis || { totalBilled: 0, amountCollected: 0, totalAdjustments: 0, outstandingBalance: 0, past90Overdue: 0 },
          agingBuckets: res.agingBuckets || { current: 0, past30: 0, past60: 0, past90: 0, over90: 0, grandTotal: 0 },
          providers: res.providers || []
        });
      }
    } catch (err) {
      console.error('Error fetching billing overview stats:', err);
      setError(err.message || 'Failed to load billing metrics from server.');
    } finally {
      setLoading(false);
    }
  }, [activeProviderFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const { kpis, agingBuckets: aging, providers } = data;
  const isFiltered = activeProviderFilter && activeProviderFilter !== 'ALL';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Billing Overview</h1>
          <p className="text-xs text-slate-500">
            {isFiltered
              ? `Filtered financial metrics for ${getProviderDisplayName(activeProviderFilter)}`
              : `Practice-wide financial summary across all ${providers.length} provider billing ledgers`}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
          title="Refresh Billing Overview"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Active Provider Filter Banner */}
      {isFiltered && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-teal-50/90 border border-teal-200 px-4 py-2.5 rounded-2xl text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-teal-900 font-medium">
            <Filter className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Active Provider Filter: <strong className="font-bold text-teal-950">{getProviderDisplayName(activeProviderFilter)}</strong>
            </span>
            <span className="text-[11px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
              Filtered View
            </span>
          </div>
          <button
            onClick={() => setProviderFilter('ALL')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer self-start sm:self-auto"
          >
            Show All Practice Providers
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="font-bold underline hover:text-red-950 cursor-pointer ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards — Responsive text & padding */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Billed', value: formatCurrency(kpis.totalBilled || 0), icon: DollarSign, color: 'teal' },
          { label: 'Amount Collected', value: formatCurrency(kpis.amountCollected || 0), icon: CheckCircle, color: 'emerald' },
          {
            label: 'Outstanding Balance',
            value: formatCurrency(kpis.outstandingBalance || 0),
            subtext: kpis.totalAdjustments > 0 ? `After ${formatCurrency(kpis.totalAdjustments)} adjustments` : null,
            icon: Clock,
            color: 'amber'
          },
          { label: '90+ Days Overdue', value: formatCurrency(kpis.past90Overdue || aging.over90 || 0), icon: AlertCircle, color: 'red' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">{card.label}</span>
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-${card.color}-500 flex-shrink-0`} />
              </div>
              <p className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 font-mono truncate">{card.value}</p>
              {card.subtext && (
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{card.subtext}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* AR Aging Buckets */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <h2 className="text-xs sm:text-sm font-bold text-slate-700 mb-3 sm:mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-500" /> Accounts Receivable Aging Buckets
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            { label: 'Current', value: aging.current, color: 'emerald' },
            { label: '1–30 Days', value: aging.past30, color: 'blue' },
            { label: '31–60 Days', value: aging.past60, color: 'amber' },
            { label: '61–90 Days', value: aging.past90, color: 'orange' },
            { label: '90+ Days', value: aging.over90, color: 'red' },
          ].map(b => (
            <div key={b.label} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase truncate">{b.label}</p>
              <p className={`text-xs sm:text-base font-black text-${b.color}-600 font-mono truncate mt-0.5`}>
                {formatCurrency(b.value || 0)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Billing Summary — Touch scrollable table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-500" /> Provider Billing Summary
          </h2>
          <button onClick={() => navigate('/billing/provider-bills')} className="text-xs font-bold text-teal-600 hover:underline cursor-pointer">
            Open Provider Bills Ledger →
          </button>
        </div>
        <div className="overflow-x-auto">
          {providers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No provider billing records found for the selected criteria.
            </div>
          ) : (
            <table className="w-full text-xs min-w-[550px]">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 text-left">Provider</th>
                  <th className="p-3 text-left">Specialty</th>
                  <th className="p-3 text-right">Total Billed</th>
                  <th className="p-3 text-right">Collected</th>
                  <th className="p-3 text-right">Adjustments</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providers.map(p => {
                  const lineBal = p.balance !== undefined ? p.balance : Math.max(0, (p.total || 0) - ((p.paid || 0) + (p.adjustments || 0)));
                  return (
                    <tr key={p.id || p.name} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{p.name}</td>
                      <td className="p-3 text-slate-500">{p.specialty}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">{formatCurrency(p.total)}</td>
                      <td className="p-3 text-right font-mono text-emerald-600">{formatCurrency(p.paid)}</td>
                      <td className="p-3 text-right font-mono text-slate-500">{formatCurrency(p.adjustments || 0)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{formatCurrency(lineBal)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Finalised' ? 'bg-teal-100 text-teal-700' :
                          p.status === 'Issued' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{p.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
