// src/components/packets/anik/AnikNarrativeReport.jsx
import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { EditableClinicalField } from '../EditableClinicalField';
import { apiClinicalNoteService } from '../../../services/api/apiClinicalNoteService';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { useUIStore } from '../../../store/uiStore';

export const AnikNarrativeReport = ({ 
  reportPage = 1, 
  readOnly = false,
  blankMode = false, 
  packetData = null,
  dos = '',
  serviceLines = []
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [localVersion, setLocalVersion] = useState(0);
  const { addToast } = useUIStore ? useUIStore() : { addToast: () => {} };

  const storage = packetData?.clinicalDocStorage?.['ANIK_NARRATIVE'] || {};
  const aiNote = packetData?.clinicalDocStorage?.['AI_DOCTORS_NOTE'] || {};

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

  // 1-Click AI Auto-Draft Generator for Sections 1 to 5
  const handleAutoDraftAi = async () => {
    if (!packetData || !packetData.id) return;
    
    const hasExisting = storage.hpi || storage.physicalExam || storage.diagnosticImpression || storage.planOfCare || storage.prognosis;
    if (hasExisting) {
      const confirmOverwrite = window.confirm("You already have clinical notes in this form. Generating with AI will update Sections 1 to 5 with a fresh synthesized draft. Do you want to proceed?");
      if (!confirmOverwrite) return;
    }

    setIsGenerating(true);
    try {
      const inputData = {
        patientName,
        dos: reportDos || new Date().toLocaleDateString(),
        accidentDate: accidentDate || packetData.accidentDate || '',
        accidentType: packetData.accidentType || 'Motor Vehicle Collision',
        complaints: packetData.chiefComplaint || packetData.painDescription || packetData.mechanismOfInjury || 'Cervical and lumbar spine stiffness',
        painLocations: packetData.selectedInjuryAreas || packetData.injuryBodyParts || 'Cervical Spine, Lumbar Spine',
        diagnosisCodes: packetData.diagnosisCodes || (diagnosisText ? [diagnosisText] : ['M54.50', 'M54.2']),
        compiledDocumentation: `EVALUATION MODALITY: Class IV Deep Tissue Laser Therapy Initial Narrative Evaluation.
Patient presents following collision on ${accidentDate || 'recent date'}.
Documented Diagnoses: ${diagnosisText || 'M54.50, M54.2'}.
Accident Context: ${packetData.accidentType || 'Motor Vehicle Collision'}. ${packetData.mechanismOfInjury || ''}.
Chief Complaints: ${packetData.chiefComplaint || packetData.painDescription || 'Neck, shoulder and low back stiffness'}.`
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

      const newNarrative = {
        ...(packetData.clinicalDocStorage?.ANIK_NARRATIVE || {}),
        hpi: parsed.chiefComplaint || parsed.subjectiveHistory || `Patient presents for initial evaluation following accident on ${accidentDate}.`,
        physicalExam: parsed.objectiveFindings || 'Range of motion moderately reduced in cervical and lumbar planes with localized tenderness.',
        diagnosticImpression: parsed.clinicalAssessment || (diagnosisText ? `Diagnoses established: ${diagnosisText}.` : 'Clinical assessment documented in record.'),
        planOfCare: parsed.treatmentPlan || 'Class IV Laser Therapy 2-3x weekly for 4-6 weeks targeting cervical and lumbar regions.',
        prognosis: parsed.followUp || 'Good with active participation in laser therapy and conservative rehabilitation.'
      };

      const currentStorage = packetData.clinicalDocStorage || {};
      const updatedStorage = {
        ...currentStorage,
        ANIK_NARRATIVE: newNarrative
      };

      await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
      packetData.clinicalDocStorage = updatedStorage;

      if (addToast) addToast("AI Clinical Narrative generated and applied successfully!", "success");
      setLocalVersion(v => v + 1);
    } catch (err) {
      console.error('Failed to generate AI narrative draft:', err);
      if (addToast) addToast(err.message || "Failed to generate AI draft", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Section 1: HPI & Chief Complaints (Priority: Manual > AI Doctor Note > Case Fallback)
  const getHpiText = () => {
    if (blankMode || !packetData) return '';
    if (storage.hpi) return storage.hpi;
    if (aiNote.chiefComplaint || aiNote.subjectiveHistory) {
      return [aiNote.chiefComplaint, aiNote.subjectiveHistory].filter(Boolean).join('\n\n');
    }
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

  // Section 2: Physical & Neurological Examination (Priority: Manual > AI Doctor Note > Case Fallback)
  const getPhysicalExamText = () => {
    if (blankMode || !packetData) return '';
    if (storage.physicalExam) return storage.physicalExam;
    if (aiNote.objectiveFindings) return aiNote.objectiveFindings;
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

  // Section 3: Diagnostic Assessment & Clinical Impression (Priority: Manual > AI Doctor Note > Case Fallback)
  const getDiagnosticImpressionText = () => {
    if (blankMode || !packetData) return '';
    if (storage.diagnosticImpression) return storage.diagnosticImpression;
    if (aiNote.clinicalAssessment) return aiNote.clinicalAssessment;
    if (packetData.diagnosticImpression || packetData.clinicalImpression) {
      return packetData.diagnosticImpression || packetData.clinicalImpression;
    }
    if (packetData.initialEvaluation?.diagnosticImpression || packetData.initialEvaluation?.clinicalImpression || packetData.narrativeReport?.diagnosticImpression || packetData.narrativeReport?.clinicalImpression) {
      return packetData.initialEvaluation?.diagnosticImpression || packetData.initialEvaluation?.clinicalImpression || packetData.narrativeReport?.diagnosticImpression || packetData.narrativeReport?.clinicalImpression;
    }
    return '';
  };
  const diagnosticImpressionText = getDiagnosticImpressionText();

  // Section 4: Plan of Care & Treatment Recommendations (Priority: Manual > AI Doctor Note > Case Fallback)
  const getPlanOfCareText = () => {
    if (blankMode || !packetData) return '';
    if (storage.planOfCare) return storage.planOfCare;
    if (aiNote.treatmentPlan) return aiNote.treatmentPlan;
    if (packetData.planOfCare || packetData.treatmentRecommendations || packetData.treatmentPlan) {
      return packetData.planOfCare || packetData.treatmentRecommendations || packetData.treatmentPlan;
    }
    if (packetData.initialEvaluation?.planOfCare || packetData.initialEvaluation?.treatmentRecommendations || packetData.narrativeReport?.planOfCare || packetData.narrativeReport?.treatmentRecommendations) {
      return packetData.initialEvaluation?.planOfCare || packetData.initialEvaluation?.treatmentRecommendations || packetData.narrativeReport?.planOfCare || packetData.narrativeReport?.treatmentRecommendations;
    }
    return '';
  };
  const planOfCareText = getPlanOfCareText();

  // Section 5: Prognosis & Disability Status (Priority: Manual > AI Doctor Note > Case Fallback)
  const getPrognosisText = () => {
    if (blankMode || !packetData) return '';
    if (storage.prognosis) return storage.prognosis;
    if (aiNote.followUp) return aiNote.followUp;
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
      
      {/* 1-Click AI Clinical Scribe Assistant Toolbar (Hidden on print) */}
      {!readOnly && !blankMode && packetData && (
        <div className="flex items-center justify-between bg-gradient-to-r from-teal-50 via-indigo-50 to-purple-50 border border-teal-200/90 rounded-xl px-4 py-2.5 shadow-sm print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900 tracking-tight">AI Clinical Scribe Assistant</span>
                <span className="text-[9px] font-mono font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded">Sections 1–5</span>
              </div>
              <p className="text-[10px] text-slate-500">Auto-synthesize narrative from patient accident context & ICD-10 diagnoses</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAutoDraftAi}
            disabled={isGenerating}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Auto-fill Sections 1 to 5 with AI"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            <span>{isGenerating ? 'Generating Narrative...' : '✨ Auto-Draft with AI'}</span>
          </button>
        </div>
      )}

      <div className="flex justify-between items-start border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-lg font-black text-[#722F37] uppercase italic">FM LASER THERAPY</h1>
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
          <EditableClinicalField 
            packetData={packetData}
            docKey="ANIK_NARRATIVE"
            field="hpi"
            value={hpiText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[3rem]"
            className="hover:bg-slate-50 focus:bg-white"
          />
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 pt-2">2. PHYSICAL &amp; NEUROLOGICAL EXAMINATION</h2>
          <EditableClinicalField 
            packetData={packetData}
            docKey="ANIK_NARRATIVE"
            field="physicalExam"
            value={physicalExamText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[3rem]"
            className="hover:bg-slate-50 focus:bg-white"
          />
        </div>
      )}

      {reportPage === 2 && (
        <div className="space-y-4 text-xs leading-relaxed text-slate-800">
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">3. DIAGNOSTIC ASSESSMENT &amp; CLINICAL IMPRESSION</h2>
          <EditableClinicalField 
            packetData={packetData}
            docKey="ANIK_NARRATIVE"
            field="diagnosticImpression"
            value={diagnosticImpressionText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[3rem]"
            className="hover:bg-slate-50 focus:bg-white"
          />
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 pt-2">4. PLAN OF CARE &amp; TREATMENT RECOMMENDATIONS</h2>
          <EditableClinicalField 
            packetData={packetData}
            docKey="ANIK_NARRATIVE"
            field="planOfCare"
            value={planOfCareText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[3rem]"
            className="hover:bg-slate-50 focus:bg-white"
          />
        </div>
      )}

      {reportPage === 3 && (
        <div className="space-y-4 text-xs leading-relaxed text-slate-800 flex flex-col justify-between h-[750px]">
          <div>
            <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">5. PROGNOSIS &amp; DISABILITY STATUS</h2>
            <EditableClinicalField 
              packetData={packetData}
              docKey="ANIK_NARRATIVE"
              field="prognosis"
              value={prognosisText} 
              readOnly={readOnly || blankMode || !packetData}
              minHeightClass="min-h-[3rem]"
              className="hover:bg-slate-50 focus:bg-white"
            />
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
