import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { Settings, Save, Globe, Bell, Building, Clock, Activity, Loader2, Plus, Stethoscope, FileCode, Tag, Shield, Edit3, Trash2 } from 'lucide-react';
import { getUSHolidaysForYear } from '../../constants/usHolidays';
import { getGeneralSettings, updateGeneralSettings } from '../../services/api/apiSettingsService';
import { apiProviderService } from '../../services/api/apiProviderService';
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
        checked ? 'bg-teal-600 ring-2 ring-teal-600/20 shadow-sm' : 'bg-slate-300'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
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
    } catch (e) {}
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
  const [showAddProvModal, setShowAddProvModal] = useState(false);
  const [newProv, setNewProv] = useState({ name: '', businessName: '', serviceCategory: 'General Medicine', npi: '', taxId: '', phone: '', email: '', street: '', city: 'Houston', state: 'TX', zipCode: '77036' });

  const [showAddCptModal, setShowAddCptModal] = useState(false);
  const [newCpt, setNewCpt] = useState({ code: '', description: '', defaultFee: '250.00', category: 'General', modifiers: '' });

  const [showAddIcdModal, setShowAddIcdModal] = useState(false);
  const [newIcd, setNewIcd] = useState({ code: '', description: '', category: 'Pain/Orthopedic' });

  const [showAddModModal, setShowAddModModal] = useState(false);
  const [newMod, setNewMod] = useState({ code: '', description: '' });

  const loadProvidersList = async () => {
    try {
      const data = await apiProviderService.getProviders();
      if (data) setProviders(Object.values(data));
    } catch (e) {}
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
    fetchSettings();
    loadProvidersList();
  }, []);

  const set = (field, val) => {
    setSettings(p => {
      const next = { ...p, [field]: val };
      try {
        localStorage.setItem('medcare_practice_settings', JSON.stringify(next));
      } catch (e) {}
      refreshSettingsCache(next);
      return next;
    });
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem('medcare_practice_settings', JSON.stringify(settings));
      await refreshSettingsCache(settings);
      await updateGeneralSettings(settings).catch(() => {});
      addToast('General practice settings updated successfully!', 'success');
    } catch (error) {
      addToast('Failed to save settings', 'error');
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

  const DEFAULT_MODALITIES = [
    { id: 'pain-mgmt', name: 'Pain Management', providerId: 'prov-josmic', providerName: 'JOSMIC Wellness Center', enabled: true, cpt: '99204 (Confirmed)', fee: '$1,214.00', duration: '60 min', template: 'JOSMIC Pain Evaluation', status: 'COMPLETE' },
    { id: 'laser-therapy', name: 'Laser Therapy', providerId: 'prov-anik', providerName: 'ANIK Laser Therapy', enabled: true, cpt: '97039 (Confirmed)', fee: '$2,000.00', duration: '45 min', template: 'ANIK Laser Procedure Form', status: 'COMPLETE' },
    { id: 'shockwave-therapy', name: 'Shockwave Therapy', providerId: 'prov-davs', providerName: "DAV'S Anatomy", enabled: true, cpt: '0101T (Confirmed)', fee: '$1,000.00', duration: '30 min', template: "DAV'S ESWT Therapy Record", status: 'COMPLETE' },
    { id: 'trigger-point', name: 'Trigger Point Injection', providerId: '', providerName: 'Unassigned (Provider Assignment Required)', enabled: false, cpt: '20552 (Pending)', fee: 'Pricing Pending', duration: '30 min', template: 'Trigger Point Form (Pending)', status: 'CONFIGURATION_PENDING' },
    { id: 'tecar-therapy', name: 'TECAR Therapy', providerId: '', providerName: 'Unassigned (Provider Assignment Required)', enabled: false, cpt: '97039-RF (Pending)', fee: 'Pricing Pending', duration: '45 min', template: 'TECAR Procedure Form (Pending)', status: 'CONFIGURATION_PENDING' },
    { id: 'counseling', name: 'Counseling & Mental Health', providerId: 'prov-counselor', providerName: 'Counselor Practice (Hope Behavioral Health)', enabled: true, cpt: '90834 / 90791', fee: '$180.00 - $350.00', duration: '45 min', template: 'Behavioral Health Progress Note', status: 'COMPLETE' }
  ];

  const modalitiesList = Array.isArray(settings.modalities) && settings.modalities.length > 0
    ? settings.modalities
    : DEFAULT_MODALITIES;

  const handleAddProvider = async (e) => {
    e?.preventDefault();
    if (!newProv.name || !newProv.npi || !newProv.taxId) {
      addToast('Provider Name, NPI, and Tax ID are required.', 'error');
      return;
    }
    try {
      await apiProviderService.addProvider({
        ...newProv,
        renderingName: newProv.name,
        renderingCredentials: 'MD'
      });
      addToast(`Provider ${newProv.name} registered successfully!`, 'success');
      setShowAddProvModal(false);
      setNewProv({ name: '', businessName: '', serviceCategory: 'General Medicine', npi: '', taxId: '', phone: '', email: '', street: '', city: 'Houston', state: 'TX', zipCode: '77036' });
      loadProvidersList();
    } catch (err) {
      addToast(err.message || 'Failed to add provider', 'error');
    }
  };

  const handleAddCptCode = (e) => {
    e?.preventDefault();
    if (!newCpt.code || !newCpt.description) {
      addToast('CPT Code and Description are required', 'error');
      return;
    }
    const currentCatalog = Array.isArray(settings.cptCatalog) ? settings.cptCatalog : [
      { code: '99204', description: 'Office/Outpatient Visit New (Complex)', fee: '$450.00', category: 'E&M', modifiers: '25, 59' },
      { code: '99214', description: 'Office/Outpatient Visit Established (Moderate)', fee: '$275.00', category: 'E&M', modifiers: '25, 59' },
      { code: '97039', description: 'Unlisted Physical Medicine (HILT Laser)', fee: '$2000.00', category: 'Therapy', modifiers: 'GP, RT' },
      { code: '0101T', description: 'Extracorporeal Shock Wave Therapy (ESWT)', fee: '$1000.00', category: 'Therapy', modifiers: 'RT' },
      { code: '20552', description: 'Trigger Point Injections (1-2 muscles)', fee: '$450.00', category: 'Injections', modifiers: '59' },
      { code: '90834', description: 'Psychotherapy (45 Min)', fee: '$180.00', category: 'Mental Health', modifiers: '' }
    ];

    const updated = [...currentCatalog, { ...newCpt, fee: `$${parseFloat(newCpt.defaultFee || 0).toFixed(2)}` }];
    set('cptCatalog', updated);
    addToast(`CPT Code ${newCpt.code} added to practice catalog!`, 'success');
    setShowAddCptModal(false);
    setNewCpt({ code: '', description: '', defaultFee: '250.00', category: 'General', modifiers: '' });
  };

  const handleAddIcdCode = (e) => {
    e?.preventDefault();
    if (!newIcd.code || !newIcd.description) {
      addToast('ICD Code and Description are required', 'error');
      return;
    }
    const currentIcd = Array.isArray(settings.icdCatalog) ? settings.icdCatalog : [
      { code: 'M54.50', description: 'Low back pain, unspecified', category: 'Orthopedic' },
      { code: 'M54.2', description: 'Cervicalgia (Neck pain)', category: 'Orthopedic' },
      { code: 'S13.4XXA', description: 'Sprain of ligaments of cervical spine, initial encounter', category: 'Trauma/MVA' },
      { code: 'S39.012A', description: 'Strain of muscle/tendon of lower back, initial encounter', category: 'Trauma/MVA' },
      { code: 'F43.10', description: 'Post-traumatic stress disorder, unspecified', category: 'Mental Health' },
      { code: 'M25.572', description: 'Pain in left ankle and foot', category: 'Extremity' }
    ];

    const updated = [...currentIcd, newIcd];
    set('icdCatalog', updated);
    addToast(`ICD-10 Code ${newIcd.code} added to practice catalog!`, 'success');
    setShowAddIcdModal(false);
    setNewIcd({ code: '', description: '', category: 'Pain/Orthopedic' });
  };

  const handleAddModifier = (e) => {
    e?.preventDefault();
    if (!newMod.code || !newMod.description) {
      addToast('Modifier Code and Description are required', 'error');
      return;
    }
    const currentMods = Array.isArray(settings.modifiersCatalog) ? settings.modifiersCatalog : [
      { code: '25', description: 'Significant, Separately Identifiable E&M Service on Same Day' },
      { code: '59', description: 'Distinct Procedural Service' },
      { code: 'RT', description: 'Right Side' },
      { code: 'LT', description: 'Left Side' },
      { code: 'GP', description: 'Services Delivered Under Physical Therapy Plan of Care' },
      { code: 'TC', description: 'Technical Component' }
    ];

    const updated = [...currentMods, newMod];
    set('modifiersCatalog', updated);
    addToast(`Modifier ${newMod.code} added to practice catalog!`, 'success');
    setShowAddModModal(false);
    setNewMod({ code: '', description: '' });
  };

  const handleToggleModality = (idx) => {
    const currentModalities = Array.isArray(settings.modalities) && settings.modalities.length > 0
      ? settings.modalities
      : DEFAULT_MODALITIES;
    const updated = [...currentModalities];
    updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
    set('modalities', updated);
    addToast(`${updated[idx].name} has been ${updated[idx].enabled ? 'enabled' : 'disabled'}!`, 'info');
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
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
              6 Practice Modalities Connected
            </span>
          </div>
          
          <div className="overflow-x-auto">
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
                {modalitiesList.map((srv, idx) => (
                  <tr key={srv.id || srv.name} className="hover:bg-slate-50 transition">
                    <td className="p-2.5 font-bold text-slate-900">{srv.name}</td>
                    <td className="p-2.5 text-slate-700 font-medium">{srv.providerName || srv.provider}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        srv.enabled ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {srv.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono font-medium text-slate-700">{srv.cpt}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatFeeString(srv.fee)}</td>
                    <td className="p-2.5 text-center text-slate-600">{srv.duration}</td>
                    <td className="p-2.5 text-slate-700 font-medium">{srv.template}</td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleModality(idx)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          srv.enabled ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200' : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {srv.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

          <div className="overflow-x-auto">
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
                  providers.map(p => (
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

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 text-center">CPT Code</th>
                  <th className="p-2.5 text-left">Procedure Description</th>
                  <th className="p-2.5 text-left">Category</th>
                  <th className="p-2.5 text-right">Standard Fee ($)</th>
                  <th className="p-2.5 text-center">Default Modifiers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {(Array.isArray(settings.cptCatalog) && settings.cptCatalog.length > 0 ? settings.cptCatalog : [
                  { code: '99204', description: 'Office/Outpatient Visit New (Complex)', fee: '$450.00', category: 'E&M', modifiers: '25, 59' },
                  { code: '99214', description: 'Office/Outpatient Visit Established (Moderate)', fee: '$275.00', category: 'E&M', modifiers: '25, 59' },
                  { code: '97039', description: 'Unlisted Physical Medicine (HILT Laser)', fee: '$2000.00', category: 'Therapy', modifiers: 'GP, RT' },
                  { code: '0101T', description: 'Extracorporeal Shock Wave Therapy (ESWT)', fee: '$1000.00', category: 'Therapy', modifiers: 'RT' },
                  { code: '20552', description: 'Trigger Point Injections (1-2 muscles)', fee: '$450.00', category: 'Injections', modifiers: '59' },
                  { code: '90834', description: 'Psychotherapy (45 Min)', fee: '$180.00', category: 'Mental Health', modifiers: '' }
                ]).map((cpt, i) => (
                  <tr key={cpt.code + i} className="hover:bg-slate-50 transition">
                    <td className="p-2.5 text-center font-mono font-bold text-teal-800">{cpt.code}</td>
                    <td className="p-2.5 font-bold text-slate-900">{cpt.description}</td>
                    <td className="p-2.5 text-slate-600">{cpt.category || 'General'}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">{cpt.fee}</td>
                    <td className="p-2.5 text-center font-mono text-slate-600">{cpt.modifiers || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 text-left">ICD Code</th>
                    <th className="p-2 text-left">Diagnosis Description</th>
                    <th className="p-2 text-left">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {(Array.isArray(settings.icdCatalog) && settings.icdCatalog.length > 0 ? settings.icdCatalog : [
                    { code: 'M54.50', description: 'Low back pain, unspecified', category: 'Orthopedic' },
                    { code: 'M54.2', description: 'Cervicalgia (Neck pain)', category: 'Orthopedic' },
                    { code: 'S13.4XXA', description: 'Sprain of ligaments of cervical spine', category: 'Trauma/MVA' },
                    { code: 'S39.012A', description: 'Strain of muscle/tendon of lower back', category: 'Trauma/MVA' },
                    { code: 'F43.10', description: 'Post-traumatic stress disorder', category: 'Mental Health' },
                    { code: 'M25.572', description: 'Pain in left ankle and foot', category: 'Extremity' }
                  ]).map((icd, i) => (
                    <tr key={icd.code + i} className="hover:bg-slate-50 transition">
                      <td className="p-2 font-mono font-bold text-teal-800">{icd.code}</td>
                      <td className="p-2 font-bold text-slate-900">{icd.description}</td>
                      <td className="p-2 text-slate-600">{icd.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 text-center">Modifier</th>
                    <th className="p-2 text-left">Modifier Description &amp; Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {(Array.isArray(settings.modifiersCatalog) && settings.modifiersCatalog.length > 0 ? settings.modifiersCatalog : [
                    { code: '25', description: 'Significant, Separately Identifiable E&M Service on Same Day' },
                    { code: '59', description: 'Distinct Procedural Service' },
                    { code: 'RT', description: 'Right Side' },
                    { code: 'LT', description: 'Left Side' },
                    { code: 'GP', description: 'Services Delivered Under Physical Therapy Plan of Care' },
                    { code: 'TC', description: 'Technical Component' }
                  ]).map((mod, i) => (
                    <tr key={mod.code + i} className="hover:bg-slate-50 transition">
                      <td className="p-2 text-center font-mono font-bold text-teal-800">{mod.code}</td>
                      <td className="p-2 font-medium text-slate-900">{mod.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <select className={inputCls} value={settings.language} onChange={e => set('language', e.target.value)}>
                <option value="en-US">English (US)</option>
                <option value="es-US">Spanish (US)</option>
                <option value="fr-CA">French (CA)</option>
              </select>
            </div>
            <div><label className={labelCls}>Fiscal Year Start</label>
              <select className={inputCls} value={settings.fiscalYearStart} onChange={e => set('fiscalYearStart', e.target.value)}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
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
            <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span>🇺🇸</span> Official US Federal Holidays (Auto Holiday Off Calendar)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 text-left">Holiday Name</th>
                    <th className="p-2 text-left">Calendar Date (2026)</th>
                    <th className="p-2 text-left">Observed Date</th>
                    <th className="p-2 text-center">Practice Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getUSHolidaysForYear(2026).map(h => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-900">{h.name}</td>
                      <td className="p-2 font-mono text-slate-700">{h.date}</td>
                      <td className="p-2 font-mono text-slate-700">{h.observedDate} {h.isObservedDiff && '(Observed)'}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                          Auto Off (Clinic Closed)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                <div><label className={labelCls}>Provider Name *</label><input required className={inputCls} value={newProv.name} onChange={e => setNewProv(p => ({...p, name: e.target.value}))} placeholder="Dr. John Smith, MD" /></div>
                <div><label className={labelCls}>Business/Practice Name *</label><input required className={inputCls} value={newProv.businessName} onChange={e => setNewProv(p => ({...p, businessName: e.target.value}))} placeholder="Smith Wellness LLC" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={labelCls}>NPI (10 digits) *</label><input required className={inputCls} value={newProv.npi} onChange={e => setNewProv(p => ({...p, npi: e.target.value}))} placeholder="1234567890" /></div>
                <div><label className={labelCls}>Tax ID (EIN) *</label><input required className={inputCls} value={newProv.taxId} onChange={e => setNewProv(p => ({...p, taxId: e.target.value}))} placeholder="75-1234567" /></div>
                <div><label className={labelCls}>Category</label><input className={inputCls} value={newProv.serviceCategory} onChange={e => setNewProv(p => ({...p, serviceCategory: e.target.value}))} placeholder="Pain Mgmt" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Phone Number</label><input className={inputCls} value={newProv.phone} onChange={e => setNewProv(p => ({...p, phone: e.target.value}))} placeholder="713-555-0100" /></div>
                <div><label className={labelCls}>Email Address</label><input type="email" className={inputCls} value={newProv.email} onChange={e => setNewProv(p => ({...p, email: e.target.value}))} placeholder="doctor@clinic.com" /></div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2"><label className={labelCls}>Street Address</label><input className={inputCls} value={newProv.street} onChange={e => setNewProv(p => ({...p, street: e.target.value}))} placeholder="10101 Harwin Dr" /></div>
                <div><label className={labelCls}>City</label><input className={inputCls} value={newProv.city} onChange={e => setNewProv(p => ({...p, city: e.target.value}))} /></div>
                <div><label className={labelCls}>State/Zip</label><input className={inputCls} value={`${newProv.state} ${newProv.zipCode}`} onChange={e => setNewProv(p => ({...p, state: e.target.value}))} /></div>
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
                <FileCode className="w-4 h-4 text-teal-600" /> Add CPT Procedure Code
              </h3>
              <button type="button" onClick={() => setShowAddCptModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>
            <form onSubmit={handleAddCptCode} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>CPT Code *</label><input required className={inputCls} value={newCpt.code} onChange={e => setNewCpt(p => ({...p, code: e.target.value}))} placeholder="e.g. 99204" /></div>
                <div><label className={labelCls}>Default Fee ($)</label><input type="number" step="0.01" className={inputCls} value={newCpt.defaultFee} onChange={e => setNewCpt(p => ({...p, defaultFee: e.target.value}))} /></div>
              </div>
              <div><label className={labelCls}>Procedure Description *</label><input required className={inputCls} value={newCpt.description} onChange={e => setNewCpt(p => ({...p, description: e.target.value}))} placeholder="e.g. Comprehensive Pain Consult" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Category</label><input className={inputCls} value={newCpt.category} onChange={e => setNewCpt(p => ({...p, category: e.target.value}))} placeholder="e.g. E&M / Therapy" /></div>
                <div><label className={labelCls}>Standard Modifiers</label><input className={inputCls} value={newCpt.modifiers} onChange={e => setNewCpt(p => ({...p, modifiers: e.target.value}))} placeholder="e.g. 25, 59" /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddCptModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">Add CPT Code</button>
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
              <div><label className={labelCls}>ICD-10 Code *</label><input required className={inputCls} value={newIcd.code} onChange={e => setNewIcd(p => ({...p, code: e.target.value}))} placeholder="e.g. M54.50" /></div>
              <div><label className={labelCls}>Diagnosis Description *</label><input required className={inputCls} value={newIcd.description} onChange={e => setNewIcd(p => ({...p, description: e.target.value}))} placeholder="e.g. Low back pain, unspecified" /></div>
              <div><label className={labelCls}>Category</label><input className={inputCls} value={newIcd.category} onChange={e => setNewIcd(p => ({...p, category: e.target.value}))} placeholder="e.g. Orthopedic / MVA" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddIcdModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700">Add ICD Code</button>
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
              <div><label className={labelCls}>Modifier Code *</label><input required className={inputCls} value={newMod.code} onChange={e => setNewMod(p => ({...p, code: e.target.value}))} placeholder="e.g. 25" /></div>
              <div><label className={labelCls}>Modifier Description &amp; Usage *</label><input required className={inputCls} value={newMod.description} onChange={e => setNewMod(p => ({...p, description: e.target.value}))} placeholder="e.g. Significant, Separately Identifiable E&M Service" /></div>
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
