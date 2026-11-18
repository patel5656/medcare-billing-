// src/components/packets/counselor/CounselorBillingStatementPart2Form.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { apiAppointmentService } from '../../../services/api/apiAppointmentService';
import { 
  filterAndSortCounselingVisits, 
  buildPart2StatementRows, 
  calculateReconciledStatementTotals 
} from '../../../utils/counselingBillingHelper';
import fmCounselingLogo from '../../../assets/fm_counseling_logo.png';

export const CounselorBillingStatementPart2Form = ({ 
  blankMode = false, 
  packetData = null, 
  bill = null, 
  readOnly = false,
  counselingVisits: propCounselingVisits = null 
}) => {
  const docKey = 'FM_COUNSELING_FORM_10';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Real patient-specific counseling visits state
  const [counselingVisits, setCounselingVisits] = useState(() => {
    if (propCounselingVisits && Array.isArray(propCounselingVisits)) {
      return filterAndSortCounselingVisits(propCounselingVisits, packetData?.id, packetData?.caseId);
    }
    if (packetData?.appointments && Array.isArray(packetData.appointments)) {
      return filterAndSortCounselingVisits(packetData.appointments, packetData?.id, packetData?.caseId);
    }
    return [];
  });

  const loadVisitsFromApi = useCallback(() => {
    const patientId = packetData?.patientId || packetData?.patient?.id;
    if (!patientId) return;

    apiAppointmentService.getAllAppointments({ patientId })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.appointments || []);
        const filtered = filterAndSortCounselingVisits(list, packetData?.id, packetData?.caseId);
        setCounselingVisits(filtered);
      })
      .catch(err => {
        console.error('Failed to load counseling visits in billing statement Part 2:', err);
      });
  }, [packetData?.patientId, packetData?.patient?.id, packetData?.id, packetData?.caseId]);

  useEffect(() => {
    if (propCounselingVisits && Array.isArray(propCounselingVisits)) {
      setCounselingVisits(filterAndSortCounselingVisits(propCounselingVisits, packetData?.id, packetData?.caseId));
    } else {
      loadVisitsFromApi();
    }

    window.addEventListener('focus', loadVisitsFromApi);
    return () => {
      window.removeEventListener('focus', loadVisitsFromApi);
    };
  }, [propCounselingVisits, loadVisitsFromApi]);

  // Continuation lines for sessions 14 onwards (supports unlimited visits)
  const part2Rows = buildPart2StatementRows(counselingVisits, bill);

  // Dynamic reconciled totals
  const reconciledTotals = calculateReconciledStatementTotals(counselingVisits, bill);

  // Form State
  const [formData, setFormData] = useState({
    rows: part2Rows,
    totalCharges: (reconciledTotals.totalChargesNum > 0 || (counselingVisits && counselingVisits.length > 0)) 
      ? reconciledTotals.totalCharges 
      : (storage.totalCharges !== undefined ? storage.totalCharges : reconciledTotals.totalCharges),
    paymentsCredits: (bill?.totals?.totalPayments !== undefined) 
      ? reconciledTotals.paymentsCredits 
      : (storage.paymentsCredits !== undefined ? storage.paymentsCredits : reconciledTotals.paymentsCredits),
    balanceDue: (reconciledTotals.totalChargesNum > 0 || (counselingVisits && counselingVisits.length > 0)) 
      ? reconciledTotals.balanceDue 
      : (storage.balanceDue !== undefined ? storage.balanceDue : reconciledTotals.balanceDue),
  });

  useEffect(() => {
    if (!blankMode) {
      const currentRows = buildPart2StatementRows(counselingVisits, bill);
      const totals = calculateReconciledStatementTotals(counselingVisits, bill);
      setFormData({
        rows: currentRows,
        totalCharges: totals.totalCharges,
        paymentsCredits: totals.paymentsCredits,
        balanceDue: totals.balanceDue,
      });
    }
  }, [
    packetData?.id, 
    packetData?._id, 
    packetData?.patientName, 
    bill?.id, 
    bill?.totals?.totalPayments, 
    bill?.totals?.payments, 
    counselingVisits, 
    blankMode
  ]);

  const handleChange = async (field, value) => {
    if (readOnly || blankMode) return;
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    const caseId = packetData?.id || packetData?._id;
    if (caseId) {
      try {
        const currentStorage = packetData.clinicalDocStorage || {};
        const updatedDoc = { ...(currentStorage[docKey] || {}), [field]: value };
        const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
        await apiCaseService.updateCase(caseId, { clinicalDocStorage: updatedStorage });
        packetData.clinicalDocStorage = updatedStorage;
      } catch (err) {
        console.error('Failed to save FM Counseling Center Form 10 to DB:', err);
      }
    }
  };

  const handleRowChange = async (index, field, value) => {
    if (readOnly || blankMode) return;
    const updatedRows = [...formData.rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    handleChange('rows', updatedRows);
  };

  return (
    <div className="w-[800px] max-w-full relative bg-white text-slate-900 font-sans mx-auto border border-slate-300 shadow-md p-10 sm:p-14 flex flex-col min-h-[1050px] print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-8 print:m-0 print:border-none print:shadow-none">
      
      {/* Top Header with FM Counseling Center Logo */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-2 mb-1">
          <img 
            src={fmCounselingLogo} 
            alt="FM Counseling Center Logo" 
            className="h-20 w-auto object-contain mx-auto" 
          />
        </div>
      </div>

      {/* Continuation of Service Lines Table */}
      <div className="w-full border-2 border-slate-900 mb-6">
        {formData.rows.map((row, idx) => (
          <div 
            key={idx} 
            className={`grid grid-cols-12 text-[11px] text-slate-800 ${idx < formData.rows.length - 1 ? 'border-b border-slate-900' : ''}`}
          >
            <div className="col-span-2 text-center py-2 px-1 border-r border-slate-900 font-medium flex items-center justify-center">
              {readOnly ? (
                <span>{blankMode ? '' : row.dos}</span>
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : row.dos}
                  onChange={(e) => handleRowChange(idx, 'dos', e.target.value)}
                  className="w-full text-center bg-transparent outline-none font-medium text-slate-800"
                />
              )}
            </div>
            <div className="col-span-2 text-center py-2 px-1 border-r border-slate-900 font-medium flex items-center justify-center">
              {readOnly ? (
                <span>{blankMode ? '' : row.cpt}</span>
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : row.cpt}
                  onChange={(e) => handleRowChange(idx, 'cpt', e.target.value)}
                  className="w-full text-center bg-transparent outline-none font-medium text-slate-800"
                />
              )}
            </div>
            <div className="col-span-6 py-2 px-3 border-r border-slate-900 font-medium flex items-center">
              {readOnly ? (
                <span>{blankMode ? '' : row.desc}</span>
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : row.desc}
                  onChange={(e) => handleRowChange(idx, 'desc', e.target.value)}
                  className="w-full bg-transparent outline-none font-medium text-slate-800"
                />
              )}
            </div>
            <div className="col-span-2 text-center py-2 px-1 font-medium flex items-center justify-center">
              {readOnly ? (
                <span>{blankMode ? '' : row.charge}</span>
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : row.charge}
                  onChange={(e) => handleRowChange(idx, 'charge', e.target.value)}
                  className="w-full text-center bg-transparent outline-none font-medium text-slate-800"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Financial Totals & Balance Due Box (Aligned Right) */}
      <div className="flex justify-end mt-4">
        <div className="w-80 border-2 border-slate-900 overflow-hidden">
          
          {/* Total Charges Row */}
          <div className="grid grid-cols-12 border-b border-slate-900 text-xs">
            <div className="col-span-7 bg-white p-2 font-semibold text-slate-800 border-r border-slate-900 flex items-center">
              Total Charges
            </div>
            <div className="col-span-5 bg-white p-2 font-bold text-slate-900 flex items-center justify-start pl-3">
              {readOnly ? (
                <span>{blankMode ? '' : formData.totalCharges}</span>
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.totalCharges}
                  onChange={(e) => handleChange('totalCharges', e.target.value)}
                  className="w-full font-bold text-slate-900 bg-transparent outline-none"
                />
              )}
            </div>
          </div>

          {/* Payments/Credits Row */}
          <div className="grid grid-cols-12 border-b border-slate-900 text-xs">
            <div className="col-span-7 bg-white p-2 font-semibold text-slate-800 border-r border-slate-900 flex items-center">
              Payments/Credits
            </div>
            <div className="col-span-5 bg-white p-2 font-medium text-slate-800 flex items-center justify-start pl-3">
              {readOnly ? (
                <span>{blankMode ? '' : formData.paymentsCredits}</span>
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.paymentsCredits}
                  onChange={(e) => handleChange('paymentsCredits', e.target.value)}
                  className="w-full font-medium text-slate-800 bg-transparent outline-none"
                />
              )}
            </div>
          </div>

          {/* Empty Divider Spacing Row */}
          <div className="grid grid-cols-12 border-b border-slate-900 text-xs h-6 bg-white">
            <div className="col-span-7 border-r border-slate-900"></div>
            <div className="col-span-5"></div>
          </div>

          {/* Balance Due Highlight Row (Maroon / Burgundy) */}
          <div className="grid grid-cols-12 bg-[#722F37] text-white text-xs font-bold">
            <div className="col-span-7 p-2.5 border-r border-slate-900 flex items-center tracking-wide">
              Balance Due
            </div>
            <div className="col-span-5 p-2.5 flex items-center justify-start pl-3 tracking-wide text-sm font-black">
              {readOnly ? (
                <span>{blankMode ? '' : formData.balanceDue}</span>
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.balanceDue}
                  onChange={(e) => handleChange('balanceDue', e.target.value)}
                  className="w-full text-white bg-transparent outline-none font-black text-sm"
                />
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
