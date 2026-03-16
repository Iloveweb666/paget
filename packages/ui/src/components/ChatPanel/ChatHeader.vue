<script setup lang="ts">
/**
 * 聊天头部组件
 * Chat header component
 *
 * 深色背景、sparkles 图标 + 标题 + 关闭按钮
 * Dark background with sparkles icon + title + close button
 */
import { t } from '@/i18n'

const emit = defineEmits<{ close: []; 'open-ws-log': [] }>()
</script>

<template>
  <div class="chat-header">
    <div class="chat-header__left">
      <!-- Sparkles 图标 / Sparkles icon -->
      <svg class="chat-header__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" /><path d="M19 17v4" />
        <path d="M3 5h4" /><path d="M17 19h4" />
      </svg>
      <span class="chat-header__title">{{ t('chat.title') }}</span>
    </div>
    <div class="chat-header__right">
    <!-- WS 日志按钮 / WS log button -->
    <button class="chat-header__action" :title="t('wsLog.tooltip')" @click="emit('open-ws-log')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
      </svg>
    </button>
    <!-- 关闭按钮 / Close button -->
    <button class="chat-header__action" @click="emit('close')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
      </svg>
    </button>
    </div>
  </div>
</template>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background: var(--paget-primary-dark);
  flex-shrink: 0;
}

.chat-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-header__icon {
  width: 20px;
  height: 20px;
  color: var(--paget-text-inverse);
}

.chat-header__title {
  font-size: var(--paget-font-size-lg);
  font-weight: 600;
  color: var(--paget-text-inverse);
}

.chat-header__right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chat-header__action {
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
  opacity: 0.8;
  transition: opacity var(--paget-transition-fast);
}

.chat-header__action:hover {
  opacity: 1;
}

.chat-header__action svg {
  width: 18px;
  height: 18px;
  color: var(--paget-text-inverse);
}
</style>
