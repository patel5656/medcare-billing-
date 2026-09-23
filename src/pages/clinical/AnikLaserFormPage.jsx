// src/pages/clinical/AnikLaserFormPage.jsx
import React, { useState, useEffect } from 'react';
import { apiClinicalNoteService as mockClinicalNoteService } from '../../services/api/apiClinicalNoteService';
import { apiPatientService } from '../../services/api/apiPatientService';
import { apiCaseService } from '../../services/api/apiCaseService';
import { useUIStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Award, CheckCircle2, Activity } from 'lucide-react';

export const AnikLaserFormPage = () => {
  const [patients, setPatients] = useState([]);
  const [activeCaseId, setActiveCaseId] = useState('');
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    bp: '',
    hr: '',
    treatmentAreas: '',
    wavelength: '',
    totalMins: '',
    dose: '',
    totalEnergy: '',
    comments: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const fetchPreviousVitals = async (id) => {
    try {
      const notes = await mockClinicalNoteService.getNotes({ patientId: id });
      if (notes && notes.length > 0) {
        const lastNoteWithVitals = notes.find(n => n.content && (n.content.bp || n.content.hr));
        if (lastNoteWithVitals && lastNoteWithVitals.content) {
          setFormData(prev => ({
            ...prev,
            bp: lastNoteWithVitals.content.bp || prev.bp,
            hr: lastNoteWithVitals.content.hr || prev.hr
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch previous vitals', err);
    }
  };

  const fetchPatientCases = async (id) => {
    try {
      const patientCases = await apiCaseService.getCases({ patientId: id });
      if (Array.isArray(patientCases) && patientCases.length > 0) {
        setActiveCaseId(patientCases[0].id || patientCases[0].caseId || '');
      } else {
        const p = patients.find(x => x.id === id);
        setActiveCaseId(p?.caseId || '');
      }
    } catch (err) {
      console.error('Failed to fetch patient cases', err);
    }
  };

  useEffect(() => {
    apiPatientService.getPatients().then(res => {
      const raw = Array.isArray(res) ? res : (res?.patients || []);
      if (raw && raw.length > 0) {
        setPatients(raw);
        setFormData(prev => ({
          ...prev,
          patientId: raw[0].id,
          patientName: `${raw[0].firstName} ${raw[0].lastName}`.trim()
        }));
        fetchPreviousVitals(raw[0].id);
        fetchPatientCases(raw[0].id);
      }
    }).catch(console.error);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const note = await mockClinicalNoteService.createNote({
        patientId: formData.patientId || 'pat-001',
        patientName: formData.patientName || 'Demo Patient',
        caseId: activeCaseId || 'case-001',
        providerId: 'prov-anik',
        providerName: 'ANIK Laser Therapy',
        type: 'ANIK_LASER',
        title: 'ANIK Laser Therapy Procedure Form',
        author: 'Alex Rivera (Lead Therapist)',
        content: formData
      });
      addToast('ANIK Laser Therapy Procedure Form saved!', 'success');
      navigate(`/clinical-notes/${note.id}/edit`);
    } catch (err) {
      addToast('Failed to save laser form', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/clinical-notes')} className="flex items-center gap-1 text-xs font-bold text-secondary-container hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Clinical Notes
      </button>

      <div>
        <h1 className="text-2xl font-bold text-on-surface">ANIK Laser Therapy - Class IV Laser Procedure Form</h1>
        <p className="text-xs text-on-surface-variant">Vitals verification, Wavelength (800nm), Duration (900s), Output (10.5W) & Total Energy (236,250 Joules)</p>
      </div>

      <form onSubmit={handleSave} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-6">
        
        {/* Patient Selection */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-on-surface border-b border-outline-variant pb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Patient Selection
          </h2>
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Select Patient *</label>
            <select
              required
              value={formData.patientId}
              onChange={(e) => {
                const p = patients.find(x => x.id === e.target.value);
                if (p) {
                  setFormData(prev => ({
                    ...prev,
                    patientId: p.id,
                    patientName: `${p.firstName} ${p.lastName}`.trim(),
                    bp: '',
                    hr: ''
                  }));
                  fetchPreviousVitals(p.id);
                  fetchPatientCases(p.id);
                }
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface font-bold text-secondary-container"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Vitals Check */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-on-surface border-b border-outline-variant pb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-secondary-container" /> Pre-Procedure Vitals Verification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Blood Pressure (BP) *</label>
              <input
                type="text"
                required
                value={formData.bp}
                onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Heart Rate (HR) *</label>
              <input
                type="text"
                required
                value={formData.hr}
                onChange={(e) => setFormData({ ...formData, hr: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface font-mono"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-on-surface border-b border-outline-variant pb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" /> Class IV Laser Dosimetry Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Wavelength *</label>
              <input
                type="text"
                required
                value={formData.wavelength}
                onChange={(e) => setFormData({ ...formData, wavelength: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Duration (Seconds) *</label>
              <input
                type="text"
                required
                value={formData.totalMins}
                onChange={(e) => setFormData({ ...formData, totalMins: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Power Output (Watts) *</label>
              <input
                type="text"
                required
                value={formData.dose}
                onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Total Energy (Joules) *</label>
              <input
                type="text"
                required
                value={formData.totalEnergy}
                onChange={(e) => setFormData({ ...formData, totalEnergy: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface font-bold font-mono text-purple-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Therapist Clinical Progress Comments</label>
            <textarea
              rows={3}
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
          <button type="button" onClick={() => navigate('/clinical-notes')} className="px-4 py-2 bg-surface-container text-xs font-bold rounded-lg">Cancel</button>
          <button type="submit" disabled={isLoading} className="px-5 py-2 bg-secondary-container text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5">
            <Save className="w-4 h-4" /> {isLoading ? 'Saving...' : 'Save & Sign Laser Form'}
          </button>
        </div>
      </form>
    </div>
  );
};
