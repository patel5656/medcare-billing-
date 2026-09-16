// src/components/packets/common/PrintableBillingStatement.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/billingCalculations';
import { useSettings } from '../../../utils/settingsCache';

export const PrintableBillingStatement = ({ bill, pageIndex = 0, selectedCase = null }) => {
  const settings = useSettings();

  // Extract patient info from bill or selectedCase
  const pt = selectedCase?.patient || {};
  const patientName = bill?.patientName || selectedCase?.patientName || (pt.firstName ? `${pt.firstName || ''} ${pt.lastName || ''}`.trim() : '');
  
  const ptStreet = pt.street || pt.addressLine1 || '';
  const ptCity = pt.city || '';
  const ptState = pt.state || '';
  const ptZip = pt.zipCode || '';
  const casePtAddress = [ptStreet, ptCity, ptState, ptZip].filter(Boolean).join(', ');
  const patientAddress = bill?.patientAddress || casePtAddress || '';

  const patientSystemId = bill?.patientSystemId || pt.patientId || selectedCase?.patientId || '';
  const caseId = bill?.caseId || selectedCase?.caseId || selectedCase?.id || '';

  const patientIdCaseDisplay = () => {
    if (patientSystemId && caseId) return `${patientSystemId} (${caseId})`;
    if (patientSystemId) return patientSystemId;
    if (caseId) return caseId;
    return '';
  };

  const billToName = bill?.billToName || selectedCase?.attorneyName || selectedCase?.lawFirm || '';
  const billToAddress = bill?.billToAddress || selectedCase?.attorneyAddress || '';

  const providerName = bill?.providerName || 'JOSMIC WELLNESS CENTER';
  const providerAddress = bill?.providerAddress || '10101 HARWIN DR. SUITE 274, HOUSTON, TX 77036';
  const providerPhone = bill?.providerPhone || '713-485-5712';
  const statementNumber = bill?.statementNumber || '';
  const statementDate = bill?.statementDate || '';

  const rawLines = bill?.lineItems || bill?.serviceLines || [];
  
  const displayItems = (rawLines.length > 8
    ? (pageIndex === 0 ? rawLines.slice(0, 8) : rawLines.slice(8))
    : rawLines).map(item => {
      const charge = Number(item.charge) || 0;
      const insPay = Number(item.payments?.insurance || item.insurancePayment) || 0;
      const patPay = Number(item.payments?.patient || item.patientPayment) || 0;
      const adj = Number(item.adjustments) || 0;
      const lineBal = item.lineBalance !== undefined && item.lineBalance !== null
        ? Number(item.lineBalance)
        : Math.max(0, charge - (insPay + patPay + adj));
      return {
        ...item,
        dos: item.dos || item.dateOfService || '',
        cptCode: item.cptCode || '',
        description: item.description || '',
        charge,
        insPay,
        patPay,
        adj,
        lineBal
      };
    });

  const totalCharges = rawLines.reduce((sum, i) => sum + (Number(i.charge) || 0), 0);
  const totalInsPay = rawLines.reduce((sum, i) => sum + (Number(i.payments?.insurance || i.insurancePayment) || 0), 0);
  const totalPatPay = rawLines.reduce((sum, i) => sum + (Number(i.payments?.patient || i.patientPayment) || 0), 0);
  const totalAdj = rawLines.reduce((sum, i) => sum + (Number(i.adjustments) || 0), 0);

  const calculatedBalance = Math.max(0, totalCharges - (totalInsPay + totalPatPay + totalAdj));
  const balanceDue = bill?.totals?.balanceDue !== undefined && bill?.totals?.balanceDue !== null && bill?.totals?.balanceDue > 0
    ? Number(bill.totals.balanceDue)
    : calculatedBalance;

  const agingCurrent = Number(bill?.aging?.current) || 0;
  const aging30 = Number(bill?.aging?.past30) || 0;
  const aging60 = Number(bill?.aging?.past60) || 0;
  const aging90 = Number(bill?.aging?.past90) || 0;

  const sumAging = agingCurrent + aging30 + aging60 + aging90;
  const finalCurrentDue = (sumAging === 0 && balanceDue > 0) ? balanceDue : agingCurrent;

  return (
    <div
      className="relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 p-8 space-y-6 print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none"
      style={{ width: '100%', maxWidth: '850px', minHeight: '1100px' }}
    >
      {/* Statement Top Header */}
      <div className="flex justify-between items-start border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">{providerName}</h1>
          <p className="text-xs text-slate-600 mt-1">{providerAddress}</p>
          <p className="text-xs text-slate-600">TEL / CELL: {providerPhone} | FAX: 832-416-1502</p>
        </div>
        <div className="text-right font-mono">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Billing Statement</h2>
          <p className="text-xs font-bold text-slate-700 mt-1">Statement No: <span className="text-slate-900">{statementNumber}</span></p>
          <p className="text-xs font-semibold text-slate-600">Statement Date: {statementDate}</p>
          <p className="text-[10px] text-slate-500 font-bold mt-1">PAGE {pageIndex + 1} OF {rawLines.length > 8 ? 2 : 1}</p>
        </div>
      </div>

      {/* Bill To Box */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full sm:w-1/2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bill To:</p>
        <h3 className="text-sm font-bold text-slate-900 mt-0.5">{billToName}</h3>
        <p className="text-xs text-slate-700 whitespace-pre-line">{billToAddress}</p>
      </div>

      {/* Patient Details Banner */}
      <div className="grid grid-cols-3 gap-4 p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-[10px] font-bold text-slate-500 block">Patient Name:</span>
          <strong className="text-slate-900 font-bold">{patientName}</strong>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 block">Patient Address:</span>
          <span className="text-slate-800 truncate block">{patientAddress}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 block">Patient ID / Case:</span>
          <span className="font-mono font-bold text-slate-900">{patientIdCaseDisplay()}</span>
        </div>
      </div>

      {/* Service Line Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-300">
          <thead className="bg-slate-200 text-slate-800 uppercase font-bold text-[10px] border-b border-slate-300">
            <tr>
              <th className="p-2 border-r border-slate-300">Date of Service</th>
              <th className="p-2 border-r border-slate-300">Procedure</th>
              <th className="p-2 border-r border-slate-300">Description</th>
              <th className="p-2 text-right border-r border-slate-300">Charge</th>
              <th className="p-2 text-right border-r border-slate-300">Ins. Pay</th>
              <th className="p-2 text-right border-r border-slate-300">Pat. Pay</th>
              <th className="p-2 text-right border-r border-slate-300">Adjustment</th>
              <th className="p-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {displayItems.length > 0 ? (
              displayItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 font-tabular">
                  <td className="p-2 border-r border-slate-200 font-mono">{item.dos}</td>
                  <td className="p-2 border-r border-slate-200 font-bold">{item.cptCode}</td>
                  <td className="p-2 border-r border-slate-200">{item.description}</td>
                  <td className="p-2 text-right border-r border-slate-200 font-bold">{formatCurrency(item.charge)}</td>
                  <td className="p-2 text-right border-r border-slate-200 text-slate-600">{formatCurrency(item.insPay)}</td>
                  <td className="p-2 text-right border-r border-slate-200 text-slate-600">{formatCurrency(item.patPay)}</td>
                  <td className="p-2 text-right border-r border-slate-200 text-slate-600">{formatCurrency(item.adj)}</td>
                  <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(item.lineBal)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-4 text-center text-slate-400 font-mono">No service lines recorded for this statement.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Aging Grid Footer */}
      {pageIndex === (rawLines.length > 8 ? 1 : 0) && (
        <div className="pt-4 space-y-4">
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-center text-xs font-tabular">
              <thead className="bg-slate-200 font-bold text-[10px] uppercase text-slate-700">
                <tr>
                  <th className="p-2 border-r border-slate-300">Current Due</th>
                  <th className="p-2 border-r border-slate-300">Past Due 30 Days</th>
                  <th className="p-2 border-r border-slate-300">Past Due 60 Days</th>
                  <th className="p-2 border-r border-slate-300">Past Due 90 Days</th>
                  <th className="p-2 bg-slate-800 text-white">Balance Due</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold text-slate-900">
                  <td className="p-2.5 border-r border-slate-300">{formatCurrency(finalCurrentDue)}</td>
                  <td className="p-2.5 border-r border-slate-300">{formatCurrency(aging30)}</td>
                  <td className="p-2.5 border-r border-slate-300">{formatCurrency(aging60)}</td>
                  <td className="p-2.5 border-r border-slate-300">{formatCurrency(aging90)}</td>
                  <td className="p-2.5 bg-slate-100 text-slate-900 font-black text-sm">{formatCurrency(balanceDue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
