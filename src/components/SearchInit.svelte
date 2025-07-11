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

    searchTrigger?.addEventListener('click', () => {
      updatePagefindTheme();
      searchDialog?.showModal();
      searchTrigger.setAttribute('aria-expanded', 'true');
      const searchInput = document.querySelector<HTMLInputElement>('.pagefind-ui__search-input');
      searchInput?.focus();
    });

    closeButton?.addEventListener('click', () => {
      searchDialog?.close();
      searchTrigger?.setAttribute('aria-expanded', 'false');
    });

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

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchDialog?.open) {
        searchDialog.close();
        searchTrigger?.setAttribute('aria-expanded', 'false');
      }
    });

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

    updatePagefindTheme();
  });
</script>
