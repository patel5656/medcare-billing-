import React, { useEffect, useState } from 'react';
import { apiBillingService } from '../../services/api/apiBillingService';
import { apiCaseService } from '../../services/api/apiCaseService';
import { formatCurrency } from '../../utils/billingCalculations';
import { formatStatus } from '../../utils/formatters';
import { PrintableStatementModal } from '../../components/billing/PrintableStatementModal';
import { useUIStore } from '../../store/uiStore';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, FileText, CheckCircle2, Lock, Plus, FileCheck, Printer, FileSpreadsheet, Trash2, X, RefreshCw } from 'lucide-react';
import { exportToCSV, getTimestampedFilename } from '../../utils/exportUtils';

export const BillDetailsPage = () => {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showFinaliseModal, setShowFinaliseModal] = useState(false);
  const [showCounselingVisitsModal, setShowCounselingVisitsModal] = useState(false);
  const [counselingVisitsData, setCounselingVisitsData] = useState(null);
  const [selectedVisitIds, setSelectedVisitIds] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  const [paymentForm, setPaymentForm] = useState({ amount: 150, payerType: 'INSURANCE', referenceNumber: 'REF-9921', lineIndex: 0 });
  const [adjustmentForm, setAdjustmentForm] = useState({ amount: 50, reason: 'Contractual Adjustment', lineIndex: 0 });

  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const loadBill = () => {
    apiBillingService.getBillById(id).then(setBill).catch(console.error);
  };

  const openCounselingVisitsModal = async () => {
    if (!bill) return;
    setLoadingVisits(true);
    setShowCounselingVisitsModal(true);
    try {
      const data = await apiBillingService.getCounselingVisits(bill.patientId, bill.caseId);
      setCounselingVisitsData(data);
      // Pre-select visits already on this bill
      const currentLines = bill.lineItems || [];
      const currentVisitIds = (data.visits || []).filter(v => {
        return currentLines.some(l => l.id?.includes(v.id) || (l.dos === v.date && l.cptCode === v.cptCode));
      }).map(v => v.id);
      setSelectedVisitIds(currentVisitIds);
    } catch (err) {
      addToast('Failed to load counseling visits for this patient', 'error');
    } finally {
      setLoadingVisits(false);
    }
  };

  const handleSyncCounselingVisits = async () => {
    if (!bill) return;
    try {
      await apiBillingService.syncCounselingBill({
        billId: bill.id,
        caseId: bill.caseId,
        patientId: bill.patientId,
        selectedVisitIds
      });

      // Also sync case clinicalDocStorage so Counselor Statement Form 9 & 10 pick up selection
      if (bill.caseId) {
        try {
          const caseData = await apiCaseService.getCaseById(bill.caseId).catch(() => null);
          if (caseData) {
            const currentStorage = caseData.clinicalDocStorage || {};
            const form9Doc = { ...(currentStorage['FM_COUNSELING_FORM_9'] || {}), selectedVisitIds };
            const form10Doc = { ...(currentStorage['FM_COUNSELING_FORM_10'] || {}), selectedVisitIds };
            await apiCaseService.updateCase(bill.caseId, {
              clinicalDocStorage: {
                ...currentStorage,
                FM_COUNSELING_FORM_9: form9Doc,
                FM_COUNSELING_FORM_10: form10Doc
              }
            });
          }
        } catch (storageErr) {
          console.warn('Failed to sync case storage:', storageErr);
        }
      }

      addToast(`Synchronized ${selectedVisitIds.length} verified visit(s) to billing statement!`, 'success');
      setShowCounselingVisitsModal(false);
      loadBill();
    } catch (err) {
      addToast(err?.message || 'Failed to update counseling visits on bill', 'error');
    }
  };

  const handleDeleteServiceLine = async (lineId) => {
    if (!window.confirm('Are you sure you want to remove this CPT line from this bill statement?')) return;
    try {
      const updated = await apiBillingService.deleteServiceLine(bill.id, lineId);
      setBill(updated?.bill || updated);
      addToast('CPT line removed and bill total recalculated!', 'success');
      loadBill();
    } catch (err) {
      addToast(err?.message || 'Failed to remove CPT line', 'error');
    }
  };

  const handleRemoveCounselingLine = handleDeleteServiceLine;

  useEffect(() => {
    loadBill();
  }, [id]);

  if (!bill) return <div className="p-6 text-xs text-slate-500">Loading provider bill statement...</div>;

  const handleExportCSV = () => {
    try {
      const lineItems = (bill.lineItems || []).map((item, idx) => ({
        index: idx + 1,
        dos: item.dos || '',
        cptCode: item.cptCode || '',
        description: item.description || '',
        units: item.units || 1,
        charge: item.charge || 0,
        insPay: item.payments?.insurance || 0,
        patPay: item.payments?.patient || 0,
        adjustments: item.adjustments || 0,
        balance: item.lineBalance || 0
      }));

      const columns = [
        { key: 'index', label: 'Item #' },
        { key: 'dos', label: 'Date of Service (DOS)' },
        { key: 'cptCode', label: 'CPT / HCPCS' },
        { key: 'description', label: 'Description' },
        { key: 'units', label: 'Units' },
        { key: 'charge', label: 'Billed Charge ($)', formatter: (v) => formatCurrency(v) },
        { key: 'insPay', label: 'Insurance Paid ($)', formatter: (v) => formatCurrency(v) },
        { key: 'patPay', label: 'Patient Paid ($)', formatter: (v) => formatCurrency(v) },
        { key: 'adjustments', label: 'Adjustments ($)', formatter: (v) => formatCurrency(v) },
        { key: 'balance', label: 'Line Balance ($)', formatter: (v) => formatCurrency(v) },
      ];

      const filename = getTimestampedFilename(`bill_statement_${bill.statementNumber || bill.id}`, 'csv');
      exportToCSV(filename, lineItems, columns);
      addToast(`Exported ${lineItems.length} service lines to ${filename}`, 'success');
    } catch (err) {
      addToast('Failed to export statement CSV', 'error');
    }
  };

  const handlePostPayment = async (e) => {
    e.preventDefault();
    const remainingBalance = bill?.totals?.balanceDue !== undefined ? Number(bill.totals.balanceDue) : (bill?.balanceDue !== undefined ? Number(bill.balanceDue) : 0);
    if (Number(paymentForm.amount) > remainingBalance) {
      addToast(`Payment amount ($${Number(paymentForm.amount).toFixed(2)}) cannot exceed remaining balance ($${remainingBalance.toFixed(2)}).`, 'warning');
      return;
    }
    try {
      const updated = await apiBillingService.postPayment(bill.id, {
        lineIndex: paymentForm.lineIndex,
        amount: Number(paymentForm.amount),
        type: paymentForm.payerType,
        checkRef: paymentForm.referenceNumber
      });
      setBill(updated);
      setShowPaymentModal(false);
      addToast('Payment posted directly to database!', 'success');
    } catch (err) {
      addToast(err?.message || 'Failed to post payment', 'error');
    }
  };

  const handlePostAdjustment = async (e) => {
    e.preventDefault();
    const remainingBalance = bill?.totals?.balanceDue !== undefined ? Number(bill.totals.balanceDue) : 0;
    if (remainingBalance <= 0) {
      addToast('This bill has a $0 remaining balance. No further adjustments can be applied.', 'warning');
      return;
    }
    if (Number(adjustmentForm.amount) > remainingBalance) {
      addToast(`Adjustment amount ($${Number(adjustmentForm.amount).toFixed(2)}) cannot exceed remaining balance ($${remainingBalance.toFixed(2)}).`, 'warning');
      return;
    }
    try {
      const updated = await apiBillingService.postAdjustment(bill.id, {
        lineIndex: adjustmentForm.lineIndex,
        amount: Number(adjustmentForm.amount),
        reason: adjustmentForm.reason
      });
      setBill(updated);
      setShowAdjustmentModal(false);
      addToast('Adjustment posted directly to database!', 'success');
    } catch (err) {
      addToast(err?.message || 'Failed to post adjustment', 'error');
    }
  };

  const handleFinalise = async () => {
    try {
      const updated = await apiBillingService.finaliseBill(bill.id);
      setBill(updated);
      setShowFinaliseModal(false);
      addToast('Bill finalized and locked in database!', 'success');
    } catch (err) {
      addToast('Failed to finalise bill', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/billing/provider-bills')} className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:underline cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to Provider Bills Ledger
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{bill.providerName} Statement</h1>
            <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-bold text-xs border border-teal-200">
              {formatStatus(bill.status)}
            </span>
          </div>
          <p className="text-xs text-slate-500">Statement #{bill.statementNumber} | Case #{bill.caseId} | {bill.patientName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {bill.providerId === 'prov-counselor' && bill.status !== 'FINALIZED' && bill.status !== 'FINALISED' && bill.status !== 'FINALISED_DEMO' && (
            <button
              onClick={openCounselingVisitsModal}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              title="Select / Sync completed counseling encounters"
            >
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Manage Recorded Visits
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title="Download Service Lines CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" /> Export CSV
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-teal-400" /> Print PDF Statement
          </button>
          <button onClick={() => setShowPaymentModal(true)} className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer">
            Post Payment
          </button>
          <button onClick={() => setShowAdjustmentModal(true)} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer">
            Post Adjustment
          </button>
          {bill.status !== 'FINALIZED' && bill.status !== 'FINALISED' && bill.status !== 'FINALISED_DEMO' && (
            <button onClick={() => setShowFinaliseModal(true)} className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer">
              Finalise Bill
            </button>
          )}
        </div>
      </div>

      {/* Bill Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Itemized Service Line Ledger</h2>
            {bill.providerId === 'prov-counselor' && (
              <p className="text-[11px] text-slate-500">Billed only from verified completed counseling sessions</p>
            )}
          </div>
          <span className="text-xs text-slate-500 font-semibold">{(bill.lineItems || []).length} Service Lines</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">DOS</th>
                <th className="p-3">CPT / Code</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Units</th>
                <th className="p-3 text-right">Charge</th>
                <th className="p-3 text-right">Ins. Pay</th>
                <th className="p-3 text-right">Pat. Pay</th>
                <th className="p-3 text-right">Adjustment</th>
                <th className="p-3 text-right">Line Balance</th>
                {bill.status !== 'FINALIZED' && bill.status !== 'FINALISED' && bill.status !== 'FINALISED_DEMO' && (
                  <th className="p-3 text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-tabular">
              {(bill.lineItems || []).length === 0 ? (
                <tr>
                  <td colSpan={bill.status !== 'FINALIZED' && bill.status !== 'FINALISED' && bill.status !== 'FINALISED_DEMO' ? 10 : 9} className="py-8 px-4 text-center text-slate-500 bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <p className="font-semibold text-xs text-slate-700">No CPT billing lines present for this statement.</p>
                      <p className="text-[11px] text-slate-400">All lines have been removed or no charges were recorded ($0.00 balance due).</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (bill.lineItems || []).map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500">{item.dos}</td>
                    <td className="p-3 font-bold text-slate-900">{item.cptCode}</td>
                    <td className="p-3 text-slate-800">{item.description}</td>
                    <td className="p-3 text-right font-mono">{item.units}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(item.charge)}</td>
                    <td className="p-3 text-right font-semibold text-emerald-600">{formatCurrency(item.payments?.insurance || 0)}</td>
                    <td className="p-3 text-right font-semibold text-emerald-600">{formatCurrency(item.payments?.patient || 0)}</td>
                    <td className="p-3 text-right font-semibold text-amber-600">{formatCurrency(item.adjustments || 0)}</td>
                    <td className="p-3 text-right font-bold text-teal-700">{formatCurrency(item.lineBalance || 0)}</td>
                    {bill.status !== 'FINALIZED' && bill.status !== 'FINALISED' && bill.status !== 'FINALISED_DEMO' && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteServiceLine(item.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove CPT line from bill statement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500"><span>Total Charges:</span><span className="font-bold text-slate-900 font-tabular">{formatCurrency(bill.totals?.totalCharges || 0)}</span></div>
            <div className="flex justify-between text-emerald-600"><span>Total Payments:</span><span className="font-bold font-tabular">{formatCurrency(bill.totals?.totalPayments || 0)}</span></div>
            <div className="flex justify-between text-amber-600"><span>Total Adjustments:</span><span className="font-bold font-tabular">{formatCurrency(bill.totals?.totalAdjustments || 0)}</span></div>
            <div className="flex justify-between text-sm font-bold text-teal-700 pt-2 border-t border-slate-200">
              <span>Balance Due:</span>
              <span className="font-tabular">{formatCurrency(bill.totals?.balanceDue || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Printable Statement Modal */}
      {showPrintModal && (
        <PrintableStatementModal bill={bill} onClose={() => setShowPrintModal(false)} />
      )}

      {/* Post Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handlePostPayment} className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Post Payment</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Amount ($)</label>
              <input type="number" required value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full px-3 py-2 text-xs border rounded-xl" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Payer Type</label>
              <select value={paymentForm.payerType} onChange={(e) => setPaymentForm({...paymentForm, payerType: e.target.value})} className="w-full px-3 py-2 text-xs border rounded-xl">
                <option value="INSURANCE">Auto Insurance Payer</option>
                <option value="PATIENT">Patient Out-of-Pocket</option>
                <option value="ATTORNEY_LOP">Attorney LOP Settlement</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-sm">Submit Payment</button>
            </div>
          </form>
        </div>
      )}

      {/* Post Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handlePostAdjustment} className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Post Adjustment</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Amount ($)</label>
              <input type="number" required value={adjustmentForm.amount} onChange={(e) => setAdjustmentForm({...adjustmentForm, amount: e.target.value})} className="w-full px-3 py-2 text-xs border rounded-xl" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Reason</label>
              <input type="text" required value={adjustmentForm.reason} onChange={(e) => setAdjustmentForm({...adjustmentForm, reason: e.target.value})} className="w-full px-3 py-2 text-xs border rounded-xl" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdjustmentModal(false)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-sm">Submit Adjustment</button>
            </div>
          </form>
        </div>
      )}

      {/* Finalise Confirmation Modal */}
      {showFinaliseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 mb-2">
              <Lock className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Finalise Bill Statement?</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to finalise this bill? This action will <strong>lock the service lines and charges</strong>. You will not be able to add new treatments or codes to this statement.
            </p>
            <p className="text-xs text-slate-500">
              You can still post payments and adjustments after finalizing.
            </p>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowFinaliseModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Counseling Visits Modal */}
      {showCounselingVisitsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Manage Recorded Counseling Encounters</h3>
                  <p className="text-[11px] text-slate-500">Statement #{bill.statementNumber} | {bill.patientName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCounselingVisitsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select or deselect completed counseling sessions to synchronize with this statement. Charges and balance due will update automatically.
            </p>

            {loadingVisits ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
                Loading patient counseling records...
              </div>
            ) : !counselingVisitsData || counselingVisitsData.visits.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                No counseling visits recorded in the database for this patient.
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Recorded</div>
                    <div className="font-bold text-slate-800">{counselingVisitsData.totalRecorded}</div>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="text-[10px] text-emerald-700 font-bold uppercase">Eligible</div>
                    <div className="font-bold text-emerald-800">{counselingVisitsData.completedCount}</div>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="text-[10px] text-indigo-700 font-bold uppercase">Selected</div>
                    <div className="font-bold text-indigo-800">{selectedVisitIds.length}</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3 w-10 text-center">Include</th>
                        <th className="p-3">DOS</th>
                        <th className="p-3">CPT</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Fee</th>
                        <th className="p-3">Eligibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {counselingVisitsData.visits.map(v => {
                        const isIncluded = selectedVisitIds.includes(v.id);
                        const isCurrentBillItem = (bill.lineItems || []).some(
                          l => l.id?.includes(v.id) || (l.dos === v.date && l.cptCode === v.cptCode)
                        );
                        const isCompleted = v.status === 'COMPLETED';
                        const isBilledElsewhere = v.isBilled && !isCurrentBillItem;
                        const canToggle = isCompleted && !isBilledElsewhere;

                        return (
                          <tr
                            key={v.id}
                            className={`${isIncluded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'} transition`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isIncluded}
                                disabled={!canToggle}
                                onChange={() => {
                                  setSelectedVisitIds(prev =>
                                    prev.includes(v.id) ? prev.filter(id => id !== v.id) : [...prev, v.id]
                                  );
                                }}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">{v.date}</td>
                            <td className="p-3">
                              <span className="font-bold">{v.cptCode || '90834'}</span>
                              <div className="text-[10px] text-slate-500">{v.appointmentType || 'Psychotherapy'}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-800">
                              ${Number(v.charge || (v.cptCode === '90791' ? 350 : 180)).toFixed(2)}
                            </td>
                            <td className="p-3">
                              {isBilledElsewhere ? (
                                <span className="text-[10px] text-slate-500 font-semibold">Billed on other stmt</span>
                              ) : isCompleted ? (
                                <span className="text-[10px] text-emerald-700 font-bold">Eligible</span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Ineligible ({v.status})</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCounselingVisitsModal(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSyncCounselingVisits}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Sync Statement ({selectedVisitIds.length} Visits)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
