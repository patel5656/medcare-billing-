// src/components/packets/anik/AnikFinalReport.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/billingCalculations';
import { useSettings } from '../../../utils/settingsCache';

export const AnikFinalReport = ({ 
  reportPage = 1, 
  readOnly = false,
  blankMode = false, 
  packetData = null,
  dos = '',
  serviceLines = [],
  bill = null
}) => {
  const settings = useSettings();

  const isShow = !blankMode && packetData;
  const notes = isShow && Array.isArray(packetData?.clinicalNotes) ? packetData.clinicalNotes : [];
  const anikNote = notes.find(n => {
    if (!n) return false;
    const t = (n.noteType || n.type || '').toUpperCase();
    const p = (n.providerId || '').toLowerCase();
    const title = (n.title || '').toUpperCase();
    return t === 'ANIK_LASER' || t === 'ANIK' || p === 'prov-anik' || title.includes('ANIK');
  });
  const noteContent = anikNote ? (typeof anikNote.content === 'string' ? (() => { try { return JSON.parse(anikNote.content); } catch (e) { return {}; } })() : (anikNote.content || {})) : {};

  // Patient Demographics
  const patientName = !isShow ? '' : (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '');

  // Discharge Date
  const getDischargeDate = () => {
    if (!isShow) return '';
    if (packetData.dischargeDate || packetData.dischargeDos || packetData.finalDos || packetData.finalServiceDate) {
      return packetData.dischargeDate || packetData.dischargeDos || packetData.finalDos || packetData.finalServiceDate;
    }
    const lines = (serviceLines && serviceLines.length > 0)
      ? serviceLines
      : (packetData?.serviceLines || packetData?.items || []);
    if (Array.isArray(lines) && lines.length > 0) {
      const dates = lines.map(l => l.dos || l.dateOfService || l.date).filter(Boolean);
      if (dates.length > 0) return dates[dates.length - 1];
    }
    if (dos) return dos;
    return '';
  };
  const dischargeDate = getDischargeDate();

  // Total Sessions & Financial Total
  const getTotalSessionsText = () => {
    if (!isShow) return '';
    
    const rawSessions = packetData.totalSessionsCompleted !== undefined && packetData.totalSessionsCompleted !== null
      ? packetData.totalSessionsCompleted
      : (packetData.totalSessions !== undefined && packetData.totalSessions !== null
          ? packetData.totalSessions
          : (packetData.completedSessions !== undefined && packetData.completedSessions !== null
              ? packetData.completedSessions
              : (packetData.sessions !== undefined && packetData.sessions !== null
                  ? packetData.sessions
                  : null)));

    if (rawSessions === null || rawSessions === undefined || rawSessions === '') return '';

    const sessions = String(rawSessions);
    const amount = bill?.totalCharges || bill?.grandTotal || bill?.total || packetData.totalAmount || packetData.totalCharges;
    
    if (amount !== null && amount !== undefined && amount !== '') {
      return `${sessions} SESSIONS COMPLETED (${formatCurrency(amount)} TOTAL)`;
    }
    
    return `${sessions} SESSIONS COMPLETED`;
  };
  const totalSessionsText = getTotalSessionsText();

  // Outcome / MMI Status
  const getOutcomeText = () => {
    if (!isShow) return '';
    return packetData.dischargeOutcome || packetData.outcome || packetData.mmiStatus || packetData.finalReport?.outcome || packetData.finalReport?.mmiStatus || '';
  };
  const outcomeText = getOutcomeText();

  // Section 1: Summary of Treatment Completed
  const getTreatmentSummaryText = () => {
    if (!isShow) return '';
    return noteContent.comments || packetData.treatmentSummary || packetData.summaryOfTreatment || packetData.finalReport?.treatmentSummary || packetData.dischargeSummary || packetData.completedTreatmentSummary || '';
  };
  const treatmentSummaryText = getTreatmentSummaryText();

  // Section 2: Objective Re-examination Findings
  const getReexamFindingsText = () => {
    if (!isShow) return '';
    return packetData.reexaminationFindings || packetData.objectiveReexamFindings || packetData.finalReport?.reexaminationFindings || packetData.finalReport?.objectiveFindings || packetData.dischargeExamFindings || '';
  };
  const reexamFindingsText = getReexamFindingsText();

  // Section 3: Discharge Impression & Permanent Impairment
  const getDischargeImpressionText = () => {
    if (!isShow) return '';
    if (packetData.dischargeImpression || packetData.permanentImpairment) {
      return [packetData.dischargeImpression, packetData.permanentImpairment].filter(Boolean).join(' ');
    }
    if (packetData.finalReport?.dischargeImpression || packetData.finalReport?.permanentImpairment) {
      return [packetData.finalReport?.dischargeImpression, packetData.finalReport?.permanentImpairment].filter(Boolean).join(' ');
    }
    return '';
  };
  const dischargeImpressionText = getDischargeImpressionText();

  // Section 4: Home Exercise Program & Future Care
  const getHomeExerciseProgramText = () => {
    if (!isShow) return '';
    if (packetData.homeExerciseProgram || packetData.futureCare || packetData.hep) {
      return [packetData.homeExerciseProgram || packetData.hep, packetData.futureCare].filter(Boolean).join(' ');
    }
    if (packetData.finalReport?.homeExerciseProgram || packetData.finalReport?.futureCare || packetData.finalReport?.hep) {
      return [packetData.finalReport?.homeExerciseProgram || packetData.finalReport?.hep, packetData.finalReport?.futureCare].filter(Boolean).join(' ');
    }
    return '';
  };
  const homeExerciseProgramText = getHomeExerciseProgramText();

  // Section 5: Final Billing & Clinical Sign-Off Text
  const getClinicalSignOffText = () => {
    if (!isShow) return '';
    return packetData.finalBillingSignOff || packetData.clinicalSignOff || packetData.finalReport?.clinicalSignOff || packetData.finalReport?.billingSignOff || packetData.finalReport?.signOffText || '';
  };
  const clinicalSignOffText = getClinicalSignOffText();

  // Discharging Physician & Sign-off Date
  const dischargingPhysicianName = !isShow ? '' : (anikNote?.author || packetData.dischargingPhysician || packetData.dischargingPhysicianName || packetData.finalReport?.dischargingPhysician || packetData.renderingProviderName || packetData.providerName || packetData.provider?.name || packetData.provider?.fullName || '');
  const dischargingPhysicianTitle = !isShow ? '' : (packetData.dischargingPhysicianTitle || packetData.providerCredentials || packetData.providerTitle || packetData.provider?.credentials || packetData.provider?.title || '');
  const dischargingPhysicianLine = [dischargingPhysicianName, dischargingPhysicianTitle].filter(Boolean).join(', ');

  const facilityName = !isShow ? '' : (packetData.facilityName || packetData.clinicName || packetData.providerFacility || packetData.provider?.clinicName || '');
  const signOffDate = !isShow ? '' : (anikNote?.date || packetData.signOffDate || packetData.finalReport?.signOffDate || packetData.signatureDate || packetData.dateSigned || '');
  const facilitySignOffLine = [
    facilityName,
    signOffDate ? `Date Signed: ${signOffDate}` : ''
  ].filter(Boolean).join(' — ');

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      
      <div className="flex justify-between items-start border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-lg font-black text-teal-800 uppercase italic">ANIK LASER THERAPY</h1>
          <p className="text-[10px] text-slate-600">FINAL MEDICAL &amp; THERAPY DISCHARGE REPORT</p>
        </div>
        <div className="text-right font-mono text-[10px]">
          <p>PAGE {reportPage} OF 3</p>
          <p>DISCHARGE DOS: {dischargeDate}</p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 border border-slate-200 text-xs font-mono grid grid-cols-2 gap-2">
        <div>PATIENT: <strong>{patientName}</strong></div>
        <div>DISCHARGE DATE: <strong>{dischargeDate}</strong></div>
        <div>TOTAL SESSIONS COMPLETED: <strong>{totalSessionsText}</strong></div>
        <div>OUTCOME: <strong>{outcomeText}</strong></div>
      </div>

      {reportPage === 1 && (
        <div className="space-y-4 text-xs leading-relaxed text-slate-800">
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">1. SUMMARY OF TREATMENT COMPLETED</h2>
          <p className="whitespace-pre-line min-h-[3rem]">
            {treatmentSummaryText}
          </p>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 pt-2">2. OBJECTIVE RE-EXAMINATION FINDINGS</h2>
          <p className="whitespace-pre-line min-h-[3rem]">
            {reexamFindingsText}
          </p>
        </div>
      )}

      {reportPage === 2 && (
        <div className="space-y-4 text-xs leading-relaxed text-slate-800">
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">3. DISCHARGE IMPRESSION &amp; PERMANENT IMPAIRMENT</h2>
          <p className="whitespace-pre-line min-h-[3rem]">
            {dischargeImpressionText}
          </p>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 pt-2">4. HOME EXERCISE PROGRAM &amp; FUTURE CARE</h2>
          <p className="whitespace-pre-line min-h-[3rem]">
            {homeExerciseProgramText}
          </p>
        </div>
      )}

      {reportPage === 3 && (
        <div className="space-y-4 text-xs leading-relaxed text-slate-800 flex flex-col justify-between h-[750px]">
          <div>
            <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">5. FINAL BILLING &amp; CLINICAL SIGN-OFF</h2>
            <p className="whitespace-pre-line min-h-[3rem]">
              {clinicalSignOffText}
            </p>
          </div>
          <div className="border-t border-slate-300 pt-4 font-mono text-xs">
            <p className="font-bold text-slate-900">DISCHARGING PHYSICIAN:</p>
            <p className="mt-4 font-bold text-slate-900 underline">{dischargingPhysicianLine}</p>
            <p className="text-[10px] text-slate-500">{facilitySignOffLine}</p>
          </div>
        </div>
      )}

    </div>
  );
};
