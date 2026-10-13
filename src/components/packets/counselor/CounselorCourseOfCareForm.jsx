// src/components/packets/counselor/CounselorCourseOfCareForm.jsx
import React, { useState, useEffect } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import fmCounselingLogo from '../../../assets/fm_counseling_logo.png';

export const CounselorCourseOfCareForm = ({ blankMode = false, packetData = null, bill = null, readOnly = false }) => {
  const docKey = 'FM_COUNSELING_FORM_5';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Database defaults & dynamic fallbacks from DB
  const dbAccidentType = packetData?.accidentType || 'motor-vehicle accident';
  const dbPainAreas = packetData?.injuryBodyParts || (Array.isArray(packetData?.patient?.selectedInjuryAreas) ? packetData.patient.selectedInjuryAreas.join(', ') : '') || 'reported musculoskeletal discomfort';
  
  const dbInitialDate = packetData?.initialAssessment || packetData?.initialDate || packetData?.dos || '';
  const dbDischargeDate = packetData?.dischargeDate || packetData?.finalTreatmentReview || '';
  const dbTotalSessions = packetData?.totalVisits || (packetData?.clinicalNotes?.length ? String(packetData.clinicalNotes.length) : (packetData?.appointments?.length ? String(packetData.appointments.length) : ''));

  // Form State
  const [formData, setFormData] = useState({
    clinicalSummaryText: storage.clinicalSummaryText !== undefined ? storage.clinicalSummaryText :
      `Clinical interviews reflected post-traumatic symptoms after the ${(dbAccidentType).toLowerCase()}, including intrusive recollections, avoidance, increased vigilance, disturbed sleep, travel-related anxiety, and reduced concentration. The patient additionally reported ${dbPainAreas}. The behavioral-health plan emphasized emotional stabilization, coping-skill development, improved sleep, and reduction of trauma-related avoidance.`,

    problem1Header: storage.problem1Header !== undefined ? storage.problem1Header :
      'Problem1: Trauma-related intrusion, hyper arousal, and travel anxiety',

    problem1Text: storage.problem1Text !== undefined ? storage.problem1Text :
      'Treatment encouraged recognition of trauma cues, present-focused grounding, regulation of physiological arousal, and more balanced appraisals of current safety. Strategies were reviewed for managing distress when accident reminders, headaches, or physical discomfort increased emotional tension.',

    problem2Header: storage.problem2Header !== undefined ? storage.problem2Header :
      'Problem2: Post-Traumatic Stress Disorder and headache-related distress',

    problem2Text: storage.problem2Text !== undefined ? storage.problem2Text :
      'Interventions emphasized trauma psycho education, cognitive restructuring, relaxation, sleep-hygiene strategies, and reduction of avoidant coping. The patient was encouraged to continue appropriate medical evaluation for headaches and musculoskeletal pain while using behavioral strategies to reduce associated emotional distress.',

    courseOfCareOverview: storage.courseOfCareOverview !== undefined ? storage.courseOfCareOverview :
      `The patient completed documented behavioral-health encounters${(dbInitialDate && dbDischargeDate) ? ` between ${dbInitialDate} and ${dbDischargeDate}` : ''}. The course of care included an initial psychiatric diagnostic evaluation without medical services, followed by ${dbTotalSessions || 'documented'} individual psychotherapy sessions of at least 60 minutes. No medication management was billed.`,

    session1Header: storage.session1Header !== undefined ? storage.session1Header :
      `${dbInitialDate || 'Initial Assessment'} – Initial psychiatric diagnostic evaluation without medical services`,

    session1Text: storage.session1Text !== undefined ? storage.session1Text :
      `The initial evaluation reviewed the ${(dbAccidentType).toLowerCase()}, trauma-related symptoms, ${dbPainAreas}, sleep disturbance, concentration difficulties, emotional distress, psychosocial stressors, and impact on daily functioning. Psychiatric history, coping abilities, support systems, and safety concerns were also assessed. The patient's emotional response to the accident and adjustment to ongoing physical discomfort were explored. An individualized behavioral health treatment plan was developed to improve coping skills, reduce emotional distress, support healthy sleep and daily functioning, and monitor progress throughout treatment.`,

    session2Header: storage.session2Header !== undefined ? storage.session2Header :
      'Session 2 – Individual psychotherapy, 60 minutes',

    session2Text: storage.session2Text !== undefined ? storage.session2Text :
      'The session focused on identifying primary accident reminders and the relationship between physical discomfort and emotional tension. Psycho education regarding post-traumatic stress responses was provided, and paced breathing and grounding techniques were practiced. Attention was also directed toward sleep hygiene and consistent relaxation routines.',
  });

  useEffect(() => {
    if (!blankMode) {
      const s = packetData?.clinicalDocStorage?.[docKey] || {};
      setFormData({
        clinicalSummaryText: s.clinicalSummaryText !== undefined ? s.clinicalSummaryText :
          `Clinical interviews reflected post-traumatic symptoms after the ${(dbAccidentType).toLowerCase()}, including intrusive recollections, avoidance, increased vigilance, disturbed sleep, travel-related anxiety, and reduced concentration. The patient additionally reported ${dbPainAreas}. The behavioral-health plan emphasized emotional stabilization, coping-skill development, improved sleep, and reduction of trauma-related avoidance.`,

        problem1Header: s.problem1Header !== undefined ? s.problem1Header :
          'Problem1: Trauma-related intrusion, hyper arousal, and travel anxiety',

        problem1Text: s.problem1Text !== undefined ? s.problem1Text :
          'Treatment encouraged recognition of trauma cues, present-focused grounding, regulation of physiological arousal, and more balanced appraisals of current safety. Strategies were reviewed for managing distress when accident reminders, headaches, or physical discomfort increased emotional tension.',

        problem2Header: s.problem2Header !== undefined ? s.problem2Header :
          'Problem2: Post-Traumatic Stress Disorder and headache-related distress',

        problem2Text: s.problem2Text !== undefined ? s.problem2Text :
          'Interventions emphasized trauma psycho education, cognitive restructuring, relaxation, sleep-hygiene strategies, and reduction of avoidant coping. The patient was encouraged to continue appropriate medical evaluation for headaches and musculoskeletal pain while using behavioral strategies to reduce associated emotional distress.',

        courseOfCareOverview: s.courseOfCareOverview !== undefined ? s.courseOfCareOverview :
          `The patient completed documented behavioral-health encounters${(dbInitialDate && dbDischargeDate) ? ` between ${dbInitialDate} and ${dbDischargeDate}` : ''}. The course of care included an initial psychiatric diagnostic evaluation without medical services, followed by ${dbTotalSessions || 'documented'} individual psychotherapy sessions of at least 60 minutes. No medication management was billed.`,

        session1Header: s.session1Header !== undefined ? s.session1Header :
          `${dbInitialDate || 'Initial Assessment'} – Initial psychiatric diagnostic evaluation without medical services`,

        session1Text: s.session1Text !== undefined ? s.session1Text :
          `The initial evaluation reviewed the ${(dbAccidentType).toLowerCase()}, trauma-related symptoms, ${dbPainAreas}, sleep disturbance, concentration difficulties, emotional distress, psychosocial stressors, and impact on daily functioning. Psychiatric history, coping abilities, support systems, and safety concerns were also assessed. The patient's emotional response to the accident and adjustment to ongoing physical discomfort were explored. An individualized behavioral health treatment plan was developed to improve coping skills, reduce emotional distress, support healthy sleep and daily functioning, and monitor progress throughout treatment.`,

        session2Header: s.session2Header !== undefined ? s.session2Header :
          'Session 2 – Individual psychotherapy, 60 minutes',

        session2Text: s.session2Text !== undefined ? s.session2Text :
          'The session focused on identifying primary accident reminders and the relationship between physical discomfort and emotional tension. Psycho education regarding post-traumatic stress responses was provided, and paced breathing and grounding techniques were practiced. Attention was also directed toward sleep hygiene and consistent relaxation routines.',
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
        console.error('Failed to save FM Counseling Center Form 5 to DB:', err);
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

      {/* Section 1: Clinical Summary and Treatment Plan */}
      <div className="mb-4">
        <div className="bg-[#f8d7da] px-3 py-1.5 mb-2 text-center sm:text-left">
          <h3 className="text-xs sm:text-[13px] font-bold text-[#722F37]">
            Clinical Summary and Treatment Plan
          </h3>
        </div>
        
        {/* Summary text */}
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify mb-2.5 px-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.clinicalSummaryText}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.clinicalSummaryText}
              onChange={(e) => handleChange('clinicalSummaryText', e.target.value)}
              rows="3"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>

        {/* Problem 1 */}
        <div className="mb-2 px-0.5">
          <div className="text-[11px] font-bold text-slate-900 mb-0.5">
            {readOnly ? (
              <p>{blankMode ? '' : formData.problem1Header}</p>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.problem1Header}
                onChange={(e) => handleChange('problem1Header', e.target.value)}
                className="w-full font-bold text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
          <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
            {readOnly ? (
              <p>{blankMode ? '' : formData.problem1Text}</p>
            ) : (
              <textarea
                value={blankMode ? '' : formData.problem1Text}
                onChange={(e) => handleChange('problem1Text', e.target.value)}
                rows="2"
                className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
              />
            )}
          </div>
        </div>

        {/* Problem 2 */}
        <div className="mb-2 px-0.5">
          <div className="text-[11px] font-bold text-slate-900 mb-0.5">
            {readOnly ? (
              <p>{blankMode ? '' : formData.problem2Header}</p>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.problem2Header}
                onChange={(e) => handleChange('problem2Header', e.target.value)}
                className="w-full font-bold text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
          <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
            {readOnly ? (
              <p>{blankMode ? '' : formData.problem2Text}</p>
            ) : (
              <textarea
                value={blankMode ? '' : formData.problem2Text}
                onChange={(e) => handleChange('problem2Text', e.target.value)}
                rows="2"
                className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Course of Care */}
      <div className="mb-2">
        <div className="bg-[#f8d7da] px-3 py-1.5 mb-2 text-center sm:text-left">
          <h3 className="text-xs sm:text-[13px] font-bold text-[#722F37]">
            Course of Care
          </h3>
        </div>
        
        {/* Course of Care Overview */}
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify mb-2.5 px-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.courseOfCareOverview}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.courseOfCareOverview}
              onChange={(e) => handleChange('courseOfCareOverview', e.target.value)}
              rows="2"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>

        {/* Encounter 1: 08/04/2026 */}
        <div className="mb-3 px-0.5">
          <div className="text-[11px] font-bold text-[#722F37] mb-1">
            {readOnly ? (
              <p>{blankMode ? '' : formData.session1Header}</p>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.session1Header}
                onChange={(e) => handleChange('session1Header', e.target.value)}
                className="w-full font-bold text-[#722F37] bg-transparent outline-none"
              />
            )}
          </div>
          <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
            {readOnly ? (
              <p>{blankMode ? '' : formData.session1Text}</p>
            ) : (
              <textarea
                value={blankMode ? '' : formData.session1Text}
                onChange={(e) => handleChange('session1Text', e.target.value)}
                rows="6"
                className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
              />
            )}
          </div>
        </div>

        {/* Encounter 2: 08/06/2026 */}
        <div className="px-0.5">
          <div className="text-[11px] font-bold text-[#722F37] mb-1">
            {readOnly ? (
              <p>{blankMode ? '' : formData.session2Header}</p>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.session2Header}
                onChange={(e) => handleChange('session2Header', e.target.value)}
                className="w-full font-bold text-[#722F37] bg-transparent outline-none"
              />
            )}
          </div>
          <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
            {readOnly ? (
              <p>{blankMode ? '' : formData.session2Text}</p>
            ) : (
              <textarea
                value={blankMode ? '' : formData.session2Text}
                onChange={(e) => handleChange('session2Text', e.target.value)}
                rows="4"
                className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
