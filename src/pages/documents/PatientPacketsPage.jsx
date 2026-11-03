// src/pages/documents/PatientPacketsPage.jsx
import React, { useState, useEffect } from 'react';
import { UnifiedPacketViewer } from '../../components/packets/UnifiedPacketViewer';
import { apiCaseService } from '../../services/api/apiCaseService';
import { User, FileText, ChevronDown } from 'lucide-react';

export const PatientPacketsPage = () => {
  const [selectedProvider, setSelectedProvider] = useState('prov-counselor');
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiCaseService.getCases().then(res => {
      setCases(res || []);
      if (res && res.length > 0) {
        setSelectedCaseId(res[0].id);
      }
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load cases from DB:', err);
      setLoading(false);
    });
  }, []);

  const selectedCase = cases.find(c => c.id === selectedCaseId) || cases[0] || null;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Patient Case Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Case Document Packets</h1>
          <p className="text-xs text-slate-500">Live Database Connected • Multi-page provider packets featuring clinical assessments, procedure forms, billing statements, and reports</p>
        </div>

        {/* Global Patient Case Selector */}
        <div className="relative bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 max-w-sm w-full">
          <User className="w-5 h-5 text-indigo-600 shrink-0 ml-1" />
          <div className="flex-1 min-w-0 relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Active Patient Case (DB)</label>
            <button
              onClick={() => setIsCaseDropdownOpen(!isCaseDropdownOpen)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer focus:outline-none"
            >
              <span className="block truncate pr-2">
                {selectedCase ? `${selectedCase.patientName} (${selectedCase.caseId})` : (loading ? 'Loading Cases...' : '-- Select Patient Case --')}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isCaseDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isCaseDropdownOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] max-h-60 overflow-y-auto">
                {cases.map(c => (
                  <div 
                    key={c.id} 
                    className={`px-3 py-2.5 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors ${selectedCaseId === c.id ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500' : 'text-slate-800 border-l-2 border-transparent'}`}
                    onClick={() => { setSelectedCaseId(c.id); setIsCaseDropdownOpen(false); }}
                  >
                    <div className="font-bold text-slate-900">{c.patientName}</div>
                    <div className="text-[10px] text-slate-500">Case ID: {c.caseId} • DOA: {c.accidentDate || 'N/A'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Provider Packet Selectors */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setSelectedProvider('prov-counselor')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            selectedProvider === 'prov-counselor' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          FM Counseling Center (Forms 1-10)
        </button>
        <button
          onClick={() => setSelectedProvider('prov-anik')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            selectedProvider === 'prov-anik' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          FM Laser Therapy (15 Pages)
        </button>
        <button
          onClick={() => setSelectedProvider('prov-davs')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            selectedProvider === 'prov-davs' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          FM Dav’s Anatomy ESWT (13 Pages)
        </button>
        <button
          onClick={() => setSelectedProvider('prov-josmic')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            selectedProvider === 'prov-josmic' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          FM Health Consult (7 Pages)
        </button>
        <button
          onClick={() => setSelectedProvider('prov-general')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
            selectedProvider === 'prov-general' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Final Treatment (1 Page)
        </button>
      </div>

      <UnifiedPacketViewer providerId={selectedProvider} selectedCase={selectedCase} />

    </div>
  );
};
