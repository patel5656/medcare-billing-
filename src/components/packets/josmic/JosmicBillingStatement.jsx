// src/components/packets/josmic/JosmicBillingStatement.jsx
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/billingCalculations';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { apiAppointmentService } from '../../../services/api/apiAppointmentService';
import { 
  filterAndSortMdConsultationVisits, 
  buildMdConsultationStatementRows 
} from '../../../utils/mdConsultationBillingHelper';
import fmLogo from '../../../assets/fm-logo.jpeg';

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

export const JosmicBillingStatement = ({
  bill = null,
  selectedCase = null,
  readOnly = false,
  isExporting = false,
  blankMode = false,
  providerId = 'prov-josmic',
  appointments: propAppointments = null
}) => {
  const docKey = 'JOSMIC_BILLING';
  const storage = selectedCase?.clinicalDocStorage?.[docKey] || {};

  // Extract patient info from DB bill or selectedCase
  const pt = selectedCase?.patient || bill?.patient || {};
  const dbPatientName = bill?.patientName || selectedCase?.patientName ||
    (pt.firstName ? `${pt.firstName || ''} ${pt.lastName || ''}`.trim() : '') ||
    pt.name || '';

  const ptStreet = pt.street || pt.addressLine1 || pt.address || '';
  const ptCity = pt.city || '';
  const ptState = pt.state || '';
  const ptZip = pt.zipCode || pt.zip || '';
  const casePtAddress = [ptStreet, ptCity, ptState, ptZip].filter(Boolean).join(', ');
  const dbPatientAddress = bill?.patientAddress || casePtAddress || '9950 Westpark Dr, Houston TE 77063';

  const dbPatientId = bill?.patientSystemId || pt.patientId ||
    selectedCase?.patient?.patientId || selectedCase?.patientId || selectedCase?.id || '';

  // Extract Billed To info (Attorney / Payer) - Case Attorney takes precedence
  const caseLawyer = selectedCase?.lawFirm 
    ? (selectedCase?.attorneyName ? `${selectedCase.attorneyName} (${selectedCase.lawFirm})` : selectedCase.lawFirm) 
    : (selectedCase?.attorneyName || selectedCase?.attorney);
  const dbBillToName = caseLawyer || bill?.billToName || 'Personal Injury Settlement';
  const caseAddress = selectedCase?.attorneyAddress || selectedCase?.lawFirmAddress;
  const dbBillToAddress = caseAddress || bill?.billToAddress || '';

  // Real patient-specific MD consultation visits state from Appointments Calendar
  const [appointments, setAppointments] = useState(() => {
    if (propAppointments && Array.isArray(propAppointments)) return propAppointments;
    if (selectedCase?.appointments && Array.isArray(selectedCase.appointments)) return selectedCase.appointments;
    return [];
  });

  const loadAppointmentsFromApi = () => {
    const patientId = selectedCase?.patientId || selectedCase?.patient?.id;
    if (!patientId) return;

    apiAppointmentService.getAllAppointments({ patientId })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.appointments || []);
        setAppointments(list);
      })
      .catch(err => {
        console.error('Failed to load appointments for MD Consultation statement:', err);
      });
  };

  useEffect(() => {
    if (propAppointments && Array.isArray(propAppointments)) {
      setAppointments(propAppointments);
    } else {
      loadAppointmentsFromApi();
    }

    window.addEventListener('focus', loadAppointmentsFromApi);
    return () => {
      window.removeEventListener('focus', loadAppointmentsFromApi);
    };
  }, [propAppointments, selectedCase?.id, selectedCase?.patientId]);

  const effectiveCaseId = selectedCase?.id || selectedCase?._id;
  const effectiveCaseNum = selectedCase?.caseId;
  const effectivePatientId = selectedCase?.patientId || selectedCase?.patient?.id;

  const mdVisits = filterAndSortMdConsultationVisits(
    appointments, 
    effectiveCaseId, 
    effectiveCaseNum, 
    effectivePatientId
  );

  // Dynamic real visit lines with CPT master, excluding unwanted dummy lines
  const displayItems = buildMdConsultationStatementRows(mdVisits, bill);

  // Extract Statement Number & Date directly from DB or earliest DOS
  const dbStatementNumber = bill?.statementNumber || bill?.statementNo || bill?.billNumber || (displayItems.length > 0 ? (selectedCase?.statementNumber || 'N/A') : '');
  const fallbackDate = displayItems.length > 0 ? displayItems[0].dos : (bill?.statementDate || bill?.date || '');
  const dbStatementDate = formatDateStr(fallbackDate);

  let calcCharges = 0;
  let calcInsPay = 0;
  let calcPatPay = 0;
  let calcAdj = 0;

  displayItems.forEach(item => {
    calcCharges += (Number(item.charge) || 0);
    calcInsPay += (Number(item.insPay) || 0);
    calcPatPay += (Number(item.patPay) || 0);
    calcAdj += (Number(item.adj) || 0);
  });

  // DB Totals reconciled with real treatments
  const totalCharges = calcCharges;
  const totalInsPay = calcInsPay;
  const totalPatPay = calcPatPay;
  const totalAdj = calcAdj;
  const rawBalance = Math.max(0, totalCharges - (totalInsPay + totalPatPay + totalAdj));
  const dbTotalBalance = formatCurrency(rawBalance);

  // Aging Summary reconciled with dynamic balance
  const agingCurrent = rawBalance;
  const aging30 = Number(bill?.aging?.past30) || 0;
  const aging60 = Number(bill?.aging?.past60) || 0;
  const aging90 = Number(bill?.aging?.past90) || 0;

  // Form State
  const [formData, setFormData] = useState({
    patientName: storage.patientName !== undefined ? storage.patientName : (blankMode ? '' : dbPatientName),
    patientId: storage.patientId !== undefined ? storage.patientId : (blankMode ? '' : dbPatientId),
    patientAddress: storage.patientAddress !== undefined ? storage.patientAddress : (blankMode ? '' : dbPatientAddress),
    billToName: storage.billToName !== undefined ? storage.billToName : (blankMode ? '' : dbBillToName),
    billToAddress: storage.billToAddress !== undefined ? storage.billToAddress : (blankMode ? '' : dbBillToAddress),
    statementNumber: storage.statementNumber !== undefined ? storage.statementNumber : (blankMode ? '' : dbStatementNumber),
    statementDate: storage.statementDate !== undefined ? storage.statementDate : (blankMode ? '' : dbStatementDate),
    totalBalance: storage.totalBalance !== undefined ? storage.totalBalance : (blankMode ? '' : dbTotalBalance),
    comments: storage.comments !== undefined ? storage.comments : (blankMode ? '' : (selectedCase?.comments || 'Medical lien on file pursuant to Letter of Protection (LOP).')),
  });

  useEffect(() => {
    if (blankMode) {
      setFormData({
        patientName: '',
        patientId: '',
        patientAddress: '',
        billToName: '',
        billToAddress: '',
        statementNumber: '',
        statementDate: '',
        totalBalance: '',
        comments: '',
      });
    } else {
      const s = selectedCase?.clinicalDocStorage?.[docKey] || {};
      setFormData({
        patientName: s.patientName !== undefined ? s.patientName : dbPatientName,
        patientId: s.patientId !== undefined ? s.patientId : dbPatientId,
        patientAddress: s.patientAddress !== undefined ? s.patientAddress : dbPatientAddress,
        billToName: s.billToName !== undefined ? s.billToName : dbBillToName,
        billToAddress: s.billToAddress !== undefined ? s.billToAddress : dbBillToAddress,
        statementNumber: s.statementNumber !== undefined ? s.statementNumber : dbStatementNumber,
        statementDate: s.statementDate !== undefined ? s.statementDate : dbStatementDate,
        totalBalance: s.totalBalance !== undefined ? s.totalBalance : dbTotalBalance,
        comments: s.comments !== undefined ? s.comments : (selectedCase?.comments || 'Medical lien on file pursuant to Letter of Protection (LOP).'),
      });
    }
  }, [
    selectedCase?.id,
    selectedCase?._id,
    selectedCase?.patientName,
    selectedCase?.attorneyName,
    selectedCase?.lawFirm,
    selectedCase?.attorneyAddress,
    bill?.id,
    bill?.statementNumber,
    rawBalance,
    displayItems.length,
    blankMode
  ]);

  const handleFieldChange = async (field, value) => {
    if (readOnly) return;
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    const caseId = selectedCase?.id || selectedCase?._id;
    if (caseId) {
      try {
        const currentStorage = selectedCase.clinicalDocStorage || {};
        const updatedDoc = { ...(currentStorage[docKey] || {}), [field]: value };
        const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
        await apiCaseService.updateCase(caseId, { clinicalDocStorage: updatedStorage });
        selectedCase.clinicalDocStorage = updatedStorage;
      } catch (err) {
        console.error('Failed to auto-save Josmic Billing Statement:', err);
      }
    }
  };

  return (
    <div
      className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 flex flex-col justify-between overflow-hidden print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none box-border"
      style={{ width: '850px', height: '1100px', minHeight: '1100px', maxHeight: '1100px' }}
    >
      <div className="flex-1 flex flex-col">
        {/* Top Header Banner: Dark Burgundy Background matching reference design */}
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
          <div className="text-right">
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider leading-none">
              BILLING<br />STATEMENT
            </h2>
            <p className="text-xs font-mono text-white/90 mt-1.5 font-bold">
              Statement No. {formData.statementNumber || dbStatementNumber}
            </p>
            <p className="text-xs text-white/90 mt-0.5 font-medium">
              Statement Date: {formData.statementDate || dbStatementDate}
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-6 sm:p-8 space-y-5 flex-1 flex flex-col">
          {/* 2-Column Info Block (BILL TO & PATIENT) */}
          <div className="grid grid-cols-2 border border-[#eed8dc] rounded-sm overflow-hidden bg-white text-xs">
            {/* BILL TO */}
            <div className="border-r border-[#eed8dc]">
              <div className="bg-[#fce8ed] border-b border-[#eed8dc] px-3 py-1 font-extrabold text-[11px] text-[#722F37] uppercase tracking-wider">
                BILL TO
              </div>
              <div className="p-3 space-y-0.5 text-slate-800">
                {readOnly || isExporting ? (
                  <>
                    <div className="w-full font-bold text-slate-900 px-1 min-h-[18px] leading-normal break-words overflow-visible">
                      {formData.billToName || (blankMode ? '' : dbBillToName)}
                    </div>
                    <div className="w-full text-xs text-slate-700 px-1 min-h-[16px] leading-normal whitespace-pre-line break-words overflow-visible">
                      {formData.billToAddress || (blankMode ? '' : dbBillToAddress)}
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={formData.billToName}
                      onChange={(e) => handleFieldChange('billToName', e.target.value)}
                      placeholder="Attorney / Law Firm"
                      disabled={readOnly}
                      className="w-full font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white rounded px-1 outline-none transition"
                    />
                    <textarea
                      rows={2}
                      value={formData.billToAddress}
                      onChange={(e) => handleFieldChange('billToAddress', e.target.value)}
                      placeholder="Attorney Address"
                      disabled={readOnly}
                      className="w-full text-xs text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white rounded px-1 outline-none transition resize-none"
                    />
                  </>
                )}
              </div>
            </div>

            {/* PATIENT */}
            <div>
              <div className="bg-[#fce8ed] border-b border-[#eed8dc] px-3 py-1 font-extrabold text-[11px] text-[#722F37] uppercase tracking-wider">
                PATIENT
              </div>
              <div className="p-3 space-y-0.5 text-slate-800">
                {readOnly || isExporting ? (
                  <>
                    <div className="w-full font-bold text-slate-900 px-1 min-h-[18px] leading-normal break-words overflow-visible">
                      {formData.patientName || (blankMode ? '' : dbPatientName)}
                    </div>
                    <div className="w-full text-xs text-slate-700 px-1 min-h-[16px] leading-normal break-words overflow-visible">
                      {formData.patientAddress || (blankMode ? '' : dbPatientAddress)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-600 font-mono pt-1 px-1">
                      <span>Patient ID:</span>
                      <span className="font-bold text-slate-800 leading-normal overflow-visible">
                        {formData.patientId || (blankMode ? '' : dbPatientId)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={formData.patientName}
                      onChange={(e) => handleFieldChange('patientName', e.target.value)}
                      placeholder="Patient Name"
                      disabled={readOnly}
                      className="w-full font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white rounded px-1 outline-none transition"
                    />
                    <input
                      type="text"
                      value={formData.patientAddress}
                      onChange={(e) => handleFieldChange('patientAddress', e.target.value)}
                      placeholder="Patient Address"
                      disabled={readOnly}
                      className="w-full text-xs text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white rounded px-1 outline-none transition"
                    />
                    <div className="flex items-center gap-1 text-xs text-slate-600 font-mono pt-1">
                      <span>Patient ID:</span>
                      <input
                        type="text"
                        value={formData.patientId}
                        onChange={(e) => handleFieldChange('patientId', e.target.value)}
                        placeholder="Patient ID"
                        disabled={readOnly}
                        className="flex-1 font-bold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white rounded px-1 outline-none transition"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Service Lines Table */}
          <div className="border border-[#722F37] rounded-sm overflow-hidden flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#722F37] text-white uppercase font-bold text-[10.5px]">
                <tr>
                  <th className="p-2 border-r border-[#8d3a44] w-[14%]">Date of Service</th>
                  <th className="p-2 border-r border-[#8d3a44] w-[11%]">Procedure</th>
                  <th className="p-2 border-r border-[#8d3a44] w-[27%]">Description</th>
                  <th className="p-2 text-right border-r border-[#8d3a44] w-[12%]">Charge</th>
                  <th className="p-2 text-right border-r border-[#8d3a44] w-[12%]">Insurance Payment</th>
                  <th className="p-2 text-right border-r border-[#8d3a44] w-[12%]">Patient Payment</th>
                  <th className="p-2 text-right border-r border-[#8d3a44] w-[12%]">Adjustment</th>
                  <th className="p-2 text-right w-[10%]">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-[11px] text-slate-800 font-tabular">
                {displayItems.length > 0 ? (
                  <>
                    {displayItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 font-mono text-xs whitespace-nowrap">{item.dos}</td>
                        <td className="p-2 border-r border-slate-200 font-bold font-mono text-xs">{item.cptCode}</td>
                        <td className="p-2 border-r border-slate-200 text-slate-800 font-medium">{item.description}</td>
                        <td className="p-2 text-right border-r border-slate-200 font-bold text-slate-900">{formatCurrency(item.charge)}</td>
                        <td className="p-2 text-right border-r border-slate-200 text-slate-700">{formatCurrency(item.insPay)}</td>
                        <td className="p-2 text-right border-r border-slate-200 text-slate-700">{formatCurrency(item.patPay)}</td>
                        <td className="p-2 text-right border-r border-slate-200 text-slate-700">{formatCurrency(item.adj)}</td>
                        <td className="p-2 text-right font-bold text-slate-900 bg-slate-50/50">{formatCurrency(item.lineBal)}</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 8 - displayItems.length) }).map((_, fIdx) => (
                      <tr key={`fill-${fIdx}`} className="h-7">
                        <td className="p-2 border-r border-slate-200">&nbsp;</td>
                        <td className="p-2 border-r border-slate-200">&nbsp;</td>
                        <td className="p-2 border-r border-slate-200">&nbsp;</td>
                        <td className="p-2 border-r border-slate-200">&nbsp;</td>
                        <td className="p-2 border-r border-slate-200">&nbsp;</td>
                        <td className="p-2 border-r border-slate-200">&nbsp;</td>
                        <td className="p-2 border-r border-slate-200">&nbsp;</td>
                        <td className="p-2">&nbsp;</td>
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-mono text-xs">
                      No service lines recorded for this statement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Balance Due Highlight Bar */}
          <div className="border-2 border-[#722F37] bg-[#fce8ed] p-2.5 px-4 flex justify-between items-center rounded-sm">
            <span className="font-black text-[#722F37] text-sm tracking-wider uppercase">
              BALANCE DUE
            </span>
            <span className="font-black text-[#722F37] text-xl font-mono tracking-tight">
              {formData.totalBalance || dbTotalBalance}
            </span>
          </div>

          {/* Comments Section */}
          <div className="border border-[#eed8dc] rounded-sm overflow-hidden bg-white">
            <div className="bg-[#fce8ed] border-b border-[#eed8dc] px-3 py-1 font-extrabold text-[11px] text-[#722F37] uppercase tracking-wider">
              COMMENTS
            </div>
            <div className="p-2.5">
              {readOnly || isExporting ? (
                <div className="w-full text-xs text-slate-700 px-1 min-h-[18px] leading-normal break-words overflow-visible">
                  {formData.comments || ''}
                </div>
              ) : (
                <input
                  type="text"
                  value={formData.comments}
                  onChange={(e) => handleFieldChange('comments', e.target.value)}
                  placeholder="Enter statement comments..."
                  disabled={readOnly}
                  className="w-full text-xs text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white rounded px-1 outline-none transition"
                />
              )}
            </div>
          </div>

          {/* Aging Summary Grid */}
          <div className="border border-[#722F37] rounded-sm overflow-hidden text-center text-xs font-tabular mt-auto">
            <div className="grid grid-cols-5 bg-[#722F37] text-white font-bold text-[10.5px] uppercase tracking-wider divide-x divide-[#8d3a44]">
              <div className="p-2">Current Due</div>
              <div className="p-2">Past Due 30 Days</div>
              <div className="p-2">Past Due 60 Days</div>
              <div className="p-2">Past Due 90 Days</div>
              <div className="p-2 bg-[#5e252d]">Balance Due</div>
            </div>
            <div className="grid grid-cols-5 bg-white text-slate-900 font-bold divide-x divide-slate-200">
              <div className="p-2.5 font-mono">{formatCurrency(agingCurrent)}</div>
              <div className="p-2.5 font-mono">{formatCurrency(aging30)}</div>
              <div className="p-2.5 font-mono">{formatCurrency(aging60)}</div>
              <div className="p-2.5 font-mono">{formatCurrency(aging90)}</div>
              <div className="p-2.5 bg-slate-50 text-[#722F37] font-black font-mono">
                {formData.totalBalance || dbTotalBalance}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 pb-4 flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-2">
        <span>FM Health &amp; Wellness Center | MD Consultation Billing Statement {formData.statementNumber || dbStatementNumber}</span>
        <span>Page 1</span>
      </div>
    </div>
  );
};
