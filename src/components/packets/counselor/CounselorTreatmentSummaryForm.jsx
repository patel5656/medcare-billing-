// src/components/packets/counselor/CounselorTreatmentSummaryForm.jsx
import React, { useState, useEffect } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import fmCounselingLogo from '../../../assets/fm_counseling_logo.png';

export const CounselorTreatmentSummaryForm = ({ blankMode = false, packetData = null, bill = null, readOnly = false }) => {
  const docKey = 'FM_COUNSELING_FORM_2';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Database defaults & dynamic fallbacks from DB
  const dbPatientName = packetData?.patientName || 
    (packetData?.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || 
    '';

  const dbDob = packetData?.patient?.dob || packetData?.dob || packetData?.patientDob || '';
  const dbAccidentDate = packetData?.accidentDate || packetData?.doa || packetData?.dateOfAccident || '';
  const dbAccidentType = packetData?.accidentType || 'Motor-Vehicle Accident';
  const dbTreatingProvider = packetData?.treatingProvider || bill?.renderingProvider?.name || 'Jordan Miller, LCSW, BCD';
  
  const notesDates = (packetData?.clinicalNotes || []).map(n => n.date || n.sessionDate).filter(Boolean);
  const billLines = bill?.serviceLines || bill?.lineItems || bill?.items || [];
  const billDates = billLines.map(l => l.dos || l.dateOfService).filter(Boolean);
  const allEncounterDates = [...notesDates, ...billDates].sort();
  const earliestDate = allEncounterDates[0] || '';
  const latestDate = allEncounterDates[allEncounterDates.length - 1] || '';

  const totalEncounterCount = Math.max(
    (packetData?.clinicalNotes || []).length,
    billLines.length,
    (packetData?.appointments || []).length
  );
  const dbTotalVisits = packetData?.totalVisits || (totalEncounterCount > 0 ? String(totalEncounterCount) : '');

  const dbNpi = packetData?.providerNpi || bill?.identifiers?.npi || bill?.renderingProvider?.npi || '1487965213';
  const dbTaxId = packetData?.taxId || bill?.identifiers?.taxId || bill?.billingProvider?.taxId || '84-7891234';
  
  const dbInitialDate = packetData?.initialAssessment || packetData?.initialDate || earliestDate || packetData?.dos || '';
  const dbDischargeDate = packetData?.dischargeDate || packetData?.finalTreatmentReview || latestDate || '';
  const dbTreatmentPeriod = (dbInitialDate && dbDischargeDate) ? `${dbInitialDate} - ${dbDischargeDate}` : (dbInitialDate || dbDischargeDate || '');
  
  const dbTotalCharges = bill?.totals?.totalCharges !== undefined
    ? `$${parseFloat(bill.totals.totalCharges).toFixed(2)}` 
    : (packetData?.caseTotalBilling !== undefined ? `$${parseFloat(packetData.caseTotalBilling).toFixed(2)}` : '$0.00');

  // Dynamic lines from DB bill
  const evalLine = billLines.find(l => (l.cptCode || l.cpt || '').includes('90791') || (l.cptCode || l.cpt || '').includes('9920')) || (billLines.length === 1 ? billLines[0] : null);
  const therapyLines = billLines.filter(l => (l.cptCode || l.cpt || '').includes('9083') || (l.cptCode || l.cpt || '').includes('9084') || (l.cptCode || l.cpt || '').includes('97'));

  const defaultEvalUnits = evalLine?.units ? String(evalLine.units) : (evalLine ? '1' : '');
  const defaultEvalRate = evalLine?.charge ? `$${parseFloat(evalLine.charge).toFixed(2)}` : (evalLine ? '$0.00' : '');
  const defaultEvalTotal = evalLine?.charge ? `$${parseFloat(evalLine.charge).toFixed(2)}` : (evalLine ? '$0.00' : '');

  const defaultTherapyUnits = therapyLines.length > 0 ? String(therapyLines.length) : '';
  const defaultTherapyRate = therapyLines[0]?.charge ? `$${parseFloat(therapyLines[0].charge).toFixed(2)}` : '';
  const defaultTherapyTotal = therapyLines.length > 0 
    ? `$${therapyLines.reduce((sum, l) => sum + (parseFloat(l.charge) || 0), 0).toFixed(2)}`
    : '';

  // Form State
  const [formData, setFormData] = useState({
    patientName: storage.patientName !== undefined ? storage.patientName : dbPatientName,
    dob: storage.dob !== undefined ? storage.dob : dbDob,
    accidentDate: storage.accidentDate !== undefined ? storage.accidentDate : dbAccidentDate,
    accidentType: storage.accidentType !== undefined ? storage.accidentType : dbAccidentType,
    treatingProvider: storage.treatingProvider !== undefined ? storage.treatingProvider : dbTreatingProvider,
    totalVisits: storage.totalVisits !== undefined ? storage.totalVisits : dbTotalVisits,
    npi: storage.npi !== undefined ? storage.npi : dbNpi,
    taxId: storage.taxId !== undefined ? storage.taxId : dbTaxId,
    treatmentPeriod: storage.treatmentPeriod !== undefined ? storage.treatmentPeriod : dbTreatmentPeriod,
    totalCharges: storage.totalCharges !== undefined ? storage.totalCharges : dbTotalCharges,
    
    // Overview details
    initialEvaluationDetail: storage.initialEvaluationDetail !== undefined ? storage.initialEvaluationDetail : (dbInitialDate ? `Psychiatric diagnostic evaluation - ${dbInitialDate}` : 'Psychiatric diagnostic evaluation'),
    psychotherapyDetail: storage.psychotherapyDetail !== undefined ? storage.psychotherapyDetail : (dbDischargeDate ? `${dbTotalVisits || ''} Psychotherapy visits through ${dbDischargeDate}` : 'Psychotherapy visits associated with course of care'),
    progressNotesDetail: storage.progressNotesDetail !== undefined ? storage.progressNotesDetail : 'Progress notes associated with the documented treatment visits',
    finalTreatmentReviewDetail: storage.finalTreatmentReviewDetail !== undefined ? storage.finalTreatmentReviewDetail : dbDischargeDate,
    
    // Billing Lines
    evalUnits: storage.evalUnits !== undefined ? storage.evalUnits : defaultEvalUnits,
    evalRate: storage.evalRate !== undefined ? storage.evalRate : defaultEvalRate,
    evalTotal: storage.evalTotal !== undefined ? storage.evalTotal : defaultEvalTotal,
    
    therapyUnits: storage.therapyUnits !== undefined ? storage.therapyUnits : defaultTherapyUnits,
    therapyRate: storage.therapyRate !== undefined ? storage.therapyRate : defaultTherapyRate,
    therapyTotal: storage.therapyTotal !== undefined ? storage.therapyTotal : defaultTherapyTotal,
  });

  useEffect(() => {
    if (!blankMode) {
      const s = packetData?.clinicalDocStorage?.[docKey] || {};
      setFormData({
        patientName: s.patientName !== undefined ? s.patientName : dbPatientName,
        dob: s.dob !== undefined ? s.dob : dbDob,
        accidentDate: s.accidentDate !== undefined ? s.accidentDate : dbAccidentDate,
        accidentType: s.accidentType !== undefined ? s.accidentType : dbAccidentType,
        treatingProvider: s.treatingProvider !== undefined ? s.treatingProvider : dbTreatingProvider,
        totalVisits: s.totalVisits !== undefined ? s.totalVisits : dbTotalVisits,
        npi: s.npi !== undefined ? s.npi : dbNpi,
        taxId: s.taxId !== undefined ? s.taxId : dbTaxId,
        treatmentPeriod: s.treatmentPeriod !== undefined ? s.treatmentPeriod : dbTreatmentPeriod,
        totalCharges: s.totalCharges !== undefined ? s.totalCharges : dbTotalCharges,
        
        initialEvaluationDetail: s.initialEvaluationDetail !== undefined ? s.initialEvaluationDetail : (dbInitialDate ? `Psychiatric diagnostic evaluation - ${dbInitialDate}` : 'Psychiatric diagnostic evaluation'),
        psychotherapyDetail: s.psychotherapyDetail !== undefined ? s.psychotherapyDetail : (dbDischargeDate ? `${dbTotalVisits || ''} Psychotherapy visits through ${dbDischargeDate}` : 'Psychotherapy visits associated with course of care'),
        progressNotesDetail: s.progressNotesDetail !== undefined ? s.progressNotesDetail : 'Progress notes associated with the documented treatment visits',
        finalTreatmentReviewDetail: s.finalTreatmentReviewDetail !== undefined ? s.finalTreatmentReviewDetail : dbDischargeDate,
        
        evalUnits: s.evalUnits !== undefined ? s.evalUnits : defaultEvalUnits,
        evalRate: s.evalRate !== undefined ? s.evalRate : defaultEvalRate,
        evalTotal: s.evalTotal !== undefined ? s.evalTotal : defaultEvalTotal,
        
        therapyUnits: s.therapyUnits !== undefined ? s.therapyUnits : defaultTherapyUnits,
        therapyRate: s.therapyRate !== undefined ? s.therapyRate : defaultTherapyRate,
        therapyTotal: s.therapyTotal !== undefined ? s.therapyTotal : defaultTherapyTotal,
      });
    }
  }, [packetData?.id, packetData?.caseId, packetData?.patientName, bill?.id, blankMode]);

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
        console.error('Failed to save FM Counseling Center Form 2 to DB:', err);
      }
    }
  };

  return (
    <div className="w-[800px] max-w-full relative bg-white text-slate-900 font-sans mx-auto border border-slate-300 shadow-md p-10 sm:p-14 flex flex-col min-h-[1050px] print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-8 print:m-0 print:border-none print:shadow-none">
      
      {/* Top Header with FM Counseling Center Logo */}
      <div className="text-center mb-3">
        <div className="flex justify-center mb-1">
          <img 
            src={fmCounselingLogo} 
            alt="FM Counseling Center Logo" 
            className="h-24 w-auto object-contain mx-auto" 
          />
        </div>
        <h1 className="text-2xl font-black text-slate-950 tracking-tight">FM COUNSELING CENTER</h1>
        <p className="text-[11px] text-slate-600 mt-1">9900 Westpark Drive, Suite 354 | Houston, Texas 77063</p>
      </div>

      {/* Patient / Case Information Grid */}
      <div className="border border-slate-300 overflow-hidden shadow-sm mt-2 mb-4">
        {/* Row 1: Header + Patient / DOB */}
        <div className="grid grid-cols-4 text-xs">
          <div className="bg-[#722F37] text-white px-3 py-2 font-bold uppercase tracking-wider flex items-center">
            Patient
          </div>
          <div className="px-3 py-2 font-bold text-slate-950 border-r border-slate-300 flex items-center bg-white">
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
          <div className="bg-[#722F37] text-white px-3 py-2 font-bold uppercase tracking-wider flex items-center">
            DOB
          </div>
          <div className="px-3 py-2 font-bold text-slate-950 flex items-center bg-white">
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

        {/* Row 2: Date of Accident / Accident type */}
        <div className="grid grid-cols-4 text-xs border-t border-slate-300">
          <div className="px-3 py-2 text-slate-600 font-medium bg-slate-50/50 flex items-center">
            Date of Accident
          </div>
          <div className="px-3 py-2 text-slate-900 font-medium border-r border-slate-300 flex items-center bg-white">
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
          <div className="px-3 py-2 text-slate-600 font-medium bg-slate-50/50 flex items-center">
            Accident type
          </div>
          <div className="px-3 py-2 text-slate-900 font-medium flex items-center bg-white">
            {readOnly ? (blankMode ? '' : formData.accidentType) : (
              <input
                type="text"
                value={blankMode ? '' : formData.accidentType}
                onChange={(e) => handleChange('accidentType', e.target.value)}
                placeholder={blankMode ? '' : 'Accident type'}
                className="w-full text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
        </div>

        {/* Row 3: Treating Provider / Total Visits */}
        <div className="grid grid-cols-4 text-xs border-t border-slate-300">
          <div className="px-3 py-2 text-slate-600 font-medium bg-slate-50/50 flex items-center">
            Treating Provider
          </div>
          <div className="px-3 py-2 text-slate-900 font-medium border-r border-slate-300 flex items-center bg-white">
            {readOnly ? (blankMode ? '' : formData.treatingProvider) : (
              <input
                type="text"
                value={blankMode ? '' : formData.treatingProvider}
                onChange={(e) => handleChange('treatingProvider', e.target.value)}
                placeholder={blankMode ? '' : 'Provider Name, Creds'}
                className="w-full text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
          <div className="px-3 py-2 text-slate-600 font-medium bg-slate-50/50 flex items-center">
            Total Visits
          </div>
          <div className="px-3 py-2 text-slate-900 font-medium flex items-center bg-white">
            {readOnly ? (blankMode ? '' : formData.totalVisits) : (
              <input
                type="text"
                value={blankMode ? '' : formData.totalVisits}
                onChange={(e) => handleChange('totalVisits', e.target.value)}
                placeholder={blankMode ? '' : 'e.g. 17'}
                className="w-full text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
        </div>

        {/* Row 4: NPI / Tax ID */}
        <div className="grid grid-cols-4 text-xs border-t border-slate-300">
          <div className="px-3 py-2 text-slate-600 font-medium bg-slate-50/50 flex items-center">
            NPI
          </div>
          <div className="px-3 py-2 text-slate-900 font-medium border-r border-slate-300 flex items-center bg-white">
            {readOnly ? (blankMode ? '' : formData.npi) : (
              <input
                type="text"
                value={blankMode ? '' : formData.npi}
                onChange={(e) => handleChange('npi', e.target.value)}
                placeholder={blankMode ? '' : '10-digit NPI'}
                className="w-full text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
          <div className="px-3 py-2 text-slate-600 font-medium bg-slate-50/50 flex items-center">
            Tax ID
          </div>
          <div className="px-3 py-2 text-slate-900 font-medium flex items-center bg-white">
            {readOnly ? (blankMode ? '' : formData.taxId) : (
              <input
                type="text"
                value={blankMode ? '' : formData.taxId}
                onChange={(e) => handleChange('taxId', e.target.value)}
                placeholder={blankMode ? '' : 'XX-XXXXXXX'}
                className="w-full text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
        </div>

        {/* Row 5: Treatment Period / Total Charges */}
        <div className="grid grid-cols-4 text-xs border-t border-slate-300">
          <div className="px-3 py-2 text-slate-600 font-medium bg-slate-50/50 flex items-center">
            Treatment Period
          </div>
          <div className="px-3 py-2 text-slate-900 font-medium border-r border-slate-300 flex items-center bg-white">
            {readOnly ? (blankMode ? '' : formData.treatmentPeriod) : (
              <input
                type="text"
                value={blankMode ? '' : formData.treatmentPeriod}
                onChange={(e) => handleChange('treatmentPeriod', e.target.value)}
                placeholder={blankMode ? '' : 'MM/DD/YYYY - MM/DD/YYYY'}
                className="w-full text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
          <div className="px-3 py-2 text-slate-600 font-medium bg-slate-50/50 flex items-center">
            Total Charges
          </div>
          <div className="px-3 py-2 font-bold text-slate-950 flex items-center bg-white">
            {readOnly ? (blankMode ? '' : formData.totalCharges) : (
              <input
                type="text"
                value={blankMode ? '' : formData.totalCharges}
                onChange={(e) => handleChange('totalCharges', e.target.value)}
                placeholder={blankMode ? '' : '$0.00'}
                className="w-full font-bold text-slate-950 bg-transparent outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Summary Narrative Header & Paragraph */}
      <div className="mt-3 mb-3">
        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 mb-1">
          Summary of Counseling / Post-Accident Emotional Recovery Services
        </h3>
        <p className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {blankMode ? '' : `${formData.patientName} received behavioral-health services beginning August 4, 2026, following a ${formData.accidentType.toLowerCase()} dated ${formData.accidentDate}. The course of care included an initial psychiatric diagnostic evaluation followed by individual psychotherapy visits. Progress notes were prepared for the documented visits to reflect the counseling services, therapeutic interventions, and treatment review recorded during the course of care.`}
        </p>
      </div>

      {/* Table 2: Service Overview */}
      <div className="border border-slate-300 overflow-hidden shadow-sm mb-4">
        <div className="grid grid-cols-12 bg-[#722F37] text-white text-xs font-bold py-2 px-3">
          <div className="col-span-4 uppercase tracking-wider">Service Overview</div>
          <div className="col-span-8 uppercase tracking-wider">Details</div>
        </div>
        <div className="divide-y divide-slate-200 text-xs">
          <div className="grid grid-cols-12 px-3 py-2 bg-white">
            <div className="col-span-4 text-slate-700 font-medium">Initial Evaluation</div>
            <div className="col-span-8 text-slate-900">
              {readOnly ? (blankMode ? '' : formData.initialEvaluationDetail) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.initialEvaluationDetail}
                  onChange={(e) => handleChange('initialEvaluationDetail', e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-12 px-3 py-2 bg-white">
            <div className="col-span-4 text-slate-700 font-medium">Individual Psychotherapy</div>
            <div className="col-span-8 text-slate-900">
              {readOnly ? (blankMode ? '' : formData.psychotherapyDetail) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.psychotherapyDetail}
                  onChange={(e) => handleChange('psychotherapyDetail', e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-12 px-3 py-2 bg-white">
            <div className="col-span-4 text-slate-700 font-medium">Progress Notes</div>
            <div className="col-span-8 text-slate-900">
              {readOnly ? (blankMode ? '' : formData.progressNotesDetail) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.progressNotesDetail}
                  onChange={(e) => handleChange('progressNotesDetail', e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-12 px-3 py-2 bg-white">
            <div className="col-span-4 text-slate-700 font-medium">Final Treatment Review</div>
            <div className="col-span-8 text-slate-900">
              {readOnly ? (blankMode ? '' : formData.finalTreatmentReviewDetail) : (
                <input
                  type="text"
                  value={blankMode ? '' : formData.finalTreatmentReviewDetail}
                  onChange={(e) => handleChange('finalTreatmentReviewDetail', e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              )}
            </div>
          </div>
          {/* Highlighted Total Visits Footer */}
          <div className="grid grid-cols-12 px-3 py-2 bg-[#f8d7da] text-[#722F37] font-bold">
            <div className="col-span-4">Total Visits</div>
            <div className="col-span-8">{blankMode ? '' : formData.totalVisits}</div>
          </div>
        </div>
      </div>

      {/* Table 3: Billing & CPT Codes Breakdown */}
      <div className="border border-slate-300 overflow-hidden shadow-sm mb-3">
        <div className="grid grid-cols-12 bg-[#722F37] text-white text-xs font-bold py-2 px-3">
          <div className="col-span-2 uppercase tracking-wider">Code</div>
          <div className="col-span-5 uppercase tracking-wider">Service</div>
          <div className="col-span-1 text-center uppercase tracking-wider">Units</div>
          <div className="col-span-2 text-center uppercase tracking-wider">Rate</div>
          <div className="col-span-2 text-center uppercase tracking-wider">Total</div>
        </div>
        <div className="divide-y divide-slate-200 text-xs">
          {/* Line 1: 90791 */}
          <div className="grid grid-cols-12 px-3 py-2 bg-white items-center">
            <div className="col-span-2 font-bold text-slate-900">90791</div>
            <div className="col-span-5 text-slate-800">Psychiatric Diagnostic Evaluation</div>
            <div className="col-span-1 text-center font-medium text-slate-900">
              {blankMode ? '' : formData.evalUnits}
            </div>
            <div className="col-span-2 text-center text-slate-900">
              {blankMode ? '' : formData.evalRate}
            </div>
            <div className="col-span-2 text-center font-bold text-slate-950">
              {blankMode ? '' : formData.evalTotal}
            </div>
          </div>
          {/* Line 2: 90837 */}
          <div className="grid grid-cols-12 px-3 py-2 bg-white items-center">
            <div className="col-span-2 font-bold text-slate-900">90837</div>
            <div className="col-span-5 text-slate-800">Individual Psychotherapy, 60Minutes</div>
            <div className="col-span-1 text-center font-medium text-slate-900">
              {blankMode ? '' : formData.therapyUnits}
            </div>
            <div className="col-span-2 text-center text-slate-900">
              {blankMode ? '' : formData.therapyRate}
            </div>
            <div className="col-span-2 text-center font-bold text-slate-950">
              {blankMode ? '' : formData.therapyTotal}
            </div>
          </div>
          {/* Total Row */}
          <div className="grid grid-cols-12 px-3 py-2 bg-[#f8d7da] text-[#722F37] font-bold items-center">
            <div className="col-span-7 tracking-wider">TOTAL</div>
            <div className="col-span-1 text-center">{blankMode ? '' : formData.totalVisits}</div>
            <div className="col-span-2"></div>
            <div className="col-span-2 text-center">{blankMode ? '' : formData.totalCharges}</div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Narrative & Attestation */}
      <div className="mt-2 text-[11px] leading-relaxed text-slate-700 text-justify">
        <p>
          The counseling course addressed post-accident emotional concerns through evaluation, psychotherapy, coping-skills development, anxiety-management strategies, and treatment review. Continued use of learned coping and emotional-regulation strategies was encouraged, with additional behavioral-health evaluation recommended if emotional symptoms return, worsen, or substantially interfere with everyday functioning.
        </p>
      </div>

      <div className="mt-3 text-[11px] text-slate-800 space-y-1">
        <p>
          <strong className="text-slate-950">Supporting Documentation:</strong> Progress Notes • Evaluation • Billing Statement
        </p>
        <p>
          <strong className="text-slate-950">Provider:</strong> {blankMode ? '' : formData.treatingProvider}
        </p>
      </div>

    </div>
  );
};
