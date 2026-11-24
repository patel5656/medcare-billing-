import React, { useState } from 'react';
import { EditableClinicalField } from '../EditableClinicalField';

export const AiDoctorsNoteForm = ({ 
  readOnly = false, 
  packetData = null, 
  isPreview = false,
  reviewer = '',
  activeSignature = ''
}) => {
  const docKey = "AI_DOCTORS_NOTE";
  const patientNameVal = !packetData ? '' : (packetData.patientName || `${packetData.patient?.firstName || ''} ${packetData.patient?.lastName || ''}`.trim());
  const dos = new Date().toLocaleDateString();

  const defaultSignature = activeSignature || (reviewer ? (reviewer.startsWith('Dr.') ? reviewer : `Dr. ${reviewer}`) : 'Dr. Segun Adeoye, DC / MD');
  const signatureVal = packetData?.clinicalDocStorage?.[docKey]?.attendingSignature || defaultSignature;
  const dateVal = packetData?.clinicalDocStorage?.[docKey]?.signatureDate || dos;

  const SECTIONS = [
    { id: 'chiefComplaint', fallback: 'presentingConcerns', title: '1. CHIEF COMPLAINT & PRESENTING CONCERNS' },
    { id: 'subjectiveHistory', fallback: 'clinicalSummary', title: '2. SUBJECTIVE HISTORY & PAIN QUALITY' },
    { id: 'objectiveFindings', fallback: '', title: '3. OBJECTIVE & PHYSICAL EXAMINATION FINDINGS' },
    { id: 'clinicalAssessment', fallback: 'diagnosis', title: '4. CLINICAL ASSESSMENT & DIAGNOSTIC IMPRESSION (ICD-10)' },
    { id: 'treatmentsAdministered', fallback: 'treatmentProvided', title: '5. TREATMENTS & PROCEDURES ADMINISTERED' },
    { id: 'courseOfCare', fallback: 'progress', title: '6. COURSE OF CARE & CLINICAL PROGRESS' },
    { id: 'treatmentPlan', fallback: 'treatmentPlan', title: '7. TREATMENT PLAN & THERAPEUTIC GOALS' },
    { id: 'followUp', fallback: 'followUp', title: '8. FOLLOW-UP, DISCHARGE RECOMMENDATIONS & PROGNOSIS' },
  ];

  if (isPreview) {
    // PREVIEW TAB (Standardized Document Preview) - Deep Burgundy & Blush Theme
    return (
      <div 
        className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-10 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" 
        style={{ width: '850px', minHeight: '1100px' }}
      >
        <div className="border-b-4 border-[#722F37] pb-4 mb-6 text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[#722F37]" style={{ fontFamily: 'serif' }}>
            AI DOCTOR'S NOTE
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase tracking-widest">Comprehensive Clinical Evaluation</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-6 bg-[#F9ECEC] p-3 rounded-lg border border-[#E8D3D3]">
          <div className="flex border-b border-[#E8D3D3] pb-1">
            <span className="font-bold w-32 text-[#722F37]">Patient Name:</span>
            <span className="flex-1 text-slate-800">{patientNameVal}&nbsp;</span>
          </div>
          <div className="flex border-b border-[#E8D3D3] pb-1">
            <span className="font-bold w-32 text-[#722F37]">Date of Report:</span>
            <span className="flex-1 text-slate-800">{dos}&nbsp;</span>
          </div>
        </div>

        {/* 8 Clinical Sections with interactive manual edit capability */}
        <div className="space-y-6 pb-6">
          {SECTIONS.map(sec => {
            const rawVal = packetData?.clinicalDocStorage?.[docKey]?.[sec.id] || packetData?.clinicalDocStorage?.[docKey]?.[sec.fallback];
            const val = rawVal !== undefined ? rawVal : 'Information not documented in selected records.';
            return (
              <div key={sec.id} className="break-inside-avoid">
                <h2 className="text-sm font-bold bg-[#722F37] text-white p-2 rounded-t-md uppercase tracking-wider mb-0 print:bg-[#722F37] print:text-white print:border print:border-black print:border-b-0 print:rounded-none">
                  {sec.title}
                </h2>
                <div className="border-x border-b border-[#722F37] rounded-b-md bg-white p-2 text-sm text-slate-800 break-words [overflow-wrap:anywhere] overflow-hidden print:border-black print:rounded-none">
                  <EditableClinicalField 
                    packetData={packetData}
                    docKey={docKey}
                    field={sec.id}
                    value={val}
                    placeholder="Information not documented in selected records."
                    readOnly={readOnly}
                    autoGrow={true}
                    minHeightClass="min-h-[50px]"
                    className="w-full p-1 text-sm text-slate-800 placeholder:text-slate-400 resize-y border-none focus:ring-1 focus:ring-[#722F37] outline-none leading-relaxed bg-transparent"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Attending Provider Signature & Date Signed Footer */}
        <div className="mt-auto pt-8 border-t-2 border-[#722F37] text-xs font-mono flex justify-between items-end">
          <div className="w-80">
            <div className="border-b border-[#E8D3D3] pb-1 mb-1 font-bold text-slate-900">
              <EditableClinicalField
                packetData={packetData}
                docKey={docKey}
                field="attendingSignature"
                value={signatureVal}
                readOnly={readOnly}
                inputType="input"
                placeholder="Type signature..."
                className="w-full font-serif italic font-bold text-base text-slate-900 bg-transparent tracking-wide"
              />
            </div>
            <p className="text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider">Attending Provider Signature</p>
          </div>
          <div className="w-48">
            <div className="border-b border-[#E8D3D3] pb-1 mb-1 text-right">
              <EditableClinicalField
                packetData={packetData}
                docKey={docKey}
                field="signatureDate"
                value={dateVal}
                readOnly={readOnly}
                inputType="input"
                placeholder="Date Signed"
                className="w-full font-mono text-sm font-semibold text-slate-800 bg-transparent text-right"
              />
            </div>
            <p className="text-slate-600 font-sans font-bold text-[11px] uppercase tracking-wider text-right">Date Signed</p>
          </div>
        </div>
      </div>
    );
  }

  // STRUCTURED SECTIONS FORM (Editable mode matching screenshot)
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {SECTIONS.map(sec => {
        const val = packetData?.clinicalDocStorage?.[docKey]?.[sec.id] || packetData?.clinicalDocStorage?.[docKey]?.[sec.fallback];
        const displayVal = val !== undefined ? val : '';
        
        return (
          <div key={sec.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col relative group transition focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-400">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{sec.title}</h2>
              {!readOnly && (
                <button 
                  type="button"
                  className="text-[10px] font-medium text-slate-400 hover:text-teal-600 underline cursor-pointer transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                  onClick={() => {
                    if (window.confirm('Set this section to "Not Documented"?')) {
                       import('../../../services/api/apiCaseService').then(({ apiCaseService }) => {
                         const currentStorage = packetData?.clinicalDocStorage || {};
                         const docNamespace = currentStorage[docKey] || {};
                         const updatedDoc = { ...docNamespace, [sec.id]: 'Information not documented in selected records.' };
                         const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
                         apiCaseService.updateCase(packetData?.id, { clinicalDocStorage: updatedStorage });
                         window.location.reload();
                       });
                    }
                  }}
                >
                  Set as Not Documented
                </button>
              )}
            </div>
            <EditableClinicalField 
              packetData={packetData}
              docKey={docKey}
              field={sec.id}
              value={displayVal} 
              readOnly={readOnly}
              autoGrow={true}
              minHeightClass="min-h-[100px]"
              className="w-full p-4 text-sm text-slate-800 placeholder:text-slate-300 resize-y border-none focus:ring-0 outline-none leading-relaxed"
            />
          </div>
        );
      })}

      {/* Attending Provider Signature & Date Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-4 space-y-4">
        <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
          ATTENDING PROVIDER SIGNATURE & DATE
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Attending Provider Signature</label>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 focus-within:bg-white focus-within:border-teal-400">
              <EditableClinicalField
                packetData={packetData}
                docKey={docKey}
                field="attendingSignature"
                value={signatureVal}
                readOnly={readOnly}
                inputType="input"
                placeholder="Attending Clinician Signature"
                className="w-full font-serif italic font-bold text-base text-slate-900 bg-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Date Signed</label>
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 focus-within:bg-white focus-within:border-teal-400">
              <EditableClinicalField
                packetData={packetData}
                docKey={docKey}
                field="signatureDate"
                value={dateVal}
                readOnly={readOnly}
                inputType="input"
                placeholder="MM/DD/YYYY"
                className="w-full font-mono text-sm font-semibold text-slate-800 bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
