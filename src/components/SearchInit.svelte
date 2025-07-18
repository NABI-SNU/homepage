<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    decorator?: string;
  }

  export let decorator: string | undefined = undefined;

  onMount(() => {
    const searchTriggerId = decorator ? `${decorator}-search-trigger` : 'search-trigger';
    const searchDialogId = decorator ? `${decorator}-search-dialog` : 'search-dialog';
    const closeButtonId = decorator ? `${decorator}-close-search` : 'close-search';

    const searchTrigger = document.getElementById(searchTriggerId) as HTMLButtonElement | null;
    const searchDialog = document.getElementById(searchDialogId) as HTMLDialogElement | null;
    const closeButton = document.getElementById(closeButtonId) as HTMLButtonElement | null;

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
