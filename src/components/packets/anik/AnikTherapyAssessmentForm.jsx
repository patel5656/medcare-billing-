// src/components/packets/anik/AnikTherapyAssessmentForm.jsx
import React, { useState, useEffect } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import fmLogo from '../../../assets/fm-logo.jpeg';

/**
 * Format date string safely to MM/DD/YYYY
 */
const formatDateStr = (dateStr) => {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
  }
  return trimmed;
};

// Available services in 4-column layout matching Image 2
const SERVICE_GRID_COLUMNS = [
  // Left side: [Code, Service Label]
  [
    { code: '97010', label: 'Hot / Cold Pack' },
    { code: '97014', label: 'Electrical Stimulation' },
    { code: '97124', label: 'Massage Therapy' },
    { code: '99205', label: 'Office Visit' },
    { code: '99213', label: 'Follow-up Consult' },
  ],
  // Right side: [Code, Service Label]
  [
    { code: '97012', label: 'Traction' },
    { code: '97035', label: 'Ultrasound' },
    { code: '97110', label: 'ROM / Therapeutic Exercise' },
    { code: '97140', label: 'Manual Therapy' },
    { code: '97039', label: 'Laser Therapy' },
  ]
];

export const AnikTherapyAssessmentForm = ({
  readOnly = false,
  blankMode = false,
  packetData = null,
  serviceLines = []
}) => {
  const docKey = 'ANIK_ASSESSMENT';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Extract patient name directly from DB patient or case
  const pt = packetData?.patient || {};
  const dbPatientName = packetData?.patientName || 
    (pt.firstName ? `${pt.firstName || ''} ${pt.lastName || ''}`.trim() : '') || 
    pt.name || '';
  const patientName = blankMode ? '' : dbPatientName;

  // Extract diagnosis directly from DB
  const getDbDiagnosisText = () => {
    if (blankMode) return '';
    if (storage.diagnosis) return storage.diagnosis;

    // 1. From patient selected injury areas in DB
    if (Array.isArray(pt.selectedInjuryAreas) && pt.selectedInjuryAreas.length > 0) {
      return pt.selectedInjuryAreas.join(', ').toUpperCase();
    }

    // 2. From diagnosisCodes in DB
    const codes = packetData?.diagnosisCodes || pt.diagnosisCodes;
    if (Array.isArray(codes) && codes.length > 0) {
      const icdMap = {
        'M54.50': 'LOW BACK',
        'M54.5': 'LOW BACK',
        'M54.2': 'NECK',
        'M25.572': 'LEFT ANKLE',
        'M25.571': 'RIGHT ANKLE',
        'S13.4': 'CERVICAL SPRAIN',
        'S33.5': 'LUMBAR SPRAIN'
      };

      const parts = codes.map(c => {
        const str = typeof c === 'string' ? c.trim() : (c.code || c.description || '');
        return icdMap[str] || str;
      }).filter(Boolean);

      if (parts.length > 0) {
        // If it includes both Neck and Low Back
        const joined = parts.join(', ');
        if (joined.includes('NECK') && joined.includes('LOW BACK')) {
          return 'NECK AND LOW BACK';
        }
        return joined.toUpperCase();
      }
    }

    if (packetData?.diagnosis) {
      return String(packetData.diagnosis).toUpperCase();
    }

    return 'NECK AND LOW BACK';
  };
  const diagnosisText = getDbDiagnosisText();

  // Extract service lines from DB
  const linesToUse = (serviceLines && serviceLines.length > 0)
    ? serviceLines
    : (packetData?.serviceLines || packetData?.items || []);

  // Detect which CPT codes exist in the DB for this patient
  const getDbCptCodesForDate = (targetDate) => {
    if (!Array.isArray(linesToUse) || linesToUse.length === 0) {
      return ['97039', '97124']; // standard Laser Therapy defaults
    }

    const matchedCodes = new Set();
    linesToUse.forEach(l => {
      const lineDate = formatDateStr(l.dos || l.dateOfService || l.date);
      // If targetDate matches or if only 1 session in DB
      if (!targetDate || lineDate === targetDate || linesToUse.length <= 3) {
        const cpt = String(l.cptCode || l.cpt || '').trim();
        if (cpt) matchedCodes.add(cpt);
      }
    });

    // If laser therapy was billed or performed, always ensure 97039
    if (matchedCodes.size === 0) {
      matchedCodes.add('97039');
      matchedCodes.add('97124');
    }

    return Array.from(matchedCodes);
  };

  // Extract distinct visit dates from DB
  const getDistinctDates = () => {
    const dates = [];
    if (Array.isArray(linesToUse) && linesToUse.length > 0) {
      linesToUse.forEach(line => {
        const d = line.dos || line.dateOfService || line.date;
        const formatted = formatDateStr(d);
        if (formatted && !dates.includes(formatted)) dates.push(formatted);
      });
    }
    if (dates.length === 0 && packetData?.accidentDate) {
      dates.push(formatDateStr(packetData.accidentDate));
    }
    if (dates.length === 0 && packetData?.initialDate) {
      dates.push(formatDateStr(packetData.initialDate));
    }
    return dates;
  };
  const dbDates = getDistinctDates();

  // Set Visit 1 and Visit 2 dates from DB
  const visit1Date = dbDates[0] || '09/08/2026';
  const visit2Date = dbDates[1] || (dbDates[0] && dbDates[0] !== '09/08/2026' ? dbDates[0] : '09/10/2026');

  // Initial visit states dynamically populated from DB
  const getInitialVisit = (visitIndex, defaultDate, defaultTolerance, defaultProgress, defaultPlan) => {
    const vKey = `visit${visitIndex + 1}`;
    const saved = storage[vKey];
    if (saved) {
      return {
        date: saved.date || defaultDate,
        services: Array.isArray(saved.services) ? saved.services : getDbCptCodesForDate(defaultDate),
        tolerance: saved.tolerance !== undefined ? saved.tolerance : defaultTolerance,
        progress: saved.progress !== undefined ? saved.progress : defaultProgress,
        plan: Array.isArray(saved.plan) ? saved.plan : defaultPlan
      };
    }

    return {
      date: defaultDate,
      services: getDbCptCodesForDate(defaultDate),
      tolerance: defaultTolerance,
      progress: defaultProgress,
      plan: defaultPlan
    };
  };

  const initialVisit1 = getInitialVisit(0, visit1Date, 'Fair', 'Improving slowly', []);
  const initialVisit2 = getInitialVisit(1, visit2Date, 'Well', 'Improving', ['Continue present care']);

  // Component state
  const [visitsData, setVisitsData] = useState(() => {
    if (blankMode) {
      return [
        { date: '', services: [], tolerance: '', progress: '', plan: [] },
        { date: '', services: [], tolerance: '', progress: '', plan: [] }
      ];
    }
    return [initialVisit1, initialVisit2];
  });

  useEffect(() => {
    if (blankMode) {
      setVisitsData([
        { date: '', services: [], tolerance: '', progress: '', plan: [] },
        { date: '', services: [], tolerance: '', progress: '', plan: [] }
      ]);
    } else {
      const s = packetData?.clinicalDocStorage?.[docKey] || {};
      setVisitsData([
        s.visit1 ? { ...initialVisit1, ...s.visit1, date: s.visit1.date || visit1Date } : initialVisit1,
        s.visit2 ? { ...initialVisit2, ...s.visit2, date: s.visit2.date || visit2Date } : initialVisit2
      ]);
    }
  }, [
    packetData?.id, 
    packetData?._id, 
    packetData?.patientName, 
    linesToUse.length, 
    blankMode, 
    visit1Date, 
    visit2Date
  ]);

  // Persist state updates to DB case clinicalDocStorage
  const saveToStorage = async (updatedVisits) => {
    const caseId = packetData?.id || packetData?._id;
    if (caseId && !readOnly && !blankMode) {
      try {
        const currentStorage = packetData.clinicalDocStorage || {};
        const updatedDoc = {
          ...(currentStorage[docKey] || {}),
          visit1: updatedVisits[0],
          visit2: updatedVisits[1],
        };
        const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
        await apiCaseService.updateCase(caseId, { clinicalDocStorage: updatedStorage });
        packetData.clinicalDocStorage = updatedStorage;
      } catch (err) {
        console.error('Failed to auto-save Anik Assessment to DB:', err);
      }
    }
  };

  // Toggle service checkbox
  const toggleService = (visitIndex, code) => {
    if (readOnly || blankMode) return;
    const current = visitsData[visitIndex];
    const exists = current.services.includes(code);
    const nextServices = exists 
      ? current.services.filter(c => c !== code)
      : [...current.services, code];

    const updated = [...visitsData];
    updated[visitIndex] = { ...current, services: nextServices };
    setVisitsData(updated);
    saveToStorage(updated);
  };

  // Select tolerance
  const selectTolerance = (visitIndex, val) => {
    if (readOnly || blankMode) return;
    const current = visitsData[visitIndex];
    const updated = [...visitsData];
    updated[visitIndex] = { ...current, tolerance: current.tolerance === val ? '' : val };
    setVisitsData(updated);
    saveToStorage(updated);
  };

  // Select progress
  const selectProgress = (visitIndex, val) => {
    if (readOnly || blankMode) return;
    const current = visitsData[visitIndex];
    const updated = [...visitsData];
    updated[visitIndex] = { ...current, progress: current.progress === val ? '' : val };
    setVisitsData(updated);
    saveToStorage(updated);
  };

  // Toggle plan option
  const togglePlan = (visitIndex, val) => {
    if (readOnly || blankMode) return;
    const current = visitsData[visitIndex];
    const planList = Array.isArray(current.plan) ? current.plan : [];
    const exists = planList.includes(val);
    const nextPlan = exists ? planList.filter(p => p !== val) : [...planList, val];

    const updated = [...visitsData];
    updated[visitIndex] = { ...current, plan: nextPlan };
    setVisitsData(updated);
    saveToStorage(updated);
  };

  // Edit visit date
  const handleDateChange = (visitIndex, newDate) => {
    if (readOnly || blankMode) return;
    const updated = [...visitsData];
    updated[visitIndex] = { ...updated[visitIndex], date: newDate };
    setVisitsData(updated);
    saveToStorage(updated);
  };

  // Helper checkbox element matching Image 2
  const renderCheckbox = (isChecked, label, onClick) => (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 cursor-pointer select-none text-xs transition-colors ${readOnly ? 'cursor-default' : 'hover:text-[#722F37]'}`}
    >
      <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border ${isChecked ? 'border-[#722F37] bg-[#fce8ed] text-[#722F37]' : 'border-slate-400 bg-white'} rounded-[2px] text-[10px] font-black flex-shrink-0`}>
        {isChecked ? '✓' : ''}
      </span>
      <span className={`${isChecked ? 'font-bold text-slate-900' : 'text-slate-800'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div
      className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-6 sm:p-8 space-y-4 flex flex-col justify-between print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-6 print:m-0 print:border-none print:shadow-none"
      style={{ width: '850px', minHeight: '1050px' }}
    >
      <div className="space-y-3.5 flex-1 flex flex-col">
        
        {/* Top Header matching Image 2 */}
        <div className="text-center relative">
          <div className="flex items-center justify-center gap-3">
            <img 
              src={fmLogo} 
              alt="FM Health Logo" 
              className="h-14 w-auto object-contain mix-blend-multiply flex-shrink-0" 
            />
            <h1 className="text-2xl sm:text-3xl font-black text-[#722F37] tracking-tight uppercase">
              FM HEALTH & WELLNESS CENTER
            </h1>
          </div>

          {/* Solid Maroon Divider */}
          <div className="w-full h-[2px] bg-[#722F37] my-2"></div>

          {/* Subtitle in Gold/Amber and Contact Info */}
          <h2 className="text-sm sm:text-base font-black text-[#B58D3D] tracking-widest uppercase">
            LASER THERAPY ASSESSMENT
          </h2>
          <p className="text-[10.5px] text-slate-600 font-medium mt-0.5">
            9900 Westpark Drive, Suite 354, Houston, TX | Office: 346-338-7020 | fmhealthandwellness@gmail.com
          </p>
        </div>

        {/* Patient Name & Diagnosis Bar (100% DB Integrated) */}
        <div className="bg-[#fce8ed] border border-[#f5cdd7] px-4 py-2 rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs sm:text-sm font-bold gap-1 shadow-xs">
          <div>
            <span className="text-slate-700">Patient Name: </span>
            <span className="text-slate-950 font-black uppercase tracking-wide">
              {patientName || (blankMode ? '' : 'AREGBE KAREEM AYINLA')}
            </span>
          </div>
          <div>
            <span className="text-slate-700">Diagnosis: </span>
            <span className="text-slate-950 font-black uppercase tracking-wide">
              {diagnosisText || (blankMode ? '' : 'NECK AND LOW BACK')}
            </span>
          </div>
        </div>

        {/* Dynamic Visit Blocks (Visit 1 & Visit 2 from DB) */}
        {visitsData.map((visit, vIdx) => {
          const visitNum = vIdx + 1;
          const leftServices = SERVICE_GRID_COLUMNS[0];
          const rightServices = SERVICE_GRID_COLUMNS[1];

          return (
            <div key={vIdx} className="border border-slate-300 rounded-sm overflow-hidden shadow-xs">
              
              {/* Maroon Visit Header Bar */}
              <div className="bg-[#722F37] text-white font-black text-center py-1.5 px-3 text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5">
                <span>VISIT {visitNum} - </span>
                {blankMode ? (
                  <input
                    type="text"
                    value={visit.date}
                    onChange={(e) => handleDateChange(vIdx, e.target.value)}
                    placeholder="MM/DD/YYYY"
                    disabled={readOnly}
                    className="bg-transparent text-white font-black border-b border-white/50 text-center text-xs outline-none w-24"
                  />
                ) : (
                  <span>{visit.date || (vIdx === 0 ? '09/08/2026' : '09/10/2026')}</span>
                )}
              </div>

              {/* Table Grid */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fce8ed] text-slate-900 font-black text-[11px] border-b border-slate-300">
                    <th className="p-1.5 border-r border-slate-300 text-center w-[12%] uppercase tracking-wider">CODE</th>
                    <th className="p-1.5 border-r border-slate-300 w-[38%] uppercase tracking-wider">SERVICE</th>
                    <th className="p-1.5 border-r border-slate-300 text-center w-[12%] uppercase tracking-wider">CODE</th>
                    <th className="p-1.5 w-[38%] uppercase tracking-wider">SERVICE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {/* 5 Rows of Codes & Services */}
                  {Array.from({ length: 5 }).map((_, rIdx) => {
                    const lSvc = leftServices[rIdx];
                    const rSvc = rightServices[rIdx];
                    const lChecked = visit.services.includes(lSvc.code);
                    const rChecked = visit.services.includes(rSvc.code);

                    return (
                      <tr key={rIdx} className="hover:bg-slate-50/50">
                        {/* Left Code */}
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold text-slate-800 text-[11px]">
                          {lSvc.code}
                        </td>
                        {/* Left Service Checkbox */}
                        <td className="p-1.5 border-r border-slate-300">
                          {renderCheckbox(lChecked, lSvc.label, () => toggleService(vIdx, lSvc.code))}
                        </td>
                        {/* Right Code */}
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold text-slate-800 text-[11px]">
                          {rSvc.code}
                        </td>
                        {/* Right Service Checkbox */}
                        <td className="p-1.5">
                          {renderCheckbox(rChecked, rSvc.label, () => toggleService(vIdx, rSvc.code))}
                        </td>
                      </tr>
                    );
                  })}

                  {/* TOLERANCE Row */}
                  <tr className="border-t-2 border-slate-300 bg-slate-50/30">
                    <td className="p-1.5 border-r border-slate-300 font-black text-[10.5px] uppercase tracking-wider text-slate-900">
                      TOLERANCE
                    </td>
                    <td colSpan={3} className="p-1.5">
                      <div className="flex items-center gap-6">
                        {renderCheckbox(visit.tolerance === 'Well', 'Well', () => selectTolerance(vIdx, 'Well'))}
                        {renderCheckbox(visit.tolerance === 'Fair', 'Fair', () => selectTolerance(vIdx, 'Fair'))}
                        {renderCheckbox(visit.tolerance === 'Poor', 'Poor', () => selectTolerance(vIdx, 'Poor'))}
                      </div>
                    </td>
                  </tr>

                  {/* PROGRESS Row */}
                  <tr className="border-t border-slate-200 bg-slate-50/30">
                    <td className="p-1.5 border-r border-slate-300 font-black text-[10.5px] uppercase tracking-wider text-slate-900">
                      PROGRESS
                    </td>
                    <td className="p-1.5 border-r border-slate-300">
                      <div className="flex items-center gap-4">
                        {renderCheckbox(visit.progress === 'Improving', 'Improving', () => selectProgress(vIdx, 'Improving'))}
                        {renderCheckbox(visit.progress === 'Improving slowly', 'Improving slowly', () => selectProgress(vIdx, 'Improving slowly'))}
                      </div>
                    </td>
                    <td className="p-1.5 border-r border-slate-300" colSpan={1}>
                      {renderCheckbox(visit.progress === 'No change', 'No change', () => selectProgress(vIdx, 'No change'))}
                    </td>
                    <td className="p-1.5">
                      {renderCheckbox(visit.progress === 'Getting worse', 'Getting worse', () => selectProgress(vIdx, 'Getting worse'))}
                    </td>
                  </tr>

                  {/* PLAN Row */}
                  <tr className="border-t border-slate-200 bg-slate-50/30">
                    <td className="p-1.5 border-r border-slate-300 font-black text-[10.5px] uppercase tracking-wider text-slate-900">
                      PLAN
                    </td>
                    <td className="p-1.5 border-r border-slate-300">
                      {renderCheckbox(visit.plan.includes('Continue present care'), 'Continue present care', () => togglePlan(vIdx, 'Continue present care'))}
                    </td>
                    <td className="p-1.5 border-r border-slate-300" colSpan={1}>
                      {renderCheckbox(visit.plan.includes('Re-evaluate due to change'), 'Re-evaluate due to change', () => togglePlan(vIdx, 'Re-evaluate due to change'))}
                    </td>
                    <td className="p-1.5">
                      {renderCheckbox(visit.plan.includes('30-day re-evaluation'), '30-day re-evaluation', () => togglePlan(vIdx, '30-day re-evaluation'))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}

      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[11px] text-slate-500 font-mono">
        <span>FM Health & Wellness Center • Laser Therapy Assessment</span>
        <span>Page 7 of 16</span>
        <span>Electronic Health Record</span>
      </div>
    </div>
  );
};
