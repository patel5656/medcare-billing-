import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tag, X, Save, Edit3, Plus, Shield, Loader2, Calendar, 
  User, Stethoscope, CheckCircle2, Clock, Search, Filter, 
  Trash2, RefreshCw, FileText, ChevronRight, Activity 
} from 'lucide-react';
import { apiCptService } from '../../services/api/apiCptService';
import { apiBillingService } from '../../services/api/apiBillingService';
import { apiPatientService } from '../../services/api/apiPatientService';
import { apiProviderService } from '../../services/api/apiProviderService';
import { apiAppointmentService } from '../../services/api/apiAppointmentService';
import { useUIStore } from '../../store/uiStore';

export const ServicesPage = () => {
  const { addToast } = useUIStore();

  // Active view: 'RECORDED_SERVICES' or 'CPT_CATALOG'
  const [activeTab, setActiveTab] = useState('RECORDED_SERVICES');

  // CPT Catalog State
  const [cptServices, setCptServices] = useState([]);
  const [isCptModalOpen, setIsCptModalOpen] = useState(false);
  const [editingCptId, setEditingCptId] = useState(null);
  const [viewingSvc, setViewingSvc] = useState(null);
  const [cptForm, setCptForm] = useState({ code: '', description: '', fee: '', category: 'Standard', modifiers: '' });
  const [isSavingCpt, setIsSavingCpt] = useState(false);

  // Performed Patient Services State
  const [performedServices, setPerformedServices] = useState([]);
  const [isLoadingPerformed, setIsLoadingPerformed] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  // Dropdown options
  const [patientsList, setPatientsList] = useState([]);
  const [providersList, setProvidersList] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Record Service Form State
  const [recordForm, setRecordForm] = useState({
    patientId: '',
    providerId: '',
    appointmentId: '',
    caseId: '',
    dos: new Date().toISOString().split('T')[0],
    cptCode: '',
    description: '',
    units: 1,
    rate: '180.00',
    totalCharge: '180.00',
    status: 'COMPLETED'
  });

  const inputCls = 'w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition';
  const labelCls = 'block text-xs font-bold text-slate-800 mb-1';

  // Fetch CPT catalog
  const fetchCptCatalog = async () => {
    try {
      const data = await apiCptService.getCptCodes();
      setCptServices(Array.isArray(data) ? data : []);
    } catch (error) {
      addToast('Failed to load CPT fee catalog', 'error');
    }
  };

  // Fetch Performed Services from database
  const fetchPerformedServices = async () => {
    setIsLoadingPerformed(true);
    try {
      const res = await apiBillingService.getPerformedServices();
      setPerformedServices(res?.services || []);
    } catch (error) {
      console.error('Failed to load performed services:', error);
      addToast('Failed to load recorded patient services', 'error');
    } finally {
      setIsLoadingPerformed(false);
    }
  };

  // Load patient and provider dropdown options
  const loadDropdownOptions = async () => {
    try {
      const [patRes, provRes] = await Promise.all([
        apiPatientService.getPatients().catch(() => []),
        apiProviderService.getProviders().catch(() => [])
      ]);
      const patients = Array.isArray(patRes) ? patRes : (patRes?.patients || []);
      const providers = Array.isArray(provRes) ? provRes : (provRes && typeof provRes === 'object' ? Object.values(provRes) : []);
      setPatientsList(patients);
      setProvidersList(providers);
    } catch (err) {
      console.error('Failed to load dropdown options:', err);
    }
  };

  useEffect(() => {
    fetchCptCatalog();
    fetchPerformedServices();
    loadDropdownOptions();
  }, []);

  // When patient selection changes in Record Service Form, fetch their appointments
  const handlePatientSelectChange = async (patientId) => {
    const selectedPat = patientsList.find(p => p.id === patientId || p.patientId === patientId);
    const caseId = selectedPat?.cases?.[0]?.id || selectedPat?.caseId || '';

    // Extract patient's assigned providers to auto-select
    let assignedIds = selectedPat?.assignedProviderIds;
    if (typeof assignedIds === 'string') {
      try { assignedIds = JSON.parse(assignedIds); } catch (e) { assignedIds = []; }
    }
    if (!assignedIds || assignedIds.length === 0) {
      assignedIds = selectedPat?.cases?.[0]?.assignedProviderIds;
      if (typeof assignedIds === 'string') {
        try { assignedIds = JSON.parse(assignedIds); } catch (e) { assignedIds = []; }
      }
    }

    const defaultProv = (Array.isArray(assignedIds) && assignedIds.length > 0)
      ? assignedIds[0]
      : (providersList[0]?.id || 'prov-counselor');

    setRecordForm(prev => ({
      ...prev,
      patientId,
      caseId,
      providerId: defaultProv,
      appointmentId: ''
    }));

    if (!patientId) {
      setPatientAppointments([]);
      return;
    }

    setLoadingAppts(true);
    try {
      const apptRes = await apiAppointmentService.getAllAppointments({ patientId });
      const appts = Array.isArray(apptRes) ? apptRes : (apptRes?.appointments || []);
      setPatientAppointments(appts);
    } catch (err) {
      console.error('Failed to load patient appointments:', err);
      setPatientAppointments([]);
    } finally {
      setLoadingAppts(false);
    }
  };

  // When appointment selection changes, auto-populate DOS, provider, and CPT if available
  const handleAppointmentSelectChange = (appointmentId) => {
    const appt = patientAppointments.find(a => a.id === appointmentId);
    if (appt) {
      const apptDos = appt.date || appt.appointmentDate?.split('T')[0] || recordForm.dos;
      const apptCpt = appt.cptCode || recordForm.cptCode || '90834';
      const apptProv = appt.providerId || recordForm.providerId;

      // Find CPT description and fee from catalog
      const matchedCpt = cptServices.find(c => c.code === apptCpt);
      const feeNum = matchedCpt ? parseFloat(matchedCpt.fee?.replace(/[^0-9.]/g, '') || 180) : 180.00;
      const desc = appt.appointmentType || matchedCpt?.description || 'Clinical Care Encounter';

      setRecordForm(prev => ({
        ...prev,
        appointmentId,
        dos: apptDos,
        providerId: apptProv || prev.providerId,
        cptCode: apptCpt,
        description: desc,
        rate: feeNum.toFixed(2),
        totalCharge: (feeNum * Number(prev.units || 1)).toFixed(2),
        status: appt.status || 'COMPLETED'
      }));
    } else {
      setRecordForm(prev => ({ ...prev, appointmentId: '' }));
    }
  };

  // When CPT Code changes, auto-populate description and fee from catalog
  const handleCptCodeSelectChange = (cptCode) => {
    const matched = cptServices.find(c => c.code === cptCode);
    let feeNum = 180.00;
    let desc = '';

    if (matched) {
      feeNum = parseFloat(matched.fee?.replace(/[^0-9.]/g, '') || 180);
      desc = matched.description || '';
    } else {
      const FEE_SCHEDULE = {
        '90791': 350.00, '90834': 180.00, '90837': 240.00, '90832': 120.00,
        '90847': 220.00, '90853': 95.00, '99204': 1214.00, '97039': 2000.00,
        '0101T': 1000.00, '20552': 450.00, '97124': 150.00
      };
      feeNum = FEE_SCHEDULE[cptCode] || 180.00;
      if (cptCode === '90791') desc = 'Psychiatric Diagnostic Evaluation & Trauma Assessment';
      else if (cptCode === '90834') desc = 'Individual Psychotherapy 45 min for PTSD';
      else if (cptCode === '99204') desc = 'Comprehensive Initial Pain Management Evaluation';
      else if (cptCode === '97039') desc = 'Class IV High-Intensity Laser Therapy';
      else if (cptCode === '0101T') desc = 'Extracorporeal Shockwave Therapy (ESWT)';
    }

    setRecordForm(prev => {
      const units = Number(prev.units || 1);
      return {
        ...prev,
        cptCode,
        description: desc || prev.description,
        rate: feeNum.toFixed(2),
        totalCharge: (feeNum * units).toFixed(2)
      };
    });
  };

  // When units or rate change, recalculate totalCharge
  const handleUnitsOrRateChange = (field, val) => {
    setRecordForm(prev => {
      const updated = { ...prev, [field]: val };
      const u = Number(field === 'units' ? val : updated.units) || 1;
      const r = parseFloat(field === 'rate' ? val : updated.rate) || 0;
      updated.totalCharge = (u * r).toFixed(2);
      return updated;
    });
  };

  // Open "Record Service" Modal
  const openRecordServiceModal = (serviceToEdit = null) => {
    if (serviceToEdit) {
      setEditingServiceId(serviceToEdit.id);
      setRecordForm({
        patientId: serviceToEdit.patientId || '',
        providerId: serviceToEdit.providerId || '',
        appointmentId: serviceToEdit.appointmentId || serviceToEdit.id || '',
        caseId: serviceToEdit.caseId || '',
        dos: serviceToEdit.dos || serviceToEdit.dateOfService || new Date().toISOString().split('T')[0],
        cptCode: serviceToEdit.cptCode || '90834',
        description: serviceToEdit.description || '',
        units: serviceToEdit.units || 1,
        rate: Number(serviceToEdit.rate || 180).toFixed(2),
        totalCharge: Number(serviceToEdit.totalCharge || 180).toFixed(2),
        status: serviceToEdit.status || 'COMPLETED'
      });
      if (serviceToEdit.patientId) {
        handlePatientSelectChange(serviceToEdit.patientId);
      }
    } else {
      setEditingServiceId(null);
      const defaultProv = providersList[0]?.id || 'prov-counselor';
      setRecordForm({
        patientId: patientsList[0]?.id || '',
        providerId: defaultProv,
        appointmentId: '',
        caseId: '',
        dos: new Date().toISOString().split('T')[0],
        cptCode: cptServices[0]?.code || '90834',
        description: cptServices[0]?.description || 'Behavioral Health Psychotherapy Session',
        units: 1,
        rate: '180.00',
        totalCharge: '180.00',
        status: 'COMPLETED'
      });
      if (patientsList[0]?.id) {
        handlePatientSelectChange(patientsList[0].id);
      }
    }
    setIsRecordModalOpen(true);
  };

  // Submit Performed Service Form
  const handleRecordFormSubmit = async (e) => {
    e.preventDefault();
    if (!recordForm.patientId) {
      addToast('Please select a patient', 'error');
      return;
    }
    if (!recordForm.providerId) {
      addToast('Please select a provider', 'error');
      return;
    }
    if (!recordForm.dos) {
      addToast('Please enter date of service', 'error');
      return;
    }
    if (!recordForm.cptCode) {
      addToast('Please select or enter a CPT code', 'error');
      return;
    }

    setIsSavingRecord(true);
    try {
      if (editingServiceId) {
        await apiBillingService.updatePerformedService(editingServiceId, recordForm);
        addToast('Patient service updated successfully in database', 'success');
      } else {
        await apiBillingService.recordPerformedService(recordForm);
        addToast('Patient service recorded and saved to database successfully', 'success');
      }
      setIsRecordModalOpen(false);
      fetchPerformedServices();
    } catch (err) {
      console.error('Error saving patient service:', err);
      addToast(err.message || 'Failed to save service record', 'error');
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Delete Performed Service
  const handleDeletePerformedService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recorded patient service from the database?')) return;
    try {
      await apiBillingService.deletePerformedService(id);
      addToast('Service record deleted from database', 'success');
      fetchPerformedServices();
    } catch (err) {
      addToast(err.message || 'Failed to delete service', 'error');
    }
  };

  // CPT Catalog Modal Handlers
  const openAddCptModal = () => {
    setCptForm({ code: '', description: '', fee: '', category: 'Standard', modifiers: '' });
    setEditingCptId(null);
    setIsCptModalOpen(true);
  };

  const openEditCptModal = (svc) => {
    setCptForm({
      code: svc.code,
      description: svc.description,
      fee: (svc.fee || '').replace(/[^0-9.]/g, ''),
      category: svc.category || 'Standard',
      modifiers: svc.modifiers || ''
    });
    setEditingCptId(svc.id);
    setIsCptModalOpen(true);
  };

  const handleCptFormSubmit = async (e) => {
    e.preventDefault();
    setIsSavingCpt(true);
    try {
      const payload = { ...cptForm, fee: `$${parseFloat(cptForm.fee || 0).toFixed(2)}` };
      if (editingCptId) {
        await apiCptService.updateCptCode(editingCptId, payload);
        addToast('CPT code updated successfully', 'success');
      } else {
        await apiCptService.createCptCode(payload);
        addToast('CPT code registered successfully', 'success');
      }
      setIsCptModalOpen(false);
      fetchCptCatalog();
    } catch (err) {
      addToast(err.message || 'Failed to save CPT code', 'error');
    } finally {
      setIsSavingCpt(false);
    }
  };

  const handleDeleteCpt = async (id) => {
    if (!window.confirm('Are you sure you want to delete this CPT service code from catalog?')) return;
    try {
      await apiCptService.deleteCptCode(id);
      addToast('CPT code deleted from catalog', 'success');
      fetchCptCatalog();
    } catch (err) {
      addToast(err.message || 'Failed to delete CPT code', 'error');
    }
  };

  // Filter providers in Record Service Modal by the selected patient's assigned practice clinics/providers
  const modalProviders = useMemo(() => {
    if (!recordForm.patientId) return providersList;
    const selectedPat = patientsList.find(p => p.id === recordForm.patientId || p.patientId === recordForm.patientId);
    if (!selectedPat) return providersList;

    let assignedIds = selectedPat.assignedProviderIds;
    if (typeof assignedIds === 'string') {
      try { assignedIds = JSON.parse(assignedIds); } catch (e) { assignedIds = []; }
    }
    if (!assignedIds || assignedIds.length === 0) {
      assignedIds = selectedPat.cases?.[0]?.assignedProviderIds;
      if (typeof assignedIds === 'string') {
        try { assignedIds = JSON.parse(assignedIds); } catch (e) { assignedIds = []; }
      }
    }

    if (Array.isArray(assignedIds) && assignedIds.length > 0) {
      const filtered = providersList.filter(p => assignedIds.includes(p.id));
      if (filtered.length > 0) return filtered;
    }
    return providersList;
  }, [recordForm.patientId, patientsList, providersList]);

  // Filtered Performed Services
  const filteredPerformedServices = useMemo(() => {
    return performedServices.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || 
        (s.patientName || '').toLowerCase().includes(q) ||
        (s.cptCode || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.providerName || '').toLowerCase().includes(q);

      const matchProv = filterProvider === 'ALL' || s.providerId === filterProvider;
      const matchStatus = filterStatus === 'ALL' || (s.status || '').toUpperCase() === filterStatus;

      return matchSearch && matchProv && matchStatus;
    });
  }, [performedServices, searchQuery, filterProvider, filterStatus]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Services &amp; Procedures</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Record patient-specific services, manage clinical encounters, and configure fee schedules.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openRecordServiceModal()}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            title="Record a newly performed service for a patient"
          >
            <Plus className="w-4 h-4" />
            Record Service
          </button>
          <button
            onClick={openAddCptModal}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Add a CPT code to the fee catalog"
          >
            <Tag className="w-3.5 h-3.5 text-teal-600" />
            Add CPT Code
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('RECORDED_SERVICES')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'RECORDED_SERVICES'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Recorded Patient Services
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-50 text-teal-700 font-extrabold border border-teal-200">
            {performedServices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CPT_CATALOG')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'CPT_CATALOG'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          Fee Schedules &amp; CPT Catalog
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-extrabold border border-slate-200">
            {cptServices.length}
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 1: RECORDED PATIENT SERVICES                            */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'RECORDED_SERVICES' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, CPT, service..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-600 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-bold">Provider:</span>
                <select
                  value={filterProvider}
                  onChange={e => setFilterProvider(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none"
                >
                  <option value="ALL">All Providers</option>
                  {providersList.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.businessName || p.id}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-bold">Status:</span>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <button
                onClick={fetchPerformedServices}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Refresh services from database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPerformed ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table or Empty State */}
          {isLoadingPerformed ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600" />
              <p className="text-xs font-bold">Loading patient services from database...</p>
            </div>
          ) : filteredPerformedServices.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
                <Activity className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No Patient Services Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchQuery || filterProvider !== 'ALL' || filterStatus !== 'ALL'
                    ? 'No service records match the selected filters. Try resetting the filters.'
                    : 'No patient services have been recorded yet. Click "Record Service" to link an encounter to a patient and save it to the database.'}
                </p>
              </div>
              <button
                onClick={() => openRecordServiceModal()}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Record First Service
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">DATE OF SERVICE</th>
                      <th className="p-3.5">PATIENT</th>
                      <th className="p-3.5">PROVIDER</th>
                      <th className="p-3.5">CPT &amp; SERVICE DESCRIPTION</th>
                      <th className="p-3.5 text-center">UNITS</th>
                      <th className="p-3.5 text-right">RATE</th>
                      <th className="p-3.5 text-right">TOTAL CHARGE</th>
                      <th className="p-3.5 text-center">STATUS</th>
                      <th className="p-3.5 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPerformedServices.map((svc) => (
                      <tr key={svc.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {svc.dos || svc.dateOfService || '-'}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {svc.patientName}
                          {svc.caseId && (
                            <span className="block text-[10px] text-slate-400 font-mono font-normal">
                              Case: {svc.caseId}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">
                          {svc.providerName}
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded text-[11px] border border-teal-200 mr-2">
                            {svc.cptCode}
                          </span>
                          <span className="text-slate-700 font-medium">
                            {svc.description}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-700">
                          {svc.units || 1}
                        </td>
                        <td className="p-3.5 text-right font-mono font-medium text-slate-600">
                          ${Number(svc.rate || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          ${Number(svc.totalCharge || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            svc.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : svc.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}>
                            {svc.status || 'COMPLETED'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openRecordServiceModal(svc)}
                              className="text-amber-600 hover:text-amber-800 text-xs font-bold transition cursor-pointer p-1"
                              title="Edit Service"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePerformedService(svc.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-bold transition cursor-pointer p-1"
                              title="Delete Service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 2: FEE SCHEDULES & CPT CATALOG                          */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'CPT_CATALOG' && (
        <div className="space-y-4">
          {cptServices.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
              <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Service Catalog Configuration</h3>
              <p className="text-sm max-w-md mx-auto">
                This module allows configuration of CPT codes and associated fee schedules for the practice. Click "Add CPT Code" to register standard rates.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">CPT CODE</th>
                      <th className="p-3.5">PROCEDURE DESCRIPTION</th>
                      <th className="p-3.5">CATEGORY</th>
                      <th className="p-3.5 text-right">STANDARD FEE (S)</th>
                      <th className="p-3.5 text-center">DEFAULT MODIFIERS</th>
                      <th className="p-3.5 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cptServices.map((svc) => (
                      <tr key={svc.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-bold text-slate-900">
                          {svc.code}
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">
                          {svc.description}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full font-bold text-[11px]">
                            {svc.category || 'General'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                          {svc.fee}
                        </td>
                        <td className="p-3.5 text-center text-slate-500 font-medium">
                          {svc.modifiers || '-'}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => setViewingSvc(svc)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-bold transition cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              onClick={() => openEditCptModal(svc)}
                              className="text-amber-600 hover:text-amber-800 text-xs font-bold transition cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCpt(svc.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-bold transition cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: RECORD / EDIT PATIENT SERVICE                        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingServiceId ? 'Edit Recorded Patient Service' : 'Record New Patient Service'}
                  </h2>
                  <p className="text-[10px] text-slate-500">Links actual clinical visit, CPT code, and billing rate</p>
                </div>
              </div>
              <button onClick={() => setIsRecordModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-xl transition cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleRecordFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Patient Selection */}
              <div>
                <label className={labelCls}>Patient *</label>
                <select
                  required
                  value={recordForm.patientId}
                  onChange={e => handlePatientSelectChange(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Select Patient --</option>
                  {patientsList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} {p.patientId ? `(${p.patientId})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider Selection */}
              <div>
                <label className={labelCls}>Provider / Modality *</label>
                <select
                  required
                  value={recordForm.providerId}
                  onChange={e => setRecordForm({ ...recordForm, providerId: e.target.value })}
                  className={inputCls}
                >
                  <option value="">-- Select Provider --</option>
                  {modalProviders.map(prov => (
                    <option key={prov.id} value={prov.id}>
                      {prov.name || prov.businessName || prov.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment / Visit Selection */}
              <div>
                <label className={labelCls}>
                  Associated Visit / Appointment {loadingAppts && <span className="text-teal-600 text-[10px] font-normal">(Loading...)</span>}
                </label>
                <select
                  value={recordForm.appointmentId}
                  onChange={e => handleAppointmentSelectChange(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Direct Service Entry (Create / Link Visit) --</option>
                  {patientAppointments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.date || a.appointmentDate?.split('T')[0]} • {a.appointmentType || 'Visit'} • {a.status}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Selecting an appointment auto-populates DOS and links documentation.
                </p>
              </div>

              {/* Date of Service & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date of Service (DOS) *</label>
                  <input
                    type="date"
                    required
                    value={recordForm.dos}
                    onChange={e => setRecordForm({ ...recordForm, dos: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Service Status</label>
                  <select
                    value={recordForm.status}
                    onChange={e => setRecordForm({ ...recordForm, status: e.target.value })}
                    className={inputCls}
                  >
                    <option value="COMPLETED">COMPLETED (Billable)</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              {/* CPT Code Selection */}
              <div>
                <label className={labelCls}>CPT Code *</label>
                <select
                  required
                  value={recordForm.cptCode}
                  onChange={e => handleCptCodeSelectChange(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Select CPT Code --</option>
                  {cptServices.map(c => (
                    <option key={c.id || c.code} value={c.code}>
                      {c.code} – {c.description} ({c.fee})
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Description */}
              <div>
                <label className={labelCls}>Service Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Individual Psychotherapy 45 min"
                  value={recordForm.description}
                  onChange={e => setRecordForm({ ...recordForm, description: e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* Units, Rate, Total Charge */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Units</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={recordForm.units}
                    onChange={e => handleUnitsOrRateChange('units', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={recordForm.rate}
                    onChange={e => handleUnitsOrRateChange('rate', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-teal-800 mb-1">Total ($)</label>
                  <input
                    type="text"
                    readOnly
                    value={`$${recordForm.totalCharge}`}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-teal-200 bg-teal-50 text-teal-900 outline-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRecord}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-xl flex items-center gap-2 shadow-md shadow-teal-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingRecord ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD / EDIT CPT CATALOG ENTRY                         */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isCptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{editingCptId ? 'Edit Service / CPT' : 'Add New Service / CPT'}</h2>
                  <p className="text-[10px] text-slate-500">Register a new service code in the catalog</p>
                </div>
              </div>
              <button onClick={() => setIsCptModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-xl transition cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCptFormSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>CPT Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 99213"
                  value={cptForm.code}
                  onChange={e => setCptForm({ ...cptForm, code: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Procedure Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Visit, Established Patient"
                  value={cptForm.description}
                  onChange={e => setCptForm({ ...cptForm, description: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Standard Fee (S) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={cptForm.fee}
                    onChange={e => setCptForm({ ...cptForm, fee: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    value={cptForm.category}
                    onChange={e => setCptForm({ ...cptForm, category: e.target.value })}
                    className={inputCls}
                  >
                    <option value="General">General</option>
                    <option value="E&M">E&M</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Evaluation">Evaluation</option>
                    <option value="Therapy">Therapy</option>
                    <option value="Injections">Injections</option>
                    <option value="Mental Health">Mental Health</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Default Modifiers</label>
                <input
                  type="text"
                  placeholder="e.g. 25, 59"
                  value={cptForm.modifiers}
                  onChange={e => setCptForm({ ...cptForm, modifiers: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCptModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCpt}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-xl flex items-center gap-2 shadow-md shadow-teal-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingCpt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL: VIEW CPT DETAILS                                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {viewingSvc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">View Service Details</h2>
                </div>
              </div>
              <button onClick={() => setViewingSvc(null)} className="p-1.5 hover:bg-slate-200 rounded-xl transition cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1">CPT Code</span>
                <span className="font-medium text-slate-900">{viewingSvc.code}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1">Procedure Description</span>
                <span className="font-medium text-slate-900">{viewingSvc.description}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-slate-500 mb-1">Standard Fee (S)</span>
                  <span className="font-medium text-slate-900">{viewingSvc.fee}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-500 mb-1">Category</span>
                  <span className="font-medium text-slate-900">{viewingSvc.category || 'General'}</span>
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-500 mb-1">Default Modifiers</span>
                <span className="font-medium text-slate-900">{viewingSvc.modifiers || '-'}</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setViewingSvc(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
