import React, { useState, useEffect, useRef } from 'react';
import bodyImage from '../../../assets/body_image.png';

import { EditableClinicalField } from '../EditableClinicalField';
import { apiProviderService } from '../../../services/api/apiProviderService';
import { apiCaseService } from '../../../services/api/apiCaseService';
import fmLogo from '../../../assets/fm-logo.jpeg';

/**
 * Laser Procedure Form (Radial Device)
 * Fully dynamic patient, clinical, treatment, date, and provider signature data.
 */
export const AnikLaserProcedureForm = ({ 
  dos = '', 
  pageIndex = 0,
  readOnly = false, 
  blankMode = false, 
  packetData = null, 
  procedureData = null,
  serviceLines = []
}) => {
  const [providers, setProviders] = useState({});
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Fetch providers
    apiProviderService.getProviders().then(data => {
      setProviders(data);
      if (packetData?.providerId) {
        setSelectedProviderId(packetData.providerId);
      }
    }).catch(err => console.error(err));
  }, [packetData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const selectedProvider = providers[selectedProviderId];

  const docKey = `ANIK_PROCEDURE_${pageIndex}`;
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Determine actual procedure DOS dynamically
  const getProcedureDos = () => {
    if (blankMode) return '';
    if (procedureData?.dos || procedureData?.dateOfService) {
      return procedureData.dos || procedureData.dateOfService;
    }

    const lines = (serviceLines && serviceLines.length > 0)
      ? serviceLines
      : (packetData?.serviceLines || packetData?.items || []);

    const uniqueDates = Array.from(new Set(
      lines.map(l => l.dos || l.dateOfService || l.date).filter(Boolean)
    ));

    if (uniqueDates.length > 0) {
      if (pageIndex !== undefined && pageIndex !== null && uniqueDates[pageIndex]) {
        return uniqueDates[pageIndex];
      }
      if (uniqueDates[0]) return uniqueDates[0];
    }

    if (dos) return dos;

    return '';
  };

  const procedureDos = getProcedureDos();

  // Find saved clinical note
  const notes = !blankMode && Array.isArray(packetData?.clinicalNotes) ? packetData.clinicalNotes : [];
  const anikNote = notes.find(n => {
    if (!n) return false;
    const t = (n.type || n.noteType || '').toUpperCase();
    const p = (n.providerId || '').toLowerCase();
    const title = (n.title || '').toUpperCase();
    return t === 'ANIK_LASER' || t === 'ANIK' || p === 'prov-anik' || title.includes('ANIK');
  });
  const noteContent = anikNote ? (typeof anikNote.content === 'string' ? (() => { try { return JSON.parse(anikNote.content); } catch (e) { return {}; } })() : (anikNote.content || {})) : {};

  // Patient Demographics
  const patientName = blankMode || !packetData ? '' : (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '');
  const patientDob = blankMode || !packetData ? '' : (packetData.patientDob || packetData.patient?.dob || packetData.dob || '');
  const patientSex = blankMode || !packetData ? '' : (packetData.patientSex || packetData.patient?.sex || packetData.sex || '');

  // Vitals & Clinical Info
  const rawAllergies = blankMode ? '' : (
    procedureData?.allergies || 
    procedureData?.knownAllergies || 
    noteContent?.allergies ||
    noteContent?.knownAllergies ||
    packetData?.allergies || 
    packetData?.knownAllergies || 
    packetData?.patient?.knownAllergies || 
    packetData?.patient?.allergies || 
    ''
  );
  const allergies = Array.isArray(rawAllergies) 
    ? rawAllergies.join(', ') 
    : String(rawAllergies || '').replace(/,\s*$/, '').trim();
  const bp = blankMode ? '' : (procedureData?.bp || procedureData?.vitals?.bp || noteContent?.bp || packetData?.vitals?.bp || packetData?.patient?.bp || packetData?.bp || '');
  const hr = blankMode ? '' : (procedureData?.hr || procedureData?.vitals?.hr || noteContent?.hr || packetData?.vitals?.hr || packetData?.patient?.hr || packetData?.hr || '');
  const sessions = blankMode ? '' : (procedureData?.sessions !== undefined && procedureData?.sessions !== null ? String(procedureData.sessions) : (packetData?.sessions !== undefined && packetData?.sessions !== null ? String(packetData.sessions) : ''));
  const allergiesText = storage.allergies || allergies;
  const bpText = storage.bp || bp;
  const hrText = storage.hr || hr;
  const sessionsText = storage.sessions || sessions;

  // Nerve Block & Treatment Areas
  const nerveBlockVal = blankMode ? '' : (procedureData?.nerveBlockInjections || procedureData?.nerveBlock || packetData?.nerveBlockInjections || '');
  
  const getTreatmentAreas = () => {
    if (blankMode || !packetData) return '';
    if (procedureData?.treatmentAreas || procedureData?.treatmentArea) {
      return procedureData.treatmentAreas || procedureData.treatmentArea;
    }
    if (noteContent?.treatmentAreas || noteContent?.treatmentArea) {
      return noteContent.treatmentAreas || noteContent.treatmentArea;
    }
    if (packetData.treatmentAreas || packetData.treatmentArea) {
      return packetData.treatmentAreas || packetData.treatmentArea;
    }
    if (packetData.injuryBodyParts) {
      return Array.isArray(packetData.injuryBodyParts) ? packetData.injuryBodyParts.join(', ') : packetData.injuryBodyParts;
    }
    return '';
  };
  const treatmentAreas = getTreatmentAreas();

  // Laser Parameters
  const wavelengthVal = blankMode ? '' : (storage.wavelength || procedureData?.wavelength || noteContent?.wavelength || packetData?.laserParameters?.wavelength || '');
  const totalMinsVal = blankMode ? '' : (storage.totalMins || procedureData?.totalMins || procedureData?.duration || noteContent?.totalMins || noteContent?.duration || packetData?.laserParameters?.totalMins || '');
  const doseVal = blankMode ? '' : (storage.dose || procedureData?.dose || noteContent?.dose || packetData?.laserParameters?.dose || '');
  const totalEnergyVal = blankMode ? '' : (storage.totalEnergy || procedureData?.totalEnergy || noteContent?.totalEnergy || packetData?.laserParameters?.totalEnergy || '');

  // Findings / Observational Checks
  const findings = blankMode || !procedureDos ? {} : (procedureData?.findings || procedureData?.observationalFindings || packetData?.findings || {});
  const [localFindings, setLocalFindings] = useState(storage.findings || {});

  useEffect(() => {
    if (storage.findings) {
      setLocalFindings(storage.findings);
    }
  }, [storage.findings]);

  const isFindingChecked = (key) => {
    if (blankMode) return false;
    if (localFindings[key] !== undefined) return Boolean(localFindings[key]);
    return Boolean(findings[key]);
  };

  const toggleFinding = async (key) => {
    if (readOnly || blankMode) return;
    const currentVal = isFindingChecked(key);
    const updated = { ...localFindings, [key]: !currentVal };
    setLocalFindings(updated);

    if (packetData && packetData.id) {
      try {
        const currentStorage = packetData.clinicalDocStorage || {};
        const docNamespace = currentStorage[docKey] || {};
        const updatedDoc = { ...docNamespace, findings: updated };
        const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
        await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
        packetData.clinicalDocStorage = updatedStorage;
      } catch (err) {
        console.error(`Failed to toggle finding ${key}`, err);
      }
    }
  };

  // Procedure Tolerated & Duration Completed
  const procedureTolerated = blankMode || !procedureDos ? '' : (procedureData?.procedureTolerated || procedureData?.tolerated || packetData?.procedureTolerated || '');
  const durationCompletedVal = blankMode || !procedureDos ? '' : (procedureData?.durationCompleted || packetData?.durationCompleted || '');

  // Provider Signature
  const providerSignature = blankMode ? '' : (procedureData?.providerSignature || procedureData?.providerName || anikNote?.author || anikNote?.signedBy || noteContent?.providerSignature || packetData?.renderingProviderName || packetData?.providerName || '');
  const signatureDate = blankMode ? '' : (procedureData?.signatureDate || anikNote?.date || noteContent?.signatureDate || packetData?.signatureDate || '');

  // Helper to check if a specific CPT exists in a given date's lines
  const hasCpt = (lines, codePrefix) => Array.isArray(lines) && lines.some(l => l.cptCode && String(l.cptCode).startsWith(codePrefix));

  const getInjuryMarks = () => {
    if (blankMode || !packetData) return [];
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

  return (
    <div
      className="relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-4 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:shadow-none print:border-none"
      style={{ width: '100%', maxWidth: '850px', minHeight: '1100px' }}
    >
      
      {/* Top Utility Bar: Provider Selector & Screen Notice (Hidden on Print) */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 print:hidden text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Clinical Procedure Session</span>
        </div>

        {/* Compact Treating Provider Dropdown */}
        <div ref={dropdownRef} className="relative flex items-center gap-2">
          <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Treating Provider:
          </label>
          <div className="relative">
            <button 
              type="button"
              disabled={readOnly}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-8 min-w-[200px] max-w-[280px] text-left bg-white border border-slate-300 hover:border-[#722F37] rounded-lg px-2.5 text-xs font-bold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 transition-all cursor-pointer flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate">{selectedProvider ? selectedProvider.name : '[ Select Provider ]'}</span>
              <svg className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Custom Dropdown List */}
            {isDropdownOpen && !readOnly && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-[150] max-h-60 overflow-y-auto py-1">
                <div 
                  className="px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                  onClick={() => { setSelectedProviderId(''); setIsDropdownOpen(false); }}
                >
                  [ Select Provider ]
                </div>
                {Object.values(providers).map(p => (
                  <div 
                    key={p.id} 
                    className={`px-3 py-2 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors ${selectedProviderId === p.id ? 'bg-amber-50 text-[#722F37]' : 'text-slate-800'}`}
                    onClick={() => { setSelectedProviderId(p.id); setIsDropdownOpen(false); }}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Provider Header */}
      <div className="text-center pb-4 border-b-2 border-[#722F37] mb-4">
        {/* Logo and Facility Name */}
        <div className="flex flex-col items-center justify-center space-y-1">
           <img src={fmLogo} alt="FM Health Logo" className="h-16 w-auto object-contain mb-1 mix-blend-multiply" />
           <h1 className="text-2xl font-black uppercase text-[#722F37] tracking-tight">{selectedProvider ? selectedProvider.name : 'FM HEALTH AND WELLNESS CENTER'}</h1>
           <p className="text-xs font-bold text-slate-600">
             9900 Westpark Dr, Houston, TX 77063
           </p>
           {selectedProvider?.contact?.phone && (
              <p className="text-[10px] font-bold text-slate-600">
                OFFICE: {selectedProvider.contact.phone}
              </p>
           )}
        </div>
        
        <h2 className="text-sm font-bold uppercase mt-2 text-slate-800 tracking-wider">PROCEDURE FORM (RADIAL DEVICE)</h2>
      </div>

      {/* Demographics Row */}
      <div className="grid grid-cols-4 gap-2 text-xs font-mono border-b border-slate-300 pb-2">
        <div><span>Name:</span> <span className="w-28 break-words whitespace-normal px-1 font-bold">{patientName}</span></div>
        <div><span>DOB:</span> <span className="w-24 break-words whitespace-normal px-1 font-bold">{patientDob}</span></div>
        <div><span>SEX:</span> <span className="w-8 break-words whitespace-normal px-1 font-bold">{patientSex}</span></div>
        <div><span>DATE:</span> <span className="w-24 break-words whitespace-normal px-1 font-bold">{procedureDos}</span></div>
      </div>

      {/* Intro Consent & Vitals */}
      <div className="space-y-2 text-xs font-serif">
        <p className="text-slate-800 italic">
          Intro: Patient presents for laser therapy treatment. The patient has been advised of the risks and the benefits of the procedure and has signed consent.
        </p>

        <div className="flex justify-between items-start text-xs py-1 border-b border-slate-300 gap-2">
          <div className="flex-1 min-w-0 pr-2 flex items-center">
            <strong className="mr-2">ALLERGIES:</strong> 
            <EditableClinicalField packetData={packetData} docKey={docKey} field="allergies" value={allergiesText} readOnly={readOnly || blankMode} inputType="input" className="w-full h-6 px-1 font-mono font-bold bg-transparent border-b border-dashed border-slate-400 focus:bg-amber-100" />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center"><strong>BP:</strong> <EditableClinicalField packetData={packetData} docKey={docKey} field="bp" value={bpText} readOnly={readOnly || blankMode} inputType="input" className="w-24 h-6 px-1 ml-1 bg-transparent border-b border-dashed border-slate-400 focus:bg-amber-100" /></div>
            <div className="flex items-center"><strong>HR:</strong> <EditableClinicalField packetData={packetData} docKey={docKey} field="hr" value={hrText} readOnly={readOnly || blankMode} inputType="input" className="w-16 h-6 px-1 ml-1 bg-transparent border-b border-dashed border-slate-400 focus:bg-amber-100" /></div>
            <div className="flex items-center"><strong>SESSIONS:</strong> <EditableClinicalField packetData={packetData} docKey={docKey} field="sessions" value={sessionsText} readOnly={readOnly || blankMode} inputType="input" className="w-12 h-6 px-1 ml-1 border border-[#722F37] text-center font-bold bg-transparent focus:bg-amber-100" /></div>
          </div>
        </div>

        {/* -- 3-COLUMN FINDINGS & ANATOMICAL BODY DIAGRAM -- */}
        <div className="border-2 border-[#722F37] rounded-lg overflow-hidden grid grid-cols-12 text-xs">
          
          {/* Column 1: Human Body Anatomical Diagram */}
          <div className="col-span-5 border-r-2 border-[#722F37] p-2 bg-slate-50 flex flex-col items-center">
            <div className="w-full text-left font-bold text-[11px] uppercase tracking-wider text-slate-900 mb-2">
              FINDINGS:
            </div>
            
            {/* New PNG Anatomical Human Body with Checkmarks */}
            <div className="w-full mx-auto mt-2 px-1">
              <div className="relative w-full">
                <img src={bodyImage} alt="Treatment Areas Diagram" className="w-full h-auto block object-contain rounded-md select-none" />
                {anatomicalMarks}
              </div>
            </div>
          </div>

          {/* Column 2: Parameters & Settings */}
          <div className="col-span-4 border-r-2 border-[#722F37] p-3 space-y-2.5 bg-white">
            <div>
              <span className="font-bold block text-slate-900">Nerve Block Injections:</span>
              <span className="font-semibold text-slate-700">
                {nerveBlockVal === 'YES' ? <strong className="underline">YES</strong> : 'YES'} / {nerveBlockVal === 'NO' ? <strong className="underline">NO</strong> : 'NO'}
              </span>
            </div>

            <div>
              <span className="font-bold block text-slate-900">Treatment Area(s):</span>
              <p className="font-semibold text-slate-800 underline">
                {treatmentAreas}
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center">
                <span className="font-bold text-slate-900 w-24">Wavelength:</span>
                <EditableClinicalField packetData={packetData} docKey={docKey} field="wavelength" value={wavelengthVal} readOnly={readOnly || blankMode} inputType="input" className="w-16 h-5 px-1 ml-2 font-mono underline bg-transparent focus:bg-amber-100" /> nm
              </div>
              <div className="flex items-center">
                <span className="font-bold text-slate-900 w-24">total mins:</span>
                <EditableClinicalField packetData={packetData} docKey={docKey} field="totalMins" value={totalMinsVal} readOnly={readOnly || blankMode} inputType="input" className="w-16 h-5 px-1 ml-2 font-mono underline bg-transparent focus:bg-amber-100" /> s
              </div>
              <div className="flex items-center">
                <span className="font-bold text-slate-900 w-24">Dose:</span>
                <EditableClinicalField packetData={packetData} docKey={docKey} field="dose" value={doseVal} readOnly={readOnly || blankMode} inputType="input" className="w-16 h-5 px-1 ml-2 font-mono underline bg-transparent focus:bg-amber-100" /> w
              </div>
              <div className="pt-2 border-t border-slate-200 mt-2">
                <span className="font-bold block text-slate-900">Total energy:</span>
                <EditableClinicalField packetData={packetData} docKey={docKey} field="totalEnergy" value={totalEnergyVal} readOnly={readOnly || blankMode} inputType="input" className="font-mono text-sm font-black text-[#722F37] underline bg-transparent focus:bg-amber-100 h-6 px-1 w-full" />
              </div>
            </div>
          </div>

          {/* Column 3: Check / Circle Observational Findings */}
          <div className="col-span-3 p-3 space-y-2 bg-slate-50">
            <span className="font-bold block text-[10px] uppercase text-slate-700 leading-tight">
              Applicable Treatments
            </span>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <EditableClinicalField
                  packetData={packetData}
                  docKey={docKey}
                  field="finding_NAD_label"
                  value={storage.finding_NAD_label !== undefined ? storage.finding_NAD_label : 'NAD'}
                  placeholder="NAD"
                  readOnly={readOnly || blankMode}
                  inputType="input"
                  className="flex-1 font-mono text-xs bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1"
                />
                <button
                  type="button"
                  disabled={readOnly || blankMode}
                  onClick={() => toggleFinding('NAD')}
                  className="cursor-pointer hover:bg-slate-200 px-1 rounded transition select-none"
                  title="Toggle checkmark"
                >
                  {isFindingChecked('NAD') ? <span className="font-bold text-[#722F37] font-sans">✓</span> : <span className="text-slate-300">—</span>}
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <EditableClinicalField
                  packetData={packetData}
                  docKey={docKey}
                  field="finding_AAO_label"
                  value={storage.finding_AAO_label !== undefined ? storage.finding_AAO_label : 'AAO X3'}
                  placeholder="AAO X3"
                  readOnly={readOnly || blankMode}
                  inputType="input"
                  className="flex-1 font-mono text-xs bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1"
                />
                <button
                  type="button"
                  disabled={readOnly || blankMode}
                  onClick={() => toggleFinding('AAO_X3')}
                  className="cursor-pointer hover:bg-slate-200 px-1 rounded transition select-none"
                  title="Toggle checkmark"
                >
                  {isFindingChecked('AAO_X3') ? <span className="font-bold text-[#722F37] font-sans">✓</span> : <span className="text-slate-300">—</span>}
                </button>
              </div>

              {selectedProvider && selectedProvider.availableServices && selectedProvider.availableServices.map((svc, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-200 pb-0.5 mt-1">
                  <span className="text-[9px] leading-tight break-words flex-1 pr-1">{svc.description || svc.code}</span>
                  <button
                    type="button"
                    disabled={readOnly || blankMode}
                    onClick={() => toggleFinding(svc.code)}
                    className="cursor-pointer hover:bg-slate-200 px-1 rounded transition select-none"
                    title="Toggle checkmark"
                  >
                    {isFindingChecked(svc.code) || hasCpt(serviceLines, svc.code) ? <span className="font-bold text-[#722F37] font-sans">✓</span> : <span className="text-slate-300">—</span>}
                  </button>
                </div>
              ))}

              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <EditableClinicalField
                  packetData={packetData}
                  docKey={docKey}
                  field="treatment1"
                  value={storage.treatment1 || ''}
                  placeholder="Treatment A1"
                  readOnly={readOnly || blankMode}
                  inputType="input"
                  className="flex-1 font-mono text-[10px] bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 placeholder:text-slate-400 placeholder:italic"
                />
                <button
                  type="button"
                  disabled={readOnly || blankMode}
                  onClick={() => toggleFinding('treatment1')}
                  className="cursor-pointer hover:bg-slate-200 px-1 rounded transition select-none"
                  title="Toggle checkmark"
                >
                  {isFindingChecked('treatment1') ? <span className="font-bold text-[#722F37] font-sans">✓</span> : <span className="text-slate-300">—</span>}
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <EditableClinicalField
                  packetData={packetData}
                  docKey={docKey}
                  field="treatment2"
                  value={storage.treatment2 || ''}
                  placeholder="Treatment A2"
                  readOnly={readOnly || blankMode}
                  inputType="input"
                  className="flex-1 font-mono text-[10px] bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 placeholder:text-slate-400 placeholder:italic"
                />
                <button
                  type="button"
                  disabled={readOnly || blankMode}
                  onClick={() => toggleFinding('treatment2')}
                  className="cursor-pointer hover:bg-slate-200 px-1 rounded transition select-none"
                  title="Toggle checkmark"
                >
                  {isFindingChecked('treatment2') ? <span className="font-bold text-[#722F37] font-sans">✓</span> : <span className="text-slate-300">—</span>}
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <EditableClinicalField
                  packetData={packetData}
                  docKey={docKey}
                  field="treatment3"
                  value={storage.treatment3 || ''}
                  placeholder="Treatment A3"
                  readOnly={readOnly || blankMode}
                  inputType="input"
                  className="flex-1 font-mono text-[10px] bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 placeholder:text-slate-400 placeholder:italic"
                />
                <button
                  type="button"
                  disabled={readOnly || blankMode}
                  onClick={() => toggleFinding('treatment3')}
                  className="cursor-pointer hover:bg-slate-200 px-1 rounded transition select-none"
                  title="Toggle checkmark"
                >
                  {isFindingChecked('treatment3') ? <span className="font-bold text-[#722F37] font-sans">✓</span> : <span className="text-slate-300">—</span>}
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <EditableClinicalField
                  packetData={packetData}
                  docKey={docKey}
                  field="treatment4"
                  value={storage.treatment4 || ''}
                  placeholder="Treatment A4"
                  readOnly={readOnly || blankMode}
                  inputType="input"
                  className="flex-1 font-mono text-[10px] bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 placeholder:text-slate-400 placeholder:italic"
                />
                <button
                  type="button"
                  disabled={readOnly || blankMode}
                  onClick={() => toggleFinding('treatment4')}
                  className="cursor-pointer hover:bg-slate-200 px-1 rounded transition select-none"
                  title="Toggle checkmark"
                >
                  {isFindingChecked('treatment4') ? <span className="font-bold text-[#722F37] font-sans">✓</span> : <span className="text-slate-300">—</span>}
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <EditableClinicalField
                  packetData={packetData}
                  docKey={docKey}
                  field="treatment5"
                  value={storage.treatment5 || ''}
                  placeholder="Treatment A5"
                  readOnly={readOnly || blankMode}
                  inputType="input"
                  className="flex-1 font-mono text-[10px] bg-transparent hover:bg-slate-100 focus:bg-amber-50 rounded px-1 placeholder:text-slate-400 placeholder:italic"
                />
                <button
                  type="button"
                  disabled={readOnly || blankMode}
                  onClick={() => toggleFinding('treatment5')}
                  className="cursor-pointer hover:bg-slate-200 px-1 rounded transition select-none"
                  title="Toggle checkmark"
                >
                  {isFindingChecked('treatment5') ? <span className="font-bold text-[#722F37] font-sans">✓</span> : <span className="text-slate-300">—</span>}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Procedure Tolerance & Duration */}
        <div className="grid grid-cols-2 gap-4 py-2 font-bold text-xs">
          <div className="flex items-center gap-3">
            <span>PROCEDURE TOLERATE:</span>
            <span className={`border px-2 py-0.5 ${procedureTolerated === 'YES' ? 'border-slate-700 bg-[#F9ECEC] text-[#722F37]' : 'border-slate-300 text-slate-400'}`}>YES [{procedureTolerated === 'YES' ? '✓' : ' '}]</span>
            <span className={`border px-2 py-0.5 ${procedureTolerated === 'NO' ? 'border-slate-700 bg-[#F9ECEC] text-[#722F37]' : 'border-slate-300 text-slate-400'}`}>NO [{procedureTolerated === 'NO' ? '✓' : ' '}]</span>
          </div>

          <div className="flex items-center gap-3">
            <span>DURATION COMPLETED:</span>
            <span className={`border px-2 py-0.5 ${durationCompletedVal === 'YES' ? 'border-slate-700 bg-[#F9ECEC] text-[#722F37]' : 'border-slate-300 text-slate-400'}`}>YES [{durationCompletedVal === 'YES' ? '✓' : ' '}]</span>
            <span className={`border px-2 py-0.5 ${durationCompletedVal === 'NO' ? 'border-slate-700 bg-[#F9ECEC] text-[#722F37]' : 'border-slate-300 text-slate-400'}`}>NO [{durationCompletedVal === 'NO' ? '✓' : ' '}]</span>
          </div>
        </div>

        {/* Post Procedure Instructions */}
        <div className="border-t border-slate-300 pt-2 space-y-1 text-[11px]">
          <p><strong>Post procedure Instructions:</strong> • No down time following treatment • May expect mild inflammation, redness &amp; swelling for a few days • No Aspirin or NSAIDS (Motrin, Aleve, Advil, etc.) for at least 7 days • Tylenol or Acetaminophen may be taken for discomfort • Hydrate very well (at least 64 ounces of water daily).</p>
        </div>

        {/* Signature Box */}
        <div className="pt-6 flex justify-between items-end text-xs font-mono">
          <div className="w-72">
            <span>Health Care Provider Signature:</span>
            <div className="border-b border-slate-500 min-h-[36px] flex items-end mt-1 pb-0.5">
              <EditableClinicalField
                packetData={packetData}
                docKey={docKey}
                field="providerSignature"
                value={blankMode ? '' : (storage.providerSignature !== undefined ? storage.providerSignature : (providerSignature || (selectedProvider && selectedProvider.renderingProvider ? selectedProvider.renderingProvider.name : '')))}
                placeholder="Click to Sign"
                readOnly={readOnly || blankMode}
                inputType="signature"
                className="w-full font-bold text-sm text-slate-900"
              />
            </div>
          </div>
          <div className="w-40">
            <span>Date:</span>
            <div className="border-b border-slate-500 min-h-[36px] flex items-end mt-1 pb-0.5">
              <EditableClinicalField
                packetData={packetData}
                docKey={docKey}
                field="signatureDate"
                value={blankMode ? '' : (storage.signatureDate !== undefined ? storage.signatureDate : signatureDate)}
                placeholder="YYYY-MM-DD"
                readOnly={readOnly || blankMode}
                inputType="input"
                className="w-full font-mono text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
