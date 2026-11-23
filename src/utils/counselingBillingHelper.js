// src/utils/counselingBillingHelper.js

/**
 * Filter and sort real patient appointments for Counseling / Behavioral Health.
 * Single source of truth across all FM Counseling packet forms.
 */
export const filterAndSortCounselingVisits = (appointments, targetCaseId, targetCaseNum) => {
  if (!appointments || !Array.isArray(appointments)) return [];

  const filtered = appointments.filter(a => {
    // 1. Provider / modality check
    const provId = (a.providerId || '').toLowerCase();
    const provName = (a.providerName || '').toLowerCase();
    const apptType = (a.appointmentType || '').toLowerCase();
    const cpt = (a.cptCode || '').toLowerCase();
    const reason = (a.reasonForVisit || '').toLowerCase();

    const isCounseling = 
      provId === 'prov-counselor' ||
      provId === 'usr-cou' ||
      provName.includes('counsel') ||
      provName.includes('hope behavioral') ||
      apptType.includes('counsel') ||
      apptType.includes('psych') ||
      cpt.includes('90791') ||
      cpt.includes('90834') ||
      cpt.includes('90837') ||
      cpt.includes('90832') ||
      reason.includes('counsel') ||
      reason.includes('psych');

    if (!isCounseling) return false;

    // 2. Case filtering: If appointment explicitly has a different caseId, exclude it
    if (a.caseId && targetCaseId && a.caseId !== targetCaseId && a.caseId !== targetCaseNum) {
      return false;
    }

    // 3. Exclude cancelled or no-show visits
    const status = (a.status || '').toUpperCase();
    if (status === 'CANCELLED' || status === 'NO_SHOW') {
      return false;
    }

    return true;
  });

  // 4. Chronological order: earliest to latest
  filtered.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  return filtered;
};

/**
 * Filter for visits eligible for statement billing under clinic billing rules.
 * Completed visits are billable. Scheduled, cancelled, no-show are not billable.
 */
export const getEligibleCounselingVisits = (visits) => {
  if (!visits || !Array.isArray(visits)) return [];
  return visits.filter(v => {
    const status = (v.status || '').toUpperCase();
    return status === 'COMPLETED';
  });
};

/**
 * Resolve billing row data (dos, cpt, desc, charge) for a single counseling visit.
 */
export const resolveVisitBillingRow = (visit, bill = null) => {
  const billLines = bill?.serviceLines || bill?.lineItems || bill?.items || [];
  
  // 1. CPT Code
  let cpt = (visit.cptCode || visit.cpt || '').trim();
  if (!cpt) {
    const type = (visit.appointmentType || '').toLowerCase();
    const reason = (visit.reasonForVisit || '').toLowerCase();
    if (type.includes('eval') || type.includes('initial') || reason.includes('eval') || reason.includes('initial')) {
      cpt = '90791';
    } else {
      cpt = '90834';
    }
  }

  // 2. Matching service line in bill
  const matchingLine = billLines.find(l => {
    const lineCpt = (l.cptCode || l.cpt || '').trim();
    return lineCpt === cpt;
  });

  // 3. Description
  let desc = '';
  if (matchingLine?.description) {
    // Strip session count suffix if bundled (e.g. " (4 Sessions)")
    desc = matchingLine.description.replace(/\s*\(\d+\s*Sessions?\)/i, '').trim();
  } else if (cpt === '90791') {
    desc = 'Psychiatric Diagnostic Evaluation & Motor Vehicle Accident Trauma Assessment';
  } else if (cpt === '90834') {
    desc = 'Individual Psychotherapy 45 min for Vehicular Phobia & Accident-Related PTSD';
  } else if (cpt === '90837') {
    desc = 'Individual Psychotherapy, 60 minutes';
  } else if (cpt === '90832') {
    desc = 'Individual Psychotherapy, 30 minutes';
  } else if (cpt === '90847') {
    desc = 'Family Psychotherapy with patient (50 minutes)';
  } else if (cpt === '90853') {
    desc = 'Group Psychotherapy';
  } else {
    desc = visit.appointmentType || visit.reasonForVisit || 'Behavioral Health Psychotherapy Session';
  }

  // 4. Charge rate
  let chargeNum = 0;
  if (visit.fee !== undefined && visit.fee !== null && Number(visit.fee) > 0) {
    chargeNum = Number(visit.fee);
  } else if (matchingLine?.charge !== undefined && matchingLine?.charge !== null && Number(matchingLine.charge) > 0) {
    chargeNum = Number(matchingLine.charge);
  } else {
    const FEE_SCHEDULE = {
      '90791': 350.00,
      '90834': 180.00,
      '90837': 240.00,
      '90832': 120.00,
      '90847': 220.00,
      '90853': 95.00,
    };
    chargeNum = FEE_SCHEDULE[cpt] || 180.00;
  }

  return {
    dos: visit.date || visit.dos || '',
    cpt,
    desc,
    chargeNum,
    charge: `$${chargeNum.toFixed(2)}`
  };
};

/**
 * Generate Part 1 statement rows (fixed 13-row layout).
 * Supports optional selectedVisitIds to allow users to select the number of sessions.
 */
export const buildPart1StatementRows = (counselingVisits, bill = null, selectedVisitIds = null) => {
  const eligible = getEligibleCounselingVisits(counselingVisits);
  const activeVisits = Array.isArray(selectedVisitIds)
    ? eligible.filter(v => selectedVisitIds.includes(v.id))
    : eligible;
  const generated = activeVisits.map(v => resolveVisitBillingRow(v, bill));
  
  return Array.from({ length: 13 }).map((_, idx) => {
    if (generated[idx]) {
      return generated[idx];
    }
    return { dos: '', cpt: '', desc: '', charge: '' };
  });
};

/**
 * Generate Part 2 statement rows (continuation rows, min 4 rows).
 * Supports optional selectedVisitIds to allow users to select the number of sessions.
 */
export const buildPart2StatementRows = (counselingVisits, bill = null, selectedVisitIds = null) => {
  const eligible = getEligibleCounselingVisits(counselingVisits);
  const activeVisits = Array.isArray(selectedVisitIds)
    ? eligible.filter(v => selectedVisitIds.includes(v.id))
    : eligible;
  const generated = activeVisits.map(v => resolveVisitBillingRow(v, bill));
  const continuation = generated.slice(13);
  const rowCount = Math.max(4, continuation.length);

  return Array.from({ length: rowCount }).map((_, idx) => {
    if (continuation[idx]) {
      return continuation[idx];
    }
    return { dos: '', cpt: '', desc: '', charge: '' };
  });
};

/**
 * Calculate reconciled financial totals for Counseling Billing Statement.
 * Supports optional selectedVisitIds to allow users to select the number of sessions.
 */
export const calculateReconciledStatementTotals = (counselingVisits, bill = null, selectedVisitIds = null) => {
  const eligible = getEligibleCounselingVisits(counselingVisits);
  const activeVisits = Array.isArray(selectedVisitIds)
    ? eligible.filter(v => selectedVisitIds.includes(v.id))
    : eligible;
  const generated = activeVisits.map(v => resolveVisitBillingRow(v, bill));
  
  const totalChargesNum = generated.reduce((sum, r) => sum + (r.chargeNum || 0), 0);
  const paymentsNum = Number(bill?.totals?.totalPayments !== undefined ? bill.totals.totalPayments : (bill?.totals?.payments || bill?.paidAmount || 0));
  const balanceDueNum = Math.max(0, totalChargesNum - paymentsNum);

  return {
    totalChargesNum,
    totalCharges: `$${totalChargesNum.toFixed(2)}`,
    paymentsNum,
    paymentsCredits: `$${paymentsNum.toFixed(2)}`,
    balanceDueNum,
    balanceDue: `$${balanceDueNum.toFixed(2)}`,
    totalVisitCount: activeVisits.length
  };
};
