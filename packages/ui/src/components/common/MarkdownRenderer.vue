<script setup lang="ts">
/**
 * Markdown 渲染组件
 * Markdown renderer component
 *
 * 使用 marked 库将 Markdown 文本解析为 HTML 并渲染
 * Uses the marked library to parse Markdown text into HTML and render it
 */
import { computed } from 'vue'
import { marked } from 'marked'

// 组件属性：Markdown 文本内容 / Props: Markdown text content
const props = defineProps<{
  content: string
}>()

// 将 Markdown 内容解析为 HTML 字符串 / Parse Markdown content into HTML string
const html = computed(() => {
  return marked.parse(props.content, { async: false }) as string
})
</script>

<template>
  <div class="markdown-body" v-html="html" />
</template>

<style scoped>
.markdown-body {
  font-size: var(--paget-font-size-sm);
  line-height: 1.6;
  word-break: break-word;
}

.markdown-body :deep(p) {
  margin: 0 0 8px;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(code) {
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
  background: var(--paget-bg-tertiary);
}

.markdown-body :deep(pre) {
  padding: 8px 12px;
  border-radius: var(--paget-radius-sm);
  background: var(--paget-bg-tertiary);
  overflow-x: auto;
  margin: 8px 0;
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: none;
}
</style>
