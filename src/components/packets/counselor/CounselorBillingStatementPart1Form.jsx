// src/components/packets/counselor/CounselorBillingStatementPart1Form.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import { apiAppointmentService } from '../../../services/api/apiAppointmentService';
import { apiBillingService } from '../../../services/api/apiBillingService';
import { 
  filterAndSortCounselingVisits, 
  getEligibleCounselingVisits,
  buildPart1StatementRows 
} from '../../../utils/counselingBillingHelper';
import { CheckSquare, Square, Sliders, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import fmCounselingLogo from '../../../assets/fm_counseling_logo.png';

export const CounselorBillingStatementPart1Form = ({ 
  blankMode = false, 
  packetData = null, 
  bill = null, 
  readOnly = false,
  counselingVisits: propCounselingVisits = null 
}) => {
  const docKey = 'FM_COUNSELING_FORM_9';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Database defaults & dynamic fallbacks from DB
  const dbPatientName = packetData?.patientName || 
    (packetData?.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || 
    '';

  const dbDob = packetData?.patient?.dob || packetData?.dob || packetData?.patientDob || '';
  const dbGender = packetData?.patient?.gender || packetData?.patient?.sex || packetData?.gender || packetData?.sex || '';
  const dbAccidentDate = packetData?.accidentDate || packetData?.doa || packetData?.dateOfAccident || '';
  
  const getDxText = () => {
    if (packetData?.diagnosisCodes && Array.isArray(packetData.diagnosisCodes) && packetData.diagnosisCodes.length > 0) {
      return packetData.diagnosisCodes.map(d => typeof d === 'string' ? d : d.code).join('; ');
    }
    if (packetData?.diagnoses && Array.isArray(packetData.diagnoses) && packetData.diagnoses.length > 0) {
      return packetData.diagnoses.map(d => d.code).join('; ');
    }
    return '';
  };
  const dbDiagnosis = getDxText();

  const dbProvider = packetData?.treatingProvider || bill?.renderingProvider?.name || 'Jordan Miller, LCSW, BCD';
  const dbPatientAddress = packetData?.patientAddress || 
    (typeof packetData?.patient?.address === 'string' ? packetData.patient.address : '') || 
    (packetData?.patient?.street ? `${packetData.patient.street || ''} ${packetData.patient.suite || ''}, ${packetData.patient.city || ''} ${packetData.patient.state || ''} ${packetData.patient.zipCode || ''}`.trim() : '') || 
    '';
  const dbMedicationBilling = packetData?.medicationBilling || 'None';
  const dbTaxId = packetData?.taxId || bill?.identifiers?.taxId || bill?.billingProvider?.taxId || '84-7891234';

  const dbAttorneyName = packetData?.attorneyName || packetData?.lawFirm || '';
  const dbAttorneyAddress = packetData?.attorneyAddress || packetData?.lawFirmAddress || '';

  // Real patient-specific counseling visits state
  const [counselingVisits, setCounselingVisits] = useState(() => {
    if (propCounselingVisits && Array.isArray(propCounselingVisits)) {
      return filterAndSortCounselingVisits(propCounselingVisits, packetData?.id, packetData?.caseId);
    }
    if (packetData?.appointments && Array.isArray(packetData.appointments)) {
      return filterAndSortCounselingVisits(packetData.appointments, packetData?.id, packetData?.caseId);
    }
    return [];
  });

  const loadVisitsFromApi = useCallback(() => {
    const patientId = packetData?.patientId || packetData?.patient?.id;
    if (!patientId) return;

    apiAppointmentService.getAllAppointments({ patientId })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.appointments || []);
        const filtered = filterAndSortCounselingVisits(list, packetData?.id, packetData?.caseId);
        setCounselingVisits(filtered);
      })
      .catch(err => {
        console.error('Failed to load counseling visits in billing statement Part 1:', err);
      });
  }, [packetData?.patientId, packetData?.patient?.id, packetData?.id, packetData?.caseId]);

  useEffect(() => {
    if (propCounselingVisits && Array.isArray(propCounselingVisits)) {
      setCounselingVisits(filterAndSortCounselingVisits(propCounselingVisits, packetData?.id, packetData?.caseId));
    } else {
      loadVisitsFromApi();
    }

    window.addEventListener('focus', loadVisitsFromApi);
    return () => {
      window.removeEventListener('focus', loadVisitsFromApi);
    };
  }, [propCounselingVisits, loadVisitsFromApi]);

  const eligibleVisits = useMemo(() => getEligibleCounselingVisits(counselingVisits), [counselingVisits]);

  // Session selection state (controls exact number and sessions included on bill)
  const [selectedVisitIds, setSelectedVisitIds] = useState(() => {
    if (storage.selectedVisitIds && Array.isArray(storage.selectedVisitIds)) {
      return storage.selectedVisitIds;
    }
    if (bill?.serviceLines && Array.isArray(bill.serviceLines) && bill.serviceLines.length > 0) {
      const matched = eligibleVisits.filter(v => 
        bill.serviceLines.some(l => l.id?.includes(v.id) || (l.dos === v.date && l.cptCode === v.cptCode))
      );
      if (matched.length > 0) return matched.map(v => v.id);
    }
    return eligibleVisits.map(v => v.id);
  });

  const [showSessionDrawer, setShowSessionDrawer] = useState(false);

  useEffect(() => {
    if (eligibleVisits.length > 0 && selectedVisitIds.length === 0 && !storage.selectedVisitIds) {
      setSelectedVisitIds(eligibleVisits.map(v => v.id));
    }
  }, [eligibleVisits]);

  // Dynamic real visit lines (fixed 13-row layout, filtered by selected sessions)
  const realVisitRows = buildPart1StatementRows(counselingVisits, bill, selectedVisitIds);

  // Form State
  const [formData, setFormData] = useState({
    patientName: storage.patientName !== undefined ? storage.patientName : dbPatientName,
    dob: storage.dob !== undefined ? storage.dob : dbDob,
    gender: storage.gender !== undefined ? storage.gender : dbGender,
    accidentDate: storage.accidentDate !== undefined ? storage.accidentDate : dbAccidentDate,
    diagnosis: storage.diagnosis !== undefined ? storage.diagnosis : dbDiagnosis,
    provider: storage.provider !== undefined ? storage.provider : dbProvider,
    patientAddress: storage.patientAddress !== undefined ? storage.patientAddress : dbPatientAddress,
    medicationBilling: storage.medicationBilling !== undefined ? storage.medicationBilling : dbMedicationBilling,
    taxId: storage.taxId !== undefined ? storage.taxId : dbTaxId,
    attorneyName: storage.attorneyName !== undefined ? storage.attorneyName : dbAttorneyName,
    attorneyAddress: storage.attorneyAddress !== undefined ? storage.attorneyAddress : dbAttorneyAddress,
    rows: realVisitRows,
  });

  useEffect(() => {
    if (!blankMode) {
      const s = packetData?.clinicalDocStorage?.[docKey] || {};
      const currentRows = buildPart1StatementRows(counselingVisits, bill, selectedVisitIds);
      setFormData({
        patientName: s.patientName !== undefined ? s.patientName : dbPatientName,
        dob: s.dob !== undefined ? s.dob : dbDob,
        gender: s.gender !== undefined ? s.gender : dbGender,
        accidentDate: s.accidentDate !== undefined ? s.accidentDate : dbAccidentDate,
        diagnosis: s.diagnosis !== undefined ? s.diagnosis : dbDiagnosis,
        provider: s.provider !== undefined ? s.provider : dbProvider,
        patientAddress: s.patientAddress !== undefined ? s.patientAddress : dbPatientAddress,
        medicationBilling: s.medicationBilling !== undefined ? s.medicationBilling : dbMedicationBilling,
        taxId: s.taxId !== undefined ? s.taxId : dbTaxId,
        attorneyName: s.attorneyName !== undefined ? s.attorneyName : dbAttorneyName,
        attorneyAddress: s.attorneyAddress !== undefined ? s.attorneyAddress : dbAttorneyAddress,
        rows: currentRows,
      });
    }
  }, [
    packetData?.id, 
    packetData?._id, 
    packetData?.patientName, 
    bill?.id, 
    counselingVisits, 
    selectedVisitIds,
    blankMode
  ]);

  const syncWithCaseStorage = async (ids) => {
    const caseId = packetData?.id || packetData?._id;
    if (caseId) {
      try {
        const currentStorage = packetData.clinicalDocStorage || {};
        const form9Doc = { ...(currentStorage['FM_COUNSELING_FORM_9'] || {}), selectedVisitIds: ids };
        const form10Doc = { ...(currentStorage['FM_COUNSELING_FORM_10'] || {}), selectedVisitIds: ids };
        const updatedStorage = {
          ...currentStorage,
          FM_COUNSELING_FORM_9: form9Doc,
          FM_COUNSELING_FORM_10: form10Doc
        };
        await apiCaseService.updateCase(caseId, { clinicalDocStorage: updatedStorage });
        packetData.clinicalDocStorage = updatedStorage;
      } catch (err) {
        console.error('Failed to sync selectedVisitIds with case storage:', err);
      }
    }
  };

  const handleToggleSession = (visitId) => {
    const updated = selectedVisitIds.includes(visitId)
      ? selectedVisitIds.filter(id => id !== visitId)
      : [...selectedVisitIds, visitId];
    setSelectedVisitIds(updated);
    handleChange('selectedVisitIds', updated);
    syncWithCaseStorage(updated);
  };

  const handleSelectSessionCount = (count) => {
    const targetCount = Math.min(count, eligibleVisits.length);
    const updated = eligibleVisits.slice(0, targetCount).map(v => v.id);
    setSelectedVisitIds(updated);
    handleChange('selectedVisitIds', updated);
    syncWithCaseStorage(updated);
  };

  const handleSelectAllSessions = () => {
    const updated = eligibleVisits.map(v => v.id);
    setSelectedVisitIds(updated);
    handleChange('selectedVisitIds', updated);
    syncWithCaseStorage(updated);
  };

  const handleClearSessions = () => {
    setSelectedVisitIds([]);
    handleChange('selectedVisitIds', []);
    syncWithCaseStorage([]);
  };

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
        console.error('Failed to save FM Counseling Center Form 9 to DB:', err);
      }
    }
  };

  const handleRowChange = async (index, field, value) => {
    if (readOnly || blankMode) return;
    const updatedRows = [...formData.rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    handleChange('rows', updatedRows);
  };

  return (
    <div className="w-[800px] max-w-full relative bg-white text-slate-900 font-sans mx-auto border border-slate-300 shadow-md p-8 sm:p-12 flex flex-col min-h-[1050px] print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-6 print:m-0 print:border-none print:shadow-none">
      
      {/* Session Selection Interactive Toolbar (Screen Only, Hidden in Print) */}
      {!blankMode && !readOnly && eligibleVisits.length > 0 && (
        <div className="print:hidden mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-800">
                Statement Session Selection ({selectedVisitIds.length} of {eligibleVisits.length} Included)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={handleSelectAllSessions}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
              >
                All ({eligibleVisits.length})
              </button>
              {eligibleVisits.length >= 5 && (
                <button
                  type="button"
                  onClick={() => handleSelectSessionCount(5)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                >
                  First 5
                </button>
              )}
              {eligibleVisits.length >= 8 && (
                <button
                  type="button"
                  onClick={() => handleSelectSessionCount(8)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                >
                  First 8
                </button>
              )}
              <button
                type="button"
                onClick={handleClearSessions}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-medium text-[11px] transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowSessionDrawer(prev => !prev)}
                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
              >
                {showSessionDrawer ? 'Hide Sessions' : 'Pick Sessions'}
                {showSessionDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Collapsible Session Checkbox List */}
          {showSessionDrawer && (
            <div className="border-t border-slate-200 pt-2.5 space-y-1.5 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {eligibleVisits.map((v, i) => {
                  const isChecked = selectedVisitIds.includes(v.id);
                  return (
                    <label
                      key={v.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${
                        isChecked ? 'bg-teal-50/70 border-teal-200 text-teal-900 font-semibold' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSession(v.id)}
                        className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                      />
                      <span className="font-mono text-[11px] font-bold">#{i + 1} {v.date}</span>
                      <span className="text-[11px] font-mono text-slate-500">[{v.cptCode || '90834'}]</span>
                      <span className="text-[10px] text-emerald-700 ml-auto font-bold uppercase">{v.status}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Header with FM Counseling Center Logo */}
      <div className="text-center mb-1">
        <div className="flex justify-center items-center gap-2 mb-1">
          <img 
            src={fmCounselingLogo} 
            alt="FM Counseling Center Logo" 
            className="h-16 w-auto object-contain mx-auto" 
          />
        </div>
      </div>

      {/* FM Counseling Center Pink Banner */}
      <div className="bg-[#fce8ed] border border-[#f7c5d1] py-1 text-center font-bold text-[#722F37] text-base tracking-wide uppercase">
        FMCOUNSELINGCENTER
      </div>

      {/* Address & Tax ID */}
      <div className="text-[11px] text-slate-700 text-center font-medium mt-1">
        9900 Westpark Drive, Suite 354|Houston, Texas 77063
      </div>
      <div className="text-[11px] text-slate-700 text-center font-semibold">
        Tax ID: {formData.taxId}
      </div>

      {/* Document Title */}
      <div className="text-center font-black text-sm tracking-wider text-slate-900 my-2 uppercase">
        BILLINGSTATEMENT
      </div>

      {/* Demographics 4-Column Table */}
      <div className="w-full border-2 border-slate-900 mb-2">
        <div className="grid grid-cols-12 border-b border-slate-900 text-[10.5px]">
          <div className="col-span-2 bg-[#fce8ed] border-r border-slate-900 font-bold text-[#722F37] p-1.5 flex items-center">
            Patient
          </div>
          <div className="col-span-4 border-r border-slate-900 p-1.5 flex items-center font-medium text-slate-800">
            {readOnly ? (
              <span>{blankMode ? '' : formData.patientName}</span>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.patientName}
                onChange={(e) => handleChange('patientName', e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-slate-800"
              />
            )}
          </div>
          <div className="col-span-2 bg-[#fce8ed] border-r border-slate-900 font-bold text-[#722F37] p-1.5 flex items-center">
            DOB
          </div>
          <div className="col-span-4 p-1.5 flex items-center font-medium text-slate-800">
            {readOnly ? (
              <span>{blankMode ? '' : formData.dob}</span>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-slate-800"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-slate-900 text-[10.5px]">
          <div className="col-span-2 bg-[#fce8ed] border-r border-slate-900 font-bold text-[#722F37] p-1.5 flex items-center">
            Sex
          </div>
          <div className="col-span-4 border-r border-slate-900 p-1.5 flex items-center font-medium text-slate-800">
            {readOnly ? (
              <span>{blankMode ? '' : formData.gender}</span>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-slate-800"
              />
            )}
          </div>
          <div className="col-span-2 bg-[#fce8ed] border-r border-slate-900 font-bold text-[#722F37] p-1.5 flex items-center">
            Date of Accident
          </div>
          <div className="col-span-4 p-1.5 flex items-center font-medium text-slate-800">
            {readOnly ? (
              <span>{blankMode ? '' : formData.accidentDate}</span>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.accidentDate}
                onChange={(e) => handleChange('accidentDate', e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-slate-800"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-slate-900 text-[10.5px]">
          <div className="col-span-2 bg-[#fce8ed] border-r border-slate-900 font-bold text-[#722F37] p-1.5 flex items-center">
            Diagnosis
          </div>
          <div className="col-span-4 border-r border-slate-900 p-1.5 flex items-center font-medium text-slate-800">
            {readOnly ? (
              <span>{blankMode ? '' : formData.diagnosis}</span>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.diagnosis}
                onChange={(e) => handleChange('diagnosis', e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-slate-800"
              />
            )}
          </div>
          <div className="col-span-2 bg-[#fce8ed] border-r border-slate-900 font-bold text-[#722F37] p-1.5 flex items-center">
            Provider
          </div>
          <div className="col-span-4 p-1.5 flex items-center font-medium text-slate-800">
            {readOnly ? (
              <span>{blankMode ? '' : formData.provider}</span>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.provider}
                onChange={(e) => handleChange('provider', e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-slate-800"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 text-[10.5px]">
          <div className="col-span-2 bg-[#fce8ed] border-r border-slate-900 font-bold text-[#722F37] p-1.5 flex items-center">
            Patient Address
          </div>
          <div className="col-span-4 border-r border-slate-900 p-1.5 flex items-center font-medium text-slate-800">
            {readOnly ? (
              <span>{blankMode ? '' : formData.patientAddress}</span>
            ) : (
              <textarea
                rows="2"
                value={blankMode ? '' : formData.patientAddress}
                onChange={(e) => handleChange('patientAddress', e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-slate-800 resize-none text-[10.5px]"
              />
            )}
          </div>
          <div className="col-span-2 bg-[#fce8ed] border-r border-slate-900 font-bold text-[#722F37] p-1.5 flex items-center">
            Medication Billing
          </div>
          <div className="col-span-4 p-1.5 flex items-center font-medium text-slate-800">
            {readOnly ? (
              <span>{blankMode ? '' : formData.medicationBilling}</span>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.medicationBilling}
                onChange={(e) => handleChange('medicationBilling', e.target.value)}
                className="w-full bg-transparent outline-none font-medium text-slate-800"
              />
            )}
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="mb-2">
        <div className="bg-[#fce8ed] border border-[#f7c5d1] px-2 py-0.5 font-bold text-[11px] text-[#722F37]">
          Bill To
        </div>
        <div className="pt-1 text-[11px]">
          <div className="font-bold text-slate-900">
            {readOnly ? (
              <span>{blankMode ? '' : formData.attorneyName}</span>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.attorneyName}
                onChange={(e) => handleChange('attorneyName', e.target.value)}
                className="w-full font-bold text-slate-900 bg-transparent outline-none"
              />
            )}
          </div>
          <div className="text-slate-700">
            {readOnly ? (
              <span>{blankMode ? '' : formData.attorneyAddress}</span>
            ) : (
              <input
                type="text"
                value={blankMode ? '' : formData.attorneyAddress}
                onChange={(e) => handleChange('attorneyAddress', e.target.value)}
                className="w-full text-slate-700 bg-transparent outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Service Lines Table (Rows 1 to 13) */}
      <div className="w-full border-2 border-slate-900 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-[#722F37] text-white font-bold text-[10.5px] border-b-2 border-slate-900">
          <div className="col-span-2 text-center py-1.5 border-r border-slate-900">
            Date of Service
          </div>
          <div className="col-span-2 text-center py-1.5 border-r border-slate-900">
            CPT
          </div>
          <div className="col-span-6 px-3 py-1.5 border-r border-slate-900">
            Service Description
          </div>
          <div className="col-span-2 text-center py-1.5">
            Charge
          </div>
        </div>

        {/* Table Rows */}
        {formData.rows.map((row, idx) => (
          <div 
            key={idx} 
            className={`grid grid-cols-12 text-[10.5px] text-slate-800 ${idx < formData.rows.length - 1 ? 'border-b border-slate-900' : ''}`}
          >
            <div className="col-span-2 text-center py-1 px-1 border-r border-slate-900 font-medium flex items-center justify-center">
              {readOnly ? (
                <span>{blankMode ? '' : row.dos}</span>
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : row.dos}
                  onChange={(e) => handleRowChange(idx, 'dos', e.target.value)}
                  className="w-full text-center bg-transparent outline-none font-medium text-slate-800"
                />
              )}
            </div>
            <div className="col-span-2 text-center py-1 px-1 border-r border-slate-900 font-medium flex items-center justify-center">
              {readOnly ? (
                <span>{blankMode ? '' : row.cpt}</span>
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : row.cpt}
                  onChange={(e) => handleRowChange(idx, 'cpt', e.target.value)}
                  className="w-full text-center bg-transparent outline-none font-medium text-slate-800"
                />
              )}
            </div>
            <div className="col-span-6 py-1 px-3 border-r border-slate-900 font-medium flex items-center">
              {readOnly ? (
                <span>{blankMode ? '' : row.desc}</span>
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : row.desc}
                  onChange={(e) => handleRowChange(idx, 'desc', e.target.value)}
                  className="w-full bg-transparent outline-none font-medium text-slate-800"
                />
              )}
            </div>
            <div className="col-span-2 text-center py-1 px-1 font-medium flex items-center justify-center">
              {readOnly ? (
                <span>{blankMode ? '' : row.charge}</span>
              ) : (
                <input
                  type="text"
                  value={blankMode ? '' : row.charge}
                  onChange={(e) => handleRowChange(idx, 'charge', e.target.value)}
                  className="w-full text-center bg-transparent outline-none font-medium text-slate-800"
                />
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
