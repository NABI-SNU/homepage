{#each papers as paper}
  <div class="p-4 border rounded-md shadow-md dark:border-slate-700 flex flex-col relative">
    <a class="absolute top-4 right-4 text-black dark:text-white" href={paper.articleUrl}>
      <ExternalLink class="w-5 h-5" />
    </a>
    <h3 class="text-xl font-bold pr-8">{paper.title}</h3>
    <p class="text-sm text-muted">{paper.authors[0]}{paper.authors.length > 1 ? ` et al.` : ''}{paper.journal} ({paper.year})</p>
    <p class="text-sm text-muted">
      {#each paper.sources as source}
        <span>
          <em>As covered in</em> <a href={source.url} class="text-primary inline-flex items-center gap-1">
            {source.title.substring(0, 12)}{source.title.length > 12 ? '...' : ''}
          </a>
        </span>
      {/each}
    </p>
  </div>
{/each}