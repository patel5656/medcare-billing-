import React, { useState, useEffect, useRef } from 'react';
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
  placeholder = "",
  minHeightClass = "min-h-[4rem]",
  className = "",
  inputType = "textarea"
}) => {
  const [val, setVal] = useState(value || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canvasRef = useRef(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    setVal(value || '');
  }, [value]);

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

  const handleSignatureSave = () => {
    if (canvasRef.current && hasDrawn) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setVal(dataUrl);
      handleSave(dataUrl);
    }
    setIsModalOpen(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const removeSignature = () => {
    setVal('');
    handleSave('');
    setIsModalOpen(false);
  };

  const handleMouseMove = (e) => {
    if (e.buttons !== 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  if (inputType === 'signature') {
    const isBase64 = val && val.startsWith('data:image');
    
    if (readOnly) {
      if (isBase64) {
        return (
          <div className={`flex items-end ${className}`}>
            <img src={val} alt="Signature" className="h-8 max-w-[220px] object-contain" />
          </div>
        );
      }
      return <span className={`inline-block font-bold ${className}`}>{val}</span>;
    }

    return (
      <>
        <div
          onClick={() => setIsModalOpen(true)}
          className={`cursor-pointer hover:bg-amber-100/60 rounded px-1 transition flex items-end min-h-[28px] ${className}`}
          title="Click to Draw Signature"
        >
          {isBase64 ? (
            <img src={val} alt="Signature" className="h-8 max-w-full object-contain" />
          ) : val ? (
            <span className="font-bold text-slate-800 text-xs font-mono">{val}</span>
          ) : (
            <span className="text-[11px] text-amber-700/70 italic font-sans hover:text-amber-800 print:hidden">
              {placeholder || 'Click to Sign'}
            </span>
          )}
        </div>

        {isModalOpen && (
          <div
            className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <div className="bg-white p-5 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex justify-between items-center font-sans uppercase">
                <span>Draw Authorized Signature</span>
                <div className="flex gap-3">
                  {val && (
                    <button
                      type="button"
                      onClick={removeSignature}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </h3>

              <div className="border-2 border-dashed border-teal-300 rounded-xl bg-slate-50 mb-4 overflow-hidden flex items-center justify-center relative cursor-crosshair">
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-sans">
                    Sign with mouse or touch here
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={160}
                  className="w-full touch-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-xs font-bold font-sans rounded-xl text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSignatureSave}
                  className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold font-sans rounded-xl shadow-sm hover:bg-emerald-700 cursor-pointer"
                >
                  Apply Signature
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (readOnly) {
    if (inputType === 'input') {
      return <span className={`inline-block ${className}`}>{val}</span>;
    }
    return <p className={`${minHeightClass} whitespace-pre-wrap ${className}`}>{val}</p>;
  }

  if (inputType === 'input') {
    return (
      <input
        type="text"
        placeholder={placeholder}
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
      placeholder={placeholder}
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
