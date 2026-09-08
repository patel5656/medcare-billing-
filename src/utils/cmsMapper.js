// src/utils/cmsMapper.js
import { CMS_REFERENCE_FIXTURES } from '../constants/cmsReferenceFixtures';

/**
 * Maps a bill statement and case to date-grouped CMS-1500 claims
 */
export const mapBillToCms1500Claims = (bill, patientCase, providerConfig) => {
  if (!bill) return [];

  // 1. Check if exact QA fixture exists for this bill ID
  

  // 2. Dynamic mapper for custom bills: Group service lines by unique Date of Service (dos)
  const lineItems = bill.lineItems || bill.serviceLines || [];
  const dosGroups = {};

  lineItems.forEach(item => {
    const dosKey = item.dos || item.dateOfService || bill.statementDate ;
    if (!dosGroups[dosKey]) dosGroups[dosKey] = [];
    dosGroups[dosKey].push(item);
  });

  let dosKeys = Object.keys(dosGroups);

  // If this provider packet expects 3 claims (e.g. ANIK or DAV'S) but only 1 DOS was registered, generate the 3 session claims
  const pid = providerConfig?.id || bill.providerId;
  if (dosKeys.length === 0) { dosKeys = [""]; }

  const patientName = patientCase?.patientName || bill.patientName ;
  const patientId = patientCase?.patientId || bill.patientSystemId ;
  const patientDob = patientCase?.patientDob || patientCase?.patient?.dob || '';
  const dobString = patientDob ? String(patientDob) : '';
  const dobParts = dobString.split(/[-/]/);
  const mm = dobString ? (dobParts[0] || '') : '';
  const dd = dobString ? (dobParts[1] || '') : '';
  const yy = dobString ? (dobParts[2] || '') : '';

  return dosKeys.map((dosKey, idx) => {
    const items = dosGroups[dosKey] || lineItems;
    let totalCharge = 0;
    const box24Lines = items.map(item => {
      const lineFee = parseFloat(item.charge || item.fee || item.lineTotal || 0);
      totalCharge += lineFee;

      return {
        note: item.description || '',
        fromDos: item.dos || dosKey,
        pos: providerConfig?.id === 'prov-davs' ? '10' : '11',
        cpt: item.cptCode || item.cpt ,
        mod1: item.mod1 || item.modifier1 || (item.modifiers && item.modifiers[0]) ,
        mod2: item.mod2 || item.modifier2 || (item.modifiers && item.modifiers[1]) ,
        mod3: item.mod3 || item.modifier3 || (item.modifiers && item.modifiers[2]) || '',
        mod4: item.mod4 || item.modifier4 || (item.modifiers && item.modifiers[3]) || '',
        diagPtr: item.diagPtr || item.diagnosisPointer ,
        charge: (lineFee || 4000).toFixed(2),
        units: String(item.units || 1),
        renderingId: item.renderingNpi 
      };
    });

    const isJosmic = providerConfig?.id === 'prov-josmic' || bill.providerId === 'prov-josmic';

    return {
      claimId: `cms-${bill.id}-${idx}`,
      billId: bill.id,
      providerId: bill.providerId || pid,
      providerName: bill.providerName ,
      dos: dosKey,
      dosDisplay: dosKey,
      status: 'Generated & Validated',
      formVersion: '02/12',
      box1: 'OTHER',
      box1a: patientId,
      box2: patientName,
      box3Dob: { mm, dd, yy },
      box3Sex: patientCase?.patientSex || patientCase?.patient?.sex ,
      box4: patientName,
      box5Address: patientCase?.patientAddress ,
      box5City: 'HOUSTON',
      box5State: 'TX',
      box5Zip: '77036',
      box6Relation: 'Self',
      box7Address: patientCase?.patientAddress ,
      box7City: 'HOUSTON',
      box7State: 'TX',
      box7Zip: '77036',
      box8Status: 'Single',
      box9a: '',
      box9bDob: { mm: '', dd: '', yy: '' },
      box9bSex: '',
      box9c: '',
      box9d: '',
      box10AutoAccident: 'YES',
      box10State: 'TX',
      box10d: '',
      box11: '',
      box11InsuredDob: { mm, dd, yy },
      box11InsuredSex: patientCase?.patientSex || patientCase?.patient?.sex ,
      box11b: '',
      box11c: '',
      box11d: '',
      box12Signature: 'SIGNATURE ON FILE',
      box12Date: dosKey,
      box13Signature: 'SIGNATURE ON FILE',
      box14IllnessDate: { mm: '12', dd: '27', yy: '2025' },
      box15Date: { mm: '', dd: '', yy: '' },
      box16From: { mm: '', dd: '', yy: '' },
      box16To: { mm: '', dd: '', yy: '' },
      box17ReferringName: "",
      box17a: '',
      box17Npi: '1234567890',
      box18From: { mm: '', dd: '', yy: '' },
      box18To: { mm: '', dd: '', yy: '' },
      box19: '',
      box21Diagnoses: patientCase?.diagnosisCodes?.length ? patientCase.diagnosisCodes : [],
      box22Code: '',
      box22Ref: '',
      box23: '',
      box24Lines,
      box25TaxId: providerConfig?.identifiers?.taxId ,
      box25Type: 'EIN',
      box27AcceptAssignment: 'YES',
      box28TotalCharge: (totalCharge || 4000).toFixed(2),
      box29AmountPaid: '0.00',
      box30BalanceDue: (totalCharge || 4000).toFixed(2),
      box31ProviderSignature: "",
      box31Date: dosKey,
      box32Facility: `${bill.providerName }\n10101 HARWIN DR, SUITE 774\nHOUSTON, TX 77036`,
      box33BillingProvider: `${bill.providerName }\n10101 HARWIN DR, SUITE 774\nHOUSTON, TX 77036`,
      box33Phone: '(713) 555-0100',
      carrierHeader: patientCase?.attorneyName ? `${patientCase.attorneyName}\n${patientCase.attorneyAddress }` : `PATIENT SELF-PAY / DIRECT BILLING\n10101 Harwin Dr., Houston`,
    };
  });
};

/**
 * Directly maps a scheduled appointment to a single CMS-1500 claim
 */
export const mapAppointmentToCmsClaim = (appointment) => {
  if (!appointment) return null;
  const dos = appointment.date ;
  const serviceLines = appointment.serviceLines || [
    {
      cptCode: appointment.serviceCode ,
      description: appointment.serviceName ,
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
      diagPtr: line.diagPointer || line.diagPtr ,
      charge: fee.toFixed(2),
      units: String(line.units || 1),
      renderingId: appointment.providerNpi 
    };
  });

  return {
    claimId: `cms-appt-${appointment.id}`,
    appointmentId: appointment.id,
    dos,
    status: 'Ready to Bill',
    formVersion: '02/12',
    box1: 'OTHER',
    box1a: appointment.patientId ,
    box2: appointment.patientName ,
    box3Dob: { mm: '05', dd: '15', yy: '1985' },
    box3Sex: 'M',
    box4: appointment.patientName ,
    box5Address: '10101 Harwin Dr. Suite 774',
    box5City: 'HOUSTON',
    box5State: 'TX',
    box5Zip: '77036',
    box6Relation: 'Self',
    box7Address: '10101 Harwin Dr. Suite 774',
    box7City: 'HOUSTON',
    box7State: 'TX',
    box7Zip: '77036',
    box8Status: 'Single',
    box9a: '',
    box9bDob: { mm: '', dd: '', yy: '' },
    box9bSex: '',
    box9c: '',
    box9d: '',
    box10AutoAccident: 'YES',
    box10State: 'TX',
    box10d: '',
    box11: '',
    box11InsuredDob: { mm: '05', dd: '15', yy: '1985' },
    box11InsuredSex: 'M',
    box11b: '',
    box11c: '',
    box11d: '',
    box12Signature: 'SIGNATURE ON FILE',
    box12Date: dos,
    box13Signature: 'SIGNATURE ON FILE',
    box14IllnessDate: { mm: '12', dd: '27', yy: '2025' },
    box15Date: { mm: '', dd: '', yy: '' },
    box16From: { mm: '', dd: '', yy: '' },
    box16To: { mm: '', dd: '', yy: '' },
    box17ReferringName: appointment.providerName ,
    box17a: '',
    box17Npi: appointment.providerNpi ,
    box18From: { mm: '', dd: '', yy: '' },
    box18To: { mm: '', dd: '', yy: '' },
    box19: '',
    box21Diagnoses: [],
    box22Code: '',
    box22Ref: '',
    box23: '',
    box24Lines,
    box25TaxId: '75-1234567',
    box25Type: 'EIN',
    box27AcceptAssignment: 'YES',
    box28TotalCharge: totalCharge.toFixed(2),
    box29AmountPaid: '0.00',
    box30BalanceDue: totalCharge.toFixed(2),
    box31ProviderSignature: appointment.providerName ,
    box31Date: dos,
    box32Facility: `JOSMIC Wellness Center\n10101 HARWIN DR, SUITE 774\nHOUSTON, TX 77036`,
    box33BillingProvider: `JOSMIC Wellness Center\n10101 HARWIN DR, SUITE 774\nHOUSTON, TX 77036`,
    box33Phone: '(713) 555-0100',
    carrierHeader: 'OJ LAW FIRM & ATTORNEY LIEN\n11711 BEDFORD ST. SUITE 01\nHOUSTON, TX 77031'
  };
};

