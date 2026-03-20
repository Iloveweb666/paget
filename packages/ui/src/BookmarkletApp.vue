<script setup lang="ts">
/**
 * Bookmarklet 根组件 — FAB 悬浮按钮 + 对话框（无路由依赖）
 * Bookmarklet root component — FAB + dialog (no router dependency)
 *
 * 专为 Bookmarklet 注入场景设计，不依赖 vue-router
 * Designed for Bookmarklet injection, no vue-router dependency
 */
import { ref, computed } from 'vue'
import { AgentStatus } from '@paget/shared'
import FloatingButton from './components/FloatingButton.vue'
import ChatPanel from './components/ChatPanel/ChatPanel.vue'
import { useChatStore } from '@/stores/chat'

// 对话框是否展开 / Whether the dialog is expanded
const dialogVisible = ref(false)
// FAB 组件引用 / FAB component ref
const fabRef = ref<InstanceType<typeof FloatingButton> | null>(null)
// 记录打开对话框时 FAB 的位置 / Record FAB position when opening dialog
const fabPosition = ref({ x: 0, y: 0 })

// 使用 Pinia store 共享 Agent 状态（FAB 和 Dialog 共用）/ Share agent status via Pinia store
const chatStore = useChatStore()
const isRunning = computed(() => chatStore.status === AgentStatus.RUNNING)

// 对话框尺寸 / Dialog dimensions
const DIALOG_W = 400
const DIALOG_H = 640
const FAB_SIZE = 56

/**
 * 计算对话框位置：根据 FAB 位置决定展开方向
 * Calculate dialog position: determine expansion direction based on FAB position
 */
const dialogStyle = computed(() => {
  const fx = fabPosition.value.x
  const fy = fabPosition.value.y
  const vw = window.innerWidth
  const vh = window.innerHeight

  // FAB 中心点 / FAB center point
  const cx = fx + FAB_SIZE / 2
  const cy = fy + FAB_SIZE / 2

  // 在右半边则向左展开，否则向右 / Right half: expand left, otherwise right
  let dx: number
  if (cx > vw / 2) {
    dx = fx + FAB_SIZE - DIALOG_W
  } else {
    dx = fx
  }

  // 在下半边则向上展开，否则向下 / Bottom half: expand up, otherwise down
  let dy: number
  if (cy > vh / 2) {
    dy = fy + FAB_SIZE - DIALOG_H
  } else {
    dy = fy
  }

  // 视口限位 / Viewport clamping
  dx = Math.max(8, Math.min(dx, vw - DIALOG_W - 8))
  dy = Math.max(8, Math.min(dy, vh - DIALOG_H - 8))

  return {
    left: dx + 'px',
    top: dy + 'px',
  }
})

/**
 * 打开对话框 / Open dialog
 */
function openDialog() {
  if (fabRef.value) {
    fabPosition.value = {
      x: fabRef.value.x,
      y: fabRef.value.y,
    }
  }
  dialogVisible.value = true
}

/**
 * 关闭对话框 / Close dialog
 */
function closeDialog() {
  dialogVisible.value = false
}
</script>

<template>
  <!-- 悬浮按钮（对话框关闭时显示）/ FAB (shown when dialog is closed) -->
  <FloatingButton
    v-show="!dialogVisible"
    ref="fabRef"
    :is-running="isRunning"
    @click="openDialog"
  />

  <!-- 对话框（v-show 保持实例存活，关闭再打开不丢失对话）/ Dialog (v-show keeps instance alive) -->
  <ChatPanel
    v-show="dialogVisible"
    :style="dialogStyle"
    @close="closeDialog"
  />
</template>
