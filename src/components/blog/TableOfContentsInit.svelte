<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    const list = document.getElementById('toc-list');
    if (list) {
      const links = Array.from(list.querySelectorAll('.toc-link')) as HTMLAnchorElement[];
      const targets = links.map((a) => {
        const href = a.getAttribute('href') || '';
        return document.getElementById(href.slice(1));
      });

      function updateActive() {
        let activeIndex = -1;
        for (let i = 0; i < targets.length; i++) {
          const rect = targets[i]?.getBoundingClientRect();
          if (rect && rect.top <= 120) activeIndex = i;
        }
        links.forEach((link, idx) => {
          if (idx === activeIndex) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }

      updateActive();
      document.addEventListener('scroll', updateActive, { passive: true });
      document.addEventListener('astro:after-swap', updateActive);
    }
  });
</script>
