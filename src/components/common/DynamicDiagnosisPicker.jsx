import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Activity, Check, Edit2, Loader2, Save } from 'lucide-react';
import { getAllICDCodes, createICDCode, updateICDCode, deleteICDCode } from '../../services/api/apiIcdService';

const POINTER_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const DynamicDiagnosisPicker = ({ selectedCodes = [], onChange, label = "ICD-10 Diagnosis Codes (CMS Box 21 Alignment)" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [codes, setCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editCode, setEditCode] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      setIsLoading(true);
      const data = await getAllICDCodes();
      setCodes(data);
    } catch (error) {
      console.error('Failed to load ICD codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = codes.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleCode = (codeStr) => {
    let current = Array.isArray(selectedCodes) ? [...selectedCodes] : [];
    if (current.includes(codeStr)) {
      current = current.filter(c => c !== codeStr);
    } else {
      if (current.length >= 12) {
        alert('Maximum 12 ICD-10 diagnosis codes can be mapped per CMS-1500 claim standard (Box 21 A-L).');
        return;
      }
      current.push(codeStr);
    }
    onChange(current);
  };

  const handleRemoveCode = (codeStr) => {
    const current = (Array.isArray(selectedCodes) ? selectedCodes : []).filter(c => c !== codeStr);
    onChange(current);
  };

  const handleAddCode = async (e) => {
    if (e) e.preventDefault();
    if (!customCode.trim()) return;

    try {
      const formattedCode = customCode.trim().toUpperCase();
      const newEntry = await createICDCode({
        code: formattedCode,
        description: customDesc.trim() || 'Custom diagnosis description'
      });
      
      setCodes(prev => [...prev, newEntry].sort((a, b) => a.code.localeCompare(b.code)));
      
      if (!selectedCodes.includes(formattedCode)) {
        onChange([...selectedCodes, formattedCode]);
      }

      setCustomCode('');
      setCustomDesc('');
      setShowAddCustom(false);
    } catch (error) {
      alert(error.message || 'Failed to add ICD code');
    }
  };

  const handleUpdateCode = async (id) => {
    try {
      const updatedCode = await updateICDCode(id, {
        code: editCode.trim().toUpperCase(),
        description: editDesc.trim(),
      });

      setCodes(prev => prev.map(c => c.id === id ? updatedCode : c));
      
      // Update selectedCodes if the code string changed
      const oldCode = codes.find(c => c.id === id)?.code;
      if (oldCode && oldCode !== updatedCode.code && selectedCodes.includes(oldCode)) {
        onChange(selectedCodes.map(c => c === oldCode ? updatedCode.code : c));
      }

      setEditingId(null);
    } catch (error) {
      alert(error.message || 'Failed to update ICD code');
    }
  };

  const handleDeleteCode = async (id, codeStr, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete ICD code ${codeStr}?`)) return;

    try {
      await deleteICDCode(id);
      setCodes(prev => prev.filter(c => c.id !== id));
      handleRemoveCode(codeStr);
    } catch (error) {
      alert(error.message || 'Failed to delete ICD code');
    }
  };

  const startEdit = (e, item) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditCode(item.code);
    setEditDesc(item.description);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-teal-600" />
          <span>{label}</span>
          <span className="text-[10px] font-normal text-slate-500">
            ({selectedCodes.length}/12 Mapped)
          </span>
        </label>
        
        <button
          type="button"
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> {showAddCustom ? 'Close Code Entry' : '+ Add New ICD-10 Code'}
        </button>
      </div>

      {/* Selected Diagnosis Badges */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px] flex flex-wrap items-center gap-2">
        {selectedCodes.length === 0 ? (
          <span className="text-xs text-slate-400 italic">
            No diagnosis codes selected yet. Click from the suggestions below or type to search/add custom codes.
          </span>
        ) : (
          selectedCodes.map((codeStr, idx) => {
            const letter = POINTER_LETTERS[idx] || `${idx + 1}`;
            const matched = codes.find(c => c.code === codeStr);
            return (
              <span
                key={codeStr}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-teal-300 shadow-2xs rounded-lg text-xs text-slate-900 font-semibold"
              >
                <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-extrabold flex items-center justify-center font-mono">
                  {letter}
                </span>
                <span className="font-mono font-bold text-teal-900">{codeStr}</span>
                {matched && (
                  <span className="text-slate-500 text-[11px] max-w-[140px] truncate hidden md:inline">
                    {matched.description}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveCode(codeStr)}
                  className="p-0.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 cursor-pointer"
                  title="Remove diagnosis"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* Inline Code Creator */}
      {showAddCustom && (
        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900">Add New ICD-10 Code to Database</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <input
                type="text"
                value={customCode}
                onChange={e => setCustomCode(e.target.value)}
                placeholder="ICD Code (e.g. M54.16)"
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border border-teal-300 bg-white text-teal-950 focus:ring-1 focus:ring-teal-600 outline-none"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <input
                type="text"
                value={customDesc}
                onChange={e => setCustomDesc(e.target.value)}
                placeholder="Diagnosis Description"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-teal-300 bg-white text-slate-900 focus:ring-1 focus:ring-teal-600 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCode()}
              />
              <button
                type="button"
                onClick={handleAddCode}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-2xs whitespace-nowrap cursor-pointer"
              >
                Add Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Suggestions Picker */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search ICD-10 codes by name or code (e.g. cervicalgia, low back pain, strain, M54)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
          {isLoading ? (
            <div className="w-full py-4 flex justify-center items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading codes...
            </div>
          ) : filtered.length === 0 ? (
            <div className="w-full py-4 text-center text-slate-400 text-xs italic">
              No matching ICD codes found.
            </div>
          ) : (
            filtered.map(item => {
              const isSelected = selectedCodes.includes(item.code);
              const isEditing = editingId === item.id;

              if (isEditing) {
                return (
                  <div key={item.id} className="flex items-center gap-1 bg-white p-1 rounded-lg border border-teal-500 shadow-sm">
                    <input
                      type="text"
                      value={editCode}
                      onChange={e => setEditCode(e.target.value)}
                      className="w-20 px-1.5 py-1 text-[11px] font-mono font-bold uppercase rounded border border-slate-300 outline-none focus:border-teal-500"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      className="w-32 sm:w-48 px-1.5 py-1 text-[11px] rounded border border-slate-300 outline-none focus:border-teal-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateCode(item.id)}
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateCode(item.id)}
                      className="p-1 text-teal-600 hover:bg-teal-50 rounded"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className={`flex items-center rounded-lg text-[11px] font-medium transition shadow-2xs border ${
                    isSelected
                      ? 'bg-teal-600 text-white font-bold border-teal-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleCode(item.code)}
                    className="px-2 py-1 flex items-center gap-1.5 cursor-pointer rounded-l-lg"
                  >
                    <span className="font-mono font-bold">{item.code}</span>
                    <span className="text-[10px] opacity-90 truncate max-w-[160px]">{item.description}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                  
                  <div className="flex border-l border-white/20">
                    <button
                      type="button"
                      onClick={(e) => startEdit(e, item)}
                      className={`px-1.5 py-1 transition-colors flex items-center justify-center ${
                        isSelected 
                          ? 'hover:bg-teal-700 text-teal-100' 
                          : 'hover:bg-slate-100 text-slate-400 hover:text-teal-600'
                      }`}
                      title="Edit code"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCode(item.id, item.code, e)}
                      className={`px-1.5 py-1 rounded-r-lg transition-colors flex items-center justify-center ${
                        isSelected 
                          ? 'hover:bg-teal-700 text-teal-100' 
                          : 'hover:bg-rose-50 hover:text-rose-600 text-slate-400'
                      }`}
                      title="Delete code"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
