<script setup lang="ts">
/**
 * 浏览器状态查看面板
 * Browser state viewer panel
 *
 * 展示当前页面传给 LLM 的结构化 BrowserState 数据
 * Displays the structured BrowserState data sent to the LLM for the current page
 */
import { ref } from 'vue'
import { t } from '@/i18n'

interface BrowserStateData {
  url: string
  title: string
  header: string
  content: string
  footer: string
}

const props = defineProps<{
  /** 获取 BrowserState 的异步函数 / Async function to fetch BrowserState */
  fetchState: () => Promise<BrowserStateData>
}>()

const emit = defineEmits<{ close: [] }>()

// 加载状态 / Loading state
const loading = ref(false)
// 错误信息 / Error message
const error = ref<string | null>(null)
// BrowserState 数据 / BrowserState data
const stateData = ref<BrowserStateData | null>(null)
// 当前展开的区块 / Currently expanded section
const expandedSection = ref<string | null>('content')

// 区块定义 / Section definitions
const sections = [
  { key: 'url', icon: 'link' },
  { key: 'title', icon: 'heading' },
  { key: 'header', icon: 'info' },
  { key: 'content', icon: 'code' },
  { key: 'footer', icon: 'chevron-down' },
] as const

/**
 * 获取最新的 BrowserState / Fetch latest BrowserState
 */
async function fetchBrowserState() {
  loading.value = true
  error.value = null
  try {
    stateData.value = await props.fetchState()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

/**
 * 切换区块展开/折叠 / Toggle section expand/collapse
 */
function toggleSection(key: string) {
  expandedSection.value = expandedSection.value === key ? null : key
}

/**
 * 获取区块内容行数 / Get section content line count
 */
function lineCount(text: string): number {
  return text ? text.split('\n').length : 0
}

/**
 * 获取区块内容字符数 / Get section content char count
 */
function charCount(text: string): number {
  return text ? text.length : 0
}

/**
 * 复制内容到剪贴板 / Copy content to clipboard
 */
async function copySection(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // 降级处理 / Fallback
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(`<pre>${text.replace(/</g, '&lt;')}</pre>`)
    }
  }
}

/**
 * 导出完整状态 JSON / Export full state as JSON
 */
async function handleExport() {
  if (!stateData.value) return
  const json = JSON.stringify(stateData.value, null, 2)
  try {
    await navigator.clipboard.writeText(json)
  } catch {
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(`<pre>${json.replace(/</g, '&lt;')}</pre>`)
    }
  }
}

// 初始化时自动获取 / Auto-fetch on init
fetchBrowserState()
</script>

<template>
  <div class="bs-panel">
    <!-- 工具栏 / Toolbar -->
    <div class="bs-panel__toolbar">
      <span class="bs-panel__title">{{ t('browserState.title') }}</span>
      <div class="bs-panel__actions">
        <!-- 刷新按钮 / Refresh button -->
        <button class="bs-panel__btn" @click="fetchBrowserState" :title="t('browserState.refresh')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </button>
        <!-- 导出按钮 / Export button -->
        <button class="bs-panel__btn" @click="handleExport" :title="t('browserState.export')" :disabled="!stateData">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <!-- 关闭按钮 / Close button -->
        <button class="bs-panel__btn bs-panel__btn--close" @click="emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 内容区域 / Content area -->
    <div class="bs-panel__body">
      <!-- 加载中 / Loading -->
      <div v-if="loading" class="bs-panel__loading">
        <div class="bs-panel__spinner" />
        <span>{{ t('browserState.loading') }}</span>
      </div>

      <!-- 错误 / Error -->
      <div v-else-if="error" class="bs-panel__error">
        <span>{{ error }}</span>
        <button class="bs-panel__retry" @click="fetchBrowserState">{{ t('browserState.retry') }}</button>
      </div>

      <!-- 数据展示 / Data display -->
      <template v-else-if="stateData">
        <div
          v-for="section in sections"
          :key="section.key"
          class="bs-panel__section"
        >
          <!-- 区块头 / Section header -->
          <div
            class="bs-panel__section-header"
            @click="toggleSection(section.key)"
          >
            <div class="bs-panel__section-left">
              <!-- 展开箭头 / Expand arrow -->
              <svg
                class="bs-panel__arrow"
                :class="{ 'bs-panel__arrow--expanded': expandedSection === section.key }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
              <span class="bs-panel__section-name">{{ t(`browserState.section.${section.key}`) }}</span>
            </div>
            <div class="bs-panel__section-meta">
              <span class="bs-panel__section-stats">
                {{ charCount(stateData[section.key]) }} {{ t('browserState.chars') }}
                <template v-if="lineCount(stateData[section.key]) > 1">
                  · {{ lineCount(stateData[section.key]) }} {{ t('browserState.lines') }}
                </template>
              </span>
              <!-- 复制按钮 / Copy button -->
              <button
                class="bs-panel__copy"
                @click.stop="copySection(stateData[section.key])"
                :title="t('browserState.copy')"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>
          <!-- 区块内容 / Section content -->
          <div
            v-if="expandedSection === section.key"
            class="bs-panel__section-content"
          >
            <pre class="bs-panel__pre">{{ stateData[section.key] || '—' }}</pre>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.bs-panel {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  background: var(--paget-bg);
  font-family: var(--paget-font-family);
}

.bs-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 12px;
  background: var(--paget-bg-secondary);
  border-bottom: 1px solid var(--paget-border);
  flex-shrink: 0;
}

.bs-panel__title {
  font-size: var(--paget-font-size-md);
  font-weight: 600;
  color: var(--paget-text);
}

.bs-panel__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.bs-panel__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--paget-radius-sm);
  padding: 0;
  color: var(--paget-text-secondary);
  transition: color var(--paget-transition-fast), background var(--paget-transition-fast);
}

.bs-panel__btn:hover:not(:disabled) {
  color: var(--paget-text);
  background: var(--paget-bg-tertiary);
}

.bs-panel__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bs-panel__btn svg {
  width: 16px;
  height: 16px;
}

.bs-panel__btn--close:hover {
  color: var(--paget-error);
}

.bs-panel__body {
  flex: 1;
  overflow-y: auto;
}

/* 加载状态 / Loading state */
.bs-panel__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 200px;
  color: var(--paget-text-tertiary);
  font-size: var(--paget-font-size-sm);
}

.bs-panel__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--paget-border);
  border-top-color: var(--paget-primary);
  border-radius: 50%;
  animation: bs-spin 0.8s linear infinite;
}

@keyframes bs-spin {
  to { transform: rotate(360deg); }
}

/* 错误状态 / Error state */
.bs-panel__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 200px;
  padding: 24px;
  text-align: center;
  color: var(--paget-error);
  font-size: var(--paget-font-size-sm);
}

.bs-panel__retry {
  padding: 4px 16px;
  border: 1px solid var(--paget-border);
  border-radius: var(--paget-radius-sm);
  background: var(--paget-bg);
  color: var(--paget-text);
  cursor: pointer;
  font-size: var(--paget-font-size-sm);
}

.bs-panel__retry:hover {
  background: var(--paget-bg-secondary);
}

/* 区块 / Section */
.bs-panel__section {
  border-bottom: 1px solid var(--paget-border-light);
}

.bs-panel__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background var(--paget-transition-fast);
}

.bs-panel__section-header:hover {
  background: var(--paget-bg-secondary);
}

.bs-panel__section-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bs-panel__arrow {
  width: 14px;
  height: 14px;
  color: var(--paget-text-tertiary);
  transition: transform var(--paget-transition-fast);
  flex-shrink: 0;
}

.bs-panel__arrow--expanded {
  transform: rotate(90deg);
}

.bs-panel__section-name {
  font-size: var(--paget-font-size-sm);
  font-weight: 600;
  color: var(--paget-text);
}

.bs-panel__section-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bs-panel__section-stats {
  font-size: var(--paget-font-size-xs);
  color: var(--paget-text-tertiary);
  white-space: nowrap;
}

.bs-panel__copy {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--paget-radius-sm);
  padding: 0;
  color: var(--paget-text-tertiary);
  transition: color var(--paget-transition-fast), background var(--paget-transition-fast);
}

.bs-panel__copy:hover {
  color: var(--paget-primary);
  background: var(--paget-bg-tertiary);
}

.bs-panel__copy svg {
  width: 14px;
  height: 14px;
}

/* 区块内容 / Section content */
.bs-panel__section-content {
  padding: 0 12px 10px;
}

.bs-panel__pre {
  margin: 0;
  padding: 10px;
  background: var(--paget-bg-tertiary);
  border-radius: var(--paget-radius-sm);
  color: var(--paget-text);
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: var(--paget-font-size-xs);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.5;
}
</style>
