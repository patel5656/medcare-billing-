// src/components/packets/counselor/CounselorPsychiatricReportForm.jsx
import React, { useState, useEffect } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import fmCounselingLogo from '../../../assets/fm_counseling_logo.png';

export const CounselorPsychiatricReportForm = ({ blankMode = false, packetData = null, bill = null, readOnly = false }) => {
  const docKey = 'FM_COUNSELING_FORM_3';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Database defaults & dynamic fallbacks from DB
  const dbPatientName = packetData?.patientName || 
    (packetData?.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || 
    '';

  const dbDob = packetData?.patient?.dob || packetData?.dob || packetData?.patientDob || '';
  const dbGender = packetData?.patient?.gender || packetData?.patient?.sex || packetData?.gender || packetData?.sex || '';
  const dbAccidentDate = packetData?.accidentDate || packetData?.doa || packetData?.dateOfAccident || '';
  const dbAccidentType = packetData?.accidentType || 'Motor-vehicle accident';
  const dbAccidentLocation = packetData?.accidentLocation || packetData?.accidentCity || packetData?.patient?.address?.state || packetData?.accidentState || '';
  
  const dbAddress = packetData?.patientAddress || 
    (typeof packetData?.patient?.address === 'string' ? packetData.patient.address : '') || 
    (packetData?.patient?.street ? `${packetData.patient.street || ''} ${packetData.patient.suite || ''}, ${packetData.patient.city || ''} ${packetData.patient.state || ''} ${packetData.patient.zipCode || ''}`.trim() : '') || 
    '';

  const dbTreatingProvider = packetData?.treatingProvider || bill?.renderingProvider?.name || 'Jordan Miller, LCSW, BCD';
  const dbTaxId = packetData?.taxId || bill?.identifiers?.taxId || bill?.billingProvider?.taxId || '84-7891234';
  const dbInjuries = packetData?.injuryBodyParts || (Array.isArray(packetData?.patient?.selectedInjuryAreas) ? packetData.patient.selectedInjuryAreas.join(', ') : '') || 'neck, back, and musculoskeletal discomfort';
  const dbAllergies = packetData?.patient?.knownAllergies || 'No Known Drug Allergy.';
  const dbMedications = packetData?.patient?.currentMedications || 'No psychiatric medication was prescribed or managed during the documented behavioral-health course of care.';
  const dbPastHistory = packetData?.patient?.pastMedicalHistory || 'No significant psychiatric history reported prior to the motor vehicle collision.';

  // Calculate age helper
  const calculateAge = (dobString) => {
    try {
      if (!dobString) return '';
      if (dobString.includes('-')) {
        const parts = dobString.split('-');
        if (parts.length >= 1) {
          const birthYear = parseInt(parts[0], 10);
          if (birthYear > 1900 && birthYear <= 2026) return String(2026 - birthYear);
        }
      } else if (dobString.includes('/')) {
        const parts = dobString.split('/');
        if (parts.length === 3) {
          const birthYear = parseInt(parts[2], 10);
          if (birthYear > 1900 && birthYear <= 2026) return String(2026 - birthYear);
        }
      }
      return '';
    } catch {
      return '';
    }
  };

  const calculatedAge = calculateAge(dbDob);

  // Form State
  const [formData, setFormData] = useState({
    patientName: storage.patientName !== undefined ? storage.patientName : dbPatientName,
    dob: storage.dob !== undefined ? storage.dob : dbDob,
    gender: storage.gender !== undefined ? storage.gender : dbGender,
    accidentDate: storage.accidentDate !== undefined ? storage.accidentDate : dbAccidentDate,
    accidentType: storage.accidentType !== undefined ? storage.accidentType : dbAccidentType,
    accidentLocation: storage.accidentLocation !== undefined ? storage.accidentLocation : dbAccidentLocation,
    patientAddress: storage.patientAddress !== undefined ? storage.patientAddress : dbAddress,
    treatingProvider: storage.treatingProvider !== undefined ? storage.treatingProvider : dbTreatingProvider,
    taxId: storage.taxId !== undefined ? storage.taxId : dbTaxId,
    age: storage.age !== undefined ? storage.age : calculatedAge,

    // Narrative & Clinical Sections
    presentingConcerns: storage.presentingConcerns !== undefined ? storage.presentingConcerns : 
      `${dbPatientName || 'The patient'} presented for behavioral-health evaluation after a ${(dbAccidentType || 'motor-vehicle accident').toLowerCase()}${dbAccidentLocation ? ` in ${dbAccidentLocation}` : ''}${dbAccidentDate ? ` on ${dbAccidentDate}` : ''}. Symptoms included recurrent accident-related distress, disrupted sleep, increased nervousness, intrusive recollections, difficulty concentrating, and apprehension with vehicle travel, alongside ${dbInjuries}.`,

    precipitatingEvent1: storage.precipitatingEvent1 !== undefined ? storage.precipitatingEvent1 :
      `The patient described the collision as sudden and physically and emotionally distressing. Following the accident, persistent discomfort involving ${dbInjuries} contributed to increased tension, sleep disruption, and difficulty returning to usual daily routines.`,

    precipitatingEvent2: storage.precipitatingEvent2 !== undefined ? storage.precipitatingEvent2 :
      'Recurrent memories of the collision, avoidance of accident-related reminders, heightened vigilance, and anxiety during vehicle travel were reported. Physical discomfort was noted to intensify emotional distress and interfere with concentration, mobility, and day-to-day functional tolerance.',

    pastMedicalHistory: storage.pastMedicalHistory !== undefined ? storage.pastMedicalHistory : dbPastHistory,
    currentMedications: storage.currentMedications !== undefined ? storage.currentMedications : dbMedications,
    allergies: storage.allergies !== undefined ? storage.allergies : dbAllergies,
  });

  useEffect(() => {
    if (!blankMode) {
      const s = packetData?.clinicalDocStorage?.[docKey] || {};
      const ageNow = calculateAge(s.dob || dbDob);
      setFormData({
        patientName: s.patientName !== undefined ? s.patientName : dbPatientName,
        dob: s.dob !== undefined ? s.dob : dbDob,
        gender: s.gender !== undefined ? s.gender : dbGender,
        accidentDate: s.accidentDate !== undefined ? s.accidentDate : dbAccidentDate,
        accidentType: s.accidentType !== undefined ? s.accidentType : dbAccidentType,
        accidentLocation: s.accidentLocation !== undefined ? s.accidentLocation : dbAccidentLocation,
        patientAddress: s.patientAddress !== undefined ? s.patientAddress : dbAddress,
        treatingProvider: s.treatingProvider !== undefined ? s.treatingProvider : dbTreatingProvider,
        taxId: s.taxId !== undefined ? s.taxId : dbTaxId,
        age: s.age !== undefined ? s.age : ageNow,

        presentingConcerns: s.presentingConcerns !== undefined ? s.presentingConcerns : 
          `${s.patientName || dbPatientName || 'The patient'} presented for behavioral-health evaluation after a ${(s.accidentType || dbAccidentType || 'motor-vehicle accident').toLowerCase()}${s.accidentLocation || dbAccidentLocation ? ` in ${s.accidentLocation || dbAccidentLocation}` : ''}${s.accidentDate || dbAccidentDate ? ` on ${s.accidentDate || dbAccidentDate}` : ''}. Symptoms included recurrent accident-related distress, disrupted sleep, increased nervousness, intrusive recollections, difficulty concentrating, and apprehension with vehicle travel, alongside ${dbInjuries}.`,

        precipitatingEvent1: s.precipitatingEvent1 !== undefined ? s.precipitatingEvent1 :
          `The patient described the collision as sudden and physically and emotionally distressing. Following the accident, persistent discomfort involving ${dbInjuries} contributed to increased tension, sleep disruption, and difficulty returning to usual daily routines.`,

        precipitatingEvent2: s.precipitatingEvent2 !== undefined ? storage.precipitatingEvent2 :
          'Recurrent memories of the collision, avoidance of accident-related reminders, heightened vigilance, and anxiety during vehicle travel were reported. Physical discomfort was noted to intensify emotional distress and interfere with concentration, mobility, and day-to-day functional tolerance.',

        pastMedicalHistory: s.pastMedicalHistory !== undefined ? s.pastMedicalHistory : dbPastHistory,
        currentMedications: s.currentMedications !== undefined ? s.currentMedications : dbMedications,
        allergies: s.allergies !== undefined ? s.allergies : dbAllergies,
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
        console.error('Failed to save FM Counseling Center Form 3 to DB:', err);
      }
    }
  };

  return (
    <div className="w-[800px] max-w-full relative bg-white text-slate-900 font-sans mx-auto border border-slate-300 shadow-md p-10 sm:p-14 flex flex-col min-h-[1050px] print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-8 print:m-0 print:border-none print:shadow-none">
      
      {/* Top Header with FM Counseling Center Logo */}
      <div className="text-center mb-2">
        <div className="flex justify-center items-center gap-2 mb-1">
          <img 
            src={fmCounselingLogo} 
            alt="FM Counseling Center Logo" 
            className="h-20 w-auto object-contain mx-auto" 
          />
        </div>

        {/* Full-width Pink Banner */}
        <div className="bg-[#f8d7da] py-1.5 px-4 mt-2 mb-1 text-center">
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-wide">
            FM COUNSELING CENTER
          </h1>
        </div>

        <p className="text-[11px] text-slate-700 mt-1">9900 West Park Drive, Suite 354 | Houston, Texas 77063</p>
        <p className="text-[11px] text-slate-700 mt-0.5">Tax ID: {blankMode ? '' : formData.taxId}</p>
      </div>

      {/* Report Title & Subtitle */}
      <div className="text-center mt-3 mb-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-wide">
          PSYCHIATRIC CLINICAL REPORT
        </h2>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Motor-Vehicle Accident-Related Behavioral-Health Treatment
        </p>
      </div>

      {/* Table 1: Patient / Case Information Grid (4 columns with pink label cells) */}
      <div className="border border-slate-400 overflow-hidden shadow-sm mb-4 text-xs">
        {/* Row 1: Patient / DOB */}
        <div className="grid grid-cols-12 border-b border-slate-300">
          <div className="col-span-2 bg-[#f8d7da] text-slate-900 font-bold px-3 py-2 border-r border-slate-300 flex items-center">
            Patient
          </div>
          <div className="col-span-4 bg-white text-slate-950 font-bold px-3 py-2 border-r border-slate-300 flex items-center">
            {readOnly ? (blankMode ? '' : formData.patientName) : (
              <input
                type="text"
                value={blankMode ? '' : formData.patientName}
                onChange={(e) => handleChange('patientName', e.target.value)}
                placeholder={blankMode ? '' : 'Patient Name'}
                className="w-full font-bold text-slate-950 bg-transparent outline-none"
              />
            )}
          </div>
          <div className="col-span-2 bg-[#f8d7da] text-slate-900 font-bold px-3 py-2 border-r border-slate-300 flex items-center">
            DOB
          </div>
          <div className="col-span-4 bg-white text-slate-950 font-bold px-3 py-2 flex items-center">
            {readOnly ? (blankMode ? '' : formData.dob) : (
              <input
                type="text"
                value={blankMode ? '' : formData.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                placeholder={blankMode ? '' : 'MM/DD/YYYY'}
                className="w-full font-bold text-slate-950 bg-transparent outline-none"
              />
            )}
          </div>
        </div>

        {/* Row 2: Sex / Date of Accident */}
        <div className="grid grid-cols-12 border-b border-slate-300">
          <div className="col-span-2 bg-[#f8d7da] text-slate-900 font-bold px-3 py-2 border-r border-slate-300 flex items-center">
            Sex
          </div>
          <div className="col-span-4 bg-white text-slate-900 px-3 py-2 border-r border-slate-300 flex items-center">
            {readOnly ? (blankMode ? '' : formData.gender) : (
              <input
                type="text"
                value={blankMode ? '' : formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                placeholder={blankMode ? '' : 'Gender'}
                className="w-full text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
          <div className="col-span-2 bg-[#f8d7da] text-slate-900 font-bold px-3 py-2 border-r border-slate-300 flex items-center">
            Date of Accident
          </div>
          <div className="col-span-4 bg-white text-slate-900 px-3 py-2 flex items-center">
            {readOnly ? (blankMode ? '' : formData.accidentDate) : (
              <input
                type="text"
                value={blankMode ? '' : formData.accidentDate}
                onChange={(e) => handleChange('accidentDate', e.target.value)}
                placeholder={blankMode ? '' : 'MM/DD/YYYY'}
                className="w-full text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
        </div>

        {/* Row 3: Accident Type / Accident Location */}
        <div className="grid grid-cols-12 border-b border-slate-300">
          <div className="col-span-2 bg-[#f8d7da] text-slate-900 font-bold px-3 py-2 border-r border-slate-300 flex items-center">
            Accident Type
          </div>
          <div className="col-span-4 bg-white text-slate-900 px-3 py-2 border-r border-slate-300 flex items-center">
            {readOnly ? (blankMode ? '' : formData.accidentType) : (
              <input
                type="text"
                value={blankMode ? '' : formData.accidentType}
                onChange={(e) => handleChange('accidentType', e.target.value)}
                placeholder={blankMode ? '' : 'Accident Type'}
                className="w-full text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
          <div className="col-span-2 bg-[#f8d7da] text-slate-900 font-bold px-3 py-2 border-r border-slate-300 flex items-center">
            Accident Location
          </div>
          <div className="col-span-4 bg-white text-slate-900 px-3 py-2 flex items-center">
            {readOnly ? (blankMode ? '' : formData.accidentLocation) : (
              <input
                type="text"
                value={blankMode ? '' : formData.accidentLocation}
                onChange={(e) => handleChange('accidentLocation', e.target.value)}
                placeholder={blankMode ? '' : 'State / Location'}
                className="w-full text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
        </div>

        {/* Row 4: Patient Address / Treating Provider */}
        <div className="grid grid-cols-12">
          <div className="col-span-2 bg-[#f8d7da] text-slate-900 font-bold px-3 py-2 border-r border-slate-300 flex items-center">
            Patient Address
          </div>
          <div className="col-span-4 bg-white text-slate-900 px-3 py-2 border-r border-slate-300 flex items-center">
            {readOnly ? (blankMode ? '' : formData.patientAddress) : (
              <input
                type="text"
                value={blankMode ? '' : formData.patientAddress}
                onChange={(e) => handleChange('patientAddress', e.target.value)}
                placeholder={blankMode ? '' : 'Street, City, State ZIP'}
                className="w-full text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
          <div className="col-span-2 bg-[#f8d7da] text-slate-900 font-bold px-3 py-2 border-r border-slate-300 flex items-center">
            Treating Provider
          </div>
          <div className="col-span-4 bg-white text-slate-900 font-semibold px-3 py-2 flex items-center">
            {readOnly ? (blankMode ? '' : formData.treatingProvider) : (
              <input
                type="text"
                value={blankMode ? '' : formData.treatingProvider}
                onChange={(e) => handleChange('treatingProvider', e.target.value)}
                placeholder={blankMode ? '' : 'Provider Name'}
                className="w-full font-semibold text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Section 1: Patient’s Presenting Concerns */}
      <div className="mb-4">
        <div className="bg-[#f8d7da] px-3 py-1.5 mb-1.5">
          <h3 className="text-xs sm:text-[13px] font-bold text-[#722F37]">
            Patient’s Presenting Concerns
          </h3>
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify px-0.5">
          {readOnly ? (
            <p>{blankMode ? '' : formData.presentingConcerns}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.presentingConcerns}
              onChange={(e) => handleChange('presentingConcerns', e.target.value)}
              rows="3"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Section 2: Precipitating Event and Psychosocial Stressors */}
      <div className="mb-4">
        <div className="bg-[#f8d7da] px-3 py-1.5 mb-1.5">
          <h3 className="text-xs sm:text-[13px] font-bold text-[#722F37]">
            Precipitating Event and Psychosocial Stressors
          </h3>
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify space-y-2 px-0.5">
          {readOnly ? (
            <>
              <p>{blankMode ? '' : formData.precipitatingEvent1}</p>
              <p>{blankMode ? '' : formData.precipitatingEvent2}</p>
            </>
          ) : (
            <>
              <textarea
                value={blankMode ? '' : formData.precipitatingEvent1}
                onChange={(e) => handleChange('precipitatingEvent1', e.target.value)}
                rows="3"
                className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
              />
              <textarea
                value={blankMode ? '' : formData.precipitatingEvent2}
                onChange={(e) => handleChange('precipitatingEvent2', e.target.value)}
                rows="3"
                className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
              />
            </>
          )}
        </div>
      </div>

      {/* Medical History, Medications & Allergies Block */}
      <div className="space-y-2.5">
        {/* Past Medical History */}
        <div>
          <div className="bg-[#f8d7da] px-3 py-1 mb-1">
            <h4 className="text-[11px] font-bold text-[#722F37] uppercase tracking-wider">
              PAST MEDICAL HISTORY:
            </h4>
          </div>
          <div className="text-[11px] text-slate-800 px-1">
            {readOnly ? (
              <p>{blankMode ? '' : formData.pastMedicalHistory}</p>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.pastMedicalHistory}
                onChange={(e) => handleChange('pastMedicalHistory', e.target.value)}
                className="w-full text-[11px] text-slate-800 bg-transparent outline-none"
              />
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div>
          <div className="bg-[#f8d7da] px-3 py-1 mb-1">
            <h4 className="text-[11px] font-bold text-[#722F37] uppercase tracking-wider">
              CURRENT MEDICATIONS:
            </h4>
          </div>
          <div className="text-[11px] text-slate-800 px-1">
            {readOnly ? (
              <p>{blankMode ? '' : formData.currentMedications}</p>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.currentMedications}
                onChange={(e) => handleChange('currentMedications', e.target.value)}
                className="w-full text-[11px] text-slate-800 bg-transparent outline-none"
              />
            )}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <div className="bg-[#f8d7da] px-3 py-1 mb-1">
            <h4 className="text-[11px] font-bold text-[#722F37] uppercase tracking-wider">
              ALLERGIES:
            </h4>
          </div>
          <div className="text-[11px] text-slate-800 px-1">
            {readOnly ? (
              <p>{blankMode ? '' : formData.allergies}</p>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.allergies}
                onChange={(e) => handleChange('allergies', e.target.value)}
                className="w-full text-[11px] text-slate-800 bg-transparent outline-none"
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
