// src/components/modals/EditAppointmentModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { apiAppointmentService as mockAppointmentService } from '../../services/api/apiAppointmentService';
import { INITIAL_PROVIDER_CONFIGS } from '../../constants/providerConfigs';
import { useSettingsStore } from '../../store/settingsStore';
import { MultiLineCptTable } from '../common/MultiLineCptTable';
import { isClinicClosed, getTodayDateStr } from '../../constants/usHolidays';
import { useUIStore } from '../../store/uiStore';
import { resolveCptFeeAndDescription, cleanNumericFee } from '../../utils/cptFeeSchedule';
import { Edit3, Calendar, Clock, Save, User, FileText, CheckCircle2, Stethoscope, Shield, DollarSign } from 'lucide-react';

const inputCls = 'w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition';
const labelCls = 'block text-xs font-bold text-slate-800 mb-1';

/**
 * Intelligent helper to reconstruct complete service lines from appointment object
 * Pre-populates standard clinical modifiers (25, 59, RT, GP) so boxes are never blank '--'
 * Preserves manually overridden fees and units
 */
const parseServiceLinesFromAppointment = (appointment, cptCodes = [], providerId = null) => {
  if (!appointment) return [];

  const masterList = (Array.isArray(cptCodes) && cptCodes.length > 0)
    ? cptCodes
    : (typeof useSettingsStore !== 'undefined' && useSettingsStore.getState ? useSettingsStore.getState().cptCodes : []);

  const effProviderId = providerId || appointment?.providerId || 'prov-josmic';

  let existingLines = appointment.serviceLines;

  // If not directly on appointment, check if embedded in reasonForVisit
  if ((!existingLines || !Array.isArray(existingLines) || existingLines.length === 0) && appointment.reasonForVisit) {
    const match = appointment.reasonForVisit.match(/<!-- APPT_METADATA:([\s\S]*?)-->/);
    if (match) {
      try {
        const meta = JSON.parse(match[1]);
        if (meta.serviceLines && Array.isArray(meta.serviceLines) && meta.serviceLines.length > 0) {
          existingLines = meta.serviceLines;
        }
      } catch (e) {}
    }
  }

  if (existingLines && Array.isArray(existingLines) && existingLines.length > 0) {
    return existingLines.map((line, idx) => {
      const lineCode = line.cptCode || (idx === 0 ? '99204' : '97039');
      const resolved = resolveCptFeeAndDescription(lineCode, effProviderId, masterList);
      const units = parseInt(line.units, 10) || 1;
      const rawFee = line.charge !== undefined ? line.charge : (line.fee !== undefined ? line.fee : resolved.fee);
      const charge = cleanNumericFee(rawFee);

      return {
        id: line.id || `line-${Date.now()}-${idx + 1}`,
        cptCode: lineCode,
        description: line.description || resolved.description || (idx === 0 ? (appointment?.appointmentType || 'Comprehensive Evaluation') : 'Therapeutic Modality Session'),
        modifier1: line.modifier1 || (idx === 0 ? '25' : '59'),
        modifier2: line.modifier2 || (idx === 0 ? '59' : 'RT'),
        modifier3: line.modifier3 || (idx === 0 ? 'RT' : 'GP'),
        modifier4: line.modifier4 || (idx === 0 ? 'GP' : ''),
        diagnosisPointer: line.diagnosisPointer || ['A', 'B', 'C', 'D'][idx % 4] || 'A',
        units,
        charge,
        isOverridden: line.isOverridden !== undefined ? line.isOverridden : (charge !== resolved.fee)
      };
    });
  }

  // Parse if cptCode has multiple codes separated by commas (e.g. "99204, 97039")
  const rawCodes = appointment.cptCode
    ? String(appointment.cptCode).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const rawModifiers = appointment.modifiers
    ? String(appointment.modifiers).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  if (rawCodes.length === 0) {
    if (effProviderId === 'prov-counselor' || appointment.appointmentType?.toLowerCase().includes('counsel')) {
      rawCodes.push('90834');
    } else if (effProviderId === 'prov-anik') {
      rawCodes.push('97039');
    } else if (effProviderId === 'prov-davs') {
      rawCodes.push('99204', '0101T');
    } else if (effProviderId === 'prov-tpi') {
      rawCodes.push('20552');
    } else if (effProviderId === 'prov-tecar') {
      rawCodes.push('97024');
    } else {
      rawCodes.push('99204', '97039');
    }
  }

  const pointerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return rawCodes.map((code, idx) => {
    const resolved = resolveCptFeeAndDescription(code, effProviderId, masterList);
    const modParts = rawModifiers[idx] ? rawModifiers[idx].split('-').filter(Boolean) : [];

    return {
      id: `line-${Date.now()}-${idx + 1}`,
      cptCode: code,
      description: resolved.description || (idx === 0 ? (appointment?.appointmentType || 'Comprehensive Evaluation') : 'Therapeutic Modality Session'),
      modifier1: modParts[0] || (idx === 0 ? '25' : '59'),
      modifier2: modParts[1] || (idx === 0 ? '59' : 'RT'),
      modifier3: modParts[2] || (idx === 0 ? 'RT' : 'GP'),
      modifier4: modParts[3] || (idx === 0 ? 'GP' : ''),
      diagnosisPointer: pointerLetters[idx % pointerLetters.length] || 'A',
      units: 1,
      charge: resolved.fee,
      isOverridden: false
    };
  });
};

export const EditAppointmentModal = ({ isOpen, onClose, appointment, onAppointmentUpdated }) => {
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const { cptCodes, fetchSettings } = useSettingsStore();

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, fetchSettings]);

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientDob: '',
    caseId: '',
    providerId: 'prov-josmic',
    visitType: 'INITIAL',
    appointmentType: '',
    status: 'SCHEDULED',
    date: '',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    duration: '60',
    reasonForVisit: '',
    location: '',
    visitNotes: '',
    holidayOverride: false
  });

  const [serviceLines, setServiceLines] = useState(() =>
    appointment ? parseServiceLinesFromAppointment(appointment, useSettingsStore.getState().cptCodes, appointment.providerId) : []
  );

  const prevAptIdRef = useRef(appointment?.id);

  useEffect(() => {
    if (appointment) {
      const isNewApt = prevAptIdRef.current !== appointment.id;
      prevAptIdRef.current = appointment.id;

      const rawReason = appointment.reasonForVisit || appointment.visitNotes || 'Post-MVA pain management & clinical evaluation';
      const cleanReason = rawReason.replace(/<!-- APPT_METADATA:[\s\S]*?-->/, '').trim();

      setFormData({
        patientName: appointment.patientName || '',
        patientPhone: appointment.patientPhone || '',
        patientDob: appointment.patientDob || '',
        caseId: appointment.caseId || appointment.caseRef || 'CASE-2026-507',
        providerId: appointment.providerId || 'prov-josmic',
        visitType: appointment.visitType || (appointment.appointmentType?.toLowerCase().includes('follow') || appointment.cptCode?.includes('9921') ? 'SUBSEQUENT' : 'INITIAL'),
        appointmentType: appointment.appointmentType || 'Initial Visit (New Patient)',
        status: appointment.status || 'SCHEDULED',
        date: appointment.date || '',
        startTime: appointment.startTime || '09:00 AM',
        endTime: appointment.endTime || '10:00 AM',
        duration: appointment.duration || '60',
        reasonForVisit: cleanReason,
        location: appointment.location || 'Suite 774 Main Clinic',
        visitNotes: appointment.visitNotes || '',
        holidayOverride: !!appointment.holidayOverride
      });

      // Hydrate service lines if opening a new appointment OR if currently empty
      if (isNewApt || serviceLines.length === 0) {
        const parsed = parseServiceLinesFromAppointment(appointment, cptCodes, appointment.providerId);
        if (parsed && parsed.length > 0) {
          setServiceLines(parsed);
        }
      }
    }
  }, [appointment, cptCodes]);

  if (!appointment) return null;

  const set = (field, val) => setFormData(p => ({ ...p, [field]: val }));
  const closedCheck = isClinicClosed(formData.date);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (closedCheck.isClosed && !formData.holidayOverride) {
      addToast(`${closedCheck.reason}. Please enable Admin Override to reschedule on a weekend/holiday.`, 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const selectedProv = Object.values(INITIAL_PROVIDER_CONFIGS).find(p => p.id === formData.providerId);
      const validLines = serviceLines.filter(l => l.cptCode && l.cptCode.trim() !== '');
      const linesToSave = validLines.length > 0 ? validLines : serviceLines;
      const totalEstimatedCharge = linesToSave.reduce((sum, l) => sum + ((parseInt(l.units, 10) || 1) * cleanNumericFee(l.charge)), 0);

      const cleanReason = (formData.reasonForVisit || '').replace(/<!-- APPT_METADATA:[\s\S]*?-->/, '').trim();
      const metaPayload = JSON.stringify({ serviceLines: linesToSave, totalEstimatedCharge });
      const combinedReason = cleanReason ? `${cleanReason}\n<!-- APPT_METADATA:${metaPayload} -->` : `<!-- APPT_METADATA:${metaPayload} -->`;

      const updated = await mockAppointmentService.updateAppointment(appointment.id, {
        ...formData,
        reasonForVisit: combinedReason,
        serviceLines: linesToSave,
        totalEstimatedCharge,
        cptCode: linesToSave.map(l => l.cptCode).filter(Boolean).join(','),
        modifiers: linesToSave.map(l => [l.modifier1, l.modifier2, l.modifier3, l.modifier4].filter(Boolean).join('-')).filter(Boolean).join(', '),
        providerName: selectedProv?.name || appointment.providerName || 'FM Health and Wellness Center'
      });

      addToast(`Appointment for ${updated.patientName} updated successfully!`, 'success');
      if (onAppointmentUpdated) onAppointmentUpdated(updated);
      onClose();
    } catch (err) {
      addToast('Failed to update appointment', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEncounterTypeChange = (newType) => {
    set('visitType', newType);
    if (newType === 'SUBSEQUENT') {
      set('appointmentType', 'Follow-Up Visit (Established Patient)');
      const c1 = resolveCptFeeAndDescription('99214', formData.providerId, cptCodes);
      const c2 = resolveCptFeeAndDescription('97039', formData.providerId, cptCodes);
      setServiceLines([
        {
          id: `line-${Date.now()}-1`,
          cptCode: '99214',
          description: c1.description || 'Office/Outpatient Visit Established (Moderate)',
          modifier1: '25',
          modifier2: '59',
          modifier3: 'RT',
          modifier4: 'GP',
          diagnosisPointer: 'A',
          units: 1,
          charge: c1.fee || 275.00
        },
        {
          id: `line-${Date.now()}-2`,
          cptCode: '97039',
          description: c2.description || 'Unlisted Physical Medicine (HILT Laser)',
          modifier1: '59',
          modifier2: 'RT',
          modifier3: 'GP',
          modifier4: '',
          diagnosisPointer: 'A',
          units: 1,
          charge: c2.fee || 2000.00
        }
      ]);
    } else {
      set('appointmentType', 'Initial Visit (New Patient)');
      const c1 = resolveCptFeeAndDescription('99204', formData.providerId, cptCodes);
      const c2 = resolveCptFeeAndDescription('97039', formData.providerId, cptCodes);
      setServiceLines([
        {
          id: `line-${Date.now()}-1`,
          cptCode: '99204',
          description: c1.description || 'Office/Outpatient Visit New (Complex) / Pain Consult',
          modifier1: '25',
          modifier2: '59',
          modifier3: 'RT',
          modifier4: 'GP',
          diagnosisPointer: 'A',
          units: 1,
          charge: c1.fee || 1214.00
        },
        {
          id: `line-${Date.now()}-2`,
          cptCode: '97039',
          description: c2.description || 'Unlisted Physical Medicine (HILT Laser)',
          modifier1: '59',
          modifier2: 'RT',
          modifier3: 'GP',
          modifier4: '',
          diagnosisPointer: 'A',
          units: 1,
          charge: c2.fee || 2000.00
        }
      ]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit & Reschedule Appointment"
      subtitle={`Ref: ${appointment.bookingRef || appointment.id} | ${appointment.patientName}`}
      icon={Edit3}
      size="xl"
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
            onClick={handleSave}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" /> {isLoading ? 'Saving Changes...' : 'Save & Update Appointment'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">

        {/* Patient Header Banner */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">{formData.patientName || 'Accident Patient'}</h3>
              {formData.patientPhone && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {formData.patientPhone}
                </span>
              )}
              {formData.caseId && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                  {formData.caseId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Current Status: <strong className="text-emerald-400">{formData.status}</strong>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleEncounterTypeChange('INITIAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${formData.visitType === 'INITIAL'
                  ? 'bg-teal-500 text-slate-950 font-extrabold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
            >
              Initial Visit
            </button>
            <button
              type="button"
              onClick={() => handleEncounterTypeChange('SUBSEQUENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${formData.visitType === 'SUBSEQUENT'
                  ? 'bg-teal-500 text-slate-950 font-extrabold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
            >
              Subsequent Visit
            </button>
          </div>
        </div>

        {/* Patient & Case Information Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Patient Name *</label>
            <input required className={inputCls} value={formData.patientName} onChange={e => set('patientName', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Patient Mobile (for SMS)</label>
            <input type="tel" className={inputCls} value={formData.patientPhone} onChange={e => set('patientPhone', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Linked Accident Case</label>
            <input className={inputCls} value={formData.caseId} onChange={e => set('caseId', e.target.value)} />
          </div>
        </div>

        {/* Practice Provider, Encounter Type & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Practice Care Provider *</label>
            <select
              value={formData.providerId}
              onChange={e => set('providerId', e.target.value)}
              className={`${inputCls} font-bold text-teal-800`}
            >
              <option value="prov-josmic">FM Health and Wellness Center (Pain Management)</option>
              <option value="prov-davs">Shockwave (Shockwave ESWT)</option>
              <option value="prov-anik">FM Laser Therapy (Laser Session)</option>
              <option value="prov-counselor">FM Counselor Practice (Behavioral Health &amp; PTSD)</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Encounter Type Description</label>
            <input
              type="text"
              className={inputCls}
              value={formData.appointmentType}
              onChange={e => set('appointmentType', e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Visit Status</label>
            <select
              value={formData.status}
              onChange={e => set('status', e.target.value)}
              className={`${inputCls} font-bold text-teal-800`}
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked-In</option>
              <option value="COMPLETED">Completed</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Visit Date & Time Reschedule */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Visit Date *</label>
            <input
              type="date"
              required
              className={inputCls}
              value={formData.date}
              onChange={e => set('date', e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Start Time *</label>
            <select className={inputCls} value={formData.startTime} onChange={e => set('startTime', e.target.value)}>
              <option value="08:30 AM">08:30 AM</option>
              <option value="09:00 AM">09:00 AM</option>
              <option value="09:30 AM">09:30 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="10:30 AM">10:30 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="01:00 PM">01:00 PM</option>
              <option value="02:00 PM">02:00 PM</option>
              <option value="03:00 PM">03:00 PM</option>
              <option value="04:00 PM">04:00 PM</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Clinic Location / Suite</label>
            <input className={inputCls} value={formData.location} onChange={e => set('location', e.target.value)} />
          </div>
        </div>

        {/* Multi-Line CPT & Modifiers Section */}
        <div className="pt-2">
          <MultiLineCptTable
            lines={serviceLines}
            onChange={setServiceLines}
            providerId={formData.providerId}
            title="Service CPT Billing Lines (Line 1, 2, 3... & Modifiers)"
          />
        </div>

        {/* Weekend / Holiday Alert Banner */}
        {closedCheck.isClosed && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <span>{closedCheck.isWeekend ? '📅' : '🇺🇸'}</span>
              <span>Clinic Closed: {closedCheck.reason}</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950 pt-1">
              <input
                type="checkbox"
                checked={formData.holidayOverride}
                onChange={e => set('holidayOverride', e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              Admin Override: Authorize Weekend / Holiday Appointment
            </label>
          </div>
        )}

        <div>
          <label className={labelCls}>Reason for Visit &amp; Clinical Notes</label>
          <textarea
            rows={2}
            className={inputCls}
            value={formData.reasonForVisit}
            onChange={e => set('reasonForVisit', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
