// CampusLend - Search & Filter Toolbar
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchFilter({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  categories = [],
  statusOptions = ['AVAILABLE', 'ON_LOAN', 'MAINTENANCE']
}) {
  const hasActiveFilters = Boolean(search || category || status);

  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('');
    onStatusChange('');
  };

  return (
    <div className="bg-white rounded-md border border-[#DAD8D0] p-3 sm:p-4 mb-6 shadow-subtle">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search input (6 cols) */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#74766F]" />
          <input
            type="text"
            placeholder="Search items by title, description, or keyword..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-archival pl-9 pr-8"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#74766F] hover:text-[#242722]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category filter (3 cols) */}
        <div className="sm:col-span-3">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="input-archival bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.categoryName} ({c.maxLoanDays}d)
              </option>
            ))}
          </select>
        </div>

        {/* Status filter (3 cols) */}
        <div className="sm:col-span-3 flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="input-archival bg-white"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              title="Reset Filters"
              className="btn-outline px-2.5 py-2 text-xs flex-shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
