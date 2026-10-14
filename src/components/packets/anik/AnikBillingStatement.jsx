// src/components/packets/anik/AnikBillingStatement.jsx
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/billingCalculations';
import { apiCaseService } from '../../../services/api/apiCaseService';

/**
 * Format date string safely to MM/DD/YYYY
 */
const formatDateStr = (dateStr) => {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  // YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
  }
  // MM/DD/YYYY or similar
  return trimmed;
};

export const AnikBillingStatement = ({
  statementPage = 1,
  bill = null,
  selectedCase = null,
  readOnly = false,
  blankMode = false
}) => {
  const docKey = `ANIK_BILLING_PAGE_${statementPage}`;
  const storage = selectedCase?.clinicalDocStorage?.[docKey] || {};

  // Extract patient info from DB bill or selectedCase
  const pt = selectedCase?.patient || bill?.patient || {};
  const dbPatientName = bill?.patientName || selectedCase?.patientName || 
    (pt.firstName ? `${pt.firstName || ''} ${pt.lastName || ''}`.trim() : '') || 
    pt.name || '';

  const dbPatientId = bill?.patientSystemId || pt.patientId || 
    selectedCase?.patient?.patientId || selectedCase?.patientId || selectedCase?.id || '';

  // Extract Billed To info (Attorney / Payer) directly from DB
  const dbBillToName = bill?.billToName || selectedCase?.attorneyName || selectedCase?.lawFirm || selectedCase?.attorney || '';
  const dbBillToAddress = bill?.billToAddress || selectedCase?.attorneyAddress || selectedCase?.lawFirmAddress || '';

  // Extract Statement Number & Date directly from DB
  const dbStatementNumber = bill?.statementNumber || bill?.statementNo || bill?.billNumber || selectedCase?.statementNumber || '';
  const dbStatementDate = formatDateStr(bill?.statementDate || bill?.date || selectedCase?.incidentDate || selectedCase?.dateOfService || selectedCase?.initialDate || '');

  // Extract Clinic & Provider information directly from DB provider/bill
  const provAddr = bill?.provider?.address || {};
  const provContact = bill?.provider?.contact || {};
  const provIdentifiers = bill?.identifiers || bill?.provider?.identifiers || {};

  const providerName = bill?.providerName || bill?.provider?.name || 'FM Laser Therapy';
  
  const getDbProviderAddress = () => {
    if (bill?.providerAddress) return bill.providerAddress;
    const parts = [
      bill?.providerStreet || provAddr.street,
      bill?.providerSuite || provAddr.suite,
      [bill?.providerCity || provAddr.city, bill?.providerState || provAddr.state].filter(Boolean).join(', '),
      bill?.providerZip || provAddr.zipCode
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '9950 Westpark Dr, Suite 354, Houston, TX 77063';
  };
  const providerAddress = getDbProviderAddress();

  const providerPhone = bill?.providerPhone || provContact.phone || '713-485-5712';
  const providerCell = provContact.cell || '832-815-0959';
  const providerFax = provContact.fax || '832-416-1502';
  const providerTaxId = bill?.providerTaxId || provIdentifiers.taxId || '42-4352376';
  const providerNpi = bill?.providerNpi || provIdentifiers.npi || '1932847562';

  // Extract raw service lines from DB
  const rawLines = bill?.serviceLines || bill?.lineItems || bill?.items || selectedCase?.serviceLines || selectedCase?.items || [];
  
  // Compute itemized display lines and calculate fallback totals if DB bill.totals is absent
  let calcCharges = 0;
  let calcInsPay = 0;
  let calcPatPay = 0;
  let calcAdj = 0;

  const displayItems = rawLines.map(item => {
    const units = Number(item.units) || 1;
    const unitCharge = Number(item.charge) || 0;
    const lineBal = Number(item.lineBalance !== undefined && item.lineBalance !== null ? item.lineBalance : item.balance) || 0;
    
    // Line total charge: accounts for unit multipliers so ledger matches DB totals
    const lineCharge = (lineBal > unitCharge && units > 1)
      ? (units * unitCharge)
      : (item.totalCharge !== undefined ? Number(item.totalCharge) : (units > 1 ? units * unitCharge : unitCharge));

    const insPay = Number(item.payments?.insurance || item.insurancePayment || item.insPay) || 0;
    const patPay = Number(item.payments?.patient || item.patientPayment || item.patPay) || 0;
    const adj = Number(item.adjustments || item.adjustment || item.adj) || 0;

    calcCharges += lineCharge;
    calcInsPay += insPay;
    calcPatPay += patPay;
    calcAdj += adj;

    return {
      ...item,
      dos: formatDateStr(item.dos || item.dateOfService || item.date || ''),
      cptCode: item.cptCode || item.cpt || '',
      description: item.description || item.serviceDescription || '',
      units,
      charge: lineCharge,
      insPay,
      patPay,
      adj,
      lineBal: lineBal || Math.max(0, lineCharge - (insPay + patPay + adj))
    };
  });

  // DB Totals: Directly pull from bill.totals stored in DB
  const dbTotals = bill?.totals || {};
  const totalCharges = Number(dbTotals.totalCharges !== undefined && Number(dbTotals.totalCharges) > 0 ? dbTotals.totalCharges : calcCharges) || 0;
  const totalInsPay = Number(dbTotals.totalInsurancePayments !== undefined ? dbTotals.totalInsurancePayments : (dbTotals.insurancePayment || calcInsPay)) || 0;
  const totalPatPay = Number(dbTotals.totalPatientPayments !== undefined ? dbTotals.totalPatientPayments : (dbTotals.patientPayment || calcPatPay)) || 0;
  const totalAdj = Number(dbTotals.totalAdjustments !== undefined ? dbTotals.totalAdjustments : calcAdj) || 0;
  
  const rawBalance = Number(dbTotals.balanceDue !== undefined && Number(dbTotals.balanceDue) > 0
    ? dbTotals.balanceDue
    : (bill?.balanceDue !== undefined && Number(bill.balanceDue) > 0
        ? bill.balanceDue
        : Math.max(0, totalCharges - (totalInsPay + totalPatPay + totalAdj)))) || 0;

  const dbTotalBalance = formatCurrency(rawBalance);

  // Compute Service Dates Range from DB
  const getDbServiceDates = () => {
    const dates = [];
    if (Array.isArray(rawLines) && rawLines.length > 0) {
      rawLines.forEach(item => {
        const d = item.dos || item.dateOfService || item.date;
        if (d && !dates.includes(d)) dates.push(d);
      });
    }
    if (dates.length === 0 && selectedCase?.accidentDate) {
      dates.push(selectedCase.accidentDate);
    }
    if (dates.length === 0 && bill?.statementDate) {
      dates.push(bill.statementDate);
    }

    if (dates.length === 0) return '09/08/2026 - 09/16/2026';
    const formattedList = dates.map(formatDateStr).sort();
    if (formattedList.length === 1) return formattedList[0];
    if (formattedList[0] === formattedList[formattedList.length - 1]) return formattedList[0];
    return `${formattedList[0]} - ${formattedList[formattedList.length - 1]}`;
  };
  const dbServiceDates = getDbServiceDates();

  // Aging Summary from DB
  const agingCurrent = Number(bill?.aging?.current !== undefined ? bill.aging.current : rawBalance) || 0;
  const aging30 = Number(bill?.aging?.past30) || 0;
  const aging60 = Number(bill?.aging?.past60) || 0;
  const aging90 = Number(bill?.aging?.past90) || 0;

  // Form State initialized with DB values
  const [formData, setFormData] = useState({
    patientName: storage.patientName !== undefined ? storage.patientName : (blankMode ? '' : dbPatientName),
    patientId: storage.patientId !== undefined ? storage.patientId : (blankMode ? '' : dbPatientId),
    billToName: storage.billToName !== undefined ? storage.billToName : (blankMode ? '' : dbBillToName),
    billToAddress: storage.billToAddress !== undefined ? storage.billToAddress : (blankMode ? '' : dbBillToAddress),
    serviceDates: storage.serviceDates !== undefined ? storage.serviceDates : (blankMode ? '' : dbServiceDates),
    statementNumber: storage.statementNumber !== undefined ? storage.statementNumber : (blankMode ? '' : dbStatementNumber),
    statementDate: storage.statementDate !== undefined ? storage.statementDate : (blankMode ? '' : dbStatementDate),
    totalBalance: storage.totalBalance !== undefined ? storage.totalBalance : (blankMode ? '' : dbTotalBalance),
  });

  useEffect(() => {
    if (blankMode) {
      setFormData({
        patientName: '',
        patientId: '',
        billToName: '',
        billToAddress: '',
        serviceDates: '',
        statementNumber: '',
        statementDate: '',
        totalBalance: '',
      });
    } else {
      const s = selectedCase?.clinicalDocStorage?.[docKey] || {};
      setFormData({
        patientName: s.patientName !== undefined ? s.patientName : dbPatientName,
        patientId: s.patientId !== undefined ? s.patientId : dbPatientId,
        billToName: s.billToName !== undefined ? s.billToName : dbBillToName,
        billToAddress: s.billToAddress !== undefined ? s.billToAddress : dbBillToAddress,
        serviceDates: s.serviceDates !== undefined ? s.serviceDates : dbServiceDates,
        statementNumber: s.statementNumber !== undefined ? s.statementNumber : dbStatementNumber,
        statementDate: s.statementDate !== undefined ? s.statementDate : dbStatementDate,
        totalBalance: s.totalBalance !== undefined ? s.totalBalance : dbTotalBalance,
      });
    }
  }, [
    selectedCase?.id, 
    selectedCase?._id, 
    selectedCase?.patientName, 
    bill?.id, 
    bill?.statementNumber, 
    bill?.totals?.balanceDue,
    bill?.totals?.totalCharges,
    blankMode, 
    statementPage
  ]);

  const handleFieldChange = async (field, value) => {
    if (readOnly) return;
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    const caseId = selectedCase?.id || selectedCase?._id;
    if (caseId) {
      try {
        const currentStorage = selectedCase.clinicalDocStorage || {};
        const updatedDoc = { ...(currentStorage[docKey] || {}), [field]: value };
        const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
        await apiCaseService.updateCase(caseId, { clinicalDocStorage: updatedStorage });
        selectedCase.clinicalDocStorage = updatedStorage;
      } catch (err) {
        console.error('Failed to auto-save Anik Billing Statement:', err);
      }
    }
  };

  // PAGE 1: Statement Summary Card (Exact match to User's Specification & 100% DB Integrated)
  if (statementPage === 1) {
    return (
      <div
        className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 sm:p-12 space-y-8 flex flex-col justify-between print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-8 print:m-0 print:border-none print:shadow-none"
        style={{ width: '850px', minHeight: '1100px' }}
      >
        <div className="space-y-8 flex-1 flex flex-col">
          {/* Header matching user image */}
          <div className="text-center pt-4">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-wider uppercase">
              LASER THERAPY
            </h1>
            <h2 className="text-2xl sm:text-3xl font-black text-[#722F37] tracking-wider mt-1.5 uppercase">
              BILLING STATEMENT
            </h2>
            <div className="w-56 sm:w-80 h-[2.5px] bg-[#722F37] mx-auto mt-4 rounded-full"></div>
          </div>

          {/* User's Exact Card Layout (All fields from DB) */}
          <div className="rounded-2xl border border-[#eed8dc] bg-[#fdf9fa] p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
              {/* Left Column: PATIENT */}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#722F37] block mb-1">
                  PATIENT
                </span>
                {blankMode ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={formData.patientName}
                      onChange={(e) => handleFieldChange('patientName', e.target.value)}
                      placeholder="Patient Name"
                      disabled={readOnly}
                      className="w-full text-base font-bold text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1 outline-none focus:border-[#722F37]"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-semibold">Patient ID:</span>
                      <input
                        type="text"
                        value={formData.patientId}
                        onChange={(e) => handleFieldChange('patientId', e.target.value)}
                        placeholder="Patient ID"
                        disabled={readOnly}
                        className="w-full text-xs text-slate-700 bg-white border border-slate-300 rounded px-2 py-0.5 outline-none focus:border-[#722F37]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {formData.patientName || 'No Patient Recorded'}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                      Patient ID: {formData.patientId || 'N/A'}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: BILLED TO */}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#722F37] block mb-1">
                  BILLED TO
                </span>
                {blankMode ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={formData.billToName}
                      onChange={(e) => handleFieldChange('billToName', e.target.value)}
                      placeholder="Attorney / Firm Name"
                      disabled={readOnly}
                      className="w-full text-base font-bold text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1 outline-none focus:border-[#722F37]"
                    />
                    <input
                      type="text"
                      value={formData.billToAddress}
                      onChange={(e) => handleFieldChange('billToAddress', e.target.value)}
                      placeholder="Attorney Address"
                      disabled={readOnly}
                      className="w-full text-xs text-slate-700 bg-white border border-slate-300 rounded px-2 py-0.5 outline-none focus:border-[#722F37]"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {formData.billToName || 'Personal Injury Settlement'}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 whitespace-pre-line">
                      {formData.billToAddress || 'On File'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Line Inside Card */}
            <div className="border-t border-[#eed8dc] my-6"></div>

            {/* Bottom 3 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
              {/* SERVICE DATES */}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#722F37] block mb-1">
                  SERVICE DATES
                </span>
                {blankMode ? (
                  <input
                    type="text"
                    value={formData.serviceDates}
                    onChange={(e) => handleFieldChange('serviceDates', e.target.value)}
                    placeholder="MM/DD/YYYY - MM/DD/YYYY"
                    disabled={readOnly}
                    className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-[#722F37]"
                  />
                ) : (
                  <div className="text-sm sm:text-base font-bold text-slate-900">
                    {formData.serviceDates || 'N/A'}
                  </div>
                )}
              </div>

              {/* STATEMENT NO. */}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#722F37] block mb-1">
                  STATEMENT NO.
                </span>
                {blankMode ? (
                  <input
                    type="text"
                    value={formData.statementNumber}
                    onChange={(e) => handleFieldChange('statementNumber', e.target.value)}
                    placeholder="Statement No"
                    disabled={readOnly}
                    className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-[#722F37]"
                  />
                ) : (
                  <div className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                    {formData.statementNumber || 'N/A'}
                  </div>
                )}
              </div>

              {/* TOTAL BALANCE */}
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#722F37] block mb-1">
                  TOTAL BALANCE
                </span>
                {blankMode ? (
                  <input
                    type="text"
                    value={formData.totalBalance}
                    onChange={(e) => handleFieldChange('totalBalance', e.target.value)}
                    placeholder="$0.00"
                    disabled={readOnly}
                    className="w-full text-base font-black text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-[#722F37]"
                  />
                ) : (
                  <div className="text-base sm:text-xl font-black text-slate-900">
                    {formData.totalBalance || dbTotalBalance}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Provider Remittance & Financial Overview (From DB) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <span className="text-[10px] font-extrabold text-[#722F37] uppercase tracking-wider block">
                REMITTANCE & CLINIC INFORMATION
              </span>
              <p className="font-bold text-slate-900 text-sm uppercase">{providerName}</p>
              <p className="text-slate-600">{providerAddress}</p>
              <p className="text-slate-600">TEL: {providerPhone} • CELL: {providerCell} • FAX: {providerFax}</p>
              <p className="text-slate-600 font-mono text-[11px]">TAX ID: {providerTaxId} | NPI: {providerNpi}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="text-[10px] font-extrabold text-[#722F37] uppercase tracking-wider block">
                ACCOUNT SUMMARY
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Total Billed Charges:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totalCharges)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Insurance Payments:</span>
                  <span>{formatCurrency(totalInsPay)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Patient Payments:</span>
                  <span>{formatCurrency(totalPatPay)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Contract Adjustments:</span>
                  <span>{formatCurrency(totalAdj)}</span>
                </div>
                <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-slate-900 text-xs">
                  <span>Current Balance Due:</span>
                  <span className="text-[#722F37] font-black">{formData.totalBalance || formatCurrency(rawBalance)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal / Lien Notice */}
          <div className="p-4 bg-[#fdf9fa] rounded-xl border border-[#eed8dc] text-[11px] text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800 mb-1">
              NOTICE TO COUNSEL / THIRD PARTY PAYER:
            </p>
            <p>
              This statement represents specialized medical laser therapy rendered pursuant to an active Letter of Protection (LOP) and healthcare provider lien on file. Please protect our medical lien upon settlement, verdict, or recovery. Remit payments payable to <strong className="text-slate-900">{providerName}</strong> referencing Statement No. <strong className="text-slate-900 font-mono">{formData.statementNumber || dbStatementNumber}</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 font-mono gap-2 mt-auto">
          <span>{providerName} • Official Provider Statement</span>
          <span className="font-bold text-slate-700 tracking-wider">PAGE 1 OF 2 — STATEMENT SUMMARY</span>
          <span>Statement Date: {formData.statementDate || dbStatementDate}</span>
        </div>
      </div>
    );
  }

  // PAGE 2: Itemized Service Line Ledger & Aging Summary (100% DB Integrated)
  return (
    <div
      className="w-[850px] max-w-full relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 sm:p-10 space-y-6 flex flex-col justify-between print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-8 print:m-0 print:border-none print:shadow-none"
      style={{ width: '850px', minHeight: '1100px' }}
    >
      <div className="space-y-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#722F37] pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              {providerName}
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {providerAddress}
            </p>
            <p className="text-xs text-slate-600">
              TEL: {providerPhone} • CELL: {providerCell} • FAX: {providerFax}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl sm:text-2xl font-black text-[#722F37] uppercase tracking-tight">
              BILLING STATEMENT
            </h2>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              Statement No: <span className="font-mono text-slate-950 font-black">{formData.statementNumber || dbStatementNumber}</span>
            </p>
            <p className="text-xs font-semibold text-slate-600">
              Statement Date: {formData.statementDate || dbStatementDate}
            </p>
            <p className="text-[11px] font-bold text-[#722F37] mt-0.5 tracking-wider">
              PAGE 2 OF 2 — SERVICE LINE LEDGER
            </p>
          </div>
        </div>

        {/* Patient & Case Summary Banner */}
        <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#fdf9fa] rounded-xl border border-[#eed8dc] text-xs">
          <div>
            <span className="text-[10px] font-bold text-[#722F37] uppercase tracking-wider block">Patient:</span>
            <strong className="text-slate-900 text-sm font-bold truncate block">{formData.patientName || 'No Patient Recorded'}</strong>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#722F37] uppercase tracking-wider block">Patient ID / Case:</span>
            <span className="text-slate-800 font-mono font-bold text-xs">{formData.patientId || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#722F37] uppercase tracking-wider block">Billed To:</span>
            <span className="text-slate-800 font-medium text-xs truncate block">{formData.billToName || 'Personal Injury Settlement'}</span>
          </div>
        </div>

        {/* Itemized Service Line Table */}
        <div className="overflow-x-auto border border-slate-300 rounded-lg shadow-sm flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#722F37] text-white uppercase font-bold text-[11px] border-b border-[#722F37]">
              <tr>
                <th className="p-2.5 border-r border-[#8d3a44] w-[14%]">Date of Service</th>
                <th className="p-2.5 border-r border-[#8d3a44] w-[11%]">Procedure</th>
                <th className="p-2.5 border-r border-[#8d3a44] w-[27%]">Description</th>
                <th className="p-2.5 text-right border-r border-[#8d3a44] w-[12%]">Charge</th>
                <th className="p-2.5 text-right border-r border-[#8d3a44] w-[12%]">Ins. Pay</th>
                <th className="p-2.5 text-right border-r border-[#8d3a44] w-[12%]">Pat. Pay</th>
                <th className="p-2.5 text-right border-r border-[#8d3a44] w-[12%]">Adjustment</th>
                <th className="p-2.5 text-right w-[10%]">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-tabular">
              {displayItems.length > 0 ? (
                displayItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 border-r border-slate-200 font-mono text-xs whitespace-nowrap">{item.dos}</td>
                    <td className="p-2.5 border-r border-slate-200 font-bold font-mono text-xs">{item.cptCode}</td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-800 font-medium">
                      {item.description}
                      {item.units > 1 && !item.description?.includes('Session') && (
                        <span className="text-[10px] text-slate-500 font-bold ml-1">({item.units} units)</span>
                      )}
                    </td>
                    <td className="p-2.5 text-right border-r border-slate-200 font-bold text-slate-900">{formatCurrency(item.charge)}</td>
                    <td className="p-2.5 text-right border-r border-slate-200 text-slate-700">{formatCurrency(item.insPay)}</td>
                    <td className="p-2.5 text-right border-r border-slate-200 text-slate-700">{formatCurrency(item.patPay)}</td>
                    <td className="p-2.5 text-right border-r border-slate-200 text-slate-700">{formatCurrency(item.adj)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900 bg-slate-50/60">{formatCurrency(item.lineBal)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-mono text-xs">
                    No service lines recorded for this statement.
                  </td>
                </tr>
              )}
            </tbody>
            {displayItems.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                <tr>
                  <td colSpan={3} className="p-2.5 text-right border-r border-slate-300 uppercase tracking-wider text-slate-700">
                    Total Statement Charges:
                  </td>
                  <td className="p-2.5 text-right border-r border-slate-300 font-black text-slate-900">
                    {formatCurrency(totalCharges)}
                  </td>
                  <td className="p-2.5 text-right border-r border-slate-300 text-slate-700">
                    {formatCurrency(totalInsPay)}
                  </td>
                  <td className="p-2.5 text-right border-r border-slate-300 text-slate-700">
                    {formatCurrency(totalPatPay)}
                  </td>
                  <td className="p-2.5 text-right border-r border-slate-300 text-slate-700">
                    {formatCurrency(totalAdj)}
                  </td>
                  <td className="p-2.5 text-right font-black text-[#722F37] bg-rose-50/50">
                    {formData.totalBalance || formatCurrency(rawBalance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Aging Grid Footer */}
      <div className="pt-2 space-y-4 mt-auto">
        <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-center text-xs font-tabular">
            <thead className="bg-[#722F37] text-white font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-2.5 border-r border-[#8d3a44]">Current Due</th>
                <th className="p-2.5 border-r border-[#8d3a44]">Past Due 30 Days</th>
                <th className="p-2.5 border-r border-[#8d3a44]">Past Due 60 Days</th>
                <th className="p-2.5 border-r border-[#8d3a44]">Past Due 90 Days</th>
                <th className="p-2.5 bg-[#5e252d] text-white font-bold">Total Balance Due</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr className="font-bold text-slate-900 text-xs sm:text-sm">
                <td className="p-3 border-r border-slate-300 font-mono">{formatCurrency(agingCurrent)}</td>
                <td className="p-3 border-r border-slate-300 font-mono">{formatCurrency(aging30)}</td>
                <td className="p-3 border-r border-slate-300 font-mono">{formatCurrency(aging60)}</td>
                <td className="p-3 border-r border-slate-300 font-mono">{formatCurrency(aging90)}</td>
                <td className="p-3 bg-slate-100 text-[#722F37] font-black text-sm sm:text-base">
                  {formData.totalBalance || formatCurrency(rawBalance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs text-slate-500 font-mono">
          <span>{providerName} • Service Line Itemization</span>
          <span className="font-bold text-slate-700">PAGE 2 OF 2 — ITEMIZED SERVICE LINES</span>
          <span>Statement #{formData.statementNumber || dbStatementNumber}</span>
        </div>
      </div>
    </div>
  );
};
