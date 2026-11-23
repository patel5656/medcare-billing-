// src/pages/clinical/AssessmentsAndFormsPage.jsx
import React, { useState, useEffect } from 'react';
import { UnifiedPacketViewer } from '../../components/packets/UnifiedPacketViewer';
import { apiCaseService } from '../../services/api/apiCaseService';
import { useAuthStore } from '../../store/authStore';
import { Clock, User, ShieldAlert } from 'lucide-react';

export const AssessmentsAndFormsPage = () => {
  const { currentUser } = useAuthStore();
  const isDoctor = currentUser?.role === 'Doctor';

  const [activeTab, setActiveTab] = useState(() => (isDoctor ? 'JOSMIC' : 'ANIK'));
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);

  // If Doctor logs in or switches, enforce default active tab to JOSMIC if on a restricted tab
  useEffect(() => {
    if (isDoctor && !['JOSMIC', 'COUNSELOR'].includes(activeTab)) {
      setActiveTab('JOSMIC');
    }
  }, [isDoctor, activeTab]);

  useEffect(() => {
    apiCaseService.getCases().then(res => {
      setCases(res);
      if (res && res.length > 0) {
        setSelectedCaseId(res[0].id);
      }
    }).catch(console.error);
  }, []);

  const selectedCase = cases.find(c => c.id === selectedCaseId) || null;

  // Tab definitions: Doctor sees ONLY Pain Management (JOSMIC) and Counseling (COUNSELOR)
  const allTabs = [
    {
      id: 'JOSMIC',
      label: 'FM MD Consultation (MD Report)',
      activeCls: 'bg-teal-600 text-white shadow-sm',
      allowedForDoctor: true,
    },
    {
      id: 'ANIK',
      label: 'FM Laser Therapy (Assessment & Procedure)',
      activeCls: 'bg-violet-600 text-white shadow-sm',
      allowedForDoctor: false,
    },
    {
      id: 'DAVS',
      label: 'Shockwave (ESWT Shockwave Form)',
      activeCls: 'bg-blue-600 text-white shadow-sm',
      allowedForDoctor: false,
    },
    {
      id: 'TPI',
      label: 'FM Trigger Point Injection (TPI Form)',
      activeCls: 'bg-amber-600 text-white shadow-sm',
      allowedForDoctor: false,
    },
    {
      id: 'TECAR',
      label: 'FM TECAR Therapy (TECAR Form)',
      activeCls: 'bg-rose-600 text-white shadow-sm',
      allowedForDoctor: false,
    },
    {
      id: 'COUNSELOR',
      label: 'FM Counseling Center (Forms 1-10)',
      activeCls: 'bg-indigo-600 text-white shadow-sm',
      allowedForDoctor: true,
    },
  ];

  const visibleTabs = isDoctor ? allTabs.filter(t => t.allowedForDoctor) : allTabs;

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
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === tab.id ? tab.activeCls : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Rendering */}
      {activeTab === 'JOSMIC' && (
        <UnifiedPacketViewer providerId="prov-josmic" selectedCase={selectedCase} />
      )}

      {activeTab === 'COUNSELOR' && (
        <UnifiedPacketViewer providerId="prov-counselor" selectedCase={selectedCase} />
      )}

      {activeTab === 'ANIK' && (
        isDoctor ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">403 - Access Forbidden</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Doctor accounts are restricted to Pain Management and Counseling assessment forms only. Access to FM Laser Therapy is restricted.
            </p>
          </div>
        ) : (
          <UnifiedPacketViewer providerId="prov-anik" selectedCase={selectedCase} />
        )
      )}

      {activeTab === 'DAVS' && (
        isDoctor ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">403 - Access Forbidden</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Doctor accounts are restricted to Pain Management and Counseling assessment forms only. Access to Shockwave is restricted.
            </p>
          </div>
        ) : (
          <UnifiedPacketViewer providerId="prov-davs" selectedCase={selectedCase} />
        )
      )}

      {activeTab === 'TPI' && (
        isDoctor ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">403 - Access Forbidden</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Doctor accounts are restricted to Pain Management and Counseling assessment forms only. Access to FM Trigger Point Injections is restricted.
            </p>
          </div>
        ) : (
          <UnifiedPacketViewer providerId="prov-tpi" selectedCase={selectedCase} />
        )
      )}

      {activeTab === 'TECAR' && (
        isDoctor ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">403 - Access Forbidden</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Doctor accounts are restricted to Pain Management and Counseling assessment forms only. Access to FM TECAR Therapy is restricted.
            </p>
          </div>
        ) : (
          <UnifiedPacketViewer providerId="prov-tecar" selectedCase={selectedCase} />
        )
      )}
    </div>
  );
};
