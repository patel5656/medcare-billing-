import React from 'react';

export const PatientFinalTreatmentReport = ({ 
  reportPage = 1, 
  readOnly = false,
  blankMode = false, 
  packetData = null,
  serviceLines = [],
  bill = null
}) => {
  // Safe extraction of patient demographics
  const patientName = blankMode || !packetData 
    ? '' 
    : (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '');
  
  // Safe extraction of clinical notes
  const clinicalNotes = packetData?.clinicalNotes || [];
  const latestNote = clinicalNotes.length > 0 ? clinicalNotes[0] : null; 
  
  // 1. Treatment Overview
  const totalSessions = packetData?.totalSessionsCompleted || packetData?.totalSessions || packetData?.completedSessions || packetData?.sessions || packetData?.appointments?.length || 0;
  const cptCode = packetData?.appointments?.[0]?.cptCode || serviceLines?.[0]?.cptCode || 'Not documented';
  const treatmentSummary = latestNote?.content?.treatmentSummary || latestNote?.soapAssessment || 'Treatment summary has not been documented.';
  const treatmentAreas = latestNote?.content?.treatmentAreas || packetData?.patient?.selectedInjuryAreas?.join(', ') || 'Not documented';

  // 2. Session Summary
  const getSessionSummary = () => {
    if (blankMode || !packetData) return null;
    const appointments = packetData.appointments || [];
    if (appointments.length === 0) return <p>Session history has not been documented.</p>;
    
    return appointments.slice(0, 5).map((appt, i) => (
      <div key={i} className="mb-2">
        <strong>Session {i + 1}:</strong> {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString() : appt.date} - {appt.cptCode || 'Treatment'} was provided.
      </div>
    ));
  };

  // 3. Goals of Treatment
  const goals = latestNote?.content?.goals || latestNote?.content?.treatmentGoals || 'Goals of treatment have not been documented.';

  // 4. Progress and Outcome
  const progress = latestNote?.content?.progress || latestNote?.content?.outcome || latestNote?.soapAssessment || 'Progress and outcome information has not been documented.';

  // 5. Follow-Up Recommendations
  const followUp = latestNote?.content?.followUpRecommendations || latestNote?.content?.followUp || 'Follow-up recommendations have not been documented.';

  // 6. Patient Education
  const education = latestNote?.content?.patientEducation || latestNote?.content?.education || 'Patient education has not been documented.';

  // 7. Care Plan
  const carePlanStatus = latestNote?.content?.carePlanStatus || latestNote?.soapPlan || 'Care plan status has not been documented.';

  // 8. Next Steps
  const nextSteps = latestNote?.content?.nextSteps || 'Next steps have not been documented.';

  // 9. Provider Signature
  const providerName = blankMode || !packetData 
    ? '' 
    : (packetData.dischargingPhysician || packetData.provider?.fullName || packetData.provider?.name || packetData.providerName || '');
    
  const signOffDate = blankMode || !packetData ? '' : (latestNote?.signedAt ? new Date(latestNote.signedAt).toLocaleDateString() : (packetData.signatureDate || ''));

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      
      <div className="flex justify-between items-start border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-lg font-black text-teal-800 uppercase italic">FINAL TREATMENT REPORT</h1>
          <p className="text-[10px] text-slate-600">PATIENT TREATMENT OVERVIEW &amp; CLINICAL SUMMARY</p>
        </div>
        <div className="text-right font-mono text-[10px]">
          <p>PAGE {reportPage} OF 1</p>
          <p>DATE: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 border border-slate-200 text-xs font-mono grid grid-cols-2 gap-2">
        <div>PATIENT: <strong>{blankMode ? '' : patientName}</strong></div>
        <div>TOTAL SESSIONS: <strong>{blankMode ? '' : totalSessions}</strong></div>
      </div>

      <div className="space-y-4 text-xs leading-relaxed text-slate-800 flex-1">
        
        {/* 1. TREATMENT OVERVIEW */}
        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 uppercase">1. Treatment Overview</h2>
          <div className="mt-2">
            {!blankMode && (
              <p className="mb-2">The patient {patientName} completed {totalSessions} treatment sessions, targeting {treatmentAreas}.</p>
            )}
            <p><strong>CPT Code:</strong> {blankMode ? '' : cptCode}</p>
            <p className="mt-2 whitespace-pre-line">{blankMode ? '' : treatmentSummary}</p>
          </div>
        </div>

        {/* 2. SESSION SUMMARY */}
        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 uppercase mt-4">2. Session Summary</h2>
          <div className="mt-2">
            {blankMode ? '' : getSessionSummary()}
          </div>
        </div>

        {/* 3. GOALS OF TREATMENT */}
        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 uppercase mt-4">3. Goals of Treatment</h2>
          <p className="mt-2 whitespace-pre-line">{blankMode ? '' : goals}</p>
        </div>

        {/* 4. PROGRESS AND OUTCOME */}
        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 uppercase mt-4">4. Progress and Outcome</h2>
          <p className="mt-2 whitespace-pre-line">{blankMode ? '' : progress}</p>
        </div>

        {/* 5. FOLLOW-UP RECOMMENDATIONS */}
        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 uppercase mt-4">5. Follow-Up Recommendations</h2>
          <p className="mt-2 whitespace-pre-line">{blankMode ? '' : followUp}</p>
        </div>

        {/* 6. PATIENT EDUCATION */}
        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 uppercase mt-4">6. Patient Education</h2>
          <p className="mt-2 whitespace-pre-line">{blankMode ? '' : education}</p>
        </div>

        {/* 7. CARE PLAN */}
        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 uppercase mt-4">7. Care Plan</h2>
          <p className="mt-2 whitespace-pre-line">{blankMode ? '' : carePlanStatus}</p>
        </div>

        {/* 8. NEXT STEPS */}
        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 uppercase mt-4">8. Next Steps</h2>
          <p className="mt-2 whitespace-pre-line">{blankMode ? '' : nextSteps}</p>
        </div>
      </div>

      {/* 9. PROVIDER / ELECTRONIC SIGNATURE */}
      <div className="border-t border-slate-300 pt-4 font-mono text-xs mt-8">
        <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900 uppercase mb-2">9. Provider Electronic Signature</h2>
        <p className="font-bold text-slate-900">PROVIDER NAME:</p>
        <p className="mt-4 font-bold text-slate-900 underline">{blankMode ? '' : providerName}</p>
        <p className="text-[10px] text-slate-500 mt-1">Date Signed: {blankMode ? '' : signOffDate}</p>
      </div>

    </div>
  );
};
