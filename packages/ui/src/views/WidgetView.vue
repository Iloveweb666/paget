<script setup lang="ts">
/**
 * Widget 空白页 — 提示 Paget AI 已运行
 * Widget blank page — indicates Paget AI is running
 */
</script>

<template>
  <div class="widget-page">
    <div class="widget-page__card">
      <div class="widget-page__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" /><path d="M20 14h2" />
          <path d="M15 13v2" /><path d="M9 13v2" />
        </svg>
      </div>
      <h1 class="widget-page__title">Paget AI 控件</h1>
      <p class="widget-page__hint">
        控件已运行。点击悬浮按钮开始对话。
      </p>
      <p class="widget-page__link">
        访问 <a href="/demo">/demo</a> 查看演示表单页面。
      </p>
      <p class="widget-page__link">
        获取 <a href="/bookmarklet">书签脚本</a> 在任意页面使用 Paget AI。
      </p>
    </div>
  </div>
</template>

<style scoped>
.widget-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.widget-page__card {
  text-align: center;
  padding: 48px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.widget-page__icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  background: #e8f0fe;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.widget-page__icon svg {
  width: 32px;
  height: 32px;
  color: #4285f4;
}

.widget-page__title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 8px;
}

.widget-page__hint {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px;
}

.widget-page__link {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.widget-page__link a {
  color: #4285f4;
  text-decoration: none;
}

.widget-page__link a:hover {
  text-decoration: underline;
}
</style>
