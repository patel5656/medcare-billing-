// src/components/packets/josmic/JosmicCoverPage.jsx
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/billingCalculations';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { SearchableLawyerSelect } from '../../common/SearchableLawyerSelect';
import fmLogo from '../../../assets/fm-logo.jpeg';

/**
 * Format date string safely to MM/DD/YYYY
 */
const formatDateStr = (dateVal) => {
  if (!dateVal) return '';
  if (dateVal instanceof Date) {
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const d = String(dateVal.getDate()).padStart(2, '0');
    const y = dateVal.getFullYear();
    return `${m}/${d}/${y}`;
  }
  const trimmed = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}/${parts[0]}`;
    }
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }
  return trimmed;
};

export const JosmicCoverPage = ({
  readOnly = false,
  isExporting = false,
  blankMode = false,
  packetData = null,
  bill = null,
  serviceLines = [],
  appointments = []
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

  // Extract Billed To info (Case Attorney takes precedence)
  const caseLawyer = packetData?.lawFirm
    ? (packetData?.attorneyName ? `${packetData.attorneyName} (${packetData.lawFirm})` : packetData.lawFirm)
    : (packetData?.attorneyName || packetData?.attorney);
  const dbBillToName = caseLawyer || bill?.billToName || 'OJ Lawal and Associates';
  const caseAddress = packetData?.attorneyAddress || packetData?.lawFirmAddress;
  const dbBillToAddress = caseAddress || bill?.billToAddress || 'Houston, Texas 77031';

  // Extract Statement Number
  const dbStatementNumber = bill?.statementNumber || bill?.statementNo || bill?.billNumber || packetData?.statementNumber || '125639';

  // Compute Service Dates range strictly from actual billed services & appointments
  const computeDosRange = () => {
    const dateSet = new Set();

    // 1. Collect dates from actual billed service lines
    const lines = serviceLines && serviceLines.length > 0 ? serviceLines : (bill?.serviceLines || bill?.items || []);
    if (lines.length > 0) {
      lines.forEach(l => {
        const d = l.dos || l.dateOfService || l.date;
        const formatted = formatDateStr(d);
        if (formatted) dateSet.add(formatted);
      });
    }

    // 2. Collect dates from actual MD Consultation appointments
    const appts = appointments && appointments.length > 0
      ? appointments
      : (packetData?.appointments || []);

    if (appts.length > 0) {
      const patientId = packetData?.patientId || packetData?.patient?.id || packetData?.patient?.patientId;
      const caseId = packetData?.id;
      const caseNum = packetData?.caseId;

      appts.forEach(a => {
        // Patient check
        if (patientId && a.patientId && a.patientId !== patientId) return;
        // Case check
        if (a.caseId && caseId && a.caseId !== caseId && a.caseId !== caseNum) return;
        // Status check: Include only completed or billed services. Exclude CONFIRMED (unless completed/billed), cancelled, no-show, and unperformed appointments.
        const status = (a.status || '').toUpperCase();
        const isBilledOrCompleted = status === 'COMPLETED' || status === 'BILLED' || a.isBilled || a.billed;
        if (!isBilledOrCompleted) return;
        // Provider check
        const provId = (a.providerId || '').toLowerCase();
        const provName = (a.providerName || '').toLowerCase();
        const apptType = (a.appointmentType || '').toLowerCase();
        const reason = (a.reasonForVisit || '').toLowerCase();
        const cpt = (a.cptCode || '').toLowerCase();
        const isMdConsult =
          provId === 'prov-josmic' ||
          provId === 'usr-sa' ||
          provName.includes('josmic') ||
          provName.includes('pain') ||
          provName.includes('wellness center') ||
          provName.includes('adeoye') ||
          provName.includes('sarah connor') ||
          apptType.includes('pain') ||
          apptType.includes('md') ||
          apptType.includes('consult') ||
          reason.includes('pain') ||
          reason.includes('evaluation') ||
          cpt.includes('99204') ||
          cpt.includes('99203') ||
          cpt.includes('99205') ||
          cpt.includes('99214') ||
          cpt.includes('99213');

        if (isMdConsult) {
          const d = a.date || a.appointmentDate || a.dos;
          const formatted = formatDateStr(d);
          if (formatted) dateSet.add(formatted);
        }
      });
    }

    if (dateSet.size === 0) {
      return '';
    }

    const sortedDates = Array.from(dateSet).sort((a, b) => {
      const toIso = (str) => {
        const p = str.split('/');
        return p.length === 3 ? `${p[2]}-${p[0]}-${p[1]}` : str;
      };
      return toIso(a).localeCompare(toIso(b));
    });

    if (sortedDates.length === 1) {
      return sortedDates[0];
    }
    return `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`;
  };

  const dbServiceDates = computeDosRange();

  // Compute Total Balance
  const computedLineCharges = (serviceLines && serviceLines.length > 0 ? serviceLines : (bill?.serviceLines || bill?.items || [])).reduce((acc, l) => acc + ((Number(l.charge) || 0) * (Number(l.units) || 1)), 0);
  const dbTotals = bill?.totals || {};
  const rawBalance = Number(dbTotals.balanceDue !== undefined && Number(dbTotals.balanceDue) > 0
    ? dbTotals.balanceDue
    : (bill?.balanceDue !== undefined && Number(bill.balanceDue) > 0
      ? bill.balanceDue
      : (computedLineCharges || dbTotals.totalCharges || 0))) || 0;
  const dbTotalBalance = formatCurrency(rawBalance);

  const savedServiceDates = storage.serviceDates !== undefined
    ? storage.serviceDates
    : (blankMode ? '' : dbServiceDates);

  // Local state for editable fields
  const [formData, setFormData] = useState({
    patientName: storage.patientName !== undefined ? storage.patientName : (blankMode ? '' : dbPatientName),
    patientId: storage.patientId !== undefined ? storage.patientId : (blankMode ? '' : dbPatientId),
    billToName: storage.billToName !== undefined ? storage.billToName : (blankMode ? '' : dbBillToName),
    billToAddress: storage.billToAddress !== undefined ? storage.billToAddress : (blankMode ? '' : dbBillToAddress),
    serviceDates: savedServiceDates,
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
      const sDates = s.serviceDates !== undefined
        ? s.serviceDates
        : dbServiceDates;

      setFormData({
        patientName: s.patientName !== undefined ? s.patientName : dbPatientName,
        patientId: s.patientId !== undefined ? s.patientId : dbPatientId,
        billToName: s.billToName !== undefined ? s.billToName : dbBillToName,
        billToAddress: s.billToAddress !== undefined ? s.billToAddress : dbBillToAddress,
        serviceDates: sDates,
        statementNumber: s.statementNumber !== undefined ? s.statementNumber : dbStatementNumber,
        totalBalance: s.totalBalance !== undefined ? s.totalBalance : dbTotalBalance,
      });
    }
  }, [
    packetData?.id,
    packetData?._id,
    packetData?.patientName,
    packetData?.attorneyName,
    packetData?.lawFirm,
    packetData?.attorneyAddress,
    bill?.id,
    bill?.statementNumber,
    bill?.totals?.balanceDue,
    blankMode,
    dbServiceDates
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
      className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 flex flex-col justify-between overflow-hidden print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none box-border"
      style={{ width: '850px', height: '1100px', minHeight: '1100px', maxHeight: '1100px' }}
    >
      <div className="flex-1 flex flex-col">
        {/* Top Header Banner: Dark Burgundy Background matching Page 2 theme */}
        <div className="bg-[#722F37] text-white p-6 sm:p-7 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white p-1 shadow-sm flex items-center justify-center flex-shrink-0">
              <img src={fmLogo} alt="FM Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                FM HEALTH &amp; WELLNESS CENTER
              </h1>
              <p className="text-xs text-white/90 font-medium mt-1">
                MD Consultation | 9900 Westpark Drive, Suite 354
              </p>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                Houston, TX 77063 | 346-338-7020
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-8 sm:px-12 py-8 flex-1 flex flex-col items-center justify-start">
          {/* Centered Document Titles matching Burgundy Theme */}
          <div className="text-center my-6">
            <h2 className="text-2xl sm:text-3xl font-black text-[#722F37] tracking-wider uppercase">
              MD CONSULTATION
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
                {readOnly || isExporting ? (
                  <div className="w-full min-h-[30px] py-0.5 leading-normal overflow-visible block text-base sm:text-lg font-black text-slate-900 break-words">
                    {formData.patientName || ''}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => handleFieldChange('patientName', e.target.value)}
                    placeholder="Patient Name"
                    disabled={readOnly}
                    className="w-full min-h-[30px] py-0.5 leading-normal overflow-visible block text-base sm:text-lg font-black text-slate-900 bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 -mx-1 outline-none transition"
                  />
                )}
                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono mt-1">
                  <span>Patient ID:</span>
                  {readOnly || isExporting ? (
                    <span className="font-mono text-xs text-slate-700 font-bold leading-normal overflow-visible">
                      {formData.patientId || ''}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={formData.patientId}
                      onChange={(e) => handleFieldChange('patientId', e.target.value)}
                      placeholder="Patient ID"
                      disabled={readOnly}
                      className="flex-1 font-mono text-xs text-slate-600 bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 outline-none transition"
                    />
                  )}
                </div>
              </div>

              {/* BILLED TO */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="block font-black text-[11px] text-[#722F37] tracking-wider uppercase">
                    BILLED TO
                  </span>
                  {!readOnly && !isExporting && (
                    <div className="print:hidden w-44">
                      <SearchableLawyerSelect
                        value={formData.billToName}
                        currentFirm={packetData?.lawFirm}
                        placeholder="Select Lawyer..."
                        onSelect={(selected) => {
                          if (selected) {
                            const name = selected.firm ? `${selected.name} (${selected.firm})` : selected.name;
                            const addr = selected.address || '';
                            handleFieldChange('billToName', name);
                            handleFieldChange('billToAddress', addr);
                            const caseId = packetData?.id || packetData?._id;
                            if (caseId) {
                              apiCaseService.updateCase(caseId, {
                                attorneyName: selected.name,
                                lawFirm: selected.firm,
                                attorneyAddress: selected.address || '',
                                attorneyPhone: selected.phone || '',
                                attorneyEmail: selected.email || ''
                              }).catch(console.error);
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
                {readOnly || isExporting ? (
                  <div>
                    <div className="w-full text-sm sm:text-base font-bold text-slate-900 leading-normal break-words overflow-visible">
                      {formData.billToName || ''}
                    </div>
                    <div className="w-full text-xs text-slate-600 leading-normal whitespace-pre-line break-words overflow-visible mt-0.5">
                      {formData.billToAddress || ''}
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

            {/* Divider Line */}
            <div className="border-t border-[#eed8dc] my-5"></div>

            {/* Bottom 3 Columns: SERVICE DATES, STATEMENT NO., TOTAL BALANCE */}
            <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 sm:gap-4 items-center">
              {/* SERVICE DATES */}
              <div className="min-w-0">
                <span className="block font-extrabold text-[10.5px] text-[#722F37] tracking-wider uppercase mb-1">
                  SERVICE DATES
                </span>
                {readOnly || isExporting ? (
                  <div className="w-full min-h-[30px] py-1 text-xs sm:text-[13px] font-bold text-slate-800 font-mono leading-normal overflow-visible block break-words">
                    {formData.serviceDates || ''}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.serviceDates}
                    onChange={(e) => handleFieldChange('serviceDates', e.target.value)}
                    placeholder="MM/DD/YYYY - MM/DD/YYYY"
                    disabled={readOnly}
                    className="w-full min-h-[32px] h-8 py-1 text-xs sm:text-[13px] font-bold text-slate-800 font-mono leading-normal bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 -mx-1 outline-none transition tracking-tight overflow-visible disabled:opacity-100 disabled:text-slate-800 block"
                  />
                )}
              </div>

              {/* STATEMENT NO. */}
              <div className="min-w-0">
                <span className="block font-extrabold text-[10.5px] text-[#722F37] tracking-wider uppercase mb-1">
                  STATEMENT NO.
                </span>
                {readOnly || isExporting ? (
                  <div className="w-full min-h-[30px] py-1 text-xs sm:text-sm font-bold text-slate-800 font-mono leading-normal overflow-visible block break-words">
                    {formData.statementNumber || ''}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.statementNumber}
                    onChange={(e) => handleFieldChange('statementNumber', e.target.value)}
                    placeholder="Statement #"
                    disabled={readOnly}
                    className="w-full min-h-[32px] h-8 py-1 text-xs sm:text-sm font-bold text-slate-800 font-mono leading-normal bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 -mx-1 outline-none transition overflow-visible disabled:opacity-100 disabled:text-slate-800 block"
                  />
                )}
              </div>

              {/* TOTAL BALANCE */}
              <div className="min-w-0">
                <span className="block font-extrabold text-[10.5px] text-[#722F37] tracking-wider uppercase mb-1">
                  TOTAL BALANCE
                </span>
                {readOnly || isExporting ? (
                  <div className="w-full min-h-[30px] py-0.5 text-base sm:text-lg font-black text-[#722F37] font-mono leading-normal overflow-visible block break-words">
                    {formData.totalBalance || ''}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.totalBalance}
                    onChange={(e) => handleFieldChange('totalBalance', e.target.value)}
                    placeholder="$0.00"
                    disabled={readOnly}
                    className="w-full min-h-[32px] h-8 py-0.5 text-base sm:text-lg font-black text-[#722F37] font-mono leading-normal bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 -mx-1 outline-none transition overflow-visible disabled:opacity-100 disabled:text-[#722F37] block"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bottom Notification Card matching Theme */}
          <div className="w-full max-w-2xl border-2 border-[#722F37] bg-[#fce8ed] rounded-xl p-5 text-center my-6 shadow-sm">
            <div className="font-extrabold text-[#722F37] text-xs sm:text-sm tracking-wide uppercase">
              MD CONSULTATION SERVICES
            </div>
            <p className="text-xs text-slate-700 mt-1 font-medium">
              The following page contains the itemized billing statement for MD consultation services.
            </p>
          </div>
        </div>
      </div>

      {/* Footer matching Theme */}
      <div className="px-8 pb-4 flex justify-center items-center text-[10px] text-slate-400 font-mono border-t border-[#eed8dc] pt-2">
        <span className="text-[#722F37] font-semibold">FM Health &amp; Wellness Center</span>
        <span className="mx-1.5 text-slate-300">|</span>
        <span>MD Consultation Billing Statement</span>
      </div>
    </div>
  );
};
