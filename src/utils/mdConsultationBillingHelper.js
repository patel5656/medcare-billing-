// src/utils/mdConsultationBillingHelper.js
import { COMMON_CPT_CODES } from '../constants/servicesCatalog.js';

/**
 * Filter and sort real patient appointments for MD Consultation (Pain Management).
 * Single source of truth for MD Consultation billing statements.
 */
export const filterAndSortMdConsultationVisits = (appointments, targetCaseId, targetCaseNum, targetPatientId) => {
  if (!appointments || !Array.isArray(appointments)) return [];

  const filtered = appointments.filter(a => {
    // 1. Patient check: if targetPatientId provided, ensure match
    if (targetPatientId && a.patientId && a.patientId !== targetPatientId) {
      return false;
    }

    // 2. Case check: if appointment explicitly belongs to a different case, exclude it
    if (a.caseId && targetCaseId && a.caseId !== targetCaseId && a.caseId !== targetCaseNum) {
      return false;
    }

    // 3. Status check: Exclude cancelled, no-show, or uncompleted scheduled visits
    const status = (a.status || '').toUpperCase();
    if (status === 'CANCELLED' || status === 'NO_SHOW' || status === 'SCHEDULED' || status === 'PENDING') {
      return false;
    }

    // 4. Modality / Provider check
    const provId = (a.providerId || '').toLowerCase();
    const provName = (a.providerName || '').toLowerCase();
    const apptType = (a.appointmentType || '').toLowerCase();
    const reason = (a.reasonForVisit || '').toLowerCase();
    const cpt = (a.cptCode || '').toLowerCase();

    // Exclude other distinct modalities unless expressly marked as pain/MD consult
    const isOtherModality = 
      provId === 'prov-counselor' ||
      provId === 'usr-cou' ||
      provId === 'prov-anik' ||
      provId === 'prov-davs' ||
      provId === 'prov-tecar';

    if (isOtherModality && !apptType.includes('pain') && !apptType.includes('md consult')) {
      return false;
    }

    const isMdConsult =
      provId === 'prov-josmic' ||
      provId === 'usr-sa' ||
      provName.includes('josmic') ||
      provName.includes('pain') ||
      provName.includes('adeoye') ||
      provName.includes('sarah connor') ||
      provName.includes('wellness center') ||
      apptType.includes('pain') ||
      apptType.includes('md') ||
      apptType.includes('consult') ||
      reason.includes('pain') ||
      reason.includes('evaluation') ||
      cpt.includes('99204') ||
      cpt.includes('99203') ||
      cpt.includes('99205') ||
      cpt.includes('99214') ||
      cpt.includes('99213');

    return isMdConsult;
  });

  // 5. Chronological order: earliest to latest
  filtered.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  return filtered;
};

/**
 * Standard CPT description and fee lookup from master catalog
 */
const getCptCatalogDetails = (code) => {
  const cleanCode = (code || '').trim();

  // Provider-specific MD Consultation default rates & clinical descriptions
  if (cleanCode === '99204') {
    return {
      description: 'Comprehensive Initial Pain Management Evaluation & Medical Decision Making',
      fee: 1214.00
    };
  }
  if (cleanCode === '99203') {
    return {
      description: 'Initial MD Pain Consultation & Medical Evaluation (Level 3)',
      fee: 950.00
    };
  }
  if (cleanCode === '99205') {
    return {
      description: 'Initial MD Pain Consultation & Medical Evaluation High Complexity (Level 5)',
      fee: 1450.00
    };
  }
  if (cleanCode === '97024') {
    return {
      description: 'Diathermy / TECAR Radiofrequency',
      fee: 250.00
    };
  }
  if (cleanCode === '20552') {
    return {
      description: 'Trigger Point Injections (1 or 2 muscle groups)',
      fee: 450.00
    };
  }

  const matched = COMMON_CPT_CODES.find(c => c.code === cleanCode);
  if (matched) {
    return {
      description: matched.description,
      fee: matched.defaultFee || 0
    };
  }

  return {
    description: `Procedure ${cleanCode}`,
    fee: 150.00
  };
};

/**
 * Parse metadata or serviceLines embedded in an appointment
 */
export const extractLinesFromAppointment = (appt) => {
  if (!appt) return [];

  // Check if reasonForVisit contains <!-- APPT_METADATA:{...} -->
  const reason = appt.reasonForVisit || '';
  if (reason.includes('<!-- APPT_METADATA:')) {
    try {
      const match = reason.match(/<!--\s*APPT_METADATA:\s*(\{.*?\})\s*-->/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (parsed.serviceLines && Array.isArray(parsed.serviceLines) && parsed.serviceLines.length > 0) {
          return parsed.serviceLines.map((line, idx) => ({
            id: line.id || `line-${appt.id}-${idx + 1}`,
            dos: appt.date || '',
            dateOfService: appt.date || '',
            cptCode: line.cptCode || '',
            description: line.description || getCptCatalogDetails(line.cptCode).description,
            modifier1: line.modifier1 || '',
            modifier2: line.modifier2 || '',
            modifier3: line.modifier3 || '',
            modifier4: line.modifier4 || '',
            diagPointer: line.diagnosisPointer || line.diagPointer || 'A',
            units: Number(line.units) || 1,
            charge: Number(line.charge !== undefined ? line.charge : getCptCatalogDetails(line.cptCode).fee),
            insurancePayment: 0,
            patientPayment: 0,
            otherPayment: 0,
            adjustments: 0,
            appointmentId: appt.id
          }));
        }
      }
    } catch (e) {
      console.warn('Failed parsing APPT_METADATA from appointment:', appt.id, e);
    }
  }

  // Check if appointment object directly has serviceLines
  if (appt.serviceLines && Array.isArray(appt.serviceLines) && appt.serviceLines.length > 0) {
    return appt.serviceLines.map((line, idx) => ({
      id: line.id || `line-${appt.id}-${idx + 1}`,
      dos: appt.date || line.dos || '',
      dateOfService: appt.date || line.dos || '',
      cptCode: line.cptCode || '',
      description: line.description || getCptCatalogDetails(line.cptCode).description,
      modifier1: line.modifier1 || '',
      modifier2: line.modifier2 || '',
      modifier3: line.modifier3 || '',
      modifier4: line.modifier4 || '',
      diagPointer: line.diagnosisPointer || line.diagPointer || 'A',
      units: Number(line.units) || 1,
      charge: Number(line.charge !== undefined ? line.charge : getCptCatalogDetails(line.cptCode).fee),
      insurancePayment: 0,
      patientPayment: 0,
      otherPayment: 0,
      adjustments: 0,
      appointmentId: appt.id
    }));
  }

  // Fallback to appointment cptCode (can be comma-separated, e.g. "99204" or "97024,97024")
  const cptRaw = appt.cptCode || '99204';
  const codes = cptRaw.split(',').map(c => c.trim()).filter(Boolean);
  
  return codes.map((code, idx) => {
    const catalog = getCptCatalogDetails(code);
    return {
      id: `line-${appt.id}-${idx + 1}`,
      dos: appt.date || '',
      dateOfService: appt.date || '',
      cptCode: code,
      description: catalog.description,
      modifier1: code === '99204' ? '25' : '',
      modifier2: '',
      modifier3: '',
      modifier4: '',
      diagPointer: 'A',
      units: 1,
      charge: Number(appt.fee || appt.charge || catalog.fee),
      insurancePayment: 0,
      patientPayment: 0,
      otherPayment: 0,
      adjustments: 0,
      appointmentId: appt.id
    };
  });
};

/**
 * Reconcile appointments with persisted bill service lines.
 * Priority 1: Actual saved Provider Bills Ledger service lines and totals.
 * Priority 2: Only completed visits (status === 'COMPLETED'). Scheduled visits never fabricate charges.
 */
export const buildMdConsultationStatementRows = (appointments, bill = null) => {
  const billLines = bill?.serviceLines || bill?.lineItems || [];
  
  // 1. If a persisted bill exists with saved service lines, use the actual Provider Bills Ledger service lines!
  if (billLines.length > 0) {
    return billLines.map(item => {
      const units = Number(item.units) || 1;
      const unitCharge = Number(item.charge) || 0;
      const lineCharge = item.totalCharge !== undefined && Number(item.totalCharge) > 0 
        ? Number(item.totalCharge) 
        : (units > 1 ? units * unitCharge : unitCharge);
      const insPay = Number(item.payments?.insurance || item.insurancePayment || item.insPay) || 0;
      const patPay = Number(item.payments?.patient || item.patientPayment || item.patPay) || 0;
      const adj = Number(item.adjustments || item.adjustment || item.adj) || 0;
      const lineBal = item.lineBalance !== undefined && item.lineBalance !== null
        ? Number(item.lineBalance)
        : Math.max(0, lineCharge - (insPay + patPay + adj));

      return {
        ...item,
        dos: item.dos || item.dateOfService || item.date || '',
        cptCode: item.cptCode || '',
        description: item.description || '',
        units,
        charge: lineCharge,
        insPay,
        patPay,
        adj,
        lineBal
      };
    });
  }

  // 2. If no saved bill exists, only include visits that are actually COMPLETED!
  // Scheduled visits must NEVER fabricate billing charges.
  const completedVisits = (appointments || []).filter(a => {
    const status = (a.status || '').toUpperCase();
    return status === 'COMPLETED';
  });

  if (completedVisits.length > 0) {
    const extractedLines = [];
    completedVisits.forEach(appt => {
      const lines = extractLinesFromAppointment(appt);
      extractedLines.push(...lines);
    });

    return extractedLines.map((line, idx) => {
      const units = line.units || 1;
      const charge = line.charge || 0;
      const totalCharge = units * charge;
      return {
        id: line.id || `srv-md-${idx + 1}`,
        dos: line.dos,
        dateOfService: line.dos,
        cptCode: line.cptCode,
        description: line.description,
        modifier1: line.modifier1,
        modifier2: line.modifier2,
        units,
        charge: totalCharge,
        insPay: 0,
        patPay: 0,
        adj: 0,
        lineBal: totalCharge,
        payments: {
          insurance: 0,
          patient: 0,
          other: 0
        }
      };
    });
  }

  return [];
};
