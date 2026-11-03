// src/components/packets/common/AiAutoDraftToolbar.jsx
import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

/**
 * Universal Reusable AI Auto-Draft Toolbar for Clinical Packets and Forms.
 * Automatically hidden on print/PDF.
 */
export const AiAutoDraftToolbar = ({
  title = "AI Clinical Scribe Assistant",
  badge = "Auto-Draft",
  subtitle = "Auto-synthesize clinical documentation from patient case context & ICD-10 diagnoses",
  buttonLabel = "Auto-Draft with AI",
  generatingLabel = "Generating with AI...",
  onDraft,
  readOnly = false,
  hasExistingContent = false,
  overwriteWarningMessage = "You already have clinical notes in this form. Generating with AI will update the section(s) with a fresh synthesized draft. Do you want to proceed?"
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (readOnly) return null;

  const handleClick = async () => {
    if (typeof onDraft !== 'function' || isGenerating) return;

    if (hasExistingContent) {
      const confirmOverwrite = window.confirm(overwriteWarningMessage);
      if (!confirmOverwrite) return;
    }

    setIsGenerating(true);
    try {
      await onDraft();
    } catch (err) {
      console.error('Error during AI auto-draft:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-teal-50 via-indigo-50 to-purple-50 border border-teal-200/90 rounded-xl px-4 py-2.5 shadow-sm print:hidden mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <Sparkles className="w-4 h-4 text-amber-300" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-900 tracking-tight">{title}</span>
            {badge && (
              <span className="text-[9px] font-mono font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">{subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={isGenerating}
        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        title="Auto-fill with AI"
      >
        {isGenerating ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        )}
        <span>{isGenerating ? generatingLabel : `✨ ${buttonLabel}`}</span>
      </button>
    </div>
  );
};
