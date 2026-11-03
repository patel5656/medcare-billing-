// src/pages/clinical/CounselorSessionPage.jsx
import React, { useState, useEffect } from 'react';
import { apiClinicalNoteService } from '../../services/api/apiClinicalNoteService';
import { apiCaseService } from '../../services/api/apiCaseService';
import { apiCptService } from '../../services/api/apiCptService';
import { apiBillingService } from '../../services/api/apiBillingService';
import { useUIStore } from '../../store/uiStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Save, HeartPulse, Brain, FileText, CheckCircle2, 
  Stethoscope, ShieldAlert, Sparkles, Tag, Clock, User, Calendar,
  AlertCircle, RefreshCw, PlusCircle, Check, Lock, Edit3
} from 'lucide-react';

const COMMON_DIAGNOSES = [
  { code: 'F43.10', label: 'Post-Traumatic Stress Disorder (PTSD), unspecified' },
  { code: 'F41.1', label: 'Generalized Anxiety Disorder (GAD)' },
  { code: 'F43.0', label: 'Acute Stress Reaction / Vehicular Trauma' },
  { code: 'F32.9', label: 'Major Depressive Disorder, single episode, unspecified' },
  { code: 'G89.21', label: 'Chronic pain due to vehicular trauma' },
  { code: 'M54.50', label: 'Low back pain, unspecified (Somatic correlation)' },
];

const CPT_CODES = [
  { code: '90791', label: 'Psychiatric Diagnostic Evaluation (Intake)', duration: '60 min', fee: '$350.00' },
  { code: '90834', label: 'Psychotherapy with patient, 45 minutes', duration: '45 min', fee: '$180.00' },
  { code: '90837', label: 'Psychotherapy with patient, 60 minutes', duration: '60 min', fee: '$240.00' },
  { code: '90832', label: 'Psychotherapy with patient, 30 minutes', duration: '30 min', fee: '$120.00' },
  { code: '90847', label: 'Family Psychotherapy (conjoint psychotherapy)', duration: '50 min', fee: '$220.00' },
];

const SYMPTOM_TAGS = [
  'Vehicular Travel Phobia', 'Passenger Hypervigilance', 'Trauma Flashbacks', 
  'Sleep Disturbance / Nightmares', 'Acute Panic Attacks', 'Avoidance of Driving',
  'Chronic Pain Coping Frustration', 'Demoralization', 'Irritability / Mood Reactivity'
];

export const CounselorSessionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useUIStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [cases, setCases] = useState([]);
  const [cptList, setCptList] = useState(CPT_CODES);

  // Visit & Session History State
  const [visitsData, setVisitsData] = useState({ visits: [], totalRecorded: 0, completedCount: 0, billableCount: 0 });
  const [selectedVisitId, setSelectedVisitId] = useState('NEW_VISIT');
  const [existingNoteObj, setExistingNoteObj] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    caseId: '',
    providerId: 'prov-counselor',
    providerName: 'FM Counselor Practice (Hope Behavioral Health)',
    counselorName: 'Jordan Miller, LCSW, BCD',
    counselorNpi: '1487965213',
    sessionDate: new Date().toISOString().split('T')[0],
    sessionTime: '10:00 AM',
    cptCode: '90834',
    duration: '45 min',
    sessionType: 'Individual Psychotherapy',
    modality: 'Cognitive Behavioral Therapy (CBT) & Somatic Desensitization',
    diagnosisCodes: ['F43.10', 'F41.1'],
    customDiagnosis: '',
    
    // Individualized Clinical Documentation Inputs
    presentingConcerns: '',
    currentSymptoms: '',
    patientReported: '',
    
    // Mental Status Examination (MSE)
    mse: {
      appearance: 'Neat & Appropriate, no acute distress',
      orientation: 'Alert & Oriented x4 (Person, Place, Time, Situation)',
      moodAffect: 'Constricted affect, congruent with post-MVA trauma',
      speech: 'Normal rate and volume, clear tone',
      thoughtProcess: 'Linear, goal-directed, no psychosis',
      suicidalIdeation: 'Negative / Denies ideation, intent, or plan',
    },

    treatmentProvided: '',
    progressSinceLastVisit: '',
    patientResponse: '',
    followUpPlan: '',
    additionalNotes: '',

    // Generated AI Note Content
    aiGeneratedDraft: '',
    aiModelUsed: '',
    aiGeneratedAt: '',
    isApproved: false
  });

  // Load initial cases and CPT schedule
  useEffect(() => {
    apiCaseService.getCases()
      .then(res => {
        if (res && res.length > 0) {
          setCases(res);
          const first = res[0];
          setFormData(prev => ({
            ...prev,
            caseId: first.id || first.caseId,
            patientId: first.patientId,
            patientName: first.patientName || 'Unknown Patient'
          }));
          loadPatientVisits(first.patientId, first.id || first.caseId);
        }
      })
      .catch(console.error);

    apiCptService.getCptCodes()
      .then(res => {
        if (res && res.length > 0) {
          setCptList(res.map(c => ({
            code: c.code,
            label: c.description || c.label || '',
            duration: c.duration || '45 min',
            fee: c.fee ? (String(c.fee).includes('$') ? c.fee : `$${c.fee}`) : '$180.00'
          })));
        }
      })
      .catch(console.error);
  }, []);

  // Fetch recorded visits whenever selected case/patient changes
  const loadPatientVisits = async (pId, cId) => {
    if (!pId) return;
    try {
      const data = await apiBillingService.getCounselingVisits(pId, cId);
      setVisitsData(data);
      if (data.visits && data.visits.length > 0) {
        // Default to latest visit
        const latest = data.visits[data.visits.length - 1];
        handleSelectVisit(latest.id, data.visits);
      } else {
        setSelectedVisitId('NEW_VISIT');
        resetFormToFreshVisit();
      }
    } catch (err) {
      console.warn('Could not load counseling visits for patient:', err);
    }
  };

  const resetFormToFreshVisit = () => {
    setSelectedVisitId('NEW_VISIT');
    setExistingNoteObj(null);
    setFormData(prev => ({
      ...prev,
      sessionDate: new Date().toISOString().split('T')[0],
      sessionTime: '10:00 AM',
      cptCode: '90834',
      duration: '45 min',
      presentingConcerns: '',
      currentSymptoms: '',
      patientReported: '',
      treatmentProvided: '',
      progressSinceLastVisit: '',
      patientResponse: '',
      followUpPlan: 'Continue individual psychotherapy 1x/week. Practice diaphragmatic breathing and thought journal.',
      additionalNotes: '',
      aiGeneratedDraft: '',
      aiModelUsed: '',
      isApproved: false
    }));
  };

  // When a user selects a specific session from history
  const handleSelectVisit = async (visitId, visitList = visitsData.visits) => {
    if (visitId === 'NEW_VISIT') {
      resetFormToFreshVisit();
      return;
    }

    setSelectedVisitId(visitId);
    const targetVisit = visitList.find(v => v.id === visitId);
    if (!targetVisit) return;

    // Populate visit timing and details
    setFormData(prev => ({
      ...prev,
      sessionDate: targetVisit.date || prev.sessionDate,
      sessionTime: targetVisit.startTime || prev.sessionTime,
      cptCode: targetVisit.cptCode || '90834',
      duration: targetVisit.cptCode === '90791' ? '60 min' : (targetVisit.cptCode === '90837' ? '60 min' : '45 min'),
      sessionType: targetVisit.appointmentType || 'Individual Psychotherapy',
    }));

    // If visit already has a note linked, load it directly
    if (targetVisit.hasNote && targetVisit.noteId) {
      try {
        const note = await apiClinicalNoteService.getNoteById(targetVisit.noteId);
        if (note) {
          setExistingNoteObj(note);
          const c = note.content || {};
          setFormData(prev => ({
            ...prev,
            sessionDate: note.date || prev.sessionDate,
            presentingConcerns: c.presentingConcerns || note.soapSubjective || '',
            currentSymptoms: c.currentSymptoms || '',
            patientReported: c.patientReported || '',
            treatmentProvided: c.treatmentProvided || '',
            progressSinceLastVisit: c.progressSinceLastVisit || '',
            patientResponse: c.patientResponse || '',
            followUpPlan: c.followUpPlan || note.soapPlan || '',
            additionalNotes: c.additionalNotes || '',
            aiGeneratedDraft: c.fullNoteText || c.aiDraft || (note.soapSubjective ? `${note.soapSubjective}\n\n${note.soapObjective}\n\n${note.soapAssessment}\n\n${note.soapPlan}` : ''),
            aiModelUsed: c.aiModel || '',
            isApproved: note.status === 'SIGNED_LOCKED' || note.status === 'SIGNED'
          }));
          return;
        }
      } catch (e) {
        console.warn('Could not fetch existing note for visit:', e);
      }
    }

    // If no existing note for this visit, open clean fresh note
    setExistingNoteObj(null);
    setFormData(prev => ({
      ...prev,
      presentingConcerns: targetVisit.reasonForVisit || '',
      currentSymptoms: '',
      patientReported: '',
      treatmentProvided: '',
      progressSinceLastVisit: '',
      patientResponse: '',
      followUpPlan: 'Continue individual psychotherapy 1x/week.',
      additionalNotes: '',
      aiGeneratedDraft: '',
      aiModelUsed: '',
      isApproved: false
    }));
  };

  const handleToggleDiagnosis = (code) => {
    setFormData(prev => {
      const exists = prev.diagnosisCodes.includes(code);
      return {
        ...prev,
        diagnosisCodes: exists 
          ? prev.diagnosisCodes.filter(c => c !== code)
          : [...prev.diagnosisCodes, code]
      };
    });
  };

  const handleAddSymptomTag = (tag) => {
    setFormData(prev => {
      if (prev.currentSymptoms.includes(tag)) return prev;
      const joined = prev.currentSymptoms ? `${prev.currentSymptoms}, ${tag}` : tag;
      return { ...prev, currentSymptoms: joined };
    });
  };

  const handleAddCustomDiagnosis = (e) => {
    e.preventDefault();
    if (!formData.customDiagnosis.trim()) return;
    const clean = formData.customDiagnosis.trim().toUpperCase();
    if (!formData.diagnosisCodes.includes(clean)) {
      setFormData(prev => ({
        ...prev,
        diagnosisCodes: [...prev.diagnosisCodes, clean],
        customDiagnosis: ''
      }));
      addToast(`Added ICD-10 code: ${clean}`, 'success');
    }
  };

  // Generate Individualized AI Clinical Note
  const handleGenerateAiNote = async () => {
    if (!formData.presentingConcerns && !formData.currentSymptoms && !formData.treatmentProvided) {
      addToast('Please enter at least one clinical detail (e.g. Presenting Concerns or Symptoms) before generating AI note.', 'warning');
      return;
    }

    setIsAiGenerating(true);
    try {
      const inputData = {
        patientName: formData.patientName,
        sessionDate: formData.sessionDate,
        cptCode: formData.cptCode,
        duration: formData.duration,
        presentingConcerns: formData.presentingConcerns,
        currentSymptoms: formData.currentSymptoms,
        patientReported: formData.patientReported,
        clinicalObservations: formData.mse,
        treatmentProvided: formData.treatmentProvided,
        progressSinceLastVisit: formData.progressSinceLastVisit,
        patientResponse: formData.patientResponse,
        followUpPlan: formData.followUpPlan,
        additionalNotes: formData.additionalNotes,
        diagnosisCodes: formData.diagnosisCodes
      };

      const res = await apiClinicalNoteService.generateAiDraft('COUNSELING_INDIVIDUAL_NOTE', inputData);
      
      let noteText = '';
      let parsed = null;
      try {
        parsed = typeof res.draftText === 'string' ? JSON.parse(res.draftText) : res.draftText;
      } catch (e) {
        parsed = null;
      }

      if (parsed && parsed.fullNoteText) {
        noteText = parsed.fullNoteText;
      } else if (parsed && parsed.subjective) {
        noteText = `1. SUBJECTIVE / PRESENTING ISSUES:\n${parsed.subjective}\n\n2. MENTAL STATUS EXAMINATION:\n${parsed.mentalStatusExam || ''}\n\n3. THERAPEUTIC INTERVENTIONS PROVIDED:\n${parsed.interventions || ''}\n\n4. PROGRESS & PATIENT RESPONSE:\n${parsed.progressAndResponse || ''}\n\n5. TREATMENT PLAN & NEXT STEPS:\n${parsed.planAndFollowUp || ''}`;
      } else {
        noteText = res.draftText || 'AI Note Draft generated successfully.';
      }

      setFormData(prev => ({
        ...prev,
        aiGeneratedDraft: noteText,
        aiModelUsed: res.model || 'Google Gemini 1.5 Flash (Clinical Synthesizer)',
        aiGeneratedAt: res.generatedAt || new Date().toLocaleTimeString(),
        isApproved: false
      }));

      addToast('AI Clinical Note generated! Review and edit the draft below before saving.', 'success');
    } catch (err) {
      console.error('AI Note generation error:', err);
      addToast('Failed to generate AI note. Your entered clinical inputs were preserved.', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save or Sign Clinical Note
  const handleSave = async (isSignAndLock = false) => {
    if (!formData.caseId) {
      addToast('Please select an active patient case.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      let finalVisitId = selectedVisitId;

      // If user is recording a new visit directly from this page, create the visit first
      if (selectedVisitId === 'NEW_VISIT') {
        const visitRes = await apiBillingService.recordCounselingVisit({
          patientId: formData.patientId,
          caseId: formData.caseId,
          date: formData.sessionDate,
          startTime: formData.sessionTime,
          cptCode: formData.cptCode,
          status: 'COMPLETED',
          reasonForVisit: formData.presentingConcerns || 'Individual Psychotherapy & Trauma Processing'
        });
        if (visitRes.visit) {
          finalVisitId = visitRes.visit.id;
          setSelectedVisitId(finalVisitId);
        }
      }

      const notePayload = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        caseId: formData.caseId,
        appointmentId: finalVisitId,
        providerId: formData.providerId,
        providerName: formData.providerName,
        type: 'COUNSELOR_GENERIC',
        noteType: 'COUNSELOR_GENERIC',
        title: `Counseling Progress Note (${formData.cptCode}) — ${formData.sessionDate}`,
        date: formData.sessionDate,
        author: formData.counselorName,
        status: isSignAndLock ? 'SIGNED_LOCKED' : 'DRAFT',
        soapSubjective: formData.presentingConcerns || '',
        soapObjective: typeof formData.mse === 'object' ? JSON.stringify(formData.mse) : (formData.mse || ''),
        soapAssessment: formData.diagnosisCodes.join(', '),
        soapPlan: formData.followUpPlan || '',
        content: {
          ...formData,
          appointmentId: finalVisitId,
          fullNoteText: formData.aiGeneratedDraft,
          isSigned: isSignAndLock,
          signedDate: isSignAndLock ? new Date().toISOString() : null
        }
      };

      await apiClinicalNoteService.createNote(notePayload);

      addToast(
        isSignAndLock 
          ? 'Clinical Note successfully approved and electronically signed!' 
          : 'Clinical Note draft saved successfully!',
        'success'
      );

      // Refresh patient visits list so counters & note status update
      await loadPatientVisits(formData.patientId, formData.caseId);
    } catch (err) {
      console.error('Error saving clinical note:', err);
      addToast(err.message || 'Failed to save session note', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isLocked = existingNoteObj?.status === 'SIGNED_LOCKED';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('/clinical-notes')} className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline mb-1">
            <ArrowLeft className="w-4 h-4" /> Back to Clinical Notes
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl shadow-xs">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Individualized Counseling & Psychotherapy Note</h1>
              <p className="text-xs text-slate-500">Document patient-specific clinical sessions with AI note generation and separate visit records</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetFormToFreshVisit}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Log New Visit
          </button>
        </div>
      </div>

      {/* Patient & Recorded Visits Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs items-center">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Select Patient Case *</span>
            <select
              value={formData.caseId}
              onChange={(e) => {
                const selected = cases.find(c => (c.id || c.caseId) === e.target.value);
                if (selected) {
                  setFormData(p => ({
                    ...p,
                    caseId: selected.id || selected.caseId,
                    patientId: selected.patientId,
                    patientName: selected.patientName || 'Unknown Patient'
                  }));
                  loadPatientVisits(selected.patientId, selected.id || selected.caseId);
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-teal-500 font-bold"
            >
              {cases.length === 0 && <option value="">Loading DB Cases...</option>}
              {cases.map(c => (
                <option key={c.id || c.caseId} value={c.id || c.caseId}>
                  {c.patientName} ({c.id || c.caseId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Rendering Clinician</span>
            <strong className="text-white text-xs">{formData.counselorName}</strong>
            <p className="text-[11px] text-slate-400">NPI: {formData.counselorNpi}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient Recorded Visits</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-bold text-xs">
                {visitsData.totalRecorded} Total Recorded
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-semibold text-[11px]">
                {visitsData.completedCount} Completed
              </span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Billable Visits</span>
            <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded font-bold text-xs inline-block mt-0.5">
              {visitsData.billableCount} Eligible / Unbilled
            </span>
          </div>
        </div>

        {/* Visit Selector Bar */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-bold">Documenting Session:</span>
            <select
              value={selectedVisitId}
              onChange={(e) => handleSelectVisit(e.target.value)}
              className="bg-slate-800 border border-indigo-400/40 text-teal-300 rounded-lg px-2.5 py-1 text-xs font-bold outline-none"
            >
              <option value="NEW_VISIT">+ Record New Counseling Session</option>
              {visitsData.visits.map(v => (
                <option key={v.id} value={v.id}>
                  Visit #{v.sessionNumber}: {v.date} — {v.cptCode} ({v.status}) {v.hasNote ? '✓ Note Saved' : '⚠️ No Note'}
                </option>
              ))}
            </select>
          </div>

          {isLocked && (
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Note Electronically Signed &amp; Locked
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">

        {/* 1. Session Timing & CPT Procedure Code */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" /> 1. Session Timing &amp; Procedure Coding
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Session Date *</label>
              <input
                type="date"
                disabled={isLocked}
                value={formData.sessionDate}
                onChange={e => setFormData(p => ({ ...p, sessionDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Session Time</label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.sessionTime}
                onChange={e => setFormData(p => ({ ...p, sessionTime: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">CPT Procedure &amp; Duration *</label>
              <select
                disabled={isLocked}
                value={formData.cptCode}
                onChange={e => {
                  const cpt = cptList.find(c => c.code === e.target.value);
                  setFormData(p => ({
                    ...p,
                    cptCode: e.target.value,
                    duration: cpt?.duration || '45 min'
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-teal-700"
              >
                {cptList.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.label} ({c.fee})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. ICD-10 Diagnostic Codes */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-indigo-600" /> 2. ICD-10 / DSM-5 Diagnoses
              </h2>
              <p className="text-[11px] text-slate-500">Selected diagnoses flow directly into visit billing statement &amp; CMS-1500 claim</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500">Active ({formData.diagnosisCodes.length}):</span>
              {formData.diagnosisCodes.map(code => (
                <span key={code} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[11px] border border-indigo-200">
                  {code}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {COMMON_DIAGNOSES.map(item => {
              const active = formData.diagnosisCodes.includes(item.code);
              return (
                <button
                  type="button"
                  key={item.code}
                  disabled={isLocked}
                  onClick={() => handleToggleDiagnosis(item.code)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                    active 
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                      {item.code}
                    </span>
                    <p className="text-xs mt-1 text-slate-800 leading-snug">{item.label}</p>
                  </div>
                  {active && <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              disabled={isLocked}
              placeholder="Add Custom ICD-10 Code (e.g. F43.20, R45.82)"
              value={formData.customDiagnosis}
              onChange={e => setFormData(p => ({ ...p, customDiagnosis: e.target.value }))}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 uppercase font-bold"
            />
            <button
              type="button"
              disabled={isLocked}
              onClick={handleAddCustomDiagnosis}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
            >
              Add Code
            </button>
          </div>
        </div>

        {/* 3. Individualized Clinical Documentation Inputs */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" /> 3. Patient-Specific Clinical Information (For AI Synthesis)
              </h2>
              <p className="text-[11px] text-slate-500">Enter session-specific facts below. The AI will synthesize only these details without hallucinating missing data.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Presenting Concerns &amp; Focus of Session *</label>
              <textarea
                rows={2}
                disabled={isLocked}
                placeholder="e.g. Patient presents reporting heightened travel anxiety when traveling as a front-seat passenger..."
                value={formData.presentingConcerns}
                onChange={e => setFormData(p => ({ ...p, presentingConcerns: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 leading-relaxed font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Symptoms &amp; Trauma Triggers</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SYMPTOM_TAGS.map(t => (
                  <button
                    key={t}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleAddSymptomTag(t)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 transition"
                  >
                    + {t}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                disabled={isLocked}
                placeholder="e.g. Vehicular hypervigilance, difficulty sleeping, intrusive flashbacks of impact, somatic neck tension..."
                value={formData.currentSymptoms}
                onChange={e => setFormData(p => ({ ...p, currentSymptoms: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 leading-relaxed font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Patient-Reported Statement / Subjective Narrative</label>
              <textarea
                rows={2}
                disabled={isLocked}
                placeholder="Patient states: 'I still flinch every time a car merges too close on the highway, but breathing exercises helped me remain calm.'"
                value={formData.patientReported}
                onChange={e => setFormData(p => ({ ...p, patientReported: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 leading-relaxed font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Therapeutic Interventions &amp; Counseling Provided *</label>
                <textarea
                  rows={3}
                  disabled={isLocked}
                  placeholder="e.g. Cognitive restructuring of collision recall, diaphragmatic 4-7-8 breathing regulation, graduated passenger exposure hierarchy."
                  value={formData.treatmentProvided}
                  onChange={e => setFormData(p => ({ ...p, treatmentProvided: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 leading-relaxed font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Progress Since Previous Session</label>
                <textarea
                  rows={3}
                  disabled={isLocked}
                  placeholder="e.g. Patient demonstrated active participation; reported 30% reduction in panic intensity during daytime transit."
                  value={formData.progressSinceLastVisit}
                  onChange={e => setFormData(p => ({ ...p, progressSinceLastVisit: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 leading-relaxed font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Response to Treatment</label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="e.g. Receptive, demonstrated mastery of grounding tools in-session."
                  value={formData.patientResponse}
                  onChange={e => setFormData(p => ({ ...p, patientResponse: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Follow-up Plan &amp; Next Steps</label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="e.g. Continue psychotherapy 1x/wk. Assigned driving anxiety thought record."
                  value={formData.followUpPlan}
                  onChange={e => setFormData(p => ({ ...p, followUpPlan: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Mental Status Examination (MSE) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2.5 flex items-center gap-2">
            <Brain className="w-4 h-4 text-teal-600" /> 4. Clinical Observations &amp; Mental Status Examination (MSE)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Appearance &amp; Grooming</label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.mse.appearance}
                onChange={e => setFormData(p => ({ ...p, mse: { ...p.mse, appearance: e.target.value } }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Orientation &amp; Alertness</label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.mse.orientation}
                onChange={e => setFormData(p => ({ ...p, mse: { ...p.mse, orientation: e.target.value } }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mood &amp; Affect</label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.mse.moodAffect}
                onChange={e => setFormData(p => ({ ...p, mse: { ...p.mse, moodAffect: e.target.value } }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Speech &amp; Thought Process</label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.mse.speech}
                onChange={e => setFormData(p => ({ ...p, mse: { ...p.mse, speech: e.target.value } }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5 text-emerald-700">
                <ShieldAlert className="w-3.5 h-3.5" /> Risk Assessment / Safety Plan
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={formData.mse.suicidalIdeation}
                onChange={e => setFormData(p => ({ ...p, mse: { ...p.mse, suicidalIdeation: e.target.value } }))}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50/40 text-emerald-950 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* 5. AI Note Generation & Editable Note Area */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-teal-50/50 p-5 sm:p-6 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-200/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">5. Individualized AI Counseling Note</h2>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">Click below to synthesize your documented inputs into a structured clinical progress note</p>
            </div>

            <button
              type="button"
              disabled={isAiGenerating || isLocked}
              onClick={handleGenerateAiNote}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 ${
                isAiGenerating
                  ? 'bg-indigo-300 text-white cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isAiGenerating ? 'animate-spin' : ''}`} />
              {isAiGenerating ? 'Generating Note with AI...' : 'Generate AI Note'}
            </button>
          </div>

          {formData.aiGeneratedDraft ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-indigo-900 font-semibold px-1">
                <span>Clinical Note Draft (Editable):</span>
                {formData.aiModelUsed && (
                  <span className="text-slate-500 font-normal">Generated via {formData.aiModelUsed}</span>
                )}
              </div>
              <textarea
                rows={12}
                disabled={isLocked}
                value={formData.aiGeneratedDraft}
                onChange={e => setFormData(p => ({ ...p, aiGeneratedDraft: e.target.value }))}
                className="w-full p-4 rounded-xl border border-indigo-300 bg-white text-slate-900 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
              />
              <p className="text-[10px] text-slate-500 italic">
                * Note: AI draft is for clinician review and must be approved before electronic sign-off.
              </p>
            </div>
          ) : (
            <div className="p-8 text-center bg-white/70 rounded-xl border border-dashed border-indigo-300 text-slate-500 text-xs space-y-1">
              <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
              <p className="font-bold text-slate-700">No AI Note Generated Yet</p>
              <p className="text-[11px]">Fill in the clinical information above and click <span className="font-bold text-indigo-600">"Generate AI Note"</span> to compose an individualized note.</p>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Clinician: <strong>{formData.counselorName}</strong></span>
            {isLocked && <span className="text-emerald-600 font-bold">• Electronically Signed</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/clinical-notes')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Cancel
            </button>

            {!isLocked && (
              <>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSave(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Draft
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSave(true)}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> {isLoading ? 'Saving...' : 'Approve & Sign Note'}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
