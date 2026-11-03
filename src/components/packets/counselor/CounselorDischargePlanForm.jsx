// src/components/packets/counselor/CounselorDischargePlanForm.jsx
import React, { useState, useEffect } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import fmCounselingLogo from '../../../assets/fm_counseling_logo.png';

export const CounselorDischargePlanForm = ({ blankMode = false, packetData = null, bill = null, readOnly = false }) => {
  const docKey = 'FM_COUNSELING_FORM_8';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Database defaults & dynamic fallbacks from DB
  const dbGender = (packetData?.patient?.gender || packetData?.gender || packetData?.patient?.sex || packetData?.sex || '').toLowerCase();
  const dbPronoun = dbGender === 'male' || dbGender === 'm' ? 'He' : (dbGender === 'female' || dbGender === 'f' ? 'She' : 'The patient');

  const notesDates = (packetData?.clinicalNotes || []).map(n => n.date || n.sessionDate).filter(Boolean);
  const billDates = (bill?.serviceLines || bill?.lineItems || []).map(l => l.dos || l.dateOfService).filter(Boolean);
  const allEncounterDates = [...notesDates, ...billDates].sort();
  const latestDate = allEncounterDates[allEncounterDates.length - 1] || '';

  const dbDischargeDate = packetData?.dischargeDate || packetData?.finalTreatmentReview || latestDate || '';
  const dbProvider = packetData?.treatingProvider || bill?.renderingProvider?.name || 'Jordan Miller, LCSW, BCD';
  const dbSigDate = dbDischargeDate || '';
  const dbPainAreas = packetData?.injuryBodyParts || (Array.isArray(packetData?.patient?.selectedInjuryAreas) ? packetData.patient.selectedInjuryAreas.join(', ') : '') || 'reported musculoskeletal discomfort';
  const totalEncounterCount = Math.max(
    (packetData?.clinicalNotes || []).length,
    (bill?.serviceLines || bill?.lineItems || []).length,
    (packetData?.appointments || []).length
  );
  const dbTotalEncounters = packetData?.totalVisits || (totalEncounterCount > 0 ? String(totalEncounterCount) : 'planned');

  // Form State
  const [formData, setFormData] = useState({
    sessionNarrative: storage.sessionNarrative !== undefined ? storage.sessionNarrative :
      `Today's session addressed the patient's emotional difficulties associated with the psychological and functional burden of persistent discomfort involving ${dbPainAreas}. Guided techniques for coping skills and maintaining appropriate activities were reviewed. The therapeutic focus remained on strengthening confidence, reducing avoidance, improving sleep, and supporting meaningful daily functioning.`,

    dischargePlanHeader: storage.dischargePlanHeader !== undefined ? storage.dischargePlanHeader :
      'Discharge and Follow-Up Plan',

    dischargePlanText: storage.dischargePlanText !== undefined ? storage.dischargePlanText :
      `Following completion of the planned ${dbTotalEncounters}-encounter course, the patient was discharged${dbDischargeDate ? ` on ${dbDischargeDate}` : ''}. ${dbPronoun} was advised to continue the coping strategies developed during treatment, seek appropriate medical follow-up for ${dbPainAreas}, and obtain additional behavioral-health care if trauma-related symptoms recur, worsen, or significantly interfere with daily functioning or safety. Emergency assistance should be sought for any acute psychiatric or safety crisis.`,

    providerSignature: storage.providerSignature !== undefined ? storage.providerSignature : dbProvider,
    electronicSignatureText: storage.electronicSignatureText !== undefined ? storage.electronicSignatureText : 'ELECTRONICALLY SIGNED',
    signatureDate: storage.signatureDate !== undefined ? storage.signatureDate : dbSigDate,
  });

  useEffect(() => {
    if (!blankMode) {
      const s = packetData?.clinicalDocStorage?.[docKey] || {};
      setFormData({
        sessionNarrative: s.sessionNarrative !== undefined ? s.sessionNarrative :
          `Today's session addressed the patient's emotional difficulties associated with the psychological and functional burden of persistent discomfort involving ${dbPainAreas}. Guided techniques for coping skills and maintaining appropriate activities were reviewed. The therapeutic focus remained on strengthening confidence, reducing avoidance, improving sleep, and supporting meaningful daily functioning.`,

        dischargePlanHeader: s.dischargePlanHeader !== undefined ? s.dischargePlanHeader :
          'Discharge and Follow-Up Plan',

        dischargePlanText: s.dischargePlanText !== undefined ? s.dischargePlanText :
          `Following completion of the planned ${dbTotalEncounters}-encounter course, the patient was discharged${dbDischargeDate ? ` on ${dbDischargeDate}` : ''}. ${dbPronoun} was advised to continue the coping strategies developed during treatment, seek appropriate medical follow-up for ${dbPainAreas}, and obtain additional behavioral-health care if trauma-related symptoms recur, worsen, or significantly interfere with daily functioning or safety. Emergency assistance should be sought for any acute psychiatric or safety crisis.`,

        providerSignature: s.providerSignature !== undefined ? s.providerSignature : dbProvider,
        electronicSignatureText: s.electronicSignatureText !== undefined ? s.electronicSignatureText : 'ELECTRONICALLY SIGNED',
        signatureDate: s.signatureDate !== undefined ? s.signatureDate : dbSigDate,
      });
    }
  }, [packetData?.id, packetData?._id, packetData?.patientName, blankMode]);

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
        console.error('Failed to save FM Counseling Center Form 8 to DB:', err);
      }
    }
  };

  return (
    <div className="w-[800px] max-w-full relative bg-white text-slate-900 font-sans mx-auto border border-slate-300 shadow-md p-10 sm:p-14 flex flex-col min-h-[1050px] print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-8 print:m-0 print:border-none print:shadow-none">
      
      {/* Top Header with FM Counseling Center Logo */}
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-2 mb-1">
          <img 
            src={fmCounselingLogo} 
            alt="FM Counseling Center Logo" 
            className="h-20 w-auto object-contain mx-auto" 
          />
        </div>
      </div>

      {/* Treatment Review Session Narrative */}
      <div className="mb-8">
        <div className="text-[12px] sm:text-[12.5px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.sessionNarrative}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.sessionNarrative}
              onChange={(e) => handleChange('sessionNarrative', e.target.value)}
              rows="6"
              className="w-full text-[12px] sm:text-[12.5px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none border border-transparent hover:border-slate-200 focus:border-teal-400 p-1 rounded transition"
            />
          )}
        </div>
      </div>

      {/* Discharge and Follow-Up Plan Banner */}
      <div className="mb-4">
        <div className="bg-[#fce8ed] border border-[#f7c5d1] px-4 py-1.5 rounded-sm">
          {readOnly ? (
            <h2 className="text-sm font-bold text-[#722F37]">
              {blankMode ? '' : formData.dischargePlanHeader}
            </h2>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.dischargePlanHeader}
              onChange={(e) => handleChange('dischargePlanHeader', e.target.value)}
              className="w-full text-sm font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>

        {/* Discharge Plan Text */}
        <div className="pt-3">
          <div className="text-[12px] sm:text-[12.5px] leading-relaxed text-slate-700 text-justify">
            {readOnly ? (
              <p>{blankMode ? '' : formData.dischargePlanText}</p>
            ) : (
              <textarea
                value={blankMode ? '' : formData.dischargePlanText}
                onChange={(e) => handleChange('dischargePlanText', e.target.value)}
                rows="6"
                className="w-full text-[12px] sm:text-[12.5px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none border border-transparent hover:border-slate-200 focus:border-teal-400 p-1 rounded transition"
              />
            )}
          </div>
        </div>
      </div>

      {/* Provider Attestation & Electronic Signature Block */}
      <div className="mt-8 flex justify-end">
        <div className="w-80 text-left space-y-1">
          <div className="text-xs text-slate-800">
            <span className="font-semibold">Provider Signature: </span>
            {readOnly ? (
              <span className="font-bold text-slate-900">{blankMode ? '' : formData.providerSignature}</span>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.providerSignature}
                onChange={(e) => handleChange('providerSignature', e.target.value)}
                className="font-bold text-slate-900 bg-transparent outline-none border-b border-transparent focus:border-teal-500 text-xs w-48 inline-block"
              />
            )}
          </div>

          <div className="text-xs font-black tracking-wider text-slate-800">
            {readOnly ? (
              <p>{blankMode ? '' : formData.electronicSignatureText}</p>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.electronicSignatureText}
                onChange={(e) => handleChange('electronicSignatureText', e.target.value)}
                className="font-black tracking-wider text-slate-800 bg-transparent outline-none text-xs w-full"
              />
            )}
          </div>

          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <span>DATE: </span>
            {readOnly ? (
              <span>{blankMode ? '' : formData.signatureDate}</span>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.signatureDate}
                onChange={(e) => handleChange('signatureDate', e.target.value)}
                className="font-semibold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-teal-500 text-xs w-32"
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
