// src/pages/clinical/AssessmentsAndFormsPage.jsx
import React, { useState, useEffect } from 'react';
import { UnifiedPacketViewer } from '../../components/packets/UnifiedPacketViewer';
import { apiCaseService } from '../../services/api/apiCaseService';
import { Clock, User } from 'lucide-react';

export const AssessmentsAndFormsPage = () => {
  const [activeTab, setActiveTab] = useState('ANIK');
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);

  useEffect(() => {
    apiCaseService.getCases().then(res => {
      setCases(res);
      if (res && res.length > 0) {
        setSelectedCaseId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  const selectedCase = cases.find(c => c.id === selectedCaseId) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessments & Clinical Procedure Forms</h1>
          <p className="text-xs text-slate-500">Provider-specific specialized evaluation and therapy session documentation forms</p>
        </div>
        
        {/* Global Case Selector */}
        <div className="relative bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 max-w-sm w-full">
          <User className="w-5 h-5 text-teal-600 shrink-0 ml-1" />
          <div className="flex-1 min-w-0 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Select Patient Case</label>
            <button
              onClick={() => setIsCaseDropdownOpen(!isCaseDropdownOpen)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer focus:outline-none"
            >
              <span className="block truncate pr-2">{selectedCase ? `${selectedCase.patientName} (${selectedCase.caseId})` : '-- Select a Patient Case --'}</span>
              <svg className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isCaseDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            {isCaseDropdownOpen && (
              <div className="absolute top-full right-0 mt-4 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto">
                <div 
                  className="px-3 py-2.5 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                  onClick={() => { setSelectedCaseId(''); setIsCaseDropdownOpen(false); }}
                >
                  -- Select a Patient Case --
                </div>
                {cases.map(c => (
                  <div 
                    key={c.id} 
                    className={`px-3 py-2.5 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors ${selectedCaseId === c.id ? 'bg-teal-50 text-teal-700 border-l-2 border-teal-500' : 'text-slate-800 border-l-2 border-transparent'}`}
                    onClick={() => { setSelectedCaseId(c.id); setIsCaseDropdownOpen(false); }}
                  >
                    {c.patientName} ({c.caseId})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modality Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('JOSMIC')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'JOSMIC' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Pain Management (JOSMIC Pain Report)
        </button>
        <button
          onClick={() => setActiveTab('ANIK')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'ANIK' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Laser Therapy (ANIK Assessment & Procedure)
        </button>
        <button
          onClick={() => setActiveTab('DAVS')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'DAVS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Shockwave Therapy (DAV'S ESWT Form)
        </button>
        <button
          onClick={() => setActiveTab('TPI')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'TPI' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Trigger Point Injection (TPI Form)
        </button>
        <button
          onClick={() => setActiveTab('TECAR')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'TECAR' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          TECAR Therapy (TECAR Form)
        </button>
        <button
          onClick={() => setActiveTab('COUNSELOR')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'COUNSELOR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Counseling (4 Pages)
        </button>
      </div>

      {/* Content Rendering */}
      {activeTab === 'JOSMIC' && (
        <UnifiedPacketViewer providerId="prov-josmic" selectedCase={selectedCase} />
      )}

      {activeTab === 'ANIK' && (
        <UnifiedPacketViewer providerId="prov-anik" selectedCase={selectedCase} />
      )}

      {activeTab === 'DAVS' && (
        <UnifiedPacketViewer providerId="prov-davs" selectedCase={selectedCase} />
      )}

      {activeTab === 'COUNSELOR' && (
        <UnifiedPacketViewer providerId="prov-counselor" selectedCase={selectedCase} />
      )}

      {activeTab === 'TPI' && (
        <UnifiedPacketViewer providerId="prov-tpi" selectedCase={selectedCase} />
      )}

      {activeTab === 'TECAR' && (
        <UnifiedPacketViewer providerId="prov-tecar" selectedCase={selectedCase} />
      )}
    </div>
  );
};
