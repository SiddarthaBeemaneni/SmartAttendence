/**
 * CampusAI / SmartAttend AI - All India University & Autonomous College Search Dropdown
 *
 * Sourced from official UGC & AISHE directories covering all 36 States & UTs.
 * Server-side paginated search with debouncing, autocomplete, category badges,
 * autonomous college verification, and institution addition request workflow.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineBuildingLibrary,
  HiOutlineCheckBadge,
  HiOutlineMapPin,
  HiOutlineArrowPath,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlinePlusCircle,
  HiOutlineInformationCircle,
} from 'react-icons/hi2';

// Helper to clean trailing address/postal text from institution names
const cleanInstitutionName = (name) => {
  if (!name) return '';
  return name
    .replace(/\s*Postal Address-?\s*.*$/i, '')
    .replace(/\s*Address:\s*.*$/i, '')
    .trim();
};

export default function InstitutionSearchDropdown({
  selectedInstitution,
  onSelectInstitution,
  onRequestAddition,
  error,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Fetch search results from backend API
  const performSearch = useCallback(async (searchTerm) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm && searchTerm.trim()) params.append('q', searchTerm.trim());
      params.append('limit', '15');
      params.append('page', '1');

      const response = await api.get(`/api/institutions/search?${params.toString()}`);
      setResults(response.data.items || []);
      setHighlightedIndex(-1);
    } catch (err) {
      console.error('Failed to search institutions directory:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    if (!isOpen && !query) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, isOpen, performSearch]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && results[highlightedIndex]) {
      e.preventDefault();
      handleSelect(results[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (inst) => {
    onSelectInstitution(inst);
    setQuery(cleanInstitutionName(inst.official_name));
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectInstitution(null);
    setQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // Helper for Category Badges
  const getCategoryBadge = (inst) => {
    const type = inst.institution_type;
    if (inst.autonomous_status) {
      return {
        label: 'UGC Autonomous College',
        bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
      };
    }
    switch (type) {
      case 'Central University':
        return { label: 'Central University', bg: 'bg-purple-950/80 text-purple-300 border-purple-700/60' };
      case 'State Public University':
        return { label: 'State Public University', bg: 'bg-blue-950/80 text-blue-300 border-blue-700/60' };
      case 'State Private University':
        return { label: 'State Private University', bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60' };
      case 'Deemed-to-be University':
        return { label: 'Deemed-to-be University', bg: 'bg-teal-950/80 text-teal-300 border-teal-700/60' };
      case 'Autonomous College':
        return { label: 'Autonomous College', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' };
      case 'Affiliated College':
        return { label: 'Affiliated College', bg: 'bg-amber-950/80 text-amber-300 border-amber-700/60' };
      case 'Constituent College':
        return { label: 'Constituent College', bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60' };
      default:
        return { label: type || 'Higher Education Institution', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Search Header Label & Live Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
        <label className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <HiOutlineBuildingLibrary className="w-4 h-4 text-primary-400" />
          <span>All India Institution Directory <span className="text-rose-400">*</span></span>
        </label>
        <span className="text-[11px] text-slate-400">
          UGC & AISHE Accredited • All 36 States & UTs
        </span>
      </div>

      {/* Primary Autocomplete Search Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <HiOutlineMagnifyingGlass className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              if (results.length === 0) {
                performSearch(query);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search by Institution Name, AISHE code (e.g. U-0120, C-44006), or city..."
            className="w-full pl-11 pr-20 py-3 bg-slate-900/90 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner"
          />

          {/* Action icons right */}
          <div className="absolute right-3 flex items-center gap-2">
            {isLoading && (
              <HiOutlineArrowPath className="w-4 h-4 text-primary-400 animate-spin" />
            )}
            {(query || selectedInstitution) && (
              <button
                type="button"
                onClick={handleClear}
                title="Clear selection"
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Dropdown Box */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in flex flex-col max-h-[28rem]">
            {/* Results List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60">
              {isLoading ? (
                <div className="p-8 text-center space-y-2">
                  <HiOutlineArrowPath className="w-6 h-6 text-primary-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Searching official UGC & AISHE databases...</p>
                </div>
              ) : results.length > 0 ? (
                results.map((inst, index) => {
                  const badge = getCategoryBadge(inst);
                  const isSelected = selectedInstitution?.id === inst.id;
                  const isHighlighted = highlightedIndex === index;
                  const displayName = cleanInstitutionName(inst.official_name);

                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => handleSelect(inst)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-primary-950/70 border-l-4 border-primary-500'
                          : isHighlighted
                          ? 'bg-slate-800/80'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Top Row: Name + Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="text-sm font-bold text-white group-hover:text-primary-300 leading-snug">
                          {displayName}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          {inst.aishe_code && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                              AISHE: {inst.aishe_code}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Row: Location & Recognition */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{inst.city || inst.district}, {inst.state}</span>
                        </span>
                        {inst.ugc_reference && (
                          <span className="text-slate-500">• {inst.ugc_reference}</span>
                        )}
                      </div>

                      {/* Autonomous Details / Affiliating University */}
                      {inst.affiliating_university_name && (
                        <div className="text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-900/50 flex items-center justify-between">
                          <span>
                            Affiliating University: <strong>{inst.affiliating_university_name}</strong>
                          </span>
                          {inst.autonomous_validity && (
                            <span className="text-slate-300 text-[10px]">
                              {inst.autonomous_validity}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                /* Empty State with Request Addition CTA */
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <HiOutlineBuildingLibrary className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">
                      No Recognized Institution Found
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      We could not find an accredited college matching &quot;{query}&quot;.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onRequestAddition(query);
                      }}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <HiOutlinePlusCircle className="w-4 h-4" />
                      <span>Request Institution Addition</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">
                Official UGC & AISHE Directory.
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onRequestAddition(query);
                }}
                className="text-primary-400 hover:text-primary-300 font-bold underline flex items-center gap-1 cursor-pointer"
              >
                <span>Can&apos;t find your institution? Request addition</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Validation Error Banner */}
      {error && (
        <p className="text-xs text-rose-400 font-semibold flex items-center gap-1.5 animate-shake">
          <HiOutlineInformationCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* Verified Institution Details Card (Rendered when selection is made) */}
      {selectedInstitution && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-2xl animate-fade-in space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <HiOutlineCheckBadge className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 px-2.5 py-0.5 rounded-full">
                    {selectedInstitution.autonomous_status ? 'UGC Autonomous College' : selectedInstitution.institution_type}
                  </span>
                  {selectedInstitution.aishe_code && (
                    <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      AISHE: {selectedInstitution.aishe_code}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <HiOutlineCheck className="w-3.5 h-3.5" /> UGC / AISHE Verified
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  {cleanInstitutionName(selectedInstitution.official_name)}
                </h4>
                <p className="text-xs text-slate-300">
                  {selectedInstitution.city || selectedInstitution.district}, {selectedInstitution.state}
                  {selectedInstitution.address && ` • ${selectedInstitution.address}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-white underline self-start shrink-0 cursor-pointer"
            >
              Change Institution
            </button>
          </div>

          {/* Autonomous & Affiliation Callout */}
          {(selectedInstitution.autonomous_status || selectedInstitution.affiliating_university_name) && (
            <div className="pt-2 border-t border-emerald-800/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {selectedInstitution.affiliating_university_name && (
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Affiliating University
                  </span>
                  <span className="font-semibold text-white">
                    {selectedInstitution.affiliating_university_name}
                  </span>
                </div>
              )}
              {selectedInstitution.autonomous_validity && (
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Autonomy Recognition Status
                  </span>
                  <span className="font-semibold text-emerald-300">
                    {selectedInstitution.autonomous_validity}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
