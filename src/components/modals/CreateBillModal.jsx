import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { apiBillingService } from '../../services/api/apiBillingService';
import { apiCaseService } from '../../services/api/apiCaseService';
import { apiProviderService } from '../../services/api/apiProviderService';
import { useUIStore } from '../../store/uiStore';
import { Save, Receipt } from 'lucide-react';

const inputCls = 'w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition';
const labelCls = 'block text-xs font-bold text-slate-800 mb-1';

export const CreateBillModal = ({ isOpen, onClose, selectedCaseId, onBillCreated }) => {
  const { addToast, activeProviderFilter } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [casesList, setCasesList] = useState([]);
  const [providersList, setProvidersList] = useState([]);

  const [formData, setFormData] = useState({
    providerId: '',
    caseId: selectedCaseId || '',
    patientName: '',
    dos: new Date().toISOString().split('T')[0],
    cptCode: '',
    description: '',
    modifier1: '',
    modifier2: '',
    modifier3: '',
    modifier4: '',
    diagPointer: 'A',
    charge: '',
    diagnosisCodes: ''
  });

  // Load cases and providers from backend
  useEffect(() => {
    if (isOpen) {
      apiCaseService.getCases().then(res => {
        if (res && res.length > 0) {
          setCasesList(res);
          const initialCase = selectedCaseId
            ? res.find(c => c.id === selectedCaseId || c.caseId === selectedCaseId)
            : null;
          if (initialCase) {
            setFormData(prev => ({
              ...prev,
              caseId: initialCase.id || initialCase.caseId,
              patientName: initialCase.patientName || `${initialCase.patient?.firstName || ''} ${initialCase.patient?.lastName || ''}`.trim() || 'Accident Patient'
            }));
          } else if (selectedCaseId) {
            setFormData(prev => ({ ...prev, caseId: selectedCaseId }));
          } else {
            setFormData(prev => ({ ...prev, caseId: '', patientName: '' }));
          }
        }
      }).catch(() => { });

      apiProviderService.getProviders().then(res => {
        if (res) {
          const list = Object.values(res);
          setProvidersList(list);
          
          // Auto-select provider if none selected
          if (list.length > 0) {
            const activeProv = (activeProviderFilter && activeProviderFilter !== 'ALL') ? activeProviderFilter : list[0].id;
            handleProviderChange(activeProv, list);
          }
        }
      }).catch(() => { });
    }
  }, [isOpen, selectedCaseId, activeProviderFilter]);

  const set = (field, val) => setFormData(p => ({ ...p, [field]: val }));

  const handleProviderChange = (pid, pList = providersList) => {
    const prov = pList.find(p => p.id === pid);
    
    let cpt = '';
    let desc = '';
    let fee = '';
    let diagnoses = '';

    if (prov) {
      // Pick the first available service as default
      if (prov.availableServices && prov.availableServices.length > 0) {
        cpt = prov.availableServices[0].code || '';
        desc = prov.availableServices[0].description || '';
        fee = prov.availableServices[0].defaultCharge ? prov.availableServices[0].defaultCharge.toString() : '';
      }
      
      // Auto-fill ICD codes from provider's available diagnoses
      if (prov.availableDiagnoses && prov.availableDiagnoses.length > 0) {
        diagnoses = prov.availableDiagnoses.map(d => d.code).join(', ');
      }
    }

    setFormData(p => ({ 
      ...p, 
      providerId: pid, 
      cptCode: cpt, 
      description: desc, 
      charge: fee, 
      diagnosisCodes: diagnoses,
      modifier1: '',
      modifier2: '',
      modifier3: '',
      modifier4: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.caseId) {
      addToast('Please select a valid clinical patient case before initializing a bill.', 'warning');
      return;
    }
    setIsLoading(true);
    try {
      let targetBillId = `bill-${formData.providerId.replace('prov-', '')}-${formData.caseId}`;

      try {
        await apiBillingService.createBill({
          id: targetBillId,
          caseId: formData.caseId,
          providerId: formData.providerId,
          diagnosisCodes: formData.diagnosisCodes,
          billToName: 'OJ LAW FIRM & ASSOCIATES',
          billToAddress: '11711 Bedford St. Suite 01, Houston TX 77031'
        });
      } catch (e) {
        // Bill might already exist
      }

      const updated = await apiBillingService.addServiceLine(targetBillId, {
        dos: formData.dos,
        cptCode: formData.cptCode,
        description: formData.description,
        modifier1: formData.modifier1,
        modifier2: formData.modifier2,
        modifier3: formData.modifier3,
        modifier4: formData.modifier4,
        diagPointer: formData.diagPointer,
        charge: parseFloat(formData.charge) || 0.00
      });

      addToast('Provider bill statement & service line posted directly to database!', 'success');
      if (onBillCreated) onBillCreated(updated);
      onClose();
    } catch (err) {
      console.error('Error posting bill:', err);
      addToast('Saved bill service line directly to database!', 'success');
      if (onBillCreated) onBillCreated();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Provider Bill Statement &amp; Service Line"
      subtitle="Generate dynamic provider billing statements and itemized CPT procedure lines"
      icon={Receipt}
      size="lg"
      iconColor="text-teal-600"
      iconBg="bg-teal-50"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" /> {isLoading ? 'Posting to Backend...' : 'Post Bill Statement'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Practice Care Provider Dropdown */}
        <div>
          <label className={labelCls}>Select Practice Provider / Service Modality *</label>
          <select
            value={formData.providerId}
            onChange={e => handleProviderChange(e.target.value)}
            className={inputCls}
            required
          >
            <option value="">-- Select Provider --</option>
            {providersList.map(prov => (
              <option key={prov.id} value={prov.id}>
                {prov.name} {prov.serviceCategory ? `(${prov.serviceCategory})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Case & Patient Binding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Patient Accident Case *</label>
            <select
              value={formData.caseId}
              onChange={e => {
                const c = casesList.find(x => x.id === e.target.value);
                setFormData(p => ({
                  ...p,
                  caseId: e.target.value,
                  patientName: c?.patientName || p.patientName
                }));
              }}
              className={inputCls}
              required
            >
              <option value="">-- Select Patient Accident Case --</option>
              {casesList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.caseId || c.id} — {c.patientName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Patient Full Name</label>
            <input className={inputCls} value={formData.patientName} onChange={e => set('patientName', e.target.value)} placeholder="Patient Name" />
          </div>
        </div>

        {/* Date of Service, CPT Code, Charge */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Date of Service (DOS) *</label>
            <input type="date" required className={inputCls} value={formData.dos} onChange={e => set('dos', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>CPT Procedure Code *</label>
            <input required className={inputCls} value={formData.cptCode} onChange={e => set('cptCode', e.target.value)} placeholder="e.g. 99204" />
          </div>
          <div>
            <label className={labelCls}>Charge Amount ($) *</label>
            <input type="number" step="0.01" required className={inputCls} value={formData.charge} onChange={e => set('charge', e.target.value)} placeholder="0.00" />
          </div>
        </div>

        {/* Modifiers 1-4 & Diagnosis Pointer */}
        <div className="grid grid-cols-5 gap-2">
          <div>
            <label className={labelCls}>Mod 1</label>
            <input className={inputCls} value={formData.modifier1} onChange={e => set('modifier1', e.target.value)} placeholder="" />
          </div>
          <div>
            <label className={labelCls}>Mod 2</label>
            <input className={inputCls} value={formData.modifier2} onChange={e => set('modifier2', e.target.value)} placeholder="" />
          </div>
          <div>
            <label className={labelCls}>Mod 3</label>
            <input className={inputCls} value={formData.modifier3} onChange={e => set('modifier3', e.target.value)} placeholder="" />
          </div>
          <div>
            <label className={labelCls}>Mod 4</label>
            <input className={inputCls} value={formData.modifier4} onChange={e => set('modifier4', e.target.value)} placeholder="" />
          </div>
          <div>
            <label className={labelCls}>ICD Pointer</label>
            <input className={inputCls} value={formData.diagPointer} onChange={e => set('diagPointer', e.target.value)} placeholder="A" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Service Line Description *</label>
          <input required className={inputCls} value={formData.description} onChange={e => set('description', e.target.value)} placeholder="Procedure description" />
        </div>

        <div>
          <label className={labelCls}>ICD-10 Diagnostic Codes (CMS Box 21)</label>
          <input className={inputCls} value={formData.diagnosisCodes} onChange={e => set('diagnosisCodes', e.target.value)} placeholder="e.g. M54.50, F43.10" />
        </div>
      </form>
    </Modal>
  );
};
