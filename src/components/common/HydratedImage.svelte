<script lang="ts">
  export let src: string;
  export let attributes: Record<string, any> = {};
</script>

<img {...attributes} {src} />
