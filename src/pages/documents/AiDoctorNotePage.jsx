import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiCaseService } from '../../services/api/apiCaseService';
import { AiDoctorsNoteWorkspace } from '../../components/packets/ai/AiDoctorsNoteWorkspace';

export const AiDoctorNotePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCaseId = searchParams.get('caseId');
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(queryCaseId);
  
  useEffect(() => {
    apiCaseService.getCases().then(res => {
      if (res && res.length > 0) {
        setCases(res);
        const matched = res.find(c => c.id === queryCaseId || c.caseId === queryCaseId);
        setSelectedCaseId(matched ? matched.id : res[0].id);
      }
    }).catch(console.error);
  }, []); // Only fetch cases once on mount

  useEffect(() => {
    if (selectedCaseId && queryCaseId !== selectedCaseId) {
      setSearchParams({ caseId: selectedCaseId });
    }
  }, [selectedCaseId, queryCaseId, setSearchParams]);

  const currentCase = cases.find(c => c.id === selectedCaseId || c.caseId === selectedCaseId);

  return (
    <div className="w-full h-full pb-12 print:pb-0 print:p-0">
      {currentCase ? (
        <AiDoctorsNoteWorkspace 
          packetData={currentCase}
          cases={cases}
          selectedCaseId={selectedCaseId}
          setSelectedCaseId={setSelectedCaseId}
          isLocked={false} 
        />
      ) : (
        <div className="p-12 text-center text-slate-500 text-sm">Loading case data...</div>
      )}
    </div>
  );
};
