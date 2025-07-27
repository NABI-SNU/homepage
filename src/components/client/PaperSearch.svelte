<script lang="ts">
  import PaperTile from './PaperTile.svelte';
  import PaginationControls from '~/components/client/PaginationControls.svelte';
  import SortTabs from '~/components/client/SortTabs.svelte';
  import SearchBar from '~/components/client/SearchBar.svelte';
  import type { Paper } from '~/types';

  export let papers: Paper[] = [];

  let query = '';
  let sortBy: 'alphabetical' | 'recent' | 'oldest' = 'alphabetical';

  let currentPage = 1;
  const pageSize = 18; // Show up to 18 per "page"

  $: filtered = papers.filter((paper) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const searchFields = [paper.title, ...paper.authors, paper.journal ?? '', String(paper.year)];
    return searchFields.some((field) => field.toLowerCase().includes(q));
  });

  $: sortedPapers = filtered.sort((a, b) => {
    if (sortBy === 'recent') return (b.year ?? 0) - (a.year ?? 0);
    if (sortBy === 'oldest') return (a.year ?? 0) - (b.year ?? 0);
    return a.title.localeCompare(b.title);
  });

  $: shouldPaginate = sortedPapers.length > pageSize;
  $: totalPages = shouldPaginate ? Math.ceil(sortedPapers.length / pageSize) : 1;
  $: paginatedPapers = shouldPaginate
    ? sortedPapers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedPapers;

  // Reset to first page if filtered list shrinks
  $: if (currentPage > totalPages) currentPage = 1;
</script>

<div class="max-w-5xl mx-auto px-4 sm:px-6">
  <!-- Search and Sort Controls -->
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 mb-6">
    <!-- Search Input -->
    <SearchBar {query} onQueryChange={(newQuery) => (query = newQuery)} onSearch={() => (currentPage = 1)} />

    <!-- Sort Tabs -->
    <SortTabs
      {sortBy}
      onSortChange={(sort) => {
        sortBy = sort;
        currentPage = 1;
      }}
    />
  </div>

  <!-- Papers Grid -->
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8 pb-8">
    <PaperTile papers={paginatedPapers} />
  </div>

  <!-- Pagination Controls (only if needed) -->
  {#if shouldPaginate}
    <PaginationControls {currentPage} {totalPages} onPageChange={(page) => (currentPage = page)} />
  {/if}
</div>
