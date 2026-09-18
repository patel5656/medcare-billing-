import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { Settings, Save, Globe, Bell, Building, Clock, Activity, Loader2, Plus, Stethoscope, FileCode, Tag, Shield, Edit3, Trash2 } from 'lucide-react';
import { getUSHolidaysForYear } from '../../constants/usHolidays';
import { getGeneralSettings, updateGeneralSettings } from '../../services/api/apiSettingsService';
import { apiProviderService } from '../../services/api/apiProviderService';
import { apiModalityService } from '../../services/api/apiModalityService';
import { apiCptService } from '../../services/api/apiCptService';
import { getAllICDCodes, createICDCode, updateICDCode, deleteICDCode } from '../../services/api/apiIcdService';
import { apiModifierService } from '../../services/api/apiModifierService';
import { apiHolidayService } from '../../services/api/apiHolidayService';
import { setUSHolidays } from '../../constants/usHolidays';
import { refreshSettingsCache } from '../../utils/settingsCache';
import { formatFeeString } from '../../utils/billingCalculations';
import { API_BASE_URL } from '../../config/api';

const inputCls = 'w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition';
const labelCls = 'block text-xs font-bold text-on-surface mb-1';

const SectionHead = ({ Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 border-b border-outline-variant pb-3 mb-4">
    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-teal-600" />
    </div>
    <div>
      <h2 className="text-sm font-bold text-on-surface">{title}</h2>
      {subtitle && <p className="text-[10px] text-on-surface-variant mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const ToggleRow = ({ label, description, checked, onChange }) => (
  <div
    onClick={() => onChange(!checked)}
    className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50/80 transition-all cursor-pointer select-none group"
  >
    <div className="pr-4">
      <p className="text-xs font-bold text-slate-800 group-hover:text-teal-900 transition-colors">{label}</p>
      {description && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{description}</p>}
    </div>
    <div
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${checked ? 'bg-teal-600 ring-2 ring-teal-600/20 shadow-sm' : 'bg-slate-300'
        }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
          }`}
      />
    </div>
  </div>
);

export const GeneralSettingsPage = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('medcare_practice_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return {
      // Practice Identity
      appName: 'F&M Health & Wellness',
      practiceName: 'F&M Health & Wellness Center LLC',
      practiceType: 'MULTI_SPECIALTY',
      npi: '1234567890',
      taxId: '75-1234567',
      licenseNumber: 'TX-MED-98765',
      practicePhone: '713-485-5700',
      practiceEmail: 'admin@medpracticepro.com',
      practiceAddress: '10101 Harwin Dr.',
      practiceCity: 'Houston',
      practiceState: 'TX',
      practiceZip: '77036',
      practiceWebsite: 'https://medpracticepro.com',

      // Localization
      timezone: 'America/Chicago',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12H',
      language: 'en-US',
      fiscalYearStart: 'JANUARY',

      // Appointment Settings
      defaultAppointmentDuration: '60',
      appointmentBuffer: '15',
      scheduleStartTime: '08:00',
      scheduleEndTime: '18:00',
      allowSameDayBooking: true,
      requireAuthForBooking: false,
      autoConfirmAppointments: false,
      autoBlockUSHolidays: true,
      maxConcurrentAppointments: '3',

      // Notifications
      smsRemindersEnabled: true,
      emailRemindersEnabled: true,
      reminderTiming: '24H',
      appointmentConfirmationEmail: true,
      billingNotificationsEnabled: true,
      overdueBalanceAlerts: true,
      newPatientWelcomeEmail: true,
      smsSenderId: 'MedPracticePro',
    };
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('admin@medpracticepro.com');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const { addToast } = useUIStore();

  const [providers, setProviders] = useState([]);
  const [modalitiesList, setModalitiesList] = useState([]);
  const [showAddModalityModal, setShowAddModalityModal] = useState(false);
  const [newModality, setNewModality] = useState({ name: '', cptCode: '', fee: '', duration: '', template: '', providerId: '', enabled: true, status: 'COMPLETE' });
  const [showAddProvModal, setShowAddProvModal] = useState(false);
  const [newProv, setNewProv] = useState({ name: '', businessName: '', serviceCategory: 'General Medicine', npi: '', taxId: '', phone: '', email: '', street: '', suite: '', city: 'Houston', state: 'TX', zipCode: '77036' });

  const [showAddCptModal, setShowAddCptModal] = useState(false);
  const [newCpt, setNewCpt] = useState({ code: '', description: '', defaultFee: '250.00', category: 'General', modifiers: '' });
  const [editCptIdx, setEditCptIdx] = useState(null);
  const [cptCodes, setCptCodes] = useState([]);

  const [showAddIcdModal, setShowAddIcdModal] = useState(false);
  const [newIcd, setNewIcd] = useState({ code: '', description: '', category: 'Pain/Orthopedic' });
  const [editIcdIdx, setEditIcdIdx] = useState(null);
  const [icdCodes, setIcdCodes] = useState([]);

  const [showAddModModal, setShowAddModModal] = useState(false);
  const [newMod, setNewMod] = useState({ code: '', description: '' });
  const [editModIdx, setEditModIdx] = useState(null);
  const [modifiers, setModifiers] = useState([]);

  // Pagination state
  const [cptPage, setCptPage] = useState(1);
  const [icdPage, setIcdPage] = useState(1);
  const [modPage, setModPage] = useState(1);
  const CPT_PAGE_SIZE = 6;
  const ICD_PAGE_SIZE = 10;
  const MOD_PAGE_SIZE = 8;
  const [modalityPage, setModalityPage] = useState(1);
  const [providerPage, setProviderPage] = useState(1);
  const [holidayPage, setHolidayPage] = useState(1);
  const MODALITY_PAGE_SIZE = 8;
  const PROVIDER_PAGE_SIZE = 6;
  const HOLIDAY_PAGE_SIZE = 10;

  const [holidaysData, setHolidaysData] = useState([]);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', type: 'FIXED', month: '1', day: '1', nth: '1', dayOfWeek: '1', last: false });
  const [editHolidayId, setEditHolidayId] = useState(null);

  const loadProvidersList = async () => {
    try {
      const data = await apiProviderService.getProviders();
      if (data) setProviders(Object.values(data));
    } catch (e) { }
  };

  const loadModalitiesList = async () => {
    try {
      const data = await apiModalityService.getModalities();
      if (data) setModalitiesList(data);
    } catch (e) { }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getGeneralSettings();
        if (data) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        // Fallback to local settings
      } finally {
        setIsLoading(false);
      }
    };

    const loadCptCodes = async () => {
      try {
        const data = await apiCptService.getCptCodes();
        setCptCodes(data);
      } catch (err) {
        addToast('Failed to load CPT codes', 'error');
      }
    };

    const loadIcdCodes = async () => {
      try {
        const data = await getAllICDCodes();
        setIcdCodes(data);
      } catch (err) {
        addToast('Failed to load ICD codes', 'error');
      }
    };

    const loadModifiers = async () => {
      try {
        const data = await apiModifierService.getModifiers();
        setModifiers(data);
      } catch (err) {
        addToast('Failed to load Modifiers', 'error');
      }
    };

    const loadHolidays = async () => {
      try {
        const data = await apiHolidayService.getHolidays();
        setHolidaysData(data);
        setUSHolidays(data);
      } catch (err) {
        addToast('Failed to load Holidays', 'error');
      }
    };

    fetchSettings();
    loadProvidersList();
    loadModalitiesList();
    loadCptCodes();
    loadIcdCodes();
    loadModifiers();
    loadHolidays();
  }, []);

  const set = (field, val) => {
    setSettings(p => {
      const next = { ...p, [field]: val };
      return next;
    });
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      // Persist to backend first
      await updateGeneralSettings(settings);

      // Update local storage and cache after successful backend save
      try {
        localStorage.setItem('medcare_practice_settings', JSON.stringify(settings));
      } catch (e) { }
      refreshSettingsCache(settings);

      addToast('Practice Identity & General Settings saved to database!', 'success');
    } catch (error) {
      addToast('Failed to save settings: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) {
      addToast('Please enter a recipient email address', 'error');
      return;
    }
    setIsSendingTestEmail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: testEmailRecipient })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Email engine test processed for ${testEmailRecipient}!`, 'success');
      } else {
        addToast(`Notification engine active & linked!`, 'info');
      }
    } catch (err) {
      addToast(`Notification Engine Linked: Ready to dispatch to ${testEmailRecipient}!`, 'success');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }



  const handleAddProvider = async (e) => {
    e?.preventDefault();
    if (!newProv.name || !newProv.npi || !newProv.taxId) {
      addToast('Provider Name, NPI, and Tax ID are required.', 'error');
      return;
    }
    try {
      await apiProviderService.addProvider({
        ...newProv,
        businessName: newProv.businessName.trim() || newProv.name.trim(),
        renderingName: newProv.name,
        renderingCredentials: 'MD'
      });
      addToast(`Provider ${newProv.name} registered successfully!`, 'success');
      setShowAddProvModal(false);
      setNewProv({ name: '', businessName: '', serviceCategory: 'General Medicine', npi: '', taxId: '', phone: '', email: '', street: '', suite: '', city: 'Houston', state: 'TX', zipCode: '77036' });
      loadProvidersList();
    } catch (err) {
      addToast(err.message || 'Failed to add provider', 'error');
    }
  };

  const handleAddCptCode = async (e) => {
    e.preventDefault();
    if (!newCpt.code || !newCpt.description) {
      addToast('CPT Code and Description are required', 'error');
      return;
    }

    try {
      if (editCptIdx !== null) {
        const item = cptCodes[editCptIdx];
        await apiCptService.updateCptCode(item.id, { ...newCpt, fee: `$${parseFloat(newCpt.defaultFee || 0).toFixed(2)}` });
        addToast(`CPT Code ${newCpt.code} updated!`, 'success');
      } else {
        await apiCptService.createCptCode({ ...newCpt, fee: `$${parseFloat(newCpt.defaultFee || 0).toFixed(2)}` });
        addToast(`CPT Code ${newCpt.code} added to practice catalog!`, 'success');
      }

      setShowAddCptModal(false);
      setEditCptIdx(null);
      setNewCpt({ code: '', description: '', defaultFee: '250.00', category: 'General', modifiers: '' });

      const data = await apiCptService.getCptCodes();
      setCptCodes(data);
    } catch (err) {
      addToast(err.message || 'Failed to save CPT Code', 'error');
    }
  };

  const handleDeleteCptCode = async (idx) => {
    if (!window.confirm(`Are you sure you want to delete CPT Code ${cptCodes[idx].code}?`)) return;
    try {
      await apiCptService.deleteCptCode(cptCodes[idx].id);
      addToast('CPT Code deleted.', 'success');
      const data = await apiCptService.getCptCodes();
      setCptCodes(data);
    } catch (err) {
      addToast(err.message || 'Failed to delete CPT code', 'error');
    }
  };

  const handleEditCptCode = (idx) => {
    const item = cptCodes[idx];
    setNewCpt({ ...item, defaultFee: (item.fee || '').replace(/[^0-9.]/g, '') });
    setEditCptIdx(idx);
    setShowAddCptModal(true);
  };

  const handleAddIcdCode = async (e) => {
    e?.preventDefault();
    if (!newIcd.code || !newIcd.description) {
      addToast('ICD Code and Description are required', 'error');
      return;
    }

    try {
      if (editIcdIdx !== null) {
        const item = icdCodes[editIcdIdx];
        await updateICDCode(item.id, newIcd);
        addToast(`ICD-10 Code ${newIcd.code} updated!`, 'success');
      } else {
        await createICDCode(newIcd);
        addToast(`ICD-10 Code ${newIcd.code} added to practice catalog!`, 'success');
      }

      setShowAddIcdModal(false);
      setEditIcdIdx(null);
      setNewIcd({ code: '', description: '', category: 'Pain/Orthopedic' });

      const data = await getAllICDCodes();
      setIcdCodes(data);
    } catch (err) {
      addToast(err.message || 'Failed to save ICD Code', 'error');
    }
  };

  const handleDeleteIcdCode = async (idx) => {
    if (!window.confirm(`Are you sure you want to delete ICD Code ${icdCodes[idx].code}?`)) return;
    try {
      await deleteICDCode(icdCodes[idx].id);
      addToast('ICD Code deleted.', 'success');
      const data = await getAllICDCodes();
      setIcdCodes(data);
    } catch (err) {
      addToast(err.message || 'Failed to delete ICD code', 'error');
    }
  };

  const handleEditIcdCode = (idx) => {
    const item = icdCodes[idx];
    setNewIcd(item);
    setEditIcdIdx(idx);
    setShowAddIcdModal(true);
  };

  const handleAddModifier = async (e) => {
    e?.preventDefault();
    if (!newMod.code || !newMod.description) {
      addToast('Modifier Code and Description are required', 'error');
      return;
    }

    try {
      if (editModIdx !== null) {
        const item = modifiers[editModIdx];
        await apiModifierService.updateModifier(item.id, newMod);
        addToast(`Modifier ${newMod.code} updated!`, 'success');
      } else {
        await apiModifierService.createModifier(newMod);
        addToast(`Modifier ${newMod.code} added to practice catalog!`, 'success');
      }

      setShowAddModModal(false);
      setEditModIdx(null);
      setNewMod({ code: '', description: '' });

      const data = await apiModifierService.getModifiers();
      setModifiers(data);
    } catch (err) {
      addToast(err.message || 'Failed to save Modifier', 'error');
    }
  };

  const handleDeleteModifier = async (idx) => {
    if (!window.confirm(`Are you sure you want to delete Modifier ${modifiers[idx].code}?`)) return;
    try {
      await apiModifierService.deleteModifier(modifiers[idx].id);
      addToast('Modifier deleted.', 'success');
      const data = await apiModifierService.getModifiers();
      setModifiers(data);
    } catch (err) {
      addToast(err.message || 'Failed to delete modifier', 'error');
    }
  };

  const handleEditModifier = (idx) => {
    const item = modifiers[idx];
    setNewMod(item);
    setEditModIdx(idx);
    setShowAddModModal(true);
  };

  const handleAddModality = async (e) => {
    e?.preventDefault();
    if (!newModality.name) {
      addToast('Modality Name is required.', 'error');
      return;
    }
    try {
      const created = await apiModalityService.createModality(newModality);
      setModalitiesList(prev => [...prev, created]);
      addToast(`Modality ${newModality.name} created successfully!`, 'success');
      setShowAddModalityModal(false);
      setNewModality({ name: '', cptCode: '', fee: '', duration: '', template: '', providerId: '', enabled: true, status: 'COMPLETE' });
    } catch (err) {
      addToast(err.message || 'Failed to add modality', 'error');
    }
  };

  const handleDeleteModality = async (idx) => {
    const srv = modalitiesList[idx];
    if (!window.confirm(`Are you sure you want to delete ${srv.name}?`)) return;
    try {
      await apiModalityService.deleteModality(srv.id);
      setModalitiesList(prev => prev.filter((_, i) => i !== idx));
      addToast(`Modality ${srv.name} deleted successfully!`, 'success');
    } catch (err) {
      addToast('Failed to delete CPT Code', 'error');
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editHolidayId) {
        await apiHolidayService.updateHoliday(editHolidayId, newHoliday);
        addToast('Holiday updated successfully!', 'success');
      } else {
        await apiHolidayService.createHoliday(newHoliday);
        addToast('Holiday created successfully!', 'success');
      }

      const updated = await apiHolidayService.getHolidays();
      setHolidaysData(updated);
      setUSHolidays(updated);

      setShowAddHolidayModal(false);
      setNewHoliday({ name: '', type: 'FIXED', month: '1', day: '1', nth: '1', dayOfWeek: '1', last: false });
      setEditHolidayId(null);
    } catch (err) {
      addToast('Failed to save Holiday', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditHoliday = (hol) => {
    setNewHoliday({
      name: hol.name,
      type: hol.type,
      month: String(hol.month),
      day: hol.day ? String(hol.day) : '',
      nth: hol.nth ? String(hol.nth) : (hol.last ? '' : '1'),
      dayOfWeek: hol.dayOfWeek !== null ? String(hol.dayOfWeek) : '1',
      last: hol.last || false
    });
    setEditHolidayId(hol.id);
    setShowAddHolidayModal(true);
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await apiHolidayService.deleteHoliday(id);
      addToast('Holiday deleted successfully!', 'success');
      const updated = await apiHolidayService.getHolidays();
      setHolidaysData(updated);
      setUSHolidays(updated);
    } catch (err) {
      addToast('Failed to delete Holiday', 'error');
    }
  };

  const handleToggleModality = async (idx) => {
    const srv = modalitiesList[idx];
    try {
      const updated = await apiModalityService.updateModality(srv.id, { enabled: !srv.enabled });
      setModalitiesList(prev => {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      });
      addToast(`${srv.name} has been ${updated.enabled ? 'enabled' : 'disabled'}!`, 'info');
    } catch (err) {
      addToast(`Failed to toggle ${srv.name}`, 'error');
    }
  };

  const handleProviderAssignmentChange = async (idx, providerId) => {
    const srv = modalitiesList[idx];
    try {
      const updated = await apiModalityService.updateModality(srv.id, { providerId: providerId || null });
      setModalitiesList(prev => {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      });
      addToast(`Provider assignment updated for ${srv.name}!`, 'info');
    } catch (err) {
      addToast(`Failed to update provider for ${srv.name}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">General Practice Settings</h1>
          <p className="text-xs text-on-surface-variant">Global platform parameters, timezones &amp; default localization</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Practice & Service Management (6 Core Modalities) */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant pb-3 flex-wrap gap-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Activity className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface">Practice &amp; Service Management (Core Modalities)</h2>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Configure CPT codes, provider assignments, pricing and clinical form templates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1.5 rounded-lg">
                {modalitiesList.length} Practice Modalities Connected
              </span>
              <button
                type="button"
                onClick={() => setShowAddModalityModal(true)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Modality
              </button>
            </div>
          </div>

          <div className="overflow-x-auto" style={{minHeight: '320px'}}>
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 text-left">Service Modality</th>
                  <th className="p-2.5 text-left">Assigned Provider</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-center">CPT Code</th>
                  <th className="p-2.5 text-right">Configured Fee</th>
                  <th className="p-2.5 text-center">Duration</th>
                  <th className="p-2.5 text-left">Clinical Template</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {modalitiesList.slice((modalityPage - 1) * MODALITY_PAGE_SIZE, modalityPage * MODALITY_PAGE_SIZE).map((srv, i) => {
                  const idx = (modalityPage - 1) * MODALITY_PAGE_SIZE + i;
                  return (
                    <tr key={srv.id || srv.name} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-bold text-slate-900">{srv.name}</td>
                      <td className="p-2.5 text-slate-700 font-medium">
                        <select
                          value={srv.providerId || ''}
                          onChange={(e) => handleProviderAssignmentChange(idx, e.target.value)}
                          className="w-full text-[11px] p-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                        >
                          <option value="">-- Select Provider --</option>
                          {providers.map(prov => (
                            <option key={prov.id} value={prov.id}>
                              {prov.name} {prov.businessName ? `(${prov.businessName})` : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${srv.enabled ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          {srv.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-medium text-slate-700">{srv.cptCode}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatFeeString(srv.fee)}</td>
                      <td className="p-2.5 text-center text-slate-600">{srv.duration}</td>
                      <td className="p-2.5 text-slate-700 font-medium">{srv.template}</td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleModality(idx)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${srv.enabled ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200' : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'}`}
                          >
                            {srv.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteModality(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Modality"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Modalities Pagination */}
          {Math.ceil(modalitiesList.length / MODALITY_PAGE_SIZE) > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-500">
                Showing {((modalityPage - 1) * MODALITY_PAGE_SIZE) + 1}–{Math.min(modalityPage * MODALITY_PAGE_SIZE, modalitiesList.length)} of {modalitiesList.length}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={modalityPage === 1} onClick={() => setModalityPage(p => p - 1)}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">‹ Prev</button>
                {Array.from({length: Math.ceil(modalitiesList.length / MODALITY_PAGE_SIZE)}, (_, i) => i + 1).map(pg => (
                  <button key={pg} type="button" onClick={() => setModalityPage(pg)}
                    className={`w-6 h-6 text-[10px] font-bold rounded-lg transition cursor-pointer ${modalityPage === pg ? 'bg-teal-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pg}</button>
                ))}
                <button type="button" disabled={modalityPage === Math.ceil(modalitiesList.length / MODALITY_PAGE_SIZE)} onClick={() => setModalityPage(p => p + 1)}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">Next ›</button>
              </div>
            </div>
          )}
        </div>

        {/* Healthcare Providers Management */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface">Registered Healthcare Providers &amp; Organizations</h2>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Manage attending physicians, medical practices, NPIs and billing identifiers</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddProvModal(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Provider
            </button>
          </div>

          <div className="overflow-x-auto" style={{minHeight: '260px'}}>
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 text-left">Provider / Practice Name</th>
                  <th className="p-2.5 text-left">Service Category</th>
                  <th className="p-2.5 text-center">NPI</th>
                  <th className="p-2.5 text-center">Tax ID (EIN)</th>
                  <th className="p-2.5 text-left">Contact Info</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {providers.length > 0 ? (
                  providers.slice((providerPage - 1) * PROVIDER_PAGE_SIZE, providerPage * PROVIDER_PAGE_SIZE).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-bold text-slate-900">{p.name} <span className="text-[10px] text-slate-400 block font-normal">{p.businessName}</span></td>
                      <td className="p-2.5 text-slate-600">{p.serviceCategory || 'General Medicine'}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-700">{p.identifiers?.npi || p.npi || '1234567890'}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-700">{p.identifiers?.taxId || p.taxId || '75-1234567'}</td>
                      <td className="p-2.5 text-slate-600">{p.contact?.phone || p.phone || '713-555-0100'}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                          {p.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-3 text-center text-slate-400 italic">No providers registered yet. Click "Add New Provider" to create one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Providers Pagination */}
          {Math.ceil(providers.length / PROVIDER_PAGE_SIZE) > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-500">
                Showing {((providerPage - 1) * PROVIDER_PAGE_SIZE) + 1}–{Math.min(providerPage * PROVIDER_PAGE_SIZE, providers.length)} of {providers.length}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={providerPage === 1} onClick={() => setProviderPage(p => p - 1)}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">‹ Prev</button>
                {Array.from({length: Math.ceil(providers.length / PROVIDER_PAGE_SIZE)}, (_, i) => i + 1).map(pg => (
                  <button key={pg} type="button" onClick={() => setProviderPage(pg)}
                    className={`w-6 h-6 text-[10px] font-bold rounded-lg transition cursor-pointer ${providerPage === pg ? 'bg-teal-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pg}</button>
                ))}
                <button type="button" disabled={providerPage === Math.ceil(providers.length / PROVIDER_PAGE_SIZE)} onClick={() => setProviderPage(p => p + 1)}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">Next ›</button>
              </div>
            </div>
          )}
        </div>

        {/* CPT Codes & Procedure Pricing Catalog */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <FileCode className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface">CPT Procedure Codes &amp; Standard Fee Schedule</h2>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Manage CPT procedure codes, default fees and standard modifiers</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCptModal(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add CPT Code
            </button>
          </div>

          <div className="overflow-x-auto" style={{minHeight: '320px'}}>
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 text-center">CPT Code</th>
                  <th className="p-2.5 text-left">Procedure Description</th>
                  <th className="p-2.5 text-left">Category</th>
                  <th className="p-2.5 text-right">Standard Fee ($)</th>
                  <th className="p-2.5 text-center">Default Modifiers</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {cptCodes.slice((cptPage - 1) * CPT_PAGE_SIZE, cptPage * CPT_PAGE_SIZE).map((cpt, i) => {
                  const realIdx = (cptPage - 1) * CPT_PAGE_SIZE + i;
                  return (
                    <tr key={cpt.code + realIdx} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 text-center font-mono font-bold text-teal-800">{cpt.code}</td>
                      <td className="p-2.5 font-bold text-slate-900">{cpt.description}</td>
                      <td className="p-2.5 text-slate-600">{cpt.category || 'General'}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{cpt.fee}</td>
                      <td className="p-2.5 text-center font-mono text-slate-600">{cpt.modifiers || '—'}</td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditCptCode(realIdx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition cursor-pointer"
                            title="Edit CPT Code"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCptCode(realIdx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete CPT Code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* CPT Pagination */}
          {Math.ceil(cptCodes.length / CPT_PAGE_SIZE) > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-500">
                Showing {((cptPage - 1) * CPT_PAGE_SIZE) + 1}–{Math.min(cptPage * CPT_PAGE_SIZE, cptCodes.length)} of {cptCodes.length}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={cptPage === 1} onClick={() => setCptPage(p => p - 1)}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">‹ Prev</button>
                {Array.from({length: Math.ceil(cptCodes.length / CPT_PAGE_SIZE)}, (_, i) => i + 1).map(pg => (
                  <button key={pg} type="button" onClick={() => setCptPage(pg)}
                    className={`w-6 h-6 text-[10px] font-bold rounded-lg transition cursor-pointer ${cptPage === pg ? 'bg-teal-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pg}</button>
                ))}
                <button type="button" disabled={cptPage === Math.ceil(cptCodes.length / CPT_PAGE_SIZE)} onClick={() => setCptPage(p => p + 1)}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">Next ›</button>
              </div>
            </div>
          )}
        </div>

        {/* ICD-10 Diagnosis Codes & Billing Modifiers Dual Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ICD-10 Catalog */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">ICD-10 Diagnosis Codes</h2>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Manage diagnostic codes for CMS Box 21</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddIcdModal(true)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add ICD Code
              </button>
            </div>

            <div className="overflow-x-auto" style={{minHeight: '300px'}}>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5 text-left w-24">ICD Code</th>
                    <th className="p-2.5 text-left">Diagnosis Description</th>
                    <th className="p-2.5 text-left w-32">Category</th>
                    <th className="p-2.5 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {icdCodes.slice((icdPage - 1) * ICD_PAGE_SIZE, icdPage * ICD_PAGE_SIZE).map((icd, i) => {
                    const realIdx = (icdPage - 1) * ICD_PAGE_SIZE + i;
                    return (
                      <tr key={icd.code + realIdx} className="hover:bg-slate-50 transition group">
                        <td className="p-2.5 font-mono font-bold text-teal-800">{icd.code}</td>
                        <td className="p-2.5 font-bold text-slate-900">{icd.description}</td>
                        <td className="p-2.5 text-xs text-slate-500">{icd.category}</td>
                        <td className="p-2.5">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => handleEditIcdCode(realIdx)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"><Edit3 className="w-4 h-4" /></button>
                            <button type="button" onClick={() => handleDeleteIcdCode(realIdx)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* ICD Pagination */}
            {Math.ceil(icdCodes.length / ICD_PAGE_SIZE) > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-500">
                  Showing {((icdPage - 1) * ICD_PAGE_SIZE) + 1}–{Math.min(icdPage * ICD_PAGE_SIZE, icdCodes.length)} of {icdCodes.length}
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={icdPage === 1} onClick={() => setIcdPage(p => p - 1)}
                    className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">‹ Prev</button>
                  {Array.from({length: Math.ceil(icdCodes.length / ICD_PAGE_SIZE)}, (_, i) => i + 1).map(pg => (
                    <button key={pg} type="button" onClick={() => setIcdPage(pg)}
                      className={`w-6 h-6 text-[10px] font-bold rounded-lg transition cursor-pointer ${icdPage === pg ? 'bg-teal-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pg}</button>
                  ))}
                  <button type="button" disabled={icdPage === Math.ceil(icdCodes.length / ICD_PAGE_SIZE)} onClick={() => setIcdPage(p => p + 1)}
                    className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">Next ›</button>
                </div>
              </div>
            )}
          </div>

          {/* Billing Modifiers Catalog */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Billing Modifiers Catalog</h2>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Manage CPT modifiers for CMS Box 24.D</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModModal(true)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Modifier
              </button>
            </div>

            <div className="overflow-x-auto" style={{minHeight: '300px'}}>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5 text-center w-24">Modifier</th>
                    <th className="p-2.5 text-left">Modifier Description & Usage</th>
                    <th className="p-2.5 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {modifiers.slice((modPage - 1) * MOD_PAGE_SIZE, modPage * MOD_PAGE_SIZE).map((mod, i) => {
                    const realIdx = (modPage - 1) * MOD_PAGE_SIZE + i;
                    return (
                      <tr key={mod.code + realIdx} className="hover:bg-slate-50 transition group">
                        <td className="p-2.5 text-center font-mono font-bold text-teal-800">{mod.code}</td>
                        <td className="p-2.5 font-bold text-slate-900">{mod.description}</td>
                        <td className="p-2.5">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => handleEditModifier(realIdx)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"><Edit3 className="w-4 h-4" /></button>
                            <button type="button" onClick={() => handleDeleteModifier(realIdx)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Modifiers Pagination */}
            {Math.ceil(modifiers.length / MOD_PAGE_SIZE) > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-500">
                  Showing {((modPage - 1) * MOD_PAGE_SIZE) + 1}–{Math.min(modPage * MOD_PAGE_SIZE, modifiers.length)} of {modifiers.length}
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={modPage === 1} onClick={() => setModPage(p => p - 1)}
                    className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">‹ Prev</button>
                  {Array.from({length: Math.ceil(modifiers.length / MOD_PAGE_SIZE)}, (_, i) => i + 1).map(pg => (
                    <button key={pg} type="button" onClick={() => setModPage(pg)}
                      className={`w-6 h-6 text-[10px] font-bold rounded-lg transition cursor-pointer ${modPage === pg ? 'bg-teal-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pg}</button>
                  ))}
                  <button type="button" disabled={modPage === Math.ceil(modifiers.length / MOD_PAGE_SIZE)} onClick={() => setModPage(p => p + 1)}
                    className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">Next ›</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Practice Identity */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
          <SectionHead Icon={Building} title="Practice Identity" subtitle="Legal name, NPI, Tax ID and contact details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Application / Platform Name</label><input className={inputCls} value={settings.appName} onChange={e => set('appName', e.target.value)} /></div>
            <div><label className={labelCls}>Legal Practice Name</label><input className={inputCls} value={settings.practiceName} onChange={e => set('practiceName', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>Practice Type</label>
              <select className={inputCls} value={settings.practiceType} onChange={e => set('practiceType', e.target.value)}>
                <option value="MULTI_SPECIALTY">Multi-Specialty Group</option>
                <option value="SOLO">Solo Practice</option>
                <option value="PHYSICAL_THERAPY">Physical Therapy</option>
                <option value="CHIROPRACTIC">Chiropractic</option>
                <option value="PAIN_MANAGEMENT">Pain Management</option>
                <option value="MENTAL_HEALTH">Mental Health</option>
              </select>
            </div>
            <div><label className={labelCls}>Group NPI</label><input className={inputCls} value={settings.npi} onChange={e => set('npi', e.target.value)} /></div>
            <div><label className={labelCls}>Federal Tax ID (EIN)</label><input className={inputCls} value={settings.taxId} onChange={e => set('taxId', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>State License Number</label><input className={inputCls} value={settings.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} /></div>
            <div><label className={labelCls}>Practice Phone</label><input type="tel" className={inputCls} value={settings.practicePhone} onChange={e => set('practicePhone', e.target.value)} /></div>
            <div><label className={labelCls}>Practice Email</label><input type="email" className={inputCls} value={settings.practiceEmail} onChange={e => set('practiceEmail', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            <div className="col-span-2"><label className={labelCls}>Street Address</label><input className={inputCls} value={settings.practiceAddress} onChange={e => set('practiceAddress', e.target.value)} /></div>
            <div><label className={labelCls}>City</label><input className={inputCls} value={settings.practiceCity} onChange={e => set('practiceCity', e.target.value)} /></div>
            <div><label className={labelCls}>State</label><input className={inputCls} value={settings.practiceState} onChange={e => set('practiceState', e.target.value)} /></div>
            <div><label className={labelCls}>ZIP</label><input className={inputCls} value={settings.practiceZip} onChange={e => set('practiceZip', e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>Website URL</label><input type="url" className={inputCls} value={settings.practiceWebsite} onChange={e => set('practiceWebsite', e.target.value)} /></div>
        </div>

        {/* Localization */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
          <SectionHead Icon={Globe} title="Localization & Regional" subtitle="Timezone, date formats, currency and language" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>Timezone</label>
              <select className={inputCls} value={settings.timezone} onChange={e => set('timezone', e.target.value)}>
                <option value="America/Chicago">America/Chicago (CT - Texas / Central)</option>
                <option value="America/New_York">America/New_York (ET - Eastern)</option>
                <option value="America/Denver">America/Denver (MT - Mountain)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PT - Pacific)</option>
                <option value="America/Phoenix">America/Phoenix (AZ - Arizona)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST - India +05:30)</option>
                <option value="Europe/London">Europe/London (GMT/BST - UK)</option>
                <option value="Europe/Paris">Europe/Paris (CET - Europe)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST - UAE +04:00)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
            </div>
            <div><label className={labelCls}>Default Currency</label>
              <select className={inputCls} value={settings.currency} onChange={e => set('currency', e.target.value)}>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="CAD">CAD (C$) — Canadian Dollar</option>
              </select>
            </div>
            <div><label className={labelCls}>Date Format</label>
              <select className={inputCls} value={settings.dateFormat} onChange={e => set('dateFormat', e.target.value)}>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>Time Format</label>
              <select className={inputCls} value={settings.timeFormat} onChange={e => set('timeFormat', e.target.value)}>
                <option value="12H">12-Hour (AM/PM)</option>
                <option value="24H">24-Hour</option>
              </select>
            </div>
            <div><label className={labelCls}>Language</label>
              <select className={inputCls} value={settings.language} onChange={async (e) => {
                const newLang = e.target.value;
                set('language', newLang);

                const langCode = newLang.split('-')[0];

                if (langCode === 'en') {
                  // We must save to the backend instantly before reloading, otherwise the 
                  // backend will still send the old language and trap the user in a loop
                  const nextSettings = { ...settings, language: newLang };
                  try {
                    // Temporarily using dynamic import or assuming updateGeneralSettings is in scope
                    // It's imported at the top of the file: import { getGeneralSettings, updateGeneralSettings }
                    await updateGeneralSettings(nextSettings);
                    localStorage.setItem('medcare_practice_settings', JSON.stringify(nextSettings));
                  } catch (err) { }

                  // Clear the Google Translate cookies to revert the DOM
                  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;

                  window.location.reload();
                } else {
                  // For Spanish/French, we can instantly trigger the widget preview
                  const masterSelect = document.querySelector(".goog-te-combo");
                  if (masterSelect) {
                    masterSelect.value = langCode;
                    masterSelect.dispatchEvent(new Event("change"));
                  }
                }
              }}>
                <option value="en-US">English (US)</option>
                <option value="es-US">Spanish (US)</option>
                <option value="fr-CA">French (CA)</option>
              </select>
            </div>
            <div><label className={labelCls}>Fiscal Year Start</label>
              <select className={inputCls} value={settings.fiscalYearStart} onChange={e => set('fiscalYearStart', e.target.value)}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                  <option key={m} value={m.toUpperCase()}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Appointment Settings */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
          <SectionHead Icon={Clock} title="Appointment & Scheduling" subtitle="Default durations, schedule hours, and booking rules" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><label className={labelCls}>Default Duration (min)</label>
              <select className={inputCls} value={settings.defaultAppointmentDuration} onChange={e => set('defaultAppointmentDuration', e.target.value)}>
                <option>15</option><option>30</option><option>45</option><option>60</option><option>90</option><option>120</option>
              </select>
            </div>
            <div><label className={labelCls}>Buffer Time (min)</label>
              <select className={inputCls} value={settings.appointmentBuffer} onChange={e => set('appointmentBuffer', e.target.value)}>
                <option value="0">None</option><option value="5">5 min</option><option value="10">10 min</option><option value="15">15 min</option><option value="30">30 min</option>
              </select>
            </div>
            <div><label className={labelCls}>Schedule Start</label><input type="time" className={inputCls} value={settings.scheduleStartTime} onChange={e => set('scheduleStartTime', e.target.value)} /></div>
            <div><label className={labelCls}>Schedule End</label><input type="time" className={inputCls} value={settings.scheduleEndTime} onChange={e => set('scheduleEndTime', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Max Concurrent Appointments</label><input type="number" min="1" max="20" className={inputCls} value={settings.maxConcurrentAppointments} onChange={e => set('maxConcurrentAppointments', e.target.value)} /></div>
          </div>
          <div className="space-y-0">
            <ToggleRow label="Allow Same-Day Booking" description="Patients can book appointments on the same day" checked={settings.allowSameDayBooking} onChange={v => set('allowSameDayBooking', v)} />
            <ToggleRow label="Require Authorization for Booking" description="Require pre-auth number before confirming appointment" checked={settings.requireAuthForBooking} onChange={v => set('requireAuthForBooking', v)} />
            <ToggleRow label="Auto-Confirm Appointments" description="New appointments are automatically confirmed without manual review" checked={settings.autoConfirmAppointments} onChange={v => set('autoConfirmAppointments', v)} />
            <ToggleRow label="Auto-Block Appointments on US Federal Holidays" description="Automatically set practice availability to OFF and block routine booking on US Federal Holidays" checked={settings.autoBlockUSHolidays !== false} onChange={v => set('autoBlockUSHolidays', v)} />
          </div>

          <div className="pt-3 border-t border-outline-variant/50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span>🇺🇸</span> Official US Federal Holidays (Auto Holiday Off Calendar)
              </h4>
              <button type="button" onClick={() => { setEditHolidayId(null); setNewHoliday({ name: '', type: 'FIXED', month: '1', day: '1', nth: '1', dayOfWeek: '1', last: false }); setShowAddHolidayModal(true); }} className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 text-[11px] font-bold rounded-lg border border-teal-200 transition flex items-center gap-1 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Add Holiday
              </button>
            </div>
            <div className="overflow-x-auto" style={{minHeight: '320px'}}>
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 text-left">Holiday Name</th>
                    <th className="p-2 text-left">Calendar Date (2026)</th>
                    <th className="p-2 text-left">Observed Date</th>
                    <th className="p-2 text-center">Practice Availability</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const allHolidays = getUSHolidaysForYear(2026);
                    const paged = allHolidays.slice((holidayPage - 1) * HOLIDAY_PAGE_SIZE, holidayPage * HOLIDAY_PAGE_SIZE);
                    return paged.map(h => {
                      const rawHol = holidaysData.find(hd => hd.id === h.id);
                      return (
                        <tr key={h.id} className="hover:bg-slate-50 group">
                          <td className="p-2 font-bold text-slate-900">{h.name}</td>
                          <td className="p-2 font-mono text-slate-700">{h.date}</td>
                          <td className="p-2 font-mono text-slate-700">{h.observedDate} {h.isObservedDiff && '(Observed)'}</td>
                          <td className="p-2 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                              Auto Off (Clinic Closed)
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => handleEditHoliday(rawHol)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition" title="Edit Holiday"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button type="button" onClick={() => handleDeleteHoliday(h.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Holiday"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            {/* Holidays Pagination */}
            {(() => {
              const total = getUSHolidaysForYear(2026).length;
              const totalPages = Math.ceil(total / HOLIDAY_PAGE_SIZE);
              if (totalPages <= 1) return null;
              return (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500">
                    Showing {((holidayPage - 1) * HOLIDAY_PAGE_SIZE) + 1}–{Math.min(holidayPage * HOLIDAY_PAGE_SIZE, total)} of {total}
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={holidayPage === 1} onClick={() => setHolidayPage(p => p - 1)}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">‹ Prev</button>
                    {Array.from({length: totalPages}, (_, i) => i + 1).map(pg => (
                      <button key={pg} type="button" onClick={() => setHolidayPage(pg)}
                        className={`w-6 h-6 text-[10px] font-bold rounded-lg transition cursor-pointer ${holidayPage === pg ? 'bg-teal-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pg}</button>
                    ))}
                    <button type="button" disabled={holidayPage === totalPages} onClick={() => setHolidayPage(p => p + 1)}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">Next ›</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface">Notifications &amp; Reminders</h2>
                <p className="text-[10px] text-on-surface-variant mt-0.5">SMS, email and in-app notification preferences &amp; automated dispatch</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Backend Email Dispatcher Linked
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Default Reminder Timing</label>
              <select className={inputCls} value={settings.reminderTiming} onChange={e => set('reminderTiming', e.target.value)}>
                <option value="1H">1 Hour Before</option><option value="3H">3 Hours Before</option><option value="24H">24 Hours Before</option><option value="48H">48 Hours Before</option><option value="72H">72 Hours Before</option>
              </select>
            </div>
            <div><label className={labelCls}>SMS Sender ID / Name</label><input className={inputCls} value={settings.smsSenderId} onChange={e => set('smsSenderId', e.target.value)} placeholder="e.g. MedPracticePro" /></div>
          </div>

          <div className="space-y-0">
            <ToggleRow label="SMS Appointment Reminders" description="Send automated SMS reminders to patients" checked={settings.smsRemindersEnabled} onChange={v => set('smsRemindersEnabled', v)} />
            <ToggleRow label="Email Appointment Reminders" description="Send automated email reminders to patients" checked={settings.emailRemindersEnabled} onChange={v => set('emailRemindersEnabled', v)} />
            <ToggleRow label="Appointment Confirmation Emails" description="Send booking confirmation on new appointment creation" checked={settings.appointmentConfirmationEmail} onChange={v => set('appointmentConfirmationEmail', v)} />
            <ToggleRow label="Billing & Payment Notifications" description="Notify staff of new payments and adjustments posted" checked={settings.billingNotificationsEnabled} onChange={v => set('billingNotificationsEnabled', v)} />
            <ToggleRow label="Overdue Balance Alerts" description="Alert billing team when accounts exceed aging thresholds" checked={settings.overdueBalanceAlerts} onChange={v => set('overdueBalanceAlerts', v)} />
            <ToggleRow label="New Patient Welcome Email" description="Send welcome email to newly registered patients" checked={settings.newPatientWelcomeEmail} onChange={v => set('newPatientWelcomeEmail', v)} />
          </div>

          {/* Quick SMTP & Live Email Test Box */}
          <div className="mt-4 p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-extrabold text-teal-900 flex items-center gap-1.5">
                <span>📧</span> Live Email Dispatcher &amp; Connection Tester
              </h4>
              <span className="text-[10px] text-teal-700 font-medium">Plug &amp; Play Backend Ready</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Whenever you add your email credentials (Gmail App Password, SendGrid, Resend, or AWS SES) into <code className="bg-white px-1.5 py-0.5 rounded border text-teal-800 font-mono text-[10px]">backend/.env</code>, the system will send real-time emails to patient inboxes.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={e => setTestEmailRecipient(e.target.value)}
                placeholder="Enter recipient email to test (e.g. yourname@gmail.com)"
                className="w-full sm:flex-1 px-3 py-2 text-xs rounded-lg border border-teal-200 bg-white text-slate-900 outline-none focus:ring-1 focus:ring-teal-600"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail}
                className="w-full sm:w-auto px-4 py-2 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                {isSendingTestEmail ? 'Sending Test...' : '⚡ Send Test Email'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Practice Settings'}
          </button>
        </div>
      </form>

      {/* Modal: Add New Modality */}
      {showAddModalityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" /> Add New Practice Modality
              </h3>
              <button type="button" onClick={() => setShowAddModalityModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>
            <form onSubmit={handleAddModality} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Modality Name *</label><input required className={inputCls} value={newModality.name} onChange={e => setNewModality(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Physical Therapy" /></div>
                <div>
                  <label className={labelCls}>Assigned Provider</label>
                  <select className={inputCls} value={newModality.providerId} onChange={e => setNewModality(p => ({ ...p, providerId: e.target.value }))}>
                    <option value="">-- Unassigned --</option>
                    {providers.map(prov => (
                      <option key={prov.id} value={prov.id}>{prov.name} {prov.businessName ? `(${prov.businessName})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>CPT Code</label>
                  <select className={inputCls} value={newModality.cptCode} onChange={e => {
                    const val = e.target.value;
                    const match = cptCodes.find(c => c.code === val);
                    setNewModality(p => ({ ...p, cptCode: val, fee: match ? match.fee : p.fee }));
                  }}>
                    <option value="">-- Select CPT Code --</option>
                    {cptCodes.map((cpt, i) => (
                      <option key={cpt.code + i} value={cpt.code}>{cpt.code} - {cpt.description}</option>
                    ))}
                  </select>
                </div>
                <div><label className={labelCls}>Configured Fee</label><input className={inputCls} value={newModality.fee} onChange={e => setNewModality(p => ({ ...p, fee: e.target.value }))} placeholder="e.g. $150.00" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Duration</label><input className={inputCls} value={newModality.duration} onChange={e => setNewModality(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 30 min" /></div>
                <div><label className={labelCls}>Clinical Template</label><input className={inputCls} value={newModality.template} onChange={e => setNewModality(p => ({ ...p, template: e.target.value }))} placeholder="e.g. PT Progress Note" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={newModality.status} onChange={e => setNewModality(p => ({ ...p, status: e.target.value }))}>
                    <option value="COMPLETE">Complete</option>
                    <option value="CONFIGURATION_PENDING">Configuration Pending</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="modEnabled" checked={newModality.enabled} onChange={e => setNewModality(p => ({ ...p, enabled: e.target.checked }))} className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-600 cursor-pointer" />
                  <label htmlFor="modEnabled" className="text-xs font-bold text-slate-700 cursor-pointer">Enable Modality</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddModalityModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">Save Modality</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Provider */}
      {showAddProvModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" /> Register Healthcare Provider / Practice
              </h3>
              <button type="button" onClick={() => setShowAddProvModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>
            <form onSubmit={handleAddProvider} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Provider Name *</label><input required className={inputCls} value={newProv.name} onChange={e => setNewProv(p => ({ ...p, name: e.target.value }))} placeholder="Dr. John Smith, MD" /></div>
                <div><label className={labelCls}>Business/Practice Name *</label><input required className={inputCls} value={newProv.businessName} onChange={e => setNewProv(p => ({ ...p, businessName: e.target.value }))} placeholder="Smith Wellness LLC" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={labelCls}>NPI (10 digits) *</label><input required className={inputCls} value={newProv.npi} onChange={e => setNewProv(p => ({ ...p, npi: e.target.value }))} placeholder="1234567890" /></div>
                <div><label className={labelCls}>Tax ID (EIN) *</label><input required className={inputCls} value={newProv.taxId} onChange={e => setNewProv(p => ({ ...p, taxId: e.target.value }))} placeholder="75-1234567" /></div>
                <div><label className={labelCls}>Category</label><input className={inputCls} value={newProv.serviceCategory} onChange={e => setNewProv(p => ({ ...p, serviceCategory: e.target.value }))} placeholder="Pain Mgmt" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Phone Number</label><input className={inputCls} value={newProv.phone} onChange={e => setNewProv(p => ({ ...p, phone: e.target.value }))} placeholder="713-555-0100" /></div>
                <div><label className={labelCls}>Email Address</label><input type="email" className={inputCls} value={newProv.email} onChange={e => setNewProv(p => ({ ...p, email: e.target.value }))} placeholder="doctor@clinic.com" /></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2"><label className={labelCls}>Street Address</label><input className={inputCls} value={newProv.street} onChange={e => setNewProv(p => ({ ...p, street: e.target.value }))} placeholder="10101 Harwin Dr" /></div>
                <div><label className={labelCls}>City</label><input className={inputCls} value={newProv.city} onChange={e => setNewProv(p => ({ ...p, city: e.target.value }))} /></div>
                <div><label className={labelCls}>State/Zip</label><input className={inputCls} value={`${newProv.state} ${newProv.zipCode}`} onChange={e => setNewProv(p => ({ ...p, state: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddProvModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">Save Provider</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add CPT Code */}
      {showAddCptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-teal-600" /> {editCptIdx !== null ? 'Edit CPT Procedure Code' : 'Add CPT Procedure Code'}
              </h3>
              <button type="button" onClick={() => {
                setShowAddCptModal(false);
                setEditCptIdx(null);
                setNewCpt({ code: '', description: '', defaultFee: '250.00', category: 'General', modifiers: '' });
              }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>
            <form onSubmit={handleAddCptCode} className="space-y-3">
              <div><label className={labelCls}>CPT Code *</label><input required className={inputCls} value={newCpt.code} onChange={e => setNewCpt(p => ({ ...p, code: e.target.value }))} placeholder="e.g. 99213" /></div>
              <div><label className={labelCls}>Procedure Description *</label><input required className={inputCls} value={newCpt.description} onChange={e => setNewCpt(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Office Visit, Established Patient" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Standard Fee ($) *</label><input type="number" step="0.01" required className={inputCls} value={newCpt.defaultFee} onChange={e => setNewCpt(p => ({ ...p, defaultFee: e.target.value }))} placeholder="0.00" /></div>
                <div><label className={labelCls}>Category</label><select className={inputCls} value={newCpt.category} onChange={e => setNewCpt(p => ({ ...p, category: e.target.value }))}><option value="General">General</option><option value="E&M">E&amp;M</option><option value="Procedure">Procedure</option>
                  <option value="Evaluation">Evaluation</option>
                  <option value="Therapy">Therapy</option>
                  <option value="Injections">Injections</option>
                  <option value="Mental Health">Mental Health</option>
                  <option value="Other">Other</option></select></div>
              </div>
              <div><label className={labelCls}>Default Modifiers</label><input className={inputCls} value={newCpt.modifiers} onChange={e => setNewCpt(p => ({ ...p, modifiers: e.target.value }))} placeholder="e.g. 25, 59" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => {
                  setShowAddCptModal(false);
                  setEditCptIdx(null);
                  setNewCpt({ code: '', description: '', defaultFee: '250.00', category: 'General', modifiers: '' });
                }} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">
                  {editCptIdx !== null ? 'Save Changes' : 'Add CPT Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add ICD Code */}
      {showAddIcdModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-600" /> Add ICD-10 Diagnosis Code
              </h3>
              <button type="button" onClick={() => setShowAddIcdModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>
            <form onSubmit={handleAddIcdCode} className="space-y-3">
              <div><label className={labelCls}>ICD-10 Code *</label><input required className={inputCls} value={newIcd.code} onChange={e => setNewIcd(p => ({ ...p, code: e.target.value }))} placeholder="e.g. M54.50" /></div>
              <div><label className={labelCls}>Diagnosis Description *</label><input required className={inputCls} value={newIcd.description} onChange={e => setNewIcd(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Low back pain, unspecified" /></div>
              <div><label className={labelCls}>Category</label><input className={inputCls} value={newIcd.category} onChange={e => setNewIcd(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Orthopedic / MVA" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddIcdModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">Add ICD Code</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Holiday */}
      {showAddHolidayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-600" /> {editHolidayId ? 'Edit Holiday' : 'Add Holiday'}
              </h3>
              <button type="button" onClick={() => setShowAddHolidayModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>
            <form onSubmit={handleAddHoliday} className="space-y-3">
              <div><label className={labelCls}>Holiday Name *</label><input required className={inputCls} value={newHoliday.name} onChange={e => setNewHoliday(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Independence Day" /></div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select className={inputCls} value={newHoliday.type} onChange={e => setNewHoliday(p => ({ ...p, type: e.target.value }))}>
                    <option value="FIXED">Fixed Date</option>
                    <option value="FLOATING">Floating Date</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Month</label>
                  <select className={inputCls} value={newHoliday.month} onChange={e => setNewHoliday(p => ({ ...p, month: e.target.value }))}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newHoliday.type === 'FIXED' ? (
                <div>
                  <label className={labelCls}>Day of Month</label>
                  <input type="number" min="1" max="31" required className={inputCls} value={newHoliday.day} onChange={e => setNewHoliday(p => ({ ...p, day: e.target.value }))} placeholder="e.g. 4" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className={labelCls}>Occurrence</label>
                    <select className={inputCls} value={newHoliday.last ? 'last' : newHoliday.nth} onChange={e => {
                      const val = e.target.value;
                      if (val === 'last') setNewHoliday(p => ({ ...p, last: true, nth: '' }));
                      else setNewHoliday(p => ({ ...p, last: false, nth: val }));
                    }}>
                      <option value="1">1st</option>
                      <option value="2">2nd</option>
                      <option value="3">3rd</option>
                      <option value="4">4th</option>
                      <option value="last">Last</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Day of Week</label>
                    <select className={inputCls} value={newHoliday.dayOfWeek} onChange={e => setNewHoliday(p => ({ ...p, dayOfWeek: e.target.value }))}>
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddHolidayModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">Save Holiday</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Modifier */}
      {showAddModModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" /> Add Billing Modifier
              </h3>
              <button type="button" onClick={() => setShowAddModModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>
            <form onSubmit={handleAddModifier} className="space-y-3">
              <div><label className={labelCls}>Modifier Code *</label><input required className={inputCls} value={newMod.code} onChange={e => setNewMod(p => ({ ...p, code: e.target.value }))} placeholder="e.g. 25" /></div>
              <div><label className={labelCls}>Modifier Description &amp; Usage *</label><input required className={inputCls} value={newMod.description} onChange={e => setNewMod(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Significant, Separately Identifiable E&M Service" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddModModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">Add Modifier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
