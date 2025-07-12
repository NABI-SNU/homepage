<script lang="ts">
  export let sortBy: 'alphabetical' | 'recent' | 'oldest';
  export let onSortChange: (sort: 'alphabetical' | 'recent' | 'oldest') => void;

  const tabs = [
    { value: 'alphabetical', label: 'A → Z' },
    { value: 'recent', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
  ] as const;
</script>

<div class="flex justify-start sm:justify-end sm:ml-auto">
  <div class="inline-flex rounded-full shadow overflow-hidden border border-gray-300 dark:border-gray-700">
    {#each tabs as tab, i}
      {@const isSelected = sortBy === tab.value}
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium outline-none transition-colors border-0
               {i === 0 ? 'rounded-l-full' : ''}
               {i === tabs.length - 1 ? 'rounded-r-full' : ''}
               {i > 0 ? '-ml-px' : ''}
               {isSelected
          ? 'bg-[#E2E6E8] text-black dark:bg-[#2D2E2F] dark:text-white'
          : 'bg-gray-100 text-gray-700 dark:bg-[#181A20] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}"
        aria-current={isSelected ? 'page' : undefined}
        on:click={() => onSortChange(tab.value)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
</div>
