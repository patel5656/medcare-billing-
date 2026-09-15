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
    <div className="relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '100%', maxWidth: '850px', minHeight: '1100px', padding: '48px 56px' }}>
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
        <div className="grid grid-cols-2 gap-4 text-xs font-mono px-2">
          <div>
            <span className="font-bold block mb-2">Tissue Status:</span>
            <ul className="space-y-1 text-slate-700">
              {[
                'Superficial Inflammation (Capacitive indication)',
                'Deep Tissue Stiffness (Resistive indication)',
                'Joint Effusion',
                'Ligament/Tendon involvement'
              ].map(label => {
                const isChecked = !blankMode && isTissueStatusChecked(label, packetData);
                return (
                  <li key={label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 border border-slate-400 ${isChecked ? 'bg-slate-800' : ''}`}></div>
                    {label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <span className="font-bold block mb-2">Palpation &amp; ROM:</span>
            <div className="text-slate-700 border border-slate-300 p-2 min-h-[80px] bg-slate-50">
              {palpationRomText}
            </div>
          </div>
        </div>
      </div>
      
      {/* Plan */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">3. Treatment Plan (TECAR)</h2>
        <div className="text-xs font-mono px-2">
          <div className="text-slate-700 border border-slate-300 p-2 min-h-[60px] bg-slate-50">
            {treatmentPlanText}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 left-14 right-14 border-t border-slate-300 pt-4 text-xs font-mono flex justify-between">
        <div>
          <div className="border-b border-slate-400 pb-1 mb-1 w-48 font-bold">{providerNameVal}&nbsp;</div>
          <p className="text-slate-600">Provider Signature</p>
        </div>
        <div>
          <div className="border-b border-slate-400 pb-1 mb-1 w-32">{signatureDateVal}&nbsp;</div>
          <p className="text-slate-600">Date</p>
        </div>
      </div>
    </div>
  );
};
