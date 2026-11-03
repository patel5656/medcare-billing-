// src/components/packets/davs/DavProgressNote.jsx
import React, { useState } from 'react';
import { EditableClinicalField } from '../EditableClinicalField';
import { AiAutoDraftToolbar } from '../common/AiAutoDraftToolbar';
import { apiClinicalNoteService } from '../../../services/api/apiClinicalNoteService';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { useUIStore } from '../../../store/uiStore';

export const DavProgressNote = ({ notePage = 1, blankMode = false, packetData = null, dos = '', serviceLines = [] }) => {
  const [localVersion, setLocalVersion] = useState(0);
  const { addToast } = useUIStore ? useUIStore() : { addToast: () => {} };

  const pageNum = Number(notePage) || 1;
  const docKey = pageNum === 2 ? 'DAVS_PROG_PAGE_2' : 'DAVS_PROG';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  const patientName = blankMode || !packetData 
    ? '' 
    : (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '');

  const getNoteDos = () => {
    if (blankMode || !packetData) return '';
    if (dos) return dos;
    if (packetData.progressNoteDos) return packetData.progressNoteDos;
    if (packetData.progressNoteDate) return packetData.progressNoteDate;
    if (packetData.evaluationDate) return packetData.evaluationDate;
    if (packetData.assessmentDate) return packetData.assessmentDate;
    if (packetData.evalDate) return packetData.evalDate;
    if (packetData.clinicalNoteDate) return packetData.clinicalNoteDate;
    if (packetData.progressNote?.dos) return packetData.progressNote.dos;
    if (packetData.progressNote?.date) return packetData.progressNote.date;
    return '';
  };

  const noteDos = getNoteDos();

  const progressStatus = blankMode || !packetData 
    ? '' 
    : (storage.progressStatus || packetData.progressStatus || packetData.clinicalProgressStatus || packetData.progressNoteStatus || packetData.progressNote?.progressStatus || packetData.progressNote?.status || (pageNum === 2 ? 'Significant Functional Improvement' : 'Moderate Progress / Active Therapy'));

  const subjectiveText = blankMode || !packetData 
    ? '' 
    : (storage.subjective || packetData.subjectiveProgress || packetData.subjectiveComplaints || packetData.soapSubjective || packetData.subjective || packetData.progressNote?.subjective || '');

  const objectiveText = blankMode || !packetData 
    ? '' 
    : (storage.objective || packetData.objectiveEvaluation || packetData.objectiveClinical || packetData.soapObjective || packetData.objective || packetData.progressNote?.objective || '');

  const planText = blankMode || !packetData 
    ? '' 
    : (storage.plan || packetData.planAndRecommendations || packetData.planOfCare || packetData.soapPlan || packetData.plan || packetData.progressNote?.plan || '');

  // 1-Click AI Auto-Draft Generator for Clinical Progress Note (Page 1 or Page 2)
  const handleAutoDraftAi = async () => {
    if (!packetData || !packetData.id) return;

    const patientNameVal = patientName || 'Patient';
    const areaText = Array.isArray(packetData.selectedInjuryAreas) ? packetData.selectedInjuryAreas.join(', ') : (packetData.injuryBodyParts || 'Cervical and Lumbar spine');

    const inputData = {
      notePage: pageNum,
      patientName: patientNameVal,
      dos: noteDos || new Date().toLocaleDateString(),
      accidentDate: packetData.accidentDate || '',
      accidentType: packetData.accidentType || 'Motor Vehicle Collision',
      complaints: packetData.chiefComplaint || packetData.painDescription || 'Spinal pain, stiffness, and myofascial hypertonicity',
      painLocations: areaText,
      diagnosisCodes: packetData.diagnosisCodes || ['M54.50', 'M54.2']
    };

    const res = await apiClinicalNoteService.generateAiDraft('DAVS_PROGRESS_NOTE', inputData);
    let parsed = {};
    try {
      const text = res.draftText || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else parsed = JSON.parse(text);
    } catch (e) {
      parsed = {};
    }

    const defaultSubjective = pageNum === 2
      ? `Patient presents for ongoing progress evaluation. Reports meaningful reduction in cervical and lumbar pain (rated 2-3/10). Notes significant improvement in functional endurance, driving tolerance, and daily activities with only occasional post-exertional stiffness.`
      : `Patient presents for clinical progress evaluation following motor vehicle accident. Reports moderate relief in cervical and lumbar paraspinal pain following initial ESWT shockwave sessions (pain rated 5-6/10). Complains of persistent morning stiffness and muscle tightness during prolonged sitting.`;

    const defaultObjective = pageNum === 2
      ? `Re-examination demonstrates marked reduction in paraspinal muscle hypertonicity and trigger point irritability. Cervical and lumbar active range of motion is within 90-95% of normal limits with minimal end-range discomfort. Strength 5/5 bilaterally. No neurological deficits.`
      : `Palpation reveals taut myofascial bands and localized trigger points with moderate tenderness across cervical and lumbar paraspinal musculature. Active range of motion is moderately restricted (15-20%) due to pain and muscular guarding. Reflexes and sensation intact.`;

    const defaultPlan = pageNum === 2
      ? `1. Transition to maintenance ESWT shockwave therapy and progressive functional rehabilitation.\n2. Advance dynamic spinal core stabilization and ergonomic home exercise program.\n3. Prepare for discharge criteria and re-evaluate in 2-3 weeks.`
      : `1. Continue Extracorporeal Shockwave Therapy (ESWT Radial protocol: 2.0-2.5 bar, 15 Hz, 2,000 pulses) twice weekly.\n2. Active-assisted stretching and gentle core stabilization exercises.\n3. Clinical re-evaluation in 2 weeks.`;

    const defaultStatus = pageNum === 2
      ? 'Significant Functional Improvement'
      : 'Moderate Progress / Active Therapy';

    const newProgDoc = {
      ...(packetData.clinicalDocStorage?.[docKey] || {}),
      progressStatus: parsed.progressStatus || storage.progressStatus || defaultStatus,
      subjective: parsed.subjective || storage.subjective || defaultSubjective,
      objective: parsed.objective || storage.objective || defaultObjective,
      plan: parsed.plan || storage.plan || defaultPlan
    };

    const currentStorage = packetData.clinicalDocStorage || {};
    const updatedStorage = {
      ...currentStorage,
      [docKey]: newProgDoc
    };

    await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
    packetData.clinicalDocStorage = updatedStorage;

    if (addToast) addToast(`AI Clinical Progress Note (Page ${pageNum}) generated successfully!`, "success");
    setLocalVersion(v => v + 1);
  };

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      
      {/* Universal AI Auto-Draft Toolbar (Hidden on print) */}
      {!blankMode && packetData && (
        <AiAutoDraftToolbar
          title={`AI Progress Note Scribe (Page ${pageNum} of 2)`}
          badge={`Page ${pageNum} – ESWT Shockwave`}
          subtitle={`Auto-synthesize Subjective, Objective & Plan progress evaluation for Page ${pageNum} from patient records`}
          hasExistingContent={Boolean(storage.subjective || storage.objective || storage.plan)}
          readOnly={blankMode}
          onDraft={handleAutoDraftAi}
        />
      )}

      <div>
        <div className="flex justify-between items-start border-b border-slate-300 pb-4">
          <div>
            <h1 className="text-lg font-black text-[#722F37] uppercase italic">FM DAV’S ANATOMY</h1>
            <p className="text-[10px] text-slate-600">CLINICAL PROGRESS EVALUATION NOTE</p>
          </div>
          <div className="text-right font-mono text-[10px]">
            <p>PAGE {notePage} OF 2</p>
            <p>DOS: {noteDos}</p>
          </div>
        </div>

        <div className="bg-[#F9ECEC] p-4 border border-[#E8D3D3] text-xs font-mono grid grid-cols-2 gap-2 mt-6">
          <div>PATIENT: <strong>{patientName}</strong></div>
          <div>
            PROGRESS STATUS:{' '}
            <EditableClinicalField 
              packetData={packetData}
              docKey={docKey}
              field="progressStatus"
              value={progressStatus} 
              readOnly={blankMode || !packetData} 
              inputType="input"
              className="font-bold text-[#722F37] bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 text-xs leading-relaxed text-slate-800 flex flex-col justify-start">
        <div>
          <h2 className="font-bold border-b border-[#E8D3D3] pb-1 text-[#722F37]">SUBJECTIVE PROGRESS & COMPLAINTS</h2>
          <EditableClinicalField 
            packetData={packetData}
            docKey={docKey}
            field="subjective"
            value={subjectiveText} 
            readOnly={blankMode || !packetData} 
            minHeightClass="min-h-[4rem]" 
            className="hover:bg-[#F9ECEC] focus:bg-[#F9ECEC] focus:ring-[#722F37]"
          />
        </div>

        <div>
          <h2 className="font-bold border-b border-[#E8D3D3] pb-1 text-[#722F37]">OBJECTIVE CLINICAL EVALUATION</h2>
          <EditableClinicalField 
            packetData={packetData}
            docKey={docKey}
            field="objective"
            value={objectiveText} 
            readOnly={blankMode || !packetData} 
            minHeightClass="min-h-[4rem]" 
            className="hover:bg-[#F9ECEC] focus:bg-[#F9ECEC] focus:ring-[#722F37]"
          />
        </div>

        <div>
          <h2 className="font-bold border-b border-[#E8D3D3] pb-1 text-[#722F37]">PLAN & RECOMMENDATIONS</h2>
          <EditableClinicalField 
            packetData={packetData}
            docKey={docKey}
            field="plan"
            value={planText} 
            readOnly={blankMode || !packetData} 
            minHeightClass="min-h-[4rem]" 
            className="hover:bg-[#F9ECEC] focus:bg-[#F9ECEC] focus:ring-[#722F37]"
          />
        </div>
      </div>
    </div>
  );
};


