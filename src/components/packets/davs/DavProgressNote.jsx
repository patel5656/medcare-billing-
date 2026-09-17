// src/components/packets/davs/DavProgressNote.jsx
import React from 'react';

export const DavProgressNote = ({ notePage = 1, blankMode = false, packetData = null, dos = '', serviceLines = [] }) => {
  const patientName = blankMode || !packetData 
    ? '' 
    : (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '');

  const getNoteDos = () => {
    if (blankMode || !packetData) return '';
    if (dos) return dos;
    if (packetData.progressNoteDos) return packetData.progressNoteDos;
    if (packetData.progressNoteDate) return packetData.progressNoteDate;
    if (packetData.evaluationDate) return packetData.evaluationDate;
    if (packetData.assessmentDate) return packetData.assessmentDate;
    if (packetData.evalDate) return packetData.evalDate;
    if (packetData.clinicalNoteDate) return packetData.clinicalNoteDate;
    if (packetData.progressNote?.dos) return packetData.progressNote.dos;
    if (packetData.progressNote?.date) return packetData.progressNote.date;
    return '';
  };

  const noteDos = getNoteDos();

  const progressStatus = blankMode || !packetData 
    ? '' 
    : (packetData.progressStatus || packetData.clinicalProgressStatus || packetData.progressNoteStatus || packetData.progressNote?.progressStatus || packetData.progressNote?.status || '');

  const subjectiveText = blankMode || !packetData 
    ? '' 
    : (packetData.subjectiveProgress || packetData.subjectiveComplaints || packetData.soapSubjective || packetData.subjective || packetData.progressNote?.subjective || '');

  const objectiveText = blankMode || !packetData 
    ? '' 
    : (packetData.objectiveEvaluation || packetData.objectiveClinical || packetData.soapObjective || packetData.objective || packetData.progressNote?.objective || '');

  const planText = blankMode || !packetData 
    ? '' 
    : (packetData.planAndRecommendations || packetData.planOfCare || packetData.soapPlan || packetData.plan || packetData.progressNote?.plan || '');

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      <div>
        <div className="flex justify-between items-start border-b border-slate-300 pb-4">
          <div>
            <h1 className="text-lg font-black text-teal-800 uppercase italic">DAV'S ANATOMY</h1>
            <p className="text-[10px] text-slate-600">CLINICAL PROGRESS EVALUATION NOTE</p>
          </div>
          <div className="text-right font-mono text-[10px]">
            <p>PAGE {notePage} OF 2</p>
            <p>DOS: {noteDos}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 border border-slate-200 text-xs font-mono grid grid-cols-2 gap-2 mt-6">
          <div>PATIENT: <strong>{patientName}</strong></div>
          <div>PROGRESS STATUS: <strong>{progressStatus}</strong></div>
        </div>
      </div>

      <div className="flex-1 space-y-6 text-xs leading-relaxed text-slate-800 flex flex-col justify-start">
        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">SUBJECTIVE PROGRESS & COMPLAINTS</h2>
          <p className="min-h-[2.5rem] whitespace-pre-wrap mt-2">{subjectiveText}</p>
        </div>

        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">OBJECTIVE CLINICAL EVALUATION</h2>
          <p className="min-h-[2.5rem] whitespace-pre-wrap mt-2">{objectiveText}</p>
        </div>

        <div>
          <h2 className="font-bold border-b border-slate-200 pb-1 text-slate-900">PLAN & RECOMMENDATIONS</h2>
          <p className="min-h-[2.5rem] whitespace-pre-wrap mt-2">{planText}</p>
        </div>
      </div>
    </div>
  );
};

