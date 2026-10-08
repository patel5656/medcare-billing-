import React, { useState, useEffect } from 'react';
import bodyImage from '../../../assets/body_image.png';

import { EditableClinicalField } from '../EditableClinicalField';
import { apiProviderService } from '../../../services/api/apiProviderService';
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

  useEffect(() => {
    // Fetch providers
    apiProviderService.getProviders().then(data => {
      setProviders(data);
      if (packetData?.providerId) {
        setSelectedProviderId(packetData.providerId);
      }
    }).catch(err => console.error(err));
  }, [packetData]);

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
  const isFindingChecked = (key) => Boolean(findings[key]);

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
    const addMark = (key, top, left) => {
      marks.push(
        <div key={key} className="treatment-checkbox absolute" style={{ top: `${top}%`, left: `${left}%` }}>
          <span className="checkbox-box">
            <span className="checkbox-checkmark text-[#722F37] font-black text-sm md:text-base select-none pointer-events-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">✓</span>
          </span>
        </div>
      );
    };

    if (areas.includes('Shoulder / Rotator Cuff')) {
      addMark('l-shoulder', 22.8, 24.5);
      addMark('r-shoulder', 21.5, 90);
    }
    if (areas.includes('Lower Back / Lumbar')) {
      addMark('l-lower-back', 39.5, 23);
    }
    if (areas.includes('Neck / Cervical Spine')) {
      addMark('l-neck', 15.5, 24.5);
    }
    if (areas.includes('Knee / Lower Extremity')) {
      addMark('l-knee', 62.5, 24.5);
      addMark('r-knee', 63.8, 90);
    }
    if (areas.includes('Mid Back / Thoracic')) {
      addMark('l-upper-back', 31.0, 24.5);
    }
    if (areas.includes('Headaches / Concussion')) {
      addMark('r-head', 13.5, 90);
    }
    if (areas.includes('Whiplash / Myofascial Pain')) {
      addMark('l-neck-whip', 15.5, 24.5);
      addMark('l-upper-back-whip', 31.0, 24.5);
    }
    if (areas.includes('Anxiety / PTSD Symptoms')) {
      addMark('r-head-anx', 13.5, 90);
    }
    if (areas.includes('Hip')) {
      addMark('l-hip', 49.0, 24.5);
    }
    if (areas.includes('Ankle')) {
      addMark('l-ankle', 78.5, 24.5);
      addMark('r-ankle', 78.5, 90);
    }
    if (areas.includes('Foot')) {
      addMark('l-foot', 86.0, 24.5);
      addMark('r-foot', 86.0, 90);
    }
    if (areas.includes('Elbow')) {
      addMark('r-elbow', 28.5, 90);
    }
    if (areas.includes('Wrist')) {
      addMark('r-wrist', 35.6, 90);
    }
    if (areas.includes('Hand')) {
      addMark('r-hand', 42.6, 90);
    }
    if (areas.includes('Hip / Glute')) {
      addMark('r-hip-glute', 49.7, 90);
    }
    if (areas.includes('Thigh')) {
      addMark('r-thigh', 56.7, 90);
    }
    if (areas.includes('Calf')) {
      addMark('r-calf', 71.0, 90);
    }

    if (areas.includes('Other Treatment Areas (Specify)')) {
      const specifyText = packetData?.otherInjuryAreaSpecify || packetData?.patient?.otherInjuryAreaSpecify || '';
      if (specifyText) {
        marks.push(
          <span 
            key="other-specify" 
            className="absolute text-[#722F37] font-bold text-[10px] md:text-xs z-10 whitespace-nowrap uppercase transform -translate-y-1/2" 
            style={{ bottom: '6.5%', left: '45%' }}
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
      
      {/* Provider Header */}
      <div className="text-center pb-4 border-b-2 border-[#722F37] mb-4 relative">
        {/* Dynamic Provider Dropdown */}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200/80 inline-block text-left w-64 shadow-lg shadow-slate-200/50 print:hidden transition-all hover:shadow-xl z-[100]">
          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
            Treating Provider
          </label>
          <div className="relative group">
            <button 
              type="button"
              disabled={readOnly}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full text-left bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#722F37]/30 focus:border-[#722F37] transition-all cursor-pointer hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
            >
              <span className="block break-words whitespace-normal text-left">{selectedProvider ? selectedProvider.name : '[ Select Provider ]'}</span>
            </button>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 group-hover:text-[#722F37] transition-colors">
              <svg className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </div>

            {/* Custom Dropdown List */}
            {isDropdownOpen && !readOnly && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto">
                <div 
                  className="px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                  onClick={() => { setSelectedProviderId(''); setIsDropdownOpen(false); }}
                >
                  [ Select Provider ]
                </div>
                {Object.values(providers).map(p => (
                  <div 
                    key={p.id} 
                    className={`px-3 py-2.5 text-sm font-bold cursor-pointer hover:bg-slate-50 ${selectedProviderId === p.id ? 'bg-slate-100 text-[#722F37]' : 'text-slate-800'}`}
                    onClick={() => { setSelectedProviderId(p.id); setIsDropdownOpen(false); }}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
            <div className="relative w-full mx-auto mt-2 px-1">
              <img src={bodyImage} alt="Treatment Areas Diagram" className="w-full h-auto object-contain rounded-md" />
              {anatomicalMarks}
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
                <span>NAD</span>
                {isFindingChecked('NAD') ? <span className="font-bold text-[#722F37] font-sans">✓</span> : <span className="text-slate-300">—</span>}
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <span>AAO X3</span>
                {isFindingChecked('AAO_X3') || isFindingChecked('AAO X3') ? <span className="font-bold text-[#722F37] font-sans">✓</span> : <span className="text-slate-300">—</span>}
              </div>
              
              {selectedProvider && selectedProvider.availableServices ? selectedProvider.availableServices.map((svc, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-200 pb-0.5 mt-1">
                  <span className="text-[9px] leading-tight break-words">{svc.description || svc.code}</span>
                  {isFindingChecked(svc.code) || hasCpt(serviceLines, svc.code) ? <span className="font-bold text-[#722F37] font-sans">✓</span> : <span className="text-slate-300">—</span>}
                </div>
              )) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                    <span className="text-[10px]">Treatment A1</span>
                    <span className="text-slate-300">—</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                    <span className="text-[10px]">Treatment A2</span>
                    <span className="text-slate-300">—</span>
                  </div>
                </>
              )}
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
          <div>
            <span>Health Care Provider Signature:</span>
            <p className="font-bold text-sm text-slate-900 mt-2 underline">{providerSignature || (selectedProvider && selectedProvider.renderingProvider ? selectedProvider.renderingProvider.name : '')}</p>
          </div>
          <div>
            <span>Date:</span>
            <p className="font-bold text-sm text-slate-900 mt-2">{signatureDate}</p>
          </div>
        </div>

      </div>

    </div>
  );
};
