// src/components/packets/josmic/JosmicPainManagementReport.jsx
import React from 'react';

const CB = ({ checked = false, label, blankMode }) => (
  <span className="inline-flex items-center gap-1 mr-3 text-[11px]">
    <span className="w-3.5 h-3.5 border border-slate-600 inline-flex items-center justify-center text-[10px] font-bold bg-white flex-shrink-0">
      {!blankMode && checked ? '✓' : ''}
    </span>
    {label}
  </span>
);

const FieldLine = ({ label, value, blankMode, width = '180px' }) => (
  <div className="flex items-center gap-1.5 text-[11px] mb-1">
    {label && <span className="font-bold text-slate-700 whitespace-nowrap">{label}</span>}
    <div className="border-b border-slate-500 pb-0.5" style={{ width }}>
      {!blankMode ? value : ''}&nbsp;
    </div>
  </div>
);

const SectionHeader = ({ children }) => (
  <h2 className="font-bold text-slate-900 text-[12px] uppercase mt-5 mb-2 border-b border-slate-300 pb-1">{children}</h2>
);

const getPainDescriptionChecked = (label, packetData) => {
  if (!packetData) return false;
  const pd = packetData.painDescription || packetData.painType || packetData.painCategory;
  if (Array.isArray(pd)) return pd.includes(label);
  if (typeof pd === 'string') return pd.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getPainLocationChecked = (label, packetData) => {
  if (!packetData) return false;
  
  // 1. Patient Profile - "Chief Complaints & Injury Areas" Mapping
  const injuryAreas = packetData.selectedInjuryAreas || packetData.patient?.selectedInjuryAreas || [];
  const injuryText = Array.isArray(injuryAreas) ? injuryAreas.join(' ').toLowerCase() : String(injuryAreas).toLowerCase();
  
  if (label === 'Neck' && injuryText.includes('neck')) return true;
  if (label === 'M.Back' && injuryText.includes('mid back')) return true;
  if (label === 'L.Back' && injuryText.includes('lower back')) return true;
  if ((label === 'R.Shoulder' || label === 'L.Shoulder') && injuryText.includes('shoulder')) return true;
  if ((label === 'R.Knee' || label === 'L.Knee') && injuryText.includes('knee')) return true;
  if (label === 'Headache' && injuryText.includes('headache')) return true;

  // 2. Original Form Fields Mapping
  const locs = packetData.painLocation || packetData.injuryBodyParts;
  if (Array.isArray(locs)) {
    if (locs.some(l => l.toLowerCase().includes(label.toLowerCase()))) return true;
  }
  if (typeof locs === 'string' && locs) {
    if (locs.toLowerCase().includes(label.toLowerCase())) return true;
  }
  
  // 3. ICD-10 Code Mapping
  const dx = packetData.diagnosisCodes || [];
  if (label === 'Neck' && dx.some(c => String(c).startsWith('S13') || String(c).startsWith('M54.2'))) return true;
  if (label === 'U.Back' && dx.some(c => String(c).startsWith('S13') || String(c).startsWith('S23'))) return true;
  if (label === 'M.Back' && dx.some(c => String(c).startsWith('S23'))) return true;
  if (label === 'L.Back' && dx.some(c => String(c).startsWith('S33') || String(c).startsWith('M54.5') || String(c).startsWith('M54.6'))) return true;
  
  return false;
};

const getMechanismChecked = (label, packetData) => {
  if (!packetData) return false;
  const type = packetData.accidentType || '';
  const mech = packetData.mechanismOfInjury || '';

  if (label === 'Motor vehicle accident') {
    return type === 'AUTO_ACCIDENT' || /motor vehicle|auto|car|mva/i.test(mech);
  }
  if (label === 'Slip and Fall') {
    return type === 'SLIP_AND_FALL' || /slip|fall/i.test(mech);
  }
  if (label === 'Workplace injury') {
    return type === 'WORKERS_COMP' || /work|warehouse|job/i.test(mech);
  }
  if (label === 'Sports injury') {
    return type === 'SPORTS_INJURY' || /sport/i.test(mech);
  }
  if (label === 'Assault') {
    return type === 'ASSAULT' || /assault/i.test(mech);
  }
  return false;
};

const getOtherMechanism = (packetData) => {
  if (!packetData) return '';
  if (packetData.mechanismOfInjuryOther) return packetData.mechanismOfInjuryOther;
  if (packetData.mechanismOfInjury && !getMechanismChecked('Motor vehicle accident', packetData) && !getMechanismChecked('Slip and Fall', packetData) && !getMechanismChecked('Workplace injury', packetData) && !getMechanismChecked('Sports injury', packetData) && !getMechanismChecked('Assault', packetData)) {
    return packetData.mechanismOfInjury;
  }
  return '';
};

const PageHeader = ({ page, blankMode, packetData }) => {
  const dos = packetData?.initialDate || '';
  return (
    <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" fill="#0d9488" />
            <ellipse cx="40" cy="22" rx="8" ry="9" fill="white" />
            <rect x="30" y="32" width="20" height="24" rx="4" fill="white" />
            <rect x="24" y="33" width="8" height="18" rx="3" fill="white" />
            <rect x="48" y="33" width="8" height="18" rx="3" fill="white" />
            <rect x="31" y="56" width="8" height="16" rx="3" fill="white" />
            <rect x="41" y="56" width="8" height="16" rx="3" fill="white" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-black text-teal-800 uppercase tracking-tight" style={{ fontFamily: 'serif' }}>JOSMIC WELLNESS CENTER</h1>
          <p className="text-[10px] font-bold text-slate-600">PAIN MANAGEMENT CONSULTATION &amp; EVALUATION REPORT</p>
          <p className="text-[9px] text-slate-500">10101 HARWIN DR. STE 274 HOUSTON TX 77036 &nbsp;|&nbsp; OFFICE: 713-485-5712 &nbsp;|&nbsp; FAX: 832-416-1502</p>
        </div>
      </div>
      <div className="text-right font-mono text-[10px] text-slate-600 border border-slate-300 p-2 bg-slate-50">
        <p className="font-bold">PAGE {page} OF 4</p>
        <p>DOS: {blankMode || !packetData ? '' : dos}</p>
      </div>
    </div>
  );
};

const PatientInfoBar = ({ blankMode, packetData }) => {
  const doctor = packetData?.referringProviderName ? `${packetData.referringProviderName}, MD / Pain Management` : '';
  return (
    <div className="bg-slate-100 border border-slate-300 p-2.5 mb-4 grid grid-cols-2 gap-2 text-[11px] font-mono">
      <div>PATIENT: <strong>{blankMode || !packetData ? '' : (packetData.patientName || '')}</strong></div>
      <div>CONSULTING PHYSICIAN: <strong>{blankMode || !packetData ? '' : doctor}</strong></div>
    </div>
  );
};

// --- PAGE 1 ------------------------------------------------------------------
const Page1 = ({ blankMode, packetData }) => {
  const dosDate = packetData?.initialDate || packetData?.accidentDate || '';
  const patientDob = packetData?.patient?.dob || packetData?.patientDob || '';
  const patientGender = packetData?.patient?.sex || packetData?.patientSex || packetData?.patient?.gender || '';
  const chiefComplaintText = packetData?.chiefComplaint || packetData?.mechanismOfInjury || '';

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-[11px] font-bold text-slate-700">Current Date:</span>
        <div className="border-b border-slate-500 w-32 text-[11px] font-mono">{blankMode || !packetData ? '' : dosDate}&nbsp;</div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-3 mb-4 grid grid-cols-3 gap-3 text-[11px] font-mono">
        <div><span className="font-bold">Patient Name: </span><span className="border-b border-slate-400 inline-block w-28">{blankMode || !packetData ? '' : (packetData.patientName || '')}&nbsp;</span></div>
        <div><span className="font-bold">DOB: </span><span className="border-b border-slate-400 inline-block w-20">{blankMode || !packetData ? '' : patientDob}&nbsp;</span></div>
        <div><span className="font-bold">Gender: </span><span className="border-b border-slate-400 inline-block w-16">{blankMode || !packetData ? '' : patientGender}&nbsp;</span></div>
      </div>

      <SectionHeader>1. Chief Complaint &amp; Pain Assessment</SectionHeader>

      <div className="text-[11px] mb-3">
        <span className="font-bold">What is the primary reason for today's visit? </span>
        <div className="border-b border-slate-400 mt-1 mb-1 w-full">{blankMode || !packetData ? '' : chiefComplaintText}&nbsp;</div>
        <div className="border-b border-slate-400 mt-2 w-full">&nbsp;</div>
      </div>

      <div className="mb-4">
        <p className="font-bold text-[11px] mb-1.5">Pain Description (Check all that applies):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {['Sharp', 'Dull', 'Throbbing', 'Burning', 'Radiating', 'Tingling', 'Stabbing', 'Numbness'].map(label => (
            <CB key={label} checked={getPainDescriptionChecked(label, packetData)} label={label} blankMode={blankMode} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData.painDescriptionOther || '')}&nbsp;</div>
        </div>
      </div>

      <div className="mb-4">
        <p className="font-bold text-[11px] mb-1.5">Pain Location (Check all that applies):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {[
            'Neck', 'Chest', 'Head', 'U.Back', 'M.Back', 'L.Back', 'R.Shoulder', 'L.Shoulder',
            'R.Knee', 'L.Knee', 'R.Ankle', 'L.Ankle', 'R.Wrist', 'L.Wrist', 'Joint pain',
            'Muscle pain', 'Headache', 'R.arm', 'L.arm', 'R.leg', 'L.leg', 'R.elbow', 'L.elbow'
          ].map(label => (
            <CB key={label} checked={getPainLocationChecked(label, packetData)} label={label} blankMode={blankMode} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData.painLocationOther || '')}&nbsp;</div>
        </div>
      </div>

      <SectionHeader>2. History of Present Illness (HPI)</SectionHeader>

      <div className="mb-3">
        <p className="font-bold text-[11px] mb-1.5">Mechanism of Injury (Select all that apply):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {['Motor vehicle accident', 'Slip and Fall', 'Workplace injury', 'Sports injury', 'Assault'].map(label => (
            <CB key={label} checked={getMechanismChecked(label, packetData)} label={label} blankMode={blankMode} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : getOtherMechanism(packetData)}&nbsp;</div>
        </div>
      </div>
    </div>
  );
};

const getAggravatingChecked = (label, packetData) => {
  if (!packetData) return false;
  const list = packetData.aggravatingFactors;
  if (Array.isArray(list)) return list.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof list === 'string') return list.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getRelievingChecked = (label, packetData) => {
  if (!packetData) return false;
  const list = packetData.relievingFactors;
  if (Array.isArray(list)) return list.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof list === 'string') return list.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getFunctionalChecked = (label, packetData) => {
  if (!packetData) return false;
  const list = packetData.functionalLimitations;
  if (Array.isArray(list)) return list.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof list === 'string') return list.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getMedicalHistoryChecked = (label, packetData) => {
  if (!packetData) return false;
  const list = packetData.medicalHistory || packetData.pastMedicalHistory;
  if (Array.isArray(list)) return list.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof list === 'string') return list.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getSurgicalNoneChecked = (packetData) => {
  if (!packetData) return false;
  const surg = packetData.surgicalHistory || packetData.pastSurgicalHistory;
  if (Array.isArray(surg)) return surg.some(i => String(i).toLowerCase() === 'none');
  if (typeof surg === 'string') return surg.toLowerCase().includes('none');
  return Boolean(packetData.surgicalHistoryNone);
};

const getRosNeurologicChecked = (label, packetData) => {
  if (!packetData) return false;
  const list = packetData.rosNeurologic || packetData.reviewOfSystems?.neurologic;
  if (Array.isArray(list)) return list.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof list === 'string') return list.toLowerCase().includes(label.toLowerCase());
  return false;
};

// --- PAGE 2 ------------------------------------------------------------------
const Page2 = ({ blankMode, packetData }) => {
  const currentPain = packetData?.painSeverityCurrent || packetData?.painCurrent || packetData?.painScore || '';
  const worstPain = packetData?.painSeverityWorst || packetData?.painWorst || '';
  const bestPain = packetData?.painSeverityBest || packetData?.painBest || '';

  return (
    <div>
      <div className="mb-4 text-[11px]">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-bold">2.1 Date of Injury:</span>
          <div className="border-b border-slate-400 w-24 font-mono">{blankMode || !packetData ? '' : (packetData.accidentDate || '')}&nbsp;</div>
        </div>
        <p className="font-bold mb-2">2.2 Pain Severity (0-10): rate in scale of severity</p>
        <div className="grid grid-cols-3 gap-4 mb-3 pl-2">
          <div>
            <span className="font-semibold">Current: </span>
            <div className="border-b border-slate-400 inline-block w-12 font-mono">{blankMode || !packetData ? '' : currentPain}&nbsp;</div>
          </div>
          <div>
            <span className="font-semibold">Worst: </span>
            <div className="border-b border-slate-400 inline-block w-12 font-mono">{blankMode || !packetData ? '' : worstPain}&nbsp;</div>
          </div>
          <div>
            <span className="font-semibold">Best: </span>
            <div className="border-b border-slate-400 inline-block w-12 font-mono">{blankMode || !packetData ? '' : bestPain}&nbsp;</div>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <p className="font-bold text-[11px] mb-1.5">Aggravating Factors (Circle all that apply):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {['Movement', 'Sitting/Standing', 'Walking', 'Bending', 'Lifting'].map(label => (
            <CB key={label} checked={getAggravatingChecked(label, packetData)} label={label} blankMode={blankMode} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData?.aggravatingFactorsOther || '')}&nbsp;</div>
        </div>
      </div>

      <div className="mb-3">
        <p className="font-bold text-[11px] mb-1.5">Relieving Factors (Circle all that apply):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {['Rest', 'Ice/Heat', 'Pain medications', 'Physical therapy', 'Nothing helps'].map(label => (
            <CB key={label} checked={getRelievingChecked(label, packetData)} label={label} blankMode={blankMode} />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="font-bold text-[11px] mb-1.5">Functional Limitations (Circle all that apply):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {["Difficulty sleeping", "Trouble walking", "Can't return to work", "Reduced daily activities"].map(label => (
            <CB key={label} checked={getFunctionalChecked(label, packetData)} label={label} blankMode={blankMode} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData?.functionalLimitationsOther || '')}&nbsp;</div>
        </div>
      </div>

      <SectionHeader>3. Past Medical History</SectionHeader>

      <div className="mb-3">
        <p className="font-bold text-[11px] mb-1.5">Relevant Medical History (Circle all that apply):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {['Diabetes','Hypertension','Neuropathy','Depression/Anxiety','Previous pain management','Heart disease','Cancer','Arthritis','Asthma','High cholesterol','Depression','Anxiety','Lupus','Chronic pain'].map(item => (
            <CB key={item} checked={getMedicalHistoryChecked(item, packetData)} label={item} blankMode={blankMode} />
          ))}
          <CB checked={getMedicalHistoryChecked('None', packetData)} label="None" blankMode={blankMode} />
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData?.medicalHistoryOther || '')}&nbsp;</div>
        </div>
      </div>

      <div className="mb-3 text-[11px]">
        <p className="font-bold mb-1">Surgical History:</p>
        <div className="flex items-center gap-3 pl-2">
          <span>Relevant prior surgery:</span>
          <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData?.surgicalHistory || packetData?.pastSurgicalHistory || '')}&nbsp;</div>
          <CB checked={getSurgicalNoneChecked(packetData)} label="None" blankMode={blankMode} />
        </div>
      </div>

      <div className="mb-2 text-[11px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold">Medications (current):</span>
          <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData?.medications || packetData?.currentMedications || '')}&nbsp;</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">Allergies:</span>
          <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData?.allergies || '')}&nbsp;</div>
        </div>
      </div>

      <SectionHeader>4. Review of Systems (ROS)</SectionHeader>
      <p className="text-[11px] italic text-slate-500 mb-2">Circle all that apply in this section</p>

      <div className="mb-3">
        <p className="font-bold text-[11px] mb-1">Neurologic:</p>
        <div className="flex flex-wrap gap-y-1.5 pl-2">
          {['Numbness', 'Tingling', 'Weakness', 'Balance issues', 'Headaches'].map(label => (
            <CB key={label} checked={getRosNeurologicChecked(label, packetData)} label={label} blankMode={blankMode} />
          ))}
          <CB checked={getRosNeurologicChecked('None', packetData)} label="None" blankMode={blankMode} />
        </div>
      </div>
    </div>
  );
};

const getRosMusculoskeletalChecked = (label, packetData) => {
  if (!packetData) return false;
  const list = packetData.rosMusculoskeletal || packetData.reviewOfSystems?.musculoskeletal;
  if (Array.isArray(list)) return list.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof list === 'string') return list.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getRosPsychiatricChecked = (label, packetData) => {
  if (!packetData) return false;
  const list = packetData.rosPsychiatric || packetData.reviewOfSystems?.psychiatric;
  if (Array.isArray(list)) return list.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof list === 'string') return list.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getPhysicalExamInspectionChecked = (label, packetData) => {
  if (!packetData) return false;
  const list = packetData.physicalExamInspection || packetData.physicalExam?.inspection;
  if (Array.isArray(list)) return list.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof list === 'string') return list.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getPalpationTendernessChecked = (val, packetData) => {
  if (!packetData) return false;
  const t = packetData.palpationTenderness ?? packetData.physicalExam?.palpationTenderness;
  if (typeof t === 'boolean') return val === (t ? 'Yes' : 'No');
  if (typeof t === 'string') return t.toLowerCase() === val.toLowerCase();
  return false;
};

const getPalpationMuscleSpasmChecked = (val, packetData) => {
  if (!packetData) return false;
  const s = packetData.palpationMuscleSpasm ?? packetData.physicalExam?.palpationMuscleSpasm;
  if (typeof s === 'boolean') return val === (s ? 'Yes' : 'No');
  if (typeof s === 'string') return s.toLowerCase() === val.toLowerCase();
  return false;
};

const getRomChecked = (label, packetData) => {
  if (!packetData) return false;
  const rom = packetData.rangeOfMotion || packetData.rom || packetData.physicalExam?.rom;
  if (Array.isArray(rom)) return rom.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof rom === 'string') return rom.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getNeuroMotorChecked = (label, packetData) => {
  if (!packetData) return false;
  const m = packetData.neuroMotor || packetData.physicalExam?.neuroMotor;
  if (Array.isArray(m)) return m.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof m === 'string') return m.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getNeuroSensoryChecked = (label, packetData) => {
  if (!packetData) return false;
  const s = packetData.neuroSensory || packetData.physicalExam?.neuroSensory;
  if (Array.isArray(s)) return s.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof s === 'string') return s.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getNeuroReflexesChecked = (label, packetData) => {
  if (!packetData) return false;
  const r = packetData.neuroReflexes || packetData.physicalExam?.neuroReflexes;
  if (Array.isArray(r)) return r.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof r === 'string') return r.toLowerCase().includes(label.toLowerCase());
  return false;
};

const isDiagnosisCodeChecked = (codePrefix, packetData) => {
  if (!packetData || !packetData.diagnosisCodes) return false;
  const codes = Array.isArray(packetData.diagnosisCodes)
    ? packetData.diagnosisCodes
    : String(packetData.diagnosisCodes).split(/[,;\n]+/);
  return codes.some(c => String(c).trim().toUpperCase().startsWith(codePrefix.toUpperCase()));
};

const getDiagnosticsOrderedChecked = (label, packetData) => {
  if (!packetData) return false;
  const d = packetData.diagnosticsOrdered || packetData.diagnostics || packetData.plan?.diagnostics;
  if (Array.isArray(d)) return d.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof d === 'string') return d.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getMedicationsChecked = (label, packetData) => {
  if (!packetData) return false;
  const m = packetData.medications || packetData.medicationTypes || packetData.plan?.medications;
  if (Array.isArray(m)) return m.some(i => String(i).toLowerCase().includes(label.toLowerCase()));
  if (typeof m === 'string') return m.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getInterventionsChecked = (label, packetData) => {
  if (!packetData) return false;
  const i = packetData.interventions || packetData.plan?.interventions || packetData.procedures;
  if (Array.isArray(i)) return i.some(x => String(x).toLowerCase().includes(label.toLowerCase()));
  if (typeof i === 'string') return i.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getRestrictionsChecked = (label, packetData) => {
  if (!packetData) return false;
  const r = packetData.restrictions || packetData.plan?.restrictions || packetData.workRestrictions;
  if (Array.isArray(r)) return r.some(x => String(x).toLowerCase().includes(label.toLowerCase()));
  if (typeof r === 'string') return r.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getFollowUpChecked = (label, packetData) => {
  if (!packetData) return false;
  const f = packetData.followUp || packetData.plan?.followUp || packetData.followUpPeriod;
  if (Array.isArray(f)) return f.some(x => String(x).toLowerCase().includes(label.toLowerCase()));
  if (typeof f === 'string') return f.toLowerCase().includes(label.toLowerCase());
  return false;
};

const getOtherDiagnosis = (packetData) => {
  if (!packetData) return '';
  if (packetData.otherDiagnosis) return packetData.otherDiagnosis;
  if (packetData.diagnosisOther) return packetData.diagnosisOther;
  if (!packetData.diagnosisCodes) return '';
  const codes = Array.isArray(packetData.diagnosisCodes)
    ? packetData.diagnosisCodes
    : String(packetData.diagnosisCodes).split(/[,;\n]+/);
  const knownPrefixes = ['S13.4', 'S23.3', 'S33.5', 'M54.5', 'M79.1', 'M54.1', 'M54.4', 'G44.3'];
  const unknown = codes.map(c => String(c).trim()).filter(c => c && !knownPrefixes.some(p => c.toUpperCase().startsWith(p)));
  return unknown.join(', ');
};

// --- PAGE 3 ------------------------------------------------------------------
const Page3 = ({ blankMode, packetData }) => (
  <div>
    <div className="mb-3">
      <p className="font-bold text-[11px] mb-1">Musculoskeletal:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['Joint stiffness', 'Muscle spasms', 'Swelling', 'Limited range of motion'].map(label => (
          <CB key={label} checked={getRosMusculoskeletalChecked(label, packetData)} label={label} blankMode={blankMode} />
        ))}
        <CB checked={getRosMusculoskeletalChecked('None', packetData)} label="None" blankMode={blankMode} />
      </div>
    </div>

    <div className="mb-4">
      <p className="font-bold text-[11px] mb-1">Psychiatric:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['Anxiety', 'Depression', 'Sleep disturbance', 'PTSD symptoms'].map(label => (
          <CB key={label} checked={getRosPsychiatricChecked(label, packetData)} label={label} blankMode={blankMode} />
        ))}
        <CB checked={getRosPsychiatricChecked('None', packetData)} label="None" blankMode={blankMode} />
      </div>
    </div>

    <SectionHeader>5. Physical Examination</SectionHeader>
    <p className="text-[11px] italic text-slate-500 mb-2">Circle all that apply in this section</p>

    <div className="mb-3">
      <p className="font-bold text-[11px] mb-1">Inspection:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['No visible trauma', 'Bruising', 'Swelling', 'Surgical scars', 'Postural abnormalities'].map(label => (
          <CB key={label} checked={getPhysicalExamInspectionChecked(label, packetData)} label={label} blankMode={blankMode} />
        ))}
      </div>
    </div>

    <div className="mb-3 text-[11px]">
      <p className="font-bold mb-1">Palpation:</p>
      <div className="pl-2 space-y-1">
        <div className="flex items-center gap-3">
          <span>Tenderness:</span>
          <CB checked={getPalpationTendernessChecked('Yes', packetData)} label="Yes" blankMode={blankMode} />
          <CB checked={getPalpationTendernessChecked('No', packetData)} label="No" blankMode={blankMode} />
        </div>
        <div className="flex items-center gap-3">
          <span>Muscle spasm:</span>
          <CB checked={getPalpationMuscleSpasmChecked('Yes', packetData)} label="Yes" blankMode={blankMode} />
          <CB checked={getPalpationMuscleSpasmChecked('No', packetData)} label="No" blankMode={blankMode} />
        </div>
      </div>
    </div>

    <div className="mb-3 text-[11px]">
      <p className="font-bold mb-1">ROM (Range of Motion) - Check what is applicable:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['Full', 'Limited - Painful', 'Severely restricted'].map(label => (
          <CB key={label} checked={getRomChecked(label, packetData)} label={label} blankMode={blankMode} />
        ))}
      </div>
    </div>

    <div className="mb-4 text-[11px]">
      <p className="font-bold mb-1">Neurological Exam - Check what is applicable:</p>
      <div className="pl-2 space-y-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold w-16">Motor:</span>
          <CB checked={getNeuroMotorChecked('Normal', packetData)} label="Normal" blankMode={blankMode} />
          <span>Weakness in:</span>
          <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData?.motorWeaknessIn || '')}&nbsp;</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold w-16">Sensory:</span>
          <CB checked={getNeuroSensoryChecked('Intact', packetData)} label="Intact" blankMode={blankMode} />
          <span>Diminished in:</span>
          <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData?.sensoryDiminishedIn || '')}&nbsp;</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold w-16">Reflexes:</span>
          {['Normal', 'Hypoactive', 'Hyperactive'].map(label => (
            <CB key={label} checked={getNeuroReflexesChecked(label, packetData)} label={label} blankMode={blankMode} />
          ))}
        </div>
      </div>
    </div>

    <SectionHeader>6. Assessment &amp; Diagnosis (ICD-10 Codes)</SectionHeader>

    <div className="pl-2 space-y-1.5 text-[11px] mb-3">
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('S13.4', packetData)} label="Cervical sprain/strain" blankMode={blankMode} />
        <span className="text-slate-500 font-mono">(S13.4)</span>
      </div>
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('S23.3', packetData)} label="Thoracic sprain/strain" blankMode={blankMode} />
        <span className="text-slate-500 font-mono">(S23.3)</span>
      </div>
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('S33.5', packetData) || isDiagnosisCodeChecked('M54.5', packetData)} label="Lumbar strain" blankMode={blankMode} />
        <span className="text-slate-500 font-mono">(S33.5)</span>
      </div>
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('M79.1', packetData)} label="Myofascial pain syndrome" blankMode={blankMode} />
        <span className="text-slate-500 font-mono">(M79.1</span>
        <div className="border-b border-slate-400 w-12">{blankMode || !packetData ? '' : (packetData?.diagnosisCodes?.find(c => String(c).startsWith('M79.1'))?.replace('M79.1', '') || '')}&nbsp;</div>
        <span className="text-slate-500 font-mono">)</span>
      </div>
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('M54.1', packetData) || isDiagnosisCodeChecked('M54.4', packetData)} label="Radiculopathy" blankMode={blankMode} />
        <span className="text-slate-500 font-mono">(M54.</span>
        <div className="border-b border-slate-400 w-12">{blankMode || !packetData ? '' : (packetData?.diagnosisCodes?.find(c => String(c).startsWith('M54.'))?.replace('M54.', '') || '')}&nbsp;</div>
        <span className="text-slate-500 font-mono">)</span>
      </div>
    </div>
  </div>
);

// --- PAGE 4 ------------------------------------------------------------------
const Page4 = ({ blankMode, packetData }) => (
  <div>
    <div className="pl-2 space-y-1.5 text-[11px] mb-4">
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('G44.3', packetData)} label="Post-traumatic headache" blankMode={blankMode} />
        <span className="text-slate-500 font-mono">(G44.3</span>
        <div className="border-b border-slate-400 w-12">{blankMode || !packetData ? '' : (packetData?.diagnosisCodes?.find(c => String(c).startsWith('G44.3'))?.replace('G44.3', '') || '')}&nbsp;</div>
        <span className="text-slate-500 font-mono">)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold">Other:</span>
        <div className="border-b border-slate-400 w-20 font-mono">{blankMode || !packetData ? '' : getOtherDiagnosis(packetData)}&nbsp;</div>
      </div>
    </div>

    <SectionHeader>7. Plan &amp; Recommendations</SectionHeader>

    <div className="mb-3">
      <p className="font-bold text-[11px] mb-1.5">Diagnostics Ordered - check what is applicable:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['X-ray', 'MRI', 'CT', 'EMG/NCS', 'None'].map(label => (
          <CB key={label} checked={getDiagnosticsOrderedChecked(label, packetData)} label={label} blankMode={blankMode} />
        ))}
      </div>
    </div>

    <div className="mb-3">
      <p className="font-bold text-[11px] mb-1.5">Medications - check what is applicable:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['NSAIDs', 'Muscle relaxants', 'Neuropathic agents', 'Pain medications'].map(label => (
          <CB key={label} checked={getMedicationsChecked(label, packetData)} label={label} blankMode={blankMode} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1.5 text-[11px] pl-2">
        <span className="font-bold">Other:</span>
        <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData?.medicationsOther || packetData?.otherMedications || packetData?.plan?.otherMedications || '')}&nbsp;</div>
      </div>
    </div>

    <div className="mb-3">
      <p className="font-bold text-[11px] mb-1.5">Interventions - check all that is applicable:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['Physical therapy', 'Chiropractic care', 'Trigger point injections', 'Epidural steroid injection', 'Laser therapy', 'Shockwave therapy', 'Pain management follow-up'].map(label => (
          <CB key={label} checked={getInterventionsChecked(label, packetData)} label={label} blankMode={blankMode} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1.5 text-[11px] pl-2">
        <span className="font-bold">Specialist referral:</span>
        <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData?.specialistReferral || packetData?.referral || packetData?.plan?.specialistReferral || '')}&nbsp;</div>
      </div>
    </div>

    <div className="mb-3 text-[11px]">
      <p className="font-bold mb-1.5">Restrictions:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['No lifting >10 lbs', 'Limited bending/twisting', 'Gradual return to normal activity'].map(label => (
          <CB key={label} checked={getRestrictionsChecked(label, packetData)} label={label} blankMode={blankMode} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1.5 pl-2">
        <CB checked={getRestrictionsChecked('Off work', packetData)} label="Off work/school until:" blankMode={blankMode} />
        <div className="border-b border-slate-400 w-28">{blankMode || !packetData ? '' : (packetData?.offWorkUntil || packetData?.restrictionsOffWorkUntil || packetData?.plan?.offWorkUntil || '')}&nbsp;</div>
      </div>
    </div>

    <div className="mb-6 text-[11px]">
      <p className="font-bold mb-1.5">Follow-Up:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['1 week', '2 weeks', 'PRN (as needed)'].map(label => (
          <CB key={label} checked={getFollowUpChecked(label, packetData)} label={label} blankMode={blankMode} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1.5 pl-2">
        <span className="font-bold">Referred to:</span>
        <div className="border-b border-slate-400 flex-1">{blankMode || !packetData ? '' : (packetData?.referredTo || packetData?.plan?.referredTo || '')}&nbsp;</div>
      </div>
    </div>

    {/* Signature Block */}
    <div className="border-t-2 border-slate-700 pt-5 mt-4">
      <div className="grid grid-cols-2 gap-8 text-[11px] font-mono">
        <div>
          <div className="border-b border-slate-500 pb-1 mb-1 min-h-[28px] font-bold">{blankMode || !packetData ? '' : (packetData.referringProviderName || packetData.providerName || '')}&nbsp;</div>
          <p className="text-slate-600 text-[10px]">Provider Name / Signature</p>
        </div>
        <div>
          <div className="border-b border-slate-500 pb-1 mb-1 min-h-[28px]">{blankMode || !packetData ? '' : (packetData.dischargeDate || packetData.signatureDate || '')}&nbsp;</div>
          <p className="text-slate-600 text-[10px]">Date</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[10px] text-slate-500">JOSMIC Wellness Center - 10101 Harwin Dr, Ste 774, Houston TX 77036 | Office: 713-485-5712 | Fax: 713-485-0208</p>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT -----------------------------------------------------------
export const JosmicPainManagementReport = ({ reportPage = 1, blankMode = false, packetData = null }) => {
  const pageComponents = { 1: Page1, 2: Page2, 3: Page3, 4: Page4 };
  const PageContent = pageComponents[reportPage] || Page1;

  return (
    <div className="relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '100%', maxWidth: '850px', minHeight: '1100px', padding: '40px 56px', paddingBottom: '60px' }}>
      <PageHeader page={reportPage} blankMode={blankMode} packetData={packetData} />
      <PatientInfoBar blankMode={blankMode} packetData={packetData} />
      <PageContent blankMode={blankMode} packetData={packetData} />

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 px-14 flex justify-between text-[9px] text-slate-400 font-mono border-t border-slate-100 pt-2">
        <span>JOSMIC Wellness Center - Pain Management Consultation &amp; Evaluation Report - Confidential</span>
        <span>Page {reportPage + 3} of 7</span>
      </div>
    </div>
  );
};
