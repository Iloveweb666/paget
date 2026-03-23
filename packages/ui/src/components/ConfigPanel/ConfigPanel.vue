<script setup lang="ts">
/**
 * 全局设置弹窗组件
 * Global settings modal component
 *
 * 居中显示的模态弹窗，包含语言选择、遮罩层开关、深色模式等设置项
 * Centered modal dialog with language selector, mask toggle, dark mode, etc.
 */
import { ref, watch } from 'vue'
import type { PagetConfig } from '@/composables'
import { t } from '@/i18n'

// 双向绑定的用户配置 / Two-way bound user configuration
const config = defineModel<PagetConfig>('config', { required: true })

const emit = defineEmits<{ close: [] }>()

// 编辑中的临时副本（点保存才应用）/ Temporary copy for editing (applied on save)
const draft = ref<PagetConfig>({ ...config.value })

// 当外部配置变化时同步副本 / Sync draft when external config changes
watch(config, (val) => { draft.value = { ...val } }, { deep: true })

/**
 * 保存设置：将副本写回配置 / Save settings: write draft back to config
 */
function handleSave() {
  const safeMaxSteps = Number.isFinite(draft.value.maxSteps)
    ? Math.max(1, Math.min(200, Math.floor(draft.value.maxSteps)))
    : 40
  config.value = { ...draft.value, maxSteps: safeMaxSteps }
  emit('close')
}

/**
 * 取消编辑 / Cancel editing
 */
function handleCancel() {
  emit('close')
}

/**
 * 点击遮罩层关闭 / Close on backdrop click
 */
function handleBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('settings-overlay')) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="settings-overlay" @click="handleBackdropClick">
      <div class="settings-modal">
        <!-- 头部 / Header -->
        <div class="settings-modal__header">
          <span class="settings-modal__title">{{ t('settings.title') }}</span>
          <div class="settings-modal__header-space" />
          <button class="settings-modal__close" @click="handleCancel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <!-- 分割线 / Divider -->
        <div class="settings-modal__divider" />

        <!-- 内容 / Content -->
        <div class="settings-modal__content">
          <!-- 语言选择 / Language selector -->
          <div class="settings-modal__section">
            <label class="settings-modal__label">{{ t('settings.language') }}</label>
            <div class="settings-modal__select-wrapper">
              <select v-model="draft.locale" class="settings-modal__select">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
              <svg class="settings-modal__select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <!-- 最大步数 / Max steps -->
          <div class="settings-modal__section">
            <label class="settings-modal__label">{{ t('settings.maxSteps') }}</label>
            <input
              v-model.number="draft.maxSteps"
              class="settings-modal__input"
              type="number"
              min="1"
              max="200"
              step="1"
            />
          </div>

          <!-- 分割线 / Divider -->
          <div class="settings-modal__divider--light" />

          <!-- 展示遮罩层 / Show mask toggle -->
          <div class="settings-modal__row">
            <span class="settings-modal__row-label">{{ t('settings.showMask') }}</span>
            <div class="settings-modal__row-space" />
            <label class="settings-modal__toggle" :class="{ 'settings-modal__toggle--on': draft.showMask }">
              <input v-model="draft.showMask" type="checkbox" class="settings-modal__toggle-input" />
              <span class="settings-modal__toggle-track">
                <span class="settings-modal__toggle-dot" />
              </span>
            </label>
          </div>

          <!-- 深色模式 / Dark mode toggle -->
          <div class="settings-modal__row">
            <span class="settings-modal__row-label">{{ t('settings.darkMode') }}</span>
            <div class="settings-modal__row-space" />
            <label class="settings-modal__toggle" :class="{ 'settings-modal__toggle--on': draft.darkMode }">
              <input v-model="draft.darkMode" type="checkbox" class="settings-modal__toggle-input" />
              <span class="settings-modal__toggle-track">
                <span class="settings-modal__toggle-dot" />
              </span>
            </label>
          </div>

          <!-- 消息通知 / Notification toggle -->
          <div class="settings-modal__row">
            <span class="settings-modal__row-label">{{ t('settings.notification') }}</span>
            <div class="settings-modal__row-space" />
            <label class="settings-modal__toggle" :class="{ 'settings-modal__toggle--on': draft.notification }">
              <input v-model="draft.notification" type="checkbox" class="settings-modal__toggle-input" />
              <span class="settings-modal__toggle-track">
                <span class="settings-modal__toggle-dot" />
              </span>
            </label>
          </div>

          <!-- 自动翻译 / Auto translate toggle -->
          <div class="settings-modal__row">
            <span class="settings-modal__row-label">{{ t('settings.autoTranslate') }}</span>
            <div class="settings-modal__row-space" />
            <label class="settings-modal__toggle" :class="{ 'settings-modal__toggle--on': draft.autoTranslate }">
              <input v-model="draft.autoTranslate" type="checkbox" class="settings-modal__toggle-input" />
              <span class="settings-modal__toggle-track">
                <span class="settings-modal__toggle-dot" />
              </span>
            </label>
          </div>
        </div>

        <!-- 分割线 / Divider -->
        <div class="settings-modal__divider" />

        <!-- 底部按钮 / Footer buttons -->
        <div class="settings-modal__footer">
          <button class="settings-modal__btn settings-modal__btn--cancel" @click="handleCancel">
            {{ t('settings.cancel') }}
          </button>
          <button class="settings-modal__btn settings-modal__btn--save" @click="handleSave">
            {{ t('settings.save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* 遮罩层 / Overlay backdrop */
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  animation: fade-in 200ms ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 弹窗容器 / Modal container */
.settings-modal {
  width: 380px;
  background: var(--paget-bg);
  border: 1px solid var(--paget-border);
  border-radius: var(--paget-radius-xl);
  box-shadow: var(--paget-shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modal-in 250ms ease;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* 头部 / Header */
.settings-modal__header {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 20px;
}

.settings-modal__title {
  font-size: var(--paget-font-size-xl);
  font-weight: 600;
  color: var(--paget-text);
}

.settings-modal__header-space {
  flex: 1;
}

.settings-modal__close {
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
  transition: background var(--paget-transition-fast);
}

.settings-modal__close:hover {
  background: var(--paget-bg-tertiary);
}

.settings-modal__close svg {
  width: 20px;
  height: 20px;
  color: var(--paget-text-tertiary);
}

/* 分割线 / Dividers */
.settings-modal__divider {
  height: 1px;
  background: var(--paget-border);
}

.settings-modal__divider--light {
  height: 1px;
  background: var(--paget-bg-tertiary);
}

/* 内容区域 / Content area */
.settings-modal__content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

/* 语言选择区 / Language section */
.settings-modal__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-modal__label {
  font-size: var(--paget-font-size-md);
  font-weight: 500;
  color: var(--paget-text);
}

.settings-modal__select-wrapper {
  position: relative;
}

.settings-modal__select {
  width: 100%;
  height: 40px;
  padding: 0 36px 0 12px;
  border: 1px solid var(--paget-border);
  border-radius: var(--paget-radius-md);
  background: var(--paget-bg-secondary);
  font-family: var(--paget-font-family);
  font-size: var(--paget-font-size-md);
  color: var(--paget-text);
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.settings-modal__input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--paget-border);
  border-radius: var(--paget-radius-md);
  background: var(--paget-bg-secondary);
  font-family: var(--paget-font-family);
  font-size: var(--paget-font-size-md);
  color: var(--paget-text);
  outline: none;
}

.settings-modal__select:focus {
  border-color: var(--paget-primary);
}

.settings-modal__input:focus {
  border-color: var(--paget-primary);
}

.settings-modal__select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--paget-text-tertiary);
  pointer-events: none;
}

/* 设置行 / Settings row */
.settings-modal__row {
  display: flex;
  align-items: center;
}

.settings-modal__row-label {
  font-size: var(--paget-font-size-md);
  color: var(--paget-text);
}

.settings-modal__row-space {
  flex: 1;
}

/* 开关组件 / Toggle switch */
.settings-modal__toggle {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}

.settings-modal__toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.settings-modal__toggle-track {
  width: 44px;
  height: 24px;
  background: #D1D5DB;
  border-radius: 12px;
  position: relative;
  transition: background var(--paget-transition-normal);
}

.settings-modal__toggle--on .settings-modal__toggle-track {
  background: var(--paget-primary);
}

.settings-modal__toggle-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: var(--paget-bg);
  border-radius: 50%;
  transition: transform var(--paget-transition-normal);
}

.settings-modal__toggle--on .settings-modal__toggle-dot {
  transform: translateX(20px);
}

/* 底部按钮区 / Footer buttons */
.settings-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  height: 64px;
  padding: 0 20px;
}

.settings-modal__btn {
  height: 36px;
  padding: 0 20px;
  border-radius: var(--paget-radius-md);
  font-family: var(--paget-font-family);
  font-size: var(--paget-font-size-md);
  cursor: pointer;
  border: none;
  transition: opacity var(--paget-transition-fast);
}

.settings-modal__btn--cancel {
  background: none;
  border: 1px solid var(--paget-border);
  color: var(--paget-text-secondary);
}

.settings-modal__btn--cancel:hover {
  background: var(--paget-bg-tertiary);
}

.settings-modal__btn--save {
  background: var(--paget-primary);
  color: var(--paget-text-inverse);
  font-weight: 500;
}

.settings-modal__btn--save:hover {
  opacity: 0.9;
}
</style>
