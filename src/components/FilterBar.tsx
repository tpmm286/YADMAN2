import React from 'react';
import { Search, Filter, AlertCircle, Tag, Folder, X, RotateCcw, Layers } from 'lucide-react';
import { FilterStatus, TagMatchMode } from '../types';
import { toPersianDigits } from '../utils/dateUtils';

interface FilterBarProps {
  currentFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  availableCategories: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  tagMatchMode: TagMatchMode;
  onTagMatchModeChange: (mode: TagMatchMode) => void;
  availableTags: string[];
  counts: {
    all: number;
    due: number;
    in_progress: number;
    completed: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  selectedTags,
  onToggleTag,
  onClearTags,
  tagMatchMode,
  onTagMatchModeChange,
  availableTags,
  counts,
}) => {
  const tabs: { key: FilterStatus; label: string; count: number; badgeClass?: string }[] = [
    { key: 'all', label: 'همه مطالب', count: counts.all },
    {
      key: 'due',
      label: 'آماده مرور',
      count: counts.due,
      badgeClass: counts.due > 0 ? 'bg-rose-100 text-rose-700 font-bold' : '',
    },
    { key: 'in_progress', label: 'در حال مرور', count: counts.in_progress },
    { key: 'completed', label: 'کامل شده', count: counts.completed },
  ];

  const hasExtraFilters = Boolean(selectedCategory || selectedTags.length > 0 || searchQuery.trim());

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs mb-6 space-y-3">
      {/* Top Row: Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = currentFilter === tab.key;
            return (
              <button
                key={tab.key}
                id={`filter-tab-${tab.key}`}
                onClick={() => onFilterChange(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.badgeClass || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {toPersianDigits(tab.count)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-topics-input"
            type="text"
            placeholder="جستجو در عنوان یا توضیحات..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Middle Row: Category and Multi-Tag Filters with AND/OR Logic */}
      {(availableCategories.length > 0 || availableTags.length > 0) && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Dropdown/Selector */}
              {availableCategories.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                  <Folder className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-slate-500 font-medium">دسته‌بندی:</span>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => onCategoryChange(e.target.value || null)}
                    className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
                  >
                    <option value="">همه دسته‌ها ({toPersianDigits(availableCategories.length)})</option>
                    {availableCategories.map((cat, cIdx) => (
                      <option key={cIdx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {selectedCategory && (
                    <button
                      onClick={() => onCategoryChange(null)}
                      className="text-slate-400 hover:text-rose-600 mr-1"
                      title="حذف فیلتر دسته"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Tag Selection Header & Available Tags */}
              {availableTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-500 flex items-center gap-1 text-xs ml-1 font-medium">
                    <Tag className="w-3.5 h-3.5 text-indigo-500" />
                    <span>برچسب‌ها:</span>
                  </span>
                  {availableTags.map((t, idx) => {
                    const isSelected = selectedTags.includes(t);
                    return (
                      <button
                        key={idx}
                        onClick={() => onToggleTag(t)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs scale-102 ring-1 ring-indigo-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                        title={isSelected ? `حذف تگ ${t} از فیلتر` : `افزودن تگ ${t} به فیلتر`}
                      >
                        #{t}
                        {isSelected && <span className="mr-1 text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reset All Filters Button if active */}
            {hasExtraFilters && (
              <button
                onClick={() => {
                  onSearchChange('');
                  onCategoryChange(null);
                  onClearTags();
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-600 text-xs px-2.5 py-1.5 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>پاک‌کردن تمام فیلترها</span>
              </button>
            )}
          </div>

          {/* Smart Multi-Tag Filter Bar with AND/OR Logic (Requirement 3) */}
          {selectedTags.length > 0 && (
            <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-indigo-900 font-semibold">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>فیلتر همزمان {toPersianDigits(selectedTags.length)} برچسب:</span>
                </div>

                {/* Active Tag Chips */}
                <div className="flex flex-wrap items-center gap-1">
                  {selectedTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-medium shadow-xs"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => onToggleTag(tag)}
                        className="hover:text-rose-200 text-indigo-200 transition-colors"
                        title={`حذف برچسب #${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* AND / OR Match Mode Toggle (Requirement 3) */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-indigo-800 font-medium hidden sm:inline">
                  حالت ترکیب:
                </span>
                <div className="bg-white p-0.5 rounded-lg border border-indigo-200 flex items-center shadow-xs">
                  <button
                    type="button"
                    onClick={() => onTagMatchModeChange('AND')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                      tagMatchMode === 'AND'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-indigo-700 hover:bg-indigo-50'
                    }`}
                    title="مطلب باید شامل همه برچسب‌های انتخابی باشد (اشتراک)"
                  >
                    شامل همه (AND)
                  </button>
                  <button
                    type="button"
                    onClick={() => onTagMatchModeChange('OR')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                      tagMatchMode === 'OR'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-indigo-700 hover:bg-indigo-50'
                    }`}
                    title="مطلب با داشتن حداقل یکی از برچسب‌ها نمایش داده می‌شود (اجتماع)"
                  >
                    حداقل یکی (OR)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClearTags}
                  className="text-[11px] text-indigo-700 hover:text-rose-600 underline font-medium mr-1"
                >
                  حذف برچسب‌ها
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Priority sort hint */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100">
        <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>
          چینش خودکار به ترتیب اولویت: ابتدا موارد <strong className="text-rose-600 font-semibold">آماده مرور</strong>، سپس نزدیک‌ترین زمان‌های مرور بعدی، و در نهایت مطالب تکمیل‌شده.
        </span>
      </div>
    </div>
  );
};
