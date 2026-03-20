<script setup lang="ts">
/**
 * Bookmarklet 使用说明页面
 * Bookmarklet usage guide page
 *
 * 提供三种可拖拽的书签按钮：本地 / jsDelivr / npmmirror
 * Provides three draggable bookmark buttons: Local / jsDelivr / npmmirror
 */
import { computed } from 'vue'

// 当前版本号 / Current version
const VERSION = '0.1.3'

// 服务端地址配置 / Server URL configuration
const SERVERS = {
  local: 'ws://localhost:3000',
  production: 'wss://paget.xyz',
}

// CDN 地址配置 / CDN URL configuration
const CDN_URLS = {
  local: 'http://localhost:5173/dist/iife/paget.bookmarklet.js',
  jsdelivr: `https://cdn.jsdelivr.net/npm/@paget/ui@${VERSION}/dist/iife/paget.bookmarklet.js`,
  npmmirror: `https://registry.npmmirror.com/@paget/ui/${VERSION}/files/dist/iife/paget.bookmarklet.js`,
}

// 生成 Bookmarklet 代码的工厂函数 / Factory function to generate Bookmarklet code
function generateBookmarklet(cdnUrl: string, serverUrl: string): string {
  return `javascript:(function(){var s=document.createElement('script');s.src='${cdnUrl}?server=${serverUrl}&t='+Date.now();s.onerror=function(){alert('Paget 加载失败')};document.head.appendChild(s);})();`
}

// 三种 Bookmarklet 配置 / Three Bookmarklet configurations
const bookmarklets = computed(() => [
  {
    id: 'local',
    name: 'Paget AI (Local)',
    description: '本地开发版，连接 localhost:3000',
    descriptionEn: 'Local dev, connects to localhost:3000',
    code: generateBookmarklet(CDN_URLS.local, SERVERS.local),
    color: '#10b981',
    colorLight: 'rgba(16, 185, 129, 0.15)',
    icon: 'code',
  },
  {
    id: 'jsdelivr',
    name: 'Paget AI (Global)',
    description: 'jsDelivr CDN，全球访问',
    descriptionEn: 'jsDelivr CDN, global access',
    code: generateBookmarklet(CDN_URLS.jsdelivr, SERVERS.production),
    color: '#667eea',
    colorLight: 'rgba(102, 126, 234, 0.15)',
    icon: 'globe',
  },
  {
    id: 'npmmirror',
    name: 'Paget AI (China)',
    description: 'npmmirror CDN，中国加速',
    descriptionEn: 'npmmirror CDN, China accelerated',
    code: generateBookmarklet(CDN_URLS.npmmirror, SERVERS.production),
    color: '#f59e0b',
    colorLight: 'rgba(245, 158, 11, 0.15)',
    icon: 'zap',
  },
])
</script>

<template>
  <div class="bookmarklet-page">
    <div class="bookmarklet-page__card">
      <!-- Logo -->
      <div class="bookmarklet-page__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" /><path d="M20 14h2" />
          <path d="M15 13v2" /><path d="M9 13v2" />
        </svg>
      </div>

      <!-- 标题 / Title -->
      <h1 class="bookmarklet-page__title">Paget AI Bookmarklet</h1>
      <p class="bookmarklet-page__subtitle">
        将 AI 助手注入到任意网页中
      </p>

      <!-- 使用步骤 / Usage Steps -->
      <div class="bookmarklet-page__steps">
        <div class="step">
          <div class="step__number">1</div>
          <div class="step__content">
            <h3>选择并拖拽</h3>
            <p>选择下方适合你的版本，拖拽到收藏夹栏</p>
          </div>
        </div>
        <div class="step">
          <div class="step__number">2</div>
          <div class="step__content">
            <h3>打开目标网页</h3>
            <p>访问你想要使用 Paget AI 的网页</p>
          </div>
        </div>
        <div class="step">
          <div class="step__number">3</div>
          <div class="step__content">
            <h3>点击书签</h3>
            <p>点击收藏夹栏中的书签，即可启动 AI 助手</p>
          </div>
        </div>
      </div>

      <!-- 三个可拖拽的书签按钮 / Three draggable bookmark buttons -->
      <div class="bookmarklet-page__buttons">
        <div
          v-for="item in bookmarklets"
          :key="item.id"
          class="bookmarklet-card"
          :style="{ '--card-color': item.color, '--card-color-light': item.colorLight }"
        >
          <a
            class="bookmarklet-card__btn"
            :href="item.code"
            @click.prevent
            title="拖拽到收藏夹栏"
          >
            <!-- Icon -->
            <svg v-if="item.icon === 'code'" class="bookmarklet-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
            <svg v-else-if="item.icon === 'globe'" class="bookmarklet-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <svg v-else class="bookmarklet-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span class="bookmarklet-card__name">{{ item.name }}</span>
          </a>
          <p class="bookmarklet-card__desc">
            {{ item.description }}
          </p>
        </div>
      </div>

      <!-- 提示 / Hint -->
      <p class="bookmarklet-page__hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        拖拽按钮到收藏夹栏即可使用
      </p>

      <!-- CDN 信息 / CDN Info -->
      <details class="bookmarklet-page__cdn">
        <summary>CDN 地址详情</summary>
        <div class="cdn-list">
          <div class="cdn-item">
            <span class="cdn-item__label">Local:</span>
            <code class="cdn-item__url">{{ CDN_URLS.local }}</code>
          </div>
          <div class="cdn-item">
            <span class="cdn-item__label">jsDelivr:</span>
            <code class="cdn-item__url">{{ CDN_URLS.jsdelivr }}</code>
          </div>
          <div class="cdn-item">
            <span class="cdn-item__label">npmmirror:</span>
            <code class="cdn-item__url">{{ CDN_URLS.npmmirror }}</code>
          </div>
        </div>
      </details>

      <!-- 版本信息 / Version -->
      <p class="bookmarklet-page__version">
        v{{ VERSION }}
      </p>

      <!-- 返回链接 / Back Link -->
      <p class="bookmarklet-page__link">
        <router-link to="/">← 返回首页</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.bookmarklet-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 24px;
}

.bookmarklet-page__card {
  max-width: 600px;
  width: 100%;
  text-align: center;
  padding: 48px 40px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.bookmarklet-page__icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bookmarklet-page__icon svg {
  width: 36px;
  height: 36px;
  color: #fff;
}

.bookmarklet-page__title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
}

.bookmarklet-page__subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0 0 32px;
}

.bookmarklet-page__steps {
  text-align: left;
  margin-bottom: 32px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.step:last-child {
  margin-bottom: 0;
}

.step__number {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
}

.step__content h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 2px;
}

.step__content p {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

/* 三个按钮卡片 / Three button cards */
.bookmarklet-page__buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.bookmarklet-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--card-color-light);
  border-radius: 12px;
  text-align: left;
}

.bookmarklet-card__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--card-color);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.bookmarklet-card__btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.bookmarklet-card__btn:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.bookmarklet-card__icon {
  width: 16px;
  height: 16px;
}

.bookmarklet-card__name {
  white-space: nowrap;
}

.bookmarklet-card__desc {
  flex: 1;
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.bookmarklet-page__hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 24px;
  font-size: 13px;
  color: #9ca3af;
}

.bookmarklet-page__hint svg {
  width: 16px;
  height: 16px;
}

.bookmarklet-page__cdn {
  text-align: left;
  margin-bottom: 16px;
}

.bookmarklet-page__cdn summary {
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;
  padding: 8px 0;
}

.cdn-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-top: 8px;
}

.cdn-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
}

.cdn-item__label {
  flex-shrink: 0;
  color: #6b7280;
  min-width: 70px;
  font-weight: 500;
}

.cdn-item__url {
  flex: 1;
  padding: 4px 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 10px;
  color: #374151;
  word-break: break-all;
}

.bookmarklet-page__version {
  font-size: 12px;
  color: #9ca3af;
  margin: 0 0 16px;
}

.bookmarklet-page__link {
  font-size: 14px;
  margin: 0;
}

.bookmarklet-page__link a {
  color: #667eea;
  text-decoration: none;
}

.bookmarklet-page__link a:hover {
  text-decoration: underline;
}
</style>
