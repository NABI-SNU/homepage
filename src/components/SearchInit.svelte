<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    const searchTrigger = document.getElementById('search-trigger') as HTMLButtonElement | null;
    const searchDialog = document.getElementById('search-dialog') as HTMLDialogElement | null;
    const closeButton = document.getElementById('close-search') as HTMLButtonElement | null;

    function getCurrentTheme(): 'light' | 'dark' {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }

    function updatePagefindTheme() {
      const theme = getCurrentTheme();
      const dialog = searchDialog;
      if (dialog) {
        if (theme === 'dark') {
          dialog.classList.add('dark');
        } else {
          dialog.classList.remove('dark');
        }
      }
    }

    function openSearch() {
      updatePagefindTheme();
      searchDialog?.showModal();
      searchTrigger?.setAttribute('aria-expanded', 'true');
      
      // Focus the search input after a brief delay to ensure it's rendered
      setTimeout(() => {
        const searchInput = document.querySelector<HTMLInputElement>('.pagefind-ui__search-input');
        searchInput?.focus();
      }, 100);
      
      // Add body scroll lock
      document.body.style.overflow = 'hidden';
    }

    function closeSearch() {
      searchDialog?.close();
      searchTrigger?.setAttribute('aria-expanded', 'false');
      
      // Remove body scroll lock
      document.body.style.overflow = '';
      
      // Return focus to trigger button
      searchTrigger?.focus();
    }

    // Event listeners
    searchTrigger?.addEventListener('click', openSearch);
    closeButton?.addEventListener('click', closeSearch);

    // Click outside to close
    searchDialog?.addEventListener('click', (e: MouseEvent) => {
      if (!searchDialog) return;
      
      // Check if the click target is the dialog backdrop (not the content)
      const target = e.target as HTMLElement;
      if (target === searchDialog) {
        closeSearch();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !searchDialog?.open) {
        e.preventDefault();
        openSearch();
      }
    });

    // Theme change observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')
        ) {
          updatePagefindTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Initial theme setup
    updatePagefindTheme();

    // Cleanup function
    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  });
</script>