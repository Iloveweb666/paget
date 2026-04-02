<script setup lang="ts">
/**
 * WebSocket 日志调试面板
 * WebSocket log debug panel
 *
 * 覆盖在 ChatPanel 之上，展示所有 WS 收发事件日志
 * Overlays on ChatPanel, displays all WS send/receive event logs
 */
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { wsLogger, type WSLogEntry } from '@/composables/useWSLogger'
import { useChatStore } from '@/stores/chat'
import { t } from '@/i18n'

const emit = defineEmits<{ close: [] }>()
const chatStore = useChatStore()
const { sessionId, messages, history, status, activity } = storeToRefs(chatStore)

// 日志列表（响应式快照）/ Log list (reactive snapshot)
const logs = ref<WSLogEntry[]>([])
// 展开的条目索引 / Expanded entry index
const expandedIndex = ref<number | null>(null)
// 刷新计数器（用于触发重新获取）/ Refresh counter (triggers re-fetch)
const refreshKey = ref(0)

// 获取最新日志（倒序显示最新的在前）/ Get latest logs (newest first)
const displayLogs = computed(() => {
  // eslint-disable-next-line no-unused-expressions
  refreshKey.value // 依赖触发 / dependency trigger
  return [...logs.value].reverse()
})

const latestUserMessage = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].role === 'user') {
      return messages.value[i]
    }
  }
  return null
})

const canExportRecentConversation = computed(() => latestUserMessage.value !== null)

onMounted(() => {
  refreshLogs()
})

/**
 * 刷新日志列表 / Refresh log list
 */
function refreshLogs() {
  logs.value = wsLogger.getLogs()
  refreshKey.value++
}

/**
 * 切换条目展开/折叠 / Toggle entry expand/collapse
 */
function toggleExpand(index: number) {
  expandedIndex.value = expandedIndex.value === index ? null : index
}

/**
 * 格式化时间戳 / Format timestamp
 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
}

/**
 * 数据摘要（截取前80字符）/ Data summary (truncate to 80 chars)
 */
function summarize(data: unknown): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data)
  return str && str.length > 80 ? str.slice(0, 80) + '...' : (str || '—')
}

/**
 * 清空日志 / Clear logs
 */
function handleClear() {
  wsLogger.clearLogs()
  logs.value = []
  expandedIndex.value = null
  refreshKey.value++
}

/**
 * 导出日志到剪贴板 / Export logs to clipboard
 */
async function handleExport() {
  const json = wsLogger.exportLogs()
  await writeJsonToClipboard(json)
}

function buildRecentConversationExport(): Record<string, unknown> | null {
  const userMessage = latestUserMessage.value
  if (!userMessage) return null

  const startIndex = messages.value.findIndex((message) => message.id === userMessage.id)
  const taskRunId = userMessage.taskRunId
  const submitLog = [...logs.value]
    .reverse()
    .find((entry) => {
      if (entry.direction !== 'send' || entry.event !== 'task:submit') return false
      const data = entry.data as { taskRunId?: unknown; sessionId?: unknown } | undefined
      if (!data) return false
      if (taskRunId && data.taskRunId === taskRunId) return true
      return data.sessionId === sessionId.value && entry.timestamp >= userMessage.timestamp
    })

  const startTimestamp = submitLog?.timestamp ?? userMessage.timestamp
  const conversationMessages =
    startIndex >= 0 ? messages.value.slice(startIndex) : [userMessage]
  const conversationHistory = taskRunId
    ? history.value.filter((event) => event.taskRunId === taskRunId)
    : history.value.filter((event) => event.timestamp >= startTimestamp)
  const conversationLogs = logs.value.filter((entry) => entry.timestamp >= startTimestamp)

  return {
    exportedAt: Date.now(),
    sessionId: sessionId.value,
    taskRunId: taskRunId ?? null,
    status: status.value,
    activity: activity.value,
    userMessage,
    messages: conversationMessages,
    history: conversationHistory,
    wsLogs: conversationLogs,
  }
}

async function handleExportRecentConversation() {
  const payload = buildRecentConversationExport()
  if (!payload) return
  const json = JSON.stringify(payload, null, 2)
  await writeJsonToClipboard(json)
}

async function writeJsonToClipboard(json: string) {
  try {
    await navigator.clipboard.writeText(json)
  } catch {
    // 降级：弹出文本便于手动复制 / Fallback: prompt for manual copy
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(`<pre>${json.replace(/</g, '&lt;')}</pre>`)
    }
  }
}
</script>

<template>
  <div class="ws-log-panel">
    <!-- 工具栏 / Toolbar -->
    <div class="ws-log-panel__toolbar">
      <span class="ws-log-panel__title">{{ t('wsLog.title') }}</span>
      <div class="ws-log-panel__actions">
        <button class="ws-log-panel__btn" @click="refreshLogs" :title="t('wsLog.refresh')">
          <!-- 刷新图标 / Refresh icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </button>
        <button class="ws-log-panel__btn" @click="handleClear" :title="t('wsLog.clear')">
          <!-- 清空图标 / Clear icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
        <button class="ws-log-panel__btn" @click="handleExport" :title="t('wsLog.export')">
          <!-- 导出图标 / Export icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <button
          class="ws-log-panel__btn"
          @click="handleExportRecentConversation"
          :title="t('wsLog.exportRecentConversation')"
          :disabled="!canExportRecentConversation"
        >
          <!-- 最近一次对话导出图标 / Recent conversation export icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 7h8" />
            <path d="M8 11h5" />
            <path d="M12 3H6a2 2 0 0 0-2 2v14l4-3h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
            <path d="M16 8h2a2 2 0 0 1 2 2v11l-4-3h-2a2 2 0 0 1-2-2v-1" />
          </svg>
        </button>
        <button class="ws-log-panel__btn ws-log-panel__btn--close" @click="emit('close')">
          <!-- 关闭图标 / Close icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 日志列表 / Log list -->
    <div class="ws-log-panel__list">
      <div v-if="displayLogs.length === 0" class="ws-log-panel__empty">
        {{ t('wsLog.empty') }}
      </div>
      <div
        v-for="(entry, index) in displayLogs"
        :key="entry.timestamp + '-' + index"
        class="ws-log-panel__entry"
        @click="toggleExpand(index)"
      >
        <div class="ws-log-panel__row">
          <span class="ws-log-panel__time">{{ formatTime(entry.timestamp) }}</span>
          <span
            class="ws-log-panel__direction"
            :class="entry.direction === 'send' ? 'ws-log-panel__direction--send' : 'ws-log-panel__direction--receive'"
          >
            {{ entry.direction === 'send' ? '↑' : '↓' }}
          </span>
          <span class="ws-log-panel__event">{{ entry.event }}</span>
          <span class="ws-log-panel__summary">{{ summarize(entry.data) }}</span>
        </div>
        <!-- 展开详情 / Expanded detail -->
        <pre
          v-if="expandedIndex === index"
          class="ws-log-panel__detail"
        >{{ JSON.stringify(entry.data, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ws-log-panel {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  background: var(--paget-bg);
  font-family: var(--paget-font-family);
}

.ws-log-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 12px;
  background: var(--paget-bg-secondary);
  border-bottom: 1px solid var(--paget-border);
  flex-shrink: 0;
}

.ws-log-panel__title {
  font-size: var(--paget-font-size-md);
  font-weight: 600;
  color: var(--paget-text);
}

.ws-log-panel__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ws-log-panel__btn {
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

.ws-log-panel__btn:hover {
  color: var(--paget-text);
  background: var(--paget-bg-tertiary);
}

.ws-log-panel__btn svg {
  width: 16px;
  height: 16px;
}

.ws-log-panel__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ws-log-panel__btn:disabled:hover {
  color: var(--paget-text-secondary);
  background: none;
}

.ws-log-panel__btn--close {
  color: var(--paget-text-tertiary);
}

.ws-log-panel__btn--close:hover {
  color: var(--paget-error);
}

.ws-log-panel__list {
  flex: 1;
  overflow-y: auto;
  font-size: var(--paget-font-size-xs);
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
}

.ws-log-panel__empty {
  padding: 24px;
  text-align: center;
  color: var(--paget-text-tertiary);
  font-size: var(--paget-font-size-sm);
  font-family: var(--paget-font-family);
}

.ws-log-panel__entry {
  padding: 6px 12px;
  border-bottom: 1px solid var(--paget-border-light);
  cursor: pointer;
  transition: background var(--paget-transition-fast);
}

.ws-log-panel__entry:hover {
  background: var(--paget-bg-secondary);
}

.ws-log-panel__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 22px;
}

.ws-log-panel__time {
  color: var(--paget-text-tertiary);
  flex-shrink: 0;
  width: 80px;
}

.ws-log-panel__direction {
  flex-shrink: 0;
  width: 16px;
  text-align: center;
  font-weight: 700;
}

.ws-log-panel__direction--send {
  color: var(--paget-success);
}

.ws-log-panel__direction--receive {
  color: var(--paget-info);
}

.ws-log-panel__event {
  color: var(--paget-primary);
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
}

.ws-log-panel__summary {
  color: var(--paget-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.ws-log-panel__detail {
  margin: 6px 0 2px;
  padding: 8px;
  background: var(--paget-bg-tertiary);
  border-radius: var(--paget-radius-sm);
  color: var(--paget-text);
  font-size: var(--paget-font-size-xs);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
</style>
