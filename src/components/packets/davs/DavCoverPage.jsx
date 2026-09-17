// src/components/packets/davs/DavCoverPage.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/billingCalculations';

export const DavCoverPage = ({ 
  packetData = null, 
  blankMode = false, 
  readOnly = false,
  bill = null,
  serviceLines = [],
  cmsClaims = []
}) => {
  // Patient Name
  const patientName = blankMode || !packetData ? '' : (packetData.patientName || (packetData.patient ? `${packetData.patient.firstName || ''} ${packetData.patient.lastName || ''}`.trim() : '') || packetData.patient?.name || '');

  // Patient System ID (no internal db id, no N/A)
  const patientSystemId = blankMode || !packetData ? '' : (packetData.patient?.patientId || packetData.patientId || packetData.patientSystemId || packetData.patient?.patientSystemId || packetData.systemId || packetData.patientNumber || packetData.patient?.patientNumber || packetData.mrn || packetData.patient?.mrn || '');

  // Accident Date
  const accidentDate = blankMode || !packetData ? '' : (packetData.accidentDate || packetData.dateOfAccident || packetData.patient?.accidentDate || '');

  // Total Bill Balance
  const getBalanceText = () => {
    if (blankMode || !packetData) return '';
    const balanceVal = bill?.balanceDue !== undefined && bill?.balanceDue !== null 
      ? bill.balanceDue 
      : (bill?.totalCharges !== undefined && bill?.totalCharges !== null 
          ? bill.totalCharges 
          : (packetData?.totalBillBalance !== undefined && packetData?.totalBillBalance !== null 
              ? packetData.totalBillBalance 
              : (packetData?.balance !== undefined && packetData?.balance !== null 
                  ? packetData.balance 
                  : null)));

    if (balanceVal !== null && balanceVal !== undefined && balanceVal !== '') {
      if (typeof balanceVal === 'number') return formatCurrency(balanceVal);
      if (!isNaN(Number(balanceVal))) return formatCurrency(Number(balanceVal));
      return String(balanceVal);
    }
    return '';
  };
  const totalBillBalance = getBalanceText();

  // Dynamic Service Dates for Document Index
  const getUniqueDates = () => {
    if (blankMode) return [];
    const dates = new Set();

    const lines = (serviceLines && serviceLines.length > 0)
      ? serviceLines
      : (bill?.items || bill?.serviceLines || packetData?.serviceLines || packetData?.items || []);

    if (Array.isArray(lines) && lines.length > 0) {
      lines.forEach(line => {
        const d = line.dos || line.dateOfService || line.date;
        if (d) dates.add(d);
      });
    }

    if (dates.size === 0 && Array.isArray(cmsClaims) && cmsClaims.length > 0) {
      cmsClaims.forEach(claim => {
        if (claim.dos) dates.add(claim.dos);
      });
    }

    if (dates.size === 0 && Array.isArray(packetData?.procedures) && packetData.procedures.length > 0) {
      packetData.procedures.forEach(proc => {
        const d = proc.dos || proc.dateOfService;
        if (d) dates.add(d);
      });
    }

    return Array.from(dates);
  };
  const uniqueDates = getUniqueDates();

  const getCmsDos = (idx) => {
    if (blankMode) return '';
    if (cmsClaims && cmsClaims[idx]?.dos) return cmsClaims[idx].dos;
    return uniqueDates[idx] || '';
  };

  const getEswtDos = (idx) => {
    if (blankMode) return '';
    if (packetData?.procedures && packetData.procedures[idx]?.dos) return packetData.procedures[idx].dos;
    if (packetData?.procedures && packetData.procedures[idx]?.dateOfService) return packetData.procedures[idx].dateOfService;
    return uniqueDates[idx] || '';
  };

  return (
    <div className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 flex flex-col print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '850px', minHeight: '1100px' }}>
      
      {/* Provider Branding Header */}
      <div className="text-center border-b-2 border-slate-900 pb-6">
        <h1 className="text-2xl font-black uppercase text-teal-800 tracking-tight">DAV'S ANATOMY</h1>
        <p className="text-xs font-bold text-slate-600">10101 HARWIN DR. SUITE 274 HOUSTON TX 77036</p>
        <p className="text-xs text-slate-600">CELL: 832-815-0959 | FAX: 832-416-1502</p>
      </div>

      {/* Demographics Box */}
      <div className="bg-slate-100 p-6 rounded-xl border border-slate-300 space-y-4 font-mono text-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase border-b border-slate-300 pb-2">DAV'S ANATOMY - CLINICAL PACKET COVER SHEET (14 PAGES)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>PATIENT: <strong>{patientName}</strong></div>
          <div>SYSTEM ID: <strong>{patientSystemId}</strong></div>
          <div>ACCIDENT DATE: <strong>{accidentDate}</strong></div>
          <div>TOTAL BILL BALANCE: <strong className="text-teal-700 font-black text-sm">{totalBillBalance}</strong></div>
        </div>
      </div>

      {/* Packet Document Index */}
      <div className="border border-slate-300 rounded-xl p-6 space-y-3 font-mono text-xs">
        <h3 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">PACKET DOCUMENT INDEX</h3>
        <ol className="list-decimal pl-4 space-y-1 text-slate-700">
          <li>Patient &amp; Accident Cover Sheet</li>
          <li>Billing Statement Page 1</li>
          <li>Billing Statement Continuation Page 2</li>
          <li>CMS-1500 Claim Form{getCmsDos(0) ? ` (DOS: ${getCmsDos(0)})` : ''}</li>
          <li>CMS-1500 Claim Form{getCmsDos(1) ? ` (DOS: ${getCmsDos(1)})` : ''}</li>
          <li>CMS-1500 Claim Form{getCmsDos(2) ? ` (DOS: ${getCmsDos(2)})` : ''}</li>
          <li>Clinical Progress Note (Page 1)</li>
          <li>Clinical Progress Note (Page 2)</li>
          <li>ESWT Procedure Log Form{getEswtDos(0) ? ` (DOS: ${getEswtDos(0)})` : ''}</li>
          <li>ESWT Procedure Log Form{getEswtDos(1) ? ` (DOS: ${getEswtDos(1)})` : ''}</li>
          <li>ESWT Procedure Log Form{getEswtDos(2) ? ` (DOS: ${getEswtDos(2)})` : ''}</li>
          <li>Shockwave Therapy Narrative Report (Page 1)</li>
          <li>Shockwave Therapy Narrative Report (Page 2)</li>
          <li>Shockwave Therapy Narrative Report (Page 3)</li>
        </ol>
      </div>

    </div>
  );
};
