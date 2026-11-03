// src/components/packets/tpi/TpiProcedureForm.jsx
import React, { useState } from 'react';
import { EditableClinicalField } from '../EditableClinicalField';
import { AiAutoDraftToolbar } from '../common/AiAutoDraftToolbar';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { apiClinicalNoteService } from '../../../services/api/apiClinicalNoteService';
import { useUIStore } from '../../../store/uiStore';

const getMusclesTableData = (packetData, storage) => {
  if (storage?.musclesList && Array.isArray(storage.musclesList) && storage.musclesList.length > 0) {
    return storage.musclesList;
  }
  if (!packetData) return [];
  const list = packetData.musclesInjectedList || packetData.injectedMuscles || packetData.musclesTable;
  if (Array.isArray(list)) return list;
  return [];
};

export const TpiProcedureForm = ({ dos = '', readOnly = false, blankMode = false, packetData = null }) => {
  const [localVersion, setLocalVersion] = useState(0);
  const { addToast } = useUIStore ? useUIStore() : { addToast: () => {} };
  const serviceDates = packetData?.serviceDates || [];
  const activeDos = blankMode ? '' : (dos || (serviceDates.length > 0 ? serviceDates[0] : (packetData?.procedureDos || packetData?.serviceDate || '')));
  
  const patientNameVal = blankMode || !packetData ? '' : (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '');
  const docKey = activeDos ? `TPI_PROCEDURE_${activeDos}` : 'TPI_PROCEDURE';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  const signatureDateVal = blankMode || !packetData ? '' : (packetData.signatureDate || packetData.signedAt || packetData.dischargeDate || '');
  const providerNameVal = blankMode || !packetData ? '' : (packetData.operatingProviderName || packetData.referringProviderName || packetData.providerName || packetData.attendingProviderName || '');
  const savedName = (storage.providerName && !storage.providerName.startsWith('data:image')) ? storage.providerName : providerNameVal;
  const providerName = blankMode ? '' : savedName;

  const savedSig = storage.providerSignature || (storage.providerName && storage.providerName.startsWith('data:image') ? storage.providerName : '');
  const providerSigValue = blankMode ? '' : savedSig;

  const preOpDiagText = blankMode || !packetData ? '' : (storage.preOpDiagnosis || packetData.preOpDiagnosis || packetData.preOperativeDiagnosis || (packetData.diagnosisCodes && packetData.diagnosisCodes.length > 0 ? packetData.diagnosisCodes.join(', ') : ''));
  const medInjectedText = blankMode || !packetData ? '' : (storage.medicationInjected || packetData.medicationInjected || packetData.medicationsInjected || packetData.medication || '');
  const totalVolumeText = blankMode || !packetData ? '' : (storage.totalVolume || packetData.totalVolume || packetData.needlesUsed || packetData.volumeAndNeedles || '');
  const procedureDescText = blankMode || !packetData ? '' : (storage.procedureDescription || packetData.procedureDescription || packetData.procedureNotes || packetData.technique || '');

  const musclesList = blankMode ? [] : getMusclesTableData(packetData, storage);

  // 1-Click AI Auto-Draft for TPI Procedure
  const handleAutoDraftAi = async () => {
    if (!packetData || !packetData.id) return;
    
    try {
      const inputData = {
        patientName: patientNameVal,
        dos: activeDos || new Date().toLocaleDateString(),
        accidentDate: packetData.accidentDate || '',
        accidentType: packetData.accidentType || 'Motor Vehicle Collision',
        complaints: packetData.chiefComplaint || packetData.painDescription || 'Myofascial pain and localized muscle spasms',
        painLocations: packetData.selectedInjuryAreas || packetData.injuryBodyParts || 'Cervical, thoracic, lumbar regions',
        diagnosisCodes: packetData.diagnosisCodes || ['M79.1', 'S13.4', 'S33.5']
      };

      const res = await apiClinicalNoteService.generateAiDraft('TPI_PROCEDURE', inputData);
      
      let parsed = {};
      try {
        const text = res.draftText || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else parsed = { procedureDescription: text };
      } catch (e) {
        parsed = { procedureDescription: res.draftText };
      }

      const defaultMuscles = [
        { muscle: 'Trapezius', side: 'Bilateral', volume: '2.0 mL' },
        { muscle: 'Levator Scapulae', side: 'Left / Right', volume: '1.0 mL' },
        { muscle: 'Quadratus Lumborum', side: 'Bilateral', volume: '1.0 mL' }
      ];

      const newTpiProcDoc = {
        ...(packetData.clinicalDocStorage?.[docKey] || {}),
        preOpDiagnosis: parsed.preOpDiagnosis || preOpDiagText || 'Myofascial pain syndrome (M79.1), Cervical sprain/strain (S13.4), Lumbar muscle spasm (S33.5)',
        medicationInjected: parsed.medicationInjected || '1% Lidocaine (preservative-free), 4 mL total',
        totalVolume: parsed.totalVolume || '4 mL total volume, 25-gauge 1.5-inch needle',
        musclesList: Array.isArray(parsed.musclesInjected) && parsed.musclesInjected.length > 0 ? parsed.musclesInjected : defaultMuscles,
        procedureDescription: parsed.procedureDescription || procedureDescText
      };

      const currentStorage = packetData.clinicalDocStorage || {};
      const updatedStorage = {
        ...currentStorage,
        [docKey]: newTpiProcDoc
      };

      await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
      packetData.clinicalDocStorage = updatedStorage;

      if (addToast) addToast("AI TPI operative procedure report generated successfully!", "success");
      setLocalVersion(v => v + 1);
    } catch (err) {
      console.error('Failed to generate AI TPI procedure draft:', err);
      if (addToast) addToast(err.message || "Failed to generate AI draft", "error");
    }
  };

  const handleMuscleCellChange = async (index, field, value) => {
    if (readOnly || blankMode || !packetData?.id) return;
    const currentList = [...musclesList];
    while (currentList.length <= index) currentList.push({});
    currentList[index] = { ...currentList[index], [field]: value };
    
    try {
      const currentStorage = packetData.clinicalDocStorage || {};
      const docNamespace = currentStorage[docKey] || {};
      const updatedDoc = { ...docNamespace, musclesList: currentList };
      const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
      await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
      packetData.clinicalDocStorage = updatedStorage;
    } catch (err) {
      console.error('Failed to update muscle cell', err);
    }
  };

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      
      {/* Universal AI Auto-Draft Toolbar (Hidden on print) */}
      {!readOnly && !blankMode && packetData && (
        <AiAutoDraftToolbar
          title="AI TPI Procedure Scribe"
          badge="Operative Report"
          subtitle="Auto-synthesize operative technique, Lidocaine dosing & muscle injection sites from case record"
          hasExistingContent={Boolean(storage.procedureDescription || storage.preOpDiagnosis || storage.medicationInjected)}
          readOnly={readOnly || blankMode}
          onDraft={handleAutoDraftAi}
        />
      )}

      {/* Header */}
      <div className="border-b-2 border-[#722F37] pb-4 mb-6 text-center">
        <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight" style={{ fontFamily: 'serif' }}>FM TRIGGER POINT INJECTION PROCEDURE</h1>
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
          <EditableClinicalField 
            packetData={packetData}
            docKey={docKey}
            field="preOpDiagnosis"
            value={preOpDiagText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[40px]"
            className="border border-slate-300 p-2 text-slate-700 bg-slate-50 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Procedure Details */}
      <div className="mb-6">
        <h2 className="text-sm font-bold bg-slate-100 p-2 border border-slate-300 mb-3 uppercase">Procedure Details</h2>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono px-2">
          <div>
            <span className="font-bold block mb-1">Medication Injected:</span>
            <EditableClinicalField 
              packetData={packetData}
              docKey={docKey}
              field="medicationInjected"
              value={medInjectedText} 
              readOnly={readOnly || blankMode || !packetData}
              minHeightClass="min-h-[38px]"
              className="border border-slate-300 p-2 text-slate-700 bg-slate-50 focus:ring-amber-500"
            />
          </div>
          <div>
            <span className="font-bold block mb-1">Total Volume / Needles Used:</span>
            <EditableClinicalField 
              packetData={packetData}
              docKey={docKey}
              field="totalVolume"
              value={totalVolumeText} 
              readOnly={readOnly || blankMode || !packetData}
              minHeightClass="min-h-[38px]"
              className="border border-slate-300 p-2 text-slate-700 bg-slate-50 focus:ring-amber-500"
            />
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
                    <td 
                      contentEditable={!readOnly} 
                      suppressContentEditableWarning 
                      onBlur={(e) => handleMuscleCellChange(idx, 'muscle', e.currentTarget.textContent.trim())}
                      className="border border-slate-300 p-2 focus:bg-white cursor-text"
                    >
                      {blankMode ? '' : (item.muscle || item.name || '')}&nbsp;
                    </td>
                    <td 
                      contentEditable={!readOnly} 
                      suppressContentEditableWarning 
                      onBlur={(e) => handleMuscleCellChange(idx, 'side', e.currentTarget.textContent.trim())}
                      className="border border-slate-300 p-2 focus:bg-white cursor-text"
                    >
                      {blankMode ? '' : (item.side || '')}&nbsp;
                    </td>
                    <td 
                      contentEditable={!readOnly} 
                      suppressContentEditableWarning 
                      onBlur={(e) => handleMuscleCellChange(idx, 'volume', e.currentTarget.textContent.trim())}
                      className="border border-slate-300 p-2 focus:bg-white cursor-text"
                    >
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
          <EditableClinicalField 
            packetData={packetData}
            docKey={docKey}
            field="procedureDescription"
            value={procedureDescText} 
            readOnly={readOnly || blankMode || !packetData}
            minHeightClass="min-h-[100px]"
            className="border border-slate-300 p-2 text-slate-700 bg-slate-50 focus:ring-amber-500"
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
