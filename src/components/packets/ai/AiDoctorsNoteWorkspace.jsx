import React, { useState } from 'react';
import { 
  Bot, RefreshCw, Layers, ChevronLeft, Save, Lock, Printer, 
  CheckSquare, Info, Edit3, Eye, FileText, CheckCircle2 
} from 'lucide-react';
import { apiClinicalNoteService } from '../../../services/api/apiClinicalNoteService';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { apiProviderService } from '../../../services/api/apiProviderService';
import { useUIStore } from '../../../store/uiStore';
import { AiDoctorsNoteForm } from './AiDoctorsNoteForm';
import { triggerPrint } from '../../../utils/exportUtils';
import { useAuthStore } from '../../../store/authStore';

export const AiDoctorsNoteWorkspace = ({ packetData, cases = [], selectedCaseId, setSelectedCaseId, isLocked, onBack }) => {
  const { addToast } = useUIStore();
  const { currentUser } = useAuthStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState({});
  const [localPacketData, setLocalPacketData] = useState(packetData);
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'preview'
  const [reviewer, setReviewer] = useState(currentUser?.name || 'Attending Provider');
  const [providers, setProviders] = useState([]);

  React.useEffect(() => {
    apiProviderService.getProviders().then(res => {
      // API returns an object dictionary, convert to array
      const arr = Array.isArray(res) ? res : Object.values(res || {});
      setProviders(arr);
    }).catch((e) => {
      console.error(e);
      setProviders([]);
    });
  }, []);

  React.useEffect(() => {
    setLocalPacketData(packetData);
  }, [packetData]);

  // Collect available documents from clinicalDocStorage (excluding the AI note itself)
  const docStorageKeys = Object.keys(localPacketData?.clinicalDocStorage || {}).filter(k => k !== 'AI_DOCTORS_NOTE');
  
  const dbNotes = (localPacketData?.clinicalNotes || []).map(note => ({
    id: `db_note_${note.id || Math.random().toString(36).substring(7)}`,
    title: note.title || `Clinical Note (${new Date(note.createdAt || note.date || Date.now()).toLocaleDateString()})`,
    date: new Date(note.createdAt || note.date || Date.now()).toISOString().split('T')[0],
    data: note,
    namespace: 'Database Record'
  }));

  const storageNotes = docStorageKeys.map(key => ({
    id: key,
    title: key.replace(/_/g, ' '),
    date: new Date().toISOString().split('T')[0],
    data: localPacketData.clinicalDocStorage[key],
    namespace: key
  }));

  const availableDocs = [...storageNotes, ...dbNotes];

  const toggleDoc = (key) => setSelectedDocs(prev => ({ ...prev, [key]: !prev[key] }));
  const selectAll = () => {
    const all = {};
    availableDocs.forEach(doc => all[doc.id] = true);
    setSelectedDocs(all);
  };
  const clearDocs = () => setSelectedDocs({});

  const handleGenerate = async () => {
    const currentAiDoc = localPacketData?.clinicalDocStorage?.['AI_DOCTORS_NOTE'];
    const hasExistingContent = currentAiDoc && Object.values(currentAiDoc).some(val => val && val.trim() !== '' && val !== 'Information not documented in selected records.');
    
    if (hasExistingContent) {
      const confirmOverwrite = window.confirm("You already have content in this AI Doctor's Note. Generating a new draft will overwrite existing sections. Manual edits will be lost. Regenerate?");
      if (!confirmOverwrite) return;
    }

    setIsGenerating(true);
    try {
      const contextData = {};
      for (const key of Object.keys(selectedDocs)) {
        if (selectedDocs[key]) {
          const doc = availableDocs.find(d => d.id === key);
          if (doc) {
            contextData[doc.title || doc.id] = doc.data;
          }
        }
      }

      if (Object.keys(contextData).length === 0) throw new Error("No documents selected for context.");

      const inputData = {
        patientName: localPacketData?.patientName || 'Unknown Patient',
        instructions: "You are an AI medical scribe. Generate a comprehensive Doctor's Note based ONLY on the provided clinical document context. Do not invent facts. Return a JSON object with these exact keys: chiefComplaint, subjectiveHistory, objectiveFindings, clinicalAssessment, treatmentsAdministered, courseOfCare, treatmentPlan, followUp. If information is missing for a key, return 'Information not documented in selected records.'.",
        context: contextData
      };

      const res = await apiClinicalNoteService.generateAiDraft('DOCTOR_NOTE', inputData);
      
      let generatedJSON = {};
      try {
        const text = res.draftText || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) generatedJSON = JSON.parse(jsonMatch[0]);
        else generatedJSON = { chiefComplaint: res.draftText || 'No summary generated.' };
      } catch(e) {
        generatedJSON = { chiefComplaint: res.draftText };
      }

      const newAiDoc = { ...(currentAiDoc || {}), ...generatedJSON };
      const updatedStorage = { ...(localPacketData?.clinicalDocStorage || {}), AI_DOCTORS_NOTE: newAiDoc };
      
      await apiCaseService.updateCase(localPacketData.id || localPacketData.caseId, { clinicalDocStorage: updatedStorage });

      setLocalPacketData(prev => ({ ...prev, clinicalDocStorage: updatedStorage }));
      addToast("AI Doctor's Note generated successfully!", 'success');
      setActiveTab('form');
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to generate AI note", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedCount = Object.values(selectedDocs).filter(Boolean).length;
  const totalCount = availableDocs.length;

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 print:p-0">
      
      {/* 1. TOP HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition cursor-pointer text-slate-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-[15px] font-extrabold text-slate-900 tracking-tight">AI Doctor's Note Workspace</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-bold tracking-wider uppercase flex items-center gap-1">
                Task 03 Compliant
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium ml-9">Compile patient records, synthesize evidence-based documentation, and finalize editable clinical reports.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Saved
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition cursor-pointer">
            <Lock className="w-3.5 h-3.5 text-slate-400" /> Finalize & Lock
          </button>
          <button onClick={() => triggerPrint()} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm hover:bg-teal-700 transition cursor-pointer">
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
        </div>
      </div>

      {/* 2. PATIENT / REVIEWER CONTEXT ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 print:hidden">
        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-1">Select Patient Case:</label>
          <select 
            value={selectedCaseId || ''} 
            onChange={(e) => setSelectedCaseId && setSelectedCaseId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-teal-500 cursor-pointer"
          >
            {cases.length > 0 ? cases.map(c => (
              <option key={c.id} value={c.id}>{c.patientName} — Case #{c.caseId || c.id}</option>
            )) : <option value="">{localPacketData?.patientName || 'Default Case'}</option>}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-700 mb-1">Attending Clinician / Reviewer:</label>
          <select 
            value={reviewer} 
            onChange={(e) => setReviewer(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value={currentUser?.name || 'Attending Provider'}>{currentUser?.name || 'Attending Provider'}</option>
            {Array.isArray(providers) && providers.map(p => {
              const pName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim();
              if (!pName) return null;
              return <option key={p.id} value={pName}>{pName} ({p.role || p.serviceCategory || p.specialty || 'Provider'})</option>;
            })}
          </select>
        </div>
        <div className="border-l border-slate-300 pl-4 flex flex-col justify-center">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Patient Profile Summary</span>
          <div className="text-[11px]">
            <span className="font-bold text-slate-900">{localPacketData?.patientName || 'Unknown'}</span> <span className="text-slate-400 mx-1">|</span> <span className="text-slate-600">DOB: {localPacketData?.patient?.dob || localPacketData?.patientDob || 'N/A'}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            DOS: {localPacketData?.initialDate || 'N/A'} <span className="text-slate-400 mx-1">|</span> Accident Date: {localPacketData?.accidentDate || 'N/A'}
          </div>
        </div>
      </div>

      {/* 3. COMPILE PATIENT CLINICAL DOCUMENTATION */}
      <div className="bg-white border border-teal-100 rounded-xl p-5 shadow-sm print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" /> Compile Patient Clinical Documentation
            </h2>
            <p className="text-[11px] text-slate-500 ml-6">Select documented records to supply as source evidence for the AI clinical synthesis.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              {selectedCount} of {totalCount} records selected
            </span>
            <button onClick={selectAll} className="text-[10px] font-bold text-slate-600 hover:text-teal-600 transition cursor-pointer">Select All</button>
            <button onClick={clearDocs} className="text-[10px] font-bold text-slate-600 hover:text-teal-600 transition cursor-pointer">Clear</button>
            <button className="px-2 py-1 rounded text-teal-700 bg-teal-50 border border-teal-100 text-[10px] font-bold flex items-center gap-1 cursor-pointer">
              View Source Text <ChevronLeft className="w-3 h-3 -rotate-90" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {availableDocs.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-4">No source documents available.</p>
          ) : (
            availableDocs.map(doc => {
              const isSel = !!selectedDocs[doc.id];
              return (
                <div 
                  key={doc.id} 
                  onClick={() => toggleDoc(doc.id)}
                  className={`relative flex-1 min-w-[280px] p-3 rounded-xl border-2 transition cursor-pointer flex gap-3 ${
                    isSel ? 'border-teal-400 bg-teal-50/30' : 'border-slate-200 bg-white hover:border-teal-200'
                  }`}
                >
                  <div className="pt-0.5">
                    {isSel ? <CheckSquare className="w-4 h-4 text-teal-500" /> : <div className="w-4 h-4 rounded border-2 border-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[11px] font-bold text-slate-900 truncate">{doc.title}</h3>
                      <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">{doc.date}</span>
                    </div>
                    <p className="text-[10px] text-teal-700 font-semibold truncate mb-1">Clinical Record</p>
                    <p className="text-[9px] text-slate-500 line-clamp-2 leading-snug">
                      Data available in database for namespace: {doc.namespace}. Includes structured clinical fields and raw inputs.
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. GENERATION STATUS / ACTION BAR */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600 font-medium">Ready to compile {selectedCount} clinical record(s) into structured report.</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[9px] font-mono font-bold">Model: Backend Persisted Note</span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedCount === 0}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-[11px] rounded-full shadow transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
          {isGenerating ? 'Synthesizing...' : 'Generate Doctor\'s Note with AI'}
        </button>
      </div>

      {/* 5. FORM / PREVIEW TABS */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 print:hidden">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('form')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'form' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Structured Sections Form
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'preview' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Standardized Document Preview
          </button>
        </div>
        <span className="text-[10px] font-medium text-slate-400">Provider Edit Mode Active</span>
      </div>

      {/* Workspace Content Area */}
      <div className="w-full relative">
        {/* Form View (Hidden on print) */}
        <div className={`space-y-4 print:hidden ${activeTab === 'form' ? 'block' : 'hidden'}`}>
          {/* 6. PROVIDER CLINICAL REVIEW INSTRUCTIONS */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-snug">
              <strong>Provider Clinical Review Instructions:</strong> The sections below are populated strictly from the patient's selected records. Undocumented sections indicate "Information not documented in selected records." Review, modify, or add any necessary clinical details before saving or finalization.
            </p>
          </div>
          
          {/* 7. STRUCTURED SECTIONS FORM */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <AiDoctorsNoteForm packetData={localPacketData} isPreview={false} readOnly={isLocked} />
          </div>

          {/* 8. FINALIZE SECTION */}
          <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-bold text-slate-900">Attending Provider Finalize / Lock</h3>
              <p className="text-[10px] text-slate-500">{reviewer}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                Powered by <span className="text-slate-800 font-extrabold tracking-tight">Netlify</span>
              </div>
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[11px] font-bold shadow-sm transition cursor-pointer">
                Finalize & Lock Document
              </button>
            </div>
          </div>
        </div>

        {/* 9. STANDARDIZED DOCUMENT PREVIEW (Always block on print, follows tab on screen) */}
        <div className={`w-full flex justify-center py-4 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto print:bg-white print:border-none print:p-0 print:m-0 print:rounded-none print:block ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
          <AiDoctorsNoteForm packetData={localPacketData} isPreview={true} readOnly={isLocked} />
        </div>
      </div>

    </div>
  );
};
