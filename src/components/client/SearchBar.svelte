<script lang="ts">
  import { Search } from 'lucide-svelte';

  export let query: string;
  export let onQueryChange: (query: string) => void;
  export let onSearch: () => void;
</script>

<div class="relative w-full sm:w-[200px]">
  <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
  <input
    type="text"
    placeholder="Search for a paper"
    class="w-full border rounded-md p-2 pl-10 bg-white text-black dark:bg-[#040620] dark:text-white dark:border-slate-700"
    bind:value={query}
    on:input={() => {
      onQueryChange(query);
      onSearch();
    }}
  />
</div>
