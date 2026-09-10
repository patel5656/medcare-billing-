import React, { useEffect, useState } from 'react';
import { apiCms1500Service, sortClaimsNewestFirst } from '../../services/api/apiCms1500Service';
import { apiBillingService } from '../../services/api/apiBillingService';
import { apiCaseService } from '../../services/api/apiCaseService';
import { formatCurrency } from '../../utils/billingCalculations';
import { Search, Eye, Download, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ExportDataModal } from '../../components/common/ExportDataModal';
import { exportToCSV, getTimestampedFilename } from '../../utils/exportUtils';
import { useUIStore } from '../../store/uiStore';

export const CmsClaimListPage = () => {
  const [allClaims, setAllClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const { addToast, activeProviderFilter } = useUIStore();
  const navigate = useNavigate();

  useEffect(() => {
    apiCms1500Service.getAllClaims()
      .then(claims => setAllClaims(sortClaimsNewestFirst(claims || [])))
      .catch(err => {
        console.error('Failed to fetch claims queue:', err);
        setAllClaims([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredClaims = allClaims.filter(c => {
    // 1. Global Navbar Provider/Modality Filter
    if (activeProviderFilter && activeProviderFilter !== 'ALL') {
      const claimProvId = (c.providerId || '').toLowerCase();
      const claimProvName = (c.providerName || '').toLowerCase();
      const filterId = activeProviderFilter.toLowerCase();

      const isExactMatch = claimProvId === filterId;
      const isAliasMatch = 
        (filterId.includes('josmic') && claimProvName.includes('josmic')) ||
        (filterId.includes('dav') && (claimProvName.includes('dav') || claimProvName.includes('anatomy'))) ||
        (filterId.includes('anik') && claimProvName.includes('anik')) ||
        (filterId.includes('counselor') && (claimProvName.includes('counselor') || claimProvName.includes('behavioral') || claimProvName.includes('hope'))) ||
        (filterId.includes('tpi') && (claimProvName.includes('trigger') || claimProvName.includes('tpi'))) ||
        (filterId.includes('tecar') && (claimProvName.includes('tecar') || claimProvName.includes('physio')));

      if (!isExactMatch && !isAliasMatch) {
        return false;
      }
    }

    // 2. Search Query Filter
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (c.box2 || '').toLowerCase().includes(q) ||
      (c.providerName || '').toLowerCase().includes(q) ||
      (c.dosDisplay || '').includes(q) ||
      (c.box17ReferringName || '').toLowerCase().includes(q) ||
      (c.box21Diagnoses || []).some(d => d.toLowerCase().includes(q))
    );
  });

  const claimExportColumns = [
    { key: 'claimId', label: 'Claim ID' },
    { key: 'dosDisplay', label: 'Date of Service (DOS)' },
    { key: 'providerName', label: 'Billing Provider' },
    { key: 'box2', label: 'Patient Name' },
    { key: 'box17ReferringName', label: 'Box 17 Referring Provider' },
    { key: 'box21Diagnoses', label: 'Box 21 Diagnoses', formatter: (v) => Array.isArray(v) ? v.join('; ') : String(v || '') },
    { key: 'box28TotalCharge', label: 'Box 28 Total Billed ($)', formatter: (v) => formatCurrency(parseFloat(v) || 0) },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">CMS-1500 Claims Queue</h1>
          <p className="text-xs text-slate-500">Date-grouped health insurance claims generated from provider bills (Form 02/12)</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claims..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
            />
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Export Claims Queue to CSV / JSON"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" /> Export
          </button>
        </div>
      </div>

      {/* Clean & Simple Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wide">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Claim DOS</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Box 17 Referring</th>
                <th className="py-3 px-4">Diagnoses (Box 21)</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Total Charge</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-xs text-slate-400">
                    No claims found.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.claimId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {claim.dosDisplay}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {claim.providerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      {claim.box2}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {claim.box17ReferringName || 'Dr. Segun Adeoye'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 max-w-[220px]">
                      {(claim.box21Diagnoses || []).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(parseFloat(claim.box28TotalCharge) || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                        {claim.status || 'Generated & Validated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/cms-1500/${claim.billId}/preview`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition shadow-2xs cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Form</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Claims Modal */}
      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export CMS-1500 Claims Queue"
        subtitle={`Exporting ${filteredClaims.length} validated health insurance claims`}
        data={filteredClaims}
        availableColumns={claimExportColumns}
        defaultFilename="cms1500_claims_register"
      />
    </div>
  );
};
