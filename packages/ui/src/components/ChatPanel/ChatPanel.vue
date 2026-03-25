<script setup lang="ts">
/**
 * 聊天对话框主组件
 * Chat dialog main component
 *
 * 整合 WebSocket 通信、Agent 状态管理、聊天消息和配置
 * Integrates WebSocket, agent state, chat messages, and config
 */
import { ref, computed, onMounted, watch } from "vue";
import { AgentStatus } from "@paget/shared";
import {
  useWebSocket,
  useAgent,
  useChat,
  useConfig,
  usePageController,
} from "@/composables";
import { useChatStore } from "@/stores/chat";
import ChatHeader from "./ChatHeader.vue";
import ChatFooter from "./ChatFooter.vue";
import MessageList from "../MessageList/MessageList.vue";
import ConfigPanel from "../ConfigPanel/ConfigPanel.vue";
import WSLogPanel from "./WSLogPanel.vue";
import BrowserStatePanel from "./BrowserStatePanel.vue";

const emit = defineEmits<{ close: [] }>();

// 是否显示设置弹窗 / Whether to show settings modal
const showSettings = ref(false);
// 是否显示 WS 日志面板 / Whether to show WS log panel
const showWSLog = ref(false);
// 是否显示 BrowserState 面板 / Whether to show BrowserState panel
const showBrowserState = ref(false);
// 用户配置 / User configuration
const { config } = useConfig();
// 聊天 Store（共享 Agent 状态给 FAB）/ Chat store (shares agent status with FAB)
const chatStore = useChatStore();
// 使用 store 中持久化的 sessionId / Use persisted sessionId from store
const sessionId = computed(() => chatStore.sessionId);

// WebSocket 通信 / WebSocket communication
const {
  connect,
  submitTask,
  forceStop: wsForceStop,
  onStatusChange,
  onHistoryChange,
  onActivity,
  onStreamChunk,
  onPageAction,
  onBatchAction,
  reportPageState,
  reportBatchResult,
} = useWebSocket();

// 页面控制器（DOM 状态提取 + 操作执行）/ Page controller (DOM extraction + action execution)
const { getBrowserState, executeBatch, showMask, hideMask, setMaskEnabled } = usePageController(
  {
    enableMask: config.value.showMask,
  },
);
// 配置变化时动态切换遮罩能力 / Toggle mask behavior when config changes
watch(
  () => config.value.showMask,
  (enabled) => {
    setMaskEnabled(enabled);
    if (!enabled) hideMask();
  },
  { immediate: true },
);

// Agent 状态管理 / Agent state management
const {
  status,
  history,
  currentActivity,
  isRunning,
  handleStatusChange: agentHandleStatus,
  handleHistoryChange,
  handleActivity,
} = useAgent();

// 聊天消息 / Chat messages
const {
  messages,
  inputText,
  messageListRef,
  streamingMessageId,
  sendMessage,
  handleStreamChunk,
} = useChat();

// 组件挂载时注册事件 → 建立连接 / Register events → establish connection on mount
onMounted(async () => {
  // 先注册事件处理器（存入注册表），再连接（连接时自动绑定）
  // Register event handlers first (stored in registry), then connect (auto-binds on connect)
  onStatusChange((payload) => {
    agentHandleStatus(payload);

    // Agent 开始运行时显示遮罩层，结束时隐藏 / Show mask when agent starts, hide when done
    // streaming 状态不显示遮罩、不禁用输入 / streaming status: no mask, no input disable
    if (payload.status === AgentStatus.RUNNING) {
      if (config.value.showMask) showMask();
    } else if (
      payload.status === AgentStatus.IDLE ||
      payload.status === AgentStatus.COMPLETED ||
      payload.status === AgentStatus.ERROR
    ) {
      hideMask();
    }
    // 'streaming' 状态不需要处理遮罩 / 'streaming' status doesn't need mask handling
  });
  onHistoryChange(handleHistoryChange);
  onActivity(handleActivity);
  onStreamChunk(handleStreamChunk);

  // 监听页面状态请求：提取 DOM 状态并上报 / Listen for page state requests: extract DOM and report
  onPageAction(async (payload) => {
    if (payload.type === "get_state") {
      const state = await getBrowserState();
      reportPageState({
        sessionId: payload.sessionId,
        ...state,
      });
    }
  });

  // 监听批量操作指令：执行操作并上报结果 / Listen for batch actions: execute and report results
  onBatchAction(async (payload) => {
    const result = await executeBatch(payload.actions);
    reportBatchResult(payload.sessionId, result.results);
  });

  // 所有事件处理器注册完毕后，建立连接 / After all handlers registered, establish connection
  connect();
});

/**
 * 发送消息并提交任务 / Send message and submit task
 */
function handleSend() {
  const msg = sendMessage();
  if (!msg) return;
  submitTask({
    task: msg.content,
    sessionId: sessionId.value,
    llmConfigId: config.value.llmConfigId || undefined,
    maxSteps: config.value.maxSteps,
    taskRunId: msg.taskRunId,
    language: config.value.locale === 'zh-CN' ? '中文' : 'English',
  });
}

/**
 * 强制停止当前任务 / Force stop the current task
 * 发送取消信号 → 断开 WS 连接 → 立即重连，彻底切断 agent 轮询链路
 * Send cancel → disconnect WS → reconnect immediately, completely breaking the agent polling chain
 */
function handleStop() {
  wsForceStop(sessionId.value);
  // 立即隐藏遮罩层并重置所有运行态 / Immediately hide mask and reset all running state
  hideMask();
  chatStore.status = AgentStatus.IDLE;
  chatStore.activity = null;
  chatStore.streamingMessageId = null;
}
</script>

<template>
  <div class="chat-dialog">
    <!-- 头部 / Header -->
    <ChatHeader @close="emit('close')" @open-ws-log="showWSLog = true" />

    <!-- 消息列表 / Message list -->
    <MessageList
      v-model:list-ref="messageListRef"
      :messages="messages"
      :history="history"
      :activity="currentActivity"
      :is-running="isRunning"
      :streaming-message-id="streamingMessageId"
    />

    <!-- 底部（工具栏 + 输入框）/ Footer (toolbar + input) -->
    <ChatFooter
      v-model="inputText"
      :is-running="isRunning"
      @send="handleSend"
      @stop="handleStop"
      @open-settings="showSettings = true"
      @open-browser-state="showBrowserState = true"
    />

    <!-- 设置弹窗 / Settings modal -->
    <ConfigPanel
      v-if="showSettings"
      v-model:config="config"
      @close="showSettings = false"
    />

    <!-- WS 日志面板 / WS log panel -->
    <WSLogPanel v-if="showWSLog" @close="showWSLog = false" />

    <!-- BrowserState 查看面板 / BrowserState viewer panel -->
    <BrowserStatePanel
      v-if="showBrowserState"
      :fetch-state="getBrowserState"
      @close="showBrowserState = false"
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
