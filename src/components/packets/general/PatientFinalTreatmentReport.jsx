import React from 'react';

export const PatientFinalTreatmentReport = ({ 
  reportPage = 1, 
  readOnly = false,
  blankMode = false, 
  packetData = null,
  serviceLines = [],
  bill = null
}) => {
  // Extract patient info
  const patient = packetData?.patient || {};
  const lastName = blankMode || !packetData ? '' : (patient.lastName || '');
  const firstName = blankMode || !packetData ? '' : (patient.firstName || '');
  const middleName = blankMode || !packetData ? '' : (patient.middleName || '');
  
  // Format DOB and calculate age
  let dobFormatted = '';
  let age = '';
  if (!blankMode && patient.dob) {
    dobFormatted = patient.dob; // Format as needed
    const dobDate = new Date(patient.dob);
    if (!isNaN(dobDate)) {
      const diffMs = Date.now() - dobDate.getTime();
      const ageDate = new Date(diffMs);
      age = Math.abs(ageDate.getUTCFullYear() - 1970) + ' YEARS';
    }
  }

  const gender = blankMode || !packetData ? '' : (patient.gender || patient.sex || '');

  // Extract Clinical Notes (Sort by latest)
  const clinicalNotes = packetData?.clinicalNotes || [];
  const latestNote = clinicalNotes.length > 0 ? clinicalNotes[0] : null; 
  
  // Vitals
  let bloodPressure = '';
  let heartRate = '';
  let temperature = '';
  
  for (const note of clinicalNotes) {
    const content = note.content || {};
    const nestedVitals = content.vitals || {};
    
    if (!bloodPressure) bloodPressure = nestedVitals.bloodPressure || nestedVitals.bp || content.bloodPressure || content.bp || '';
    if (!heartRate) heartRate = nestedVitals.heartRate || nestedVitals.hr || content.heartRate || content.hr || '';
    if (!temperature) temperature = nestedVitals.temperature || nestedVitals.temp || content.temperature || content.temp || '';
    
    if (bloodPressure && heartRate && temperature) break;
  }

  // Other info
  const accidentDate = packetData?.accidentDate || 'Not documented';
  const chiefComplaint = packetData?.chiefComplaint || 'Not documented';
  const providerName = blankMode || !packetData 
    ? '' 
    : (packetData.dischargingPhysician || packetData.provider?.fullName || bill?.provider?.name || packetData.assignedProviderIds?.[0] || 'Provider');
    
  const assessmentDate = packetData?.initialDate ? new Date(packetData.initialDate).toLocaleDateString() : (packetData?.createdAt ? new Date(packetData.createdAt).toLocaleDateString() : 'Not documented');
  
  const signOffDate = blankMode || !packetData ? '' : (latestNote?.signedAt ? new Date(latestNote.signedAt).toLocaleDateString() : (packetData.signatureDate || new Date().toLocaleDateString()));

  // Treatment Overview
  const totalSessions = packetData?.appointments?.length || packetData?.totalSessionsCompleted || 0;
  const cptCode = packetData?.appointments?.[0]?.cptCode || serviceLines?.[0]?.cptCode || 'Not documented';
  const treatmentSummary = latestNote?.content?.treatmentSummary || latestNote?.soapAssessment || 'Treatment summary has not been documented.';
  const treatmentAreas = latestNote?.content?.treatmentAreas || packetData?.injuryBodyParts || patient.selectedInjuryAreas?.join(', ') || 'Not documented';

  // 2. Session Summary
  const getSessionSummary = () => {
    if (blankMode || !packetData) return null;
    const appointments = packetData.appointments || [];
    if (appointments.length === 0) return <p className="text-sm">Session history has not been documented.</p>;
    
    return appointments.slice(0, 5).map((appt, i) => (
      <div key={i} className="mb-2 text-sm">
        <strong>Session {i + 1}:</strong> {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString() : appt.date} - {appt.cptCode || 'Treatment'} was provided.
      </div>
    ));
  };

  const getClinicalContent = (pathFn, fallback) => {
    if (blankMode || !packetData) return fallback;
    for (const note of clinicalNotes) {
      const val = pathFn(note);
      if (val) return val;
    }
    return fallback;
  };

  const physicalExam = getClinicalContent(n => n.content?.physicalExam || n.soapObjective, 'Physical examination findings have not been documented.');
  const goals = getClinicalContent(n => n.content?.goals || n.content?.treatmentGoals, 'Goals of treatment have not been documented.');
  const progress = getClinicalContent(n => n.content?.progress || n.content?.outcome || n.soapAssessment, 'Progress and outcome information has not been documented.');
  const followUp = getClinicalContent(n => n.content?.followUpRecommendations || n.content?.followUp, 'Follow-up recommendations have not been documented.');
  const education = getClinicalContent(n => n.content?.patientEducation || n.content?.education, 'Patient education has not been documented.');
  const carePlanStatus = getClinicalContent(n => n.content?.carePlanStatus || n.soapPlan, 'Care plan status has not been documented.');
  const nextSteps = getClinicalContent(n => n.content?.nextSteps, 'Next steps have not been documented.');

  return (
    <div className="w-[850px] max-w-full relative bg-white text-black font-sans shadow-2xl mx-auto border border-slate-300 p-12 space-y-8 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-2 border-b-2 border-black pb-6">
        <h1 className="text-2xl font-bold uppercase">{providerName}</h1>
        <p className="text-lg font-bold">Final Medical Report</p>
        
        {/* Software Logo */}
        <div className="w-full flex justify-center py-2">
          <img src="/fm-logo.jpeg" alt="Logo" className="h-20 object-contain mix-blend-multiply" />
        </div>

        <div className="text-xs font-bold mt-2">
          <p>{bill?.provider?.address?.street || '10101 HARWIN DR.STE 274 HOUSTON TX 77036'}</p>
          <p>
            OFFICE: {bill?.provider?.contact?.phone || '713-485-5712'} &nbsp;
            CELL: {bill?.provider?.contact?.cell || '832-815-0959'} &nbsp;
            FAX: {bill?.provider?.contact?.fax || '832-416-1502'}
          </p>
          <p>Email: {bill?.provider?.contact?.email || 'provider@example.com'}</p>
        </div>
      </div>

      <div className="text-sm font-bold mt-4">
        Assessment Date: {blankMode ? '' : assessmentDate}
      </div>

      {/* PATIENT INFORMATION TABLE */}
      <div className="w-full">
        <h2 className="text-center font-bold mb-2">Patient Information</h2>
        <table className="w-full border-collapse border border-black text-sm text-center">
          <thead>
            <tr className="bg-green-500 text-black">
              <th className="border border-black p-2">Last name</th>
              <th className="border border-black p-2">First name</th>
              <th className="border border-black p-2">Middle name</th>
              <th className="border border-black p-2" colSpan={2}>Date of birth</th>
              <th className="border border-black p-2">Gender</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 uppercase">{lastName}</td>
              <td className="border border-black p-2 uppercase">{firstName}</td>
              <td className="border border-black p-2 uppercase">{middleName}</td>
              <td className="border border-black p-2 font-bold">{dobFormatted}</td>
              <td className="border border-black p-2 font-bold">{age}</td>
              <td className="border border-black p-2 uppercase">{gender}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* CLINICAL SUMMARY & HISTORY */}
      <div className="text-sm space-y-4 text-justify mt-6">
        <p>
          The patient presents with pain in multiple areas following an automobile accident. The areas of concern include:
        </p>
        <ul className="list-disc pl-8 font-bold uppercase">
          {treatmentAreas.split(',').map((area, idx) => (
             <li key={idx}>{area.trim()}</li>
          ))}
        </ul>

        <h3 className="text-center font-bold mt-6 mb-2">History of current illness</h3>
        <p><strong>Accident Details:</strong> {packetData?.chiefComplaint || packetData?.mechanismOfInjury || 'Accident details not documented.'}</p>
        <p><strong>Previous Injuries:</strong> {getClinicalContent(n => n.content?.previousInjuries, 'No significant previous injuries noted')}</p>
        <p><strong>Chronic Conditions:</strong> {getClinicalContent(n => n.content?.chronicConditions, 'None reported')}</p>
        <p><strong>Surgeries:</strong> {getClinicalContent(n => n.content?.surgeries, 'None reported')}</p>
        <p><strong>Medications:</strong> {getClinicalContent(n => n.content?.medications, 'None reported')}</p>
        <p><strong>Allergies:</strong> {getClinicalContent(n => n.content?.allergies, 'No known drug allergies')}</p>
      </div>

      {/* VITAL SIGNS TABLE */}
      <div className="w-full mt-8">
        <table className="w-full border-collapse border border-black text-sm">
          <thead>
            <tr className="bg-green-500 text-black">
              <th colSpan="2" className="border border-black p-2 text-center font-bold">Vital Signs</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 font-bold w-1/2">Blood Pressure</td>
              <td className="border border-black p-2">{bloodPressure || ''}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold">Heart Rate</td>
              <td className="border border-black p-2">{heartRate || ''}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold">Temperature</td>
              <td className="border border-black p-2">{temperature || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PHYSICAL EXAMINATION */}
      <div className="text-sm mt-8 space-y-2 text-justify">
        <p className="font-bold">Physical Examination:</p>
        <p className="whitespace-pre-line ml-4">
          {blankMode ? '' : physicalExam}
        </p>
      </div>

      {/* TREATMENT OVERVIEW */}
      <div className="text-sm mt-8 space-y-2 text-justify">
        <p className="font-bold">Treatment Overview:</p>
        {!blankMode && (
          <p>The patient completed {totalSessions} treatment sessions, targeting {treatmentAreas}.</p>
        )}
        <p><strong>CPT Code:</strong> {blankMode ? '' : cptCode}</p>
        <p className="whitespace-pre-line">{blankMode ? '' : treatmentSummary}</p>
      </div>

      {/* SESSION SUMMARY */}
      <div className="text-sm mt-8 space-y-2 text-justify">
        <p className="font-bold">Session Summary:</p>
        {getSessionSummary()}
      </div>

      {/* GOALS OF TREATMENT */}
      <div className="text-sm mt-8 space-y-2 text-justify">
        <p className="font-bold">Goals of Treatment:</p>
        <p className="whitespace-pre-line">{blankMode ? '' : goals}</p>
      </div>

      {/* PROGRESS AND OUTCOME */}
      <div className="text-sm mt-8 space-y-2 text-justify">
        <p className="font-bold">Progress and Outcome:</p>
        <p className="whitespace-pre-line">{blankMode ? '' : progress}</p>
      </div>

      {/* FOLLOW-UP RECOMMENDATIONS */}
      <div className="text-sm mt-8 space-y-2 text-justify">
        <p className="font-bold">Follow-Up Recommendations:</p>
        <p className="whitespace-pre-line">{blankMode ? '' : followUp}</p>
      </div>

      {/* PATIENT EDUCATION */}
      <div className="text-sm mt-8 space-y-2 text-justify">
        <p className="font-bold">Patient Education:</p>
        <p className="whitespace-pre-line">{blankMode ? '' : education}</p>
      </div>

      {/* CARE PLAN & NEXT STEPS */}
      <div className="text-sm mt-8 space-y-2 text-justify">
        <p className="font-bold">Care Plan:</p>
        <p className="whitespace-pre-line">{blankMode ? '' : carePlanStatus}</p>
        <p className="font-bold mt-4">Next Steps:</p>
        <p className="whitespace-pre-line">{blankMode ? '' : nextSteps}</p>
      </div>

      {/* PROVIDER SIGNATURE */}
      <div className="mt-16 text-sm font-bold w-1/2">
        <div className="border-b border-black mb-2 h-16 flex items-end">
          {!blankMode && latestNote?.signatureUrl && (
            latestNote.signatureUrl.startsWith('data:image') ? (
              <img src={latestNote.signatureUrl} alt="Provider Signature" className="max-h-14 object-contain mb-1" />
            ) : (
              <span className="font-mono text-teal-800 text-xs italic mb-1">{latestNote.signatureUrl.replace('DIGITAL_SIG:', '')}</span>
            )
          )}
        </div>
        <p>{blankMode ? 'PROVIDER NAME' : (latestNote?.signedBy || providerName)}</p>
        <p>Provider Signature</p>
        <p className="mt-2 text-xs font-normal">Date Signed: {blankMode ? '' : signOffDate}</p>
      </div>

      {/* Footer / Pagination */}
      <div className="absolute bottom-4 right-8 font-mono text-[10px] print:hidden">
        PAGE {reportPage} OF 1
      </div>

    </div>
  );
};
