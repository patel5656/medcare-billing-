// src/components/packets/josmic/JosmicCoverPage.jsx
import React from 'react';
import { EditableClinicalField } from '../EditableClinicalField';
import fmLogo from '../../../assets/fm-logo.jpeg';

export const JosmicCoverPage = ({ readOnly = false, blankMode = false, packetData = null, bill = null, serviceLines = [] }) => {
  const storage = packetData?.clinicalDocStorage?.JOSMIC_COVER || {};

  const getField = (field) => {
    if (blankMode) return '';
    if (!packetData) return '';
    if (storage[field] !== undefined) return storage[field];
    if (field === 'patientName') return packetData.patientName || '';
    if (field === 'dob') return packetData.patient?.dob || packetData.patientDob || '';
    if (field === 'accidentDate') return packetData.accidentDate || '';
    if (field === 'initialDate') return packetData.initialDate || '';
    if (field === 'dischargeDate') return packetData.dischargeDate || '';
    return '';
  };

  const getCmsDos = () => {
    if (blankMode) return '';
    const lineDos = serviceLines && serviceLines.length > 0 ? (serviceLines[0].dos || serviceLines[0].dateOfService) : null;
    const billDos = lineDos || bill?.statementDate;
    return billDos || '';
  };

  const getSignatureDate = () => {
    if (blankMode) return '';
    return packetData?.dischargeDate || bill?.statementDate || packetData?.signedAt || '';
  };

  const defaultStatement = "This clinical packet has been prepared by FM Health and Wellness Center and includes all relevant billing, claim, and clinical documentation pertaining to the above-referenced patient case. All records are maintained in compliance with applicable federal and state health information regulations.";
  const statementText = blankMode ? '' : (storage.statementText !== undefined ? storage.statementText : defaultStatement);
  
  const savedSig = storage.providerSignature || (storage.providerName && storage.providerName.startsWith('data:image') ? storage.providerName : '');
  const providerSignature = blankMode ? '' : savedSig;

  const defaultProvName = packetData?.referringProviderName || packetData?.providerName || packetData?.attendingProviderName || '';
  const savedName = (storage.providerName && !storage.providerName.startsWith('data:image')) ? storage.providerName : defaultProvName;
  const providerName = blankMode ? '' : savedName;

  const signatureDate = blankMode ? '' : (storage.signatureDate !== undefined ? storage.signatureDate : getSignatureDate());

  return (
    <div className="relative bg-white text-slate-900 font-sans shadow-2xl mx-auto border border-slate-300 print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-0 print:m-0 print:border-none print:shadow-none" style={{ width: '100%', maxWidth: '850px', minHeight: '1100px', padding: '48px 56px' }}>

      {/* Top Header with FM Health and Wellness Center Logo */}
      <div className="text-center mb-3">
        <div className="flex justify-center mb-2">
          <img 
            src={fmLogo} 
            alt="FM Health and Wellness Center Logo" 
            className="h-28 w-auto object-contain mx-auto mix-blend-multiply" 
          />
        </div>
        <h1 className="text-2xl font-black text-slate-950 tracking-tight">FM HEALTH AND WELLNESS CENTER</h1>
        <p className="text-[11px] text-slate-600 mt-1">9900 WESTPARK DR, HOUSTON, TX 77063</p>
        <p className="text-[11px] text-slate-600 mt-0.5 underline">OFFICE: 713-485-5712 &nbsp;•&nbsp; FAX: 832-416-1502</p>
      </div>

      {/* Horizontal divider */}
      <div className="border-t border-slate-400 my-4"></div>

      {/* Patient Information Block */}
      <div className="bg-slate-100 border border-slate-300 p-5 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 whitespace-nowrap">NAME:</span>
            <div className="flex-1 border-b border-slate-400 min-w-[120px] text-slate-900">
              <EditableClinicalField
                packetData={packetData}
                docKey="JOSMIC_COVER"
                field="patientName"
                value={getField('patientName')}
                placeholder="Patient Name"
                readOnly={readOnly || blankMode}
                inputType="input"
                className="w-full font-mono text-xs bg-transparent hover:bg-slate-200/50 focus:bg-white rounded px-1 outline-none text-slate-900 font-bold"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 whitespace-nowrap">Date of Birth:</span>
            <div className="flex-1 border-b border-slate-400 min-w-[100px] text-slate-900">
              <EditableClinicalField
                packetData={packetData}
                docKey="JOSMIC_COVER"
                field="dob"
                value={getField('dob')}
                placeholder="YYYY-MM-DD"
                readOnly={readOnly || blankMode}
                inputType="input"
                className="w-full font-mono text-xs bg-transparent hover:bg-slate-200/50 focus:bg-white rounded px-1 outline-none text-slate-900"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 whitespace-nowrap">Date of Accident:</span>
            <div className="flex-1 border-b border-slate-400 text-slate-900">
              <EditableClinicalField
                packetData={packetData}
                docKey="JOSMIC_COVER"
                field="accidentDate"
                value={getField('accidentDate')}
                placeholder="YYYY-MM-DD"
                readOnly={readOnly || blankMode}
                inputType="input"
                className="w-full font-mono text-xs bg-transparent hover:bg-slate-200/50 focus:bg-white rounded px-1 outline-none text-slate-900"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 whitespace-nowrap">Initial Date:</span>
            <div className="flex-1 border-b border-slate-400 text-slate-900">
              <EditableClinicalField
                packetData={packetData}
                docKey="JOSMIC_COVER"
                field="initialDate"
                value={getField('initialDate')}
                placeholder="YYYY-MM-DD"
                readOnly={readOnly || blankMode}
                inputType="input"
                className="w-full font-mono text-xs bg-transparent hover:bg-slate-200/50 focus:bg-white rounded px-1 outline-none text-slate-900"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 whitespace-nowrap">Discharge Date:</span>
            <div className="flex-1 border-b border-slate-400 text-slate-900">
              <EditableClinicalField
                packetData={packetData}
                docKey="JOSMIC_COVER"
                field="dischargeDate"
                value={getField('dischargeDate')}
                placeholder="YYYY-MM-DD"
                readOnly={readOnly || blankMode}
                inputType="input"
                className="w-full font-mono text-xs bg-transparent hover:bg-slate-200/50 focus:bg-white rounded px-1 outline-none text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Packet Document Index */}
      <div className="border border-slate-300 p-5 mb-6">
        <h3 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-2 mb-3 text-xs tracking-wide">PACKET DOCUMENT INDEX</h3>
        <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 text-xs font-mono">
          <li>Patient &amp; Accident Cover Sheet</li>
          <li>Billing Statement</li>
          <li>CMS-1500 Claim Form (DOS: {getCmsDos()})</li>
          <li>Pain Management Evaluation Report (Page 1)</li>
          <li>Pain Management Evaluation Report (Page 2)</li>
          <li>Pain Management Evaluation Report (Page 3)</li>
          <li>Pain Management Evaluation Report (Page 4 - Signatures)</li>
        </ol>
      </div>

      {/* Statement of Accuracy */}
      <div className="border border-slate-300 p-5 mt-auto">
        <EditableClinicalField
          packetData={packetData}
          docKey="JOSMIC_COVER"
          field="statementText"
          value={statementText}
          placeholder="Statement of accuracy..."
          readOnly={readOnly || blankMode}
          inputType="textarea"
          minHeightClass="min-h-[28px]"
          className="text-[11px] text-slate-600 leading-relaxed bg-transparent hover:bg-slate-100/60 focus:bg-white rounded px-1 outline-none mt-0 print:text-[11px]"
        />
        <div className="mt-6 grid grid-cols-2 gap-8 text-xs font-mono">
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 min-h-[50px] flex flex-col justify-end">
              <EditableClinicalField
                packetData={packetData}
                docKey="JOSMIC_COVER"
                field="providerSignature"
                value={providerSignature}
                placeholder="Click to Sign"
                readOnly={readOnly || blankMode}
                inputType="signature"
                className="h-8 max-w-[240px]"
              />
              <EditableClinicalField
                packetData={packetData}
                docKey="JOSMIC_COVER"
                field="providerName"
                value={providerName}
                placeholder="Authorized Provider Name"
                readOnly={readOnly || blankMode}
                inputType="input"
                className="w-full font-mono text-xs text-slate-900 font-bold bg-transparent hover:bg-slate-200/50 focus:bg-white rounded px-1 outline-none mt-0.5"
              />
            </div>
            <p className="text-slate-600 mt-1">Authorized Provider Signature</p>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-1 mb-1 min-h-[50px] flex flex-col justify-end">
              <EditableClinicalField
                packetData={packetData}
                docKey="JOSMIC_COVER"
                field="signatureDate"
                value={signatureDate}
                placeholder="YYYY-MM-DD"
                readOnly={readOnly || blankMode}
                inputType="input"
                className="w-full font-mono text-xs bg-transparent hover:bg-slate-200/50 focus:bg-white rounded px-1 outline-none text-slate-900"
              />
            </div>
            <p className="text-slate-600 mt-1">Date</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 px-12 flex justify-between text-[9px] text-slate-400 font-mono border-t border-slate-200 pt-2 mt-6">
        <span>FM Health and Wellness Center - Confidential Clinical Document</span>
        <span>Page 1 of 7</span>
      </div>
    </div>
  );
};
