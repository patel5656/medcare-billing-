import React, { useState, useEffect } from 'react';

const FieldInput = ({ defaultValue = '', placeholder = '', className = '', readOnly = false, multiline = false }) => {
  const [val, setVal] = useState(defaultValue);

  useEffect(() => {
    setVal(defaultValue);
  }, [defaultValue]);

  if (readOnly) {
    return <span className={className}>{val}</span>;
  }

  const baseClasses = "w-full bg-transparent hover:bg-amber-100/70 focus:bg-amber-100 focus:ring-1 focus:ring-amber-600 rounded px-0.5 outline-none text-slate-900 font-mono font-bold uppercase transition cursor-text border-b border-transparent focus:border-amber-500";

  if (multiline) {
    return (
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className={`${baseClasses} resize-none overflow-hidden ${className}`}
        rows={val.split('\n').length > 2 ? val.split('\n').length : 2}
      />
    );
  }

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      placeholder={placeholder}
      className={`${baseClasses} ${className}`}
    />
  );
};

/**
 * Authentic NUCC 02/12 Standard CMS-1500 (HCFA-1500) Red-Grid Claim Form Component
 * Form Approved OMB-0938-1197 FORM CMS-1500 (02/12)
 * Fits strictly on 1 US Letter portrait page (8.5" x 11")
 */
export const CmsRedGridForm = ({ claim: rawClaim = null, blankMode = false, readOnly = false }) => {
  const baseClaim = rawClaim || {
    box1: 'OTHER',
    box1a: '906684061',
    box2: 'SAMPLE, TESTING',
    box3Dob: { mm: '10', dd: '08', yy: '1974' },
    box3Sex: 'M',
    box4: 'SAMPLE, TESTING',
    box5Address: '17650 carnation glen dr',
    box5City: 'RICHMOND',
    box5State: 'TX',
    box5Zip: '77407',
    box5Phone: '(713) 555-0100',
    box6Relation: 'Self',
    box7Address: '17650 carnation glen dr',
    box7City: 'RICHMOND',
    box7State: 'TX',
    box7Zip: '77407',
    box7Phone: '(713) 555-0100',
    box8Status: 'Married',
    box8Employed: true,
    box10AutoAccident: 'YES',
    box10State: 'TX',
    box12Signature: 'SIGNATURE ON FILE',
    box12Date: '01/22/2026',
    box13Signature: 'SIGNATURE ON FILE',
    box14IllnessDate: { mm: '12', dd: '27', yy: '25' },
    box17ReferringName: 'SEGUN ADEOYE',
    box17Npi: '1234567890',
    box21Diagnoses: ['M5450', 'M542', 'M25572', ''],
    box24Lines: [
      {
        note: '1ST SESSION LASER THERAPY',
        fromDos: '2026-01-22',
        toDos: '2026-01-22',
        pos: '11',
        emg: '',
        cpt: '97039',
        mod1: '',
        mod2: '',
        diagPtr: '123',
        charge: '2000.00',
        units: '1',
        renderingId: 'R7637'
      },
      {
        note: '2ND SESSION LASER THERAPY',
        fromDos: '2026-01-22',
        toDos: '2026-01-22',
        pos: '11',
        emg: '',
        cpt: '97039',
        mod1: '',
        mod2: '',
        diagPtr: '123',
        charge: '2000.00',
        units: '1',
        renderingId: 'R7637'
      },
      {
        note: '3RD SESSION LASER THERAPY',
        fromDos: '2026-01-22',
        toDos: '2026-01-22',
        pos: '11',
        emg: '',
        cpt: '97039',
        mod1: '',
        mod2: '',
        diagPtr: '123',
        charge: '2000.00',
        units: '1',
        renderingId: 'R7637'
      },
      {
        note: 'EYE PROTECTIVE GLASSES',
        fromDos: '2026-01-22',
        toDos: '2026-01-22',
        pos: '11',
        emg: '',
        cpt: '10001',
        mod1: '',
        mod2: '',
        diagPtr: '123',
        charge: '50.00',
        units: '1',
        renderingId: 'R7637'
      },
      {
        note: 'MASSAGE THERAPY I',
        fromDos: '2026-01-22',
        toDos: '2026-01-22',
        pos: '11',
        emg: '',
        cpt: '97124',
        mod1: '',
        mod2: '',
        diagPtr: '123',
        charge: '90.00',
        units: '1',
        renderingId: 'R7637'
      }
    ],
    box25TaxId: '993723387',
    box25Type: 'EIN',
    box27AcceptAssignment: 'YES',
    box28TotalCharge: '6140.00',
    box29AmountPaid: '0.00',
    box30BalanceDue: '6140.00',
    box31ProviderSignature: 'Adeoye, Segun',
    box31Date: '04/13/2026',
    box32Facility: 'ANIK LASER THERAPY\n10101 HARWIN DR,STE.320\nHOUSTON, TX 77036',
    box33BillingProvider: 'ANIK LASER THERAPY\n10101 HARWIN DR,STE.274\nHOUSTON, TX 77036',
    box33Phone: '(832) 815 0959',
    carrierHeader: 'O.J LAWAL REMI ADESHOLA\n\n11711 BEDFORD ST. SUITE 01\nHOUSTON, TX 77031'
  };

  const claim = blankMode ? {
    box1: '', box1a: '', box2: '', box3Dob: { mm: '', dd: '', yy: '' }, box3Sex: '',
    box4: '', box5Address: '', box5City: '', box5State: '', box5Zip: '', box5Phone: '',
    box6Relation: '', box7Address: '', box7City: '', box7State: '', box7Zip: '', box7Phone: '',
    box8Status: '', box10State: '', box12Signature: '', box12Date: '', box13Signature: '',
    box14IllnessDate: { mm: '', dd: '', yy: '' }, box17ReferringName: '',
    box21Diagnoses: [], box24Lines: [], box25TaxId: '', box28TotalCharge: '',
    box29AmountPaid: '', box30BalanceDue: '', box31ProviderSignature: '',
    box32Facility: '', box33BillingProvider: '', box33Phone: '', box33Npi: ''
  } : baseClaim;

  const cleanAmount = (val) => {
    if (blankMode) return '';
    if (!val) return '0.00';
    return String(val).replace('$', '').trim();
  };

  const c = (v) => blankMode ? '' : (v || '');
  const chk = (cond) => (!blankMode && cond) ? 'X' : '';

  const formatDos = (dosString) => {
    if (!dosString) return { mm: '', dd: '', yy: '' };
    const parts = String(dosString).split(/[-/]/);
    if (parts.length < 3) return { mm: '', dd: '', yy: '' };
    if (parts[0].length === 4) {
      return { mm: parts[1], dd: parts[2], yy: parts[0].slice(-2) };
    }
    return { mm: parts[0], dd: parts[1], yy: parts[2].length === 4 ? parts[2].slice(-2) : parts[2] };
  };

  const padLines = (lines = [], targetLen = 6) => {
    const res = [...lines];
    while (res.length < targetLen) {
      res.push({
        fromDos: '',
        toDos: '',
        pos: '',
        emg: '',
        cpt: '',
        mod1: '',
        mod2: '',
        mod3: '',
        mod4: '',
        diagPtr: '',
        charge: '',
        units: '',
        epsdt: '',
        qual: '',
        renderingId: '',
        note: ''
      });
    }
    return res;
  };

  const serviceRows = padLines(blankMode ? [] : (claim.box24Lines || []), 6);

  return (
    <div
      className="cms-claim-page relative bg-white text-black font-sans mx-auto px-5 py-2 print:w-full print:mx-auto print:max-w-none print:h-full print:min-h-0 print:p-2 print:m-0 print:shadow-none select-text overflow-hidden box-border"
      style={{
        width: '100%',
        maxWidth: '816px',
        height: '1035px',
        maxHeight: '1035px',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* 🔴 HEADER AREA */}
      <div className="flex pb-1 items-start justify-between relative">
        <div className="w-[460px] pr-2 pt-0.5">
          <div className="flex items-end gap-1.5 mb-0.5">
            <div className="border border-[#b91c1c] w-[34px] h-[15px] flex items-center justify-center bg-white z-10">
              <span className="text-[14px] font-bold text-[#991b1b] font-mono tracking-tighter leading-none">1500</span>
            </div>
            <span className="text-[12px] font-black text-[#991b1b] tracking-widest leading-none pt-[1px]">HEALTH INSURANCE CLAIM FORM</span>
          </div>
          <p className="text-[6px] font-bold text-[#991b1b] tracking-tight leading-none">
            APPROVED BY NATIONAL UNIFORM CLAIM COMMITTEE 08/05
          </p>
        </div>

        <div className="flex-1 flex flex-col items-end relative">
          <div className="font-bold text-slate-900 whitespace-pre-line uppercase text-[10px] pt-1 pr-8 text-left w-full pl-6 leading-tight">
            <FieldInput multiline={true} defaultValue={c(claim.carrierHeader || 'O.J LAWAL REMI ADESHOLA\n11711 BEDFORD ST. SUITE 01\nHOUSTON, TX 77031')} readOnly={readOnly} className="font-mono text-[10px]" />
          </div>
          
          {/* RIGHT MARGIN VERTICAL CARRIER TEXT */}
          <div className="absolute -right-5 top-1 w-4 flex flex-col items-center gap-[1px] text-[#991b1b] font-sans font-bold text-[7px] tracking-[0.15em]">
             <span className="text-[9px] leading-none font-mono">∧</span>
             <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>CARRIER</span>
             <span className="text-[9px] leading-none font-mono">∨</span>
          </div>
        </div>
      </div>

      {/* 🔴 MAIN FORM BORDER WRAPPER */}
      <div className="border-[1.5px] border-[#b91c1c] print:border-[1.5px] print:border-[#b91c1c] flex flex-col relative mt-1">
        {/* PICA Alignment Boxes (Left & Right) */}
        <div className="absolute bottom-full left-0 flex z-10 mb-[-1.5px]">
          <div className="w-[8px] h-[13px] border border-[#b91c1c] border-r-0 bg-white"></div>
          <div className="w-[8px] h-[13px] border border-[#b91c1c] border-r-0 bg-white"></div>
          <div className="w-[8px] h-[13px] border border-[#b91c1c] bg-white"></div>
        </div>
        <div className="absolute bottom-full right-0 flex z-10 mb-[-1.5px]">
          <div className="w-[8px] h-[13px] border border-[#b91c1c] border-r-0 bg-white"></div>
          <div className="w-[8px] h-[13px] border border-[#b91c1c] border-r-0 bg-white"></div>
          <div className="w-[8px] h-[13px] border border-[#b91c1c] bg-white"></div>
        </div>

        {/* 🔴 ROW 1: BOX 1 & 1a */}
        <div className="flex border-b border-[#b91c1c] text-[7.5px] font-bold text-[#991b1b]">
          <div className="w-[470px] p-0.5 border-r-2 border-[#b91c1c]">
            <div className="flex justify-between w-full pr-2 text-[6.5px] leading-none">
              <span>1. MEDICARE</span><span>MEDICAID</span><span className="text-center">TRICARE<br/><span className="text-[5px] font-normal leading-none block -mt-0.5">CHAMPUS</span></span><span>CHAMPVA</span><span className="text-center">GROUP<br/><span className="text-[5px] font-normal leading-none block -mt-0.5">HEALTH PLAN</span></span><span className="text-center">FECA<br/><span className="text-[5px] font-normal leading-none block -mt-0.5">BLK LUNG</span></span><span>OTHER</span>
            </div>
            <div className="flex items-center mt-0.5 font-mono text-[8.5px] text-slate-900 justify-between w-full pr-1 pl-2">
              <div className="flex flex-col items-center"><span className="text-[5px] font-sans font-normal leading-none block mb-0.5">(Medicare #)</span><span className="w-3 h-3 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'MEDICARE')}</span></div>
              <div className="flex flex-col items-center"><span className="text-[5px] font-sans font-normal leading-none block mb-0.5">(Medicaid #)</span><span className="w-3 h-3 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'MEDICAID')}</span></div>
              <div className="flex flex-col items-center"><span className="text-[5px] font-sans font-normal leading-none block mb-0.5">(Sponsor's SSN)</span><span className="w-3 h-3 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'TRICARE')}</span></div>
              <div className="flex flex-col items-center"><span className="text-[5px] font-sans font-normal leading-none block mb-0.5">(Member ID#)</span><span className="w-3 h-3 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'CHAMPVA')}</span></div>
              <div className="flex flex-col items-center"><span className="text-[5px] font-sans font-normal leading-none block mb-0.5">(SSN or ID)</span><span className="w-3 h-3 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'GROUP')}</span></div>
              <div className="flex flex-col items-center"><span className="text-[5px] font-sans font-normal leading-none block mb-0.5">(SSN)</span><span className="w-3 h-3 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'FECA')}</span></div>
              <div className="flex flex-col items-center"><span className="text-[5px] font-sans font-normal leading-none block mb-0.5">(ID)</span><span className="w-3 h-3 border border-[#b91c1c] flex items-center justify-center font-bold text-teal-900">{chk(true)}</span></div>
            </div>
          </div>

          <div className="flex-1 p-0.5 flex flex-col justify-between">
            <div className="flex justify-between w-full text-[6.5px]">
              <span>1a. INSURED'S I.D. NUMBER</span>
              <span className="font-normal">(For Program in Item 1)</span>
            </div>
            <div className="mt-0.5">
              <FieldInput defaultValue={c(claim.box1a || '0000000000')} readOnly={readOnly} className="text-xs font-mono font-bold tracking-widest" />
            </div>
          </div>
        </div>

        {/* 🔴 ROW 2: BOXES 2, 3, 4 */}
        <div className="flex border-b border-[#b91c1c] text-[7.5px] font-bold text-[#991b1b]">
          <div className="w-[310px] p-0.5 border-r border-[#b91c1c]">
            <span>2. PATIENT'S NAME (Last Name, First Name, Middle Initial)</span>
            <div className="mt-0.5">
              <FieldInput defaultValue={c(claim.box2 || claim.patientName || 'SAMPLE, TESTING')} readOnly={readOnly} className="text-xs font-mono font-bold" />
            </div>
          </div>

          <div className="w-[170px] p-0.5 border-r-2 border-[#b91c1c]">
            <span>3. PATIENT'S BIRTH DATE &bull; SEX</span>
            <div className="flex justify-between items-center mt-0.5 font-mono text-xs text-slate-900">
              <FieldInput defaultValue={blankMode ? '' : `${claim.box3Dob?.mm || '10'} ${claim.box3Dob?.dd || '08'} ${claim.box3Dob?.yy || '1974'}`} readOnly={readOnly} className="w-22 text-xs font-mono font-bold" />
              <div className="flex gap-1.5 pr-1">
                <span className="text-[7.5px]">M <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box3Sex !== 'F')}</span></span>
                <span className="text-[7.5px]">F <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box3Sex === 'F')}</span></span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-0.5">
            <span>4. INSURED'S NAME (Last Name, First Name, Middle Initial)</span>
            <div className="mt-0.5">
              <FieldInput defaultValue={c(claim.box4 || claim.box2 || 'SAMPLE, TESTING')} readOnly={readOnly} className="text-xs font-mono font-bold" />
            </div>
          </div>
        </div>

        {/* 🔴 3-COLUMN STRUCTURE (ROWS 3 & 4: BOXES 5-11) */}
        <div className="flex border-b border-[#b91c1c] text-[7.5px] font-bold text-[#991b1b]">
          
          {/* LEFT COLUMN: BOXES 5 & 9 */}
          <div className="w-[310px] border-r border-[#b91c1c] flex flex-col justify-between">
            {/* BOX 5 */}
            <div className="p-0.5 border-b border-[#b91c1c]">
              <span>5. PATIENT'S ADDRESS (No., Street)</span>
              <div className="mt-0.5">
                <FieldInput defaultValue={c(claim.box5Address || '17650 carnation glen dr')} readOnly={readOnly} className="text-xs font-mono font-bold" />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-900 mt-0.5 uppercase">
                <span>CITY: <FieldInput defaultValue={c(claim.box5City || 'RICHMOND')} readOnly={readOnly} className="w-20 inline-block text-[10px]" /></span>
                <span>STATE: <FieldInput defaultValue={c(claim.box5State || 'TX')} readOnly={readOnly} className="w-6 inline-block text-[10px]" /></span>
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-900 mt-0.5 uppercase">
                <span>ZIP: <FieldInput defaultValue={c(claim.box5Zip || '77407')} readOnly={readOnly} className="w-14 inline-block text-[10px]" /></span>
                <span>TEL: <FieldInput defaultValue={c(claim.box5Phone || '( )')} readOnly={readOnly} className="w-20 inline-block text-[10px]" /></span>
              </div>
            </div>

            {/* BOX 9 */}
            <div>
              <div className="p-0.5 border-b border-[#b91c1c]">
                <span>9. OTHER INSURED'S NAME (Last Name, First Name, Middle Initial)</span>
                <div className="mt-0.5"><FieldInput defaultValue={c(claim.box9)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
              </div>
              <div className="p-0.5 border-b border-[#b91c1c]">
                <span>a. OTHER INSURED'S POLICY OR GROUP NUMBER</span>
                <div className="mt-0.5"><FieldInput defaultValue={c(claim.box9a)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
              </div>
              <div className="flex border-b border-[#b91c1c]">
                <div className="w-1/2 p-0.5 border-r border-[#b91c1c]">
                  <span>b. OTHER INSURED'S DATE OF BIRTH</span>
                  <div className="flex gap-1 mt-0.5">
                    <FieldInput defaultValue={c(claim.box9bDob?.mm)} readOnly={readOnly} className="w-5 text-[10px] text-center" placeholder="MM" /> 
                    <FieldInput defaultValue={c(claim.box9bDob?.dd)} readOnly={readOnly} className="w-5 text-[10px] text-center" placeholder="DD" /> 
                    <FieldInput defaultValue={c(claim.box9bDob?.yy)} readOnly={readOnly} className="w-8 text-[10px] text-center" placeholder="YY" />
                  </div>
                </div>
                <div className="w-1/2 p-0.5">
                  <span>SEX</span>
                  <div className="flex gap-1.5 mt-0.5 font-mono text-slate-900">
                    <span className="text-[7.5px]">M <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box9bSex === 'M')}</span></span>
                    <span className="text-[7.5px]">F <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box9bSex === 'F')}</span></span>
                  </div>
                </div>
              </div>
              <div className="p-0.5 border-b border-[#b91c1c]">
                <span>c. EMPLOYER'S NAME OR SCHOOL NAME</span>
                <div className="mt-0.5"><FieldInput defaultValue={c(claim.box9c)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
              </div>
              <div className="p-0.5">
                <span>d. INSURANCE PLAN NAME OR PROGRAM NAME</span>
                <div className="mt-0.5"><FieldInput defaultValue={c(claim.box9d)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN: BOXES 6, 8, 10 */}
          <div className="w-[170px] border-r-2 border-[#b91c1c] flex flex-col justify-between">
            {/* BOX 6 */}
            <div className="p-0.5 border-b border-[#b91c1c]">
              <span>6. PATIENT RELATIONSHIP TO INSURED</span>
              <div className="grid grid-cols-2 gap-0.5 mt-0.5 font-mono text-[8px] text-slate-900">
                <div>Self <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box6Relation !== 'Spouse' && claim.box6Relation !== 'Child')}</span></div>
                <div>Spouse <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box6Relation === 'Spouse')}</span></div>
                <div>Child <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box6Relation === 'Child')}</span></div>
                <div>Other <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box6Relation === 'Other')}</span></div>
              </div>
            </div>

            {/* BOX 8 */}
            <div className="p-0.5 border-b border-[#b91c1c]">
              <span>8. PATIENT STATUS</span>
              <div className="grid grid-cols-3 gap-0.5 mt-0.5 font-mono text-[7.5px] text-slate-900">
                <div>Single <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box8Status === 'Single')}</span></div>
                <div>Married <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box8Status !== 'Single')}</span></div>
                <div>Other <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold"></span></div>
              </div>
              <div className="grid grid-cols-3 gap-0.5 mt-0.5 font-mono text-[7px] text-slate-900">
                <div>Employed <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(true)}</span></div>
                <div>Full-Time Student <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold"></span></div>
                <div>Part-Time Student <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold"></span></div>
              </div>
            </div>

            {/* BOX 10 */}
            <div className="p-0.5 flex-1 flex flex-col justify-between">
              <span>10. IS PATIENT'S CONDITION RELATED TO:</span>
              <div className="space-y-1 mt-0.5 font-mono text-[8px] text-slate-900 flex-1">
                <div className="flex justify-between">
                  <span>a. EMPLOYMENT?</span>
                  <div className="flex gap-1.5"><span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c]"></span></span><span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(true)}</span></span></div>
                </div>
                <div className="flex justify-between">
                  <span>b. AUTO ACCIDENT?</span>
                  <div className="flex gap-1.5"><span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold text-teal-900">{chk(true)}</span></span><span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c]"></span></span></div>
                </div>
                <div className="text-right"><span className="ml-1 font-bold text-[7.5px]">PLACE (State) <FieldInput defaultValue={c(claim.box10State || 'TX')} readOnly={readOnly} className="w-6 inline-block text-center text-[9px]" /></span></div>
                <div className="flex justify-between">
                  <span>c. OTHER ACCIDENT?</span>
                  <div className="flex gap-1.5"><span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c]"></span></span><span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(true)}</span></span></div>
                </div>
              </div>
              <div className="border-t border-[#b91c1c] pt-0.5">
                <span>10d. RESERVED FOR LOCAL USE</span>
                <div className="mt-0.5"><FieldInput defaultValue={c(claim.box10d)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: BOXES 7 & 11 */}
          <div className="flex-1 flex flex-col justify-between">
            {/* BOX 7 */}
            <div className="p-0.5 border-b border-[#b91c1c]">
              <span>7. INSURED'S ADDRESS (No., Street)</span>
              <div className="mt-0.5">
                <FieldInput defaultValue={c(claim.box7Address || claim.box5Address || '17650 carnation glen dr')} readOnly={readOnly} className="text-xs font-mono font-bold" />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-900 mt-0.5 uppercase">
                <span>CITY: <FieldInput defaultValue={c(claim.box7City || claim.box5City || 'RICHMOND')} readOnly={readOnly} className="w-20 inline-block text-[10px]" /></span>
                <span>STATE: <FieldInput defaultValue={c(claim.box7State || claim.box5State || 'TX')} readOnly={readOnly} className="w-6 inline-block text-[10px]" /></span>
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-900 mt-0.5 uppercase">
                <span>ZIP: <FieldInput defaultValue={c(claim.box7Zip || claim.box5Zip || '77407')} readOnly={readOnly} className="w-14 inline-block text-[10px]" /></span>
                <span>TEL: <FieldInput defaultValue={c(claim.box7Phone || '( )')} readOnly={readOnly} className="w-20 inline-block text-[10px]" /></span>
              </div>
            </div>

            {/* BOX 11 */}
            <div>
              <div className="p-0.5 border-b border-[#b91c1c]">
                <span>11. INSURED'S POLICY GROUP OR FECA NUMBER</span>
                <div className="mt-0.5"><FieldInput defaultValue={c(claim.box11)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
              </div>
              <div className="flex border-b border-[#b91c1c]">
                <div className="w-1/2 p-0.5 border-r border-[#b91c1c]">
                  <span>a. INSURED'S DATE OF BIRTH</span>
                  <div className="flex gap-1 mt-0.5">
                    <FieldInput defaultValue={c(claim.box11InsuredDob?.mm || '10')} readOnly={readOnly} className="w-5 text-[10px] text-center" placeholder="MM" /> 
                    <FieldInput defaultValue={c(claim.box11InsuredDob?.dd || '08')} readOnly={readOnly} className="w-5 text-[10px] text-center" placeholder="DD" /> 
                    <FieldInput defaultValue={c(claim.box11InsuredDob?.yy || '1974')} readOnly={readOnly} className="w-8 text-[10px] text-center" placeholder="YY" />
                  </div>
                </div>
                <div className="w-1/2 p-0.5">
                  <span>SEX</span>
                  <div className="flex gap-1.5 mt-0.5 font-mono text-slate-900">
                    <span className="text-[7.5px]">M <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box11InsuredSex !== 'F')}</span></span>
                    <span className="text-[7.5px]">F <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box11InsuredSex === 'F')}</span></span>
                  </div>
                </div>
              </div>
              <div className="p-0.5 border-b border-[#b91c1c]">
                <span>b. EMPLOYER'S NAME OR SCHOOL NAME</span>
                <div className="mt-0.5"><FieldInput defaultValue={c(claim.box11b)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
              </div>
              <div className="p-0.5 border-b border-[#b91c1c]">
                <span>c. INSURANCE PLAN NAME OR PROGRAM NAME</span>
                <div className="mt-0.5"><FieldInput defaultValue={c(claim.box11c)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
              </div>
              <div className="p-0.5">
                <span>d. IS THERE ANOTHER HEALTH BENEFIT PLAN?</span>
                <div className="flex gap-1.5 mt-0.5 font-mono text-[8px] text-slate-900">
                  <span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box11d === 'YES')}</span></span>
                  <span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box11d !== 'YES')}</span></span>
                  <span className="text-[6px] font-normal leading-none self-center">If yes, return to item 9 a-d.</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 🔴 ROW 5: BOXES 12 & 13 SIGNATURES */}
        <div className="flex border-b-2 border-[#b91c1c] text-[7.5px] font-bold text-[#991b1b]">
          <div className="w-[480px] p-1 border-r-2 border-[#b91c1c]">
            <span className="leading-none block">READ BACK OF FORM BEFORE COMPLETING &amp; SIGNING THIS FORM.</span>
            <span className="text-[6.5px] font-normal leading-tight block mt-0.5">12. PATIENT'S OR AUTHORIZED PERSON'S SIGNATURE I authorize the release of any medical or other information necessary to process this claim. I also request payment of government benefits either to myself or to the party who accepts assignment below.</span>
            <div className="flex justify-between items-end mt-1 font-mono text-xs text-slate-900">
              <div>
                <span className="text-[7.5px] text-[#991b1b] inline-block font-sans mr-1">SIGNED</span>
                <span className="font-bold border-b border-slate-400 pb-0.5">{c(claim.box12Signature || 'SIGNATURE ON FILE')}</span>
              </div>
              <div>
                <span className="text-[7.5px] text-[#991b1b] inline-block font-sans mr-1">DATE</span>
                <span className="font-bold">{c(claim.box12Date || '01/22/2026')}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-1 flex flex-col justify-between">
            <div>
              <span>13. INSURED'S OR AUTHORIZED PERSON'S SIGNATURE</span>
              <span className="text-[6.5px] font-normal leading-tight block mt-0.5">I authorize payment of medical benefits to the undersigned physician or supplier for services described below.</span>
            </div>
            <div className="font-mono text-xs text-slate-900 mt-1">
              <span className="text-[7.5px] text-[#991b1b] inline-block font-sans mr-1">SIGNED</span>
              <span className="font-bold border-b border-slate-400 pb-0.5">{c(claim.box13Signature || 'SIGNATURE ON FILE')}</span>
            </div>
          </div>
        </div>

        {/* 🔴 ROW 6: BOXES 14 - 16 */}
        <div className="flex border-b border-[#b91c1c] text-[7.5px] font-bold text-[#991b1b]">
          <div className="w-[310px] p-0.5 border-r border-[#b91c1c]">
            <span className="leading-tight block uppercase text-[6.5px]">14. DATE OF CURRENT: ILLNESS(First symptom) OR INJURY (Accident) OR PREGNANCY(LMP)</span>
            <div className="flex gap-2 mt-0.5 items-center">
              <div className="flex gap-1 font-mono text-slate-900 ml-1">
                <FieldInput defaultValue={blankMode ? '' : (claim.box14IllnessDate?.mm || '12')} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="MM" />
                <FieldInput defaultValue={blankMode ? '' : (claim.box14IllnessDate?.dd || '27')} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="DD" />
                <FieldInput defaultValue={blankMode ? '' : (claim.box14IllnessDate?.yy || '25')} readOnly={readOnly} className="w-8 text-xs text-center font-bold" placeholder="YY" />
              </div>
            </div>
          </div>

          <div className="w-[170px] p-0.5 border-r-2 border-[#b91c1c]">
            <span className="leading-tight block uppercase text-[6.5px]">15. IF PATIENT HAS HAD SAME OR SIMILAR ILLNESS. GIVE FIRST DATE</span>
            <div className="flex gap-2 mt-0.5 items-center">
              <div className="flex gap-1 font-mono text-slate-900 ml-1">
                <FieldInput defaultValue={c(claim.box15Date?.mm)} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="MM" />
                <FieldInput defaultValue={c(claim.box15Date?.dd)} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="DD" />
                <FieldInput defaultValue={c(claim.box15Date?.yy)} readOnly={readOnly} className="w-8 text-xs text-center font-bold" placeholder="YY" />
              </div>
            </div>
          </div>

          <div className="flex-1 p-0.5">
            <span className="leading-tight block text-[6.5px]">16. DATES PATIENT UNABLE TO WORK IN CURRENT OCCUPATION</span>
            <div className="flex justify-between mt-0.5 px-2 font-mono text-slate-900">
              <div className="flex gap-1 items-center">
                <span className="text-[6.5px] font-sans text-[#991b1b]">FROM</span>
                <FieldInput defaultValue={c(claim.box16From?.mm)} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="MM" />
                <FieldInput defaultValue={c(claim.box16From?.dd)} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="DD" />
                <FieldInput defaultValue={c(claim.box16From?.yy)} readOnly={readOnly} className="w-8 text-xs text-center font-bold" placeholder="YY" />
              </div>
              <div className="flex gap-1 items-center">
                <span className="text-[6.5px] font-sans text-[#991b1b]">TO</span>
                <FieldInput defaultValue={c(claim.box16To?.mm)} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="MM" />
                <FieldInput defaultValue={c(claim.box16To?.dd)} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="DD" />
                <FieldInput defaultValue={c(claim.box16To?.yy)} readOnly={readOnly} className="w-8 text-xs text-center font-bold" placeholder="YY" />
              </div>
            </div>
          </div>
        </div>

        {/* 🔴 ROW 6B: BOXES 17 - 20 */}
        <div className="flex border-b border-[#b91c1c] text-[7.5px] font-bold text-[#991b1b]">
          {/* Box 17 */}
          <div className="w-[310px] border-r border-[#b91c1c]">
            <div className="p-0.5 border-b border-[#b91c1c] h-[24px]">
              <span>17. NAME OF REFERRING PROVIDER OR OTHER SOURCE</span>
              <div className="mt-0.5 flex gap-1">
                <FieldInput defaultValue={c(claim.box17ReferringName || 'SEGUN ADEOYE')} readOnly={readOnly} className="text-xs font-mono font-bold uppercase flex-1" />
              </div>
            </div>
            <div className="flex border-b border-[#b91c1c]">
              <div className="w-[12%] p-0.5 border-r border-[#b91c1c] text-center">17a.</div>
              <div className="flex-1 p-0.5"><FieldInput defaultValue={c(claim.box17a)} readOnly={readOnly} className="text-xs font-mono font-bold bg-transparent" /></div>
            </div>
            <div className="flex">
              <div className="w-[12%] p-0.5 border-r border-[#b91c1c] text-center">17b. <span className="text-[6.5px]">NPI</span></div>
              <div className="flex-1 p-0.5"><FieldInput defaultValue={c(claim.box17Npi)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
            </div>
          </div>

          {/* Box 18, 19, 20 */}
          <div className="flex-1 flex flex-col">
            <div className="flex border-b border-[#b91c1c] h-[28px]">
              <div className="w-[60%] p-0.5 border-r border-[#b91c1c]">
                <span className="leading-tight block text-[6.5px]">18. HOSPITALIZATION DATES RELATED TO CURRENT SERVICES</span>
                <div className="flex justify-between mt-0.5 px-1 font-mono text-slate-900">
                  <div className="flex gap-0.5 items-center">
                    <span className="text-[6px] font-sans text-[#991b1b]">FROM</span>
                    <FieldInput defaultValue={c(claim.box18From?.mm)} readOnly={readOnly} className="w-4 text-[10px] text-center font-bold" placeholder="MM" />
                    <FieldInput defaultValue={c(claim.box18From?.dd)} readOnly={readOnly} className="w-4 text-[10px] text-center font-bold" placeholder="DD" />
                    <FieldInput defaultValue={c(claim.box18From?.yy)} readOnly={readOnly} className="w-6 text-[10px] text-center font-bold" placeholder="YY" />
                  </div>
                  <div className="flex gap-0.5 items-center">
                    <span className="text-[6px] font-sans text-[#991b1b]">TO</span>
                    <FieldInput defaultValue={c(claim.box18To?.mm)} readOnly={readOnly} className="w-4 text-[10px] text-center font-bold" placeholder="MM" />
                    <FieldInput defaultValue={c(claim.box18To?.dd)} readOnly={readOnly} className="w-4 text-[10px] text-center font-bold" placeholder="DD" />
                    <FieldInput defaultValue={c(claim.box18To?.yy)} readOnly={readOnly} className="w-6 text-[10px] text-center font-bold" placeholder="YY" />
                  </div>
                </div>
              </div>
              <div className="flex-1 p-0.5">
                <span>20. OUTSIDE LAB? &bull; $ CHARGES</span>
                <div className="flex justify-between items-center mt-0.5 font-mono text-[8px] text-slate-900">
                  <div className="flex gap-1.5">
                    <span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c]"></span></span>
                    <span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(true)}</span></span>
                  </div>
                  <FieldInput defaultValue={blankMode ? '' : ''} readOnly={readOnly} className="w-14 text-right font-mono font-bold" />
                </div>
              </div>
            </div>
            <div className="p-0.5 flex-1">
              <span>19. RESERVED FOR LOCAL USE</span>
              <div className="mt-0.5"><FieldInput defaultValue={c(claim.box19)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
            </div>
          </div>
        </div>

        {/* 🔴 ROW 7: BOX 21 - 23 */}
        <div className="flex border-b-2 border-[#b91c1c] text-[7.5px] font-bold text-[#991b1b]">
          <div className="w-[65%] p-1 border-r border-[#b91c1c] relative">
            <div className="flex justify-between items-center pr-2">
              <span>21. DIAGNOSIS OR NATURE OF ILLNESS OR INJURY (Relate Items 1, 2, 3 or 4 to Item 24E by Line)</span>
              {/* Downward pointer arrow targeting Box 24E */}
              <div className="absolute right-6 top-3 text-[#991b1b] font-bold text-sm leading-none flex flex-col items-center">
                <span>|</span>
                <span className="rotate-90 -mt-1">&gt;</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-1 font-mono text-xs text-slate-900 px-3">
              {/* Column 1: 1, 2 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 border-b border-[#b91c1c]/40 pb-0.5">
                  <span className="text-[#991b1b] font-bold text-[8px]">1.</span>
                  <FieldInput defaultValue={c(claim.box21Diagnoses?.[0])} readOnly={readOnly} className="font-bold flex-1" />
                </div>
                <div className="flex items-center gap-1 border-b border-[#b91c1c]/40 pb-0.5">
                  <span className="text-[#991b1b] font-bold text-[8px]">2.</span>
                  <FieldInput defaultValue={c(claim.box21Diagnoses?.[1])} readOnly={readOnly} className="font-bold flex-1" />
                </div>
              </div>

              {/* Column 2: 3, 4 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 border-b border-[#b91c1c]/40 pb-0.5">
                  <span className="text-[#991b1b] font-bold text-[8px]">3.</span>
                  <FieldInput defaultValue={c(claim.box21Diagnoses?.[2])} readOnly={readOnly} className="font-bold flex-1" />
                </div>
                <div className="flex items-center gap-1 border-b border-[#b91c1c]/40 pb-0.5">
                  <span className="text-[#991b1b] font-bold text-[8px]">4.</span>
                  <FieldInput defaultValue={c(claim.box21Diagnoses?.[3])} readOnly={readOnly} className="font-bold flex-1" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="p-0.5 border-b border-[#b91c1c] h-[26px]">
              <div className="flex justify-between text-[6.5px]">
                <span>22. MEDICAID RESUBMISSION CODE</span>
                <span>ORIGINAL REF. NO.</span>
              </div>
              <div className="flex gap-1 mt-0.5">
                <FieldInput defaultValue={c(claim.box22Code)} readOnly={readOnly} className="w-[30%] text-xs font-mono font-bold" />
                <FieldInput defaultValue={c(claim.box22Ref)} readOnly={readOnly} className="flex-1 text-xs font-mono font-bold" />
              </div>
            </div>
            <div className="p-0.5 flex-1">
              <span>23. PRIOR AUTHORIZATION NUMBER</span>
              <div className="mt-0.5">
                <FieldInput defaultValue={c(claim.box23)} readOnly={readOnly} className="text-xs font-mono font-bold" />
              </div>
            </div>
          </div>
        </div>

        {/* 🔴 ROW 8: BOX 24 SERVICE LINE TABLE (6 OFFICIAL ROWS WITH MARGIN NUMBERS 1-6) */}
        <div className="border-b-2 border-[#b91c1c] text-[7px] font-bold text-[#991b1b] relative">
          
          {/* Table Column Headers */}
          <div className="grid grid-cols-12 bg-red-50/50 p-0.5 border-b border-[#b91c1c] text-center text-[6.5px] leading-tight">
            <div className="col-span-3 border-r border-[#b91c1c]">
              24. A. DATE(S) OF SERVICE<br />
              <span className="text-[5.5px]">From (MM DD YY) &bull; To (MM DD YY)</span>
            </div>
            <div className="col-span-1 border-r border-[#b91c1c]">
              B.<br />PLACE OF<br />SERVICE
            </div>
            <div className="col-span-1 border-r border-[#b91c1c]">
              C.<br />EMG
            </div>
            <div className="col-span-3 border-r border-[#b91c1c]">
              D. PROCEDURES, SERVICES, OR SUPPLIES<br />
              <span className="text-[5px] block -mt-0.5">(Explain Unusual Circumstances)</span>
              <div className="flex justify-between px-2 text-[5.5px] tracking-widest mt-0.5"><span>CPT/HCPCS</span><span>MODIFIER</span></div>
            </div>
            <div className="col-span-1 border-r border-[#b91c1c] text-[5.5px] leading-tight flex flex-col justify-center">
              <span>E.</span><span>DIAGNOSIS</span><span>POINTER</span>
            </div>
            <div className="col-span-1 border-r border-[#b91c1c]">
              F.<br />$CHARGES
            </div>
            <div className="col-span-1 border-r border-[#b91c1c] text-[5.5px] leading-tight flex flex-col justify-center">
              <span>G.</span><span>DAYS</span><span>OR</span><span>UNITS</span>
            </div>
            <div className="col-span-1 flex text-[4.5px] leading-tight text-center">
              <div className="flex-1 border-r border-[#b91c1c]/50 flex flex-col justify-between py-0.5"><span>H.</span><span>EPSDT</span><span>Family</span><span>Plan</span></div>
              <div className="flex-1 border-r border-[#b91c1c]/50 flex flex-col justify-between py-0.5"><span>I.</span><span>ID.</span><span>QUAL.</span></div>
              <div className="flex-[2] flex flex-col justify-between py-0.5 text-[5px]"><span>J.</span><span>RENDERING</span><span>PROVIDER ID #</span></div>
            </div>
          </div>

          {/* 6 Form Rows with Left Margin Line Numbers 1 to 6 */}
          <div className="divide-y divide-[#b91c1c]/40 font-mono text-[9.5px] text-slate-900 relative">
            {serviceRows.map((line, idx) => {
              const hasData = !!line.cpt || !!line.fromDos;
              const fDos = formatDos(line.fromDos || line.dos || claim.dos);
              const tDos = formatDos(line.toDos || line.fromDos || line.dos || claim.dos);

              return (
                <div key={idx} className="h-[25px] min-h-[25px] max-h-[25px] overflow-hidden flex flex-col justify-between relative px-0.5 py-0.5">
                  {/* Left Outside Margin Line Number (1-6) */}
                  <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 font-sans font-bold text-[10px] text-[#991b1b]">
                    {idx + 1}
                  </span>

                  {/* Top Sub-line: Note / Rendering NPI legacy number */}
                  <div className="flex justify-between items-center text-[7px] font-bold leading-none h-[9px]">
                    <div className="text-slate-700 uppercase tracking-tight overflow-hidden text-ellipsis whitespace-nowrap pl-1">
                      {line.note && <span>Note: {line.note}</span>}
                    </div>
                    <div className="w-[10%] text-right font-mono text-[7px] text-slate-800 pr-1">
                      {line.renderingId && <span>{line.renderingId}</span>}
                    </div>
                  </div>

                  {/* Bottom Line: Main Grid Data */}
                  <div className="grid grid-cols-12 text-center items-center font-bold h-[14px]">
                    {/* 24.A Dates of Service */}
                    <div className="col-span-3 text-[9px] border-r border-[#b91c1c]/20 flex">
                      <div className="w-1/2 flex px-0.5 border-r border-slate-300">
                        <FieldInput defaultValue={hasData ? fDos.mm : ''} readOnly={readOnly} className="w-1/3 text-center" />
                        <FieldInput defaultValue={hasData ? fDos.dd : ''} readOnly={readOnly} className="w-1/3 text-center" />
                        <FieldInput defaultValue={hasData ? fDos.yy : ''} readOnly={readOnly} className="w-1/3 text-center" />
                      </div>
                      <div className="w-1/2 flex px-0.5">
                        <FieldInput defaultValue={hasData ? tDos.mm : ''} readOnly={readOnly} className="w-1/3 text-center" />
                        <FieldInput defaultValue={hasData ? tDos.dd : ''} readOnly={readOnly} className="w-1/3 text-center" />
                        <FieldInput defaultValue={hasData ? tDos.yy : ''} readOnly={readOnly} className="w-1/3 text-center" />
                      </div>
                    </div>
                    
                    {/* 24.B Place of Service */}
                    <div className="col-span-1 border-r border-[#b91c1c]/20">
                      <FieldInput defaultValue={hasData ? (line.pos || '11') : ''} readOnly={readOnly} className="text-center" />
                    </div>

                    {/* 24.C EMG */}
                    <div className="col-span-1 border-r border-[#b91c1c]/20">
                      <FieldInput defaultValue={hasData ? (line.emg) : ''} readOnly={readOnly} className="text-center" />
                    </div>

                    {/* 24.D CPT & Modifiers */}
                    <div className="col-span-3 border-r border-[#b91c1c]/20 flex items-center justify-between px-0.5 gap-0.5 text-[9px]">
                      <FieldInput defaultValue={line.cpt || ''} readOnly={readOnly} placeholder="CPT" className="w-12 font-mono font-black text-slate-950 text-center" />
                      <FieldInput defaultValue={line.mod1 || ''} readOnly={readOnly} placeholder="" className="w-4 text-center font-bold text-teal-800" />
                      <FieldInput defaultValue={line.mod2 || ''} readOnly={readOnly} placeholder="" className="w-4 text-center font-bold text-teal-800" />
                      <FieldInput defaultValue={line.mod3 || ''} readOnly={readOnly} placeholder="" className="w-4 text-center font-bold text-teal-800" />
                      <FieldInput defaultValue={line.mod4 || ''} readOnly={readOnly} placeholder="" className="w-4 text-center font-bold text-teal-800" />
                    </div>

                    {/* 24.E Diagnosis Pointer */}
                    <div className="col-span-1 border-r border-[#b91c1c]/20 font-black">
                      <FieldInput defaultValue={line.diagPtr || (hasData ? '123' : '')} readOnly={readOnly} className="text-center" />
                    </div>

                    {/* 24.F Charges */}
                    <div className="col-span-1 border-r border-[#b91c1c]/20 text-right pr-1 font-black">
                      <FieldInput defaultValue={hasData ? cleanAmount(line.charge) : ''} readOnly={readOnly} className="text-right" />
                    </div>

                    {/* 24.G Units */}
                    <div className="col-span-1 border-r border-[#b91c1c]/20 font-bold">
                      <FieldInput defaultValue={hasData ? (line.units || '1') : ''} readOnly={readOnly} className="text-center" />
                    </div>

                    {/* 24.H-J Rendering NPI & ID Qual */}
                    <div className="col-span-1 flex text-[8.5px] font-mono h-full items-center">
                      <div className="flex-1 border-r border-[#b91c1c]/20 h-full flex items-center justify-center">
                        <FieldInput defaultValue="" readOnly={readOnly} className="w-full text-center" />
                      </div>
                      <div className="flex-1 border-r border-[#b91c1c]/20 h-full flex items-center justify-center">
                        <FieldInput defaultValue={hasData ? 'NPI' : ''} readOnly={readOnly} className="w-full text-center text-[5.5px]" />
                      </div>
                      <div className="flex-[2] h-full flex items-center justify-center">
                        <FieldInput defaultValue={hasData ? (line.renderingId || 'NPI') : ''} readOnly={readOnly} className="w-full text-center text-[7.5px]" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🔴 ROW 9: FOOTER BOXES 25 - 30 */}
        <div className="grid grid-cols-12 border-b-2 border-[#b91c1c] text-[7.5px] font-bold text-[#991b1b]">
          <div className="col-span-3 p-0.5 border-r border-[#b91c1c]">
            <span>25. FEDERAL TAX I.D. NUMBER</span>
            <div className="flex items-center justify-between mt-0.5 font-mono text-xs text-slate-900 pr-1">
              <FieldInput defaultValue={c(claim.box25TaxId || '993723387')} readOnly={readOnly} className="font-bold w-24" />
              <div className="flex gap-1 text-[7px]">
                <span>SSN <span className="inline-block w-3 h-3 border border-[#b91c1c]"></span></span>
                <span>EIN <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(true)}</span></span>
              </div>
            </div>
          </div>

          <div className="col-span-3 p-0.5 border-r border-[#b91c1c]">
            <span>26. PATIENT'S ACCOUNT NO.</span>
            <div className="mt-0.5"><FieldInput defaultValue={c(claim.box26Account)} readOnly={readOnly} className="font-mono text-xs font-bold" /></div>
          </div>

          <div className="col-span-2 p-0.5 border-r border-[#b91c1c]">
            <span>27. ACCEPT ASSIGNMENT?</span>
            <span className="text-[5.5px] font-normal leading-none block">(For govt. claims, see back)</span>
            <div className="flex gap-2 mt-0.5 font-mono text-[8px] text-slate-900">
              <span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold text-teal-900">{chk(true)}</span></span>
              <span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c]"></span></span>
            </div>
          </div>

          <div className="col-span-1 p-0.5 border-r border-[#b91c1c] text-right">
            <span>28. TOTAL CHARGE</span>
            <div className="mt-0.5">
              <FieldInput defaultValue={blankMode ? '' : `$${cleanAmount(claim.box28TotalCharge || '6140.00')}`} readOnly={readOnly} className="font-mono text-[10px] font-black text-right" />
            </div>
          </div>

          <div className="col-span-1 p-0.5 border-r border-[#b91c1c] text-right">
            <span>29. AMOUNT PAID</span>
            <div className="mt-0.5">
              <FieldInput defaultValue={blankMode ? '' : `$${cleanAmount(claim.box29AmountPaid || '0.00')}`} readOnly={readOnly} className="font-mono text-[10px] font-bold text-right" />
            </div>
          </div>

          <div className="col-span-2 p-0.5 text-right">
            <span>30. BALANCE DUE</span>
            <div className="mt-0.5">
              <FieldInput defaultValue={blankMode ? '' : `$${cleanAmount(claim.box30BalanceDue || claim.box28TotalCharge || '6140.00')}`} readOnly={readOnly} className="font-mono text-[10px] font-black text-right" />
            </div>
          </div>
        </div>

        {/* 🔴 ROW 10: BOXES 31, 32, 33 */}
        <div className="grid grid-cols-12 text-[7.5px] font-bold text-[#991b1b] font-mono h-14">
          <div className="col-span-4 border-r border-[#b91c1c] pr-1 flex flex-col justify-between p-0.5">
            <div>
              <span className="leading-none block text-[7px]">31. SIGNATURE OF PHYSICIAN OR SUPPLIER INCLUDING DEGREES OR CREDENTIALS</span>
              <span className="text-[5.5px] font-normal leading-tight block text-slate-500">(I certify that the statements on the reverse apply to this bill and are made a part thereof.)</span>
            </div>
            <div className="flex justify-between items-end mt-0.5">
              <FieldInput defaultValue={c(claim.box31ProviderSignature || 'Adeoye, Segun')} readOnly={readOnly} className="font-bold text-[9px] w-2/3" />
              <FieldInput defaultValue={blankMode ? '' : `DATE ${claim.box31Date || '04/13/2026'}`} readOnly={readOnly} className="text-[7.5px] text-slate-600 w-1/3 text-right" />
            </div>
          </div>

          <div className="col-span-4 border-r border-[#b91c1c] px-1 flex flex-col justify-between p-0.5 relative">
            <div>
              <span className="text-[7px]">32. SERVICE FACILITY LOCATION INFORMATION</span>
              <FieldInput defaultValue={c(claim.box32Facility || 'ANIK LASER THERAPY\n10101 HARWIN DR,STE.320\nHOUSTON, TX 77036')} readOnly={readOnly} multiline={true} className="font-bold text-[8.5px] mt-0.5 leading-tight" />
            </div>
            <div className="flex justify-between text-[6.5px] mt-0.5 border-t border-[#b91c1c]/40 pt-0.5 absolute bottom-0 left-0 right-0 px-1">
              <span>a.</span>
              <span>b.</span>
            </div>
          </div>

          <div className="col-span-4 pl-1 flex flex-col justify-between p-0.5 relative">
            <div>
              <span className="text-[7px]">33. BILLING PROVIDER INFO &amp; PH # {c(claim.box33Phone || '(832) 815 0959')}</span>
              <FieldInput defaultValue={c(claim.box33BillingProvider || 'ANIK LASER THERAPY\n10101 HARWIN DR,STE.274\nHOUSTON, TX 77036')} readOnly={readOnly} multiline={true} className="font-bold text-[8.5px] mt-0.5 leading-tight" />
            </div>
            <div className="flex justify-between text-[6.5px] mt-0.5 border-t border-[#b91c1c]/40 pt-0.5 absolute bottom-0 left-0 right-0 px-1">
              <span>a.</span>
              <span>b.</span>
            </div>
          </div>
        </div>

        {/* 🔴 RIGHT MARGIN VERTICAL LABELS */}
        <div className="absolute -right-5 top-0 bottom-0 w-4 flex flex-col items-center text-[#991b1b] font-sans font-bold text-[7.5px] tracking-[0.15em]">
          
          {/* Top Section: Patient and Insured Information */}
          <div className="flex flex-col items-center h-[42%] justify-between pb-2 relative w-full">
            <span className="text-[9px] leading-none -ml-1 mt-1">&gt;&lt;</span>
            <div className="flex-1 flex items-center justify-center w-full">
              <span className="whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                PATIENT AND INSURED INFORMATION
              </span>
            </div>
            <span className="text-[9px] leading-none -ml-1">&gt;&lt;</span>
          </div>

          {/* Bottom Section: Physician or Supplier Information */}
          <div className="flex flex-col items-center h-[54%] justify-between pt-1 relative w-full">
            <div className="flex-1 flex items-center justify-center w-full">
              <span className="whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                PHYSICIAN OR SUPPLIER INFORMATION
              </span>
            </div>
            <span className="text-[9px] leading-none mb-1 -ml-1">&lt;</span>
          </div>
        </div>

      </div> {/* 🔴 END MAIN FORM BORDER WRAPPER */}

      {/* 🔴 FOOTER TEXT OUTSIDE BORDER */}
      <div className="flex justify-between text-[#991b1b] font-sans font-bold text-[6.5px] mt-0.5 w-full">
        <span>NUCC Instruction Manual available at: www.nucc.org</span>
        <span>APPROVED OMB-0938-0999 FORM CMS-1500 (08-05)</span>
      </div>

    </div>
  );
};

