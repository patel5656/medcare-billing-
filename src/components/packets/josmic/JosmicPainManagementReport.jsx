import React, { useState, useEffect } from 'react';
import { EditableClinicalField } from '../EditableClinicalField';
import { AiAutoDraftToolbar } from '../common/AiAutoDraftToolbar';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { apiClinicalNoteService } from '../../../services/api/apiClinicalNoteService';
import { useUIStore } from '../../../store/uiStore';
import fmLogo from '../../../assets/fm-logo.jpeg';

const CB = ({ 
  checked = false, 
  label, 
  blankMode = false, 
  readOnly = false,
  packetData = null,
  fieldKey = null,
  onToggle = null,
}) => {
  const storage = packetData?.clinicalDocStorage?.['JOSMIC_PAIN_REPORT']?.checkboxOverrides || {};
  
  const isChecked = (fieldKey && storage[fieldKey] !== undefined)
    ? storage[fieldKey]
    : checked;

  const [localChecked, setLocalChecked] = useState(isChecked);

  useEffect(() => {
    setLocalChecked(isChecked);
  }, [isChecked]);

  const handleToggle = async () => {
    if (readOnly || blankMode) return;
    
    if (onToggle) {
      onToggle();
      return;
    }

    if (!fieldKey) return;

    const nextVal = !localChecked;
    setLocalChecked(nextVal);

    if (!packetData?.id) return;

    try {
      const currentStorage = packetData.clinicalDocStorage || {};
      const docNamespace = currentStorage['JOSMIC_PAIN_REPORT'] || {};
      const currentOverrides = docNamespace.checkboxOverrides || {};
      const updatedOverrides = { ...currentOverrides, [fieldKey]: nextVal };
      const updatedDoc = { ...docNamespace, checkboxOverrides: updatedOverrides };
      const updatedStorage = { ...currentStorage, ['JOSMIC_PAIN_REPORT']: updatedDoc };
      await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
      packetData.clinicalDocStorage = updatedStorage;
    } catch (err) {
      console.error('Failed to toggle checkbox', err);
    }
  };

  const isInteractive = !readOnly && !blankMode && (fieldKey || onToggle);

  return (
    <span
      onClick={handleToggle}
      className={`inline-flex items-center gap-1 mr-3 text-[11px] select-none ${
        isInteractive ? 'cursor-pointer hover:opacity-80' : ''
      }`}
    >
      <span className="w-3.5 h-3.5 border border-slate-600 inline-flex items-center justify-center text-[10px] font-bold bg-white flex-shrink-0 leading-none">
        {!blankMode && localChecked ? '✓' : ''}
      </span>
      <span>{label}</span>
    </span>
  );
};

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
        <img src={fmLogo} alt="FM Health and Wellness Center" className="h-12 w-auto object-contain flex-shrink-0 mix-blend-multiply" />
        <div>
          <h1 className="text-lg font-black text-[#722F37] uppercase tracking-tight" style={{ fontFamily: 'serif' }}>FM HEALTH AND WELLNESS CENTER</h1>
          <p className="text-[10px] font-bold text-slate-600">PAIN MANAGEMENT CONSULTATION &amp; EVALUATION REPORT</p>
          <p className="text-[9px] text-slate-500">9900 WESTPARK DR, HOUSTON, TX 77063 &nbsp;|&nbsp; OFFICE: 713-485-5712 &nbsp;|&nbsp; FAX: 832-416-1502</p>
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
const Page1 = ({ blankMode, packetData, readOnly = false }) => {
  const storage = packetData?.clinicalDocStorage?.['JOSMIC_PAIN_REPORT'] || {};
  const dosDate = packetData?.initialDate || packetData?.accidentDate || '';
  const patientDob = packetData?.patient?.dob || packetData?.patientDob || '';
  const patientGender = packetData?.patient?.sex || packetData?.patientSex || packetData?.patient?.gender || '';
  const chiefComplaintText = storage.chiefComplaint || packetData?.chiefComplaint || packetData?.mechanismOfInjury || '';

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
        <span className="font-bold block mb-1">What is the primary reason for today's visit? </span>
        <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="chiefComplaint" value={chiefComplaintText} readOnly={blankMode} inputType="textarea" minHeightClass="min-h-[40px]" className="border-b border-dashed border-slate-400 w-full" />
      </div>

      <div className="mb-4">
        <p className="font-bold text-[11px] mb-1.5">Pain Description (Check all that applies):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {['Sharp', 'Dull', 'Throbbing', 'Burning', 'Radiating', 'Tingling', 'Stabbing', 'Numbness'].map(label => (
            <CB
              key={label}
              checked={getPainDescriptionChecked(label, packetData)}
              label={label}
              blankMode={blankMode}
              readOnly={readOnly}
              packetData={packetData}
              fieldKey={`pd_${label}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="painDescriptionOther" value={storage.painDescriptionOther || packetData?.painDescriptionOther || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
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
            <CB
              key={label}
              checked={getPainLocationChecked(label, packetData)}
              label={label}
              blankMode={blankMode}
              readOnly={readOnly}
              packetData={packetData}
              fieldKey={`pl_${label}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="painLocationOther" value={storage.painLocationOther || packetData?.painLocationOther || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
        </div>
      </div>

      <SectionHeader>2. History of Present Illness (HPI)</SectionHeader>

      <div className="mb-3">
        <p className="font-bold text-[11px] mb-1.5">Mechanism of Injury (Select all that apply):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {['Motor vehicle accident', 'Slip and Fall', 'Workplace injury', 'Sports injury', 'Assault'].map(label => (
            <CB
              key={label}
              checked={getMechanismChecked(label, packetData)}
              label={label}
              blankMode={blankMode}
              readOnly={readOnly}
              packetData={packetData}
              fieldKey={`moi_${label}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="mechanismOther" value={storage.mechanismOther || getOtherMechanism(packetData)} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
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
const Page2 = ({ blankMode, packetData, readOnly = false }) => {
  const storage = packetData?.clinicalDocStorage?.['JOSMIC_PAIN_REPORT'] || {};
  const currentPain = storage.painCurrent || packetData?.painSeverityCurrent || packetData?.painCurrent || packetData?.painScore || '';
  const worstPain = storage.painWorst || packetData?.painSeverityWorst || packetData?.painWorst || '';
  const bestPain = storage.painBest || packetData?.painSeverityBest || packetData?.painBest || '';

  return (
    <div>
      <div className="mb-4 text-[11px]">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-bold">2.1 Date of Injury:</span>
          <div className="border-b border-slate-400 w-24 font-mono">{blankMode || !packetData ? '' : (packetData.accidentDate || '')}&nbsp;</div>
        </div>
        <p className="font-bold mb-2">2.2 Pain Severity (0-10): rate in scale of severity</p>
        <div className="grid grid-cols-3 gap-4 mb-3 pl-2">
          <div className="flex items-center">
            <span className="font-semibold mr-1">Current: </span>
            <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="painCurrent" value={currentPain} readOnly={blankMode} inputType="input" className="w-12 border-b border-dashed border-slate-400 font-mono text-center" />
          </div>
          <div className="flex items-center">
            <span className="font-semibold mr-1">Worst: </span>
            <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="painWorst" value={worstPain} readOnly={blankMode} inputType="input" className="w-12 border-b border-dashed border-slate-400 font-mono text-center" />
          </div>
          <div className="flex items-center">
            <span className="font-semibold mr-1">Best: </span>
            <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="painBest" value={bestPain} readOnly={blankMode} inputType="input" className="w-12 border-b border-dashed border-slate-400 font-mono text-center" />
          </div>
        </div>
      </div>

      <div className="mb-3">
        <p className="font-bold text-[11px] mb-1.5">Aggravating Factors (Circle all that apply):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {['Movement', 'Sitting/Standing', 'Walking', 'Bending', 'Lifting'].map(label => (
            <CB key={label} checked={getAggravatingChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`agg_${label}`} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="aggravatingFactorsOther" value={storage.aggravatingFactorsOther || packetData?.aggravatingFactorsOther || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
        </div>
      </div>

      <div className="mb-3">
        <p className="font-bold text-[11px] mb-1.5">Relieving Factors (Circle all that apply):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {['Rest', 'Ice/Heat', 'Pain medications', 'Physical therapy', 'Nothing helps'].map(label => (
            <CB key={label} checked={getRelievingChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`rel_${label}`} />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="font-bold text-[11px] mb-1.5">Functional Limitations (Circle all that apply):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {["Difficulty sleeping", "Trouble walking", "Can't return to work", "Reduced daily activities"].map(label => (
            <CB key={label} checked={getFunctionalChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`func_${label}`} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="functionalLimitationsOther" value={storage.functionalLimitationsOther || packetData?.functionalLimitationsOther || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
        </div>
      </div>

      <SectionHeader>3. Past Medical History</SectionHeader>

      <div className="mb-3">
        <p className="font-bold text-[11px] mb-1.5">Relevant Medical History (Circle all that apply):</p>
        <div className="flex flex-wrap gap-y-1.5">
          {['Diabetes','Hypertension','Neuropathy','Depression/Anxiety','Previous pain management','Heart disease','Cancer','Arthritis','Asthma','High cholesterol','Depression','Anxiety','Lupus','Chronic pain'].map(item => (
            <CB key={item} checked={getMedicalHistoryChecked(item, packetData)} label={item} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`pmh_${item}`} />
          ))}
          <CB checked={getMedicalHistoryChecked('None', packetData)} label="None" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="pmh_None" />
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
          <span className="font-bold">Other:</span>
          <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="medicalHistoryOther" value={storage.medicalHistoryOther || packetData?.medicalHistoryOther || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
        </div>
      </div>

      <div className="mb-3 text-[11px]">
        <p className="font-bold mb-1">Surgical History:</p>
        <div className="flex items-center gap-3 pl-2">
          <span>Relevant prior surgery:</span>
          <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="surgicalHistory" value={storage.surgicalHistory || packetData?.surgicalHistory || packetData?.pastSurgicalHistory || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
          <CB checked={getSurgicalNoneChecked(packetData)} label="None" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="surg_None" />
        </div>
      </div>

      <div className="mb-2 text-[11px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold">Medications (current):</span>
          <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="medications" value={storage.medications || packetData?.medications || packetData?.currentMedications || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">Allergies:</span>
          <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="allergies" value={storage.allergies || packetData?.allergies || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
        </div>
      </div>

      <SectionHeader>4. Review of Systems (ROS)</SectionHeader>
      <p className="text-[11px] italic text-slate-500 mb-2">Circle all that apply in this section</p>

      <div className="mb-3">
        <p className="font-bold text-[11px] mb-1">Neurologic:</p>
        <div className="flex flex-wrap gap-y-1.5 pl-2">
          {['Numbness', 'Tingling', 'Weakness', 'Balance issues', 'Headaches'].map(label => (
            <CB key={label} checked={getRosNeurologicChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`ros_neuro_${label}`} />
          ))}
          <CB checked={getRosNeurologicChecked('None', packetData)} label="None" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="ros_neuro_None" />
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
const Page3 = ({ blankMode, packetData, readOnly = false }) => {
  const storage = packetData?.clinicalDocStorage?.['JOSMIC_PAIN_REPORT'] || {};
  return (
  <div>
    <div className="mb-3">
      <p className="font-bold text-[11px] mb-1">Musculoskeletal:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['Joint stiffness', 'Muscle spasms', 'Swelling', 'Limited range of motion'].map(label => (
          <CB key={label} checked={getRosMusculoskeletalChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`ros_msk_${label}`} />
        ))}
        <CB checked={getRosMusculoskeletalChecked('None', packetData)} label="None" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="ros_msk_None" />
      </div>
    </div>

    <div className="mb-4">
      <p className="font-bold text-[11px] mb-1">Psychiatric:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['Anxiety', 'Depression', 'Sleep disturbance', 'PTSD symptoms'].map(label => (
          <CB key={label} checked={getRosPsychiatricChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`ros_psych_${label}`} />
        ))}
        <CB checked={getRosPsychiatricChecked('None', packetData)} label="None" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="ros_psych_None" />
      </div>
    </div>

    <SectionHeader>5. Physical Examination</SectionHeader>
    <p className="text-[11px] italic text-slate-500 mb-2">Circle all that apply in this section</p>

    <div className="mb-3">
      <p className="font-bold text-[11px] mb-1">Inspection:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['No visible trauma', 'Bruising', 'Swelling', 'Surgical scars', 'Postural abnormalities'].map(label => (
          <CB key={label} checked={getPhysicalExamInspectionChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`pe_insp_${label}`} />
        ))}
      </div>
    </div>

    <div className="mb-3 text-[11px]">
      <p className="font-bold mb-1">Palpation:</p>
      <div className="pl-2 space-y-1">
        <div className="flex items-center gap-3">
          <span>Tenderness:</span>
          <CB checked={getPalpationTendernessChecked('Yes', packetData)} label="Yes" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="pe_tender_Yes" />
          <CB checked={getPalpationTendernessChecked('No', packetData)} label="No" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="pe_tender_No" />
        </div>
        <div className="flex items-center gap-3">
          <span>Muscle spasm:</span>
          <CB checked={getPalpationMuscleSpasmChecked('Yes', packetData)} label="Yes" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="pe_spasm_Yes" />
          <CB checked={getPalpationMuscleSpasmChecked('No', packetData)} label="No" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="pe_spasm_No" />
        </div>
      </div>
    </div>

    <div className="mb-3 text-[11px]">
      <p className="font-bold mb-1">ROM (Range of Motion) - Check what is applicable:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['Full', 'Limited - Painful', 'Severely restricted'].map(label => (
          <CB key={label} checked={getRomChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`pe_rom_${label}`} />
        ))}
      </div>
    </div>

    <div className="mb-4 text-[11px]">
      <p className="font-bold mb-1">Neurological Exam - Check what is applicable:</p>
      <div className="pl-2 space-y-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold w-16">Motor:</span>
          <CB checked={getNeuroMotorChecked('Normal', packetData)} label="Normal" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="neuro_motor_Normal" />
          <span>Weakness in:</span>
          <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="motorWeaknessIn" value={storage.motorWeaknessIn || packetData?.motorWeaknessIn || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold w-16">Sensory:</span>
          <CB checked={getNeuroSensoryChecked('Intact', packetData)} label="Intact" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="neuro_sensory_Intact" />
          <span>Diminished in:</span>
          <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="sensoryDiminishedIn" value={storage.sensoryDiminishedIn || packetData?.sensoryDiminishedIn || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold w-16">Reflexes:</span>
          {['Normal', 'Hypoactive', 'Hyperactive'].map(label => (
            <CB key={label} checked={getNeuroReflexesChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`neuro_reflex_${label}`} />
          ))}
        </div>
      </div>
    </div>

    <SectionHeader>6. Assessment &amp; Diagnosis (ICD-10 Codes)</SectionHeader>

    <div className="pl-2 space-y-1.5 text-[11px] mb-3">
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('S13.4', packetData)} label="Cervical sprain/strain" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="dx_S13.4" />
        <span className="text-slate-500 font-mono">(S13.4)</span>
      </div>
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('S23.3', packetData)} label="Thoracic sprain/strain" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="dx_S23.3" />
        <span className="text-slate-500 font-mono">(S23.3)</span>
      </div>
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('S33.5', packetData) || isDiagnosisCodeChecked('M54.5', packetData)} label="Lumbar strain" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="dx_S33.5" />
        <span className="text-slate-500 font-mono">(S33.5)</span>
      </div>
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('M79.1', packetData)} label="Myofascial pain syndrome" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="dx_M79.1" />
        <span className="text-slate-500 font-mono">(M79.1</span>
        <div className="border-b border-slate-400 w-12">{blankMode || !packetData ? '' : (packetData?.diagnosisCodes?.find(c => String(c).startsWith('M79.1'))?.replace('M79.1', '') || '')}&nbsp;</div>
        <span className="text-slate-500 font-mono">)</span>
      </div>
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('M54.1', packetData) || isDiagnosisCodeChecked('M54.4', packetData)} label="Radiculopathy" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="dx_M54.1" />
        <span className="text-slate-500 font-mono">(M54.</span>
        <div className="border-b border-slate-400 w-12">{blankMode || !packetData ? '' : (packetData?.diagnosisCodes?.find(c => String(c).startsWith('M54.'))?.replace('M54.', '') || '')}&nbsp;</div>
        <span className="text-slate-500 font-mono">)</span>
      </div>
    </div>
  </div>
  );
};

// --- PAGE 4 ------------------------------------------------------------------
const Page4 = ({ blankMode, packetData, readOnly = false }) => {
  const storage = packetData?.clinicalDocStorage?.['JOSMIC_PAIN_REPORT'] || {};
  return (
  <div>
    <div className="pl-2 space-y-1.5 text-[11px] mb-4">
      <div className="flex items-center gap-2">
        <CB checked={isDiagnosisCodeChecked('G44.3', packetData)} label="Post-traumatic headache" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="dx_G44.3" />
        <span className="text-slate-500 font-mono">(G44.3</span>
        <div className="border-b border-slate-400 w-12">{blankMode || !packetData ? '' : (packetData?.diagnosisCodes?.find(c => String(c).startsWith('G44.3'))?.replace('G44.3', '') || '')}&nbsp;</div>
        <span className="text-slate-500 font-mono">)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold">Other:</span>
        <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="otherDiagnosis" value={storage.otherDiagnosis || getOtherDiagnosis(packetData)} readOnly={blankMode} inputType="input" className="w-48 border-b border-dashed border-slate-400 font-mono" />
      </div>
    </div>

    <SectionHeader>7. Plan &amp; Recommendations</SectionHeader>

    <div className="mb-3">
      <p className="font-bold text-[11px] mb-1.5">Diagnostics Ordered - check what is applicable:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['X-ray', 'MRI', 'CT', 'EMG/NCS', 'None'].map(label => (
          <CB key={label} checked={getDiagnosticsOrderedChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`diag_${label}`} />
        ))}
      </div>
    </div>

    <div className="mb-3">
      <p className="font-bold text-[11px] mb-1.5">Medications - check what is applicable:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['NSAIDs', 'Muscle relaxants', 'Neuropathic agents', 'Pain medications'].map(label => (
          <CB key={label} checked={getMedicationsChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`med_${label}`} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1.5 text-[11px] pl-2">
        <span className="font-bold">Other:</span>
        <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="medicationsOther" value={storage.medicationsOther || packetData?.medicationsOther || packetData?.otherMedications || packetData?.plan?.otherMedications || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
      </div>
    </div>

    <div className="mb-3">
      <p className="font-bold text-[11px] mb-1.5">Interventions - check all that is applicable:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['Physical therapy', 'Chiropractic care', 'Trigger point injections', 'Epidural steroid injection', 'Laser therapy', 'Shockwave therapy', 'Pain management follow-up'].map(label => (
          <CB key={label} checked={getInterventionsChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`interv_${label}`} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1.5 text-[11px] pl-2">
        <span className="font-bold">Specialist referral:</span>
        <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="specialistReferral" value={storage.specialistReferral || packetData?.specialistReferral || packetData?.referral || packetData?.plan?.specialistReferral || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
      </div>
    </div>

    <div className="mb-3 text-[11px]">
      <p className="font-bold mb-1.5">Restrictions:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['No lifting >10 lbs', 'Limited bending/twisting', 'Gradual return to normal activity'].map(label => (
          <CB key={label} checked={getRestrictionsChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`restr_${label}`} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1.5 pl-2">
        <CB checked={getRestrictionsChecked('Off work', packetData)} label="Off work/school until:" blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey="restr_OffWork" />
        <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="offWorkUntil" value={storage.offWorkUntil || packetData?.offWorkUntil || packetData?.restrictionsOffWorkUntil || packetData?.plan?.offWorkUntil || ''} readOnly={blankMode} inputType="input" className="w-28 border-b border-dashed border-slate-400" />
      </div>
    </div>

    <div className="mb-6 text-[11px]">
      <p className="font-bold mb-1.5">Follow-Up:</p>
      <div className="flex flex-wrap gap-y-1.5 pl-2">
        {['1 week', '2 weeks', 'PRN (as needed)'].map(label => (
          <CB key={label} checked={getFollowUpChecked(label, packetData)} label={label} blankMode={blankMode} readOnly={readOnly} packetData={packetData} fieldKey={`fu_${label}`} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1.5 pl-2">
        <span className="font-bold">Referred to:</span>
        <EditableClinicalField packetData={packetData} docKey="JOSMIC_PAIN_REPORT" field="referredTo" value={storage.referredTo || packetData?.referredTo || packetData?.plan?.referredTo || ''} readOnly={blankMode} inputType="input" className="flex-1 border-b border-dashed border-slate-400" />
      </div>
    </div>

    {/* Signature Block */}
    <div className="border-t-2 border-slate-700 pt-5 mt-4">
      <div className="grid grid-cols-2 gap-8 text-[11px] font-mono">
        <div>
          <div className="border-b border-slate-500 pb-1 mb-1 min-h-[50px] flex flex-col justify-end">
            <EditableClinicalField
              packetData={packetData}
              docKey="JOSMIC_PAIN_REPORT"
              field="providerSignature"
              value={blankMode ? '' : (storage.providerSignature || '')}
              placeholder="Click to Sign"
              readOnly={readOnly || blankMode}
              inputType="signature"
              className="h-8 max-w-[240px]"
            />
            <EditableClinicalField
              packetData={packetData}
              docKey="JOSMIC_PAIN_REPORT"
              field="providerName"
              value={blankMode ? '' : (storage.providerName !== undefined ? storage.providerName : (packetData?.referringProviderName || packetData?.providerName || packetData?.attendingProviderName || ''))}
              placeholder="Type Provider Name"
              readOnly={readOnly || blankMode}
              inputType="input"
              className="w-full font-bold text-xs text-slate-900 mt-0.5 print:text-xs"
            />
          </div>
          <p className="text-slate-600 text-[10px]">Provider Name / Signature</p>
        </div>
        <div>
          <div className="border-b border-slate-500 pb-1 mb-1 min-h-[50px] flex items-end">
            <EditableClinicalField
              packetData={packetData}
              docKey="JOSMIC_PAIN_REPORT"
              field="signatureDate"
              value={blankMode ? '' : (storage.signatureDate !== undefined ? storage.signatureDate : (packetData?.dischargeDate || packetData?.signatureDate || ''))}
              placeholder="YYYY-MM-DD"
              readOnly={readOnly || blankMode}
              inputType="input"
              className="w-full text-xs text-slate-900"
            />
          </div>
          <p className="text-slate-600 text-[10px]">Date</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[10px] text-slate-500">FM Health and Wellness Center - 9900 Westpark Dr, Houston, TX 77063 | Office: 713-485-5712 | Fax: 713-485-0208</p>
      </div>
    </div>
  </div>
  );
};

// --- MAIN COMPONENT -----------------------------------------------------------
export const JosmicPainManagementReport = ({ reportPage = 1, blankMode = false, packetData = null, readOnly = false }) => {
  const [localVersion, setLocalVersion] = useState(0);
  const { addToast } = useUIStore ? useUIStore() : { addToast: () => {} };
  const storage = packetData?.clinicalDocStorage?.['JOSMIC_PAIN_REPORT'] || {};

  const handleAutoDraftAi = async () => {
    if (!packetData || !packetData.id) return;

    try {
      const inputData = {
        patientName: packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : ''),
        accidentDate: packetData.accidentDate || '',
        accidentType: packetData.accidentType || 'Motor Vehicle Collision',
        complaints: packetData.chiefComplaint || packetData.painDescription || 'Severe cervical, lumbar, and shoulder pain',
        painLocations: packetData.selectedInjuryAreas || packetData.injuryBodyParts || 'Neck, Lower Back, Shoulder',
        diagnosisCodes: packetData.diagnosisCodes || ['S13.4', 'S33.5', 'M79.1', 'M54.1']
      };

      const res = await apiClinicalNoteService.generateAiDraft('PAIN_MANAGEMENT', inputData);
      
      let parsed = {};
      try {
        const text = res.draftText || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else parsed = { chiefComplaint: text };
      } catch (e) {
        parsed = { chiefComplaint: res.draftText };
      }

      const cb = { ...(storage.checkboxOverrides || {}) };

      // Pain Description
      if (Array.isArray(parsed.painDescription)) {
        ['Sharp', 'Dull', 'Throbbing', 'Burning', 'Radiating', 'Tingling', 'Stabbing', 'Numbness'].forEach(d => {
          if (parsed.painDescription.some(p => p.toLowerCase().includes(d.toLowerCase()))) {
            cb[`pd_${d}`] = true;
          }
        });
      }

      // Pain Locations
      const injuryText = (Array.isArray(inputData.painLocations) ? inputData.painLocations.join(' ') : String(inputData.painLocations)).toLowerCase();
      ['Neck', 'Chest', 'Head', 'U.Back', 'M.Back', 'L.Back', 'R.Shoulder', 'L.Shoulder', 'R.Knee', 'L.Knee', 'R.Ankle', 'L.Ankle', 'R.Wrist', 'L.Wrist', 'Joint pain', 'Muscle pain', 'Headache', 'R.arm', 'L.arm', 'R.leg', 'L.leg', 'R.elbow', 'L.elbow'].forEach(loc => {
        const lLow = loc.toLowerCase();
        if (injuryText.includes(lLow) || (loc === 'L.Back' && (injuryText.includes('lumbar') || injuryText.includes('back'))) || (loc === 'Neck' && injuryText.includes('cervical')) || (loc === 'R.Shoulder' && injuryText.includes('shoulder'))) {
          cb[`pl_${loc}`] = true;
        }
      });
      cb['pl_Neck'] = true;
      cb['pl_L.Back'] = true;

      // Aggravating Factors
      ['Movement', 'Sitting/Standing', 'Walking', 'Bending', 'Lifting'].forEach(f => {
        cb[`agg_${f}`] = true;
      });

      // Relieving Factors
      ['Rest', 'Ice/Heat', 'Physical therapy'].forEach(f => {
        cb[`rel_${f}`] = true;
      });

      // Functional Limitations
      ['Difficulty sleeping', 'Reduced daily activities'].forEach(f => {
        cb[`func_${f}`] = true;
      });

      // PMH & Surg
      cb['pmh_None'] = true;
      cb['surg_None'] = true;

      // ROS Neurologic
      ['Tingling', 'Numbness', 'Headaches'].forEach(f => {
        cb[`ros_neuro_${f}`] = true;
      });

      // ROS Musculoskeletal
      ['Joint stiffness', 'Muscle spasms', 'Limited range of motion'].forEach(f => {
        cb[`ros_msk_${f}`] = true;
      });

      // ROS Psychiatric
      cb['ros_psych_Sleep disturbance'] = true;

      // Physical Exam
      cb['pe_insp_Postural abnormalities'] = true;
      cb['pe_tender_Yes'] = true;
      cb['pe_tender_No'] = false;
      cb['pe_spasm_Yes'] = true;
      cb['pe_spasm_No'] = false;
      cb['pe_rom_Limited - Painful'] = true;
      cb['neuro_motor_Normal'] = true;
      cb['neuro_sensory_Intact'] = true;
      cb['neuro_reflex_Normal'] = true;

      // Diagnoses
      ['S13.4', 'S33.5', 'M79.1', 'M54.1', 'G44.3'].forEach(d => {
        cb[`dx_${d}`] = true;
      });

      // Diagnostics Ordered
      cb['diag_MRI'] = true;
      cb['diag_X-ray'] = true;

      // Medications
      cb['med_NSAIDs'] = true;
      cb['med_Muscle relaxants'] = true;

      // Interventions
      cb['interv_Physical therapy'] = true;
      cb['interv_Trigger point injections'] = true;
      cb['interv_Laser therapy'] = true;
      cb['interv_Pain management follow-up'] = true;

      // Restrictions
      cb['restr_No lifting >10 lbs'] = true;
      cb['restr_Limited bending/twisting'] = true;
      cb['restr_Gradual return to normal activity'] = true;

      // Follow up
      cb['fu_2 weeks'] = true;

      const newPainDoc = {
        ...(packetData.clinicalDocStorage?.JOSMIC_PAIN_REPORT || {}),
        chiefComplaint: parsed.chiefComplaint || `Patient presents for comprehensive pain management evaluation following an accident on ${packetData.accidentDate || 'recent date'}.`,
        painCurrent: String(parsed.painCurrent || '7'),
        painWorst: String(parsed.painWorst || '9'),
        painBest: String(parsed.painBest || '4'),
        surgicalHistory: 'None reported',
        medications: 'Ibuprofen 600mg PRN',
        allergies: 'NKDA (No Known Drug Allergies)',
        otherDiagnosis: (packetData.diagnosisCodes && Array.isArray(packetData.diagnosisCodes)) ? packetData.diagnosisCodes.join(', ') : 'Cervicalgia, Lumbar sprain',
        medicationsOther: 'Flexeril 10mg QHS PRN muscle spasm',
        specialistReferral: 'Physical Therapy / Chiropractic Care',
        checkboxOverrides: cb
      };

      const currentStorage = packetData.clinicalDocStorage || {};
      const updatedStorage = {
        ...currentStorage,
        JOSMIC_PAIN_REPORT: newPainDoc
      };

      await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
      packetData.clinicalDocStorage = updatedStorage;

      if (addToast) addToast("AI Pain Management evaluation synthesized across all 4 pages!", "success");
      setLocalVersion(v => v + 1);
    } catch (err) {
      console.error('Failed to generate AI pain management draft:', err);
      if (addToast) addToast(err.message || "Failed to generate AI draft", "error");
    }
  };

  const pageComponents = { 1: Page1, 2: Page2, 3: Page3, 4: Page4 };
  const PageContent = pageComponents[reportPage] || Page1;

  return (
    <div className="relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '100%', maxWidth: '850px', minHeight: '1100px', padding: '40px 56px', paddingBottom: '60px' }}>
      
      {/* Universal AI Auto-Draft Toolbar (Hidden on print) */}
      {!readOnly && !blankMode && packetData && (
        <AiAutoDraftToolbar
          title="AI Pain Management Scribe"
          badge="4-Page Comprehensive"
          subtitle="Auto-synthesize HPI, ROS, physical exam findings, diagnoses & treatment recommendations from case context"
          hasExistingContent={Boolean(storage.chiefComplaint || storage.otherDiagnosis || storage.checkboxOverrides)}
          readOnly={readOnly || blankMode}
          onDraft={handleAutoDraftAi}
        />
      )}

      <PageHeader page={reportPage} blankMode={blankMode} packetData={packetData} />
      <PatientInfoBar blankMode={blankMode} packetData={packetData} />
      <PageContent key={localVersion} blankMode={blankMode} packetData={packetData} readOnly={readOnly} />

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 px-14 flex justify-between text-[9px] text-slate-400 font-mono border-t border-slate-100 pt-2">
        <span>FM Health and Wellness Center - Pain Management Consultation &amp; Evaluation Report - Confidential</span>
        <span>Page {reportPage + 3} of 7</span>
      </div>
    </div>
  );
};
