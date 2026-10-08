// src/components/packets/counselor/CounselorCoverPage.jsx
import React from 'react';

export const CounselorCoverPage = ({ blankMode = false, packetData = null, bill = null }) => {
  const getField = (field) => {
    if (blankMode) return '';
    if (!packetData) return '';
    if (field === 'patientName') return packetData.patientName || '';
    if (field === 'dob') return packetData.patient?.dob || packetData.patientDob || '';
    if (field === 'gender') return packetData.patient?.gender || packetData.patient?.sex || packetData.patientSex || '';
    if (field === 'accidentDate') return packetData.accidentDate || '';
    if (field === 'initialDate') return packetData.initialDate || '';
    if (field === 'accidentType') return packetData.accidentType || '';
    
    if (field === 'totalVisits') {
      return packetData.clinicalNotes ? packetData.clinicalNotes.length : '';
    }
    
    return '';
  };

  const providerName = blankMode || !packetData ? '' : (packetData.referringProviderName || packetData.providerName || packetData.attendingProviderName || 'Jordan Miller, LCSW, BCD');
  const providerTitle = blankMode || !packetData ? '' : (packetData.providerTitle || packetData.providerCredentials || '');
  const npi = packetData?.providerNpi || packetData?.npi || '1487965213';
  const taxId = packetData?.taxId || '748291039';
  const lic = packetData?.licenseNo || packetData?.providerLicense || '';
  const npiLicText = blankMode || !packetData ? '' : ([npi ? `NPI: ${npi}` : '', lic ? `State Lic # ${lic}` : ''].filter(Boolean).join(' | '));
  
  const totalCharges = bill && bill.totals ? `$${parseFloat(bill.totals.totalCharges || 0).toFixed(2)}` : '';

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans mx-auto border border-slate-300 p-10 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      
      {/* Centered Header */}
      <div className="text-center mb-5 mt-4">
        <h1 className="text-3xl font-bold text-[#722F37] tracking-wider mb-2" style={{ fontFamily: 'serif' }}>HOPE BEHAVIORAL HEALTH &amp; COUNSELING</h1>
        <p className="text-[13px] italic text-slate-700 mb-1">Healing Minds. Restoring Confidence. Moving Forward.</p>
        <p className="text-[12px] text-slate-700">10101 Harwin Dr. Ste 774-C, Houston, TX 77036</p>
        <p className="text-[12px] text-slate-700">713-485-9988 &bull; intake@hopebehavioral.com</p>
      </div>

      <div className="border-t border-[#722F37] mb-5"></div>

      <div className="text-center mb-5">
        <h2 className="text-[15px] font-bold text-[#722F37] tracking-wider">PSYCHIATRIC DIAGNOSTIC EVALUATION</h2>
        <p className="text-[12px] text-slate-600 mt-0.5">Behavioral Health Evaluation &bull; Counseling &bull; Progress Notes</p>
      </div>

      <div className="border-t border-[#d3b8b8] mb-6"></div>

      {/* Patient Information Block */}
      <div className="border border-[#d3b8b8] rounded-sm mb-6 bg-[#eed8d8]">
        <div className="border-b border-[#d3b8b8] px-4 py-2">
          <h3 className="text-[12px] font-bold text-[#722F37] tracking-wider">PATIENT INFORMATION</h3>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-12 gap-y-4 font-mono text-xs bg-white">
          <div className="flex justify-between items-center border-b-2 border-[#d3b8b8] border-dotted pb-2">
            <span className="text-[#722F37]">Patient Name:</span>
            <span className="font-bold text-slate-900">{getField('patientName')}</span>
          </div>
          <div className="flex justify-between items-center border-b-2 border-[#d3b8b8] border-dotted pb-2">
            <span className="text-[#722F37]">Date of Birth:</span>
            <span className="font-bold text-slate-900">{getField('dob')}</span>
          </div>
          <div className="flex justify-between items-center border-b-2 border-[#d3b8b8] border-dotted pb-2">
            <span className="text-[#722F37]">Gender:</span>
            <span className="font-bold text-slate-900">{getField('gender')}</span>
          </div>
          <div className="flex justify-between items-center border-b-2 border-[#d3b8b8] border-dotted pb-2">
            <span className="text-[#722F37]">Date of Accident:</span>
            <span className="font-bold text-slate-900">{getField('accidentDate')}</span>
          </div>
          <div className="flex justify-between items-center border-b-2 border-[#d3b8b8] border-dotted pb-2">
            <span className="text-[#722F37]">Initial Assessment:</span>
            <span className="font-bold text-slate-900">{getField('initialDate')}</span>
          </div>
          <div className="flex justify-between items-center border-b-2 border-[#d3b8b8] border-dotted pb-2">
            <span className="text-[#722F37]">Final Treatment Review:</span>
            <span className="font-bold text-slate-900"></span>
          </div>
          <div className="flex justify-between items-center border-b-2 border-[#d3b8b8] border-dotted pb-2">
            <span className="text-[#722F37]">Total Visits:</span>
            <span className="font-bold text-slate-900">{getField('totalVisits')}</span>
          </div>
        </div>
      </div>

      {/* Treatment Summary Block */}
      <div className="border border-[#d3b8b8] rounded-sm mb-10">
        <div className="border-b border-[#d3b8b8] px-4 py-2 flex justify-between items-center bg-[#eed8d8]">
          <h3 className="text-[12px] font-bold text-[#722F37] tracking-wider">TREATMENT SUMMARY</h3>
          <span className="text-[10px] text-[#722F37]">HOPE BEHAVIORAL HEALTH &amp; COUNSELING | 10101 Harwin Dr. Ste 774-C, Houston...</span>
        </div>
        
        <div className="p-5 bg-white">
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 font-mono text-xs mb-5">
            <div className="flex items-center gap-2">
              <span className="text-[#722F37]">Patient:</span>
              <span className="font-bold text-slate-900">{getField('patientName')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#722F37]">DOB:</span>
              <span className="font-bold text-slate-900">{getField('dob')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#722F37]">Date of Accident:</span>
              <span className="font-bold text-slate-900">{getField('accidentDate')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#722F37]">Accident Type:</span>
              <span className="font-bold text-slate-900">{getField('accidentType')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#722F37]">Treating Provider:</span>
              <span className="font-bold text-slate-900">{providerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#722F37]">Total Visits:</span>
              <span className="font-bold text-slate-900">{getField('totalVisits')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#722F37]">NPI:</span>
              <span className="font-bold text-slate-900">{npi} <span className="text-slate-300 mx-1">|</span> Tax ID: {taxId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#722F37]">Treatment Period:</span>
              <span className="font-bold text-slate-900">{getField('initialDate')}</span>
            </div>
          </div>
          
          <div className="border-t border-[#d3b8b8] pt-3 flex items-center gap-2 font-mono text-xs">
            <span className="text-[#722F37] font-bold">Total Charges:</span>
            <span className="font-bold text-slate-900">{totalCharges}</span>
          </div>
        </div>
      </div>

      {/* Summary of Counseling Textarea */}
      <div className="mb-6">
        <h3 className="text-[13px] font-bold text-[#722F37] mb-2">Summary of Counseling / Post-Accident Emotional Recovery Services</h3>
        <textarea 
          className="w-full border border-[#d3b8b8] bg-[#eed8d8] rounded-sm p-3 text-xs text-slate-900 resize-none outline-none focus:border-[#722F37]"
          rows="3"
          placeholder="Enter summary of post-accident behavioral-health counseling services..."
          defaultValue={!blankMode && packetData?.counselingSummary ? packetData.counselingSummary : ''}
        ></textarea>
      </div>

      {/* 
      // Service Overview Details
      <div className="mb-6">
        <h3 className="text-[13px] font-bold text-[#722F37] mb-2">Service Overview Details</h3>
        <ul className="list-disc pl-5 text-[11px] font-mono text-slate-800 space-y-1.5 mb-4">
          {(!blankMode && bill && (bill.serviceLines?.length > 0 || bill.items?.length > 0)) ? (
            (bill.serviceLines?.length > 0 ? bill.serviceLines : bill.items).map((line, idx) => {
              const code = line.cptCode || line.code;
              let label = code;
              if (code === '90791') label = 'Initial Evaluation';
              else if (code && code.startsWith('908')) label = 'Individual Psychotherapy';
              
              return (
                <li key={idx}>
                  <strong>{label}:</strong> {line.description || line.service} - {line.dos || getField('initialDate')}
                </li>
              );
            })
          ) : null}
          <li><strong>Progress Notes:</strong> Progress notes associated with the documented treatment visits</li>
        </ul>

        // Services Table
        <div className="border border-[#d3b8b8] text-[11px] font-mono">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eed8d8] border-b border-[#d3b8b8] text-[#722F37]">
                <th className="p-2 border-r border-[#d3b8b8] font-bold w-[15%]">Code</th>
                <th className="p-2 border-r border-[#d3b8b8] font-bold">Service</th>
                <th className="p-2 border-r border-[#d3b8b8] font-bold text-center w-[12%]">Units</th>
                <th className="p-2 border-r border-[#d3b8b8] font-bold text-center w-[12%]">Rate</th>
                <th className="p-2 font-bold text-center w-[15%]">Total</th>
              </tr>
            </thead>
            <tbody>
              {(!blankMode && bill && (bill.serviceLines?.length > 0 || bill.items?.length > 0)) ? (
                (bill.serviceLines?.length > 0 ? bill.serviceLines : bill.items).map((line, idx) => (
                  <tr key={idx} className="border-b border-[#d3b8b8] bg-white">
                    <td className="p-2 border-r border-[#d3b8b8] font-bold text-[#722F37]">{line.cptCode || line.code}</td>
                    <td className="p-2 border-r border-[#d3b8b8] text-slate-800">{line.description || line.service}</td>
                    <td className="p-2 border-r border-[#d3b8b8] text-center text-slate-800">{line.units || 1}</td>
                    <td className="p-2 border-r border-[#d3b8b8] text-right text-slate-800">{line.charge ? `$${parseFloat(line.charge).toFixed(2)}` : ''}</td>
                    <td className="p-2 text-right text-slate-800">{line.total ? `$${parseFloat(line.total).toFixed(2)}` : ''}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-[#d3b8b8] bg-white">
                  <td colSpan="5" className="p-4 text-center text-[#722F37] italic">
                    {blankMode ? '' : 'No billable services recorded in database yet.'}
                  </td>
                </tr>
              )}
              // Footer row
              <tr className="bg-[#eed8d8]">
                <td colSpan="2" className="p-2 border-r border-[#d3b8b8] text-right font-bold text-[#722F37]">TOTAL</td>
                <td className="p-2 border-r border-[#d3b8b8] text-center"></td>
                <td className="p-2 border-r border-[#d3b8b8] text-right"></td>
                <td className="p-2 text-right font-bold text-[#722F37]">{totalCharges}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      */}

      {/* 
      // Recommendations Textarea
      <div className="mb-4">
        <textarea 
          className="w-full border border-[#d3b8b8] bg-[#eed8d8] rounded-sm p-3 text-xs text-slate-900 resize-none outline-none focus:border-[#722F37]"
          rows="2"
          placeholder="Enter counseling course recommendations..."
          defaultValue={!blankMode && packetData?.counselingRecommendations ? packetData.counselingRecommendations : ''}
        ></textarea>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-bold text-[#722F37]">Supporting Documentation: Progress Notes &bull; Evaluation &bull; Billing Statement</p>
      </div>
      */}

      {/* Attestation */}
      <div className="mt-auto pt-6 border-t border-[#722F37] flex justify-between items-end text-xs font-mono">
        <div>
          <p className="font-bold text-[#722F37]">{providerName}</p>
          <p className="text-[#722F37]">{providerTitle}</p>
          <p className="text-[#722F37]">{npiLicText}</p>
        </div>
        <div className="text-right">
          <p className="border-b border-[#722F37] w-48 mb-1 pb-1 font-cursive italic text-[#722F37] font-bold">{providerName}</p>
          <p className="text-[#722F37] text-[10px]">AUTHORIZED SIGNATURE</p>
        </div>
      </div>
    </div>
  );
};
