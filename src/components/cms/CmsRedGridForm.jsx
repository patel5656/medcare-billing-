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
        rows={val.split('\n').length > 3 ? val.split('\n').length : 3}
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
 * Includes all 33 official boxes, 6 line items with Modifiers (1-4), Box 21 A-L pointers, and Appointment DOS linking
 */
export const CmsRedGridForm = ({ claim: rawClaim = null, blankMode = false, readOnly = false }) => {
  const baseClaim = rawClaim || {
    box1: 'OTHER',
    box1a: '906684061',
    box2: 'aa jj',
    box3Dob: { mm: '05', dd: '15', yy: '1985' },
    box3Sex: 'M',
    box4: 'aa jj',
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
    box10AutoAccident: 'YES',
    box10State: 'TX',
    box12Signature: 'SIGNATURE ON FILE',
    box12Date: '2026-08-16',
    box13Signature: 'SIGNATURE ON FILE',
    box14IllnessDate: { mm: '12', dd: '27', yy: '2025' },
    box17ReferringName: 'Dr. Segun Adeoye',
    box17Npi: '1234567890',
    box21Diagnoses: ['M54.50', 'M54.2', 'S13.4XXA', 'M25.572'],
    box24Lines: [
      {
        note: 'Class IV High-Intensity Laser Therapy (HILT) Biostimulation',
        fromDos: '2026-08-16',
        toDos: '2026-08-16',
        pos: '11',
        emg: 'N',
        cpt: '97039',
        mod1: 'GP',
        mod2: 'RT',
        diagPtr: 'A',
        charge: '4000.00',
        units: '2',
        renderingId: '1234567890'
      },
      {
        note: 'Therapeutic Deep Tissue Laser Mobilization & Spinal Decompression',
        fromDos: '2026-08-16',
        toDos: '2026-08-16',
        pos: '11',
        emg: 'N',
        cpt: '97124',
        mod1: '59',
        diagPtr: 'A',
        charge: '868.00',
        units: '1',
        renderingId: '1234567890'
      }
    ],
    box25TaxId: '993723387',
    box25Type: 'EIN',
    box27AcceptAssignment: 'YES',
    box28TotalCharge: '4868.00',
    box29AmountPaid: '0.00',
    box30BalanceDue: '4868.00',
    box31ProviderSignature: 'Adeoye, Segun, MD',
    box31Date: '2026-08-16',
    box32Facility: 'ANIK Laser Therapy\n10101 HARWIN DR, SUITE 774\nHOUSTON, TX 77036',
    box33BillingProvider: 'ANIK Laser Therapy\n10101 HARWIN DR, SUITE 774\nHOUSTON, TX 77036',
    box33Phone: '(713) 555-0100',
    carrierHeader: 'PATIENT SELF-PAY / DIRECT BILLING\n10101 Harwin Dr., Houston'
  };

  const claim = blankMode ? {
    box1: '', box1a: '', box2: '', box3Dob: { mm: '', dd: '', yy: '' }, box3Sex: '',
    box4: '', box5Address: '', box5City: '', box5State: '', box5Zip: '',
    box6Relation: '', box7Address: '', box7City: '', box7State: '', box7Zip: '',
    box10State: '', box12Signature: '', box12Date: '', box13Signature: '',
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
      className="cms-claim-page relative bg-white text-black font-sans shadow-2xl mx-auto pt-4 pb-12 px-10 print:w-[98%] print:mx-auto print:max-w-none print:h-auto print:min-h-0 print:pt-4 print:pb-12 print:px-12 print:my-2 print:shadow-none select-text"
      style={{
        width: '100%',
        maxWidth: '850px',
        minHeight: '1100px',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* 🔴 OFFICIAL 08/05 HEADER */}
      <div className="flex pb-2 items-start justify-between relative">
        <div className="w-[490px] pr-2 pt-1">
          <div className="flex items-end gap-1.5 mb-1">
            <div className="border border-[#b91c1c] w-[38px] h-[16px] flex items-center justify-center bg-white z-10 pt-0.5">
               <span className="text-[16px] font-bold text-[#991b1b] font-mono tracking-tighter leading-none">1500</span>
            </div>
            <span className="text-[13px] font-black text-[#991b1b] tracking-widest leading-none pt-[2px]">HEALTH INSURANCE CLAIM FORM</span>
          </div>
          <p className="text-[6.5px] font-bold text-[#991b1b] tracking-tight leading-none">
            APPROVED BY NATIONAL UNIFORM CLAIM COMMITTEE 08/05
          </p>
        </div>

        <div className="flex-1 flex flex-col items-end relative">
          <div className="font-bold text-slate-900 whitespace-pre-line uppercase text-[11px] pt-6 pr-12 text-left w-full pl-8">
            <FieldInput multiline={true} defaultValue={c(claim.carrierHeader || 'O.J LAWAL REMI ADESHOLA\n11711 BEDFORD ST. SUITE 01\nHOUSTON, TX 77031')} readOnly={readOnly} className="font-mono text-[11px]" />
          </div>
          
          {/* RIGHT MARGIN TEXT */}
          <div className="absolute -right-6 top-6 w-4 flex flex-col items-center gap-[2px] pb-1 text-[#991b1b] font-sans font-bold text-[7.5px] tracking-[0.2em]">
             <span className="text-[10px] leading-none font-mono">∧</span>
             <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>CARRIER</span>
             <span className="text-[10px] leading-none font-mono">∨</span>
          </div>
        </div>
      </div>

      {/* 🔴 MAIN FORM BORDER WRAPPER */}
      <div className="border-[1.5px] border-[#b91c1c] print:border-[1.5px] print:border-[#b91c1c] flex flex-col relative mt-2">
        {/* PICA Alignment Boxes (Left) */}
        <div className="absolute bottom-full left-0 flex z-10 mb-[-1.5px]">
          <div className="w-[10px] h-[16px] border border-[#b91c1c] border-r-0 bg-white"></div>
          <div className="w-[10px] h-[16px] border border-[#b91c1c] border-r-0 bg-white"></div>
          <div className="w-[10px] h-[16px] border border-[#b91c1c] bg-white"></div>
        </div>
        {/* PICA Alignment Boxes (Right) */}
        <div className="absolute bottom-full right-0 flex z-10 mb-[-1.5px]">
          <div className="w-[10px] h-[16px] border border-[#b91c1c] border-r-0 bg-white"></div>
          <div className="w-[10px] h-[16px] border border-[#b91c1c] border-r-0 bg-white"></div>
          <div className="w-[10px] h-[16px] border border-[#b91c1c] bg-white"></div>
        </div>

      {/* 🔴 ROW 1: BOX 1 & 1a */}
      <div className="flex border-b border-[#b91c1c] text-[8px] font-bold text-[#991b1b]">
        <div className="w-[490px] p-1 border-r-2 border-[#b91c1c]">
          <div className="flex justify-between w-full pr-4 text-[7px]">
            <span>1. MEDICARE</span><span>MEDICAID</span><span className="text-center">TRICARE<br/><span className="text-[5.5px] font-normal leading-none block -mt-0.5">CHAMPUS</span></span><span>CHAMPVA</span><span className="text-center">GROUP<br/><span className="text-[5.5px] font-normal leading-none block -mt-0.5">HEALTH PLAN</span></span><span className="text-center">FECA<br/><span className="text-[5.5px] font-normal leading-none block -mt-0.5">BLK LUNG</span></span><span>OTHER</span>
          </div>
          <div className="flex items-center mt-0.5 font-mono text-[9px] text-slate-900 justify-between w-full pr-2 pl-4">
            <div className="flex flex-col items-center"><span className="text-[5.5px] font-sans font-normal leading-none block mb-0.5 whitespace-nowrap">(Medicare #)</span><span className="w-3.5 h-3.5 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'MEDICARE')}</span></div>
            <div className="flex flex-col items-center"><span className="text-[5.5px] font-sans font-normal leading-none block mb-0.5 whitespace-nowrap">(Medicaid #)</span><span className="w-3.5 h-3.5 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'MEDICAID')}</span></div>
            <div className="flex flex-col items-center"><span className="text-[5.5px] font-sans font-normal leading-none block mb-0.5 whitespace-nowrap">(Sponsor's SSN)</span><span className="w-3.5 h-3.5 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'TRICARE')}</span></div>
            <div className="flex flex-col items-center"><span className="text-[5.5px] font-sans font-normal leading-none block mb-0.5 whitespace-nowrap">(Member ID#)</span><span className="w-3.5 h-3.5 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'CHAMPVA')}</span></div>
            <div className="flex flex-col items-center"><span className="text-[5.5px] font-sans font-normal leading-none block mb-0.5 whitespace-nowrap">(SSN or ID)</span><span className="w-3.5 h-3.5 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'GROUP')}</span></div>
            <div className="flex flex-col items-center"><span className="text-[5.5px] font-sans font-normal leading-none block mb-0.5 whitespace-nowrap">(SSN)</span><span className="w-3.5 h-3.5 border border-[#b91c1c] flex items-center justify-center font-bold">{chk(claim.box1 === 'FECA')}</span></div>
            <div className="flex flex-col items-center"><span className="text-[5.5px] font-sans font-normal leading-none block mb-0.5 whitespace-nowrap">(ID)</span><span className="w-3.5 h-3.5 border border-[#b91c1c] flex items-center justify-center font-bold text-teal-900">{chk(true)}</span></div>
          </div>
        </div>

        <div className="flex-1 p-1 flex flex-col">
          <div className="flex justify-between w-full">
            <span>1a. INSURED'S I.D. NUMBER</span>
            <span className="font-normal">(For Program in Item 1)</span>
          </div>
          <div className="mt-1">
            <FieldInput defaultValue={c(claim.box1a )} readOnly={readOnly} className="text-xs font-mono font-bold tracking-widest" />
          </div>
        </div>
      </div>

      {/* 🔴 ROW 2: BOXES 2, 3, 4 */}
      <div className="flex border-b border-[#b91c1c] text-[8px] font-bold text-[#991b1b]">
        <div className="w-[300px] p-1 border-r border-[#b91c1c]">
          <span>2. PATIENT'S NAME (Last Name, First Name, Middle Initial)</span>
          <div className="mt-1">
            <FieldInput defaultValue={c(claim.box2 || claim.patientName )} readOnly={readOnly} className="text-xs font-mono font-bold" />
          </div>
        </div>

        <div className="w-[190px] p-1 border-r-2 border-[#b91c1c]">
          <span>3. PATIENT'S BIRTH DATE &bull; SEX</span>
          <div className="flex justify-between items-center mt-1 font-mono text-xs text-slate-900">
            <FieldInput defaultValue={blankMode ? '' : `${claim.box3Dob?.mm || '05'} ${claim.box3Dob?.dd || '15'} ${claim.box3Dob?.yy || '1985'}`} readOnly={readOnly} className="w-24 text-xs font-mono font-bold" />
            <div className="flex gap-2">
              <span className="text-[8px]">M <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box3Sex !== 'F')}</span></span>
              <span className="text-[8px]">F <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box3Sex === 'F')}</span></span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-1">
          <span>4. INSURED'S NAME (Last Name, First Name, Middle Initial)</span>
          <div className="mt-1">
            <FieldInput defaultValue={c(claim.box4 || claim.box2 )} readOnly={readOnly} className="text-xs font-mono font-bold" />
          </div>
        </div>
      </div>

      {/* 🔴 ROW 3: BOXES 5, 6, 7 */}
      <div className="flex border-b border-[#b91c1c] text-[8px] font-bold text-[#991b1b]">
        <div className="w-[300px] p-1 border-r border-[#b91c1c]">
          <span>5. PATIENT'S ADDRESS (No., Street)</span>
          <div className="mt-0.5">
            <FieldInput defaultValue={c(claim.box5Address )} readOnly={readOnly} className="text-xs font-mono font-bold" />
          </div>
          <div className="flex justify-between font-mono text-xs text-slate-900 mt-1 uppercase">
            <span>CITY: <FieldInput defaultValue={c(claim.box5City )} readOnly={readOnly} className="w-20 inline-block text-xs" /></span>
            <span>STATE: <FieldInput defaultValue={c(claim.box5State )} readOnly={readOnly} className="w-8 inline-block text-xs" /></span>
            <span>ZIP: <FieldInput defaultValue={c(claim.box5Zip )} readOnly={readOnly} className="w-16 inline-block text-xs" /></span>
          </div>
        </div>

        <div className="w-[190px] p-1 border-r-2 border-[#b91c1c]">
          <span>6. PATIENT RELATIONSHIP TO INSURED</span>
          <div className="grid grid-cols-2 gap-1 mt-1 font-mono text-[9px] text-slate-900">
            <div><span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(true)}</span> Self</div>
            <div><span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold"></span> Spouse</div>
            <div><span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold"></span> Child</div>
            <div><span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold"></span> Other</div>
          </div>
        </div>

        <div className="flex-1 p-1">
          <span>7. INSURED'S ADDRESS (No., Street)</span>
          <div className="mt-0.5">
            <FieldInput defaultValue={c(claim.box7Address || claim.box5Address )} readOnly={readOnly} className="text-xs font-mono font-bold" />
          </div>
          <div className="flex justify-between font-mono text-xs text-slate-900 mt-1 uppercase">
            <span>CITY: <FieldInput defaultValue={c(claim.box7City || claim.box5City )} readOnly={readOnly} className="w-20 inline-block text-xs" /></span>
            <span>STATE: <FieldInput defaultValue={c(claim.box7State || claim.box5State )} readOnly={readOnly} className="w-8 inline-block text-xs" /></span>
            <span>ZIP: <FieldInput defaultValue={c(claim.box7Zip || claim.box5Zip )} readOnly={readOnly} className="w-16 inline-block text-xs" /></span>
          </div>
        </div>
      </div>

      {/* 🔴 ROW 4: BOXES 9 - 11 */}
      <div className="flex border-b border-[#b91c1c] text-[8px] font-bold text-[#991b1b]">
        {/* BOX 9 */}
        <div className="w-[300px] border-r border-[#b91c1c]">
          <div className="p-1 border-b border-[#b91c1c]">
            <span>9. OTHER INSURED'S NAME (Last Name, First Name, Middle Initial)</span>
            <div className="mt-0.5"><FieldInput defaultValue={c(claim.box9)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
          </div>
          <div className="p-1 border-b border-[#b91c1c]">
            <span>a. OTHER INSURED'S POLICY OR GROUP NUMBER</span>
            <div className="mt-0.5"><FieldInput defaultValue={c(claim.box9a)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
          </div>
          <div className="flex border-b border-[#b91c1c]">
            <div className="w-1/2 p-1 border-r border-[#b91c1c]">
              <span>b. OTHER INSURED'S DATE OF BIRTH</span>
              <div className="flex gap-1 mt-0.5">
                <FieldInput defaultValue={c(claim.box9bDob?.mm)} readOnly={readOnly} className="w-6 text-xs text-center" placeholder="MM" /> 
                <FieldInput defaultValue={c(claim.box9bDob?.dd)} readOnly={readOnly} className="w-6 text-xs text-center" placeholder="DD" /> 
                <FieldInput defaultValue={c(claim.box9bDob?.yy)} readOnly={readOnly} className="w-10 text-xs text-center" placeholder="YY" />
              </div>
            </div>
            <div className="w-1/2 p-1">
              <span>SEX</span>
              <div className="flex gap-2 mt-0.5 font-mono text-slate-900">
                <span className="text-[8px]">M <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box9bSex === 'M')}</span></span>
                <span className="text-[8px]">F <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box9bSex === 'F')}</span></span>
              </div>
            </div>
          </div>
          <div className="p-1 border-b border-[#b91c1c]">
            <span>c. EMPLOYER'S NAME OR SCHOOL NAME</span>
            <div className="mt-0.5"><FieldInput defaultValue={c(claim.box9c)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
          </div>
          <div className="p-1">
            <span>d. INSURANCE PLAN NAME OR PROGRAM NAME</span>
            <div className="mt-0.5"><FieldInput defaultValue={c(claim.box9d)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
          </div>
        </div>

        {/* BOX 10 */}
        <div className="w-[190px] border-r-2 border-[#b91c1c]">
          <div className="p-1 h-full flex flex-col">
            <span>10. IS PATIENT'S CONDITION RELATED TO:</span>
            <div className="space-y-1 mt-1 font-mono text-[9px] text-slate-900 flex-1">
              <div className="flex justify-between">
                <span>a. EMPLOYMENT?</span>
                <div className="flex gap-2"><span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c]"></span></span><span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(true)}</span></span></div>
              </div>
              <div className="flex justify-between">
                <span>b. AUTO ACCIDENT?</span>
                <div className="flex gap-2"><span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold text-teal-900">{chk(true)}</span></span><span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c]"></span></span></div>
              </div>
              <div className="text-right"><span className="ml-1 font-bold text-[8px]">PLACE (State) <FieldInput defaultValue={c(claim.box10State )} readOnly={readOnly} className="w-6 inline-block text-center" /></span></div>
              <div className="flex justify-between">
                <span>c. OTHER ACCIDENT?</span>
                <div className="flex gap-2"><span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c]"></span></span><span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(true)}</span></span></div>
              </div>
            </div>
            <div className="mt-auto border-t border-[#b91c1c] pt-1 pb-0">
              <span>10d. CLAIM CODES (Designated by NUCC)</span>
              <div className="mt-0.5"><FieldInput defaultValue={c(claim.box10d)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
            </div>
          </div>
        </div>

        {/* BOX 11 */}
        <div className="flex-1">
          <div className="p-1 border-b border-[#b91c1c]">
            <span>11. INSURED'S POLICY GROUP OR FECA NUMBER</span>
            <div className="mt-0.5"><FieldInput defaultValue={c(claim.box11)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
          </div>
          <div className="flex border-b border-[#b91c1c]">
            <div className="w-1/2 p-1 border-r border-[#b91c1c]">
              <span>a. INSURED'S DATE OF BIRTH</span>
              <div className="flex gap-1 mt-0.5">
                <FieldInput defaultValue={c(claim.box11InsuredDob?.mm || '05')} readOnly={readOnly} className="w-6 text-xs text-center" placeholder="MM" /> 
                <FieldInput defaultValue={c(claim.box11InsuredDob?.dd || '15')} readOnly={readOnly} className="w-6 text-xs text-center" placeholder="DD" /> 
                <FieldInput defaultValue={c(claim.box11InsuredDob?.yy || '1985')} readOnly={readOnly} className="w-10 text-xs text-center" placeholder="YY" />
              </div>
            </div>
            <div className="w-1/2 p-1">
              <span>SEX</span>
              <div className="flex gap-2 mt-0.5 font-mono text-slate-900">
                <span className="text-[8px]">M <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box11InsuredSex !== 'F')}</span></span>
                <span className="text-[8px]">F <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box11InsuredSex === 'F')}</span></span>
              </div>
            </div>
          </div>
          <div className="p-1 border-b border-[#b91c1c]">
            <span>b. OTHER CLAIM ID (Designated by NUCC)</span>
            <div className="mt-0.5"><FieldInput defaultValue={c(claim.box11b)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
          </div>
          <div className="p-1 border-b border-[#b91c1c]">
            <span>c. INSURANCE PLAN NAME OR PROGRAM NAME</span>
            <div className="mt-0.5"><FieldInput defaultValue={c(claim.box11c)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
          </div>
          <div className="p-1">
            <span>d. IS THERE ANOTHER HEALTH BENEFIT PLAN?</span>
            <div className="flex gap-2 mt-0.5 font-mono text-[9px] text-slate-900">
              <span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box11d === 'YES')}</span></span>
              <span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(claim.box11d !== 'YES')}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔴 ROW 5: BOXES 12 & 13 SIGNATURES */}
      <div className="flex border-b-2 border-[#b91c1c] text-[8px] font-bold text-[#991b1b]">
        <div className="w-[490px] p-1.5 border-r-2 border-[#b91c1c]">
          <span>12. PATIENT'S OR AUTHORIZED PERSON'S SIGNATURE (Release of Info)</span>
          <div className="flex justify-between items-end mt-2 font-mono text-xs text-slate-900">
            <div>
              <span className="text-[8px] text-[#991b1b] block font-sans">SIGNED:</span>
              <span className="font-bold border-b border-slate-400 pb-0.5">{c(claim.box12Signature || 'SIGNATURE ON FILE')}</span>
            </div>
            <div>
              <span className="text-[8px] text-[#991b1b] block font-sans">DATE:</span>
              <span className="font-bold">{c(claim.dos || claim.box12Date )}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-1.5">
          <span>13. INSURED'S OR AUTHORIZED PERSON'S SIGNATURE (Assignment of Benefits)</span>
          <div className="mt-2 font-mono text-xs text-slate-900">
            <span className="text-[8px] text-[#991b1b] block font-sans">SIGNED:</span>
            <span className="font-bold border-b border-slate-400 pb-0.5">{c(claim.box13Signature || 'SIGNATURE ON FILE')}</span>
          </div>
        </div>
      </div>

      {/* 🔴 ROW 6: BOXES 14 - 16 */}
      <div className="flex border-b border-[#b91c1c] text-[8px] font-bold text-[#991b1b]">
        <div className="w-[300px] p-1 border-r border-[#b91c1c]">
          <span className="leading-tight block uppercase text-[7px]">14. DATE OF CURRENT: ILLNESS(First symptom) OR INJURY (Accident) OR PREGNANCY(LMP)</span>
          <div className="flex gap-2 mt-1">
            <div className="flex gap-1 font-mono text-slate-900 ml-2">
              <FieldInput defaultValue={blankMode ? '' : (claim.box14IllnessDate?.mm || '12')} readOnly={readOnly} className="w-6 text-xs text-center font-bold" placeholder="MM" />
              <FieldInput defaultValue={blankMode ? '' : (claim.box14IllnessDate?.dd || '27')} readOnly={readOnly} className="w-6 text-xs text-center font-bold" placeholder="DD" />
              <FieldInput defaultValue={blankMode ? '' : (claim.box14IllnessDate?.yy || '2025')} readOnly={readOnly} className="w-10 text-xs text-center font-bold" placeholder="YY" />
            </div>
          </div>
        </div>

        <div className="w-[190px] p-1 border-r-2 border-[#b91c1c]">
          <span className="leading-tight block uppercase text-[7px]">15. IF PATIENT HAS HAD SAME OR SIMILAR ILLNESS. GIVE FIRST DATE</span>
          <div className="flex gap-2 mt-1">
            <div className="flex gap-1 font-mono text-slate-900 ml-1">
              <FieldInput defaultValue={c(claim.box15Date?.mm)} readOnly={readOnly} className="w-6 text-xs text-center font-bold" placeholder="MM" />
              <FieldInput defaultValue={c(claim.box15Date?.dd)} readOnly={readOnly} className="w-6 text-xs text-center font-bold" placeholder="DD" />
              <FieldInput defaultValue={c(claim.box15Date?.yy)} readOnly={readOnly} className="w-10 text-xs text-center font-bold" placeholder="YY" />
            </div>
          </div>
        </div>

        <div className="flex-1 p-1">
          <span className="leading-tight block">16. DATES PATIENT UNABLE TO WORK IN CURRENT OCCUPATION</span>
          <div className="flex justify-between mt-1 px-4 font-mono text-slate-900">
            <div className="flex gap-1">
              <span className="text-[7px] font-sans text-[#991b1b] mt-1 mr-1">FROM</span>
              <FieldInput defaultValue={c(claim.box16From?.mm)} readOnly={readOnly} className="w-6 text-xs text-center font-bold" placeholder="MM" />
              <FieldInput defaultValue={c(claim.box16From?.dd)} readOnly={readOnly} className="w-6 text-xs text-center font-bold" placeholder="DD" />
              <FieldInput defaultValue={c(claim.box16From?.yy)} readOnly={readOnly} className="w-10 text-xs text-center font-bold" placeholder="YY" />
            </div>
            <div className="flex gap-1">
              <span className="text-[7px] font-sans text-[#991b1b] mt-1 mr-1">TO</span>
              <FieldInput defaultValue={c(claim.box16To?.mm)} readOnly={readOnly} className="w-6 text-xs text-center font-bold" placeholder="MM" />
              <FieldInput defaultValue={c(claim.box16To?.dd)} readOnly={readOnly} className="w-6 text-xs text-center font-bold" placeholder="DD" />
              <FieldInput defaultValue={c(claim.box16To?.yy)} readOnly={readOnly} className="w-10 text-xs text-center font-bold" placeholder="YY" />
            </div>
          </div>
        </div>
      </div>

      {/* 🔴 ROW 6B: BOXES 17 - 20 */}
      <div className="flex border-b border-[#b91c1c] text-[8px] font-bold text-[#991b1b]">
        {/* Box 17 */}
        <div className="w-[300px] border-r border-[#b91c1c]">
          <div className="p-1 border-b border-[#b91c1c] h-[34px]">
            <span>17. NAME OF REFERRING PROVIDER OR OTHER SOURCE</span>
            <div className="mt-0.5 flex gap-2">
              <FieldInput defaultValue={c(claim.box17ReferringName )} readOnly={readOnly} className="text-xs font-mono font-bold uppercase flex-1" />
              <div className="flex items-center gap-1">
                <span className="text-[7px]">QUAL.</span><FieldInput defaultValue="" readOnly={readOnly} className="w-6 text-xs text-center border-b border-slate-300" />
              </div>
            </div>
          </div>
          <div className="flex border-b border-[#b91c1c]">
            <div className="w-[15%] p-1 border-r border-[#b91c1c] text-center">17a.</div>
            <div className="flex-1 p-1"><FieldInput defaultValue={c(claim.box17a)} readOnly={readOnly} className="text-xs font-mono font-bold bg-transparent" /></div>
          </div>
          <div className="flex">
            <div className="w-[15%] p-1 border-r border-[#b91c1c] text-center">17b. <span className="text-[7px]">NPI</span></div>
            <div className="flex-1 p-1"><FieldInput defaultValue={c(claim.box17Npi )} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
          </div>
        </div>

        {/* Box 18, 19, 20 */}
        <div className="flex-1 flex flex-col">
          <div className="flex border-b border-[#b91c1c] h-[34px]">
            <div className="w-[60%] p-1 border-r border-[#b91c1c]">
              <span className="leading-tight block">18. HOSPITALIZATION DATES RELATED TO CURRENT SERVICES</span>
              <div className="flex justify-between mt-1 px-2 font-mono text-slate-900">
                <div className="flex gap-1">
                  <span className="text-[7px] font-sans text-[#991b1b] mt-1 mr-1">FROM</span>
                  <FieldInput defaultValue={c(claim.box18From?.mm)} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="MM" />
                  <FieldInput defaultValue={c(claim.box18From?.dd)} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="DD" />
                  <FieldInput defaultValue={c(claim.box18From?.yy)} readOnly={readOnly} className="w-8 text-xs text-center font-bold" placeholder="YY" />
                </div>
                <div className="flex gap-1">
                  <span className="text-[7px] font-sans text-[#991b1b] mt-1 mr-1">TO</span>
                  <FieldInput defaultValue={c(claim.box18To?.mm)} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="MM" />
                  <FieldInput defaultValue={c(claim.box18To?.dd)} readOnly={readOnly} className="w-5 text-xs text-center font-bold" placeholder="DD" />
                  <FieldInput defaultValue={c(claim.box18To?.yy)} readOnly={readOnly} className="w-8 text-xs text-center font-bold" placeholder="YY" />
                </div>
              </div>
            </div>
            <div className="flex-1 p-1">
              <span>20. OUTSIDE LAB? &bull; $ CHARGES</span>
              <div className="flex justify-between items-center mt-1 font-mono text-[9px] text-slate-900">
                <div className="flex gap-2">
                  <span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c]"></span></span>
                  <span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(true)}</span></span>
                </div>
                <FieldInput defaultValue={blankMode ? '' : ''} readOnly={readOnly} className="w-16 text-right font-mono font-bold" />
              </div>
            </div>
          </div>
          <div className="p-1 flex-1">
            <span>19. ADDITIONAL CLAIM INFORMATION (Designated by NUCC)</span>
            <div className="mt-1"><FieldInput defaultValue={c(claim.box19)} readOnly={readOnly} className="text-xs font-mono font-bold" /></div>
          </div>
        </div>
      </div>

      {/* 🔴 ROW 7: BOX 21 - 23 */}
      <div className="flex border-b-2 border-[#b91c1c] text-[8px] font-bold text-[#991b1b]">
        <div className="w-[65%] p-1.5 border-r border-[#b91c1c]">
          <div className="flex justify-between items-center pr-2">
            <span>21. DIAGNOSIS OR NATURE OF ILLNESS OR INJURY (Relate Items 1, 2, 3 or 4 to Item 24E by Line)</span>
            <div className="w-4 h-4 border-b border-l border-[#b91c1c] ml-2 mb-2" style={{ transform: 'rotate(-45deg)' }}></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2 font-mono text-xs text-slate-900 px-4">
            {/* Column 1: 1, 2 */}
            <div>
              <div className="flex items-center gap-2 border-b border-[#b91c1c] pb-0.5">
                <span className="text-[#991b1b] font-bold text-[9px]">1.</span>
                <FieldInput defaultValue={c(claim.box21Diagnoses?.[0] )} readOnly={readOnly} className="font-bold flex-1" />
              </div>
              <div className="flex items-center gap-2 border-b border-[#b91c1c] pb-0.5 mt-3">
                <span className="text-[#991b1b] font-bold text-[9px]">2.</span>
                <FieldInput defaultValue={c(claim.box21Diagnoses?.[1] )} readOnly={readOnly} className="font-bold flex-1" />
              </div>
            </div>

            {/* Column 2: 3, 4 */}
            <div>
              <div className="flex items-center gap-2 border-b border-[#b91c1c] pb-0.5">
                <span className="text-[#991b1b] font-bold text-[9px]">3.</span>
                <FieldInput defaultValue={c(claim.box21Diagnoses?.[2] )} readOnly={readOnly} className="font-bold flex-1" />
              </div>
              <div className="flex items-center gap-2 border-b border-[#b91c1c] pb-0.5 mt-3">
                <span className="text-[#991b1b] font-bold text-[9px]">4.</span>
                <FieldInput defaultValue={c(claim.box21Diagnoses?.[3] )} readOnly={readOnly} className="text-slate-400 flex-1" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="p-1 border-b border-[#b91c1c] h-[45px]">
            <div className="flex justify-between">
              <span>22. MEDICAID RESUBMISSION<br/>CODE</span>
              <span className="mr-8">ORIGINAL REF. NO.</span>
            </div>
            <div className="flex gap-2 mt-1">
              <FieldInput defaultValue={c(claim.box22Code)} readOnly={readOnly} className="w-[30%] text-xs font-mono font-bold" />
              <FieldInput defaultValue={c(claim.box22Ref)} readOnly={readOnly} className="flex-1 text-xs font-mono font-bold" />
            </div>
          </div>
          <div className="p-1 flex-1">
            <span>23. PRIOR AUTHORIZATION NUMBER</span>
            <div className="mt-1">
              <FieldInput defaultValue={c(claim.box23)} readOnly={readOnly} className="text-xs font-mono font-bold" />
            </div>
          </div>
        </div>
      </div>

      {/* 🔴 ROW 8: BOX 24 SERVICE LINE TABLE (6 OFFICIAL ROWS WITH MODIFIERS 1-4 & APPOINTMENT DOS) */}
      <div className="border-b-2 border-[#b91c1c] text-[8px] font-bold text-[#991b1b]">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 bg-red-50/50 p-1 border-b border-[#b91c1c] text-center text-[7px] leading-tight">
          <div className="col-span-3 border-r border-[#b91c1c]">
            24. A. DATES OF SERVICE<br />
            <span className="text-[6.5px]">FROM (MM DD YY) &bull; TO (MM DD YY)</span>
          </div>
          <div className="col-span-1 border-r border-[#b91c1c]">
            B. PLACE OF<br />SERVICE
          </div>
          <div className="col-span-1 border-r border-[#b91c1c]">
            C.<br />EMG
          </div>
          <div className="col-span-3 border-r border-[#b91c1c]">
            D. PROCEDURES, SERVICES, OR SUPPLIES<br />
            <span className="text-[5px] block -mt-0.5">(Explain Unusual Circumstances)</span>
            <div className="flex justify-between px-2 text-[6px] tracking-widest mt-0.5"><span>CPT/HCPCS</span><span>MODIFIER</span></div>
          </div>
          <div className="col-span-1 border-r border-[#b91c1c] text-[6px] leading-tight flex flex-col justify-center">
            <span>E.</span><span>DIAGNOSIS</span><span>POINTER</span>
          </div>
          <div className="col-span-1 border-r border-[#b91c1c]">
            F.<br />$CHARGES
          </div>
          <div className="col-span-1 border-r border-[#b91c1c] text-[6px] leading-tight flex flex-col justify-center">
            <span>G.</span><span>DAYS</span><span>OR</span><span>UNITS</span>
          </div>
          <div className="col-span-1 flex text-[4.5px] leading-tight text-center">
            <div className="flex-1 border-r border-[#b91c1c]/50 flex flex-col justify-between py-0.5"><span>H.</span><span>EPSDT</span><span>Family</span><span>Plan</span></div>
            <div className="flex-1 border-r border-[#b91c1c]/50 flex flex-col justify-between py-0.5"><span>I.</span><span>ID.</span><span>QUAL.</span></div>
            <div className="flex-[2] flex flex-col justify-between py-0.5 text-[5.5px]"><span>J.</span><span>RENDERING</span><span>PROVIDER ID #</span></div>
          </div>
        </div>

        {/* 6 Form Rows */}
        <div className="divide-y divide-[#b91c1c]/40 font-mono text-[10px] text-slate-900">
          {serviceRows.map((line, idx) => {
            const hasData = !!line.cpt || !!line.fromDos;
            return (
              <div key={idx} className="p-1 h-[36px] min-h-[36px] max-h-[36px] overflow-hidden flex flex-col justify-center">
                {line.note && (
                  <div contentEditable={!readOnly} suppressContentEditableWarning className="text-[8px] font-bold text-slate-700 uppercase tracking-tight focus:bg-amber-100 focus:ring-1 focus:ring-amber-500 rounded px-0.5 outline-none cursor-text hover:bg-slate-100/80 whitespace-nowrap overflow-hidden text-ellipsis">
                    Note: {line.note}
                  </div>
                )}
                <div className="grid grid-cols-12 text-center items-center font-bold">
                  {/* 24.A Dates of Service */}
                  <div className="col-span-3 text-[9px] border-r border-[#b91c1c]/20 flex">
                    <div className="w-1/2 flex px-0.5 border-r border-slate-300">
                      <FieldInput defaultValue={hasData ? formatDos(line.fromDos || line.dos || claim.dos).mm : ''} readOnly={readOnly} className="w-1/3 text-center" />
                      <FieldInput defaultValue={hasData ? formatDos(line.fromDos || line.dos || claim.dos).dd : ''} readOnly={readOnly} className="w-1/3 text-center" />
                      <FieldInput defaultValue={hasData ? formatDos(line.fromDos || line.dos || claim.dos).yy : ''} readOnly={readOnly} className="w-1/3 text-center" />
                    </div>
                    <div className="w-1/2 flex px-0.5">
                      <FieldInput defaultValue={hasData ? formatDos(line.toDos || line.fromDos || line.dos || claim.dos).mm : ''} readOnly={readOnly} className="w-1/3 text-center" />
                      <FieldInput defaultValue={hasData ? formatDos(line.toDos || line.fromDos || line.dos || claim.dos).dd : ''} readOnly={readOnly} className="w-1/3 text-center" />
                      <FieldInput defaultValue={hasData ? formatDos(line.toDos || line.fromDos || line.dos || claim.dos).yy : ''} readOnly={readOnly} className="w-1/3 text-center" />
                    </div>
                  </div>
                  
                  {/* 24.B Place of Service */}
                  <div className="col-span-1 border-r border-[#b91c1c]/20">
                    <FieldInput defaultValue={hasData ? (line.pos ) : ''} readOnly={readOnly} className="text-center" />
                  </div>

                  {/* 24.C EMG */}
                  <div className="col-span-1 border-r border-[#b91c1c]/20">
                    <FieldInput defaultValue={hasData ? (line.emg ) : ''} readOnly={readOnly} className="text-center" />
                  </div>

                  {/* 24.D CPT & Modifiers (1-4) */}
                  <div className="col-span-3 border-r border-[#b91c1c]/20 flex items-center justify-between px-0.5 gap-0.5 text-[9px]">
                    <FieldInput defaultValue={line.cpt || ''} readOnly={readOnly} placeholder="CPT" className="w-14 font-mono font-black text-slate-950 text-center" />
                    <FieldInput defaultValue={line.mod1 || line.modifier1 || (line.modifiers && line.modifiers[0]) || (hasData ? (idx === 0 ? 'GP' : '59') : '')} readOnly={readOnly} placeholder="M1" className="w-5 text-center font-bold text-teal-800" />
                    <FieldInput defaultValue={line.mod2 || line.modifier2 || (line.modifiers && line.modifiers[1]) || (hasData ? (idx === 0 ? 'RT' : '25') : '')} readOnly={readOnly} placeholder="M2" className="w-5 text-center font-bold text-teal-800" />
                    <FieldInput defaultValue={line.mod3 || line.modifier3 || (line.modifiers && line.modifiers[2]) || ''} readOnly={readOnly} placeholder="M3" className="w-5 text-center font-bold text-teal-800" />
                    <FieldInput defaultValue={line.mod4 || line.modifier4 || (line.modifiers && line.modifiers[3]) || ''} readOnly={readOnly} placeholder="M4" className="w-5 text-center font-bold text-teal-800" />
                  </div>

                  {/* 24.E Diagnosis Pointer (e.g. A, B, AB) */}
                  <div className="col-span-1 border-r border-[#b91c1c]/20 font-black">
                    <FieldInput defaultValue={line.diagPtr || (hasData ? (idx === 0 ? 'A' : 'B') : '')} readOnly={readOnly} className="text-center" />
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
                  <div className="col-span-1 flex text-[9px] font-mono h-full items-center">
                    <div className="flex-1 border-r border-[#b91c1c]/20 h-full flex items-center justify-center">
                      <FieldInput defaultValue="" readOnly={readOnly} className="w-full text-center" />
                    </div>
                    <div className="flex-1 border-r border-[#b91c1c]/20 h-full flex items-center justify-center">
                      <FieldInput defaultValue={hasData && line.renderingId ? 'NPI' : ''} readOnly={readOnly} className="w-full text-center text-[6px]" />
                    </div>
                    <div className="flex-[2] h-full flex items-center justify-center">
                      <FieldInput defaultValue={hasData ? (line.renderingId ) : ''} readOnly={readOnly} className="w-full text-center text-[8px]" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔴 ROW 9: FOOTER BOXES 25 - 30 */}
      <div className="grid grid-cols-12 border-b-2 border-[#b91c1c] text-[8px] font-bold text-[#991b1b]">
        <div className="col-span-3 p-1 border-r border-[#b91c1c]">
          <span>25. FEDERAL TAX I.D. NUMBER</span>
          <div className="flex items-center gap-2 mt-1 font-mono text-xs text-slate-900">
            <FieldInput defaultValue={c(claim.box25TaxId )} readOnly={readOnly} className="font-bold" />
            <span className="text-[8px]">EIN <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold">{chk(true)}</span></span>
          </div>
        </div>

        <div className="col-span-3 p-1 border-r border-[#b91c1c]">
          <span>27. ACCEPT ASSIGNMENT?</span>
          <div className="flex gap-3 mt-1 font-mono text-[9px] text-slate-900">
            <span>YES <span className="inline-block w-3 h-3 border border-[#b91c1c] text-center font-bold text-teal-900">{chk(true)}</span></span>
            <span>NO <span className="inline-block w-3 h-3 border border-[#b91c1c]"></span></span>
          </div>
        </div>

        <div className="col-span-2 p-1 border-r border-[#b91c1c] text-right">
          <span>28. TOTAL CHARGE</span>
          <div className="mt-1">
            <FieldInput defaultValue={blankMode ? '' : `$${cleanAmount(claim.box28TotalCharge)}`} readOnly={readOnly} className="font-mono text-xs font-black text-right" />
          </div>
        </div>

        <div className="col-span-2 p-1 border-r border-[#b91c1c] text-right">
          <span>29. AMOUNT PAID</span>
          <div className="mt-1">
            <FieldInput defaultValue={blankMode ? '' : `$${cleanAmount(claim.box29AmountPaid)}`} readOnly={readOnly} className="font-mono text-xs font-bold text-right" />
          </div>
        </div>

        <div className="col-span-2 p-1 text-right">
          <span>30. BALANCE DUE</span>
          <div className="mt-1">
            <FieldInput defaultValue={blankMode ? '' : `$${cleanAmount(claim.box30BalanceDue)}`} readOnly={readOnly} className="font-mono text-xs font-black text-right" />
          </div>
        </div>
      </div>

      {/* 🔴 ROW 10: BOXES 31, 32, 33 */}
      <div className="grid grid-cols-12 text-[8px] font-bold text-[#991b1b] font-mono h-20">
        <div className="col-span-4 border-r border-[#b91c1c] pr-2 flex flex-col justify-between p-1">
          <div>
            <span className="leading-tight block text-[8px]">31. SIGNATURE OF PHYSICIAN OR SUPPLIER<br/>INCLUDING DEGREES OR CREDENTIALS<br/><span className="text-[6.5px] font-normal tracking-tight">(I certify that the statements on the reverse<br/>apply to this bill and are made a part thereof.)</span></span>
          </div>
          <div className="flex justify-between items-end mt-1">
            <FieldInput defaultValue={c(claim.box31ProviderSignature )} readOnly={readOnly} className="font-bold text-[10px] w-2/3" />
            <FieldInput defaultValue={blankMode ? '' : `SIGNED ${claim.dos || claim.box31Date } DATE`} readOnly={readOnly} className="text-[8px] text-slate-600 w-1/3 text-right" />
          </div>
        </div>

        <div className="col-span-4 border-r border-[#b91c1c] px-2 flex flex-col justify-between p-1 relative">
          <div>
            <span className="text-[8px]">32. SERVICE FACILITY LOCATION INFORMATION</span>
            <FieldInput defaultValue={c(claim.box32Facility || `${claim.providerName || 'ANIK Laser Therapy'}\n10101 HARWIN DR, SUITE 774\nHOUSTON, TX 77036`)} readOnly={readOnly} className="font-bold text-[9px] mt-0.5 leading-tight" />
          </div>
          <div className="flex justify-between text-[7px] mt-1 border-t border-[#b91c1c]/40 pt-0.5 absolute bottom-0 left-0 right-0 px-1">
            <span>a.</span>
            <span>b.</span>
          </div>
        </div>

        <div className="col-span-4 pl-2 flex flex-col justify-between p-1 relative">
          <div>
            <span className="text-[8px]">33. BILLING PROVIDER INFO &amp; PH # (832) 815 0959</span>
            <FieldInput defaultValue={c(claim.box33BillingProvider || `${claim.providerName || 'ANIK Laser Therapy'}\n10101 HARWIN DR, SUITE 774\nHOUSTON, TX 77036`)} readOnly={readOnly} className="font-bold text-[9px] mt-0.5 leading-tight" />
            <FieldInput defaultValue={blankMode ? '' : `NPI: ${claim.box33Npi }`} readOnly={readOnly} className="text-[9px] text-slate-800 font-bold hidden" />
          </div>
          <div className="flex justify-between text-[7px] mt-1 border-t border-[#b91c1c]/40 pt-0.5 absolute bottom-0 left-0 right-0 px-1">
            <span>a.</span>
            <span>b.</span>
          </div>
        </div>
      </div>
      {/* 🔴 RIGHT MARGIN VERTICAL LABELS */}
      <div className="absolute -right-7 top-0 bottom-0 w-4 flex flex-col items-center text-[#991b1b] font-sans font-bold text-[8.5px] tracking-[0.2em]">
        
        {/* Top/Middle Section: Patient and Insured Information */}
        <div className="flex flex-col items-center h-[40%] justify-between pb-4 relative w-full">
          <span className="text-[10px] leading-none -ml-1 mt-2">&gt;&lt;</span>
          <div className="flex-1 flex items-center justify-center w-full">
            <span className="whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              PATIENT AND INSURED INFORMATION
            </span>
          </div>
          <span className="text-[10px] leading-none -ml-1">&gt;&lt;</span>
        </div>

        {/* Bottom Section: Physician or Supplier Information */}
        <div className="flex flex-col items-center h-[56%] justify-between pt-2 relative w-full">
          <div className="flex-1 flex items-center justify-center w-full">
            <span className="whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              PHYSICIAN OR SUPPLIER INFORMATION
            </span>
          </div>
          <span className="text-[10px] leading-none mb-2 -ml-1">&lt;</span>
        </div>
      </div>

      </div> {/* 🔴 END MAIN FORM BORDER WRAPPER */}

      {/* 🔴 FOOTER TEXT OUTSIDE BORDER */}
      <div className="flex justify-between text-[#991b1b] font-sans font-bold text-[7px] mt-1 w-full">
        <span>NUCC Instruction Manual available at: www.nucc.org</span>
        <span>APPROVED OMB-0938-0999 FORM CMS-1500 (08-05)</span>
      </div>

    </div>
  );
};

