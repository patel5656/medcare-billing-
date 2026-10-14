import React, { useState, useEffect } from 'react';
import bodyImage from '../../../assets/body_image.png';
import { EditableClinicalField } from '../EditableClinicalField';
import { AiAutoDraftToolbar } from '../common/AiAutoDraftToolbar';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { apiClinicalNoteService } from '../../../services/api/apiClinicalNoteService';
import { useUIStore } from '../../../store/uiStore';
import fmLogo from '../../../assets/fm-logo.jpeg';

/**
 * DAV'S ESWT Procedure Form (Radial Device) - 3-Page Structure
 */
export const DavEswtProcedureForm = ({ 
  dos = '', 
  pageIndex = 0,
  formPage = 1,
  readOnly = false, 
  blankMode = false, 
  packetData = null,
  procedureData = null,
  serviceLines = []
}) => {
  const [localVersion, setLocalVersion] = useState(0);
  const { addToast } = useUIStore ? useUIStore() : { addToast: () => {} };

  const isShow = !blankMode && packetData;
  const proc = procedureData || packetData?.procedures?.[pageIndex] || {};
  const storage = packetData?.clinicalDocStorage?.[`DAV_ESWT_${pageIndex}`] || {};

  const notes = isShow && Array.isArray(packetData?.clinicalNotes) ? packetData.clinicalNotes : [];
  const davsNote = notes.find(n => {
    if (!n) return false;
    const t = (n.type || n.noteType || '').toUpperCase();
    const p = (n.providerId || '').toLowerCase();
    const title = (n.title || '').toUpperCase();
    return t === 'DAVS_ESWT' || t === 'DAVS' || p === 'prov-davs' || title.includes('DAV');
  });
  const noteContent = davsNote ? (typeof davsNote.content === 'string' ? (() => { try { return JSON.parse(davsNote.content); } catch (e) { return {}; } })() : (davsNote.content || {})) : {};

  const getProcedureDos = () => {
    if (!isShow) return '';
    if (proc.dos || proc.dateOfService) return proc.dos || proc.dateOfService;
    if (packetData?.procedures?.[pageIndex]?.dos || packetData?.procedures?.[pageIndex]?.dateOfService) {
      return packetData.procedures[pageIndex].dos || packetData.procedures[pageIndex].dateOfService;
    }
    if (noteContent?.dos || noteContent?.dateOfService || noteContent?.procedureDos) {
      return noteContent.dos || noteContent.dateOfService || noteContent.procedureDos;
    }

    const lines = (serviceLines && serviceLines.length > 0)
      ? serviceLines
      : (packetData?.serviceLines || packetData?.items || []);

    if (Array.isArray(lines) && lines.length > 0) {
      const uniqueDates = Array.from(new Set(
        lines.map(l => l.dos || l.dateOfService || l.date).filter(Boolean)
      ));
      if (pageIndex !== undefined && pageIndex !== null && uniqueDates[pageIndex]) {
        return uniqueDates[pageIndex];
      }
      if (uniqueDates[0]) return uniqueDates[0];
    }

    if (dos) return dos;

    return '';
  };

  const patientName = isShow ? (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.middleName ? packetData.patient.middleName + ' ' : ''}${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '') : '';
  const dob = isShow ? (packetData.patient?.dob || packetData.patientDob || packetData.dob || '') : '';
  const sex = isShow ? (packetData.patient?.sex || packetData.patientSex || packetData.sex || '') : '';
  const procDate = getProcedureDos();

  const rawAllergies = isShow ? (
    proc.allergies || 
    proc.knownAllergies || 
    noteContent.allergies ||
    noteContent.knownAllergies ||
    packetData?.allergies || 
    packetData?.knownAllergies || 
    packetData?.patient?.knownAllergies || 
    packetData?.patient?.allergies || 
    ''
  ) : '';
  const allergies = storage.allergies || (Array.isArray(rawAllergies) ? rawAllergies.join(', ') : rawAllergies);
  const bp = storage.bp || (isShow ? (proc.bp || noteContent.bp || packetData.vitals?.bp || packetData.bp || '') : '');
  const hr = storage.hr || (isShow ? (proc.hr || noteContent.hr || packetData.vitals?.hr || packetData.hr || '') : '');
  const ptHx = storage.ptHx || (isShow ? (proc.ptHx || proc.history || noteContent.ptHx || noteContent.history || packetData?.ptHx || packetData?.history || '') : '');

  const nerveBlock = storage.nerveBlock || (isShow ? (proc.nerveBlock || noteContent.nerveBlock || packetData.nerveBlock || '') : '');
  const treatmentAreas = isShow ? (proc.treatmentAreas || proc.treatmentArea || proc.treatmentTargetAreas || noteContent.treatmentAreas || noteContent.treatmentArea || noteContent.treatmentTargetAreas || packetData.treatmentAreas || packetData.treatmentArea || '') : '';
  const barSetting = storage.barSetting || (isShow ? (proc.barSetting || proc.bar || noteContent.barSetting || noteContent.bar || packetData.barSetting || packetData.bar || '') : '');
  const hzSetting = storage.hzSetting || (isShow ? (proc.hzSetting || proc.hz || noteContent.hzSetting || noteContent.hz || packetData.hzSetting || packetData.hz || '') : '');
  const dose = storage.dose || (isShow ? (proc.dose || noteContent.dose || packetData.dose || '') : '');
  const totalWaves = storage.totalWaves || (isShow ? (proc.totalWaves || proc.total || proc.totalWavesDelivered || noteContent.totalWaves || noteContent.total || noteContent.totalWavesDelivered || packetData.totalWaves || packetData.total || '') : '');
  const bltCream = storage.bltCream || (isShow ? (proc.bltCream || noteContent.bltCream || packetData.bltCream || '') : '');

  const docKey = `DAV_ESWT_${pageIndex}`;
  const checklist = isShow ? (proc.checklist || proc.findingsChecklist || packetData.eswtChecklist || {}) : {};
  const [localChecklist, setLocalChecklist] = useState(storage.checklist || {});

  useEffect(() => {
    if (storage.checklist) {
      setLocalChecklist(storage.checklist);
    }
  }, [storage.checklist]);

  const isChecked = (key) => {
    if (!isShow) return false;
    if (localChecklist[key] !== undefined) return Boolean(localChecklist[key]);
    if (Array.isArray(checklist)) return checklist.includes(key);
    return Boolean(checklist[key]);
  };

  const toggleCheck = async (key) => {
    if (readOnly || blankMode) return;
    const currentVal = isChecked(key);
    const updated = { ...localChecklist, [key]: !currentVal };
    setLocalChecklist(updated);

    if (packetData && packetData.id) {
      try {
        const currentStorage = packetData.clinicalDocStorage || {};
        const docNamespace = currentStorage[docKey] || {};
        const updatedDoc = { ...docNamespace, checklist: updated };
        const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
        await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
        packetData.clinicalDocStorage = updatedStorage;
      } catch (err) {
        console.error(`Failed to toggle checklist item ${key}`, err);
      }
    }
  };

  const defaultProvName = proc.providerName || proc.author || davsNote?.author || davsNote?.signedBy || packetData?.renderingProviderName || packetData?.providerName || packetData?.attendingProviderName || '';
  const savedName = (storage.providerName && !storage.providerName.startsWith('data:image')) ? storage.providerName : defaultProvName;
  const providerName = !isShow ? '' : savedName;

  const savedSig = storage.providerSignature || (storage.providerName && storage.providerName.startsWith('data:image') ? storage.providerName : (proc.providerSignature || ''));
  const providerSigValue = !isShow ? '' : savedSig;
  const sigDate = isShow ? (proc.signatureDate || proc.signedAt || proc.dateSigned || davsNote?.date || davsNote?.signedAt || noteContent?.signatureDate || packetData?.signatureDate || packetData?.signedAt || packetData?.dateSigned || '') : '';

  const currentInternalPage = formPage || (pageIndex + 1);

  const getInjuryMarks = () => {
    if (!isShow) return [];
    const injuryAreas = packetData?.selectedInjuryAreas || packetData?.patient?.selectedInjuryAreas || [];
    const areas = Array.isArray(injuryAreas) ? injuryAreas : [];
    
    const marks = [];
    const addedMarks = new Set();

    const addMark = (markId, top, left) => {
      if (addedMarks.has(markId)) return;
      addedMarks.add(markId);
      marks.push(
        <div
          key={markId}
          className="treatment-checkbox absolute flex items-center justify-center pointer-events-none"
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: '2.6%',
            height: '2.4%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <svg
            viewBox="0 0 16 16"
            className="w-full h-full text-[#722F37] stroke-current fill-none select-none drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.8)]"
            style={{ strokeWidth: 2.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}
          >
            <polyline points="2.8 8.2 6.4 12.2 13.5 3.8" />
          </svg>
        </div>
      );
    };

    const hasArea = (...keywords) => {
      return areas.some(a => {
        if (typeof a !== 'string') return false;
        const lower = a.toLowerCase();
        return keywords.some(k => lower.includes(k.toLowerCase()));
      });
    };

    if (hasArea('Shoulder')) {
      addMark('l-shoulder', 23.88, 21.75);
      addMark('r-shoulder', 21.99, 93.53);
    }
    if (hasArea('Lower Back', 'Lumbar', 'Low Back')) {
      addMark('l-lower-back', 41.29, 18.60);
    }
    if (hasArea('Neck', 'Cervical')) {
      addMark('l-neck', 17.52, 21.75);
    }
    if (hasArea('Knee')) {
      addMark('l-knee', 62.57, 18.81);
      addMark('r-knee', 63.78, 94.12);
    }
    if (hasArea('Mid Back', 'Upper Back', 'Thoracic')) {
      addMark('l-upper-back', 31.60, 21.75);
    }
    if (hasArea('Headache', 'Concussion')) {
      addMark('r-head', 13.29, 86.44);
    }
    if (hasArea('Whiplash', 'Myofascial')) {
      addMark('l-neck', 17.52, 21.75);
      addMark('l-upper-back', 31.60, 21.75);
    }
    if (hasArea('Anxiety', 'PTSD')) {
      addMark('r-head', 13.29, 86.44);
    }
    if (hasArea('Hip / Glute', 'Glute')) {
      addMark('r-hip-glute', 51.82, 94.25);
    } else if (hasArea('Hip')) {
      addMark('l-hip', 48.94, 18.01);
    }
    if (hasArea('Ankle')) {
      addMark('l-ankle', 77.86, 18.77);
      addMark('r-ankle', 78.69, 94.08);
    }
    if (hasArea('Foot')) {
      addMark('l-foot', 83.76, 18.77);
      addMark('r-foot', 84.44, 94.00);
    }
    if (hasArea('Elbow')) {
      addMark('r-elbow', 32.55, 93.53);
    }
    if (hasArea('Wrist')) {
      addMark('r-wrist', 39.74, 93.53);
    }
    if (hasArea('Hand')) {
      addMark('r-hand', 45.72, 93.53);
    }
    if (hasArea('Thigh')) {
      addMark('r-thigh', 57.91, 94.12);
    }
    if (hasArea('Calf')) {
      addMark('r-calf', 70.97, 94.12);
    }

    if (hasArea('Other')) {
      const specifyText = packetData?.otherInjuryAreaSpecify || packetData?.patient?.otherInjuryAreaSpecify || '';
      if (specifyText) {
        marks.push(
          <span 
            key="other-specify" 
            className="absolute text-[#722F37] font-bold text-[10px] md:text-xs z-10 whitespace-nowrap uppercase transform -translate-y-1/2" 
            style={{ top: '91.8%', left: '47%' }}
          >
            {specifyText}
          </span>
        );
      }
    }

    return marks;
  };

  const anatomicalMarks = getInjuryMarks();

  // 1-Click AI Auto-Draft Generator for ESWT Shockwave Procedure Form
  const handleAutoDraftAi = async () => {
    if (!packetData || !packetData.id) return;

    const areaText = treatmentAreas || (Array.isArray(packetData.selectedInjuryAreas) ? packetData.selectedInjuryAreas.join(', ') : (packetData.injuryBodyParts || 'Cervical & Lumbar Spine'));

    const inputData = {
      patientName,
      dos: procDate || new Date().toLocaleDateString(),
      accidentDate: packetData.accidentDate || '',
      accidentType: packetData.accidentType || 'Motor Vehicle Collision',
      complaints: packetData.chiefComplaint || packetData.painDescription || 'Soft tissue inflammation and myofascial trigger points',
      painLocations: areaText,
      diagnosisCodes: packetData.diagnosisCodes || ['M54.50', 'M54.2'],
      compiledDocumentation: `PROCEDURE LOG: Extracorporeal Shockwave Therapy (ESWT Radial Device - CPT 0295T / 97039).
DOS: ${procDate || 'Current'}.
Treatment Area: ${areaText}.
Allergies: ${allergies || 'NKDA'}.
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

    const newEswtDoc = {
      ...(packetData.clinicalDocStorage?.[docKey] || {}),
      ptHx: storage.ptHx || (packetData.accidentType ? `MVA - ${packetData.accidentType}` : 'Auto accident injury'),
      treatmentAreas: areaText,
      barSetting: storage.barSetting || '2.0 - 2.5 bar',
      hzSetting: storage.hzSetting || '15 Hz',
      dose: storage.dose || '0.16 mJ/mm²',
      totalWaves: storage.totalWaves || '2,500 pulses',
      bltCream: storage.bltCream || 'Topical acoustic coupling gel applied'
    };

    const currentStorage = packetData.clinicalDocStorage || {};
    const updatedStorage = {
      ...currentStorage,
      [docKey]: newEswtDoc
    };

    await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
    packetData.clinicalDocStorage = updatedStorage;

    if (addToast) addToast("AI Shockwave ESWT procedure log generated successfully!", "success");
    setLocalVersion(v => v + 1);
  };

  return (
    <div
      className="relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-4 print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:shadow-none print:border-none"
      style={{ width: '100%', maxWidth: '850px', minHeight: '1100px' }}
    >
      
      {/* Universal AI Auto-Draft Toolbar (Hidden on print) */}
      {!readOnly && !blankMode && packetData && (
        <AiAutoDraftToolbar
          title="AI Shockwave (ESWT) Scribe"
          badge="CPT 0295T / 97039"
          subtitle="Auto-synthesize ESWT parameters, waves, treatment target & clinical response"
          hasExistingContent={Boolean(storage.treatmentAreas || storage.totalWaves || storage.barSetting)}
          readOnly={readOnly || blankMode}
          onDraft={handleAutoDraftAi}
        />
      )}

      {/* Top Header & Internal Page Number */}
      <div className="flex justify-between items-center border-b-2 border-[#722F37] pb-3 mb-2">
        <div className="flex items-center gap-3">
          <img src={fmLogo} alt="FM Dav’s Anatomy" className="h-12 w-auto object-contain flex-shrink-0 mix-blend-multiply" />
          <div>
            <h1 className="text-xl font-black uppercase text-[#722F37] tracking-tight">FM DAV’S ANATOMY</h1>
            <h2 className="text-xs font-bold uppercase text-[#722F37] tracking-wider">ESWT PROCEDURE FORM (RADIAL DEVICE)</h2>
          </div>
        </div>
        <div className="text-right font-mono text-[10px] text-slate-500">
          <p>PAGE {currentInternalPage} OF 3</p>
        </div>
      </div>

      {/* Demographics Row */}
      <div className="grid grid-cols-4 gap-2 text-xs font-mono border-b border-slate-300 pb-2">
        <div><span>Name:</span> <strong className="text-slate-900 border-b border-slate-400 px-1">{patientName}</strong></div>
        <div><span>DOB:</span> <strong className="text-slate-900 border-b border-slate-400 px-1">{dob}</strong></div>
        <div><span>SEX:</span> <strong className="text-slate-900 border-b border-slate-400 px-1">{sex}</strong></div>
        <div><span>DATE:</span> <strong className="text-slate-900 border-b border-slate-400 px-1">{procDate}</strong></div>
      </div>

      {/* Intro Consent & Vitals */}
      <div className="space-y-2 text-xs font-serif">
        <p className="text-slate-800 italic">
          Intro: Patient presents for extracorporeal shockwave treatment. The patient has been advised of the risks and the benefits of the procedure and has signed consent.
        </p>

        <div className="flex justify-between items-center text-xs py-1 border-b border-slate-300 gap-2">
          <div className="flex-1 flex items-center"><strong>ALLERGIES:</strong> <EditableClinicalField packetData={packetData} docKey={`DAV_ESWT_${pageIndex}`} field="allergies" value={allergies} readOnly={readOnly || blankMode} inputType="input" className="ml-1 w-full border-b border-dashed border-slate-400 font-mono" /></div>
          <div className="flex items-center"><strong>BP:</strong> <EditableClinicalField packetData={packetData} docKey={`DAV_ESWT_${pageIndex}`} field="bp" value={bp} readOnly={readOnly || blankMode} inputType="input" className="ml-1 w-20 border-b border-dashed border-slate-400 font-mono text-center" /></div>
          <div className="flex items-center"><strong>HR:</strong> <EditableClinicalField packetData={packetData} docKey={`DAV_ESWT_${pageIndex}`} field="hr" value={hr} readOnly={readOnly || blankMode} inputType="input" className="ml-1 w-12 border-b border-dashed border-slate-400 font-mono text-center" /></div>
          <div className="flex items-center"><strong>PT Hx:</strong> <EditableClinicalField packetData={packetData} docKey={`DAV_ESWT_${pageIndex}`} field="ptHx" value={ptHx} readOnly={readOnly || blankMode} inputType="input" className="ml-1 w-24 border-b border-dashed border-slate-400 font-mono" /></div>
        </div>

        {/* -- 3-COLUMN FINDINGS & ANATOMICAL BODY DIAGRAM -- */}
        <div className="border-2 border-[#722F37] rounded-lg overflow-hidden grid grid-cols-12 text-xs">
          
          {/* Column 1: Human Body Anatomical Diagram */}
          <div className="col-span-5 border-r-2 border-[#722F37] p-2 bg-[#F9ECEC] flex flex-col items-center justify-between">
            <div className="w-full text-left font-bold text-[11px] uppercase tracking-wider text-[#722F37]">
              FINDINGS:
            </div>
            
            {/* New PNG Anatomical Human Body with Checkmarks */}
            <div className="w-full mx-auto mt-2 px-1 pb-2">
              <div className="relative w-full">
                <img src={bodyImage} alt="Treatment Areas Diagram" className="w-full h-auto block object-contain rounded-md select-none" />
                {anatomicalMarks}
              </div>
            </div>
          </div>

          {/* Column 2: Parameters & Settings */}
          <div className="col-span-4 border-r-2 border-[#722F37] p-3 space-y-2 bg-white">
            <div className="flex items-center">
              <span className="font-bold block text-[#722F37] mr-2">Nerve Block Injections:</span>
              <EditableClinicalField packetData={packetData} docKey={`DAV_ESWT_${pageIndex}`} field="nerveBlock" value={nerveBlock} readOnly={readOnly || blankMode} inputType="input" className="w-16 border-b border-dashed border-slate-400 font-mono font-bold" />
            </div>

            <div>
              <span className="font-bold block text-[#722F37]">Treatment Area(s):</span>
              <p className="font-semibold text-slate-800 underline">{treatmentAreas}</p>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <span className="font-bold text-[#722F37] w-12">Bar:</span>
                <EditableClinicalField packetData={packetData} docKey={`DAV_ESWT_${pageIndex}`} field="barSetting" value={barSetting} readOnly={readOnly || blankMode} inputType="input" className="w-16 border-b border-dashed border-slate-400 font-mono ml-2" />
              </div>
              <div className="flex items-center">
                <span className="font-bold text-[#722F37] w-12">Hz:</span>
                <EditableClinicalField packetData={packetData} docKey={`DAV_ESWT_${pageIndex}`} field="hzSetting" value={hzSetting} readOnly={readOnly || blankMode} inputType="input" className="w-16 border-b border-dashed border-slate-400 font-mono ml-2" />
              </div>
              <div className="flex items-center">
                <span className="font-bold text-[#722F37] w-12">Dose:</span>
                <EditableClinicalField packetData={packetData} docKey={`DAV_ESWT_${pageIndex}`} field="dose" value={dose} readOnly={readOnly || blankMode} inputType="input" className="w-16 border-b border-dashed border-slate-400 font-mono ml-2" />
              </div>
              <div className="pt-1 border-t border-[#E8D3D3] mt-2 flex items-center">
                <span className="font-bold text-[#722F37] w-12">Total:</span>
                <EditableClinicalField packetData={packetData} docKey={`DAV_ESWT_${pageIndex}`} field="totalWaves" value={totalWaves} readOnly={readOnly || blankMode} inputType="input" className="w-20 border-b border-dashed border-slate-400 font-mono font-black text-emerald-800 ml-2" />
              </div>
              <div className="pt-1 text-[10px] flex items-center">
                <span className="font-bold text-[#722F37] mr-2">BLT Cream Applied (YES/NO):</span>
                <EditableClinicalField packetData={packetData} docKey={`DAV_ESWT_${pageIndex}`} field="bltCream" value={bltCream} readOnly={readOnly || blankMode} inputType="input" className="w-12 border-b border-dashed border-slate-400 font-mono font-bold text-emerald-800 uppercase text-center" />
              </div>
            </div>
          </div>

          {/* Column 3: Observational Findings Checklist */}
          <div className="col-span-3 p-3 space-y-2 bg-[#F9ECEC]">
            <span className="font-bold block text-[10px] uppercase text-[#722F37] leading-tight">
              Please check/circle (all that applies)
            </span>

            <div className="space-y-1 text-xs font-mono">
              {[
                { key: 'NAD', defaultLabel: 'NAD', field: 'item_nad_label', defaultFilled: true },
                { key: 'AAO_X3', defaultLabel: 'AAO X3', field: 'item_aao_label', defaultFilled: true },
                { key: 'TREATMENT_A1', defaultLabel: 'Treatment A1', field: 'item_treatment_a1' },
                { key: 'TREATMENT_A2', defaultLabel: 'Treatment A2', field: 'item_treatment_a2' },
                { key: 'TREATMENT_A3', defaultLabel: 'Treatment A3', field: 'item_treatment_a3' },
                { key: 'TREATMENT_A4', defaultLabel: 'Treatment A4', field: 'item_treatment_a4' },
                { key: 'TREATMENT_A5', defaultLabel: 'Treatment A5', field: 'item_treatment_a5' },
                { key: 'NORMAL_REACTION', defaultLabel: 'Normal reaction', field: 'item_normal_reaction', defaultFilled: true }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                  <EditableClinicalField
                    packetData={packetData}
                    docKey={docKey}
                    field={item.field}
                    value={item.defaultFilled ? (storage[item.field] !== undefined ? storage[item.field] : item.defaultLabel) : (storage[item.field] || '')}
                    placeholder={item.defaultLabel}
                    readOnly={readOnly || blankMode}
                    inputType="input"
                    className="flex-1 font-mono text-[10px] bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 outline-none text-slate-800 cursor-text transition placeholder:text-slate-400 placeholder:italic"
                  />
                  <button
                    type="button"
                    disabled={readOnly || blankMode}
                    onClick={() => toggleCheck(item.key)}
                    className="cursor-pointer hover:bg-white/70 px-1 rounded transition select-none text-xs ml-1"
                    title="Toggle checkmark"
                  >
                    {isChecked(item.key) ? (
                      <span className="font-bold text-emerald-700 font-sans">✓</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </button>
                </div>
              ))}

              {/* Additional Manual Input Line */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <EditableClinicalField
                  packetData={packetData}
                  docKey={docKey}
                  field="item_manual_treatment"
                  value={storage.item_manual_treatment || ''}
                  placeholder="+ Add manual treatment..."
                  readOnly={readOnly || blankMode}
                  inputType="input"
                  className="flex-1 font-mono text-[10px] bg-transparent hover:bg-white/60 focus:bg-white rounded px-1 outline-none text-slate-800 cursor-text transition placeholder:text-slate-400 placeholder:italic"
                />
                <button
                  type="button"
                  disabled={readOnly || blankMode}
                  onClick={() => toggleCheck('MANUAL_TREATMENT')}
                  className="cursor-pointer hover:bg-white/70 px-1 rounded transition select-none text-xs ml-1"
                  title="Toggle checkmark"
                >
                  {isChecked('MANUAL_TREATMENT') ? (
                    <span className="font-bold text-emerald-700 font-sans">✓</span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Treatment Protocol & Instructions */}
        <div className="border-t border-slate-300 pt-2 space-y-1 text-[10px]">
          <p><strong>Pre-Treatment:</strong> Apply BLT cream to all treatment areas to be treated if needed. Apply liberal amount of ultrasound gel as treating specific areas.</p>
          <p><strong>Treatment:</strong> Place sheath/condom over transmitter tip. Set device to recommended Bar of 2.6 (can go up to 3.6 Bar) or Mj of 90 (Can go up to 150mJ). Set device to recommended Hz of 15. Treat each area with 500 waves.</p>
          <p><strong>Post procedure Instructions:</strong> • No down time following treatment • May expect mild inflammation, redness &amp; swelling for a few days • No Aspirin or NSAIDS for at least 7 days • Tylenol or Acetaminophen may be taken for discomfort • Hydrate very well (at least 64 ounces of water daily).</p>
        </div>

        {/* Signature Box */}
        <div className="pt-4 flex justify-between items-end text-xs font-mono">
          <div className="w-72">
            <span>Health Care Provider Signature:</span>
            <div className="border-b border-slate-500 pb-1 mb-1 min-h-[50px] flex flex-col justify-end mt-1">
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
                placeholder="Doctor / Provider Name"
                readOnly={readOnly || blankMode}
                inputType="input"
                className="w-full font-mono text-xs text-slate-900 font-bold bg-transparent hover:bg-slate-200/50 focus:bg-white rounded px-1 outline-none mt-0.5"
              />
            </div>
          </div>
          <div className="w-40">
            <span>Date:</span>
            <div className="border-b border-slate-500 pb-1 mb-1 min-h-[50px] flex flex-col justify-end mt-1">
              <EditableClinicalField
                packetData={packetData}
                docKey={docKey}
                field="signatureDate"
                value={blankMode ? '' : (storage.signatureDate !== undefined ? storage.signatureDate : sigDate)}
                placeholder="YYYY-MM-DD"
                readOnly={readOnly || blankMode}
                inputType="input"
                className="w-full font-mono text-xs text-slate-900 bg-transparent hover:bg-slate-200/50 focus:bg-white rounded px-1 outline-none"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

