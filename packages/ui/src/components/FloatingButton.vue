<script setup lang="ts">
/**
 * 悬浮按钮组件（FAB）
 * Floating Action Button component
 *
 * 可拖拽、边缘吸附、点击展开对话框、运行时切换动画图标
 * Draggable, edge-snapping, click to expand dialog, animated icon while running
 */
import { computed } from "vue";
import { useDrag } from "@/composables/useDrag";
import thkingImg from "@/asset/image/thking.png";
import thkingGif from "@/asset/gif/thking.gif";

const FAB_SIZE = 56;

const props = defineProps<{
  /** 是否正在运行（显示动画图标）/ Whether running (show animated icon) */
  isRunning: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();

const {
  x,
  y,
  isDragging,
  hasDragged,
  onPointerDown,
  onPointerMove,
  onPointerUp,
} = useDrag({ size: FAB_SIZE });

// 当前显示的图标：运行中用 gif，否则用静态图 / Current icon: gif when running, static otherwise
const currentIcon = computed(() => (props.isRunning ? thkingGif : thkingImg));

/**
 * 处理点击：只有未产生拖拽位移时才触发 / Handle click: only trigger if no drag movement occurred
 */
function handleClick() {
  if (!hasDragged.value) {
    emit("click");
  }
}

// 暴露位置给父组件用于定位对话框 / Expose position to parent for dialog positioning
defineExpose({ x, y });
</script>

<template>
  <div
    class="floating-button"
    :class="{ 'floating-button--dragging': isDragging }"
    :style="{
      left: x + 'px',
      top: y + 'px',
      width: FAB_SIZE + 'px',
      height: FAB_SIZE + 'px',
    }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @click="handleClick"
  >
    <img
      class="floating-button__icon"
      :src="currentIcon"
      alt="AI"
      draggable="false"
    />
  </div>
</template>

<style scoped>
.floating-button {
  position: fixed;
  z-index: 99999;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: var(--paget-shadow-fab);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    left var(--paget-transition-normal),
    top var(--paget-transition-normal),
    transform var(--paget-transition-fast);
  user-select: none;
  touch-action: none;
}

.floating-button--dragging {
  cursor: grabbing;
  transition: none;
  transform: scale(1.08);
}

.floating-button:not(.floating-button--dragging):hover {
  transform: scale(1.05);
}

.floating-button:not(.floating-button--dragging):active {
  transform: scale(0.95);
}

.floating-button__icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
</style>
