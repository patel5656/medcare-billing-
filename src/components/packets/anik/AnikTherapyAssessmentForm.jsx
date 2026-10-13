import React, { useState, useEffect, useRef } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { apiProviderService } from '../../../services/api/apiProviderService';
import fmLogo from '../../../assets/fm-logo.jpeg';

/**
 * Therapy Assessment Form (Dynamic)
 * Dynamic patient, diagnosis, serviceLines, and clinical assessment data
 */
export const AnikTherapyAssessmentForm = ({ readOnly = false, blankMode = false, packetData = null, serviceLines = [] }) => {
  const [assessments, setAssessments] = useState({});
  const [providers, setProviders] = useState({});
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (packetData?.clinicalDocStorage?.['ANIK_ASSESSMENT']) {
      setAssessments(packetData.clinicalDocStorage['ANIK_ASSESSMENT']);
    } else if (packetData?.assessments) {
      setAssessments(packetData.assessments);
    }

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

  const updateAssessment = async (date, field, value) => {
    if (readOnly || blankMode || !packetData || !packetData.id) return;
    
    setAssessments(prev => {
      const nextState = {
        ...prev,
        [date]: {
          ...(prev[date] || {}),
          [field]: value
        }
      };

      const currentStorage = packetData.clinicalDocStorage || {};
      const updatedStorage = { ...currentStorage, ['ANIK_ASSESSMENT']: nextState };
      
      apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage }).catch(err => {
        console.error('Failed to save assessment', err);
      });
      packetData.clinicalDocStorage = updatedStorage;

      return nextState;
    });
  };

  // Extract patient name
  const patientName = blankMode || !packetData
    ? ''
    : (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '');

  // Extract diagnosis
  const getDiagnosis = () => {
    if (blankMode || !packetData) return '';
    if (Array.isArray(packetData.diagnosisCodes) && packetData.diagnosisCodes.length > 0) {
      const cleaned = packetData.diagnosisCodes
        .map(d => (typeof d === 'string' ? d : (d.description || d.code || d.icdCode || '')).trim())
        .filter(Boolean);
      if (cleaned.length > 0) return cleaned.join(', ');
    }
    if (packetData.diagnosis) return packetData.diagnosis;
    if (Array.isArray(packetData.diagnoses) && packetData.diagnoses.length > 0) {
      const cleaned = packetData.diagnoses
        .map(d => (typeof d === 'string' ? d : (d.description || d.code || d.icdCode || '')).trim())
        .filter(Boolean);
      if (cleaned.length > 0) return cleaned.join(', ');
    }
    return '';
  };
  const diagnosisText = getDiagnosis();

  // Group service lines by Date of Service (dos)
  const linesToUse = (serviceLines && serviceLines.length > 0)
    ? serviceLines
    : (packetData?.serviceLines || packetData?.items || []);

  const dosGroups = {};
  if (!blankMode && Array.isArray(linesToUse) && linesToUse.length > 0) {
    linesToUse.forEach(line => {
      const dosKey = line.dos || line.dateOfService || line.date;
      if (!dosKey) return;
      if (!dosGroups[dosKey]) dosGroups[dosKey] = [];
      dosGroups[dosKey].push(line);
    });
  }

  const sortedDates = Object.keys(dosGroups).sort((a, b) => new Date(a) - new Date(b));
  // Display up to 3 dates to fit on a single page
  const displayDates = sortedDates.slice(0, 3);

  const isChecked = (fieldVal, key) => {
    if (!fieldVal) return false;
    if (Array.isArray(fieldVal)) return fieldVal.includes(key);
    if (typeof fieldVal === 'string') return fieldVal === key;
    return false;
  };

  const toggleAssessment = (dos, field, key) => {
    if (readOnly || blankMode) return;
    const currentVal = assessments[dos]?.[field];
    let currentList = [];
    if (Array.isArray(currentVal)) {
      currentList = [...currentVal];
    } else if (typeof currentVal === 'string' && currentVal) {
      currentList = [currentVal];
    }

    let nextList;
    if (currentList.includes(key)) {
      nextList = currentList.filter(item => item !== key);
    } else {
      nextList = [...currentList, key];
    }

    updateAssessment(dos, field, nextList);
  };

  const handleDoubleClick = (e, dos, field, key) => {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly || blankMode) return;
    const currentVal = assessments[dos]?.[field];
    let currentList = [];
    if (Array.isArray(currentVal)) {
      currentList = [...currentVal];
    } else if (typeof currentVal === 'string' && currentVal) {
      currentList = [currentVal];
    }
    const nextList = currentList.filter(item => item !== key);
    updateAssessment(dos, field, nextList);
  };

  // Helper to check if a specific CPT exists in a given date's lines
  const hasCpt = (lines, codePrefix) => lines.some(l => l.cptCode && String(l.cptCode).startsWith(codePrefix));
  const getCptUnits = (lines, codePrefix) => {
    const line = lines.find(l => l.cptCode && String(l.cptCode).startsWith(codePrefix));
    return line && line.units > 1 ? ` X${line.units}` : '';
  };

  const renderTreatmentsTable = (lines, dos) => {
    if (!selectedProvider || !selectedProvider.availableServices || selectedProvider.availableServices.length === 0) {
      return (
        <div className="p-4 text-center text-slate-400 font-bold border-b border-[#722F37]">
          No treatments available for the selected provider.
        </div>
      );
    }
    const services = selectedProvider.availableServices;
    
    // Group services into chunks of 5 for multiple rows if needed
    const chunks = [];
    for(let i = 0; i < services.length; i += 5) {
       chunks.push(services.slice(i, i + 5));
    }

    return (
      <table className="w-full text-center border-collapse">
        <tbody>
           {chunks.map((chunk, rowIdx) => (
              <React.Fragment key={rowIdx}>
                 <tr className="bg-slate-100 font-bold border-b border-[#722F37]">
                    <th className="p-1 border-r border-[#722F37] w-24">{rowIdx === 0 ? 'DATE' : ''}</th>
                    {chunk.map(svc => (
                       <th key={svc.code} className="p-1 border-r border-[#722F37] text-[9px] uppercase leading-tight">
                          {svc.description}<br/>{svc.code}
                       </th>
                    ))}
                    {/* Fill empty cells if chunk < 5 */}
                    {Array.from({length: 5 - chunk.length}).map((_, i) => (
                       <th key={`empty-th-${i}`} className="p-1 border-r border-[#722F37]"></th>
                    ))}
                 </tr>
                 <tr className="border-b border-[#722F37]">
                    <td className="p-1 border-r border-[#722F37] font-bold">{rowIdx === 0 ? dos : ''}</td>
                    {chunk.map(svc => (
                       <td key={svc.code} className="p-1 border-r border-[#722F37] font-bold text-[#722F37]">
                          {hasCpt(lines, svc.code) ? `✓${getCptUnits(lines, svc.code)}` : ''}
                       </td>
                    ))}
                    {Array.from({length: 5 - chunk.length}).map((_, i) => (
                       <td key={`empty-td-${i}`} className="p-1 border-r border-[#722F37]"></td>
                    ))}
                 </tr>
              </React.Fragment>
           ))}
        </tbody>
      </table>
    );
  };

  return (
    <div
      className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none"
      style={{ width: '850px', minHeight: '1100px' }}
    >
      
      {/* Top Utility Bar: Provider Selector & Screen Notice (Hidden on Print) */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 print:hidden text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Clinical Assessment Session</span>
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

      {/* Provider Header matching PDF Page 7 */}
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
        
        <h2 className="text-lg font-extrabold uppercase mt-4 text-slate-900 tracking-wider">THERAPY ASSESSMENT</h2>
      </div>

      {/* Patient & Diagnosis Banner */}
      <div className="space-y-1.5 text-xs font-mono font-bold border-b border-slate-300 pb-2">
        <div className="flex gap-2">
          <span>PATIENT NAME:</span>
          {!patientName ? (
            <div className="border-b border-slate-400 mt-1 w-48">&nbsp;</div>
          ) : (
            <span className="text-slate-900">{patientName}</span>
          )}
        </div>
        <div className="flex gap-2">
          <span>DIAGNOSIS:</span>
          {!diagnosisText ? (
            <div className="border-b border-slate-400 mt-1 w-64">&nbsp;</div>
          ) : (
            <span className="text-slate-900 font-mono font-bold">{diagnosisText}</span>
          )}
        </div>
      </div>

      {/* Dynamic Session Rendering */}
      {displayDates.map((dos) => {
        const lines = dosGroups[dos];
        const state = assessments[dos] || {};
        const currentTol = state.tol || '';
        const currentImp = state.imp || '';
        const currentCare = state.care || '';

        return (
          <div key={dos} className="space-y-2 pt-2">
            <div className="border border-[#722F37] text-[10px] font-mono">
              {renderTreatmentsTable(lines, dos)}
            </div>

            {/* Assessment Underlines */}
            <div className="text-[10px] space-y-1.5 font-mono pt-1">
              <p className="font-bold">ASSESSMENT:</p>
              <div className="flex items-center gap-6">
                <span>PATIENT TOLERANCE TO TREATMENT:</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAssessment(dos, 'tol', 'WELL')}
                  onDoubleClick={(e) => handleDoubleClick(e, dos, 'tol', 'WELL')}
                  className="cursor-pointer select-none hover:text-[#722F37] transition-colors inline-flex items-center"
                  title="Click to toggle, double-click to remove"
                >
                  <span>{isChecked(currentTol, 'WELL') ? '__' : '____'}</span>
                  {isChecked(currentTol, 'WELL') && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{isChecked(currentTol, 'WELL') ? '__ WELL' : ' WELL'}</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAssessment(dos, 'tol', 'FAIRLY')}
                  onDoubleClick={(e) => handleDoubleClick(e, dos, 'tol', 'FAIRLY')}
                  className="cursor-pointer select-none hover:text-[#722F37] transition-colors inline-flex items-center"
                  title="Click to toggle, double-click to remove"
                >
                  <span>{isChecked(currentTol, 'FAIRLY') ? '__' : '____'}</span>
                  {isChecked(currentTol, 'FAIRLY') && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{isChecked(currentTol, 'FAIRLY') ? '__ FAIRLY' : ' FAIRLY'}</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAssessment(dos, 'tol', 'POORLY')}
                  onDoubleClick={(e) => handleDoubleClick(e, dos, 'tol', 'POORLY')}
                  className="cursor-pointer select-none hover:text-[#722F37] transition-colors inline-flex items-center"
                  title="Click to toggle, double-click to remove"
                >
                  <span>{isChecked(currentTol, 'POORLY') ? '__' : '____'}</span>
                  {isChecked(currentTol, 'POORLY') && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{isChecked(currentTol, 'POORLY') ? '__ POORLY' : ' POORLY'}</span>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span>APPEARS TO BE:</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAssessment(dos, 'imp', 'IMPROVING')}
                  onDoubleClick={(e) => handleDoubleClick(e, dos, 'imp', 'IMPROVING')}
                  className="cursor-pointer select-none hover:text-[#722F37] transition-colors inline-flex items-center"
                  title="Click to toggle, double-click to remove"
                >
                  <span>{isChecked(currentImp, 'IMPROVING') ? '__' : '____'}</span>
                  {isChecked(currentImp, 'IMPROVING') && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{isChecked(currentImp, 'IMPROVING') ? '__ IMPROVING' : ' IMPROVING'}</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAssessment(dos, 'imp', 'IMPROVING_SLOWLY')}
                  onDoubleClick={(e) => handleDoubleClick(e, dos, 'imp', 'IMPROVING_SLOWLY')}
                  className="cursor-pointer select-none hover:text-[#722F37] transition-colors inline-flex items-center"
                  title="Click to toggle, double-click to remove"
                >
                  <span>{isChecked(currentImp, 'IMPROVING_SLOWLY') ? '__' : '____'}</span>
                  {isChecked(currentImp, 'IMPROVING_SLOWLY') && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{isChecked(currentImp, 'IMPROVING_SLOWLY') ? '__ IMPROVING SLOWLY' : ' IMPROVING SLOWLY'}</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAssessment(dos, 'imp', 'NO_CHANGE')}
                  onDoubleClick={(e) => handleDoubleClick(e, dos, 'imp', 'NO_CHANGE')}
                  className="cursor-pointer select-none hover:text-[#722F37] transition-colors inline-flex items-center"
                  title="Click to toggle, double-click to remove"
                >
                  <span>{isChecked(currentImp, 'NO_CHANGE') ? '__' : '____'}</span>
                  {isChecked(currentImp, 'NO_CHANGE') && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{isChecked(currentImp, 'NO_CHANGE') ? '__ NO CHANGE' : ' NO CHANGE'}</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAssessment(dos, 'imp', 'GETTING_WORSE')}
                  onDoubleClick={(e) => handleDoubleClick(e, dos, 'imp', 'GETTING_WORSE')}
                  className="cursor-pointer select-none hover:text-[#722F37] transition-colors inline-flex items-center"
                  title="Click to toggle, double-click to remove"
                >
                  <span>{isChecked(currentImp, 'GETTING_WORSE') ? '__' : '____'}</span>
                  {isChecked(currentImp, 'GETTING_WORSE') && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{isChecked(currentImp, 'GETTING_WORSE') ? '__ GETTING WORSE' : ' GETTING WORSE'}</span>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span>PATIENT CONTINUES TO HAVE:</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAssessment(dos, 'care', 'CONTINUES_CARE')}
                  onDoubleClick={(e) => handleDoubleClick(e, dos, 'care', 'CONTINUES_CARE')}
                  className="cursor-pointer select-none hover:text-[#722F37] transition-colors inline-flex items-center"
                  title="Click to toggle, double-click to remove"
                >
                  <span>{isChecked(currentCare, 'CONTINUES_CARE') ? '__' : '____'}</span>
                  {isChecked(currentCare, 'CONTINUES_CARE') && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{isChecked(currentCare, 'CONTINUES_CARE') ? '__ CONTINUES PRESENT CARE' : ' CONTINUES PRESENT CARE'}</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAssessment(dos, 'care', 'REEVALUATE')}
                  onDoubleClick={(e) => handleDoubleClick(e, dos, 'care', 'REEVALUATE')}
                  className="cursor-pointer select-none hover:text-[#722F37] transition-colors inline-flex items-center"
                  title="Click to toggle, double-click to remove"
                >
                  <span>{isChecked(currentCare, 'REEVALUATE') ? '__' : '____'}</span>
                  {isChecked(currentCare, 'REEVALUATE') && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{isChecked(currentCare, 'REEVALUATE') ? '__ REEVALUATE DUE TO CHANGES IN CONDITION' : ' REEVALUATE DUE TO CHANGES IN CONDITION'}</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleAssessment(dos, 'care', '30_DAY_REEVA')}
                  onDoubleClick={(e) => handleDoubleClick(e, dos, 'care', '30_DAY_REEVA')}
                  className="cursor-pointer select-none hover:text-[#722F37] transition-colors inline-flex items-center"
                  title="Click to toggle, double-click to remove"
                >
                  <span>{isChecked(currentCare, '30_DAY_REEVA') ? '__' : '____'}</span>
                  {isChecked(currentCare, '30_DAY_REEVA') && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{isChecked(currentCare, '30_DAY_REEVA') ? '__ 30 DAY RE-EVA' : ' 30 DAY RE-EVA'}</span>
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {displayDates.length === 0 && !blankMode && (
        <div className="text-center text-slate-400 py-10 font-bold text-xs border border-dashed border-slate-300">
          No Service Lines Found For This Provider
        </div>
      )}

    </div>
  );
};
