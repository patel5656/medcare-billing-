// src/components/packets/counselor/CounselorSessionNotesPart1Form.jsx
import React, { useState, useEffect } from 'react';
import { apiCaseService } from '../../../services/api/apiCaseService';
import fmCounselingLogo from '../../../assets/fm_counseling_logo.png';

export const CounselorSessionNotesPart1Form = ({ blankMode = false, packetData = null, bill = null, readOnly = false }) => {
  const docKey = 'FM_COUNSELING_FORM_6';
  const storage = packetData?.clinicalDocStorage?.[docKey] || {};

  // Database defaults & dynamic fallbacks from DB
  const dbNotes = packetData?.clinicalNotes || [];
  const dbLines = bill?.serviceLines || bill?.items || [];
  const dbSessions = packetData?.counselingSessions || packetData?.sessions || [];
  
  const getSessionDate = (index) => {
    return dbNotes[index]?.date || dbLines[index]?.dos || dbLines[index]?.dateOfService || dbSessions[index]?.date || dbSessions[index]?.dos || '';
  };

  const getSessionNote = (index) => {
    const n = dbNotes[index];
    if (n) {
      if (typeof n.content === 'object' && n.content !== null) {
        return n.content.clinicalProgress || n.content.narrative || n.content.chiefComplaint || '';
      }
      return n.soapSubjective || n.content || '';
    }
    return dbSessions[index]?.note || dbSessions[index]?.narrative || dbSessions[index]?.content || '';
  };

  const formatHeader = (idx, sessionNum) => {
    const d = getSessionDate(idx);
    return d ? `${d} – Individual psychotherapy, 60 minutes` : `Session ${sessionNum} – Individual psychotherapy, 60 minutes`;
  };

  // Form State for Sessions 3 through 8
  const [formData, setFormData] = useState({
    session3Header: storage.session3Header !== undefined ? storage.session3Header : formatHeader(2, 3),
    session3Text: storage.session3Text !== undefined ? storage.session3Text : getSessionNote(2),

    session4Header: storage.session4Header !== undefined ? storage.session4Header : formatHeader(3, 4),
    session4Text: storage.session4Text !== undefined ? storage.session4Text : getSessionNote(3),

    session5Header: storage.session5Header !== undefined ? storage.session5Header : formatHeader(4, 5),
    session5Text: storage.session5Text !== undefined ? storage.session5Text : getSessionNote(4),

    session6Header: storage.session6Header !== undefined ? storage.session6Header : formatHeader(5, 6),
    session6Text: storage.session6Text !== undefined ? storage.session6Text : getSessionNote(5),

    session7Header: storage.session7Header !== undefined ? storage.session7Header : formatHeader(6, 7),
    session7Text: storage.session7Text !== undefined ? storage.session7Text : getSessionNote(6),

    session8Header: storage.session8Header !== undefined ? storage.session8Header : formatHeader(7, 8),
    session8Text: storage.session8Text !== undefined ? storage.session8Text : getSessionNote(7),
  });

  useEffect(() => {
    if (!blankMode) {
      const s = packetData?.clinicalDocStorage?.[docKey] || {};
      setFormData({
        session3Header: s.session3Header !== undefined ? s.session3Header : formatHeader(2, 3),
        session3Text: s.session3Text !== undefined ? s.session3Text : getSessionNote(2),

        session4Header: s.session4Header !== undefined ? s.session4Header : formatHeader(3, 4),
        session4Text: s.session4Text !== undefined ? s.session4Text : getSessionNote(3),

        session5Header: s.session5Header !== undefined ? s.session5Header : formatHeader(4, 5),
        session5Text: s.session5Text !== undefined ? s.session5Text : getSessionNote(4),

        session6Header: s.session6Header !== undefined ? s.session6Header : formatHeader(5, 6),
        session6Text: s.session6Text !== undefined ? s.session6Text : getSessionNote(5),

        session7Header: s.session7Header !== undefined ? s.session7Header : formatHeader(6, 7),
        session7Text: s.session7Text !== undefined ? s.session7Text : getSessionNote(6),

        session8Header: s.session8Header !== undefined ? s.session8Header : formatHeader(7, 8),
        session8Text: s.session8Text !== undefined ? s.session8Text : getSessionNote(7),
      });
    }
  }, [packetData?.id, packetData?._id, bill?.id, blankMode]);

  const handleChange = async (field, value) => {
    if (readOnly || blankMode) return;
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    const caseId = packetData?.id || packetData?._id;
    if (caseId) {
      try {
        const currentStorage = packetData.clinicalDocStorage || {};
        const updatedDoc = { ...(currentStorage[docKey] || {}), [field]: value };
        const updatedStorage = { ...currentStorage, [docKey]: updatedDoc };
        await apiCaseService.updateCase(caseId, { clinicalDocStorage: updatedStorage });
        packetData.clinicalDocStorage = updatedStorage;
      } catch (err) {
        console.error('Failed to save FM Counseling Center Form 6 to DB:', err);
      }
    }
  };

  return (
    <div className="w-[800px] max-w-full relative bg-white text-slate-900 font-sans mx-auto border border-slate-300 shadow-md p-10 sm:p-14 flex flex-col min-h-[1050px] print:w-full print:max-w-none print:h-auto print:min-h-0 print:p-8 print:m-0 print:border-none print:shadow-none">
      
      {/* Top Header with FM Counseling Center Logo */}
      <div className="text-center mb-3">
        <div className="flex justify-center items-center gap-2 mb-1">
          <img 
            src={fmCounselingLogo} 
            alt="FM Counseling Center Logo" 
            className="h-20 w-auto object-contain mx-auto" 
          />
        </div>
      </div>

      {/* Session 3: 08/10/2026 */}
      <div className="mb-3.5">
        <div className="text-[11px] font-bold text-[#722F37] mb-1">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session3Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session3Header}
              onChange={(e) => handleChange('session3Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session3Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session3Text}
              onChange={(e) => handleChange('session3Text', e.target.value)}
              rows="3"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 4: 08/14/2026 */}
      <div className="mb-3.5">
        <div className="text-[11px] font-bold text-[#722F37] mb-1">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session4Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session4Header}
              onChange={(e) => handleChange('session4Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session4Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session4Text}
              onChange={(e) => handleChange('session4Text', e.target.value)}
              rows="4"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 5: 08/17/2026 */}
      <div className="mb-3.5">
        <div className="text-[11px] font-bold text-[#722F37] mb-1">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session5Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session5Header}
              onChange={(e) => handleChange('session5Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session5Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session5Text}
              onChange={(e) => handleChange('session5Text', e.target.value)}
              rows="5"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 6: 08/19/2026 */}
      <div className="mb-3.5">
        <div className="text-[11px] font-bold text-[#722F37] mb-1">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session6Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session6Header}
              onChange={(e) => handleChange('session6Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session6Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session6Text}
              onChange={(e) => handleChange('session6Text', e.target.value)}
              rows="4"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 7: 08/21/2026 */}
      <div className="mb-3.5">
        <div className="text-[11px] font-bold text-[#722F37] mb-1">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session7Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session7Header}
              onChange={(e) => handleChange('session7Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session7Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session7Text}
              onChange={(e) => handleChange('session7Text', e.target.value)}
              rows="4"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

      {/* Session 8: 08/24/2026 */}
      <div>
        <div className="text-[11px] font-bold text-[#722F37] mb-1">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session8Header}</p>
          ) : (
            <input
              type="text"
              value={blankMode ? '' : formData.session8Header}
              onChange={(e) => handleChange('session8Header', e.target.value)}
              className="w-full font-bold text-[#722F37] bg-transparent outline-none"
            />
          )}
        </div>
        <div className="text-[11px] leading-relaxed text-slate-700 text-justify">
          {readOnly ? (
            <p>{blankMode ? '' : formData.session8Text}</p>
          ) : (
            <textarea
              value={blankMode ? '' : formData.session8Text}
              onChange={(e) => handleChange('session8Text', e.target.value)}
              rows="4"
              className="w-full text-[11px] leading-relaxed text-slate-700 bg-transparent outline-none resize-none"
            />
          )}
        </div>
      </div>

    </div>
  );
};
