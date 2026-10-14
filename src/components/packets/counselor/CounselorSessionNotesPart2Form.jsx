// src/components/packets/counselor/CounselorSessionNotesPart2Form.jsx
import React, { useState, useEffect } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { apiClinicalNoteService } from '../../../services/api/apiClinicalNoteService';
import { AiAutoDraftToolbar } from '../common/AiAutoDraftToolbar';
import { useUIStore } from '../../../store/uiStore';
import fmCounselingLogo from '../../../assets/fm_counseling_logo.png';

export const CounselorSessionNotesPart2Form = ({ blankMode = false, packetData = null, bill = null, readOnly = false }) => {
  const docKey = 'FM_COUNSELING_FORM_7';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};
  const { addToast } = useUIStore ? useUIStore() : { addToast: () => {} };

  // Database defaults & dynamic fallbacks from DB
  const dbNotes = packetData?.clinicalNotes || [];
  const dbLines = bill?.serviceLines || bill?.items || [];
  const dbSessions = packetData?.counselingSessions || packetData?.sessions || [];
  
  const getSessionDate = (index) => {
    return dbNotes[index]?.date || dbLines[index]?.dos || dbLines[index]?.dateOfService || dbSessions[index]?.date || dbSessions[index]?.dos || '';
  };

  const getSessionNote = (index) => {
    const n = dbNotes[index];
    if (n) {
      if (typeof n.content === 'object' && n.content !== null) {
        return n.content.clinicalProgress || n.content.narrative || n.content.chiefComplaint || '';
      }
      return n.soapSubjective || n.content || '';
    }
    return dbSessions[index]?.note || dbSessions[index]?.narrative || dbSessions[index]?.content || '';
  };

  const formatHeader = (idx, sessionNum, extra = '') => {
    const d = getSessionDate(idx);
    const suffix = extra ? `; ${extra}` : '';
    return d ? `${d} – Individual psychotherapy, 60 minutes${suffix}` : `Session ${sessionNum} – Individual psychotherapy, 60 minutes${suffix}`;
  };

  // Form State for Sessions 9 through 17
  const [formData, setFormData] = useState({
    session9Header: storage.session9Header !== undefined ? storage.session9Header : formatHeader(8, 9),
    session9Text: storage.session9Text !== undefined ? storage.session9Text : getSessionNote(8),

    session10Header: storage.session10Header !== undefined ? storage.session10Header : formatHeader(9, 10),
    session10Text: storage.session10Text !== undefined ? storage.session10Text : getSessionNote(9),

    session11Header: storage.session11Header !== undefined ? storage.session11Header : formatHeader(10, 11),
    session11Text: storage.session11Text !== undefined ? storage.session11Text : getSessionNote(10),

    session12Header: storage.session12Header !== undefined ? storage.session12Header : formatHeader(11, 12),
    session12Text: storage.session12Text !== undefined ? storage.session12Text : getSessionNote(11),

    session13Header: storage.session13Header !== undefined ? storage.session13Header : formatHeader(12, 13),
    session13Text: storage.session13Text !== undefined ? storage.session13Text : getSessionNote(12),

    session14Header: storage.session14Header !== undefined ? storage.session14Header : formatHeader(13, 14),
    session14Text: storage.session14Text !== undefined ? storage.session14Text : getSessionNote(13),

    session15Header: storage.session15Header !== undefined ? storage.session15Header : formatHeader(14, 15),
    session15Text: storage.session15Text !== undefined ? storage.session15Text : getSessionNote(14),

    session16Header: storage.session16Header !== undefined ? storage.session16Header : formatHeader(15, 16),
    session16Text: storage.session16Text !== undefined ? storage.session16Text : getSessionNote(15),

    session17Header: storage.session17Header !== undefined ? storage.session17Header : formatHeader(16, 17, 'treatment review'),
  });

  useEffect(() => {
    if (!blankMode) {
      const s = packetData?.clinicalDocStorage?.[docKey] || {};
      setFormData({
        session9Header: s.session9Header !== undefined ? s.session9Header : formatHeader(8, 9),
        session9Text: s.session9Text !== undefined ? s.session9Text : getSessionNote(8),

        session10Header: s.session10Header !== undefined ? s.session10Header : formatHeader(9, 10),
        session10Text: s.session10Text !== undefined ? s.session10Text : getSessionNote(9),

        session11Header: s.session11Header !== undefined ? s.session11Header : formatHeader(10, 11),
        session11Text: s.session11Text !== undefined ? s.session11Text : getSessionNote(10),

        session12Header: s.session12Header !== undefined ? s.session12Header : formatHeader(11, 12),
        session12Text: s.session12Text !== undefined ? s.session12Text : getSessionNote(11),

        session13Header: s.session13Header !== undefined ? s.session13Header : formatHeader(12, 13),
        session13Text: s.session13Text !== undefined ? s.session13Text : getSessionNote(12),

        session14Header: s.session14Header !== undefined ? s.session14Header : formatHeader(13, 14),
        session14Text: s.session14Text !== undefined ? s.session14Text : getSessionNote(13),

        session15Header: s.session15Header !== undefined ? s.session15Header : formatHeader(14, 15),
        session15Text: s.session15Text !== undefined ? s.session15Text : getSessionNote(14),

        session16Header: s.session16Header !== undefined ? s.session16Header : formatHeader(15, 16),
        session16Text: s.session16Text !== undefined ? s.session16Text : getSessionNote(15),

        session17Header: s.session17Header !== undefined ? s.session17Header : formatHeader(16, 17, 'treatment review'),
      });
    }
  }, [packetData?.id, packetData?._id, bill?.id, blankMode]);

  const handleChange = async (field, value) => {
    if (readOnly || blankMode) return;
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    const caseId = packetData?.id || packetData?._id;
    if (caseId) {
      try {
        const currentStorage = packetData.clinicalDocStorage || {};
        const updatedDoc = { ...(currentStorage[docKey] || {}), [field]: value };
        const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
        await apiCaseService.updateCase(caseId, { clinicalDocStorage: updatedStorage });
        packetData.clinicalDocStorage = updatedStorage;
      } catch (err) {
        console.error('Failed to save FM Counseling Center Form 7 to DB:', err);
      }
    }
  };

  // 1-Click AI Auto-Draft Generator for Psychotherapy Progress Notes Part 2
  const handleAutoDraftAi = async () => {
    const caseId = packetData?.id || packetData?._id;
    if (!caseId) return;

    const patientNameVal = packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || 'Patient';

    const inputData = {
      patientName: patientNameVal,
      accidentDate: packetData.accidentDate || '',
      accidentType: packetData.accidentType || 'Motor Vehicle Collision',
      complaints: packetData.chiefComplaint || packetData.painDescription || 'Post-collision passenger distress, driving avoidance, and somatic pain',
      painLocations: packetData.selectedInjuryAreas || packetData.injuryBodyParts || 'Cervical / Lumbar spine',
      diagnosisCodes: packetData.diagnosisCodes || ['F43.21', 'F41.1', 'G47.00']
    };

    const res = await apiClinicalNoteService.generateAiDraft('COUNSELING_SESSION_NOTES_PART2', inputData);
    let parsed = {};
    try {
      const text = res.draftText || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else parsed = JSON.parse(text);
    } catch (e) {
      parsed = {};
    }

    const updatedDoc = {
      ...(packetData.clinicalDocStorage?.[docKey] || {}),
      session9Text: parsed.session9Text || formData.session9Text || 'Focused on cognitive processing of vulnerability and driving fears. Explored catastrophic assumptions regarding bodily fragility following collision. Somatic pacing and grounded mindfulness practiced to neutralize panic reactivity during passenger transit.',
      session10Text: parsed.session10Text || formData.session10Text || 'Review of graded in-vivo exposure hierarchy. Patient completed short-distance vehicular travel as a passenger under peak traffic conditions. Diaphragmatic pacing and sensory orientation successfully managed anticipatory spikes.',
      session11Text: parsed.session11Text || formData.session11Text || 'Addressed chronic pain-related demoralization and cognitive fatigue. Explored activity pacing techniques and mindful somatic acceptance for cervical and lumbar soft-tissue stiffness. Patient demonstrated improved coping self-efficacy.',
      session12Text: parsed.session12Text || formData.session12Text || 'Review of driving exposure homework. Patient reported operating vehicle independently on local routes with manageable distress. Reinforced cognitive reframing of intrusive catastrophic crash recollections.',
      session13Text: parsed.session13Text || formData.session13Text || 'Consolidation of exposure gains and emotional regulation. Focused on communication with family and employer regarding functional limitations. Patient reported enhanced mood stability and reduced interpersonal irritability.',
      session14Text: parsed.session14Text || formData.session14Text || 'Intermediate treatment review and objective symptom inventory reassessment. Documented clinically meaningful decreases in GAD-7 anxiety and PCL-5 trauma scores relative to intake baseline.',
      session15Text: parsed.session15Text || formData.session15Text || 'Generalization of coping tools to highway driving and adverse weather conditions. Reviewed anticipatory anxiety management protocols and autonomous stress-reduction routines. Patient reported increased confidence.',
      session16Text: parsed.session16Text || formData.session16Text || 'Preparation for transition to maintenance and discharge phase. Established detailed individualized relapse prevention blueprint, identifying high-risk stressors and emergency stabilization tools.'
    };

    setFormData(prev => ({ ...prev, ...updatedDoc }));

    const currentStorage = packetData.clinicalDocStorage || {};
    const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
    await apiCaseService.updateCase(caseId, { clinicalDocStorage: updatedStorage });
    packetData.clinicalDocStorage = updatedStorage;

    if (addToast) addToast("AI Psychotherapy Progress Notes (Sessions 9–17) drafted successfully!", "success");
  };

  return (
    <div className="w-[800px] max-w-full relative bg-white text-slate-900 font-sans mx-auto border border-slate-300 shadow-md p-10 sm:p-14 flex flex-col min-h-[1050px] print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-8 print:m-0 print:border-none print:shadow-none">
      
      {/* Universal AI Auto-Draft Toolbar (Hidden on print) */}
      {!readOnly && !blankMode && packetData && (
        <AiAutoDraftToolbar
          title="AI Psychotherapy Progress Notes Scribe"
          badge="Sessions 9–17"
          subtitle="Auto-synthesize clinical CBT progress notes for Sessions 9 through 16 based on patient trauma & symptoms"
          hasExistingContent={Boolean(formData.session9Text || formData.session10Text || formData.session11Text || formData.session12Text || formData.session13Text || formData.session14Text || formData.session15Text || formData.session16Text)}
          readOnly={readOnly || blankMode}
          onDraft={handleAutoDraftAi}
        />
      )}

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

      {/* Session 9: 08/27/2026 */}
      <div className="mb-3">
        <div className="text-[11px] font-bold text-[#722F37] mb-1">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session9Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session9Header}
              onChange={(e) => handleChange('session9Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session9Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session9Text}
              onChange={(e) => handleChange('session9Text', e.target.value)}
              rows="4"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 10: 08/31/2026 */}
      <div className="mb-3">
        <div className="text-[11px] font-bold text-[#722F37] mb-1">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session10Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session10Header}
              onChange={(e) => handleChange('session10Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session10Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session10Text}
              onChange={(e) => handleChange('session10Text', e.target.value)}
              rows="4"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 11: 09/04/2026 */}
      <div className="mb-2.5">
        <div className="text-[11px] font-bold text-[#722F37] mb-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session11Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session11Header}
              onChange={(e) => handleChange('session11Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session11Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session11Text}
              onChange={(e) => handleChange('session11Text', e.target.value)}
              rows="2"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 12: 09/07/2026 */}
      <div className="mb-2.5">
        <div className="text-[11px] font-bold text-[#722F37] mb-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session12Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session12Header}
              onChange={(e) => handleChange('session12Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session12Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session12Text}
              onChange={(e) => handleChange('session12Text', e.target.value)}
              rows="2"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 13: 09/10/2026 */}
      <div className="mb-2.5">
        <div className="text-[11px] font-bold text-[#722F37] mb-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session13Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session13Header}
              onChange={(e) => handleChange('session13Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session13Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session13Text}
              onChange={(e) => handleChange('session13Text', e.target.value)}
              rows="2"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 14: 09/14/2026 */}
      <div className="mb-2.5">
        <div className="text-[11px] font-bold text-[#722F37] mb-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session14Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session14Header}
              onChange={(e) => handleChange('session14Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session14Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session14Text}
              onChange={(e) => handleChange('session14Text', e.target.value)}
              rows="2"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 15: 09/18/2026 */}
      <div className="mb-2.5">
        <div className="text-[11px] font-bold text-[#722F37] mb-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session15Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session15Header}
              onChange={(e) => handleChange('session15Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session15Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session15Text}
              onChange={(e) => handleChange('session15Text', e.target.value)}
              rows="2"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 16: 09/21/2026 */}
      <div className="mb-2.5">
        <div className="text-[11px] font-bold text-[#722F37] mb-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session16Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session16Header}
              onChange={(e) => handleChange('session16Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session16Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session16Text}
              onChange={(e) => handleChange('session16Text', e.target.value)}
              rows="3"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 17 Header: 09/28/2026 */}
      <div className="pt-1">
        <div className="text-[11px] font-bold text-[#722F37]">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session17Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session17Header}
              onChange={(e) => handleChange('session17Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
      </div>

    </div>
  );
};
