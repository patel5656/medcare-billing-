import React, { useState, useEffect } from 'react';
import bodyImage from '../../../assets/body_image.png';

const InlineInput = ({ defaultValue = '', readOnly = false, className = '', multiline = false }) => {
  const [val, setVal] = useState(defaultValue);
  useEffect(() => { setVal(defaultValue); }, [defaultValue]);

  if (readOnly) return <span className={`break-words whitespace-normal ${className}`}>{val}</span>;

  if (multiline) {
    return (
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={2}
        className={`bg-transparent hover:bg-amber-100/60 focus:bg-amber-100 focus:ring-1 focus:ring-teal-600 rounded px-1 outline-none text-slate-900 font-mono font-bold cursor-text transition print:border-none print:bg-transparent print:p-0 print:shadow-none print:text-black resize-none w-full ${className}`}
      />
    );
  }

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      className={`bg-transparent hover:bg-amber-100/60 focus:bg-amber-100 focus:ring-1 focus:ring-teal-600 rounded px-1 outline-none text-slate-900 font-mono font-bold cursor-text transition print:border-none print:bg-transparent print:p-0 print:shadow-none print:text-black ${className}`}
    />
  );
};

/**
 * ANIK Laser Therapy Procedure Form (Radial Device) - PDF Pages 8, 9, 10
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

  // Find saved ANIK_LASER clinical note
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
  const wavelength = blankMode ? '' : (procedureData?.wavelength || noteContent?.wavelength || packetData?.laserParameters?.wavelength || '');
  const totalMins = blankMode ? '' : (procedureData?.totalMins || procedureData?.duration || noteContent?.totalMins || noteContent?.duration || packetData?.laserParameters?.totalMins || '');
  const dose = blankMode ? '' : (procedureData?.dose || noteContent?.dose || packetData?.laserParameters?.dose || '');
  const totalEnergy = blankMode ? '' : (procedureData?.totalEnergy || noteContent?.totalEnergy || packetData?.laserParameters?.totalEnergy || '');

  // Findings / Observational Checks
  const findings = blankMode || !procedureDos ? {} : (procedureData?.findings || procedureData?.observationalFindings || packetData?.findings || {});
  const isFindingChecked = (key) => Boolean(findings[key]);

  // Procedure Tolerated & Duration Completed
  const procedureTolerated = blankMode || !procedureDos ? '' : (procedureData?.procedureTolerated || procedureData?.tolerated || packetData?.procedureTolerated || '');
  const durationCompletedVal = blankMode || !procedureDos ? '' : (procedureData?.durationCompleted || packetData?.durationCompleted || '');

  // Provider Signature
  const providerSignature = blankMode ? '' : (procedureData?.providerSignature || procedureData?.providerName || anikNote?.author || anikNote?.signedBy || noteContent?.providerSignature || packetData?.renderingProviderName || packetData?.providerName || '');
  const signatureDate = blankMode ? '' : (procedureData?.signatureDate || anikNote?.date || noteContent?.signatureDate || packetData?.signatureDate || '');

  const getInjuryMarks = () => {
    if (blankMode || !packetData) return [];
    const injuryAreas = packetData?.selectedInjuryAreas || packetData?.patient?.selectedInjuryAreas || [];
    const areas = Array.isArray(injuryAreas) ? injuryAreas : [];
    
    const marks = [];
    const checkStyle = "absolute text-teal-800 font-black text-sm md:text-base transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]";

    const addMark = (key, top, left) => {
      marks.push(
        <span key={key} className={checkStyle} style={{ top: `${top}%`, left: `${left}%` }}>
          ✓
        </span>
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
            className="absolute text-teal-800 font-bold text-[10px] md:text-xs z-10 whitespace-nowrap uppercase transform -translate-y-1/2" 
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
      className="relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-4 print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:shadow-none print:border-none"
      style={{ width: '100%', maxWidth: '850px', minHeight: '1100px' }}
    >
      
      {/* Provider Heading & Title */}
      <div className="text-center pb-2">
        <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">ANIK LASER THERAPY</h1>
        <h2 className="text-sm font-bold uppercase mt-1 text-slate-800 tracking-wider">PROCEDURE FORM (RADIAL DEVICE)</h2>
      </div>

      {/* Demographics Row */}
      <div className="grid grid-cols-4 gap-2 text-xs font-mono border-b border-slate-300 pb-2">
        <div><span>Name:</span> <InlineInput defaultValue={patientName} readOnly={readOnly} className="w-28" /></div>
        <div><span>DOB:</span> <InlineInput defaultValue={patientDob} readOnly={readOnly} className="w-24" /></div>
        <div><span>SEX:</span> <InlineInput defaultValue={patientSex} readOnly={readOnly} className="w-8" /></div>
        <div><span>DATE:</span> <InlineInput defaultValue={procedureDos} readOnly={readOnly} className="w-24" /></div>
      </div>

      {/* Intro Consent & Vitals */}
      <div className="space-y-2 text-xs font-serif">
        <p className="text-slate-800 italic">
          Intro: Patient presents for laser therapy treatment. The patient has been advised of the risks and the benefits of the procedure and has signed consent.
        </p>

        <div className="flex justify-between items-start text-xs py-1 border-b border-slate-300 gap-2">
          <div className="flex-1 min-w-0 pr-2">
            <strong>ALLERGIES:</strong> <InlineInput defaultValue={allergies} readOnly={readOnly} multiline className="font-mono font-bold" />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div><strong>BP:</strong> <InlineInput defaultValue={bp} readOnly={readOnly} className="w-24" /></div>
            <div><strong>HR:</strong> <InlineInput defaultValue={hr} readOnly={readOnly} className="w-16" /></div>
            <div><strong>SESSIONS:</strong> <InlineInput defaultValue={sessions} readOnly={readOnly} className="w-8 border border-slate-800 px-1 text-center font-bold" /></div>
          </div>
        </div>

        {/* -- 3-COLUMN FINDINGS & ANATOMICAL BODY DIAGRAM -- */}
        <div className="border-2 border-slate-800 rounded-lg overflow-hidden grid grid-cols-12 text-xs">
          
          {/* Column 1: Human Body Anatomical Diagram */}
          <div className="col-span-5 border-r-2 border-slate-800 p-2 bg-slate-50 flex flex-col items-center">
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
          <div className="col-span-4 border-r-2 border-slate-800 p-3 space-y-2.5 bg-white">
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
              <div>
                <span className="font-bold text-slate-900">Wavelength:</span>
                <span className="ml-2 font-mono underline">{wavelength ? `${wavelength} nm` : ''}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">total mins:</span>
                <span className="ml-2 font-mono underline">{totalMins ? `${totalMins}s` : ''}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Dose:</span>
                <span className="ml-2 font-mono underline">{dose ? `${dose}w` : ''}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold block text-slate-900">Total energy:</span>
                <span className="font-mono text-sm font-black text-teal-800 underline">{totalEnergy}</span>
              </div>
            </div>
          </div>

          {/* Column 3: Check / Circle Observational Findings */}
          <div className="col-span-3 p-3 space-y-2 bg-slate-50">
            <span className="font-bold block text-[10px] uppercase text-slate-700 leading-tight">
              Please check/circle (all that applies)
            </span>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <span>NAD</span>
                {isFindingChecked('NAD') ? <span className="font-bold text-teal-700 font-sans">✓</span> : <span className="text-slate-300">—</span>}
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <span>AAO X3</span>
                {isFindingChecked('AAO_X3') || isFindingChecked('AAO X3') ? <span className="font-bold text-teal-700 font-sans">✓</span> : <span className="text-slate-300">—</span>}
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <span>Treatment A1</span>
                {isFindingChecked('Treatment_A1') || isFindingChecked('Treatment A1') ? <span className="font-bold text-teal-700 font-sans">✓</span> : <span className="text-slate-300">—</span>}
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <span>Treatment A2</span>
                {isFindingChecked('Treatment_A2') || isFindingChecked('Treatment A2') ? <span className="font-bold text-teal-700 font-sans">✓</span> : <span className="text-slate-300">—</span>}
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <span>Treatment A3</span>
                {isFindingChecked('Treatment_A3') || isFindingChecked('Treatment A3') ? <span className="font-bold text-teal-700 font-sans">✓</span> : <span className="text-slate-300">—</span>}
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <span>Treatment A4</span>
                {isFindingChecked('Treatment_A4') || isFindingChecked('Treatment A4') ? <span className="font-bold text-teal-700 font-sans">✓</span> : <span className="text-slate-300">—</span>}
              </div>
              <div className="flex items-center justify-between">
                <span>Treatment A5</span>
                {isFindingChecked('Treatment_A5') || isFindingChecked('Treatment A5') ? <span className="font-bold text-teal-700 font-sans">✓</span> : <span className="text-slate-300">—</span>}
              </div>
            </div>
          </div>

        </div>

        {/* Procedure Tolerance & Duration */}
        <div className="grid grid-cols-2 gap-4 py-2 font-bold text-xs">
          <div className="flex items-center gap-3">
            <span>PROCEDURE TOLERATE:</span>
            <span className={`border px-2 py-0.5 ${procedureTolerated === 'YES' ? 'border-slate-700 bg-teal-50 text-teal-900' : 'border-slate-300 text-slate-400'}`}>YES [{procedureTolerated === 'YES' ? '✓' : ' '}]</span>
            <span className={`border px-2 py-0.5 ${procedureTolerated === 'NO' ? 'border-slate-700 bg-rose-50 text-rose-900' : 'border-slate-300 text-slate-400'}`}>NO [{procedureTolerated === 'NO' ? '✓' : ' '}]</span>
          </div>

          <div className="flex items-center gap-3">
            <span>DURATION COMPLETED:</span>
            <span className={`border px-2 py-0.5 ${durationCompletedVal === 'YES' ? 'border-slate-700 bg-teal-50 text-teal-900' : 'border-slate-300 text-slate-400'}`}>YES [{durationCompletedVal === 'YES' ? '✓' : ' '}]</span>
            <span className={`border px-2 py-0.5 ${durationCompletedVal === 'NO' ? 'border-slate-700 bg-rose-50 text-rose-900' : 'border-slate-300 text-slate-400'}`}>NO [{durationCompletedVal === 'NO' ? '✓' : ' '}]</span>
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
            <p className="font-bold text-sm text-slate-900 mt-2 underline">{providerSignature}</p>
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
