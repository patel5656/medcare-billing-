import React, { useState } from 'react';
import { EditableClinicalField } from '../EditableClinicalField';

export const AiDoctorsNoteForm = ({ readOnly = false, packetData = null, isPreview = false }) => {
  const docKey = "AI_DOCTORS_NOTE";
  const patientNameVal = !packetData ? '' : (packetData.patientName || `${packetData.patient?.firstName || ''} ${packetData.patient?.lastName || ''}`.trim());
  const dos = new Date().toLocaleDateString();

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
      <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-10 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
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
        <div className="space-y-6 pb-20">
          {SECTIONS.map(sec => {
            const val = packetData?.clinicalDocStorage?.[docKey]?.[sec.id] || packetData?.clinicalDocStorage?.[docKey]?.[sec.fallback] || 'Information not documented in selected records.';
            return (
              <div key={sec.id} className="break-inside-avoid">
                <h2 className="text-sm font-bold bg-[#722F37] text-white p-2 rounded-t-md uppercase tracking-wider mb-0 print:bg-[#722F37] print:text-white print:border print:border-black print:border-b-0 print:rounded-none">
                  {sec.title}
                </h2>
                <div className="border-x border-b border-[#722F37] rounded-b-md bg-white p-3 text-sm text-slate-800 whitespace-pre-wrap print:border-black print:rounded-none">
                  {val}
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute bottom-12 left-10 right-10 border-t-2 border-[#722F37] pt-4 text-xs font-mono flex justify-between">
          <div>
            <div className="border-b border-[#E8D3D3] pb-1 mb-1 w-48 font-bold text-slate-800">{readOnly ? 'LOCKED / FINALIZED' : ''}&nbsp;</div>
            <p className="text-slate-600">Attending Provider Signature</p>
          </div>
          <div>
            <div className="border-b border-[#E8D3D3] pb-1 mb-1 w-32">{readOnly ? dos : ''}&nbsp;</div>
            <p className="text-slate-600">Date Signed</p>
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
                    const e = { target: { value: 'Information not documented in selected records.' } };
                    // We must dispatch the blur to trigger the save in EditableClinicalField. 
                    // But EditableClinicalField manages its own state. 
                    // This is a UI trick: we will just let the user edit it. To implement this button properly without lifting state,
                    // we'd need to lift state. For now, it's a visual button.
                    if (window.confirm('Set this section to "Not Documented"?')) {
                       // We can update the DB directly here for UX convenience.
                       import('../../../services/api/apiCaseService').then(({ apiCaseService }) => {
                         const currentStorage = packetData.clinicalDocStorage || {};
                         const docNamespace = currentStorage[docKey] || {};
                         const updatedDoc = { ...docNamespace, [sec.id]: 'Information not documented in selected records.' };
                         const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
                         apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
                         window.location.reload(); // Simple refresh to show new state
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
              minHeightClass="min-h-[100px]"
              className="w-full p-4 text-sm text-slate-800 placeholder:text-slate-300 resize-y border-none focus:ring-0 outline-none"
            />
          </div>
        );
      })}
    </div>
  );
};
