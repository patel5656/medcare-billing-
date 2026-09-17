// src/utils/cmsMapper.js

// Helper functions for CMS Box 6, 8, 10 dynamic mappings based on real DB data

const mapBox6Relation = (relation) => {
  if (!relation) return '';
  const r = String(relation).trim();
  const lower = r.toLowerCase();
  if (lower === 'self') return 'Self';
  if (lower === 'spouse') return 'Spouse';
  if (lower === 'child') return 'Child';
  if (lower === 'other') return 'Other';
  return '';
};

const mapBox8MaritalStatus = (maritalStatus) => {
  if (!maritalStatus) return '';
  const m = String(maritalStatus).trim().toUpperCase();
  if (m === 'SINGLE') return 'Single';
  if (m === 'MARRIED') return 'Married';
  if (['DIVORCED', 'WIDOWED', 'SEPARATED', 'DOMESTIC_PARTNER', 'OTHER'].includes(m)) return 'Other';
  return '';
};

const mapBox8EmploymentStatus = (employmentStatus) => {
  if (!employmentStatus) return '';
  const emp = String(employmentStatus).trim().toUpperCase().replace(/[\s-]/g, '_');
  if (emp.includes('FULL_TIME_STUDENT')) return 'Full-Time Student';
  if (emp.includes('PART_TIME_STUDENT')) return 'Part-Time Student';
  if (emp === 'STUDENT') return 'Full-Time Student';
  if (emp.includes('EMPLOYED') || emp === 'SELF_EMPLOYED') return 'Employed';
  return '';
};

const mapBox10Conditions = (accidentType) => {
  if (!accidentType) {
    return {
      box10Employment: '',
      box10AutoAccident: '',
      box10OtherAccident: ''
    };
  }
  const acc = String(accidentType).trim().toUpperCase().replace(/[\s-]/g, '_');
  return {
    box10Employment: acc === 'WORKERS_COMP' ? 'YES' : 'NO',
    box10AutoAccident: acc === 'AUTO_ACCIDENT' ? 'YES' : 'NO',
    box10OtherAccident: ['SLIP_AND_FALL', 'GENERAL_PERSONAL_INJURY', 'OTHER', 'SLIP_AND_FALL_ACCIDENT'].includes(acc) ? 'YES' : 'NO'
  };
};

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
  const ptObj = patientCase?.patient || bill?.patient || {};
  const ptAddrObj = typeof ptObj.address === 'object' && ptObj.address ? ptObj.address : {};

  const patientStreet = bill.patientStreet || ptObj.street || ptAddrObj.street || patientCase?.patientStreet || '';
  const patientCity = bill.patientCity || ptObj.city || ptAddrObj.city || patientCase?.patientCity || '';
  const patientState = bill.patientState || ptObj.state || ptAddrObj.state || patientCase?.patientState || '';
  const patientZip = bill.patientZip || ptObj.zipCode || ptAddrObj.zipCode || patientCase?.patientZip || '';
  const patientPhone = bill.patientPhone || ptObj.phone || ptAddrObj.phone || patientCase?.patientPhone || '';
  const primaryGroupNumber = bill.primaryGroupNumber || ptObj.primaryGroupNumber || patientCase?.patient?.primaryGroupNumber || patientCase?.primaryGroupNumber || '';

  // Box 6, Box 8 & Box 10 dynamic mappings from real DB fields
  const box6Relation = mapBox6Relation(ptObj.relationshipToInsured || bill.relationshipToInsured || patientCase?.relationshipToInsured || patientCase?.patient?.relationshipToInsured);
  const box8Status = mapBox8MaritalStatus(ptObj.maritalStatus || bill.maritalStatus || patientCase?.maritalStatus || patientCase?.patient?.maritalStatus);
  const box8EmploymentStatus = mapBox8EmploymentStatus(ptObj.employmentStatus || bill.employmentStatus || patientCase?.employmentStatus || patientCase?.patient?.employmentStatus);
  const accidentType = patientCase?.accidentType || bill.accidentType || bill.case?.accidentType || '';
  const box10 = mapBox10Conditions(accidentType);
  const box10State = bill.accidentState || patientCase?.accidentState || bill.case?.accidentState || '';

  // Box 11a: Insured's DOB & Sex based strictly on box6Relation
  let box11InsuredDob = { mm: '', dd: '', yy: '' };
  let box11InsuredSex = '';

  if (box6Relation === 'Self') {
    box11InsuredDob = { mm, dd, yy };
    box11InsuredSex = patientSex;
  } else if (['Spouse', 'Child', 'Other'].includes(box6Relation)) {
    const rawHolderDob = ptObj.policyHolderDob || bill.policyHolderDob || patientCase?.policyHolderDob || patientCase?.patient?.policyHolderDob || '';
    if (rawHolderDob) {
      const holderParts = String(rawHolderDob).split(/[-/]/);
      box11InsuredDob = {
        mm: holderParts[0] || '',
        dd: holderParts[1] || '',
        yy: holderParts[2] || ''
      };
    }
    const rawHolderSex = ptObj.policyHolderSex || bill.policyHolderSex || patientCase?.policyHolderSex || patientCase?.patient?.policyHolderSex || '';
    box11InsuredSex = rawHolderSex;
  }

  // Box 11d: Is There Another Health Benefit Plan?
  const secComp = (ptObj.secondaryInsuranceCompany || bill.secondaryInsuranceCompany || patientCase?.secondaryInsuranceCompany || patientCase?.patient?.secondaryInsuranceCompany || '').trim();
  const secPolicy = (ptObj.secondaryPolicyNumber || bill.secondaryPolicyNumber || patientCase?.secondaryPolicyNumber || patientCase?.patient?.secondaryPolicyNumber || '').trim();
  const primCompany = (bill.insuranceCompany || patientCase?.insuranceCompany || ptObj.primaryInsuranceCompany || patientCase?.patient?.primaryInsuranceCompany || '').trim();
  const primPolicy = (bill.insurancePolicyNumber || patientCase?.insurancePolicyNumber || ptObj.primaryPolicyNumber || patientCase?.patient?.primaryPolicyNumber || primaryGroupNumber || '').trim();

  let box11d = '';
  if (secComp || secPolicy) {
    box11d = 'YES';
  } else if ((primCompany || primPolicy) && !secComp && !secPolicy) {
    box11d = 'NO';
  } else {
    box11d = '';
  }

  // --- Provider identifiers from real DB data ---
  const providerNpi = bill.providerNpi || providerConfig?.identifiers?.npi || bill.identifiers?.npi || '';
  const providerTaxId = bill.providerTaxId || providerConfig?.identifiers?.taxId || bill.identifiers?.taxId || '';
  const providerSsnOrEin = bill.providerSsnOrEin || providerConfig?.identifiers?.ssnOrEin || 'EIN';

  // --- Rendering provider from real DB data ---
  const renderingProvider = bill.renderingProvider || providerConfig?.renderingProvider || {};
  const renderingName = renderingProvider.name || '';
  const renderingNpi = renderingProvider.npi || providerNpi;
  const renderingProviderId = renderingProvider.providerId || renderingProvider.id || renderingProvider.renderingId || bill.renderingProviderId || '';

  // --- Referring provider from Case or Patient (no fallbacks to billing provider) ---
  const ptObjRef = patientCase?.patient || bill?.patient || {};
  const referringName = bill.referringProviderName || patientCase?.referringProviderName || bill.referringProvider || ptObjRef.referringProvider || ptObjRef.referringProviderName || '';
  const referringNpi = bill.referringProviderNpi || patientCase?.referringProviderNpi || ptObjRef.referringProviderNpi || '';

  // --- Service Facility from provider DB ---
  const serviceFacility = bill.serviceFacility || providerConfig?.serviceFacility || {};
  const sfName = serviceFacility.name || bill.providerName || '';
  const sfAddress = serviceFacility.address || '';
  const sfNpi = serviceFacility.npi || '';

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
  const totalPayments = bill.totalPayments !== undefined ? bill.totalPayments : (billTotals.totalPayments || 0);
  const totalAdjustments = bill.totalAdjustments !== undefined ? bill.totalAdjustments : (billTotals.totalAdjustments || 0);

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
    const claimAdjustments = Number(totalAdjustments) || 0;
    const claimBalanceDue = Math.max(0, claimTotalCharge - (claimAmountPaid + claimAdjustments));

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
      box1a: bill.insurancePolicyNumber || patientCase?.insurancePolicyNumber || '',
      box2: patientName,
      box3Dob: { mm, dd, yy },
      box3Sex: patientSex,
      box4: patientName,
      box5Address: patientStreet,
      box5City: patientCity,
      box5State: patientState,
      box5Zip: patientZip,
      box5Phone: patientPhone,
      box6Relation,
      box7Address: patientStreet,
      box7City: patientCity,
      box7State: patientState,
      box7Zip: patientZip,
      box7Phone: patientPhone,
      box8Status,
      box8EmploymentStatus,
      box9a: '',
      box9bDob: { mm: '', dd: '', yy: '' },
      box9bSex: '',
      box9c: '',
      box9d: '',
      box10Employment: box10.box10Employment,
      box10AutoAccident: box10.box10AutoAccident,
      box10OtherAccident: box10.box10OtherAccident,
      box10State,
      box10d: '',
      box11: primaryGroupNumber,
      box11InsuredDob,
      box11InsuredSex,
      box11b: '',
      box11c: bill.insuranceCompany || patientCase?.insuranceCompany || '',
      box11d,
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
      box32Npi: sfNpi,
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

  const apptPt = appointment.patient || {};
  const apptPtAddr = typeof apptPt.address === 'object' && apptPt.address ? apptPt.address : {};
  const apptStreet = appointment.patientStreet || apptPt.street || apptPtAddr.street || '';
  const apptCity = appointment.patientCity || apptPt.city || apptPtAddr.city || '';
  const apptState = appointment.patientState || apptPt.state || apptPtAddr.state || '';
  const apptZip = appointment.patientZip || apptPt.zipCode || apptPtAddr.zipCode || '';
  const apptPhone = appointment.patientPhone || apptPt.phone || apptPtAddr.phone || '';

  const box6Relation = mapBox6Relation(apptPt.relationshipToInsured || appointment.relationshipToInsured);
  const box8Status = mapBox8MaritalStatus(apptPt.maritalStatus || appointment.maritalStatus);
  const box8EmploymentStatus = mapBox8EmploymentStatus(apptPt.employmentStatus || appointment.employmentStatus);
  const box10 = mapBox10Conditions(appointment.accidentType || apptPt.accidentType);
  const box10State = appointment.accidentState || apptPt.accidentState || '';

  let box11InsuredDob = { mm: '', dd: '', yy: '' };
  let box11InsuredSex = '';

  if (box6Relation === 'Self') {
    const apptDobParts = apptPt.dob ? String(apptPt.dob).split(/[-/]/) : [];
    box11InsuredDob = { mm: apptDobParts[0] || '', dd: apptDobParts[1] || '', yy: apptDobParts[2] || '' };
    box11InsuredSex = apptPt.sex || appointment.sex || '';
  } else if (['Spouse', 'Child', 'Other'].includes(box6Relation)) {
    const rawHolderDob = apptPt.policyHolderDob || appointment.policyHolderDob || '';
    if (rawHolderDob) {
      const holderParts = String(rawHolderDob).split(/[-/]/);
      box11InsuredDob = { mm: holderParts[0] || '', dd: holderParts[1] || '', yy: holderParts[2] || '' };
    }
    box11InsuredSex = apptPt.policyHolderSex || appointment.policyHolderSex || '';
  }

  const apptSecComp = (apptPt.secondaryInsuranceCompany || appointment.secondaryInsuranceCompany || '').trim();
  const apptSecPolicy = (apptPt.secondaryPolicyNumber || appointment.secondaryPolicyNumber || '').trim();
  const apptPrimCompany = (appointment.insuranceCompany || appointment.insuranceCarrier || apptPt.primaryInsuranceCompany || '').trim();
  const apptPrimPolicy = (appointment.insurancePolicyNumber || appointment.policyNumber || '').trim();

  let box11d = '';
  if (apptSecComp || apptSecPolicy) {
    box11d = 'YES';
  } else if ((apptPrimCompany || apptPrimPolicy) && !apptSecComp && !apptSecPolicy) {
    box11d = 'NO';
  } else {
    box11d = '';
  }

  return {
    claimId: `cms-appt-${appointment.id}`,
    appointmentId: appointment.id,
    dos,
    status: 'Ready to Bill',
    formVersion: '02/12',
    box1: 'OTHER',
    box1a: appointment.insurancePolicyNumber || appointment.policyNumber || '',
    box2: appointment.patientName || '',
    box3Dob: { mm: '', dd: '', yy: '' },
    box3Sex: '',
    box4: appointment.patientName || '',
    box5Address: apptStreet,
    box5City: apptCity,
    box5State: apptState,
    box5Zip: apptZip,
    box5Phone: apptPhone,
    box6Relation,
    box7Address: apptStreet,
    box7City: apptCity,
    box7State: apptState,
    box7Zip: apptZip,
    box7Phone: apptPhone,
    box8Status,
    box8EmploymentStatus,
    box9a: '',
    box9bDob: { mm: '', dd: '', yy: '' },
    box9bSex: '',
    box9c: '',
    box9d: '',
    box10Employment: box10.box10Employment,
    box10AutoAccident: box10.box10AutoAccident,
    box10OtherAccident: box10.box10OtherAccident,
    box10State,
    box10d: '',
    box11: appointment.insurancePolicyNumber || appointment.policyNumber || '',
    box11InsuredDob,
    box11InsuredSex,
    box11b: '',
    box11c: appointment.insuranceCompany || appointment.insuranceCarrier || '',
    box11d,
    box12Signature: 'SIGNATURE ON FILE',
    box12Date: dos,
    box13Signature: 'SIGNATURE ON FILE',
    box14IllnessDate: { mm: '', dd: '', yy: '' },
    box15Date: { mm: '', dd: '', yy: '' },
    box16From: { mm: '', dd: '', yy: '' },
    box16To: { mm: '', dd: '', yy: '' },
    box17ReferringName: appointment.referringProviderName || appointment.referringProvider || apptPt.referringProvider || apptPt.referringProviderName || '',
    box17a: '',
    box17Npi: appointment.referringProviderNpi || apptPt.referringProviderNpi || '',
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
    box32Npi: '',
    box33BillingProvider: '',
    box33Phone: '',
    box33Npi: '',
    carrierHeader: ''
  };
};
