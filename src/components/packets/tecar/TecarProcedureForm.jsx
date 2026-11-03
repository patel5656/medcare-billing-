// src/components/packets/tecar/TecarProcedureForm.jsx
import React, { useState } from 'react';
import { EditableClinicalField } from '../EditableClinicalField';
import { AiAutoDraftToolbar } from '../common/AiAutoDraftToolbar';
import { apiClinicalNoteService } from '../../../services/api/apiClinicalNoteService';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { useUIStore } from '../../../store/uiStore';

export const TecarProcedureForm = ({ dos = '', readOnly = false, blankMode = false, packetData = null, serviceLines = [] }) => {
  const [localVersion, setLocalVersion] = useState(0);
  const { addToast } = useUIStore ? useUIStore() : { addToast: () => {} };

  const serviceDates = packetData?.serviceDates || [];
  const activeDos = blankMode ? '' : (dos || (serviceDates.length > 0 ? serviceDates[0] : (packetData?.procedureDos || packetData?.tecarDos || packetData?.serviceDate || '')));
  
  const docKey = activeDos ? `TECAR_PROCEDURE_${activeDos}` : 'TECAR_PROCEDURE';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  const signatureDateVal = blankMode || !packetData ? '' : (packetData.signatureDate || packetData.signedAt || packetData.dischargeDate || '');
  const providerNameVal = blankMode || !packetData ? '' : (packetData.operatingProviderName || packetData.referringProviderName || packetData.providerName || packetData.attendingProviderName || '');
  const savedName = (storage.providerName && !storage.providerName.startsWith('data:image')) ? storage.providerName : providerNameVal;
  const providerName = blankMode ? '' : savedName;

  const savedSig = storage.providerSignature || (storage.providerName && storage.providerName.startsWith('data:image') ? storage.providerName : '');
  const providerSigValue = blankMode ? '' : savedSig;
  const patientNameVal = blankMode || !packetData ? '' : (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '');

  const diagnosisText = blankMode || !packetData ? '' : (storage.diagnosisText || packetData.diagnosisText || (packetData.diagnosisCodes && packetData.diagnosisCodes.length > 0 ? packetData.diagnosisCodes.join(', ') : ''));
  const anatomicalRegionText = blankMode || !packetData ? '' : (storage.anatomicalRegion || packetData.anatomicalRegion || packetData.treatmentArea || packetData.bodyPart || '');

  const cetElectrodeSize = blankMode || !packetData ? '' : (storage.cetElectrodeSize || packetData.cetElectrodeSize || packetData.cetSize || '');
  const cetPower = blankMode || !packetData ? '' : (storage.cetPower || packetData.cetPower || packetData.cetIntensity || '');
  const cetDuration = blankMode || !packetData ? '' : (storage.cetDuration || packetData.cetDuration || '');

  const retElectrodeSize = blankMode || !packetData ? '' : (storage.retElectrodeSize || packetData.retElectrodeSize || packetData.retSize || '');
  const retPower = blankMode || !packetData ? '' : (storage.retPower || packetData.retPower || packetData.retIntensity || '');
  const retDuration = blankMode || !packetData ? '' : (storage.retDuration || packetData.retDuration || '');

  const totalTimeText = blankMode || !packetData ? '' : (storage.totalTreatmentTime || packetData.totalTreatmentTime || packetData.totalTime || '');
  const clinicalNotesText = blankMode || !packetData ? '' : (storage.clinicalNotes || (typeof packetData.clinicalNotes === 'string' ? packetData.clinicalNotes : null) || packetData.patientResponse || packetData.procedureDescription || packetData.technique || '');

  // 1-Click AI Auto-Draft Generator for TECAR Procedure Log
  const handleAutoDraftAi = async () => {
    if (!packetData || !packetData.id) return;

    const diagVal = diagnosisText || (Array.isArray(packetData.diagnosisCodes) ? packetData.diagnosisCodes.join(', ') : 'M54.2 Cervicalgia, M54.50 Lumbago');
    const regionVal = anatomicalRegionText || (Array.isArray(packetData.selectedInjuryAreas) ? packetData.selectedInjuryAreas.join(', ') : (packetData.injuryBodyParts || 'Cervical & Lumbar Paraspinal Musculature'));

    const inputData = {
      patientName: patientNameVal,
      dos: activeDos || new Date().toLocaleDateString(),
      accidentDate: packetData.accidentDate || '',
      accidentType: packetData.accidentType || 'Motor Vehicle Collision',
      complaints: packetData.chiefComplaint || packetData.painDescription || 'Musculoskeletal hypertonicity following trauma',
      painLocations: packetData.selectedInjuryAreas || packetData.injuryBodyParts || regionVal,
      diagnosisCodes: packetData.diagnosisCodes || (diagVal ? [diagVal] : ['M54.50', 'M54.2']),
      compiledDocumentation: `PROCEDURE LOG: Capacitive and Resistive Energy Transfer (TECAR Therapy - CPT 97024).
DOS: ${activeDos || 'Current'}.
Anatomical Target: ${regionVal}.
Diagnoses: ${diagVal}.
Accident Context: ${packetData.accidentType || 'MVC'}.`
    };

    const res = await apiClinicalNoteService.generateAiDraft('DOCTOR_NOTE', inputData);
    let parsed = {};
    try {
      const text = res.draftText || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else parsed = { chiefComplaint: text };
    } catch (e) {
      parsed = { chiefComplaint: res.draftText };
    }

    const newTecarDoc = {
      ...(packetData.clinicalDocStorage?.[docKey] || {}),
      diagnosisText: diagVal,
      anatomicalRegion: regionVal,
      cetElectrodeSize: storage.cetElectrodeSize || '60mm Medium',
      cetPower: storage.cetPower || '45%',
      cetDuration: storage.cetDuration || '10 mins',
      retElectrodeSize: storage.retElectrodeSize || '70mm Large',
      retPower: storage.retPower || '40%',
      retDuration: storage.retDuration || '10 mins',
      totalTreatmentTime: storage.totalTreatmentTime || '20 mins',
      clinicalNotes: parsed.courseOfCare || parsed.treatmentsAdministered || `Patient received targeted TECAR therapy to ${regionVal}. Capacitive (CET) mode applied for superficial vascularization and deep resistive (RET) mode applied for deep fascial relaxation. Patient tolerated procedure well with immediate decrease in palpable muscle spasm and improved local tissue pliability.`
    };

    const currentStorage = packetData.clinicalDocStorage || {};
    const updatedStorage = {
      ...currentStorage,
      [docKey]: newTecarDoc
    };

    await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
    packetData.clinicalDocStorage = updatedStorage;

    if (addToast) addToast("AI TECAR procedure log generated successfully!", "success");
    setLocalVersion(v => v + 1);
  };

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      
      {/* Universal AI Auto-Draft Toolbar (Hidden on print) */}
      {!readOnly && !blankMode && packetData && (
        <AiAutoDraftToolbar
          title="AI TECAR Procedure Scribe"
          badge="CPT 97024"
          subtitle="Auto-synthesize TECAR parameters, anatomical region & clinical notes from patient record"
          hasExistingContent={Boolean(storage.clinicalNotes || storage.diagnosisText || storage.anatomicalRegion)}
          readOnly={readOnly || blankMode}
          onDraft={handleAutoDraftAi}
        />
      )}

      {/* Header */}
      <div className="border-b-2 border-[#722F37] pb-4 mb-6 text-center">
        <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight" style={{ fontFamily: 'serif' }}>FM TECAR THERAPY PROCEDURE LOG</h1>
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
            <EditableClinicalField 
              packetData={packetData}
              docKey={docKey}
              field="diagnosisText"
              value={diagnosisText} 
              readOnly={readOnly || blankMode || !packetData}
              minHeightClass="min-h-[40px]"
              className="border border-slate-300 p-2 text-slate-700 bg-slate-50 focus:ring-[#722F37]"
            />
          </div>
          <div>
            <span className="font-bold block mb-1">Anatomical Region:</span>
            <EditableClinicalField 
              packetData={packetData}
              docKey={docKey}
              field="anatomicalRegion"
              value={anatomicalRegionText} 
              readOnly={readOnly || blankMode || !packetData}
              minHeightClass="min-h-[40px]"
              className="border border-slate-300 p-2 text-slate-700 bg-slate-50 focus:ring-[#722F37]"
            />
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
                <td className="border border-slate-300 p-0">
                  <EditableClinicalField packetData={packetData} docKey={docKey} field="cetElectrodeSize" value={cetElectrodeSize} readOnly={readOnly || blankMode} inputType="input" className="w-full h-full p-2" />
                </td>
                <td className="border border-slate-300 p-0">
                  <EditableClinicalField packetData={packetData} docKey={docKey} field="cetPower" value={cetPower} readOnly={readOnly || blankMode} inputType="input" className="w-full h-full p-2" />
                </td>
                <td className="border border-slate-300 p-0">
                  <EditableClinicalField packetData={packetData} docKey={docKey} field="cetDuration" value={cetDuration} readOnly={readOnly || blankMode} inputType="input" className="w-full h-full p-2" />
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Resistive (RET)</td>
                <td className="border border-slate-300 p-0">
                  <EditableClinicalField packetData={packetData} docKey={docKey} field="retElectrodeSize" value={retElectrodeSize} readOnly={readOnly || blankMode} inputType="input" className="w-full h-full p-2" />
                </td>
                <td className="border border-slate-300 p-0">
                  <EditableClinicalField packetData={packetData} docKey={docKey} field="retPower" value={retPower} readOnly={readOnly || blankMode} inputType="input" className="w-full h-full p-2" />
                </td>
                <td className="border border-slate-300 p-0">
                  <EditableClinicalField packetData={packetData} docKey={docKey} field="retDuration" value={retDuration} readOnly={readOnly || blankMode} inputType="input" className="w-full h-full p-2" />
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="border border-slate-300 p-2 text-right" colSpan="3">Total Treatment Time:</td>
                <td className="border border-slate-300 p-0">
                  <EditableClinicalField packetData={packetData} docKey={docKey} field="totalTreatmentTime" value={totalTimeText} readOnly={readOnly || blankMode} inputType="input" className="w-full h-full p-2 bg-transparent" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Technique */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">Clinical Notes &amp; Patient Response</h2>
        <div className="text-xs font-mono px-2">
          <EditableClinicalField 
            packetData={packetData}
            docKey={docKey}
            field="clinicalNotes"
            value={clinicalNotesText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[100px]"
            className="border border-slate-300 p-2 text-slate-700 bg-slate-50 focus:ring-[#722F37]"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 left-14 right-14 border-t border-slate-300 pt-4 text-xs font-mono flex justify-between items-end">
        <div>
          <div className="border-b border-slate-400 pb-1 mb-1 min-h-[50px] flex flex-col justify-end w-64">
            <EditableClinicalField
              packetData={packetData}
              docKey={docKey}
              field="providerSignature"
              value={providerSigValue}
              placeholder="Click to Sign"
              readOnly={readOnly || blankMode}
              inputType="signature"
              className="h-8 max-w-[240px]"
            />
            <EditableClinicalField
              packetData={packetData}
              docKey={docKey}
              field="providerName"
              value={providerName}
              placeholder="Operating Provider Name"
              readOnly={readOnly || blankMode}
              inputType="input"
              className="w-full font-mono text-xs text-slate-900 font-bold bg-transparent hover:bg-slate-200/50 focus:bg-white rounded px-1 outline-none mt-0.5"
            />
          </div>
          <p className="text-slate-600">Operating Provider Signature</p>
        </div>
        <div>
          <div className="border-b border-slate-400 pb-1 mb-1 min-h-[50px] flex flex-col justify-end w-40">
            <EditableClinicalField
              packetData={packetData}
              docKey={docKey}
              field="signatureDate"
              value={blankMode ? '' : (storage.signatureDate !== undefined ? storage.signatureDate : signatureDateVal)}
              placeholder="YYYY-MM-DD"
              readOnly={readOnly || blankMode}
              inputType="input"
              className="w-full font-mono text-xs text-slate-900 bg-transparent hover:bg-slate-200/50 focus:bg-white rounded px-1 outline-none"
            />
          </div>
          <p className="text-slate-600">Date</p>
        </div>
      </div>
    </div>
  );
};
