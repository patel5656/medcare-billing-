// src/components/packets/counselor/CounselorAssessmentForm.jsx
import React from 'react';

export const CounselorAssessmentForm = ({ blankMode = false, packetData = null }) => {
  const isShow = !blankMode && packetData;

  const dosVal = isShow ? (packetData.dos || packetData.dateOfService || packetData.serviceDate || packetData.evalDate || packetData.assessmentDate || '') : '';
  const cptVal = isShow ? (packetData.cptCodes || packetData.cptCode || packetData.cpt || '') : '';
  const patientNameVal = isShow ? (packetData.patientName || '') : '';
  const dobVal = isShow ? (packetData.patient?.dob || packetData.patientDob || '') : '';
  const doaVal = isShow ? (packetData.accidentDate || '') : '';

  const mseAppearance = isShow ? (packetData.mseAppearance || packetData.appearance || '') : '';
  const mseOrientation = isShow ? (packetData.mseOrientation || packetData.orientation || '') : '';
  const mseMoodAffect = isShow ? (packetData.mseMoodAffect || packetData.moodAffect || '') : '';
  const mseSpeechThought = isShow ? (packetData.mseSpeechThought || packetData.speechThought || '') : '';
  const safetyRiskScreen = isShow ? (packetData.safetyRiskScreen || packetData.suicideRiskScreen || packetData.safetyScreen || '') : '';

  const clinicalObservations = isShow ? (packetData.clinicalObservations || packetData.cbtInterventions || packetData.clinicalNotes || '') : '';

  const treatmentGoals = isShow
    ? (Array.isArray(packetData.treatmentGoals)
        ? packetData.treatmentGoals
        : (Array.isArray(packetData.goals)
            ? packetData.goals
            : (packetData.treatmentPlan ? [packetData.treatmentPlan] : [])))
    : [];

  const providerName = isShow ? (packetData.referringProviderName || packetData.providerName || packetData.attendingProviderName || '') : '';
  const providerTitle = isShow ? (packetData.providerTitle || packetData.providerCredentials || '') : '';
  const npi = isShow ? (packetData.providerNpi || packetData.npi || '') : '';
  const lic = isShow ? (packetData.licenseNo || packetData.providerLicense || '') : '';
  const npiLicText = isShow ? ([lic ? `License: #${lic}` : '', npi ? `NPI: ${npi}` : ''].filter(Boolean).join(' | ')) : '';

  const codes = isShow
    ? (Array.isArray(packetData?.diagnosisCodes) ? packetData.diagnosisCodes : [])
        .map(d => (typeof d === 'string' ? d : (d.code || d.description || '')).trim())
        .filter(Boolean)
    : [];

  return (
    <div className="relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '100%', maxWidth: '850px', minHeight: '1100px', padding: '48px 56px' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-5">
        <div>
          <h1 className="text-xl font-black uppercase text-indigo-900 tracking-tight" style={{ fontFamily: 'serif' }}>
            BEHAVIORAL HEALTH INTAKE &amp; CLINICAL EVALUATION
          </h1>
          <p className="text-[10px] font-bold text-slate-600">HOPE BEHAVIORAL HEALTH &amp; COUNSELING | 10101 HARWIN DR. STE 774-C HOUSTON TX 77036</p>
        </div>
        <div className="text-right font-mono text-[10px]">
          <p className="font-bold">DOS: {dosVal}</p>
          <p className="text-slate-500">{cptVal ? `CPT: ${cptVal}` : ''}</p>
        </div>
      </div>

      {/* Patient Demographic Banner */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-3 mb-4 font-mono text-xs border border-slate-300">
        <div>PATIENT: <strong>{patientNameVal}</strong></div>
        <div>DOB: <strong>{dobVal}</strong></div>
        <div>DOA: <strong>{doaVal}</strong></div>
      </div>

      {/* Section 1: Diagnoses (ICD-10 / DSM-5) */}
      <div className="mb-4">
        <h2 className="text-xs font-black uppercase bg-indigo-900 text-white px-2.5 py-1 mb-2">
          1. DIAGNOSTIC ASSESSMENT &amp; ICD-10 CODES (BOX 21)
        </h2>
        <div className="border border-slate-300 p-3 space-y-1.5 font-mono text-xs min-h-[40px]">
          {codes.map((codeStr, index) => (
            <div key={index} className="flex justify-between">
              <span><strong>{codeStr}</strong> - Diagnosed condition</span>
              <span className="font-bold text-slate-600">{index === 0 ? 'PRIMARY' : `CODE ${index + 1}`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Mental Status Examination */}
      <div className="mb-4">
        <h2 className="text-xs font-black uppercase bg-indigo-900 text-white px-2.5 py-1 mb-2">
          2. MENTAL STATUS EXAMINATION (MSE)
        </h2>
        <div className="border border-slate-300 p-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-700 block text-[10px]">APPEARANCE:</span>
            <p className="text-slate-900">{mseAppearance}</p>
          </div>
          <div>
            <span className="font-bold text-slate-700 block text-[10px]">ORIENTATION:</span>
            <p className="text-slate-900">{mseOrientation}</p>
          </div>
          <div>
            <span className="font-bold text-slate-700 block text-[10px]">MOOD &amp; AFFECT:</span>
            <p className="text-slate-900">{mseMoodAffect}</p>
          </div>
          <div>
            <span className="font-bold text-slate-700 block text-[10px]">SPEECH &amp; THOUGHT:</span>
            <p className="text-slate-900">{mseSpeechThought}</p>
          </div>
          <div className="col-span-2 bg-slate-50 p-2 border border-slate-200">
            <span className="font-bold text-emerald-800 block text-[10px]">SAFETY &amp; SUICIDE RISK SCREEN:</span>
            <p className="text-slate-900 font-semibold">{safetyRiskScreen}</p>
          </div>
        </div>
      </div>

      {/* Section 3: Clinical Session Observations & Interventions */}
      <div className="mb-4">
        <h2 className="text-xs font-black uppercase bg-indigo-900 text-white px-2.5 py-1 mb-2">
          3. CLINICAL SESSION OBSERVATIONS &amp; CBT INTERVENTIONS
        </h2>
        <div className="border border-slate-300 p-3 text-xs leading-relaxed space-y-2 min-h-[60px]">
          <p>{clinicalObservations}</p>
        </div>
      </div>

      {/* Section 4: Treatment Plan & Milestones */}
      <div className="mb-6">
        <h2 className="text-xs font-black uppercase bg-indigo-900 text-white px-2.5 py-1 mb-2">
          4. TREATMENT PLAN &amp; MEASURABLE GOALS
        </h2>
        <div className="border border-slate-300 p-3 text-xs space-y-1.5 font-mono min-h-[50px]">
          {treatmentGoals.map((goal, idx) => (
            <p key={idx}>{typeof goal === 'string' ? goal : `${idx + 1}. ${goal.goal || goal.description || ''}`}</p>
          ))}
        </div>
      </div>

      {/* Signature */}
      <div className="pt-4 border-t-2 border-slate-800 flex justify-between items-end text-xs font-mono">
        <div>
          <p className="font-bold">{providerName}</p>
          <p className="text-slate-600">{providerTitle}</p>
          <p className="text-slate-600">{npiLicText}</p>
        </div>
        <div className="text-right">
          <p className="font-cursive italic text-indigo-900 font-bold border-b border-slate-400 pb-1 w-48">{providerName}</p>
          <p className="text-slate-500 text-[10px]">{providerName ? 'ELECTRONICALLY SIGNED & VERIFIED' : ''}</p>
        </div>
      </div>
    </div>
  );
};
