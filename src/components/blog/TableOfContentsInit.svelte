<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    const toc = document.getElementById('toc');
    const list = document.getElementById('toc-list');
    const footer = document.getElementById('blog-footer');

    const links = Array.from(list?.querySelectorAll('.toc-link') || []) as HTMLAnchorElement[];
    const targets = links
      .map((a) => document.getElementById(a.getAttribute('href')!.slice(1)))
      .filter((el): el is HTMLElement => !!el);

    const OFFSET = 96; // match your scroll-mt-24
    let activeIndex = -1;

    function update() {
      let current = -1;
      for (let i = 0; i < targets.length; i++) {
        if (targets[i].getBoundingClientRect().top <= OFFSET) {
          current = i;
        }
      }
      if (current !== activeIndex) {
        activeIndex = current;
        links.forEach((link, i) => link.classList.toggle('active', i === activeIndex));
      }

      if (toc && footer) {
        const rect = footer.getBoundingClientRect();
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        const ratio = rect.height > 0 ? visibleHeight / rect.height : 0;

        toc.classList.toggle('translate-x-full', ratio >= 0.5);
      }
    }

    window.addEventListener('scroll', update, { passive: true });
    update();

    return () => window.removeEventListener('scroll', update);
  });
</script>
