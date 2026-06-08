import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * Smart Pagination Bar
 * Shows: First | ... | sliding window of 5 pages | ... | Last
 * Plus a "Go to page" input for jumping directly.
 */
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Build the visible page number array with ellipsis markers
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = [];
    const delta = 2; // pages on each side of current

    pages.push(1);

    const left  = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    if (left > 2)           pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");

    pages.push(totalPages);
    return pages;
  };

  const pages = getPages();

  const handleJump = (e) => {
    if (e.key === "Enter") {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 1 && val <= totalPages) {
        onPageChange(val);
        e.target.value = "";
      }
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex-wrap">
      {/* Page info */}
      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
        Page <span className="text-indigo-600">{page}</span> of <span className="text-gray-600">{totalPages}</span>
      </div>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-2 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="First page"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Numbered pages */}
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="w-9 text-center text-gray-400 font-bold text-sm select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-xl text-sm font-black transition-all border ${
                p === page
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                  : "bg-white border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Next page"
        >
          <ChevronRight size={15} />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-2 rounded-xl border border-gray-200 bg-white hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Last page"
        >
          <ChevronsRight size={15} />
        </button>
      </div>

      {/* Jump-to input */}
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
        <span className="uppercase tracking-widest whitespace-nowrap">Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          placeholder={page}
          onKeyDown={handleJump}
          className="w-16 border border-gray-200 rounded-xl px-3 py-1.5 text-center text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
      </div>
    </div>
  );
}
