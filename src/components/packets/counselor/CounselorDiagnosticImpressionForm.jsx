// src/components/packets/counselor/CounselorDiagnosticImpressionForm.jsx
import React, { useState, useEffect } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import fmCounselingLogo from '../../../assets/fm_counseling_logo.png';

export const CounselorDiagnosticImpressionForm = ({ blankMode = false, packetData = null, bill = null, readOnly = false }) => {
  const docKey = 'FM_COUNSELING_FORM_4';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Database defaults & dynamic fallbacks from DB
  const formatDx = () => {
    if (packetData?.diagnosisCodes && Array.isArray(packetData.diagnosisCodes) && packetData.diagnosisCodes.length > 0) {
      const formatted = packetData.diagnosisCodes.map(d => typeof d === 'string' ? d : `${d.code || ''}–${d.description || ''}`).join('; ');
      return `Primary diagnoses: ${formatted}`;
    }
    if (packetData?.diagnoses && Array.isArray(packetData.diagnoses) && packetData.diagnoses.length > 0) {
      return `Primary diagnoses: ${packetData.diagnoses.map(d => `${d.code || ''}–${d.description || ''}`).join('; ')}`;
    }
    return 'Primary diagnoses: Documented Behavioral Health & Related Diagnoses';
  };

  const dbDiagnosesHeader = storage.diagnosesHeader || formatDx();
  const dbAccidentType = packetData?.accidentType || 'motor-vehicle accident';
  const dbPainAreas = packetData?.injuryBodyParts || (Array.isArray(packetData?.patient?.selectedInjuryAreas) ? packetData.patient.selectedInjuryAreas.join(', ') : '') || 'reported physical discomfort and injury areas';
  const dbDxSummary = dbDiagnosesHeader.replace('Primary diagnoses: ', '');

  // Form State
  const [formData, setFormData] = useState({
    diagnosesHeader: storage.diagnosesHeader !== undefined ? storage.diagnosesHeader : dbDiagnosesHeader,

    diagnosticImpressionText: storage.diagnosticImpressionText !== undefined ? storage.diagnosticImpressionText :
      `The clinical presentation included trauma-related intrusion, avoidance, heightened arousal, sleep disturbance, travel-related anxiety, and functional distress following the ${(dbAccidentType).toLowerCase()}. The diagnostic impressions documented for this course of care were ${dbDxSummary}.`,

    treatmentObjectivesText: storage.treatmentObjectivesText !== undefined ? storage.treatmentObjectivesText :
      `Treatment goals focused on reducing trauma-related distress, identifying triggers associated with the collision, improving sleep and concentration, and strengthening coping skills for travel-related anxiety. Sessions also considered the way ${dbPainAreas} affected mood, activity tolerance, and day-to-day functioning.`,

    interventionsText1: storage.interventionsText1 !== undefined ? storage.interventionsText1 :
      'A trauma-informed, supportive approach was used throughout care. Interventions included focused clinical interviewing, psycho education, cognitive-behavioral strategies, grounding exercises, paced breathing, relaxation training, and discussion of practical coping responses for accident reminders, pain-related stress, and vehicle-travel anxiety.',

    interventionsText2: storage.interventionsText2 !== undefined ? storage.interventionsText2 :
      'Treatment addressed intrusive recollections, hyper arousal, avoidance, sleep disruption, concentration difficulty, and fear associated with vehicle travel. The patient was also encouraged to observe how physical discomfort affected stress levels and to use appropriate behavioral coping strategies while continuing medical follow-up for physical complaints as indicated.',

    modality1: storage.modality1 !== undefined ? storage.modality1 : 'Supportive psychotherapy using a trauma-informed approach Cognitive',
    modality2: storage.modality2 !== undefined ? storage.modality2 : 'Behavioral Therapy interventions and cognitive restructuring',
    modality3: storage.modality3 !== undefined ? storage.modality3 : 'Psycho education regarding trauma-related stress, mood, sleep, concentration, and avoidance,',
    modality4: storage.modality4 !== undefined ? storage.modality4 : 'controlled-breathing exercises, relaxation training, grounding, and guided imagery',
    modality5: storage.modality5 !== undefined ? storage.modality5 : 'Sleep-hygiene education, anxiety-management skills, and behavioral activation',

    medicationDisclaimer: storage.medicationDisclaimer !== undefined ? storage.medicationDisclaimer :
      'No medication was prescribed or managed during this course of treatment.',

    mentalStatusText: storage.mentalStatusText !== undefined ? storage.mentalStatusText :
      'Mental-status and safety screening were incorporated into the encounters as clinically indicated. Attention was given to appearance and behavior, orientation, speech, mood and affect, thought organization, perception, concentration, memory, insight, judgment, and risk concerns. Care remained directed toward trauma-related symptoms and restoration of daily functioning.',
  });

  useEffect(() => {
    if (!blankMode) {
      const s = packetData?.clinicalDocStorage?.[docKey] || {};
      const currentDx = s.diagnosesHeader || formatDx();
      const currentSummary = currentDx.replace('Primary diagnoses: ', '');
      setFormData({
        diagnosesHeader: s.diagnosesHeader !== undefined ? s.diagnosesHeader : currentDx,

        diagnosticImpressionText: s.diagnosticImpressionText !== undefined ? s.diagnosticImpressionText :
          `The clinical presentation included trauma-related intrusion, avoidance, heightened arousal, sleep disturbance, travel-related anxiety, and functional distress following the ${(dbAccidentType).toLowerCase()}. The diagnostic impressions documented for this course of care were ${currentSummary}.`,

        treatmentObjectivesText: s.treatmentObjectivesText !== undefined ? s.treatmentObjectivesText :
          `Treatment goals focused on reducing trauma-related distress, identifying triggers associated with the collision, improving sleep and concentration, and strengthening coping skills for travel-related anxiety. Sessions also considered the way ${dbPainAreas} affected mood, activity tolerance, and day-to-day functioning.`,

        interventionsText1: s.interventionsText1 !== undefined ? s.interventionsText1 :
          'A trauma-informed, supportive approach was used throughout care. Interventions included focused clinical interviewing, psycho education, cognitive-behavioral strategies, grounding exercises, paced breathing, relaxation training, and discussion of practical coping responses for accident reminders, pain-related stress, and vehicle-travel anxiety.',

        interventionsText2: s.interventionsText2 !== undefined ? s.interventionsText2 :
          'Treatment addressed intrusive recollections, hyper arousal, avoidance, sleep disruption, concentration difficulty, and fear associated with vehicle travel. The patient was also encouraged to observe how physical discomfort affected stress levels and to use appropriate behavioral coping strategies while continuing medical follow-up for physical complaints as indicated.',

        modality1: s.modality1 !== undefined ? s.modality1 : 'Supportive psychotherapy using a trauma-informed approach Cognitive',
        modality2: s.modality2 !== undefined ? s.modality2 : 'Behavioral Therapy interventions and cognitive restructuring',
        modality3: s.modality3 !== undefined ? s.modality3 : 'Psycho education regarding trauma-related stress, mood, sleep, concentration, and avoidance,',
        modality4: s.modality4 !== undefined ? s.modality4 : 'controlled-breathing exercises, relaxation training, grounding, and guided imagery',
        modality5: s.modality5 !== undefined ? s.modality5 : 'Sleep-hygiene education, anxiety-management skills, and behavioral activation',

        medicationDisclaimer: s.medicationDisclaimer !== undefined ? s.medicationDisclaimer :
          'No medication was prescribed or managed during this course of treatment.',

        mentalStatusText: s.mentalStatusText !== undefined ? s.mentalStatusText :
          'Mental-status and safety screening were incorporated into the encounters as clinically indicated. Attention was given to appearance and behavior, orientation, speech, mood and affect, thought organization, perception, concentration, memory, insight, judgment, and risk concerns. Care remained directed toward trauma-related symptoms and restoration of daily functioning.',
      });
    }
  }, [packetData?.id, packetData?.caseId, packetData?.patientName, blankMode]);

  const handleChange = async (field, value) => {
    if (readOnly || blankMode) return;
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    if (packetData?.id) {
      try {
        const currentStorage = packetData.clinicalDocStorage || {};
        const updatedDoc = { ...(currentStorage[docKey] || {}), [field]: value };
        const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
        await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
        packetData.clinicalDocStorage = updatedStorage;
      } catch (err) {
        console.error('Failed to save FM Counseling Center Form 4 to DB:', err);
      }
    }
  };

  return (
    <div className="w-[800px] max-w-full relative bg-white text-slate-900 font-sans mx-auto border border-slate-300 shadow-md p-10 sm:p-14 flex flex-col min-h-[1050px] print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-8 print:m-0 print:border-none print:shadow-none">
      
      {/* Top Header with FM Counseling Center Logo */}
      <div className="text-center mb-3">
        <div className="flex justify-center items-center gap-2 mb-1">
          <img 
            src={fmCounselingLogo} 
            alt="FM Counseling Center Logo" 
            className="h-20 w-auto object-contain mx-auto" 
          />
        </div>
      </div>

      {/* Section 1: Psychiatric Diagnostic Impression */}
      <div className="mb-4">
        <div className="bg-[#f8d7da] px-3 py-1.5 mb-2">
          <h3 className="text-xs sm:text-[13px] font-bold text-[#722F37]">
            Psychiatric Diagnostic Impression
          </h3>
        </div>
        
        {/* Diagnoses Heading */}
        <div className="text-[11px] font-bold text-slate-900 mb-1.5 px-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.diagnosesHeader}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.diagnosesHeader}
              onChange={(e) => handleChange('diagnosesHeader', e.target.value)}
              className="w-full font-bold text-slate-900 bg-transparent outline-none"
            />
          )}
        </div>

        {/* Diagnostic Impression Narrative */}
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify px-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.diagnosticImpressionText}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.diagnosticImpressionText}
              onChange={(e) => handleChange('diagnosticImpressionText', e.target.value)}
              rows="3"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Section 2: Initial Treatment Objectives */}
      <div className="mb-4">
        <div className="bg-[#f8d7da] px-3 py-1.5 mb-2">
          <h3 className="text-xs sm:text-[13px] font-bold text-[#722F37]">
            Initial Treatment Objectives
          </h3>
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify px-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.treatmentObjectivesText}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.treatmentObjectivesText}
              onChange={(e) => handleChange('treatmentObjectivesText', e.target.value)}
              rows="3"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Section 3: Therapeutic Interventions */}
      <div className="mb-4">
        <div className="bg-[#f8d7da] px-3 py-1.5 mb-2">
          <h3 className="text-xs sm:text-[13px] font-bold text-[#722F37]">
            Therapeutic Interventions
          </h3>
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify space-y-2 px-0.5">
          {readOnly ? (
            <>
              <p>{blankMode ? '' : formData.interventionsText1}</p>
              <p>{blankMode ? '' : formData.interventionsText2}</p>
            </>
          ) : (
            <>
              <textarea
                value={blankMode ? '' : formData.interventionsText1}
                onChange={(e) => handleChange('interventionsText1', e.target.value)}
                rows="3"
                className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
              />
              <textarea
                value={blankMode ? '' : formData.interventionsText2}
                onChange={(e) => handleChange('interventionsText2', e.target.value)}
                rows="3"
                className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
              />
            </>
          )}
        </div>
      </div>

      {/* Section 4: Treatment Modalities */}
      <div className="mb-4">
        <div className="bg-[#f8d7da] px-3 py-1.5 mb-2">
          <h3 className="text-xs sm:text-[13px] font-bold text-[#722F37]">
            Treatment Modalities
          </h3>
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 space-y-0.5 px-3">
          {readOnly ? (
            <>
              <p>{blankMode ? '' : formData.modality1}</p>
              <p>{blankMode ? '' : formData.modality2}</p>
              <p>{blankMode ? '' : formData.modality3}</p>
              <p>{blankMode ? '' : formData.modality4}</p>
              <p>{blankMode ? '' : formData.modality5}</p>
            </>
          ) : (
            <>
              <input
                type="text"
                value={blankMode ? '' : formData.modality1}
                onChange={(e) => handleChange('modality1', e.target.value)}
                className="w-full text-[11px] text-slate-700 bg-transparent outline-none block"
              />
              <input
                type="text"
                value={blankMode ? '' : formData.modality2}
                onChange={(e) => handleChange('modality2', e.target.value)}
                className="w-full text-[11px] text-slate-700 bg-transparent outline-none block"
              />
              <input
                type="text"
                value={blankMode ? '' : formData.modality3}
                onChange={(e) => handleChange('modality3', e.target.value)}
                className="w-full text-[11px] text-slate-700 bg-transparent outline-none block"
              />
              <input
                type="text"
                value={blankMode ? '' : formData.modality4}
                onChange={(e) => handleChange('modality4', e.target.value)}
                className="w-full text-[11px] text-slate-700 bg-transparent outline-none block"
              />
              <input
                type="text"
                value={blankMode ? '' : formData.modality5}
                onChange={(e) => handleChange('modality5', e.target.value)}
                className="w-full text-[11px] text-slate-700 bg-transparent outline-none block"
              />
            </>
          )}

          <div className="pt-1.5 font-bold text-slate-900">
            {readOnly ? (
              <p>{blankMode ? '' : formData.medicationDisclaimer}</p>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.medicationDisclaimer}
                onChange={(e) => handleChange('medicationDisclaimer', e.target.value)}
                className="w-full font-bold text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Section 5: Mental Status and Safety Assessment */}
      <div className="mb-2">
        <div className="bg-[#f8d7da] px-3 py-1.5 mb-2">
          <h3 className="text-xs sm:text-[13px] font-bold text-[#722F37]">
            Mental Status and Safety Assessment
          </h3>
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify px-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.mentalStatusText}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.mentalStatusText}
              onChange={(e) => handleChange('mentalStatusText', e.target.value)}
              rows="3"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

    </div>
  );
};
