<script setup lang="ts">
defineProps<{
  code: string
  language?: string
}>()
</script>

<template>
  <pre class="code-block"><code>{{ code }}</code></pre>
</template>

<style scoped>
.code-block {
  padding: 12px;
  border-radius: var(--paget-radius-sm);
  background: #1e1e2e;
  color: #cdd6f4;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  margin: 8px 0;
}
</style>
