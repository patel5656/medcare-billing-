// src/components/packets/davs/DavFinalNarrative.jsx
import React from 'react';

export const DavFinalNarrative = ({ reportPage = 1, blankMode = false, packetData = null }) => {
  const narrative = packetData?.narrativeReport || packetData?.finalNarrative || packetData?.finalReport || {};

  // Patient Name
  const patientName = blankMode || !packetData
    ? ''
    : (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '');

  // Discharge DOS
  const dischargeDos = blankMode || !packetData
    ? ''
    : (packetData.dischargeDos || packetData.dischargeDate || narrative.dischargeDos || narrative.dischargeDate || narrative.dos || '');

  // Total ESWT Sessions & Amounts
  const getEswtSessionsInfo = () => {
    if (blankMode || !packetData) return '';
    const totalSessions = packetData.totalSessions || packetData.eswtSessions || narrative.totalSessions || narrative.eswtSessions || packetData.completedSessions || narrative.completedSessions || '';
    const totalAmount = packetData.totalAmount || packetData.eswtTotalAmount || narrative.totalAmount || narrative.eswtTotalAmount || '';
    
    if (!totalSessions && !totalAmount) return '';
    
    let result = '';
    if (totalSessions) {
      result += `${totalSessions} COMPLETED`;
    }
    if (totalAmount) {
      result += result ? ` (${totalAmount} TOTAL)` : `${totalAmount} TOTAL`;
    }
    return result;
  };
  const eswtSessionsText = getEswtSessionsInfo();

  // Discharge Summary & Outcomes Clinical Text
  const getDischargeSummaryText = () => {
    if (blankMode || !packetData) return '';
    if (reportPage === 1) {
      return narrative.page1Summary || narrative.dischargeSummary || narrative.outcomes || narrative.summaryOfTreatment || packetData.dischargeSummary || packetData.outcomes || packetData.summaryOfTreatment || '';
    }
    if (reportPage === 2) {
      return narrative.page2Summary || narrative.dischargeSummaryPage2 || narrative.secondaryOutcomes || narrative.dischargeSummary || narrative.outcomes || packetData.dischargeSummaryPage2 || packetData.dischargeSummary || packetData.outcomes || '';
    }
    if (reportPage === 3) {
      return narrative.page3Summary || narrative.dischargeSummaryPage3 || narrative.tertiaryOutcomes || narrative.dischargeSummary || narrative.outcomes || packetData.dischargeSummaryPage3 || packetData.dischargeSummary || packetData.outcomes || '';
    }
    return '';
  };
  const dischargeSummaryText = getDischargeSummaryText();

  // Discharging Physician Signature
  const physicianName = blankMode || !packetData
    ? ''
    : (packetData.dischargingPhysician || packetData.physicianName || packetData.providerName || narrative.dischargingPhysician || narrative.physicianName || narrative.providerName || '');

  // Facility and Date Signed
  const getFooterDetails = () => {
    if (blankMode || !packetData) return '';
    const facility = packetData.facilityName || packetData.facility || narrative.facilityName || narrative.facility || '';
    const dateSigned = packetData.signatureDate || packetData.dateSigned || packetData.signedAt || narrative.signatureDate || narrative.dateSigned || narrative.signedAt || '';
    
    const parts = [];
    if (facility) parts.push(facility);
    if (dateSigned) parts.push(`Date Signed: ${dateSigned}`);
    return parts.join(' - ');
  };
  const footerDetails = getFooterDetails();

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      <div className="flex justify-between items-start border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-lg font-black text-teal-800 uppercase italic">DAV'S ANATOMY</h1>
          <p className="text-[10px] text-slate-600">SHOCKWAVE THERAPY NARRATIVE DISCHARGE REPORT</p>
        </div>
        <div className="text-right font-mono text-[10px]">
          <p>PAGE {reportPage} OF 3</p>
          <p>DISCHARGE DOS: {dischargeDos}</p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 border border-slate-200 text-xs font-mono grid grid-cols-2 gap-2">
        <div>PATIENT: {blankMode ? <span className="border-b border-slate-400 inline-block w-28">&nbsp;</span> : <strong>{patientName}</strong>}</div>
        <div>TOTAL ESWT SESSIONS: {blankMode ? <span className="border-b border-slate-400 inline-block w-28">&nbsp;</span> : <strong>{eswtSessionsText}</strong>}</div>
      </div>

      <div className="flex-1 space-y-4 text-xs leading-relaxed text-slate-800 flex flex-col justify-between pt-2">
        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">DISCHARGE SUMMARY & OUTCOMES</h2>
          <p className="mt-2">{dischargeSummaryText}</p>
        </div>

        <div className="border-t border-slate-300 pt-4 font-mono text-xs">
          <p className="font-bold text-slate-900">DISCHARGING PHYSICIAN SIGNATURE:</p>
          <p className="mt-4 font-bold text-slate-900 underline">{physicianName}</p>
          <p className="text-[10px] text-slate-500">{footerDetails}</p>
        </div>
      </div>
    </div>
  );
};

