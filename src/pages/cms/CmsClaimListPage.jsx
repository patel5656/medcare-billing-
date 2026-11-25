import React, { useEffect, useState } from 'react';
import { apiCms1500Service, sortClaimsNewestFirst } from '../../services/api/apiCms1500Service';
import { apiBillingService } from '../../services/api/apiBillingService';
import { apiCaseService } from '../../services/api/apiCaseService';
import { formatCurrency } from '../../utils/billingCalculations';
import { Search, Eye, Download, FileSpreadsheet, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ExportDataModal } from '../../components/common/ExportDataModal';
import { exportToCSV, getTimestampedFilename } from '../../utils/exportUtils';
import { useUIStore } from '../../store/uiStore';
import { apiProviderService } from '../../services/api/apiProviderService';
import { getProviderDisplayName, matchesProviderFilter } from '../../utils/providerFilterUtils';
import Pagination from '../../components/common/Pagination';

export const CmsClaimListPage = () => {
  const [allClaims, setAllClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [providersMap, setProvidersMap] = useState({});
  const ITEMS_PER_PAGE = 10;
  const { addToast, activeProviderFilter, setProviderFilter } = useUIStore();
  const navigate = useNavigate();

  useEffect(() => {
    apiProviderService.getProviders().then(data => {
      if (data) setProvidersMap(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    apiCms1500Service.getAllClaims()
      .then(claims => setAllClaims(sortClaimsNewestFirst(claims || [])))
      .catch(err => {
        console.error('Failed to fetch claims queue:', err);
        setAllClaims([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Reset page to 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeProviderFilter]);

  const filteredClaims = allClaims.filter(c => {
    // 1. Global Navbar Provider/Modality Filter
    if (activeProviderFilter && activeProviderFilter !== 'ALL') {
      if (!matchesProviderFilter(c.providerId, c.providerName, activeProviderFilter)) {
        return false;
      }
    }

    // 2. Search Query Filter
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (c.patientName || c.box2 || '').toLowerCase().includes(q) ||
      (c.providerName || '').toLowerCase().includes(q) ||
      (c.dosDisplay || '').includes(q) ||
      (c.box17ReferringName || '').toLowerCase().includes(q) ||
      (c.box21Diagnoses || []).some(d => d.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredClaims.length / ITEMS_PER_PAGE);
  const currentClaims = filteredClaims.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const claimExportColumns = [
    { key: 'claimId', label: 'Claim ID' },
    { key: 'dosDisplay', label: 'Date of Service (DOS)' },
    { key: 'providerName', label: 'Billing Provider' },
    { key: 'patientName', label: 'Patient Name', formatter: (v, row) => row.patientName || row.box2 || '' },
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

      {/* Active Provider Filter Banner */}
      {activeProviderFilter && activeProviderFilter !== 'ALL' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-teal-50/90 border border-teal-200 px-4 py-2.5 rounded-2xl text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-teal-900 font-medium">
            <Filter className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Active Provider Filter: <strong className="font-bold text-teal-950">{getProviderDisplayName(activeProviderFilter, providersMap)}</strong>
            </span>
            <span className="text-[11px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
              {filteredClaims.length} of {allClaims.length} claim{allClaims.length === 1 ? '' : 's'} shown
            </span>
          </div>
          <button
            onClick={() => setProviderFilter('ALL')}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-teal-100 text-teal-700 hover:text-teal-900 border border-teal-200 rounded-xl font-bold text-xs shadow-2xs transition cursor-pointer self-start sm:self-auto"
            title="Clear filter and view all claims"
          >
            <X className="w-3.5 h-3.5" />
            <span>Show All Practice Providers</span>
          </button>
        </div>
      )}

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
              {allClaims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    No claims found. No CMS-1500 claims have been generated yet.
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>
                        No claims match the active provider filter <strong className="text-slate-800">"{getProviderDisplayName(activeProviderFilter, providersMap)}"</strong>{search ? ` and search "${search}"` : ''}.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        ({allClaims.length} total claims exist across practice providers)
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {activeProviderFilter !== 'ALL' && (
                          <button
                            onClick={() => setProviderFilter('ALL')}
                            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Show All Practice Providers
                          </button>
                        )}
                        {search && (
                          <button
                            onClick={() => setSearch('')}
                            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Clear Search
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentClaims.map((claim) => (
                  <tr key={claim.claimId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {claim.dosDisplay}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {claim.providerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      {claim.patientName || claim.box2}
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

        {/* -- Pagination -- */}
        {totalPages > 1 && (
          <div className="border-t border-slate-200 p-3">
            <Pagination
              currentPage={currentPage}
              pageSize={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              totalItems={filteredClaims.length}
            />
          </div>
        )}
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
