<script lang="ts">
  import { onMount } from 'svelte';
 
  onMount(() => {
    const list = document.getElementById('toc-list');
    if (list) {
      const links = Array.from(list.querySelectorAll('.toc-link')) as HTMLAnchorElement[];
      const targets = links.map((a) => {
        const href = a.getAttribute('href') || '';
        return document.getElementById(href.slice(1));
      }).filter(Boolean);
 
      let activeIndex = -1;
 
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const index = targets.indexOf(entry.target as HTMLElement);
            if (index !== -1) {
              if (entry.isIntersecting) {
                activeIndex = index;
              }
            }
          });
 
          // Update active states
          links.forEach((link, idx) => {
            if (idx === activeIndex) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        },
        {
          rootMargin: '-96px 0px -80% 0px', // Top margin matches scroll-mt-24
          threshold: 0
        }
      );
 
      // Observe all heading targets
      targets.forEach(target => {
        if (target) observer.observe(target);
      });
 
      // Cleanup function
      return () => {
        observer.disconnect();
      };
    }
  });
 </script>