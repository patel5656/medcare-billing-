import React, { useState, useEffect, useRef } from 'react';
import { apiAttorneyService } from '../../services/api/apiAttorneyService';
import { Search, ChevronDown, Check, Scale, X, Building, Phone, MapPin, Trash2, Loader2, Mail } from 'lucide-react';

/**
 * SearchableLawyerSelect
 * Dynamic, searchable dropdown for selecting a Lawyer / Law Firm from real DB API
 * with instant delete capability.
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
  const [deletingId, setDeletingId] = useState(null);
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
    const emailMatch = (a.email || '').toLowerCase().includes(q);
    return nameMatch || firmMatch || phoneMatch || addrMatch || emailMatch;
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

  const handleDelete = async (e, attorney) => {
    e.stopPropagation();
    const lawyerLabel = attorney.firm ? `${attorney.firm} (${attorney.name})` : attorney.name;
    const isConfirmed = window.confirm(`Kya aap "${lawyerLabel}" ko delete karna chahte hain? Yeh database se permanently remove ho jayega.`);
    if (!isConfirmed) return;

    try {
      setDeletingId(attorney.id);
      await apiAttorneyService.deleteAttorney(attorney.id);
      
      // Update local attorneys list immediately
      setAttorneys(prev => prev.filter(item => item.id !== attorney.id));
      
      // Clear selection if deleted attorney was currently chosen
      if (selectedAttorney?.id === attorney.id || value === attorney.id || value === attorney.name) {
        if (onSelect) onSelect(null);
      }
    } catch (err) {
      console.error('Failed to delete attorney:', err);
      alert(err.message || 'Lawyer delete karne me error aaya.');
    } finally {
      setDeletingId(null);
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
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
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

          {/* List of Attorneys with Scrollbar */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1.5 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400">
                {loading ? 'Loading attorneys...' : 'No matching lawyers or law firms found in database.'}
              </div>
            ) : (
              filtered.map(a => {
                const isSelected = selectedAttorney?.id === a.id;
                const isDeleting = deletingId === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => handleSelect(a)}
                    className={`group p-2.5 rounded-xl cursor-pointer transition text-xs flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-teal-50/90 text-teal-900 font-bold border border-teal-200 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{a.firm || 'Law Firm'}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-teal-700 font-semibold">{a.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-normal flex-wrap">
                        {a.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {a.phone}
                          </span>
                        )}
                        {a.address && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]" title={a.address}>
                            <MapPin className="w-3 h-3 text-slate-400" /> {a.address}
                          </span>
                        )}
                        {a.email && (
                          <span className="flex items-center gap-1 text-slate-400 truncate max-w-[160px]" title={a.email}>
                            <Mail className="w-3 h-3 text-slate-400" /> {a.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isSelected && (
                        <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mr-1" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, a)}
                        disabled={isDeleting}
                        title="Delete lawyer from database"
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Count & Status Footer */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
            <span>{filtered.length} of {attorneys.length} database records</span>
            <span className="font-medium text-slate-400 flex items-center gap-1">
              Click <Trash2 className="w-3 h-3 text-rose-400 inline" /> to delete record
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
