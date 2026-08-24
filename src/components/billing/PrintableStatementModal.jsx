// src/components/billing/PrintableStatementModal.jsx
import React from 'react';
import { formatCurrency } from '../../utils/billingCalculations';
import { Printer, X, ShieldCheck, Download, FileSpreadsheet } from 'lucide-react';
import { exportToCSV, getTimestampedFilename, triggerPrint } from '../../utils/exportUtils';
import { useUIStore } from '../../store/uiStore';

export const PrintableStatementModal = ({ bill, onClose }) => {
  const { addToast } = useUIStore();
  if (!bill) return null;

  const handlePrint = () => {
    triggerPrint('printable-statement');
    addToast('Opening print dialog for Official Billing Statement...', 'info');
  };

  const handleExportCSV = () => {
    try {
      const lineItems = (bill.lineItems || []).map((item, idx) => ({
        index: idx + 1,
        dos: item.dos || '',
        cptCode: item.cptCode || '',
        description: item.description || '',
        charge: item.charge || 0,
        insPay: item.payments?.insurance || 0,
        patPay: item.payments?.patient || 0,
        adjustments: item.adjustments || 0,
        balance: item.lineBalance || 0
      }));

      const columns = [
        { key: 'index', label: 'Item #' },
        { key: 'dos', label: 'Date of Service' },
        { key: 'cptCode', label: 'CPT / HCPCS' },
        { key: 'description', label: 'Procedure Description' },
        { key: 'charge', label: 'Charge ($)', formatter: (v) => formatCurrency(v) },
        { key: 'insPay', label: 'Insurance Paid ($)', formatter: (v) => formatCurrency(v) },
        { key: 'patPay', label: 'Patient Paid ($)', formatter: (v) => formatCurrency(v) },
        { key: 'adjustments', label: 'Adjustment ($)', formatter: (v) => formatCurrency(v) },
        { key: 'balance', label: 'Balance Due ($)', formatter: (v) => formatCurrency(v) },
      ];

      const filename = getTimestampedFilename(`statement_${bill.statementNumber || bill.id}`, 'csv');
      exportToCSV(filename, lineItems, columns);
      addToast(`Exported statement line items to ${filename}`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to export statement CSV', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto printable-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 p-4 sm:p-6 space-y-6 text-slate-900 font-sans printable-modal">
        
        {/* Top Control Bar (Hidden during printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Official Billing Statement Preview</h2>
              <p className="text-[11px] text-slate-500 font-mono">Statement #{bill.statementNumber} &bull; {bill.providerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
              title="Download line items spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" /> Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PAPER STATEMENT LAYOUT (Matching NUCC / Sample PDF Layout) */}
        <div id="printable-statement" className="p-6 sm:p-8 border border-slate-200 rounded-xl bg-white space-y-6 print:border-none print:p-0 print:m-0 printable-area">
          
          {/* Statement Top Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">{bill.providerName}</h1>
              <p className="text-xs text-slate-600 mt-1">{bill.providerAddress || '123 Medical Center Blvd, Houston, TX 77030'}</p>
              <p className="text-xs text-slate-600">TEL: {bill.providerPhone || '(832) 555-0199'} &bull; FAX: (832) 416-1502</p>
              {bill.provider?.identifiers?.taxId && (
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">Federal Tax ID: {bill.provider.identifiers.taxId} | NPI: {bill.provider.identifiers.npi || '1992837482'}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">Billing Statement</h2>
              <p className="text-xs font-bold text-slate-700 mt-1">Statement No: <span className="font-mono text-slate-900 font-black">{bill.statementNumber || 'N/A'}</span></p>
              <p className="text-xs font-semibold text-slate-600">Statement Date: <span className="font-mono">{bill.statementDate || new Date().toISOString().split('T')[0]}</span></p>
            </div>
          </div>

          {/* Bill To & Case Info Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bill To / Payer:</p>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">{bill.billToName || 'Personal Injury Settlement Claim'}</h3>
              <p className="text-xs text-slate-700 whitespace-pre-line mt-0.5">{bill.billToAddress || 'c/o Progressive County Mutual Insurance\nPO Box 94743, Cleveland, OH 44101'}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient &amp; Claim Reference:</p>
              <p><strong className="text-slate-900">Patient:</strong> {bill.patientName}</p>
              <p><strong className="text-slate-900">Patient MRN:</strong> <span className="font-mono">{bill.patientSystemId || 'PAT-001'}</span></p>
              <p><strong className="text-slate-900">Accident Case:</strong> <span className="font-mono">{bill.caseId || 'CASE-2025-1227'}</span></p>
              <p><strong className="text-slate-900">Address:</strong> {bill.patientAddress || '1042 Westheimer Rd, Houston, TX'}</p>
            </div>
          </div>

          {/* Service Line Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r border-slate-300">Date of Service</th>
                  <th className="p-2.5 border-r border-slate-300">CPT / Code</th>
                  <th className="p-2.5 border-r border-slate-300">Description</th>
                  <th className="p-2.5 text-right border-r border-slate-300">Charge</th>
                  <th className="p-2.5 text-right border-r border-slate-300">Ins. Pay</th>
                  <th className="p-2.5 text-right border-r border-slate-300">Pat. Pay</th>
                  <th className="p-2.5 text-right border-r border-slate-300">Adjustment</th>
                  <th className="p-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(bill.lineItems || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 font-tabular">
                    <td className="p-2.5 border-r border-slate-200 font-mono text-slate-600">{item.dos}</td>
                    <td className="p-2.5 border-r border-slate-200 font-bold text-slate-900 font-mono">{item.cptCode}</td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-800">{item.description}</td>
                    <td className="p-2.5 text-right border-r border-slate-200 font-bold text-slate-900 font-mono">{formatCurrency(item.charge)}</td>
                    <td className="p-2.5 text-right border-r border-slate-200 text-emerald-700 font-mono">{formatCurrency(item.payments?.insurance || 0)}</td>
                    <td className="p-2.5 text-right border-r border-slate-200 text-emerald-700 font-mono">{formatCurrency(item.payments?.patient || 0)}</td>
                    <td className="p-2.5 text-right border-r border-slate-200 text-amber-700 font-mono">{formatCurrency(item.adjustments || 0)}</td>
                    <td className="p-2.5 text-right font-bold text-teal-800 font-mono">{formatCurrency(item.lineBalance || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Comments & Aging Grid Footer */}
          <div className="pt-2 space-y-4 print-avoid-break">
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-center text-xs font-tabular">
                <thead className="bg-slate-100 font-bold text-[10px] uppercase text-slate-700">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Current Due</th>
                    <th className="p-2 border-r border-slate-300">Past Due 30 Days</th>
                    <th className="p-2 border-r border-slate-300">Past Due 60 Days</th>
                    <th className="p-2 border-r border-slate-300">Past Due 90 Days</th>
                    <th className="p-2 bg-slate-900 text-white">Balance Due</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-bold text-slate-900">
                    <td className="p-2.5 border-r border-slate-300 font-mono">{formatCurrency(bill.aging?.current || 0)}</td>
                    <td className="p-2.5 border-r border-slate-300 font-mono">{formatCurrency(bill.aging?.past30 || 0)}</td>
                    <td className="p-2.5 border-r border-slate-300 font-mono">{formatCurrency(bill.aging?.past60 || 0)}</td>
                    <td className="p-2.5 border-r border-slate-300 font-mono">{formatCurrency(bill.aging?.past90 || 0)}</td>
                    <td className="p-2.5 bg-teal-50 text-teal-800 font-black text-sm font-mono">{formatCurrency(bill.totals?.balanceDue || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-center pt-2 border-t border-slate-200">
              <p className="text-[10px] text-slate-500 italic">
                Thank you for choosing {bill.providerName}. Please remit payments with Statement No #{bill.statementNumber || 'N/A'}. For billing inquiries, contact {bill.providerPhone || '(832) 555-0199'}.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

