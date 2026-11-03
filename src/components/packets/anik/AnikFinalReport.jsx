// src/components/packets/anik/AnikFinalReport.jsx
import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/billingCalculations';
import { useSettings } from '../../../utils/settingsCache';
import { EditableClinicalField } from '../EditableClinicalField';
import { AiAutoDraftToolbar } from '../common/AiAutoDraftToolbar';
import { apiClinicalNoteService } from '../../../services/api/apiClinicalNoteService';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { useUIStore } from '../../../store/uiStore';

export const AnikFinalReport = ({ 
  reportPage = 1, 
  readOnly = false,
  blankMode = false, 
  packetData = null,
  dos = '',
  serviceLines = [],
  bill = null
}) => {
  const [localVersion, setLocalVersion] = useState(0);
  const { addToast } = useUIStore ? useUIStore() : { addToast: () => {} };

  const storage = packetData?.clinicalDocStorage?.['ANIK_FINAL'] || {};
  const aiNote = packetData?.clinicalDocStorage?.['AI_DOCTORS_NOTE'] || {};
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

  // 1-Click AI Auto-Draft Generator for Final Discharge Report
  const handleAutoDraftAi = async () => {
    if (!packetData || !packetData.id) return;
    
    const inputData = {
      patientName,
      dos: dischargeDate || new Date().toLocaleDateString(),
      accidentDate: packetData.accidentDate || '',
      accidentType: packetData.accidentType || 'Motor Vehicle Collision',
      complaints: packetData.chiefComplaint || packetData.painDescription || 'Cervical/lumbar sprain following collision',
      painLocations: packetData.selectedInjuryAreas || packetData.injuryBodyParts || 'Cervical Spine, Lumbar Spine',
      diagnosisCodes: packetData.diagnosisCodes || ['M54.50', 'M54.2'],
      compiledDocumentation: `DISCHARGE EVALUATION: Class IV Laser Therapy Final Discharge Report.
Total Sessions Completed: ${totalSessionsText || '12 sessions'}.
Discharge Date: ${dischargeDate || 'Current'}.
Patient presents following collision on ${packetData.accidentDate || 'recent date'}.
Outcome Status: ${outcomeText || 'MMI reached with functional improvement'}.
Diagnoses: ${Array.isArray(packetData.diagnosisCodes) ? packetData.diagnosisCodes.join(', ') : 'M54.50, M54.2'}.`
    };

    const res = await apiClinicalNoteService.generateAiDraft('DOCTOR_NOTE', inputData);
    let parsed = {};
    try {
      const text = res.draftText || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else parsed = { chiefComplaint: text };
    } catch (e) {
      parsed = { chiefComplaint: res.draftText };
    }

    const newFinal = {
      ...(packetData.clinicalDocStorage?.ANIK_FINAL || {}),
      treatmentSummary: parsed.treatmentsAdministered || `Completed documented course of Class IV Laser Therapy (${totalSessionsText || 'prescribed sessions'}) targeting cervical and lumbar regions.`,
      reexamFindings: parsed.objectiveFindings || 'Re-examination demonstrates clinically significant restoration of cervical and lumbar active range of motion, resolution of acute spasm, and reduced localized tenderness.',
      dischargeImpression: parsed.clinicalAssessment || 'Maximum Medical Improvement (MMI) achieved with respect to acute musculoskeletal injury. No permanent neurological impairment identified.',
      homeExerciseProgram: parsed.treatmentPlan || 'Instructed on continuing home exercise program (HEP) including cervical range of motion, isometric strengthening, and core stabilizing exercises.',
      clinicalSignOff: parsed.followUp || 'Patient discharged from active laser care. Instructed to follow up as needed if exacerbation occurs.'
    };

    const currentStorage = packetData.clinicalDocStorage || {};
    const updatedStorage = {
      ...currentStorage,
      ANIK_FINAL: newFinal
    };

    await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
    packetData.clinicalDocStorage = updatedStorage;

    if (addToast) addToast("AI Discharge Report generated successfully!", "success");
    setLocalVersion(v => v + 1);
  };

  // Section 1: Summary of Treatment Completed (Priority: Manual > AI Doctor Note > Fallback)
  const getTreatmentSummaryText = () => {
    if (!isShow) return '';
    if (storage.treatmentSummary) return storage.treatmentSummary;
    if (aiNote.treatmentsAdministered) return aiNote.treatmentsAdministered;
    return noteContent.comments || packetData.treatmentSummary || packetData.summaryOfTreatment || packetData.finalReport?.treatmentSummary || packetData.dischargeSummary || packetData.completedTreatmentSummary || '';
  };
  const treatmentSummaryText = getTreatmentSummaryText();

  // Section 2: Objective Re-examination Findings (Priority: Manual > AI Doctor Note > Fallback)
  const getReexamFindingsText = () => {
    if (!isShow) return '';
    if (storage.reexamFindings) return storage.reexamFindings;
    if (aiNote.objectiveFindings) return aiNote.objectiveFindings;
    return packetData.reexaminationFindings || packetData.objectiveReexamFindings || packetData.finalReport?.reexaminationFindings || packetData.finalReport?.objectiveFindings || packetData.dischargeExamFindings || '';
  };
  const reexamFindingsText = getReexamFindingsText();

  // Section 3: Discharge Impression & Permanent Impairment (Priority: Manual > AI Doctor Note > Fallback)
  const getDischargeImpressionText = () => {
    if (!isShow) return '';
    if (storage.dischargeImpression) return storage.dischargeImpression;
    if (aiNote.clinicalAssessment) return aiNote.clinicalAssessment;
    if (packetData.dischargeImpression || packetData.permanentImpairment) {
      return [packetData.dischargeImpression, packetData.permanentImpairment].filter(Boolean).join(' ');
    }
    if (packetData.finalReport?.dischargeImpression || packetData.finalReport?.permanentImpairment) {
      return [packetData.finalReport?.dischargeImpression, packetData.finalReport?.permanentImpairment].filter(Boolean).join(' ');
    }
    return '';
  };
  const dischargeImpressionText = getDischargeImpressionText();

  // Section 4: Home Exercise Program & Future Care (Priority: Manual > AI Doctor Note > Fallback)
  const getHomeExerciseProgramText = () => {
    if (!isShow) return '';
    if (storage.homeExerciseProgram) return storage.homeExerciseProgram;
    if (aiNote.treatmentPlan) return aiNote.treatmentPlan;
    if (packetData.homeExerciseProgram || packetData.futureCare || packetData.hep) {
      return [packetData.homeExerciseProgram || packetData.hep, packetData.futureCare].filter(Boolean).join(' ');
    }
    if (packetData.finalReport?.homeExerciseProgram || packetData.finalReport?.futureCare || packetData.finalReport?.hep) {
      return [packetData.finalReport?.homeExerciseProgram || packetData.finalReport?.hep, packetData.finalReport?.futureCare].filter(Boolean).join(' ');
    }
    return '';
  };
  const homeExerciseProgramText = getHomeExerciseProgramText();

  // Section 5: Final Billing & Clinical Sign-Off Text (Priority: Manual > AI Doctor Note > Fallback)
  const getClinicalSignOffText = () => {
    if (!isShow) return '';
    if (storage.clinicalSignOff) return storage.clinicalSignOff;
    if (aiNote.followUp) return aiNote.followUp;
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
      
      {/* Universal AI Auto-Draft Toolbar (Hidden on print) */}
      {!readOnly && !blankMode && packetData && (
        <AiAutoDraftToolbar
          title="AI Laser Discharge Scribe"
          badge="Sections 1–5"
          subtitle="Auto-compile treatment summary, re-exam findings, impairment & HEP from patient record"
          hasExistingContent={Boolean(storage.treatmentSummary || storage.reexamFindings || storage.dischargeImpression || storage.homeExerciseProgram)}
          readOnly={readOnly || blankMode}
          onDraft={handleAutoDraftAi}
        />
      )}

      <div className="flex justify-between items-start border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-lg font-black text-[#722F37] uppercase italic">FM LASER THERAPY</h1>
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
          <EditableClinicalField 
            packetData={packetData}
            docKey="ANIK_FINAL"
            field="treatmentSummary"
            value={treatmentSummaryText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[3rem]"
            className="hover:bg-slate-50 focus:bg-white"
          />
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 pt-2">2. OBJECTIVE RE-EXAMINATION FINDINGS</h2>
          <EditableClinicalField 
            packetData={packetData}
            docKey="ANIK_FINAL"
            field="reexamFindings"
            value={reexamFindingsText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[3rem]"
            className="hover:bg-slate-50 focus:bg-white"
          />
        </div>
      )}

      {reportPage === 2 && (
        <div className="space-y-4 text-xs leading-relaxed text-slate-800">
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">3. DISCHARGE IMPRESSION &amp; PERMANENT IMPAIRMENT</h2>
          <EditableClinicalField 
            packetData={packetData}
            docKey="ANIK_FINAL"
            field="dischargeImpression"
            value={dischargeImpressionText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[3rem]"
            className="hover:bg-slate-50 focus:bg-white"
          />
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 pt-2">4. HOME EXERCISE PROGRAM &amp; FUTURE CARE</h2>
          <EditableClinicalField 
            packetData={packetData}
            docKey="ANIK_FINAL"
            field="homeExerciseProgram"
            value={homeExerciseProgramText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[3rem]"
            className="hover:bg-slate-50 focus:bg-white"
          />
        </div>
      )}

      {reportPage === 3 && (
        <div className="space-y-4 text-xs leading-relaxed text-slate-800 flex flex-col justify-between h-[750px]">
          <div>
            <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">5. FINAL BILLING &amp; CLINICAL SIGN-OFF</h2>
            <EditableClinicalField 
              packetData={packetData}
              docKey="ANIK_FINAL"
              field="clinicalSignOff"
              value={clinicalSignOffText} 
              readOnly={readOnly || blankMode || !packetData}
              minHeightClass="min-h-[3rem]"
              className="hover:bg-slate-50 focus:bg-white"
            />
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
