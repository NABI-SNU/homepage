<script lang="ts">
  export let currentPage: number;
  export let totalPages: number;
  export let onPageChange: (page: number) => void;
</script>

<div class="flex justify-center gap-2 mt-6 mb-12">
  <button
    class="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#181A20] text-gray-700 dark:text-gray-300 disabled:opacity-50"
    disabled={currentPage === 1}
    on:click={() => onPageChange(currentPage - 1)}
    aria-label="Previous Page"
  >
    &larr;
  </button>
  {#each Array(totalPages) as _, i}
    <button
      class="px-3 py-1 rounded border border-gray-300 dark:border-gray-700
             {currentPage === i + 1 ? 'bg-[#E2E6E8] dark:bg-[#2D2E2F] font-bold' : 'bg-white dark:bg-[#181A20]'}"
      on:click={() => onPageChange(i + 1)}
    >
      {i + 1}
    </button>
  {/each}
  <button
    class="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#181A20] text-gray-700 dark:text-gray-300 disabled:opacity-50"
    disabled={currentPage === totalPages}
    on:click={() => onPageChange(currentPage + 1)}
    aria-label="Next Page"
  >
    &rarr;
  </button>
</div>
