// src/components/packets/tecar/TecarAssessmentForm.jsx
import React from 'react';

const getPainScore = (packetData) => {
  if (!packetData) return null;
  const score = packetData.painScore ?? packetData.painScale ?? packetData.painCurrent ?? packetData.vasPainScale;
  if (score !== undefined && score !== null && score !== '') {
    const num = Number(score);
    return isNaN(num) ? null : num;
  }
  return null;
};

const isTissueStatusChecked = (label, packetData) => {
  if (!packetData) return false;
  const status = packetData.tissueStatus || packetData.tecarTissueStatus;
  const key = label.split(' ')[0].toLowerCase();
  if (Array.isArray(status)) {
    return status.some(s => String(s).toLowerCase().includes(key));
  }
  if (typeof status === 'string') {
    return status.toLowerCase().includes(key);
  }
  return false;
};

export const TecarAssessmentForm = ({ readOnly = false, blankMode = false, packetData = null, serviceLines = [] }) => {
  const patientNameVal = blankMode || !packetData ? '' : (packetData.patientName || '');
  const evalDateVal = blankMode || !packetData ? '' : (packetData.initialDate || packetData.evalDate || packetData.assessmentDate || '');
  const signatureDateVal = blankMode || !packetData ? '' : (packetData.signatureDate || packetData.signedAt || packetData.dischargeDate || '');
  const providerNameVal = blankMode || !packetData ? '' : (packetData.referringProviderName || packetData.providerName || packetData.attendingProviderName || '');

  const painScore = blankMode ? null : getPainScore(packetData);
  const painLocationQualityText = blankMode || !packetData ? '' : (packetData.painLocationQuality || packetData.painLocation || packetData.painDescription || '');
  const palpationRomText = blankMode || !packetData ? '' : (packetData.palpationRom || packetData.palpationFindings || packetData.romFindings || packetData.physicalExam?.rom || '');
  const treatmentPlanText = blankMode || !packetData ? '' : (packetData.tecarTreatmentPlan || packetData.treatmentPlan || packetData.plan || '');

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center">
        <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight" style={{ fontFamily: 'serif' }}>TECAR THERAPY ASSESSMENT</h1>
        <p className="text-xs font-bold text-slate-600 mt-1">CLINICAL EVALUATION &amp; TISSUE STATUS</p>
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-6">
        <div className="flex border-b border-slate-300 pb-1">
          <span className="font-bold w-24">Patient Name:</span>
          <span className="flex-1 text-slate-700">{patientNameVal}&nbsp;</span>
        </div>
        <div className="flex border-b border-slate-300 pb-1">
          <span className="font-bold w-24">Date of Eval:</span>
          <span className="flex-1 text-slate-700">{evalDateVal}&nbsp;</span>
        </div>
      </div>

      {/* Subjective */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">1. Subjective Findings</h2>
        <div className="space-y-4 text-xs font-mono px-2">
          <div className="flex items-center gap-4">
            <span className="font-bold">VAS Pain Scale (0-10):</span>
            <div className="flex gap-2">
              {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                <div key={n} className={`w-6 h-6 border flex items-center justify-center ${painScore === n ? 'bg-rose-100 border-rose-500 font-bold text-slate-900' : 'border-slate-300 text-slate-400'}`}>
                  {n}
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="font-bold block mb-1">Pain Location &amp; Quality:</span>
            <div className="border border-slate-300 p-2 min-h-[60px] text-slate-700 bg-slate-50">
              {painLocationQualityText}
            </div>
          </div>
        </div>
      </div>

      {/* Objective */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">2. Objective Assessment</h2>
        <div className="space-y-4 text-xs font-mono px-2">
          <div>
            <span className="font-bold block mb-2">Tissue Status Checklist:</span>
            <div className="grid grid-cols-3 gap-2 border border-slate-300 p-3 bg-slate-50">
              {['Edema / Swelling', 'Muscle Spasm / Hypertonicity', 'Fibrotic Tissue / Adhesions', 'Localized Inflammation', 'Trigger Points', 'Ischemia / Poor Perfusion'].map((item) => (
                <label key={item} className="flex items-center gap-2 cursor-default">
                  <input type="checkbox" checked={isTissueStatusChecked(item, packetData)} readOnly className="rounded border-slate-400 text-teal-600" />
                  <span className="text-[11px]">{item}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="font-bold block mb-1">Palpation &amp; ROM Findings:</span>
            <div className="border border-slate-300 p-2 min-h-[60px] text-slate-700 bg-slate-50">
              {palpationRomText}
            </div>
          </div>
        </div>
      </div>

      {/* Plan */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">3. Plan of Care</h2>
        <div className="text-xs font-mono px-2">
          <span className="font-bold block mb-1">TECAR Protocol &amp; Frequency:</span>
          <div className="border border-slate-300 p-2 min-h-[60px] text-slate-700 bg-slate-50">
            {treatmentPlanText}
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="border-t border-slate-300 pt-4 font-mono text-xs mt-auto">
        <div className="flex justify-between items-end">
          <div>
            <p className="font-bold text-slate-900">Evaluated By: <span className="underline ml-1">{providerNameVal}</span></p>
            <p className="text-[10px] text-slate-500 mt-1">TECAR Therapy Center</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">Date: <span className="underline ml-1">{signatureDateVal}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
