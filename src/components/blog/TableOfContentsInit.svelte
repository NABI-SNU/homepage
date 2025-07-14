<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    const toc = document.getElementById('toc');
    const tocToggle = document.getElementById('toc-toggle');
    const list = document.getElementById('toc-list');
    const footer = document.getElementById('blog-footer');

    if (!toc || !tocToggle || !list) {
      console.error('TOC elements not found');
      return;
    }

    const links = Array.from(list.querySelectorAll('.toc-link')) as HTMLAnchorElement[];
    const toggleLines = Array.from(document.querySelectorAll('.toggle-line')) as HTMLElement[];

    const targets = links
      .map((a) => document.getElementById(a.getAttribute('href')!.slice(1)))
      .filter((el): el is HTMLElement => !!el);

    const OFFSET = 96;
    let activeIndex = -1;
    let isOpen = false;

    console.log('TOC initialized with', links.length, 'links and', targets.length, 'targets');

    // Toggle functionality
    function toggleToc() {
      isOpen = !isOpen;
      console.log('Toggling TOC, isOpen:', isOpen);

      if (!toc || !tocToggle) return;

      if (isOpen) {
        toc.classList.remove('opacity-0', 'pointer-events-none');
        toc.classList.add('opacity-100', 'pointer-events-auto');
        tocToggle.classList.remove('hover:shadow-md');
      } else {
        toc.classList.add('opacity-0', 'pointer-events-none');
        toc.classList.remove('opacity-100', 'pointer-events-auto');
        tocToggle.classList.add('hover:shadow-md');
      }
    }

    function updateActiveLink() {
      let current = -1;
      for (let i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].getBoundingClientRect().top <= OFFSET) {
          current = i;
        }
      }

      if (current !== activeIndex) {
        activeIndex = current;

        // Update TOC links
        links.forEach((link, i) => {
          if (i === activeIndex) {
            link.classList.add('bg-gray-100', 'dark:bg-gray-800', 'border-l-blue-500');
            link.classList.remove('border-transparent');
          } else {
            link.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'border-l-blue-500');
            link.classList.add('border-transparent');
          }
        });

        // Update toggle button lines
        toggleLines.forEach((line, i) => {
          if (i === activeIndex) {
            line.classList.add('bg-blue-600', 'dark:bg-blue-400', 'scale-110');
            line.classList.remove('bg-gray-700', 'dark:bg-gray-300');
          } else {
            line.classList.remove('bg-blue-600', 'dark:bg-blue-400', 'scale-110');
            line.classList.add('bg-gray-700', 'dark:bg-gray-300');
          }
        });
      }
    }

    function updateTocVisibility() {
      if (!toc || !footer || !tocToggle) return;

      const rect = footer.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const ratio = rect.height > 0 ? visibleHeight / rect.height : 0;

      // Hide TOC and toggle when footer is significantly visible
      const shouldHide = ratio >= 0.3;

      if (shouldHide) {
        toc.style.display = 'none';
        tocToggle.style.display = 'none';
        isOpen = false;
        tocToggle.classList.add('hover:shadow-md');
      } else {
        // Show toggle button, but TOC visibility depends on isOpen state
        tocToggle.style.display = 'block';
        toc.style.display = 'block';
      }
    }

    function checkScreenSize() {
      const minWidth = 640;
      const shouldShow = window.innerWidth >= minWidth;

      if (!toc || !tocToggle) return;

      if (shouldShow) {
        tocToggle.style.display = 'block';
        toc.style.display = 'block';
      } else {
        toc.style.display = 'none';
        tocToggle.style.display = 'none';
        isOpen = false;
        tocToggle.classList.add('hover:shadow-md');
      }
    }

    function handleScroll() {
      updateActiveLink();
      updateTocVisibility();
    }

    function handleResize() {
      checkScreenSize();
    }

    // Event listeners
    tocToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleToc();
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Smooth scrolling for TOC links
    links.forEach((link, index) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          const target = document.getElementById(href.slice(1));
          if (target) {
            console.log('Scrolling to:', href);
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }
      });
    });

    // Close TOC when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as Node;
      if (!toc || !tocToggle) return;
      if (isOpen && !toc.contains(target) && !tocToggle.contains(target)) {
        toggleToc();
      }
    });

    // Initial setup
    checkScreenSize();
    updateActiveLink();
    updateTocVisibility();

    // Cleanup
    return () => {
      tocToggle.removeEventListener('click', toggleToc);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  });
</script>
