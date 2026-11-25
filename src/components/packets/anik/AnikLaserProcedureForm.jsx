import React, { useState, useEffect, useRef } from 'react';
import bodyImage from '../../../assets/body_image.png';

import { EditableClinicalField } from '../EditableClinicalField';
import { apiProviderService } from '../../../services/api/apiProviderService';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { apiBillingService } from '../../../services/api/apiBillingService';
import { useUIStore } from '../../../store/uiStore';
import fmLogo from '../../../assets/fm-logo.jpeg';

const ANATOMICAL_CHECKBOX_TARGETS = [
  // Left column (Anterior diagram view)
  { id: 'l-neck', label: 'Neck / Cervical Spine', keywords: ['neck', 'cervical'], top: 17.52, left: 21.75 },
  { id: 'l-shoulder', label: 'Shoulder / Rotator Cuff', keywords: ['shoulder', 'rotator cuff'], top: 23.88, left: 21.75 },
  { id: 'l-upper-back', label: 'Mid Back / Thoracic', keywords: ['mid back', 'upper back', 'thoracic'], top: 31.60, left: 21.75 },
  { id: 'l-lower-back', label: 'Lower Back / Lumbar', keywords: ['lower back', 'lumbar', 'low back'], top: 41.29, left: 18.60 },
  { id: 'l-hip', label: 'Hip', keywords: ['hip'], top: 48.94, left: 18.01 },
  { id: 'l-knee', label: 'Knee / Lower Extremity', keywords: ['knee'], top: 62.57, left: 18.81 },
  { id: 'l-ankle', label: 'Ankle', keywords: ['ankle'], top: 77.86, left: 18.77 },
  { id: 'l-foot', label: 'Foot', keywords: ['foot'], top: 83.76, left: 18.77 },

  // Right column (Posterior diagram view)
  { id: 'r-head', label: 'Headaches / Concussion', keywords: ['headache', 'concussion', 'head'], top: 13.29, left: 86.44 },
  { id: 'r-shoulder', label: 'Shoulder / Rotator Cuff', keywords: ['shoulder', 'rotator cuff'], top: 21.99, left: 93.53 },
  { id: 'r-elbow', label: 'Elbow', keywords: ['elbow'], top: 32.55, left: 93.53 },
  { id: 'r-wrist', label: 'Wrist', keywords: ['wrist'], top: 39.74, left: 93.53 },
  { id: 'r-hand', label: 'Hand', keywords: ['hand'], top: 45.72, left: 93.53 },
  { id: 'r-hip-glute', label: 'Hip / Glute', keywords: ['hip / glute', 'glute'], top: 51.82, left: 94.25 },
  { id: 'r-thigh', label: 'Thigh', keywords: ['thigh'], top: 57.91, left: 94.12 },
  { id: 'r-knee', label: 'Knee / Lower Extremity', keywords: ['knee'], top: 63.78, left: 94.12 },
  { id: 'r-calf', label: 'Calf', keywords: ['calf'], top: 70.97, left: 94.12 },
  { id: 'r-ankle', label: 'Ankle', keywords: ['ankle'], top: 78.69, left: 94.08 },
  { id: 'r-foot', label: 'Foot', keywords: ['foot'], top: 84.44, left: 94.00 },
];

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
  serviceLines = [],
  bill = null
}) => {
  const { addToast } = useUIStore ? useUIStore() : { addToast: () => {} };
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
      : [];

    const uniqueDates = Array.from(new Set(
      lines.map(l => l.dos || l.dateOfService || l.date).filter(Boolean)
    ));

    if (uniqueDates.length > 0) {
      if (pageIndex !== undefined && pageIndex !== null && uniqueDates[pageIndex]) {
        return uniqueDates[pageIndex];
      }
      if (uniqueDates[0]) return uniqueDates[0];
    }

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
  const accidentDate = blankMode ? '' : (packetData?.accidentDate || packetData?.dateOfAccident || packetData?.patient?.accidentDate || '');
  const accidentDateText = storage.accidentDate !== undefined ? storage.accidentDate : accidentDate;

  // Nerve Block & Treatment Areas
  const nerveBlockVal = blankMode ? '' : (procedureData?.nerveBlockInjections || procedureData?.nerveBlock || packetData?.nerveBlockInjections || '');
  
  const rawInitialInjuryAreas = packetData?.selectedInjuryAreas || packetData?.patient?.selectedInjuryAreas || [];
  const [localInjuryAreas, setLocalInjuryAreas] = useState(
    Array.isArray(rawInitialInjuryAreas) ? rawInitialInjuryAreas : []
  );

  useEffect(() => {
    const areas = packetData?.selectedInjuryAreas || packetData?.patient?.selectedInjuryAreas || [];
    if (Array.isArray(areas)) {
      setLocalInjuryAreas(areas);
    }
  }, [packetData?.selectedInjuryAreas, packetData?.patient?.selectedInjuryAreas]);

  const getTreatmentAreas = () => {
    if (blankMode || !packetData) return '';
    if (localInjuryAreas && localInjuryAreas.length > 0) {
      return localInjuryAreas.join(', ');
    }
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

  // Procedure Tolerated
  const initialProcedureTolerated = blankMode || !procedureDos 
    ? '' 
    : (storage.procedureTolerated !== undefined 
        ? storage.procedureTolerated 
        : (procedureData?.procedureTolerated || procedureData?.tolerated || packetData?.procedureTolerated || ''));

  const [procedureTolerated, setProcedureTolerated] = useState(initialProcedureTolerated);

  useEffect(() => {
    if (storage.procedureTolerated !== undefined) {
      setProcedureTolerated(storage.procedureTolerated);
    } else if (!blankMode && procedureDos) {
      setProcedureTolerated(procedureData?.procedureTolerated || procedureData?.tolerated || packetData?.procedureTolerated || '');
    } else {
      setProcedureTolerated('');
    }
  }, [storage.procedureTolerated, procedureData?.procedureTolerated, procedureData?.tolerated, packetData?.procedureTolerated, blankMode, procedureDos]);

  const handleProcedureToleratedToggle = async (val) => {
    if (readOnly || blankMode) return;
    const nextVal = procedureTolerated === val ? '' : val;
    setProcedureTolerated(nextVal);

    if (packetData && packetData.id) {
      try {
        const currentStorage = packetData.clinicalDocStorage || {};
        const docNamespace = currentStorage[docKey] || {};
        const updatedDoc = { ...docNamespace, procedureTolerated: nextVal };
        const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
        await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
        packetData.clinicalDocStorage = updatedStorage;

        if (bill && bill.id) {
          const existingSigs = typeof bill.cmsSignatures === 'string'
            ? JSON.parse(bill.cmsSignatures)
            : (bill.cmsSignatures || {});
          const newSigs = { ...existingSigs, [`${docKey}_procedureTolerated`]: nextVal };
          await apiBillingService.updateBill(bill.id, { cmsSignatures: newSigs }).catch(() => {});
          bill.cmsSignatures = newSigs;
        }

        if (addToast) {
          addToast(`Procedure Tolerated ${nextVal ? `set to ${nextVal}` : 'cleared'} & saved!`, 'success');
        }
      } catch (err) {
        console.error('Failed to save Procedure Tolerated', err);
        if (addToast) addToast('Failed to save Procedure Tolerated', 'error');
      }
    }
  };
  
  const initialDurationCompleted = blankMode || !procedureDos 
    ? '' 
    : (storage.durationCompleted !== undefined 
        ? storage.durationCompleted 
        : (procedureData?.durationCompleted || packetData?.durationCompleted || ''));

  const [durationCompleted, setDurationCompleted] = useState(initialDurationCompleted);

  useEffect(() => {
    if (storage.durationCompleted !== undefined) {
      setDurationCompleted(storage.durationCompleted);
    } else if (!blankMode && procedureDos) {
      setDurationCompleted(procedureData?.durationCompleted || packetData?.durationCompleted || '');
    } else {
      setDurationCompleted('');
    }
  }, [storage.durationCompleted, procedureData?.durationCompleted, packetData?.durationCompleted, blankMode, procedureDos]);

  const handleDurationCompletedToggle = async (val) => {
    if (readOnly || blankMode) return;
    const nextVal = durationCompleted === val ? '' : val;
    setDurationCompleted(nextVal);

    if (packetData && packetData.id) {
      try {
        const currentStorage = packetData.clinicalDocStorage || {};
        const docNamespace = currentStorage[docKey] || {};
        const updatedDoc = { ...docNamespace, durationCompleted: nextVal };
        const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
        await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
        packetData.clinicalDocStorage = updatedStorage;

        if (bill && bill.id) {
          const existingSigs = typeof bill.cmsSignatures === 'string'
            ? JSON.parse(bill.cmsSignatures)
            : (bill.cmsSignatures || {});
          const newSigs = { ...existingSigs, [`${docKey}_durationCompleted`]: nextVal };
          await apiBillingService.updateBill(bill.id, { cmsSignatures: newSigs }).catch(() => {});
          bill.cmsSignatures = newSigs;
        }

        if (addToast) {
          addToast(`Duration Completed ${nextVal ? `set to ${nextVal}` : 'cleared'} & saved!`, 'success');
        }
      } catch (err) {
        console.error('Failed to save Duration Completed', err);
        if (addToast) addToast('Failed to save Duration Completed', 'error');
      }
    }
  };

  // Provider Signature & Name
  const defaultProvName = procedureData?.providerName || anikNote?.author || anikNote?.signedBy || (selectedProvider && selectedProvider.renderingProvider ? selectedProvider.renderingProvider.name : '') || packetData?.renderingProviderName || packetData?.providerName || '';
  const savedName = (storage.providerName && !storage.providerName.startsWith('data:image')) ? storage.providerName : defaultProvName;
  const providerName = blankMode ? '' : savedName;

  const savedSig = storage.providerSignature || (storage.providerName && storage.providerName.startsWith('data:image') ? storage.providerName : (procedureData?.providerSignature || ''));
  const providerSigValue = blankMode ? '' : savedSig;
  const signatureDate = blankMode ? '' : (procedureData?.signatureDate || anikNote?.date || noteContent?.signatureDate || packetData?.signatureDate || '');

  // Helper to check if a specific CPT exists in a given date's lines
  const hasCpt = (lines, codePrefix) => Array.isArray(lines) && lines.some(l => l.cptCode && String(l.cptCode).startsWith(codePrefix));

  const hasArea = (keywords) => {
    return localInjuryAreas.some(a => {
      if (typeof a !== 'string') return false;
      const lower = a.toLowerCase();
      return keywords.some(k => lower.includes(k.toLowerCase()));
    });
  };

  const handleToggleArea = async (label, keywords) => {
    if (readOnly || blankMode) return;
    const isCurrentlyActive = hasArea(keywords);
    let nextAreas;
    if (isCurrentlyActive) {
      nextAreas = localInjuryAreas.filter(a => {
        if (typeof a !== 'string') return false;
        const lower = a.toLowerCase();
        return !keywords.some(k => lower.includes(k.toLowerCase()));
      });
    } else {
      nextAreas = [...localInjuryAreas, label];
    }
    setLocalInjuryAreas(nextAreas);

    if (packetData) {
      packetData.selectedInjuryAreas = nextAreas;
      if (packetData.patient) {
        packetData.patient.selectedInjuryAreas = nextAreas;
      }
      packetData.injuryBodyParts = nextAreas.join(', ');

      if (packetData.id) {
        try {
          const currentStorage = packetData.clinicalDocStorage || {};
          const docNamespace = currentStorage[docKey] || {};
          const updatedDoc = { ...docNamespace, treatmentAreas: nextAreas.join(', ') };
          const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };

          await apiCaseService.updateCase(packetData.id, {
            selectedInjuryAreas: nextAreas,
            injuryBodyParts: nextAreas.join(', '),
            clinicalDocStorage: updatedStorage
          });
          packetData.clinicalDocStorage = updatedStorage;

          if (addToast) {
            addToast(
              isCurrentlyActive ? `Removed ${label}` : `Selected ${label}`,
              'success'
            );
          }
        } catch (err) {
          console.error('Failed to sync injury area to DB:', err);
        }
      }
    }
  };

  const getInjuryMarks = () => {
    if (blankMode || !packetData) return [];
    
    const marks = ANATOMICAL_CHECKBOX_TARGETS.map(target => {
      const isChecked = hasArea(target.keywords);
      return (
        <div
          key={target.id}
          onClick={() => !readOnly && !blankMode && handleToggleArea(target.label, target.keywords)}
          title={readOnly || blankMode ? undefined : `${isChecked ? 'Remove' : 'Select'} ${target.label}`}
          className={`treatment-checkbox absolute flex items-center justify-center select-none ${
            readOnly || blankMode
              ? 'pointer-events-none'
              : 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-[#722F37] hover:bg-white/80 transition-all'
          } ${
            isChecked 
              ? 'bg-[#F9ECEC]/90 border border-[#722F37]' 
              : (!readOnly && !blankMode ? 'border border-dashed border-slate-400/80 bg-white/40' : 'border border-transparent')
          }`}
          style={{
            top: `${target.top}%`,
            left: `${target.left}%`,
            width: '18px',
            height: '18px',
            transform: 'translate(-50%, -50%)',
            pointerEvents: readOnly || blankMode ? 'none' : 'auto',
            cursor: readOnly || blankMode ? 'default' : 'pointer',
            zIndex: 15,
          }}
        >
          {isChecked && (
            <svg
              viewBox="0 0 16 16"
              className="w-full h-full text-[#722F37] stroke-current fill-none select-none drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.8)] p-0.5"
              style={{ strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}
            >
              <polyline points="2.8 8.2 6.4 12.2 13.5 3.8" />
            </svg>
          )}
        </div>
      );
    });

    if (hasArea(['other'])) {
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
      <div className="grid grid-cols-5 gap-2 text-xs font-mono border-b border-slate-300 pb-2 items-center">
        <div><span>Name:</span> <span className="break-words whitespace-normal px-1 font-bold">{patientName}</span></div>
        <div><span>DOB:</span> <span className="break-words whitespace-normal px-1 font-bold">{patientDob}</span></div>
        <div><span>SEX:</span> <span className="break-words whitespace-normal px-1 font-bold">{patientSex}</span></div>
        <div><span>DATE:</span> <span className="break-words whitespace-normal px-1 font-bold">{procedureDos}</span></div>
        <div className="flex items-center min-w-0">
          <span className="whitespace-nowrap font-bold text-slate-700">DOA:</span>
          <EditableClinicalField
            packetData={packetData}
            docKey={docKey}
            field="accidentDate"
            value={accidentDateText}
            placeholder="YYYY-MM-DD"
            readOnly={readOnly || blankMode}
            inputType="input"
            className="w-full h-6 px-1 ml-1 font-mono font-bold bg-transparent border-b border-dashed border-slate-400 focus:bg-amber-100"
          />
        </div>
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
            <button
              type="button"
              role="checkbox"
              aria-checked={procedureTolerated === 'YES'}
              aria-label="Procedure Tolerated YES"
              disabled={readOnly || blankMode}
              onClick={() => handleProcedureToleratedToggle('YES')}
              className={`border px-2 py-0.5 text-xs font-bold leading-normal transition-colors ${
                procedureTolerated === 'YES'
                  ? 'border-slate-700 bg-[#F9ECEC] text-[#722F37]'
                  : 'border-slate-300 text-slate-400'
              } ${readOnly || blankMode ? 'cursor-default' : 'cursor-pointer hover:border-slate-600'}`}
            >
              YES [{procedureTolerated === 'YES' ? '✓' : ' '}]
            </button>
            <button
              type="button"
              role="checkbox"
              aria-checked={procedureTolerated === 'NO'}
              aria-label="Procedure Tolerated NO"
              disabled={readOnly || blankMode}
              onClick={() => handleProcedureToleratedToggle('NO')}
              className={`border px-2 py-0.5 text-xs font-bold leading-normal transition-colors ${
                procedureTolerated === 'NO'
                  ? 'border-slate-700 bg-[#F9ECEC] text-[#722F37]'
                  : 'border-slate-300 text-slate-400'
              } ${readOnly || blankMode ? 'cursor-default' : 'cursor-pointer hover:border-slate-600'}`}
            >
              NO [{procedureTolerated === 'NO' ? '✓' : ' '}]
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span>DURATION COMPLETED:</span>
            <button
              type="button"
              role="checkbox"
              aria-checked={durationCompleted === 'YES'}
              aria-label="Duration Completed YES"
              disabled={readOnly || blankMode}
              onClick={() => handleDurationCompletedToggle('YES')}
              className={`border px-2 py-0.5 text-xs font-bold leading-normal transition-colors ${
                durationCompleted === 'YES'
                  ? 'border-slate-700 bg-[#F9ECEC] text-[#722F37]'
                  : 'border-slate-300 text-slate-400'
              } ${readOnly || blankMode ? 'cursor-default' : 'cursor-pointer hover:border-slate-600'}`}
            >
              YES [{durationCompleted === 'YES' ? '✓' : ' '}]
            </button>
            <button
              type="button"
              role="checkbox"
              aria-checked={durationCompleted === 'NO'}
              aria-label="Duration Completed NO"
              disabled={readOnly || blankMode}
              onClick={() => handleDurationCompletedToggle('NO')}
              className={`border px-2 py-0.5 text-xs font-bold leading-normal transition-colors ${
                durationCompleted === 'NO'
                  ? 'border-slate-700 bg-[#F9ECEC] text-[#722F37]'
                  : 'border-slate-300 text-slate-400'
              } ${readOnly || blankMode ? 'cursor-default' : 'cursor-pointer hover:border-slate-600'}`}
            >
              NO [{durationCompleted === 'NO' ? '✓' : ' '}]
            </button>
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
                value={blankMode ? '' : (storage.signatureDate !== undefined ? storage.signatureDate : signatureDate)}
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
