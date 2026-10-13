// src/components/packets/counselor/CounselorCoverPage.jsx
import React, { useState, useEffect } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import fmCounselingLogo from '../../../assets/fm_counseling_logo.png';

export const CounselorCoverPage = ({ blankMode = false, packetData = null, bill = null, readOnly = false }) => {
  const docKey = 'FM_COUNSELING_EVAL_PAGE_1';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Database defaults & fallbacks from real DB Case
  const dbPatientName = packetData?.patientName || 
    (packetData?.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || 
    '';

  const dbDob = packetData?.patient?.dob || packetData?.dob || packetData?.patientDob || '';
  const dbGender = packetData?.patient?.gender || packetData?.patient?.sex || packetData?.gender || packetData?.sex || '';
  const dbAccidentDate = packetData?.accidentDate || packetData?.doa || packetData?.dateOfAccident || '';

  const notesDates = (packetData?.clinicalNotes || []).map(n => n.date || n.sessionDate).filter(Boolean);
  const billDates = (bill?.serviceLines || bill?.lineItems || []).map(l => l.dos || l.dateOfService).filter(Boolean);
  const allEncounterDates = [...notesDates, ...billDates].sort();
  const earliestDate = allEncounterDates[0] || '';
  const latestDate = allEncounterDates[allEncounterDates.length - 1] || '';

  const dbInitialAssessment = packetData?.initialAssessment || packetData?.initialDate || earliestDate || packetData?.dos || packetData?.assessmentDate || '';
  const dbFinalTreatmentReview = packetData?.finalTreatmentReview || packetData?.dischargeDate || latestDate || '';
  const totalEncounterCount = Math.max(
    (packetData?.clinicalNotes || []).length,
    (bill?.serviceLines || bill?.lineItems || []).length,
    (packetData?.appointments || []).length
  );
  const dbTotalVisits = packetData?.totalVisits || (totalEncounterCount > 0 ? String(totalEncounterCount) : '');

  // Form State
  const [formData, setFormData] = useState({
    patientName: storage.patientName !== undefined ? storage.patientName : dbPatientName,
    dob: storage.dob !== undefined ? storage.dob : dbDob,
    gender: storage.gender !== undefined ? storage.gender : dbGender,
    accidentDate: storage.accidentDate !== undefined ? storage.accidentDate : dbAccidentDate,
    initialAssessment: storage.initialAssessment !== undefined ? storage.initialAssessment : dbInitialAssessment,
    finalTreatmentReview: storage.finalTreatmentReview !== undefined ? storage.finalTreatmentReview : dbFinalTreatmentReview,
    totalVisits: storage.totalVisits !== undefined ? storage.totalVisits : dbTotalVisits,
  });

  useEffect(() => {
    if (!blankMode) {
      const s = packetData?.clinicalDocStorage?.[docKey] || {};
      setFormData({
        patientName: s.patientName !== undefined ? s.patientName : dbPatientName,
        dob: s.dob !== undefined ? s.dob : dbDob,
        gender: s.gender !== undefined ? s.gender : dbGender,
        accidentDate: s.accidentDate !== undefined ? s.accidentDate : dbAccidentDate,
        initialAssessment: s.initialAssessment !== undefined ? s.initialAssessment : dbInitialAssessment,
        finalTreatmentReview: s.finalTreatmentReview !== undefined ? s.finalTreatmentReview : dbFinalTreatmentReview,
        totalVisits: s.totalVisits !== undefined ? s.totalVisits : dbTotalVisits,
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
        console.error('Failed to save FM Counseling Center field to DB:', err);
      }
    }
  };

  return (
    <div className="w-[800px] max-w-full relative bg-white text-slate-900 font-sans mx-auto border border-slate-300 shadow-md p-10 sm:p-14 flex flex-col min-h-[1050px] print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-8 print:m-0 print:border-none print:shadow-none">
      
      {/* Top Header with FM Counseling Center Logo */}
      <div className="text-center mb-3">
        <div className="flex justify-center mb-2">
          <img 
            src={fmCounselingLogo} 
            alt="FM Counseling Center Logo" 
            className="h-28 w-auto object-contain mx-auto" 
          />
        </div>
        <h1 className="text-2xl font-black text-slate-950 tracking-tight">FM COUNSELING CENTER</h1>
        <p className="text-[13px] italic text-slate-600 mt-1">Healing Minds. Restoring Confidence. Moving Forward.</p>
        <p className="text-[11px] text-slate-600 mt-1">9900 Westpark Drive, Suite 354 • Houston, TX 77063</p>
        <p className="text-[11px] text-slate-600 mt-0.5 underline">832-820-2356 • FMHEALTHANDWELLNESS@GMAIL.COM</p>
      </div>

      {/* Horizontal divider */}
      <div className="border-t border-slate-400 my-4"></div>

      {/* Title & Subtitle */}
      <div className="text-center mb-7">
        <h2 className="text-xl font-black text-slate-950 uppercase tracking-wide">PSYCHIATRIC DIAGNOSTIC EVALUATION</h2>
        <p className="text-xs text-slate-600 font-medium mt-1">Behavioral Health Evaluation • Counseling • Progress Notes</p>
      </div>

      {/* PATIENT INFORMATION Table */}
      <div className="border border-slate-300 mb-7 overflow-hidden shadow-sm">
        <div className="bg-[#722F37] text-white px-4 py-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider">PATIENT INFORMATION</h3>
        </div>
        <div className="divide-y divide-slate-200 text-xs">
          {/* Patient Name */}
          <div className="flex items-center">
            <div className="w-48 px-4 py-3 text-slate-600 font-medium bg-slate-50/40">Patient Name</div>
            <div className="flex-1 px-4 py-2.5 font-bold text-slate-950">
              {readOnly ? (
                blankMode ? '' : formData.patientName
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.patientName}
                  onChange={(e) => handleChange('patientName', e.target.value)}
                  placeholder={blankMode ? '' : 'Patient Name'}
                  className="w-full font-bold text-slate-950 bg-transparent outline-none focus:bg-amber-50/50 px-1 py-0.5 rounded border border-transparent focus:border-amber-300"
                />
              )}
            </div>
          </div>

          {/* Date of Birth */}
          <div className="flex items-center">
            <div className="w-48 px-4 py-3 text-slate-600 font-medium bg-slate-50/40">Date of Birth</div>
            <div className="flex-1 px-4 py-2.5 font-bold text-slate-950">
              {readOnly ? (
                blankMode ? '' : formData.dob
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.dob}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  placeholder={blankMode ? '' : 'MM/DD/YYYY'}
                  className="w-full font-bold text-slate-950 bg-transparent outline-none focus:bg-amber-50/50 px-1 py-0.5 rounded border border-transparent focus:border-amber-300"
                />
              )}
            </div>
          </div>

          {/* Gender */}
          <div className="flex items-center">
            <div className="w-48 px-4 py-3 text-slate-600 font-medium bg-slate-50/40">Gender</div>
            <div className="flex-1 px-4 py-2.5 font-bold text-slate-950">
              {readOnly ? (
                blankMode ? '' : formData.gender
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  placeholder={blankMode ? '' : 'Gender'}
                  className="w-full font-bold text-slate-950 bg-transparent outline-none focus:bg-amber-50/50 px-1 py-0.5 rounded border border-transparent focus:border-amber-300"
                />
              )}
            </div>
          </div>

          {/* Date of Accident */}
          <div className="flex items-center">
            <div className="w-48 px-4 py-3 text-slate-600 font-medium bg-slate-50/40">Date of Accident</div>
            <div className="flex-1 px-4 py-2.5 font-bold text-slate-950">
              {readOnly ? (
                blankMode ? '' : formData.accidentDate
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.accidentDate}
                  onChange={(e) => handleChange('accidentDate', e.target.value)}
                  placeholder={blankMode ? '' : 'MM/DD/YYYY'}
                  className="w-full font-bold text-slate-950 bg-transparent outline-none focus:bg-amber-50/50 px-1 py-0.5 rounded border border-transparent focus:border-amber-300"
                />
              )}
            </div>
          </div>

          {/* Initial Assessment */}
          <div className="flex items-center">
            <div className="w-48 px-4 py-3 text-slate-600 font-medium bg-slate-50/40">Initial Assessment</div>
            <div className="flex-1 px-4 py-2.5 font-bold text-slate-950">
              {readOnly ? (
                blankMode ? '' : formData.initialAssessment
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.initialAssessment}
                  onChange={(e) => handleChange('initialAssessment', e.target.value)}
                  placeholder={blankMode ? '' : 'MM/DD/YYYY'}
                  className="w-full font-bold text-slate-950 bg-transparent outline-none focus:bg-amber-50/50 px-1 py-0.5 rounded border border-transparent focus:border-amber-300"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TREATMENT SUMMARY Box */}
      <div className="border border-slate-300 overflow-hidden shadow-sm mb-8">
        <div className="bg-[#f0f0f0] text-slate-900 border-b border-slate-300 px-4 py-2 text-center">
          <h3 className="text-xs font-bold uppercase tracking-wider">TREATMENT SUMMARY</h3>
        </div>
        <div className="p-6 text-center space-y-3 bg-white text-xs text-slate-800">
          <div className="flex items-center justify-center gap-1.5">
            <span>Final Treatment Review:</span>
            {readOnly ? (
              <strong className="font-bold text-slate-950">{blankMode ? '' : formData.finalTreatmentReview}</strong>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.finalTreatmentReview}
                onChange={(e) => handleChange('finalTreatmentReview', e.target.value)}
                placeholder={blankMode ? '' : 'Month DD, YYYY'}
                className="font-bold text-slate-950 bg-transparent outline-none focus:bg-amber-50/50 px-1 py-0.5 rounded border border-transparent focus:border-amber-300 text-center w-48"
              />
            )}
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span>Total Visits:</span>
            {readOnly ? (
              <strong className="font-bold text-slate-950">{blankMode ? '' : formData.totalVisits}</strong>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.totalVisits}
                onChange={(e) => handleChange('totalVisits', e.target.value)}
                placeholder={blankMode ? '' : 'e.g. 17'}
                className="font-bold text-slate-950 bg-transparent outline-none focus:bg-amber-50/50 px-1 py-0.5 rounded border border-transparent focus:border-amber-300 text-center w-20"
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
