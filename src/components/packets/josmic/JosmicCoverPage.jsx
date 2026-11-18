// src/components/packets/josmic/JosmicCoverPage.jsx
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/billingCalculations';
import { apiCaseService } from '../../../services/api/apiCaseService';

/**
 * Format date string safely to MM/DD/YYYY
 */
const formatDateStr = (dateStr) => {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
  }
  return trimmed;
};

export const JosmicCoverPage = ({
  readOnly = false,
  blankMode = false,
  packetData = null,
  bill = null,
  serviceLines = []
}) => {
  const docKey = 'JOSMIC_COVER';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Extract patient info
  const pt = packetData?.patient || bill?.patient || {};
  const dbPatientName = bill?.patientName || packetData?.patientName ||
    (pt.firstName ? `${pt.firstName || ''} ${pt.lastName || ''}`.trim() : '') ||
    pt.name || 'Aregbe Kareem Ayinla';

  const dbPatientId = bill?.patientSystemId || pt.patientId ||
    packetData?.patient?.patientId || packetData?.patientId || packetData?.id || '161143192';

  // Extract Billed To info
  const dbBillToName = bill?.billToName || packetData?.attorneyName || packetData?.lawFirm || packetData?.attorney || 'OJ Lawal and Associates';
  const dbBillToAddress = bill?.billToAddress || packetData?.attorneyAddress || packetData?.lawFirmAddress || 'Houston, Texas 77031';

  // Extract Statement Number
  const dbStatementNumber = bill?.statementNumber || bill?.statementNo || bill?.billNumber || packetData?.statementNumber || '125639';

  // Compute Service Dates range
  const computeDosRange = () => {
    const lines = serviceLines && serviceLines.length > 0 ? serviceLines : (bill?.serviceLines || bill?.items || []);
    if (lines.length > 0) {
      const dates = lines
        .map(l => l.dos || l.dateOfService || l.date)
        .filter(Boolean)
        .map(formatDateStr);
      if (dates.length > 1) {
        return `${dates[0]} - ${dates[dates.length - 1]}`;
      } else if (dates.length === 1) {
        return dates[0];
      }
    }
    const initDate = formatDateStr(packetData?.initialDate || packetData?.incidentDate || '09/08/2026');
    const discDate = formatDateStr(packetData?.dischargeDate || '09/16/2026');
    return initDate && discDate && initDate !== discDate ? `${initDate} - ${discDate}` : initDate;
  };

  const dbServiceDates = computeDosRange();

  // Compute Total Balance
  const dbTotals = bill?.totals || {};
  const rawBalance = Number(dbTotals.balanceDue !== undefined && Number(dbTotals.balanceDue) > 0
    ? dbTotals.balanceDue
    : (bill?.balanceDue !== undefined && Number(bill.balanceDue) > 0
        ? bill.balanceDue
        : (dbTotals.totalCharges || 0))) || 0;
  const dbTotalBalance = formatCurrency(rawBalance > 0 ? rawBalance : 17100);

  // Local state for editable fields
  const [formData, setFormData] = useState({
    patientName: storage.patientName !== undefined ? storage.patientName : (blankMode ? '' : dbPatientName),
    patientId: storage.patientId !== undefined ? storage.patientId : (blankMode ? '' : dbPatientId),
    billToName: storage.billToName !== undefined ? storage.billToName : (blankMode ? '' : dbBillToName),
    billToAddress: storage.billToAddress !== undefined ? storage.billToAddress : (blankMode ? '' : dbBillToAddress),
    serviceDates: storage.serviceDates !== undefined ? storage.serviceDates : (blankMode ? '' : dbServiceDates),
    statementNumber: storage.statementNumber !== undefined ? storage.statementNumber : (blankMode ? '' : dbStatementNumber),
    totalBalance: storage.totalBalance !== undefined ? storage.totalBalance : (blankMode ? '' : dbTotalBalance),
  });

  useEffect(() => {
    if (blankMode) {
      setFormData({
        patientName: '',
        patientId: '',
        billToName: '',
        billToAddress: '',
        serviceDates: '',
        statementNumber: '',
        totalBalance: '',
      });
    } else {
      const s = packetData?.clinicalDocStorage?.[docKey] || {};
      setFormData({
        patientName: s.patientName !== undefined ? s.patientName : dbPatientName,
        patientId: s.patientId !== undefined ? s.patientId : dbPatientId,
        billToName: s.billToName !== undefined ? s.billToName : dbBillToName,
        billToAddress: s.billToAddress !== undefined ? s.billToAddress : dbBillToAddress,
        serviceDates: s.serviceDates !== undefined ? s.serviceDates : dbServiceDates,
        statementNumber: s.statementNumber !== undefined ? s.statementNumber : dbStatementNumber,
        totalBalance: s.totalBalance !== undefined ? s.totalBalance : dbTotalBalance,
      });
    }
  }, [
    packetData?.id,
    packetData?._id,
    packetData?.patientName,
    bill?.id,
    bill?.statementNumber,
    bill?.totals?.balanceDue,
    blankMode
  ]);

  const handleFieldChange = async (field, value) => {
    if (readOnly) return;
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
        console.error('Failed to auto-save Josmic Cover Page:', err);
      }
    }
  };

  return (
    <div
      className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 flex flex-col justify-between overflow-hidden print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none"
      style={{ width: '850px', minHeight: '1100px' }}
    >
      <div className="flex-1 flex flex-col">
        {/* Top Header Banner: Dark Burgundy Background matching reference design 1 & 2 */}
        <div className="bg-[#722F37] text-white p-6 sm:p-7 flex justify-between items-start">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
              FM HEALTH &amp; WELLNESS CENTER
            </h1>
            <p className="text-xs text-white/90 font-medium mt-1">
              9900 Westpark Drive, Suite 354 | Houston, TX 77063
            </p>
            <p className="text-xs text-white/90 font-medium mt-0.5">
              346-338-7020
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-8 sm:px-12 py-10 flex-1 flex flex-col items-center justify-start">
          {/* Centered Document Titles matching Reference Design 1 */}
          <div className="text-center my-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-wider uppercase">
              PAIN MANAGEMENT
            </h2>
            <h2 className="text-2xl sm:text-3xl font-black text-[#722F37] tracking-wider uppercase mt-1">
              BILLING STATEMENT
            </h2>
            <div className="w-80 sm:w-96 h-[2.5px] bg-[#722F37] mx-auto mt-4 mb-2"></div>
          </div>

          {/* Main Rounded Soft-Pink Card matching Reference Design 1 */}
          <div className="w-full max-w-2xl bg-[#fdf8f9] border border-[#eed8dc] rounded-2xl p-6 sm:p-7 shadow-sm text-left mt-4">
            {/* Top 2 Columns: PATIENT & BILLED TO */}
            <div className="grid grid-cols-2 gap-6">
              {/* PATIENT */}
              <div>
                <span className="block font-black text-[11px] text-[#722F37] tracking-wider uppercase mb-1">
                  PATIENT
                </span>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => handleFieldChange('patientName', e.target.value)}
                  placeholder="Patient Name"
                  disabled={readOnly}
                  className="w-full text-base sm:text-lg font-black text-slate-900 bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 -mx-1 outline-none transition"
                />
                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono mt-1">
                  <span>Patient ID:</span>
                  <input
                    type="text"
                    value={formData.patientId}
                    onChange={(e) => handleFieldChange('patientId', e.target.value)}
                    placeholder="Patient ID"
                    disabled={readOnly}
                    className="flex-1 font-mono text-xs text-slate-600 bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 outline-none transition"
                  />
                </div>
              </div>

              {/* BILLED TO */}
              <div>
                <span className="block font-black text-[11px] text-[#722F37] tracking-wider uppercase mb-1">
                  BILLED TO
                </span>
                <input
                  type="text"
                  value={formData.billToName}
                  onChange={(e) => handleFieldChange('billToName', e.target.value)}
                  placeholder="Attorney / Firm"
                  disabled={readOnly}
                  className="w-full text-sm sm:text-base font-bold text-slate-900 bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 -mx-1 outline-none transition"
                />
                <textarea
                  rows={2}
                  value={formData.billToAddress}
                  onChange={(e) => handleFieldChange('billToAddress', e.target.value)}
                  placeholder="Address"
                  disabled={readOnly}
                  className="w-full text-xs text-slate-600 bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 -mx-1 outline-none transition resize-none mt-0.5"
                />
              </div>
            </div>

            {/* Divider Line */}
            <div className="border-t border-[#eed8dc] my-5"></div>

            {/* Bottom 3 Columns: SERVICE DATES, STATEMENT NO., TOTAL BALANCE */}
            <div className="grid grid-cols-3 gap-4">
              {/* SERVICE DATES */}
              <div>
                <span className="block font-extrabold text-[10.5px] text-[#722F37] tracking-wider uppercase mb-1">
                  SERVICE DATES
                </span>
                <input
                  type="text"
                  value={formData.serviceDates}
                  onChange={(e) => handleFieldChange('serviceDates', e.target.value)}
                  placeholder="MM/DD/YYYY - MM/DD/YYYY"
                  disabled={readOnly}
                  className="w-full text-xs sm:text-sm font-bold text-slate-800 font-mono bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 -mx-1 outline-none transition"
                />
              </div>

              {/* STATEMENT NO. */}
              <div>
                <span className="block font-extrabold text-[10.5px] text-[#722F37] tracking-wider uppercase mb-1">
                  STATEMENT NO.
                </span>
                <input
                  type="text"
                  value={formData.statementNumber}
                  onChange={(e) => handleFieldChange('statementNumber', e.target.value)}
                  placeholder="Statement #"
                  disabled={readOnly}
                  className="w-full text-xs sm:text-sm font-bold text-slate-800 font-mono bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 -mx-1 outline-none transition"
                />
              </div>

              {/* TOTAL BALANCE */}
              <div>
                <span className="block font-extrabold text-[10.5px] text-[#722F37] tracking-wider uppercase mb-1">
                  TOTAL BALANCE
                </span>
                <input
                  type="text"
                  value={formData.totalBalance}
                  onChange={(e) => handleFieldChange('totalBalance', e.target.value)}
                  placeholder="$0.00"
                  disabled={readOnly}
                  className="w-full text-base sm:text-lg font-black text-slate-950 font-mono bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 -mx-1 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Bottom Notification Card matching Reference Design 1 */}
          <div className="w-full max-w-2xl border border-[#722F37] bg-[#fce8ed] rounded-xl p-5 text-center my-10 shadow-sm">
            <div className="font-extrabold text-[#722F37] text-xs sm:text-sm tracking-wide uppercase">
              PAIN MANAGEMENT SERVICES
            </div>
            <p className="text-xs text-slate-700 mt-1 font-medium">
              The following page contains the itemized billing statement for pain management services.
            </p>
          </div>
        </div>
      </div>

      {/* Footer matching Reference Design 1 */}
      <div className="px-8 pb-4 flex justify-center items-center text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-2">
        <span>FM Health &amp; Wellness Center | Pain Management Billing Statement</span>
      </div>
    </div>
  );
};
