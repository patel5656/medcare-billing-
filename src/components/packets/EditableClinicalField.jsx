import React, { useState, useEffect } from 'react';
import { apiCaseService } from '../../services/api/apiCaseService';

/**
 * Scalable document-scoped persistence field for Clinical Packets.
 * Uses clinicalDocStorage JSON field on the Case object.
 */
export const EditableClinicalField = ({
  packetData,
  docKey,
  field,
  value,
  readOnly,
  minHeightClass = "min-h-[4rem]",
  className = "",
  inputType = "textarea"
}) => {
  const [val, setVal] = useState(value || '');

  useEffect(() => {
    setVal(value || '');
  }, [value]);

  if (readOnly) {
    if (inputType === 'input') {
      return <span className={`inline-block ${className}`}>{val}</span>;
    }
    return <p className={`${minHeightClass} whitespace-pre-wrap ${className}`}>{val}</p>;
  }

  const handleSave = async (newValue) => {
    if (!packetData || !packetData.id) return;
    
    try {
      const currentStorage = packetData.clinicalDocStorage || {};
      const docNamespace = currentStorage[docKey] || {};
      
      const updatedDoc = { ...docNamespace, [field]: newValue };
      const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
      
      await apiCaseService.updateCase(packetData.id, { clinicalDocStorage: updatedStorage });
      packetData.clinicalDocStorage = updatedStorage;
    } catch (err) {
      console.error(`Failed to save field ${field} to namespace ${docKey}`, err);
    }
  };

  if (inputType === 'input') {
    return (
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={(e) => {
          if (e.target.value !== (value || '')) {
            handleSave(e.target.value);
          }
        }}
        className={`bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded px-1 outline-none text-slate-800 cursor-text transition print:border-none print:bg-transparent print:p-0 print:shadow-none print:text-black ${className}`}
      />
    );
  }

  return (
    <textarea
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={(e) => {
        if (e.target.value !== (value || '')) {
          handleSave(e.target.value);
        }
      }}
      className={`w-full bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded px-1 outline-none text-slate-800 font-sans cursor-text transition resize-none mt-2 print:border-none print:bg-transparent print:p-0 print:shadow-none print:text-black ${minHeightClass} ${className}`}
    />
  );
};
