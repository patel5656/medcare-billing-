// src/components/packets/tpi/TpiProcedureForm.jsx
import React from 'react';

const getMusclesTableData = (packetData) => {
  if (!packetData) return [];
  const list = packetData.musclesInjectedList || packetData.injectedMuscles || packetData.musclesTable;
  if (Array.isArray(list)) return list;
  return [];
};

export const TpiProcedureForm = ({ dos = '', readOnly = false, blankMode = false, packetData = null, serviceLines = [] }) => {
  const patientNameVal = blankMode || !packetData ? '' : (packetData.patientName || '');
  
  const serviceDates = serviceLines && serviceLines.length > 0
    ? [...new Set(serviceLines.map(l => l.dos || l.dateOfService).filter(Boolean))]
    : [];
  const activeDos = blankMode ? '' : (dos || (serviceDates.length > 0 ? serviceDates[0] : (packetData?.procedureDos || packetData?.serviceDate || '')));

  const signatureDateVal = blankMode || !packetData ? '' : (packetData.signatureDate || packetData.signedAt || packetData.dischargeDate || '');
  const providerNameVal = blankMode || !packetData ? '' : (packetData.operatingProviderName || packetData.referringProviderName || packetData.providerName || packetData.attendingProviderName || '');

  const preOpDiagText = blankMode || !packetData ? '' : (packetData.preOpDiagnosis || packetData.preOperativeDiagnosis || (packetData.diagnosisCodes && packetData.diagnosisCodes.length > 0 ? packetData.diagnosisCodes.join(', ') : ''));
  const medInjectedText = blankMode || !packetData ? '' : (packetData.medicationInjected || packetData.medicationsInjected || packetData.medication || '');
  const totalVolumeText = blankMode || !packetData ? '' : (packetData.totalVolume || packetData.needlesUsed || packetData.volumeAndNeedles || '');
  const procedureDescText = blankMode || !packetData ? '' : (packetData.procedureDescription || packetData.procedureNotes || packetData.technique || '');

  const musclesList = blankMode ? [] : getMusclesTableData(packetData);

  return (
    <div className="relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '100%', maxWidth: '850px', minHeight: '1100px', padding: '48px 56px' }}>
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center">
        <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight" style={{ fontFamily: 'serif' }}>TRIGGER POINT INJECTION PROCEDURE</h1>
        <p className="text-xs font-bold text-slate-600 mt-1">OPERATIVE REPORT</p>
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-6">
        <div className="flex border-b border-slate-300 pb-1">
          <span className="font-bold w-24">Patient Name:</span>
          <span className="flex-1 text-slate-700">{patientNameVal}&nbsp;</span>
        </div>
        <div className="flex border-b border-slate-300 pb-1">
          <span className="font-bold w-24">Date of Svc:</span>
          <span className="flex-1 text-slate-700">{activeDos}&nbsp;</span>
        </div>
      </div>

      {/* Pre-Op */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">Pre-Operative Diagnosis</h2>
        <div className="text-xs font-mono px-2">
          <div
            contentEditable={!readOnly}
            suppressContentEditableWarning
            className="text-slate-700 border border-slate-300 p-2 min-h-[40px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-text"
          >
            {preOpDiagText}
          </div>
        </div>
      </div>

      {/* Procedure Details */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">Procedure Details</h2>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono px-2">
          <div>
            <span className="font-bold block mb-1">Medication Injected:</span>
            <div
              contentEditable={!readOnly}
              suppressContentEditableWarning
              className="text-slate-700 border border-slate-300 p-2 min-h-[38px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-text"
            >
              {medInjectedText}
            </div>
          </div>
          <div>
            <span className="font-bold block mb-1">Total Volume / Needles Used:</span>
            <div
              contentEditable={!readOnly}
              suppressContentEditableWarning
              className="text-slate-700 border border-slate-300 p-2 min-h-[38px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-text"
            >
              {totalVolumeText}
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs font-mono px-2">
          <span className="font-bold block mb-1">Muscles Injected (CPT 20552/20553):</span>
          <table className="w-full border-collapse border border-slate-300 text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-300 p-2 w-1/2">Muscle Name</th>
                <th className="border border-slate-300 p-2 w-1/4">Side</th>
                <th className="border border-slate-300 p-2 w-1/4">Volume (mL)</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, idx) => {
                const item = musclesList[idx] || {};
                return (
                  <tr key={idx}>
                    <td contentEditable={!readOnly} suppressContentEditableWarning className="border border-slate-300 p-2 focus:bg-white cursor-text">
                      {blankMode ? '' : (item.muscle || item.name || '')}&nbsp;
                    </td>
                    <td contentEditable={!readOnly} suppressContentEditableWarning className="border border-slate-300 p-2 focus:bg-white cursor-text">
                      {blankMode ? '' : (item.side || '')}&nbsp;
                    </td>
                    <td contentEditable={!readOnly} suppressContentEditableWarning className="border border-slate-300 p-2 focus:bg-white cursor-text">
                      {blankMode ? '' : (item.volume || '')}&nbsp;
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technique */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">Procedure Description</h2>
        <div className="text-xs font-mono px-2">
          <div
            contentEditable={!readOnly}
            suppressContentEditableWarning
            className="text-slate-700 border border-slate-300 p-2 min-h-[100px] bg-slate-50 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-text"
          >
            {procedureDescText}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 left-14 right-14 border-t border-slate-300 pt-4 text-xs font-mono flex justify-between">
        <div>
          <div className="border-b border-slate-400 pb-1 mb-1 w-48 font-bold">{providerNameVal}&nbsp;</div>
          <p className="text-slate-600">Operating Provider Signature</p>
        </div>
        <div>
          <div className="border-b border-slate-400 pb-1 mb-1 w-32">{signatureDateVal}&nbsp;</div>
          <p className="text-slate-600">Date</p>
        </div>
      </div>
    </div>
  );
};
