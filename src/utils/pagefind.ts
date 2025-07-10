export function initSearch() {
    // Get DOM elements with proper typing
    const searchTrigger = document.getElementById('search-trigger') as HTMLButtonElement | null;
    const searchDialog = document.getElementById('search-dialog') as HTMLDialogElement | null;
    const closeButton = document.getElementById('close-search') as HTMLButtonElement | null;

    function getCurrentTheme(): 'light' | 'dark' {
      if (document.documentElement.classList.contains('dark')) {
        return 'dark';
      }
      return 'light';
    }

    // Function to update pagefind theme
    function updatePagefindTheme() {
      const theme = getCurrentTheme();
      const dialog = searchDialog;

      if (dialog) {
        // Apply theme class to dialog for CSS variables
        if (theme === 'dark') {
          dialog.classList.add('dark');
        } else {
          dialog.classList.remove('dark');
        }
      }
    }
    
    searchTrigger?.addEventListener('click', () => {
      updatePagefindTheme(); // Update theme before showing
      searchDialog?.showModal();
      searchTrigger.setAttribute('aria-expanded', 'true');
      // Focus the search input when dialog opens
      const searchInput = document.querySelector<HTMLInputElement>('.pagefind-ui__search-input');
      searchInput?.focus();
    });

    // Close dialog
    closeButton?.addEventListener('click', () => {
      searchDialog?.close();
      searchTrigger?.setAttribute('aria-expanded', 'false');
    });

    // Close dialog when clicking outside
    searchDialog?.addEventListener('click', (e: MouseEvent) => {
      if (!searchDialog) return;

      const dialogDimensions = searchDialog.getBoundingClientRect();
      if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
      ) {
        searchDialog.close();
        searchTrigger?.setAttribute('aria-expanded', 'false');
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchDialog?.open) {
        searchDialog.close();
        searchTrigger?.setAttribute('aria-expanded', 'false');
      }
    });

    // Watch for theme changes
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

    // Observe theme changes on document element and body
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
}

if (document.readyState !== 'loading') {
  initSearch();
} else {
  document.addEventListener('DOMContentLoaded', initSearch, { once: true });
}

document.addEventListener('astro:after-swap', initSearch);