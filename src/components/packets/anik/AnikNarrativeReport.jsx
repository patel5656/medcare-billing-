// src/components/packets/anik/AnikNarrativeReport.jsx
import React from 'react';

export const AnikNarrativeReport = ({ 
  reportPage = 1, 
  readOnly = false,
  blankMode = false, 
  packetData = null,
  dos = '',
  serviceLines = []
}) => {
  // Patient Demographics
  const patientName = blankMode || !packetData ? '' : (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '');
  const patientDob = blankMode || !packetData ? '' : (packetData.patientDob || packetData.patient?.dob || packetData.dob || '');
  const accidentDate = blankMode || !packetData ? '' : (packetData.accidentDate || packetData.dateOfAccident || packetData.patient?.accidentDate || '');

  // Initial Evaluation DOS
  const getReportDos = () => {
    if (blankMode || !packetData) return '';
    return packetData.initialEvaluationDate || packetData.initialDos || packetData.evalDate || packetData.reportDate || packetData.evaluationDate || '';
  };
  const reportDos = getReportDos();

  // Diagnosis String (Top Demographics Box)
  const getDiagnosisText = () => {
    if (blankMode || !packetData) return '';
    if (Array.isArray(packetData.diagnosisCodes) && packetData.diagnosisCodes.length > 0) {
      const cleaned = packetData.diagnosisCodes
        .map(d => (typeof d === 'string' ? d : (d.code || d.description || d.icdCode || '')).trim())
        .filter(Boolean);
      if (cleaned.length > 0) return cleaned.join(', ');
    }
    if (packetData?.diagnosis) return packetData.diagnosis;
    return '';
  };
  const diagnosisText = getDiagnosisText();

  // Section 1: HPI & Chief Complaints
  const getHpiText = () => {
    if (blankMode || !packetData) return '';
    if (packetData.hpi || packetData.historyOfPresentIllness) {
      return packetData.hpi || packetData.historyOfPresentIllness;
    }
    if (packetData.initialEvaluation?.hpi || packetData.narrativeReport?.hpi) {
      return packetData.initialEvaluation?.hpi || packetData.narrativeReport?.hpi;
    }
    if (packetData.chiefComplaint) {
      let text = `Patient presents for initial evaluation`;
      if (accidentDate) {
        text += ` following an accident on ${accidentDate}`;
      }
      text += `. ${packetData.chiefComplaint}`;
      if (packetData.painScore || packetData.vasScore) {
        text += ` (Pain score: ${packetData.painScore || packetData.vasScore}/10 on VAS scale).`;
      }
      return text;
    }
    if (packetData.painDescription || packetData.mechanismOfInjury) {
      return [packetData.mechanismOfInjury, packetData.painDescription].filter(Boolean).join('. ');
    }
    return '';
  };
  const hpiText = getHpiText();

  // Section 2: Physical & Neurological Examination
  const getPhysicalExamText = () => {
    if (blankMode || !packetData) return '';
    if (packetData.physicalExam || packetData.physicalExamination || packetData.neurologicalExam) {
      return packetData.physicalExam || packetData.physicalExamination || packetData.neurologicalExam;
    }
    if (packetData.initialEvaluation?.physicalExam || packetData.narrativeReport?.physicalExam) {
      return packetData.initialEvaluation?.physicalExam || packetData.narrativeReport?.physicalExam;
    }
    if (packetData.examFindings || packetData.objectiveFindings) {
      return packetData.examFindings || packetData.objectiveFindings;
    }
    const parts = [];
    if (packetData.palpationFindings || packetData.triggerPoints) {
      parts.push(`Palpation reveals ${packetData.palpationFindings || packetData.triggerPoints}.`);
    }
    if (packetData.romRestrictions || packetData.rangeOfMotion) {
      parts.push(`Range of motion: ${packetData.romRestrictions || packetData.rangeOfMotion}.`);
    }
    return parts.join(' ');
  };
  const physicalExamText = getPhysicalExamText();

  // Section 3: Diagnostic Assessment & Clinical Impression
  const getDiagnosticImpressionText = () => {
    if (blankMode || !packetData) return '';
    if (packetData.diagnosticImpression || packetData.clinicalImpression) {
      return packetData.diagnosticImpression || packetData.clinicalImpression;
    }
    if (packetData.initialEvaluation?.diagnosticImpression || packetData.initialEvaluation?.clinicalImpression || packetData.narrativeReport?.diagnosticImpression || packetData.narrativeReport?.clinicalImpression) {
      return packetData.initialEvaluation?.diagnosticImpression || packetData.initialEvaluation?.clinicalImpression || packetData.narrativeReport?.diagnosticImpression || packetData.narrativeReport?.clinicalImpression;
    }
    return '';
  };
  const diagnosticImpressionText = getDiagnosticImpressionText();

  // Section 4: Plan of Care & Treatment Recommendations
  const getPlanOfCareText = () => {
    if (blankMode || !packetData) return '';
    if (packetData.planOfCare || packetData.treatmentRecommendations || packetData.treatmentPlan) {
      return packetData.planOfCare || packetData.treatmentRecommendations || packetData.treatmentPlan;
    }
    if (packetData.initialEvaluation?.planOfCare || packetData.initialEvaluation?.treatmentRecommendations || packetData.narrativeReport?.planOfCare || packetData.narrativeReport?.treatmentRecommendations) {
      return packetData.initialEvaluation?.planOfCare || packetData.initialEvaluation?.treatmentRecommendations || packetData.narrativeReport?.planOfCare || packetData.narrativeReport?.treatmentRecommendations;
    }
    return '';
  };
  const planOfCareText = getPlanOfCareText();
  // Section 5: Prognosis & Disability Status
  const getPrognosisText = () => {
    if (blankMode || !packetData) return '';
    if (packetData.prognosis || packetData.prognosisAndDisability || packetData.disabilityStatus) {
      return [packetData.prognosis, packetData.disabilityStatus || packetData.prognosisAndDisability].filter(Boolean).join(' ');
    }
    if (packetData.initialEvaluation?.prognosis || packetData.initialEvaluation?.disabilityStatus || packetData.narrativeReport?.prognosis || packetData.narrativeReport?.disabilityStatus) {
      return [
        packetData.initialEvaluation?.prognosis || packetData.narrativeReport?.prognosis,
        packetData.initialEvaluation?.disabilityStatus || packetData.narrativeReport?.disabilityStatus
      ].filter(Boolean).join(' ');
    }
    return '';
  };
  const prognosisText = getPrognosisText();

  // Evaluating Clinician & Facility
  const evaluatingClinicianName = blankMode || !packetData ? '' : (packetData.evaluatingClinician || packetData.renderingProviderName || packetData.providerName || packetData.provider?.name || packetData.provider?.fullName || '');
  const evaluatingClinicianTitle = blankMode || !packetData ? '' : (packetData.evaluatingClinicianTitle || packetData.providerCredentials || packetData.providerTitle || packetData.provider?.credentials || packetData.provider?.title || '');
  const clinicianFullLine = [evaluatingClinicianName, evaluatingClinicianTitle].filter(Boolean).join(', ');

  const facilityName = blankMode || !packetData ? '' : (packetData.facilityName || packetData.clinicName || packetData.providerFacility || packetData.provider?.clinicName || '');
  const licenseNumber = blankMode || !packetData ? '' : (packetData.licenseNumber || packetData.providerLicense || packetData.provider?.licenseNumber || packetData.provider?.license || '');
  const facilityLicenseLine = [
    facilityName,
    licenseNumber ? `License #${licenseNumber}` : ''
  ].filter(Boolean).join(' — ');

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      
      <div className="flex justify-between items-start border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-lg font-black text-teal-800 uppercase italic">ANIK LASER THERAPY</h1>
          <p className="text-[10px] text-slate-600">INITIAL CLINICAL NARRATIVE EVALUATION REPORT</p>
        </div>
        <div className="text-right font-mono text-[10px]">
          <p>PAGE {reportPage} OF 3</p>
          <p>DOS: {reportDos}</p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 border border-slate-200 text-xs font-mono grid grid-cols-2 gap-2">
        <div>PATIENT: <strong>{patientName}</strong></div>
        <div>DOB: <strong>{patientDob}</strong></div>
        <div>DATE OF ACCIDENT: <strong>{accidentDate}</strong></div>
        <div>DIAGNOSIS: <strong>{diagnosisText}</strong></div>
      </div>

      {reportPage === 1 && (
        <div className="space-y-4 text-xs leading-relaxed text-slate-800">
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">1. CHIEF COMPLAINTS &amp; HISTORY OF PRESENT ILLNESS</h2>
          <p className="whitespace-pre-line min-h-[3rem]">
            {hpiText}
          </p>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 pt-2">2. PHYSICAL &amp; NEUROLOGICAL EXAMINATION</h2>
          <p className="whitespace-pre-line min-h-[3rem]">
            {physicalExamText}
          </p>
        </div>
      )}

      {reportPage === 2 && (
        <div className="space-y-4 text-xs leading-relaxed text-slate-800">
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">3. DIAGNOSTIC ASSESSMENT &amp; CLINICAL IMPRESSION</h2>
          <p className="whitespace-pre-line min-h-[3rem]">
            {diagnosticImpressionText}
          </p>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 pt-2">4. PLAN OF CARE &amp; TREATMENT RECOMMENDATIONS</h2>
          <p className="whitespace-pre-line min-h-[3rem]">
            {planOfCareText}
          </p>
        </div>
      )}

      {reportPage === 3 && (
        <div className="space-y-4 text-xs leading-relaxed text-slate-800 flex flex-col justify-between h-[750px]">
          <div>
            <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">5. PROGNOSIS &amp; DISABILITY STATUS</h2>
            <p className="whitespace-pre-line min-h-[3rem]">
              {prognosisText}
            </p>
          </div>
          <div className="border-t border-slate-300 pt-4 font-mono text-xs">
            <p className="font-bold text-slate-900">EVALUATING CLINICIAN:</p>
            <p className="mt-4 font-bold text-slate-900 underline">{clinicianFullLine}</p>
            <p className="text-[10px] text-slate-500">{facilityLicenseLine}</p>
          </div>
        </div>
      )}

    </div>
  );
};
