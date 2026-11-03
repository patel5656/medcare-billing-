// src/components/common/Pagination.jsx
import React from 'react';

/**
 * Reusable Pagination Component
 *
 * Props:
 *  - currentPage  {number}   : active page (1-indexed)
 *  - totalItems   {number}   : total count of items
 *  - pageSize     {number}   : items per page
 *  - onPageChange {function} : called with new page number
 *  - itemLabel    {string}   : optional noun for the count label (default: "items")
 *  - className    {string}   : optional extra wrapper classes
 */
const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'items',
  className = '',
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  // Show at most 7 page buttons; collapse with ellipsis for large counts
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const btnBase = 'text-[11px] font-bold rounded-xl transition cursor-pointer select-none';
  const btnInactive = `${btnBase} border border-slate-200 text-slate-600 hover:bg-slate-50`;
  const btnActive = `${btnBase} bg-teal-600 text-white shadow-sm shadow-teal-500/30`;
  const btnNav = `px-3 py-1.5 ${btnBase} border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed`;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}&ndash;{to}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span> {itemLabel}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={btnNav}
        >
          &lsaquo; Prev
        </button>
        {getPageNumbers().map((pg, idx) =>
          pg === '...' ? (
            <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs select-none">
              &hellip;
            </span>
          ) : (
            <button
              key={pg}
              type="button"
              onClick={() => onPageChange(pg)}
              className={`w-8 h-8 ${currentPage === pg ? btnActive : btnInactive}`}
            >
              {pg}
            </button>
          )
        )}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={btnNav}
        >
          Next &rsaquo;
        </button>
      </div>
    </div>
  );
};

export default Pagination;
