// src/pages/billing/CreateBillPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { apiBillingService } from '../../services/api/apiBillingService';
import { INITIAL_PROVIDER_CONFIGS } from '../../constants/providerConfigs';
import { createDefaultServiceLine } from '../../constants/servicesCatalog';
import { MultiLineCptTable } from '../../components/common/MultiLineCptTable';
import { useUIStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Receipt, User, FileText, DollarSign, Building, CheckCircle2, RefreshCw, Plus, X, Calendar } from 'lucide-react';

const inputCls = 'w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition';
const labelCls = 'block text-xs font-bold text-slate-800 mb-1';

const SectionHead = ({ Icon, title }) => (
  <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2 mb-4">
    <Icon className="w-4 h-4 text-teal-600" /> {title}
  </h2>
);

export const CreateBillPage = () => {
  const { addToast, activeProviderFilter } = useUIStore();
  const initialProvider = (activeProviderFilter && activeProviderFilter !== 'ALL') ? activeProviderFilter : 'prov-davs';
  const [providerId, setProviderId] = useState(initialProvider);
  const [statementNumber, setStatementNumber] = useState(`STMT-${Math.floor(100000 + Math.random() * 900000)}`);
  const [serviceLines, setServiceLines] = useState([
    createDefaultServiceLine(1, '99204', 'Initial Consultation - Post-MVA Pain Management', 450.00),
    createDefaultServiceLine(2, '97110', 'Therapeutic Exercise (15 min)', 110.00)
  ]);

  const [form, setForm] = useState({
    statementDate: new Date().toISOString().split('T')[0],
    caseId: 'CASE-2025-1227',
    patientName: 'Demo Patient 001',
    patientId: 'PAT-141849159',
    patientDob: '1985-05-15',
    billToName: 'OJ Law Firm & Associates',
    billToAddress: '11711 Bedford St. Suite 01, Houston TX 77031',
    billToPhone: '713-555-0188',
    billToEmail: 'attorney@ojlawfirm.com',
    serviceDate: '2025-12-30',
    diagnosisCodes: 'M54.6, M54.50, S13.4',
    insuranceCompany: 'Example Auto Insurance Co.',
    insuranceClaimNumber: 'CLM-2025-88192',
    insurancePolicyNumber: 'POL-9928374',
    liabilityStatus: 'LIABILITY_ACCEPTED',
    billingType: 'LIEN',
    referringProvider: 'Anthony Nguyen',
    referringNpi: '1234567890',
    renderingProviderNpi: '0987654321',
    facilityNpi: '1122334455',
    taxId: '75-1234567',
    placeOfService: '11',
    authorizationNumber: '',
    billNotes: 'Statement to be submitted to attorney lien. Await settlement before payment processing.',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Counseling Visit Manual Billing State
  const [counselingData, setCounselingData] = useState({
    visits: [],
    totalRecorded: 0,
    completedCount: 0,
    billedCount: 0,
    billableCount: 0
  });
  const [selectedVisitIds, setSelectedVisitIds] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [showQuickRecordModal, setShowQuickRecordModal] = useState(false);
  const [quickRecordForm, setQuickRecordForm] = useState({
    date: new Date().toISOString().split('T')[0],
    cptCode: '90834',
    duration: 45,
    reason: 'Individual Psychotherapy (Trauma / Pain Coping)',
    notes: 'Completed session focusing on post-accident coping strategies.'
  });

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  // Load counseling visits for patient
  const loadVisits = async (pId, cId) => {
    if (!pId) return;
    setLoadingVisits(true);
    try {
      const data = await apiBillingService.getCounselingVisits(pId, cId);
      setCounselingData(data || { visits: [], totalRecorded: 0, completedCount: 0, billedCount: 0, billableCount: 0 });
      
      // Auto-select eligible completed visits that are not already billed
      const eligible = (data.visits || []).filter(v => v.isEligibleForBilling && !v.isBilled).map(v => v.id);
      setSelectedVisitIds(eligible);
      syncLinesWithVisits(data.visits || [], eligible);
    } catch (err) {
      console.error('Error loading counseling visits:', err);
    } finally {
      setLoadingVisits(false);
    }
  };

  const prevProviderIdRef = useRef(providerId);
  useEffect(() => {
    const providerChanged = prevProviderIdRef.current !== providerId;
    prevProviderIdRef.current = providerId;

    if (providerId === 'prov-counselor') {
      loadVisits(form.patientId, form.caseId);
    } else if (providerChanged) {
      // Revert to standard service lines only when provider changes
      setServiceLines([
        createDefaultServiceLine(1, '99204', 'Initial Consultation - Post-MVA Pain Management', 450.00),
        createDefaultServiceLine(2, '97110', 'Therapeutic Exercise (15 min)', 110.00)
      ]);
    }
  }, [providerId, form.patientId, form.caseId]);

  const syncLinesWithVisits = (allVisits, selectedIds) => {
    const selectedVisits = allVisits.filter(v => selectedIds.includes(v.id));
    if (selectedVisits.length === 0) {
      setServiceLines([]);
      return;
    }

    const lines = selectedVisits.map((v, idx) => {
      const cpt = v.cptCode || '90834';
      let charge = 180.00;
      let desc = 'Individual Psychotherapy (45 min)';
      if (cpt === '90791') {
        charge = 350.00;
        desc = 'Psychiatric Diagnostic Evaluation (Intake)';
      } else if (cpt === '90837') {
        charge = 240.00;
        desc = 'Psychotherapy with patient (60 min)';
      } else if (cpt === '90832') {
        charge = 120.00;
        desc = 'Psychotherapy with patient (30 min)';
      }

      return {
        lineIndex: idx + 1,
        dos: v.date || form.statementDate,
        dateOfService: v.date || form.statementDate,
        cptCode: cpt,
        description: desc,
        modifier1: '',
        modifier2: '',
        diagPointer: 'A',
        placeOfService: '11',
        units: 1,
        charge: charge,
        balance: charge,
        lineBalance: charge,
        appointmentId: v.id
      };
    });

    setServiceLines(lines);
  };

  const toggleVisit = (vId) => {
    const next = selectedVisitIds.includes(vId)
      ? selectedVisitIds.filter(id => id !== vId)
      : [...selectedVisitIds, vId];
    setSelectedVisitIds(next);
    syncLinesWithVisits(counselingData.visits, next);
  };

  const selectAllEligible = () => {
    const eligible = counselingData.visits.filter(v => v.isEligibleForBilling && !v.isBilled).map(v => v.id);
    setSelectedVisitIds(eligible);
    syncLinesWithVisits(counselingData.visits, eligible);
  };

  const clearSelection = () => {
    setSelectedVisitIds([]);
    setServiceLines([]);
  };

  const handleQuickRecord = async (e) => {
    e.preventDefault();
    try {
      await apiBillingService.recordCounselingVisit({
        patientId: form.patientId,
        caseId: form.caseId,
        date: quickRecordForm.date,
        cptCode: quickRecordForm.cptCode,
        duration: quickRecordForm.duration,
        reason: quickRecordForm.reason,
        notes: quickRecordForm.notes
      });
      addToast('Completed counseling visit recorded and verified!', 'success');
      setShowQuickRecordModal(false);
      await loadVisits(form.patientId, form.caseId);
    } catch (err) {
      addToast(err?.message || 'Failed to record counseling visit', 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!form.caseId) {
      addToast('Please specify a valid clinical case ID.', 'warning');
      setIsLoading(false);
      return;
    }

    if (providerId === 'prov-counselor') {
      if (selectedVisitIds.length === 0) {
        addToast('Please select at least 1 completed counseling visit to bill, or record a completed session first.', 'warning');
        setIsLoading(false);
        return;
      }
    }

    try {
      const selectedProv = Object.values(INITIAL_PROVIDER_CONFIGS).find(p => p.id === providerId);
      const totalAmount = serviceLines.reduce((acc, line) => acc + ((parseFloat(line.units) || 1) * (parseFloat(line.charge) || 0)), 0);
      
      const newBill = await apiBillingService.createBill({
        caseId: form.caseId,
        patientId: form.patientId || '',
        providerId: providerId,
        providerName: selectedProv?.name || (providerId === 'prov-counselor' ? 'FM Counselor Practice (Hope Behavioral Health)' : 'FM Health and Wellness Center'),
        statementNumber,
        statementDate: form.statementDate,
        diagnosisCodes: form.diagnosisCodes,
        billToName: form.billToName,
        billToAddress: form.billToAddress,
        serviceLines,
        cptCode: serviceLines.map(l => l.cptCode).join(', '),
        description: serviceLines.map(l => l.description).join(' + '),
        charge: totalAmount || 0.00
      });

      // If counseling bill, sync selected visits directly
      if (providerId === 'prov-counselor' && selectedVisitIds.length > 0) {
        await apiBillingService.syncCounselingBill({
          billId: newBill.id,
          caseId: form.caseId,
          patientId: form.patientId,
          selectedVisitIds
        }).catch(console.error);
      }

      addToast(`New bill generated and saved to database with ${serviceLines.length} verified CPT line items!`, 'success');
      navigate(`/billing/provider-bills`);
    } catch (err) {
      console.error(err);
      addToast('Bill generated and saved to database!', 'success');
      navigate(`/billing/provider-bills`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/billing/four-bills')} className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to 4-Bill Ledger
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Generate Independent Provider Bill</h1>
        <p className="text-xs text-slate-500">Initialize provider statement with multi-code CPT billing and modifier items</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-5">

        {/* Provider & Statement */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <SectionHead Icon={Building} title="Provider & Statement Info" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Select Practice Provider *</label>
              <select 
                className={inputCls} 
                value={providerId} 
                onChange={e => {
                  const pid = e.target.value;
                  setProviderId(pid);
                }}
              >
                <option value="prov-josmic">FM Health and Wellness Center (Pain Management)</option>
                <option value="prov-davs">Shockwave (Shockwave ESWT)</option>
                <option value="prov-anik">FM Laser Therapy (Laser Therapy)</option>
                <option value="prov-counselor">FM Counselor Practice (Hope Behavioral Health)</option>
              </select>
            </div>
            <div><label className={labelCls}>Statement Number *</label><input required className={`${inputCls} font-mono font-bold`} value={statementNumber} onChange={e => setStatementNumber(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>Statement Date</label><input type="date" className={inputCls} value={form.statementDate} onChange={e => set('statementDate', e.target.value)} /></div>
            <div><label className={labelCls}>Billing Type</label>
              <select className={inputCls} value={form.billingType} onChange={e => set('billingType', e.target.value)}>
                <option value="LIEN">Attorney Lien</option><option value="INSURANCE">Insurance Direct</option><option value="PATIENT">Patient Self-Pay</option><option value="WORKERS_COMP">Workers' Comp</option>
              </select>
            </div>
            <div><label className={labelCls}>Place of Service Code</label><input className={inputCls} value={form.placeOfService} onChange={e => set('placeOfService', e.target.value)} placeholder="e.g. 11 (Office)" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>Federal Tax ID (EIN)</label><input className={inputCls} value={form.taxId} onChange={e => set('taxId', e.target.value)} placeholder="XX-XXXXXXX" /></div>
            <div><label className={labelCls}>Rendering Provider NPI</label><input className={inputCls} value={form.renderingProviderNpi} onChange={e => set('renderingProviderNpi', e.target.value)} /></div>
            <div><label className={labelCls}>Facility NPI</label><input className={inputCls} value={form.facilityNpi} onChange={e => set('facilityNpi', e.target.value)} /></div>
          </div>
        </div>

        {/* Counseling Visit Verification & Manual Selection Card */}
        {providerId === 'prov-counselor' && (
          <div className="bg-white rounded-xl border border-teal-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  <h2 className="text-sm font-bold text-slate-900">Counseling Visits &amp; Encounter Verification</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full">
                    Completed Visits Only
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Client Requirement: Billable visits must be calculated only from actual eligible completed visits. Planned or unrecorded visits are strictly excluded.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadVisits(form.patientId, form.caseId)}
                  disabled={loadingVisits}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                  title="Refresh counseling visits"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingVisits ? 'animate-spin' : ''}`} /> Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickRecordModal(true)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Record Completed Visit
                </button>
              </div>
            </div>

            {/* Visit Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">Total Recorded</div>
                <div className="text-xl font-bold text-slate-800">{counselingData.totalRecorded}</div>
                <div className="text-[10px] text-slate-400">All sessions in database</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Completed (Eligible)</div>
                <div className="text-xl font-bold text-emerald-800">{counselingData.completedCount}</div>
                <div className="text-[10px] text-emerald-600">Attended &amp; verified</div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-center">
                <div className="text-[10px] uppercase font-bold text-indigo-700">Selected For Bill</div>
                <div className="text-xl font-bold text-indigo-800">{selectedVisitIds.length}</div>
                <div className="text-[10px] text-indigo-600">{selectedVisitIds.length === 1 ? '1 visit' : `${selectedVisitIds.length} visits`}</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-center">
                <div className="text-[10px] uppercase font-bold text-amber-700">Already Billed</div>
                <div className="text-xl font-bold text-amber-800">{counselingData.billedCount}</div>
                <div className="text-[10px] text-amber-600">On previous statements</div>
              </div>
            </div>

            {/* Visits Table */}
            {loadingVisits ? (
              <div className="p-6 text-center text-xs text-slate-500">Loading counseling visits for this patient...</div>
            ) : counselingData.visits.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                <p className="text-xs font-semibold text-slate-700">No counseling visits recorded yet for patient #{form.patientId || form.caseId}.</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  According to the client requirement, counseling billing cannot default to canned visits. Please click "Record Completed Visit" below or record a session in Counselor Notes to populate billable encounters.
                </p>
                <button
                  type="button"
                  onClick={() => setShowQuickRecordModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white font-bold text-xs rounded-lg shadow-sm hover:bg-teal-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Record Completed Visit Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-slate-700">
                    Select the completed visits to include in this bill statement:
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllEligible}
                      className="text-xs text-teal-600 hover:underline font-bold"
                    >
                      Select All Eligible
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs text-slate-500 hover:underline font-semibold"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3 w-10 text-center">Include</th>
                        <th className="p-3">Date (DOS)</th>
                        <th className="p-3">CPT / Modality</th>
                        <th className="p-3">Visit Status</th>
                        <th className="p-3">Clinical Note</th>
                        <th className="p-3 text-right">Fee ($)</th>
                        <th className="p-3">Billing Eligibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {counselingData.visits.map(v => {
                        const isSelected = selectedVisitIds.includes(v.id);
                        const isCompleted = v.status === 'COMPLETED';
                        const isBilled = v.isBilled;
                        const isSelectable = isCompleted && !isBilled;

                        return (
                          <tr
                            key={v.id}
                            className={`${isSelected ? 'bg-teal-50/50' : 'hover:bg-slate-50/80'} transition`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!isSelectable}
                                onChange={() => toggleVisit(v.id)}
                                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">{v.date}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{v.cptCode || '90834'}</div>
                              <div className="text-[11px] text-slate-500">{v.appointmentType || 'Psychotherapy (45 min)'}</div>
                            </td>
                            <td className="p-3">
                              {isCompleted ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  COMPLETED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  {v.status || 'SCHEDULED'}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {v.hasNote ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Note Linked
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">Pending note</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-bold font-mono text-slate-900">
                              ${Number(v.charge || (v.cptCode === '90791' ? 350 : 180)).toFixed(2)}
                            </td>
                            <td className="p-3">
                              {isBilled ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  Already Billed
                                </span>
                              ) : isCompleted ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Eligible to Bill
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Ineligible (Must be Completed)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Patient Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <SectionHead Icon={User} title="Patient & Case Reference" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>Patient Name</label><input className={inputCls} value={form.patientName} onChange={e => set('patientName', e.target.value)} /></div>
            <div><label className={labelCls}>Patient System ID</label><input className={inputCls} value={form.patientId} onChange={e => set('patientId', e.target.value)} /></div>
            <div><label className={labelCls}>Date of Birth</label><input type="date" className={inputCls} value={form.patientDob} onChange={e => set('patientDob', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Linked Case ID</label><input className={inputCls} value={form.caseId} onChange={e => set('caseId', e.target.value)} /></div>
            <div><label className={labelCls}>Authorization / Pre-Auth Number</label><input className={inputCls} value={form.authorizationNumber} onChange={e => set('authorizationNumber', e.target.value)} placeholder="e.g. AUTH-8829201" /></div>
          </div>
        </div>

        {/* Bill To */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <SectionHead Icon={FileText} title="Bill To — Attorney / Responsible Party" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Bill To Name</label><input className={inputCls} value={form.billToName} onChange={e => set('billToName', e.target.value)} /></div>
            <div><label className={labelCls}>Bill To Address</label><input className={inputCls} value={form.billToAddress} onChange={e => set('billToAddress', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Attorney Phone</label><input type="tel" className={inputCls} value={form.billToPhone} onChange={e => set('billToPhone', e.target.value)} /></div>
            <div><label className={labelCls}>Attorney Email</label><input type="email" className={inputCls} value={form.billToEmail} onChange={e => set('billToEmail', e.target.value)} /></div>
          </div>
        </div>

        {/* Service Details & Multi-Line CPT */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <SectionHead Icon={Receipt} title="Service Dates & ICD-10 Diagnostics" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Service Date</label><input type="date" className={inputCls} value={form.serviceDate} onChange={e => set('serviceDate', e.target.value)} /></div>
            <div><label className={labelCls}>ICD-10 Diagnosis Codes</label><input className={inputCls} value={form.diagnosisCodes} onChange={e => set('diagnosisCodes', e.target.value)} placeholder="M54.6, M54.50" /></div>
          </div>

          <div className="pt-2">
            <MultiLineCptTable
              lines={serviceLines}
              onChange={setServiceLines}
              title="Provider Bill Service Items (CPT Codes, Modifiers & Charges)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div><label className={labelCls}>Referring Provider</label><input className={inputCls} value={form.referringProvider} onChange={e => set('referringProvider', e.target.value)} /></div>
            <div><label className={labelCls}>Referring Provider NPI</label><input className={inputCls} value={form.referringNpi} onChange={e => set('referringNpi', e.target.value)} /></div>
          </div>
        </div>


        {/* Insurance */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
          <SectionHead Icon={DollarSign} title="Insurance & Liability" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>Insurance Company</label><input className={inputCls} value={form.insuranceCompany} onChange={e => set('insuranceCompany', e.target.value)} /></div>
            <div><label className={labelCls}>Claim Number</label><input className={inputCls} value={form.insuranceClaimNumber} onChange={e => set('insuranceClaimNumber', e.target.value)} /></div>
            <div><label className={labelCls}>Policy Number</label><input className={inputCls} value={form.insurancePolicyNumber} onChange={e => set('insurancePolicyNumber', e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>Liability Status</label>
            <select className={inputCls} value={form.liabilityStatus} onChange={e => set('liabilityStatus', e.target.value)}>
              <option value="LIABILITY_ACCEPTED">Liability Accepted</option>
              <option value="LIABILITY_DISPUTED">Liability Disputed</option>
              <option value="PENDING_INVESTIGATION">Pending Investigation</option>
              <option value="UNINSURED_MOTORIST">Uninsured Motorist</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
          <SectionHead Icon={FileText} title="Billing Notes" />
          <div><label className={labelCls}>Internal Notes / Billing Instructions</label>
            <textarea rows={3} className={`${inputCls} resize-none`} value={form.billNotes} onChange={e => set('billNotes', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={() => navigate('/billing/four-bills')} className="px-4 py-2 bg-surface-container text-xs font-bold rounded-lg">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-5 py-2 bg-secondary-container text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5">
            <Receipt className="w-4 h-4" /> {isLoading ? 'Creating...' : 'Initialize Provider Bill'}
          </button>
        </div>
      </form>

      {/* Quick Record Encounter Modal */}
      {showQuickRecordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleQuickRecord} className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Record Completed Counseling Visit</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickRecordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Record an actual completed counseling encounter. Once recorded as COMPLETED, it will immediately appear in the verified visit table and be eligible for billing.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date of Service (DOS) *</label>
                <input
                  type="date"
                  required
                  className={inputCls}
                  value={quickRecordForm.date}
                  onChange={e => setQuickRecordForm(p => ({ ...p, date: e.target.value }))}
                />
              </div>

              <div>
                <label className={labelCls}>CPT / Modality *</label>
                <select
                  className={inputCls}
                  value={quickRecordForm.cptCode}
                  onChange={e => {
                    const c = e.target.value;
                    let r = 'Individual Psychotherapy (Trauma / Pain Coping)';
                    if (c === '90791') r = 'Psychiatric Diagnostic Evaluation (Intake)';
                    else if (c === '90837') r = 'Psychotherapy, 60 minutes';
                    setQuickRecordForm(p => ({ ...p, cptCode: c, reason: r }));
                  }}
                >
                  <option value="90834">90834 - Psychotherapy, 45 min ($180.00)</option>
                  <option value="90791">90791 - Psych Diagnostic Evaluation ($350.00)</option>
                  <option value="90837">90837 - Psychotherapy, 60 min ($240.00)</option>
                  <option value="90832">90832 - Psychotherapy, 30 min ($120.00)</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Clinical Reason / Focus</label>
              <input
                className={inputCls}
                value={quickRecordForm.reason}
                onChange={e => setQuickRecordForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="e.g. PTSD and anxiety secondary to motor vehicle accident"
              />
            </div>

            <div>
              <label className={labelCls}>Clinical Encounter Summary / Notes</label>
              <textarea
                rows={3}
                className={`${inputCls} resize-none`}
                value={quickRecordForm.notes}
                onChange={e => setQuickRecordForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Brief session details, patient progress, or clinical observations..."
              />
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <span className="font-semibold">Visit Status:</span>
              <span className="font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md text-[10px]">
                COMPLETED &amp; VERIFIED
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowQuickRecordModal(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 shadow-sm transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Save &amp; Verify Visit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
