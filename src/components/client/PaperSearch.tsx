import React, { useState, useMemo, useEffect } from 'react';
import PaperTile from './PaperTile';
import PaginationControls from './PaginationControls';
import SortTabs from './SortTabs';
import SearchBar from './SearchBar';
import type { Paper } from '~/types';

interface PaperSearchProps {
  papers: Paper[];
}

const PaperSearch: React.FC<PaperSearchProps> = ({ papers = [] }) => {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'recent' | 'oldest'>('alphabetical');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 18; // Show up to 18 per "page"

  const filtered = useMemo(() => {
    return papers.filter((paper) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      const searchFields = [paper.title, ...paper.authors, paper.journal ?? '', String(paper.year)];
      return searchFields.some((field) => field.toLowerCase().includes(q));
    });
  }, [papers, query]);

  const sortedPapers = useMemo(() => {
    return filtered.sort((a, b) => {
      if (sortBy === 'recent') return (b.year ?? 0) - (a.year ?? 0);
      if (sortBy === 'oldest') return (a.year ?? 0) - (b.year ?? 0);
      return a.title.localeCompare(b.title);
    });
  }, [filtered, sortBy]);

  const shouldPaginate = sortedPapers.length > pageSize;
  const totalPages = shouldPaginate ? Math.ceil(sortedPapers.length / pageSize) : 1;
  const paginatedPapers = shouldPaginate
    ? sortedPapers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedPapers;

  // Reset to first page if filtered list shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleSortChange = (sort: 'alphabetical' | 'recent' | 'oldest') => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* Search and Sort Controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 mb-6">
        {/* Search Input */}
        <SearchBar query={query} onQueryChange={handleQueryChange} onSearch={handleSearch} />

        {/* Sort Tabs */}
        <SortTabs sortBy={sortBy} onSortChange={handleSortChange} />
      </div>

      {/* Papers Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8 pb-8">
        <PaperTile papers={paginatedPapers} />
      </div>

      {/* Pagination Controls (only if needed) */}
      {shouldPaginate && (
        <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
};

export default PaperSearch;
