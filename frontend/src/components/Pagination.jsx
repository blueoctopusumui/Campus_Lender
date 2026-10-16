// CampusLend - Pagination Component
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[#DAD8D0] rounded-b-md">
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="btn-secondary text-xs disabled:opacity-40"
        >
          Previous
        </button>
        <span className="font-mono text-xs self-center text-[#74766F]">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="btn-secondary text-xs disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-[#74766F] font-mono">
            Page <span className="font-semibold text-[#242722]">{currentPage}</span> of{' '}
            <span className="font-semibold text-[#242722]">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="inline-flex rounded-md shadow-subtle -space-x-px">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous Page"
              className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-[#DAD8D0] bg-white text-xs font-medium text-[#74766F] hover:bg-[#ECEAE3] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, idx, arr) => (
                <React.Fragment key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-2.5 py-1.5 border border-[#DAD8D0] bg-[#ECEAE3]/40 text-xs font-mono text-[#9A9C94]">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => onPageChange(page)}
                    className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-mono font-medium ${
                      currentPage === page
                        ? 'z-10 bg-[#526B56] border-[#526B56] text-white shadow-subtle'
                        : 'bg-white border-[#DAD8D0] text-[#242722] hover:bg-[#ECEAE3]'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next Page"
              className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-[#DAD8D0] bg-white text-xs font-medium text-[#74766F] hover:bg-[#ECEAE3] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
