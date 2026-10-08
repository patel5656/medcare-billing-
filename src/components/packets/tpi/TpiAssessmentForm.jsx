// src/components/packets/tpi/TpiAssessmentForm.jsx
import React from 'react';

const getPainScore = (packetData) => {
  if (!packetData) return null;
  const score = packetData.painScore ?? packetData.painScale ?? packetData.painCurrent ?? packetData.painLevel;
  if (score !== undefined && score !== null && score !== '') {
    const num = Number(score);
    return isNaN(num) ? null : num;
  }
  return null;
};

const getMuscleChecked = (label, packetData) => {
  if (!packetData) return false;
  const muscles = packetData.affectedMuscles || packetData.musclesInjected || packetData.muscleGroups || packetData.tpiMuscles;
  if (Array.isArray(muscles)) {
    return muscles.some(m => String(m).toLowerCase().includes(label.toLowerCase().split(' ')[0]));
  }
  if (typeof muscles === 'string') {
    return muscles.toLowerCase().includes(label.toLowerCase().split(' ')[0]);
  }
  return false;
};

import { EditableClinicalField } from '../EditableClinicalField';

export const TpiAssessmentForm = ({ readOnly = false, blankMode = false, packetData = null, serviceLines = [] }) => {
  const storage = packetData?.clinicalDocStorage?.['TPI_ASSESSMENT'] || {};
  const patientNameVal = blankMode || !packetData ? '' : (packetData.patientName || '');
  const evalDateVal = blankMode || !packetData ? '' : (packetData.initialDate || packetData.evalDate || packetData.assessmentDate || '');
  const signatureDateVal = blankMode || !packetData ? '' : (packetData.signatureDate || packetData.signedAt || packetData.dischargeDate || '');
  const providerNameVal = blankMode || !packetData ? '' : (packetData.referringProviderName || packetData.providerName || packetData.attendingProviderName || '');

  const painScore = blankMode ? null : getPainScore(packetData);
  const chiefComplaintText = blankMode || !packetData ? '' : (storage.chiefComplaint || packetData.chiefComplaint || packetData.painDescription || packetData.mechanismOfInjury || '');
  const palpationFindingsText = blankMode || !packetData ? '' : (storage.palpationFindings || packetData.palpationFindings || packetData.palpation || packetData.physicalExam?.palpation || '');
  const treatmentPlanText = blankMode || !packetData ? '' : (storage.treatmentPlan || packetData.treatmentPlan || packetData.plan || packetData.planRecommendations || '');

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      {/* Header */}
      <div className="border-b-2 border-[#722F37] pb-4 mb-6 text-center">
        <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight" style={{ fontFamily: 'serif' }}>TRIGGER POINT ASSESSMENT</h1>
        <p className="text-xs font-bold text-slate-600 mt-1">CLINICAL EVALUATION &amp; FINDINGS</p>
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

      {/* Pain Assessment */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">1. Pain Assessment</h2>
        <div className="space-y-4 text-xs font-mono px-2">
          <div className="flex items-center gap-4">
            <span className="font-bold">Pain Scale (0-10):</span>
            <div className="flex gap-2">
              {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                <div key={n} className={`w-6 h-6 border flex items-center justify-center ${painScore === n ? 'bg-amber-100 border-amber-500 font-bold text-slate-900' : 'border-slate-300 text-slate-400'}`}>
                  {n}
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="font-bold block mb-1">Chief Complaint / Pain Description:</span>
            <EditableClinicalField 
              packetData={packetData}
              docKey="TPI_ASSESSMENT"
              field="chiefComplaint"
              value={chiefComplaintText} 
              readOnly={readOnly || blankMode || !packetData}
              minHeightClass="min-h-[60px]"
              className="border border-slate-300 p-2 text-slate-700 bg-slate-50 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Clinical Findings */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">2. Clinical Findings &amp; Trigger Points</h2>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono px-2">
          <div>
            <span className="font-bold block mb-2">Affected Muscle Groups:</span>
            <ul className="space-y-1 text-slate-700">
              {['Trapezius (Bilateral)', 'Levator Scapulae', 'Rhomboids', 'Quadratus Lumborum'].map(label => {
                const isChecked = !blankMode && getMuscleChecked(label, packetData);
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
            <span className="font-bold block mb-2">Palpation Findings:</span>
            <EditableClinicalField 
              packetData={packetData}
              docKey="TPI_ASSESSMENT"
              field="palpationFindings"
              value={palpationFindingsText} 
              readOnly={readOnly || blankMode || !packetData}
              minHeightClass="min-h-[80px]"
              className="border border-slate-300 p-2 text-slate-700 bg-slate-50 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>
      
      {/* Plan */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">3. Treatment Plan</h2>
        <div className="text-xs font-mono px-2">
          <EditableClinicalField 
            packetData={packetData}
            docKey="TPI_ASSESSMENT"
            field="treatmentPlan"
            value={treatmentPlanText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[60px]"
            className="border border-slate-300 p-2 text-slate-700 bg-slate-50 focus:ring-amber-500"
          />
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
