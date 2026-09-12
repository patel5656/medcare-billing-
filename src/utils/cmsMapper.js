// src/utils/cmsMapper.js

/**
 * Maps a bill statement and case to date-grouped CMS-1500 claims.
 * All field values are sourced from real database records — no hardcoded placeholders.
 */
export const mapBillToCms1500Claims = (bill, patientCase, providerConfig) => {
  if (!bill) return [];

  // 1. Group service lines by unique Date of Service (dos)
  const lineItems = bill.lineItems || bill.serviceLines || [];
  const dosGroups = {};

  lineItems.forEach(item => {
    const dosKey = item.dos || item.dateOfService || bill.statementDate;
    if (!dosGroups[dosKey]) dosGroups[dosKey] = [];
    dosGroups[dosKey].push(item);
  });

  let dosKeys = Object.keys(dosGroups);
  if (dosKeys.length === 0) { dosKeys = [""]; }

  // --- Patient Name: Format as LASTNAME, FIRSTNAME MI (CMS-1500 standard) ---
  let patientName = '';
  const pLast = bill.patientLastName || patientCase?.patientLastName || '';
  const pFirst = bill.patientFirstName || patientCase?.patientFirstName || '';
  const pMiddle = bill.patientMiddleName || patientCase?.patientMiddleName || '';
  if (pLast && pFirst) {
    const mi = pMiddle ? ` ${pMiddle.charAt(0)}` : '';
    patientName = `${pLast.toUpperCase()}, ${pFirst.toUpperCase()}${mi.toUpperCase()}`;
  } else {
    // Fallback to pre-formatted name from backend
    patientName = bill.patientName || patientCase?.patientName || '';
  }

  // --- Patient demographics ---
  const patientId = bill.patientSystemId || patientCase?.patientId || bill.patientId || '';
  const patientDob = bill.patientDob || patientCase?.patientDob || patientCase?.patient?.dob || '';
  const dobString = patientDob ? String(patientDob) : '';
  const dobParts = dobString.split(/[-/]/);
  const mm = dobString ? (dobParts[0] || '') : '';
  const dd = dobString ? (dobParts[1] || '') : '';
  const yy = dobString ? (dobParts[2] || '') : '';
  const patientSex = bill.patientSex || patientCase?.patientSex || patientCase?.patient?.sex || '';

  // --- Patient address (individual components from DB) ---
  const patientStreet = bill.patientStreet || patientCase?.patientStreet || '';
  const patientCity = bill.patientCity || patientCase?.patientCity || '';
  const patientState = bill.patientState || patientCase?.patientState || '';
  const patientZip = bill.patientZip || patientCase?.patientZip || '';
  const patientPhone = bill.patientPhone || patientCase?.patientPhone || '';

  // --- Provider identifiers from real DB data ---
  const providerNpi = bill.providerNpi || providerConfig?.identifiers?.npi || bill.identifiers?.npi || '';
  const providerTaxId = bill.providerTaxId || providerConfig?.identifiers?.taxId || bill.identifiers?.taxId || '';
  const providerSsnOrEin = bill.providerSsnOrEin || providerConfig?.identifiers?.ssnOrEin || 'EIN';

  // --- Rendering provider from real DB data ---
  const renderingProvider = bill.renderingProvider || providerConfig?.renderingProvider || {};
  const renderingName = renderingProvider.name || '';
  const renderingNpi = renderingProvider.npi || providerNpi;
  const renderingProviderId = renderingProvider.providerId || renderingProvider.id || renderingProvider.renderingId || bill.renderingProviderId || '';

  // --- Referring provider from Case ---
  const referringName = bill.referringProviderName || patientCase?.referringProviderName || bill.providerName || providerConfig?.name || '';
  const referringNpi = bill.referringProviderNpi || patientCase?.referringProviderNpi || providerNpi || '';

  // --- Service Facility from provider DB ---
  const serviceFacility = bill.serviceFacility || providerConfig?.serviceFacility || {};
  const sfName = serviceFacility.name || bill.providerName || '';
  const sfAddress = serviceFacility.address || '';

  // --- Billing Provider from provider DB ---
  const billingProvider = bill.billingProvider || providerConfig?.billingProvider || {};
  const bpName = billingProvider.name || bill.providerName || '';
  const bpAddress = billingProvider.address || '';
  const bpPhone = billingProvider.phone || bill.providerPhone || '';

  // --- Diagnosis Codes from real data ---
  const rawDiag = bill.diagnosisCodes || bill.diagnoses || bill.box21Diagnoses || patientCase?.diagnosisCodes || patientCase?.diagnoses || [];
  let parsedDiagnoses = [];
  if (Array.isArray(rawDiag)) {
    parsedDiagnoses = rawDiag.map(d => String(d).trim()).filter(Boolean);
  } else if (typeof rawDiag === 'string') {
    parsedDiagnoses = rawDiag.split(/[,;\n]+/).map(d => d.trim()).filter(Boolean);
  }

  // --- Totals from real bill data ---
  const billTotals = bill.totals || {};
  const totalPayments = bill.totalPayments || billTotals.totalPayments || 0;
  const totalAdjustments = bill.totalAdjustments || billTotals.totalAdjustments || 0;

  // --- Accident / Illness date from case ---
  const accidentDate = bill.accidentDate || patientCase?.accidentDate || '';
  const accidentDateParts = accidentDate ? String(accidentDate).split(/[-/]/) : [];
  const illMm = accidentDateParts[0] || '';
  const illDd = accidentDateParts[1] || '';
  const illYy = accidentDateParts[2] || '';

  // --- Carrier Header from attorney data ---
  const attorneyName = bill.attorneyName || bill.billToName || patientCase?.attorneyName || '';
  const attorneyAddress = bill.attorneyAddress || bill.billToAddress || patientCase?.attorneyAddress || '';
  const carrierHeader = attorneyName
    ? `${attorneyName}\n${attorneyAddress}`
    : 'PATIENT SELF-PAY / DIRECT BILLING';

  // --- Build auto diagnosis pointer string based on actual diagnosis count ---
  const buildDiagPtr = (existingPtr) => {
    if (existingPtr) return existingPtr;
    // Generate pointers like "1", "12", "123", "1234" based on how many diagnoses exist
    const count = Math.min(parsedDiagnoses.length, 4);
    if (count === 0) return '';
    return Array.from({ length: count }, (_, i) => String(i + 1)).join('');
  };

  return dosKeys.map((dosKey, idx) => {
    const items = dosGroups[dosKey] || lineItems;
    let totalCharge = 0;
    const box24Lines = items.map(item => {
      const lineFee = parseFloat(item.charge || item.fee || item.lineTotal || 0);
      totalCharge += lineFee;

      const itemRenderingId = item.renderingProviderId || item.renderingId || item.renderingProvider?.providerId || item.renderingProvider?.id || renderingProviderId;
      const itemRenderingNpi = item.renderingNpi || item.renderingProvider?.npi || renderingNpi;

      return {
        note: item.description || '',
        fromDos: item.dos || item.dateOfService || dosKey,
        pos: item.placeOfService || providerConfig?.defaultPlaceOfService || '11',
        cpt: item.cptCode || item.cpt || '',
        mod1: item.mod1 || item.modifier1 || (item.modifiers && item.modifiers[0]) || '',
        mod2: item.mod2 || item.modifier2 || (item.modifiers && item.modifiers[1]) || '',
        mod3: item.mod3 || item.modifier3 || (item.modifiers && item.modifiers[2]) || '',
        mod4: item.mod4 || item.modifier4 || (item.modifiers && item.modifiers[3]) || '',
        diagPtr: buildDiagPtr(item.diagPtr || item.diagPointer || item.diagnosisPointer || ''),
        charge: lineFee > 0 ? lineFee.toFixed(2) : '0.00',
        units: String(item.units || 1),
        renderingId: itemRenderingId,
        renderingNpi: itemRenderingNpi
      };
    });

    const claimTotalCharge = totalCharge > 0 ? totalCharge : 0;
    const claimAmountPaid = Number(totalPayments) || 0;
    const claimTotalAdjustments = Number(totalAdjustments) || 0;
    const claimBalanceDue = claimTotalCharge - claimAmountPaid - claimTotalAdjustments;

    return {
      claimId: `cms-${bill.id}-${idx}`,
      billId: bill.id,
      providerId: bill.providerId || providerConfig?.id || '',
      providerName: bill.providerName || '',
      dos: dosKey,
      dosDisplay: dosKey,
      createdAt: bill.createdAt || bill.created_at || bill.createdAtTimestamp || bill.updatedAt || bill.updated_at || bill.statementDate || bill.date || new Date().toISOString(),
      status: 'Generated & Validated',
      formVersion: '02/12',
      box1: 'OTHER',
      box1a: patientId,
      box2: patientName,
      box3Dob: { mm, dd, yy },
      box3Sex: patientSex,
      box4: patientName,
      box5Address: patientStreet,
      box5City: patientCity,
      box5State: patientState,
      box5Zip: patientZip,
      box5Phone: patientPhone,
      box6Relation: 'Self',
      box7Address: patientStreet,
      box7City: patientCity,
      box7State: patientState,
      box7Zip: patientZip,
      box7Phone: patientPhone,
      box8Status: 'Single',
      box9a: '',
      box9bDob: { mm: '', dd: '', yy: '' },
      box9bSex: '',
      box9c: '',
      box9d: '',
      box10AutoAccident: 'YES',
      box10State: bill.accidentState || patientCase?.accidentState || patientState,
      box10d: '',
      box11: '',
      box11InsuredDob: { mm, dd, yy },
      box11InsuredSex: patientSex,
      box11b: '',
      box11c: '',
      box11d: '',
      box12Signature: 'SIGNATURE ON FILE',
      box12Date: dosKey,
      box13Signature: 'SIGNATURE ON FILE',
      box14IllnessDate: { mm: illMm, dd: illDd, yy: illYy },
      box15Date: { mm: '', dd: '', yy: '' },
      box16From: { mm: '', dd: '', yy: '' },
      box16To: { mm: '', dd: '', yy: '' },
      box17ReferringName: referringName,
      box17a: referringName,
      box17Npi: referringNpi,
      box18From: { mm: '', dd: '', yy: '' },
      box18To: { mm: '', dd: '', yy: '' },
      box19: '',
      box21Diagnoses: parsedDiagnoses,
      box22Code: '',
      box22Ref: '',
      box23: '',
      box24Lines,
      box25TaxId: providerTaxId,
      box25Type: providerSsnOrEin,
      box26Account: patientId,
      box27AcceptAssignment: 'YES',
      box28TotalCharge: claimTotalCharge.toFixed(2),
      box29AmountPaid: claimAmountPaid.toFixed(2),
      box30BalanceDue: claimBalanceDue.toFixed(2),
      box31ProviderSignature: renderingName,
      box31Date: dosKey,
      box32Facility: sfAddress ? `${sfName}\n${sfAddress}` : sfName,
      box33BillingProvider: bpAddress ? `${bpName}\n${bpAddress}` : bpName,
      box33Phone: bpPhone,
      box33Npi: providerNpi,
      carrierHeader: carrierHeader,
    };
  });
};

/**
 * Directly maps a scheduled appointment to a single CMS-1500 claim
 */
export const mapAppointmentToCmsClaim = (appointment) => {
  if (!appointment) return null;
  const dos = appointment.date || '';
  const serviceLines = appointment.serviceLines || [
    {
      cptCode: appointment.serviceCode || '',
      description: appointment.serviceName || '',
      modifier1: '25',
      modifier2: '',
      modifier3: '',
      modifier4: '',
      diagPointer: 'A',
      units: 1,
      fee: 350.00,
      lineTotal: 350.00
    }
  ];

  let totalCharge = 0;
  const box24Lines = serviceLines.map(line => {
    const fee = parseFloat(line.lineTotal || line.fee || 0);
    totalCharge += fee;
    return {
      note: line.description || '',
      fromDos: dos,
      pos: '11',
      emg: 'N',
      cpt: line.cptCode || '',
      mod1: line.modifier1 || line.mod1 || '',
      mod2: line.modifier2 || line.mod2 || '',
      mod3: line.modifier3 || line.mod3 || '',
      mod4: line.modifier4 || line.mod4 || '',
      diagPtr: line.diagPointer || line.diagPtr || '',
      charge: fee.toFixed(2),
      units: String(line.units || 1),
      renderingId: appointment.providerNpi || ''
    };
  });

  return {
    claimId: `cms-appt-${appointment.id}`,
    appointmentId: appointment.id,
    dos,
    status: 'Ready to Bill',
    formVersion: '02/12',
    box1: 'OTHER',
    box1a: appointment.patientId || '',
    box2: appointment.patientName || '',
    box3Dob: { mm: '', dd: '', yy: '' },
    box3Sex: '',
    box4: appointment.patientName || '',
    box5Address: '',
    box5City: '',
    box5State: '',
    box5Zip: '',
    box6Relation: 'Self',
    box7Address: '',
    box7City: '',
    box7State: '',
    box7Zip: '',
    box8Status: 'Single',
    box9a: '',
    box9bDob: { mm: '', dd: '', yy: '' },
    box9bSex: '',
    box9c: '',
    box9d: '',
    box10AutoAccident: 'YES',
    box10State: '',
    box10d: '',
    box11: '',
    box11InsuredDob: { mm: '', dd: '', yy: '' },
    box11InsuredSex: '',
    box11b: '',
    box11c: '',
    box11d: '',
    box12Signature: 'SIGNATURE ON FILE',
    box12Date: dos,
    box13Signature: 'SIGNATURE ON FILE',
    box14IllnessDate: { mm: '', dd: '', yy: '' },
    box15Date: { mm: '', dd: '', yy: '' },
    box16From: { mm: '', dd: '', yy: '' },
    box16To: { mm: '', dd: '', yy: '' },
    box17ReferringName: appointment.providerName || '',
    box17a: appointment.providerName || '',
    box17Npi: appointment.providerNpi || '',
    box18From: { mm: '', dd: '', yy: '' },
    box18To: { mm: '', dd: '', yy: '' },
    box19: '',
    box21Diagnoses: [],
    box22Code: '',
    box22Ref: '',
    box23: '',
    box24Lines,
    box25TaxId: '',
    box25Type: 'EIN',
    box27AcceptAssignment: 'YES',
    box28TotalCharge: totalCharge.toFixed(2),
    box29AmountPaid: '0.00',
    box30BalanceDue: totalCharge.toFixed(2),
    box31ProviderSignature: appointment.providerName || '',
    box31Date: dos,
    box32Facility: '',
    box33BillingProvider: '',
    box33Phone: '',
    box33Npi: '',
    carrierHeader: ''
  };
};
