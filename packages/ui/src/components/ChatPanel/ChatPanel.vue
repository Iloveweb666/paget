<script setup lang="ts">
/**
 * 聊天对话框主组件
 * Chat dialog main component
 *
 * 整合 WebSocket 通信、Agent 状态管理、聊天消息和配置
 * Integrates WebSocket, agent state, chat messages, and config
 */
import { ref, onMounted } from 'vue'
import { AgentStatus } from '@paget/shared'
import { useWebSocket, useAgent, useChat, useConfig, usePageController } from '@/composables'
import { useConfigStore } from '@/stores/config'
import { useChatStore } from '@/stores/chat'
import ChatHeader from './ChatHeader.vue'
import ChatFooter from './ChatFooter.vue'
import MessageList from '../MessageList/MessageList.vue'
import ConfigPanel from '../ConfigPanel/ConfigPanel.vue'

const emit = defineEmits<{ close: [] }>()

// 是否显示设置弹窗 / Whether to show settings modal
const showSettings = ref(false)
// 当前会话 ID / Current session ID
const sessionId = ref(crypto.randomUUID())
// 用户配置 / User configuration
const { config } = useConfig()
// 配置状态 Store / Config state store
const configStore = useConfigStore()
// 聊天 Store（共享 Agent 状态给 FAB）/ Chat store (shares agent status with FAB)
const chatStore = useChatStore()

// WebSocket 通信 / WebSocket communication
const {
  connect, submitTask, cancelTask,
  onStatusChange, onHistoryChange, onActivity,
  onPageAction, onBatchAction,
  reportPageState, reportBatchResult,
} = useWebSocket()

// 页面控制器（DOM 状态提取 + 操作执行）/ Page controller (DOM extraction + action execution)
const { getBrowserState, executeBatch, showMask, hideMask } = usePageController({
  enableMask: true,
})

// Agent 状态管理 / Agent state management
const {
  status, history, currentActivity, isRunning,
  handleStatusChange: agentHandleStatus,
  handleHistoryChange, handleActivity,
} = useAgent()

// 聊天消息 / Chat messages
const { messages, inputText, messageListRef, sendMessage } = useChat()

// 组件挂载时建立连接 / Establish connection on mount
onMounted(async () => {
  connect()

  // 注册事件监听，同时同步状态到 Pinia store / Register listeners and sync status to Pinia store
  onStatusChange((payload) => {
    agentHandleStatus(payload)
    chatStore.status = payload.status

    // Agent 开始运行时显示遮罩层，结束时隐藏 / Show mask when agent starts, hide when done
    if (payload.status === AgentStatus.RUNNING) {
      showMask()
    } else if (
      payload.status === AgentStatus.IDLE
      || payload.status === AgentStatus.COMPLETED
      || payload.status === AgentStatus.ERROR
    ) {
      hideMask()
    }
  })
  onHistoryChange(handleHistoryChange)
  onActivity(handleActivity)

  // 监听页面状态请求：提取 DOM 状态并上报 / Listen for page state requests: extract DOM and report
  onPageAction(async (payload) => {
    if (payload.type === 'get_state') {
      const state = await getBrowserState()
      reportPageState({
        sessionId: payload.sessionId,
        ...state,
      })
    }
  })

  // 监听批量操作指令：执行操作并上报结果 / Listen for batch actions: execute and report results
  onBatchAction(async (payload) => {
    const result = await executeBatch(payload.actions)
    reportBatchResult(payload.sessionId, result.results)
  })

  await configStore.loadLLMConfigs()
})

/**
 * 发送消息并提交任务 / Send message and submit task
 */
function handleSend() {
  const text = sendMessage()
  if (text) submitTask(text, sessionId.value)
}

/**
 * 停止当前任务 / Stop current task
 */
function handleStop() {
  cancelTask(sessionId.value)
}
</script>

<template>
  <div class="chat-dialog">
    <!-- 头部 / Header -->
    <ChatHeader @close="emit('close')" />

    <!-- 消息列表 / Message list -->
    <MessageList
      v-model:list-ref="messageListRef"
      :messages="messages"
      :history="history"
      :activity="currentActivity"
      :is-running="isRunning"
    />

    <!-- 底部（工具栏 + 输入框）/ Footer (toolbar + input) -->
    <ChatFooter
      v-model="inputText"
      :is-running="isRunning"
      @send="handleSend"
      @stop="handleStop"
      @open-settings="showSettings = true"
    />

    <!-- 设置弹窗 / Settings modal -->
    <ConfigPanel
      v-if="showSettings"
      v-model:config="config"
      @close="showSettings = false"
    />
  </div>
</template>

<style scoped>
.chat-dialog {
  position: fixed;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  width: var(--paget-panel-width);
  height: var(--paget-panel-height);
  background: var(--paget-bg);
  border: 1px solid var(--paget-border);
  border-radius: var(--paget-radius-xl);
  box-shadow: var(--paget-shadow-lg);
  overflow: hidden;
  font-family: var(--paget-font-family);
}
</style>
