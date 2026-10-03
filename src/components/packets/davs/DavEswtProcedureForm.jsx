// src/components/packets/davs/DavEswtProcedureForm.jsx
import React from 'react';
import bodyImage from '../../../assets/body_image.png';

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
  const isShow = !blankMode && packetData;
  const proc = procedureData || packetData?.procedures?.[pageIndex] || {};

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
  const allergies = Array.isArray(rawAllergies) ? rawAllergies.join(', ') : rawAllergies;
  const bp = isShow ? (proc.bp || noteContent.bp || packetData.vitals?.bp || packetData.bp || '') : '';
  const hr = isShow ? (proc.hr || noteContent.hr || packetData.vitals?.hr || packetData.hr || '') : '';
  const ptHx = isShow ? (proc.ptHx || proc.history || noteContent.ptHx || noteContent.history || packetData?.ptHx || packetData?.history || '') : '';

  const nerveBlock = isShow ? (proc.nerveBlock || noteContent.nerveBlock || packetData.nerveBlock || '') : '';
  const treatmentAreas = isShow ? (proc.treatmentAreas || proc.treatmentArea || proc.treatmentTargetAreas || noteContent.treatmentAreas || noteContent.treatmentArea || noteContent.treatmentTargetAreas || packetData.treatmentAreas || packetData.treatmentArea || '') : '';
  const barSetting = isShow ? (proc.barSetting || proc.bar || noteContent.barSetting || noteContent.bar || packetData.barSetting || packetData.bar || '') : '';
  const hzSetting = isShow ? (proc.hzSetting || proc.hz || noteContent.hzSetting || noteContent.hz || packetData.hzSetting || packetData.hz || '') : '';
  const dose = isShow ? (proc.dose || noteContent.dose || packetData.dose || '') : '';
  const totalWaves = isShow ? (proc.totalWaves || proc.total || proc.totalWavesDelivered || noteContent.totalWaves || noteContent.total || noteContent.totalWavesDelivered || packetData.totalWaves || packetData.total || '') : '';
  const bltCream = isShow ? (proc.bltCream || noteContent.bltCream || packetData.bltCream || '') : '';

  const checklist = isShow ? (proc.checklist || proc.findingsChecklist || packetData.eswtChecklist || {}) : {};
  const isChecked = (key) => {
    if (!isShow) return false;
    if (Array.isArray(checklist)) return checklist.includes(key);
    return Boolean(checklist[key]);
  };

  const providerSignature = isShow ? (proc.providerSignature || proc.author || proc.providerName || davsNote?.author || davsNote?.signedBy || noteContent?.providerSignature || packetData?.renderingProviderName || packetData?.providerName || packetData?.attendingProviderName || '') : '';
  const sigDate = isShow ? (proc.signatureDate || proc.signedAt || proc.dateSigned || davsNote?.date || davsNote?.signedAt || noteContent?.signatureDate || packetData?.signatureDate || packetData?.signedAt || packetData?.dateSigned || '') : '';

  const currentInternalPage = formPage || (pageIndex + 1);

  const getInjuryMarks = () => {
    if (!isShow) return [];
    const injuryAreas = packetData?.selectedInjuryAreas || packetData?.patient?.selectedInjuryAreas || [];
    const areas = Array.isArray(injuryAreas) ? injuryAreas : [];
    
    const marks = [];
    const checkStyle = "absolute text-emerald-800 font-black text-sm md:text-base transform -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]";

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
            className="absolute text-emerald-800 font-bold text-[10px] md:text-xs z-10 whitespace-nowrap uppercase transform -translate-y-1/2" 
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
      
      {/* Top Header & Internal Page Number */}
      <div className="flex justify-between items-start">
        <div className="flex-1 text-center pl-16">
          <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">DAV'S ANATOMY</h1>
          <h2 className="text-sm font-bold uppercase mt-1 text-slate-800 tracking-wider">ESWT PROCEDURE FORM (RADIAL DEVICE)</h2>
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

        <div className="flex justify-between items-center text-xs py-1 border-b border-slate-300">
          <div><strong>ALLERGIES:</strong> <span className="underline ml-1">{allergies}</span></div>
          <div><strong>BP:</strong> <span className="underline ml-1">{bp}</span></div>
          <div><strong>HR:</strong> <span className="underline ml-1">{hr}</span></div>
          <div><strong>PT Hx:</strong> <span className="underline ml-1">{ptHx}</span></div>
        </div>

        {/* -- 3-COLUMN FINDINGS & ANATOMICAL BODY DIAGRAM -- */}
        <div className="border-2 border-slate-800 rounded-lg overflow-hidden grid grid-cols-12 text-xs">
          
          {/* Column 1: Human Body Anatomical Diagram */}
          <div className="col-span-5 border-r-2 border-slate-800 p-2 bg-slate-50 flex flex-col items-center justify-between">
            <div className="w-full text-left font-bold text-[11px] uppercase tracking-wider text-slate-900">
              FINDINGS:
            </div>
            
            {/* New PNG Anatomical Human Body with Checkmarks */}
            <div className="relative w-full mx-auto mt-2 px-1 pb-2">
              <img src={bodyImage} alt="Treatment Areas Diagram" className="w-full h-auto object-contain rounded-md" />
              {anatomicalMarks}
            </div>
          </div>

          {/* Column 2: Parameters & Settings */}
          <div className="col-span-4 border-r-2 border-slate-800 p-3 space-y-2 bg-white">
            <div>
              <span className="font-bold block text-slate-900">Nerve Block Injections:</span>
              <span className="font-semibold text-slate-700">{nerveBlock ? <strong className="underline">{nerveBlock}</strong> : ''}</span>
            </div>

            <div>
              <span className="font-bold block text-slate-900">Treatment Area(s):</span>
              <p className="font-semibold text-slate-800 underline">{treatmentAreas}</p>
            </div>

            <div className="space-y-1 text-xs">
              <div>
                <span className="font-bold text-slate-900">Bar:</span>
                <span className="ml-2 font-mono underline">{barSetting}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Hz:</span>
                <span className="ml-2 font-mono underline">{hzSetting}</span>
              </div>
              <div>
                <span className="font-bold text-slate-900">Dose:</span>
                <span className="ml-2 font-mono underline">{dose}</span>
              </div>
              <div className="pt-1 border-t border-slate-200">
                <span className="font-bold block text-slate-900">Total:</span>
                <span className="font-mono text-sm font-black text-emerald-800 underline">{totalWaves}</span>
              </div>
              <div className="pt-1 text-[10px]">
                <span className="font-bold block">BLT Cream Applied:</span>
                <span className="font-bold text-emerald-800">
                  {bltCream === 'YES' ? 'YES [✓] / NO [ ]' : (bltCream === 'NO' ? 'YES [ ] / NO [✓]' : 'YES [ ] / NO [ ]')}
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Observational Findings Checklist */}
          <div className="col-span-3 p-3 space-y-2 bg-slate-50">
            <span className="font-bold block text-[10px] uppercase text-slate-700 leading-tight">
              Please check/circle (all that applies)
            </span>

            <div className="space-y-1 text-xs font-mono">
              {[
                { key: 'NAD', label: 'NAD' },
                { key: 'AAO_X3', label: 'AAO X3' },
                { key: 'TREATMENT_A1', label: 'Treatment A1' },
                { key: 'TREATMENT_A2', label: 'Treatment A2' },
                { key: 'TREATMENT_A3', label: 'Treatment A3' },
                { key: 'TREATMENT_A4', label: 'Treatment A4' },
                { key: 'NORMAL_REACTION', label: 'Normal reaction' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                  <span>{item.label}</span>
                  {isChecked(item.key) ? (
                    <span className="font-bold text-emerald-700 font-sans">✓</span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </div>
              ))}
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
          <div>
            <span>Health Care Provider Signature:</span>
            <p className="font-bold text-sm text-slate-900 mt-1 underline">{providerSignature}</p>
          </div>
          <div>
            <span>Date:</span>
            <p className="font-bold text-sm text-slate-900 mt-1">{sigDate}</p>
          </div>
        </div>

      </div>

    </div>
  );
};

