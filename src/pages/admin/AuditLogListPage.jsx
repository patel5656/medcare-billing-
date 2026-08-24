// src/pages/admin/AuditLogListPage.jsx
import React, { useEffect, useState } from 'react';
import { apiAuditService } from '../../services/api/apiAuditService';
import { Activity, ShieldAlert, Download, FileSpreadsheet, Printer, ShieldCheck } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { ExportDataModal } from '../../components/common/ExportDataModal';
import { triggerPrint } from '../../utils/exportUtils';

export const AuditLogListPage = () => {
  const [logs, setLogs] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const { activeProviderFilter, addToast } = useUIStore();

  useEffect(() => {
    apiAuditService.getLogs(activeProviderFilter).then(setLogs).catch(() => {});
  }, [activeProviderFilter]);

  const auditExportColumns = [
    { key: 'timestamp', label: 'Timestamp (UTC / Local)' },
    { key: 'user', label: 'Authorized User' },
    { key: 'role', label: 'Security Role' },
    { key: 'action', label: 'Action Code' },
    { key: 'resource', label: 'Target Resource / Entity' },
    { key: 'ipAddress', label: 'IP Address / Session' },
  ];

  const handlePrintAudit = () => {
    triggerPrint('printable-audit-trail');
    addToast('Opening print dialog for Security Audit Trail...', 'info');
  };

  return (
    <div id="printable-audit-trail" className="space-y-6">
      
      {/* Print-Only Header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase">MedPractice Pro &bull; Official Security &amp; Compliance Audit Trail</h1>
            <p className="text-xs text-slate-600">256-bit Immutable Activity Log &bull; HIPAA Title II Security Compliance</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Filter: {activeProviderFilter} &bull; Generated: {new Date().toLocaleString()}</p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg font-mono">
            VERIFIED AUDIT LOG
          </span>
        </div>
      </div>

      {/* Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            Security &amp; Operational Audit Trails
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable activity logs, chart signatures, bill finalisations &amp; demo IP session tracking
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handlePrintAudit}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-teal-400" /> Export PDF
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Audit Log
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4 printable-area">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-700">Audit Events ({logs.length} Recorded)</span>
          <span className="text-[11px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Real-time Immutable Ledger
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Action Code</th>
                <th className="p-3.5">Resource Description</th>
                <th className="p-3.5">IP Session Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-slate-400">
                    No audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3.5 font-bold text-slate-900">{log.user}</td>
                    <td className="p-3.5"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold text-[11px] border border-slate-200">{log.role}</span></td>
                    <td className="p-3.5 font-mono text-emerald-700 font-bold">{log.action}</td>
                    <td className="p-3.5 text-slate-800">{log.resource}</td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{log.ipAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Security Audit Trail"
        subtitle={`Exporting ${logs.length} immutable compliance and security audit logs`}
        data={logs}
        availableColumns={auditExportColumns}
        defaultFilename="security_audit_trail"
        printableContainerId="printable-audit-trail"
      />
    </div>
  );
};

