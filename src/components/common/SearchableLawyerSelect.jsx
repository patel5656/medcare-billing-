import React, { useState, useEffect, useRef } from 'react';
import { apiAttorneyService } from '../../services/api/apiAttorneyService';
import { Search, ChevronDown, Check, Scale, X, Building, Phone, MapPin } from 'lucide-react';

/**
 * SearchableLawyerSelect
 * Dynamic, searchable dropdown for selecting a Lawyer / Law Firm from real DB API
 */
export const SearchableLawyerSelect = ({
  value = '', // current lawyer name or firm or ID
  currentFirm = '',
  onSelect,
  placeholder = "-- Select Lawyer / Law Firm --",
  className = ""
}) => {
  const [attorneys, setAttorneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiAttorneyService.getAttorneys()
      .then(list => {
        if (mounted) {
          setAttorneys(Array.isArray(list) ? list : []);
        }
      })
      .catch(err => console.error('Failed to load dynamic attorneys:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filtered = attorneys.filter(a => {
    const q = search.toLowerCase();
    const nameMatch = (a.name || '').toLowerCase().includes(q);
    const firmMatch = (a.firm || '').toLowerCase().includes(q);
    const phoneMatch = (a.phone || '').toLowerCase().includes(q);
    const addrMatch = (a.address || '').toLowerCase().includes(q);
    return nameMatch || firmMatch || phoneMatch || addrMatch;
  });

  // Identify currently selected attorney from value/currentFirm
  const selectedAttorney = attorneys.find(a => 
    (value && (a.id === value || a.name?.toLowerCase() === value?.toLowerCase())) ||
    (currentFirm && a.firm?.toLowerCase() === currentFirm?.toLowerCase())
  );

  const displayText = selectedAttorney
    ? `${selectedAttorney.firm || selectedAttorney.name} (${selectedAttorney.name})`
    : (value ? `${value}${currentFirm ? ` — ${currentFirm}` : ''}` : placeholder);

  const handleSelect = (attorney) => {
    if (onSelect) {
      onSelect(attorney);
    }
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(null);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 flex items-center justify-between gap-2 transition cursor-pointer text-left shadow-2xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Scale className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
          <span className={`truncate font-medium ${selectedAttorney || value ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
            {loading ? 'Loading attorneys from database...' : displayText}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {(selectedAttorney || value) && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by lawyer name, law firm, phone..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* List of Attorneys */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {loading ? 'Loading attorneys...' : 'No matching lawyers or law firms found in database.'}
              </div>
            ) : (
              filtered.map(a => {
                const isSelected = selectedAttorney?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => handleSelect(a)}
                    className={`p-2.5 rounded-lg cursor-pointer transition text-xs flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-teal-50/80 text-teal-900 font-bold border border-teal-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{a.firm || 'Law Firm'}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-teal-700 font-medium">{a.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-normal">
                        {a.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {a.phone}
                          </span>
                        )}
                        {a.address && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 text-slate-400" /> {a.address}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Count Footer */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
            <span>{filtered.length} of {attorneys.length} database records</span>
            <span className="font-mono text-teal-600">Dynamic DB Sync</span>
          </div>
        </div>
      )}
    </div>
  );
};
