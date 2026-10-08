import React, { useState, useEffect } from 'react';
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
      
      {/* Provider Header matching PDF Page 7 */}
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
                <label className="cursor-pointer hover:opacity-80 transition-opacity duration-100">
                  <input type="radio" name={`tol-${dos}`} checked={currentTol === 'WELL'} onChange={() => updateAssessment(dos, 'tol', 'WELL')} className="hidden" />
                  <span>{currentTol === 'WELL' ? '__' : '____'}</span>
                  {currentTol === 'WELL' && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{currentTol === 'WELL' ? '__ WELL' : ' WELL'}</span>
                </label>
                <label className="cursor-pointer hover:opacity-80 transition-opacity duration-100">
                  <input type="radio" name={`tol-${dos}`} checked={currentTol === 'FAIRLY'} onChange={() => updateAssessment(dos, 'tol', 'FAIRLY')} className="hidden" />
                  <span>{currentTol === 'FAIRLY' ? '__' : '____'}</span>
                  {currentTol === 'FAIRLY' && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{currentTol === 'FAIRLY' ? '__ FAIRLY' : ' FAIRLY'}</span>
                </label>
                <label className="cursor-pointer hover:opacity-80 transition-opacity duration-100">
                  <input type="radio" name={`tol-${dos}`} checked={currentTol === 'POORLY'} onChange={() => updateAssessment(dos, 'tol', 'POORLY')} className="hidden" />
                  <span>{currentTol === 'POORLY' ? '__' : '____'}</span>
                  {currentTol === 'POORLY' && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{currentTol === 'POORLY' ? '__ POORLY' : ' POORLY'}</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <span>APPEARS TO BE:</span>
                <label className="cursor-pointer hover:opacity-80 transition-opacity duration-100">
                  <input type="radio" name={`imp-${dos}`} checked={currentImp === 'IMPROVING'} onChange={() => updateAssessment(dos, 'imp', 'IMPROVING')} className="hidden" />
                  <span>{currentImp === 'IMPROVING' ? '__' : '____'}</span>
                  {currentImp === 'IMPROVING' && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{currentImp === 'IMPROVING' ? '__ IMPROVING' : ' IMPROVING'}</span>
                </label>
                <label className="cursor-pointer hover:opacity-80 transition-opacity duration-100">
                  <input type="radio" name={`imp-${dos}`} checked={currentImp === 'IMPROVING_SLOWLY'} onChange={() => updateAssessment(dos, 'imp', 'IMPROVING_SLOWLY')} className="hidden" />
                  <span>{currentImp === 'IMPROVING_SLOWLY' ? '__' : '____'}</span>
                  {currentImp === 'IMPROVING_SLOWLY' && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{currentImp === 'IMPROVING_SLOWLY' ? '__ IMPROVING SLOWLY' : ' IMPROVING SLOWLY'}</span>
                </label>
                <label className="cursor-pointer hover:opacity-80 transition-opacity duration-100">
                  <input type="radio" name={`imp-${dos}`} checked={currentImp === 'NO_CHANGE'} onChange={() => updateAssessment(dos, 'imp', 'NO_CHANGE')} className="hidden" />
                  <span>{currentImp === 'NO_CHANGE' ? '__' : '____'}</span>
                  {currentImp === 'NO_CHANGE' && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{currentImp === 'NO_CHANGE' ? '__ NO CHANGE' : ' NO CHANGE'}</span>
                </label>
                <label className="cursor-pointer hover:opacity-80 transition-opacity duration-100">
                  <input type="radio" name={`imp-${dos}`} checked={currentImp === 'GETTING_WORSE'} onChange={() => updateAssessment(dos, 'imp', 'GETTING_WORSE')} className="hidden" />
                  <span>{currentImp === 'GETTING_WORSE' ? '__' : '____'}</span>
                  {currentImp === 'GETTING_WORSE' && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{currentImp === 'GETTING_WORSE' ? '__ GETTING WORSE' : ' GETTING WORSE'}</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <span>PATIENT CONTINUES TO HAVE:</span>
                <label className="cursor-pointer hover:opacity-80 transition-opacity duration-100">
                  <input type="radio" name={`care-${dos}`} checked={currentCare === 'CONTINUES_CARE'} onChange={() => updateAssessment(dos, 'care', 'CONTINUES_CARE')} className="hidden" />
                  <span>{currentCare === 'CONTINUES_CARE' ? '__' : '____'}</span>
                  {currentCare === 'CONTINUES_CARE' && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{currentCare === 'CONTINUES_CARE' ? '__ CONTINUES PRESENT CARE' : ' CONTINUES PRESENT CARE'}</span>
                </label>
                <label className="cursor-pointer hover:opacity-80 transition-opacity duration-100">
                  <input type="radio" name={`care-${dos}`} checked={currentCare === 'REEVALUATE'} onChange={() => updateAssessment(dos, 'care', 'REEVALUATE')} className="hidden" />
                  <span>{currentCare === 'REEVALUATE' ? '__' : '____'}</span>
                  {currentCare === 'REEVALUATE' && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{currentCare === 'REEVALUATE' ? '__ REEVALUATE DUE TO CHANGES IN CONDITION' : ' REEVALUATE DUE TO CHANGES IN CONDITION'}</span>
                </label>
                <label className="cursor-pointer hover:opacity-80 transition-opacity duration-100">
                  <input type="radio" name={`care-${dos}`} checked={currentCare === '30_DAY_REEVA'} onChange={() => updateAssessment(dos, 'care', '30_DAY_REEVA')} className="hidden" />
                  <span>{currentCare === '30_DAY_REEVA' ? '__' : '____'}</span>
                  {currentCare === '30_DAY_REEVA' && <strong className="text-slate-900 font-black">✓</strong>}
                  <span>{currentCare === '30_DAY_REEVA' ? '__ 30 DAY RE-EVA' : ' 30 DAY RE-EVA'}</span>
                </label>
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
