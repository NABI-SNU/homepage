<script lang="ts">
  const { news, children } = $props();
</script>

<section class="py-7 sm:py-14 lg:py-18 mx-auto relative max-w-6xl">
  <article class="mx-auto max-w-3xl px-4 sm:px-6">
    <header class="intersect-once intersect-quarter motion-safe:md:opacity-0 motion-safe:md:intersect:animate-fade">
      <h1 class="px-4 sm:px-6 max-w-3xl mx-auto text-4xl md:text-5xl font-bold leading-tight tracking-tight font-heading text-center lg:text-left">
        {news.title}
      </h1>
      <p class="max-w-3xl mx-auto mt-4 mb-7 px-4 sm:px-6 text-lg md:text-xl text-muted dark:text-slate-400 text-justify">
        {news.description}
      </p>
    </header>

    <div class="mx-auto px-6 sm:px-6 max-w-3xl prose prose-lg dark:prose-invert dark:prose-headings:text-slate-300 prose-headings:font-heading prose-headings:leading-tight prose-headings:tracking-tight prose-headings:font-semibold prose-a:text-primary dark:prose-a:text-blue-400 prose-img:rounded-md mt-7 prose-headings:scroll-mt-[48px] prose-li:my-0 clear-both">
      {@render children()}
    </div>
  </article>
</section>
