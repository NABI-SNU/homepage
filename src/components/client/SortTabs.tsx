import React from 'react';

interface SortTabsProps {
  sortBy: 'alphabetical' | 'recent' | 'oldest';
  onSortChange: (sort: 'alphabetical' | 'recent' | 'oldest') => void;
}

const SortTabs: React.FC<SortTabsProps> = ({ sortBy, onSortChange }) => {
  const tabs = [
    { value: 'alphabetical' as const, label: 'A → Z' },
    { value: 'recent' as const, label: 'Newest' },
    { value: 'oldest' as const, label: 'Oldest' },
  ];

  return (
    <div className="flex justify-start sm:justify-end sm:ml-auto">
      <div className="inline-flex rounded-full shadow overflow-hidden border border-gray-300 dark:border-gray-700">
        {tabs.map((tab, i) => {
          const isSelected = sortBy === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              className={`px-4 py-2 text-sm font-medium outline-none transition-colors border-0
                ${i === 0 ? 'rounded-l-full' : ''}
                ${i === tabs.length - 1 ? 'rounded-r-full' : ''}
                ${i > 0 ? '-ml-px' : ''}
                ${
                  isSelected
                    ? 'bg-[#E2E6E8] text-black dark:bg-[#2D2E2F] dark:text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-[#181A20] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              aria-current={isSelected ? 'page' : undefined}
              onClick={() => onSortChange(tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SortTabs;
