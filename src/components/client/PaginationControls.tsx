import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex justify-center gap-2 mt-6 mb-12">
      <button
        className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#181A20] text-gray-700 dark:text-gray-300 disabled:opacity-50"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous Page"
      >
        &larr;
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i + 1}
          className={`px-3 py-1 rounded border border-gray-300 dark:border-gray-700
            ${currentPage === i + 1 ? 'bg-[#E2E6E8] dark:bg-[#2D2E2F] font-bold' : 'bg-white dark:bg-[#181A20]'}`}
          onClick={() => onPageChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
      <button
        className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#181A20] text-gray-700 dark:text-gray-300 disabled:opacity-50"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next Page"
      >
        &rarr;
      </button>
    </div>
  );
};

export default PaginationControls;
