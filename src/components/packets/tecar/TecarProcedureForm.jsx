// src/components/packets/tecar/TecarProcedureForm.jsx
import React from 'react';

export const TecarProcedureForm = ({ dos = '', readOnly = false, blankMode = false, packetData = null, serviceLines = [] }) => {
  const patientNameVal = blankMode || !packetData ? '' : (packetData.patientName || '');
  
  const serviceDates = serviceLines && serviceLines.length > 0
    ? [...new Set(serviceLines.map(l => l.dos || l.dateOfService).filter(Boolean))]
    : [];
  const activeDos = blankMode ? '' : (dos || (serviceDates.length > 0 ? serviceDates[0] : (packetData?.procedureDos || packetData?.tecarDos || packetData?.serviceDate || '')));

  const signatureDateVal = blankMode || !packetData ? '' : (packetData.signatureDate || packetData.signedAt || packetData.dischargeDate || '');
  const providerNameVal = blankMode || !packetData ? '' : (packetData.operatingProviderName || packetData.referringProviderName || packetData.providerName || packetData.attendingProviderName || '');

  const diagnosisText = blankMode || !packetData ? '' : (packetData.diagnosisText || (packetData.diagnosisCodes && packetData.diagnosisCodes.length > 0 ? packetData.diagnosisCodes.join(', ') : ''));
  const anatomicalRegionText = blankMode || !packetData ? '' : (packetData.anatomicalRegion || packetData.treatmentArea || packetData.bodyPart || '');

  const cetElectrodeSize = blankMode || !packetData ? '' : (packetData.cetElectrodeSize || packetData.cetSize || '');
  const cetPower = blankMode || !packetData ? '' : (packetData.cetPower || packetData.cetIntensity || '');
  const cetDuration = blankMode || !packetData ? '' : (packetData.cetDuration || '');

  const retElectrodeSize = blankMode || !packetData ? '' : (packetData.retElectrodeSize || packetData.retSize || '');
  const retPower = blankMode || !packetData ? '' : (packetData.retPower || packetData.retIntensity || '');
  const retDuration = blankMode || !packetData ? '' : (packetData.retDuration || '');

  const totalTimeText = blankMode || !packetData ? '' : (packetData.totalTreatmentTime || packetData.totalTime || '');
  const clinicalNotesText = blankMode || !packetData ? '' : ((typeof packetData.clinicalNotes === 'string' ? packetData.clinicalNotes : null) || packetData.patientResponse || packetData.procedureDescription || packetData.technique || '');

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center">
        <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight" style={{ fontFamily: 'serif' }}>TECAR THERAPY PROCEDURE LOG</h1>
        <p className="text-xs font-bold text-slate-600 mt-1">CAPACITIVE AND RESISTIVE ENERGY TRANSFER</p>
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
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">Treatment Area &amp; Diagnosis</h2>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono px-2">
          <div>
            <span className="font-bold block mb-1">Diagnosis (ICD-10):</span>
            <div className="text-slate-700 border border-slate-300 p-2 min-h-[40px] bg-slate-50">
              {diagnosisText}
            </div>
          </div>
          <div>
            <span className="font-bold block mb-1">Anatomical Region:</span>
            <div className="text-slate-700 border border-slate-300 p-2 min-h-[40px] bg-slate-50">
              {anatomicalRegionText}
            </div>
          </div>
        </div>
      </div>

      {/* Procedure Details */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">TECAR Parameters (CPT 97024)</h2>
        
        <div className="text-xs font-mono px-2">
          <table className="w-full border-collapse border border-slate-300 text-left mb-4">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-300 p-2">Mode</th>
                <th className="border border-slate-300 p-2">Electrode Size</th>
                <th className="border border-slate-300 p-2">Power (%) / Intensity</th>
                <th className="border border-slate-300 p-2">Duration (mins)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Capacitive (CET)</td>
                <td className="border border-slate-300 p-2">{cetElectrodeSize}&nbsp;</td>
                <td className="border border-slate-300 p-2">{cetPower}&nbsp;</td>
                <td className="border border-slate-300 p-2">{cetDuration}&nbsp;</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Resistive (RET)</td>
                <td className="border border-slate-300 p-2">{retElectrodeSize}&nbsp;</td>
                <td className="border border-slate-300 p-2">{retPower}&nbsp;</td>
                <td className="border border-slate-300 p-2">{retDuration}&nbsp;</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-slate-300 p-2 text-right" colSpan="3">Total Treatment Time:</td>
                <td className="border border-slate-300 p-2">{totalTimeText}&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Technique */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">Clinical Notes &amp; Patient Response</h2>
        <div className="text-xs font-mono px-2">
          <div className="text-slate-700 border border-slate-300 p-2 min-h-[100px] bg-slate-50 leading-relaxed">
            {clinicalNotesText}
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
