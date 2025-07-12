<script lang="ts">
  import { ExternalLink } from 'lucide-svelte';
  import type { Paper } from '~/types';

  export let papers: Paper[] = [];
  let hoveredIndex = -1;

  function handleExternalClick(event, url) {
    event.stopPropagation()
    window.open(url, '_blank')
  }

  function handleSourceClick(event, url) {
    event.stopPropagation()
    window.open(url, '_blank')
  }
</script>

{#each papers as paper, index}
  <div
  class="group relative p-6 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm 
        hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:-translate-y-1
        bg-white dark:bg-slate-900
        hover:bg-gradient-to-br hover:from-white hover:to-blue-50/30
        dark:hover:from-slate-900 dark:hover:to-blue-950/20
        cursor-pointer overflow-hidden"
  role="button"
  tabindex="0"
  onmouseenter={() => hoveredIndex = index}
  onmouseleave={() => hoveredIndex = -1}
  onkeydown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation()
      window.open(paper.url, '_blank')
    }
  }}
  >
    <!-- Animated background gradient -->
    <div
      class="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 
            opacity-0 group-hover:opacity-100 transition-opacity duration-500"
    ></div>

    <!-- Subtle glow effect (replaces corner accent) -->
    <div
      class="absolute -top-1 -left-1 w-8 h-8 
            bg-gradient-to-br from-blue-400/20 to-purple-400/20 
            rounded-full blur-sm
            opacity-0 group-hover:opacity-100 
            transition-all duration-500 ease-out
            group-hover:scale-150"
    ></div>
      <!-- External link button -->
      <button
        class="absolute top-4 right-4 z-10
              w-5 h-5
              text-gray-600 dark:text-gray-400
              hover:text-blue-600 dark:hover:text-blue-400
              transition-all duration-200
              hover:scale-110 hover:rotate-12
              p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/50"
        onclick={(e) => handleExternalClick(e, paper.url)}
        aria-label="Open paper in new tab"
      >
        <ExternalLink class="w-5 h-5" />
      </button>
    
    <!-- Content -->
    <div class="relative z-10 flex flex-col space-y-3">
      <!-- Title -->
      <h3
        class="text-xl font-bold pr-12 text-gray-900 dark:text-white
              group-hover:text-blue-900 dark:group-hover:text-blue-100
              transition-colors duration-300
              leading-tight"
      >
        {paper.title}
      </h3>
      
      <!-- Authors and journal info -->
      <p
        class="text-sm text-gray-600 dark:text-gray-400
              group-hover:text-gray-700 dark:group-hover:text-gray-300
              transition-colors duration-300"
      >
        <span class="font-medium">
          {paper.authors[0]}{paper.authors.length > 1 ? ' et al.' : ''}
        </span>
        <span class="mx-2">•</span>
        <span class="italic">{paper.journal}</span>
        <span class="mx-2">•</span>
        <span>{paper.year}</span>
      </p>

      <!-- Sources -->
      {#if paper.sources.length > 0}
        <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <span class="italic text-xs uppercase tracking-wide font-medium">As covered in:</span>
          <div class="flex flex-wrap gap-2">
            {#each paper.sources as source}
              <button
                class="inline-flex items-center gap-1 px-2 py-1 rounded-md
                      bg-blue-50 dark:bg-blue-950/30 
                      text-blue-700 dark:text-blue-300
                      hover:bg-blue-100 dark:hover:bg-blue-950/50
                      hover:text-blue-800 dark:hover:text-blue-200
                      transition-all duration-200
                      text-xs font-medium
                      hover:scale-105 hover:shadow-sm
                      border border-blue-200/50 dark:border-blue-800/50"
                onclick={(e) => handleSourceClick(e, source.url)}
              >
                {source.title.length > 20 ? `${source.title.substring(0, 20)}...` : source.title}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Animated border -->
    <div
      class="absolute inset-0 rounded-xl border-2 transition-all duration-300 {hoveredIndex === index ? 'border-blue-200 dark:border-blue-800' : 'border-transparent'}"
    ></div>

    <!-- Status indicator dot -->
    <div
      class="absolute bottom-4 left-4 w-2 h-2 
            bg-gradient-to-r from-green-400 to-blue-500 
            rounded-full
            opacity-0 {hoveredIndex === index ? 'opacity-100' : ''} 
            transition-all duration-300 ease-out
            {hoveredIndex === index ? 'scale-125 shadow-lg shadow-blue-500/50' : ''}"
    ></div>
  </div>
{/each}
