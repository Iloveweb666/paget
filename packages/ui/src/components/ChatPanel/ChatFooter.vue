<script setup lang="ts">
/**
 * 聊天底部组件（工具栏 + 输入区域）
 * Chat footer component (toolbar + input area)
 *
 * 包含附件按钮、设置按钮、消息输入框、发送/停止按钮
 * Contains attachment button, settings button, message input, send/stop button
 */
import { t } from '@/i18n'

// 双向绑定的输入文本 / Two-way bound input text
const inputText = defineModel<string>({ required: true })

defineProps<{
  /** Agent 是否正在运行 / Whether the agent is running */
  isRunning: boolean
}>()

const emit = defineEmits<{
  send: []
  stop: []
  openSettings: []
  openBrowserState: []
}>()

/**
 * 键盘事件处理：Enter 键发送（Shift+Enter 换行）
 * Keyboard handler: Enter to send (Shift+Enter for newline)
 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    emit('send')
  }
}
</script>

<template>
  <div class="chat-footer">
    <!-- 分割线 / Divider -->
    <div class="chat-footer__divider" />

    <!-- 工具栏 / Toolbar -->
    <div class="chat-footer__toolbar">
      <!-- 附件按钮（暂未实现）/ Attachment button (not yet implemented) -->
      <button class="chat-footer__tool-btn" disabled title="附件">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      </button>
      <!-- 页面状态按钮 / Browser state button -->
      <button class="chat-footer__tool-btn" :title="t('browserState.tooltip')" @click="emit('openBrowserState')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
        </svg>
      </button>
      <!-- 设置按钮 / Settings button -->
      <button class="chat-footer__tool-btn" :title="t('chat.settings')" @click="emit('openSettings')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>

    <!-- 分割线 / Divider -->
    <div class="chat-footer__divider" />

    <!-- 输入区域 / Input area -->
    <div class="chat-footer__input-area">
      <div class="chat-footer__input-field">
        <input
          v-model="inputText"
          type="text"
          class="chat-footer__input"
          :placeholder="t('chat.placeholder')"
          :disabled="isRunning"
          @keydown="handleKeydown"
        />
      </div>
      <!-- 发送/停止按钮 / Send/Stop button -->
      <button
        v-if="isRunning"
        class="chat-footer__action-btn chat-footer__action-btn--stop"
        @click="emit('stop')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
      </button>
      <button
        v-else
        class="chat-footer__action-btn chat-footer__action-btn--send"
        :disabled="!inputText.trim()"
        @click="emit('send')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-footer {
  flex-shrink: 0;
}

.chat-footer__divider {
  height: 1px;
  background: var(--paget-border);
}

.chat-footer__toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 40px;
  padding: 0 14px;
  background: var(--paget-bg);
}

.chat-footer__tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--paget-radius-sm);
  transition: background var(--paget-transition-fast);
}

.chat-footer__tool-btn:hover:not(:disabled) {
  background: var(--paget-bg-tertiary);
}

.chat-footer__tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-footer__tool-btn svg {
  width: 20px;
  height: 20px;
  color: var(--paget-text-secondary);
}

.chat-footer__input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
  padding: 8px 12px;
  background: var(--paget-bg);
}

.chat-footer__input-field {
  flex: 1;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  background: var(--paget-bg-tertiary);
  border-radius: 20px;
}

.chat-footer__input {
  width: 100%;
  border: none;
  background: none;
  outline: none;
  font-family: var(--paget-font-family);
  font-size: var(--paget-font-size-md);
  color: var(--paget-text);
}

.chat-footer__input::placeholder {
  color: var(--paget-text-tertiary);
}

.chat-footer__input:disabled {
  cursor: not-allowed;
}

.chat-footer__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 18px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: opacity var(--paget-transition-fast);
}

.chat-footer__action-btn--send {
  background: var(--paget-primary);
}

.chat-footer__action-btn--send svg {
  width: 16px;
  height: 16px;
  color: var(--paget-text-inverse);
}

.chat-footer__action-btn--send:hover:not(:disabled) {
  opacity: 0.9;
}

.chat-footer__action-btn--send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-footer__action-btn--stop {
  background: var(--paget-error-light);
}

.chat-footer__action-btn--stop svg {
  width: 14px;
  height: 14px;
  color: var(--paget-error);
}

.chat-footer__action-btn--stop:hover {
  opacity: 0.85;
}
</style>
