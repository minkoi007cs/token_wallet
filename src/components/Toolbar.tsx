import React from 'react';

export interface FilterOption {
  key: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  sortBy?: string;
  onSortByChange?: (sort: string) => void;
  sortOptions?: { label: string; value: string }[];
  sortOrder?: 'asc' | 'desc';
  onSortOrderToggle?: () => void;
  activeChips?: ActiveFilterChip[];
  summaryText?: React.ReactNode;
  onClearFilters?: () => void;
  actions?: React.ReactNode;
}

export const Toolbar = React.memo(function Toolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search accounts, tools, hints...',
  filters = [],
  sortBy,
  onSortByChange,
  sortOptions = [],
  sortOrder,
  onSortOrderToggle,
  activeChips = [],
  summaryText,
  onClearFilters,
  actions,
}: ToolbarProps) {
  const showSort = Boolean(sortBy !== undefined && onSortByChange && sortOptions.length > 0);
  const hasActiveFilters = Boolean(searchQuery.trim() || activeChips.length > 0);

  return (
    <div className="app-filter-toolbar">
      <div className="filter-main-row">
        {/* Search Box */}
        <div className="search-input-wrapper">
          <span className="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            className="search-input-field"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => onSearchChange('')} title="Clear search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Filter Selects */}
        <div className="filter-selects-group">
          {filters.map((f) => (
            <select
              key={f.key}
              className={`toolbar-select ${f.value !== 'ALL' && f.value !== 'all' ? 'active-filter' : ''}`}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              title={f.label}
            >
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {showSort && (
            <select
              className="toolbar-select"
              value={sortBy}
              onChange={(e) => onSortByChange!(e.target.value)}
              title="Sort By"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {onSortOrderToggle && (
            <button
              className="sort-direction-btn"
              onClick={onSortOrderToggle}
              title={sortOrder === 'asc' ? 'Tăng dần. Click để đổi sang Giảm dần' : 'Giảm dần. Click để đổi sang Tăng dần'}
            >
              {sortOrder === 'asc' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M19 12l-7-7-7 7" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7 7 7-7" />
                </svg>
              )}
            </button>
          )}

          {actions}
        </div>
      </div>

      {/* Sub-row: Summary & Active Chips */}
      {(summaryText || hasActiveFilters) && (
        <div className="filter-sub-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {summaryText && <span>{summaryText}</span>}

            {activeChips.length > 0 && (
              <div className="filter-chips-list">
                {activeChips.map((chip) => (
                  <span key={chip.key} className="filter-chip">
                    {chip.label}
                    <span className="filter-chip-remove" onClick={chip.onRemove}>✕</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilters && onClearFilters && (
            <button className="btn-reset-filters" onClick={onClearFilters}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
});
