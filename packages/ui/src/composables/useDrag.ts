/**
 * 可拖拽行为组合式函数（支持边缘吸附）
 * Draggable behavior composable with edge snapping support
 */
import { ref, onMounted, onUnmounted } from 'vue'

export interface DragOptions {
  /** 元素尺寸 / Element size */
  size: number
  /** 初始 X 位置 / Initial X position */
  initialX?: number
  /** 初始 Y 位置 / Initial Y position */
  initialY?: number
  /** 边缘吸附阈值（像素） / Edge snap threshold (px) */
  snapThreshold?: number
}

export function useDrag(options: DragOptions) {
  const { size, snapThreshold = 20 } = options

  // 当前位置 / Current position
  const x = ref(options.initialX ?? window.innerWidth - size - 24)
  const y = ref(options.initialY ?? window.innerHeight - size - 120)
  // 是否正在拖拽 / Whether currently dragging
  const isDragging = ref(false)
  // 本次拖拽是否产生了位移（用于区分点击和拖拽）/ Whether drag produced movement (to distinguish click vs drag)
  const hasDragged = ref(false)
  // 是否吸附到边缘 / Whether snapped to an edge
  const isSnapped = ref(false)
  // 吸附方向 / Snap direction
  const snapSide = ref<'left' | 'right' | 'top' | 'bottom' | null>(null)

  let startX = 0
  let startY = 0
  let startPosX = 0
  let startPosY = 0

  function onPointerDown(e: PointerEvent) {
    isDragging.value = true
    hasDragged.value = false
    isSnapped.value = false
    snapSide.value = null
    startX = e.clientX
    startY = e.clientY
    startPosX = x.value
    startPosY = y.value
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging.value) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged.value = true
    }
    // 限制拖拽范围，至少保留 1/4 可见 / Clamp drag range, keep at least 1/4 visible
    const minVisible = size / 4
    x.value = Math.max(-size + minVisible, Math.min(window.innerWidth - minVisible, startPosX + dx))
    y.value = Math.max(-size + minVisible, Math.min(window.innerHeight - minVisible, startPosY + dy))
  }

  function onPointerUp() {
    if (!isDragging.value) return
    isDragging.value = false
    snapToEdge()
  }

  /**
   * 边缘吸附逻辑：拖拽结束时如果靠近边缘则吸附一半到窗口外
   * Edge snap logic: on drag end, if near an edge, snap half outside the viewport
   */
  function snapToEdge() {
    const vw = window.innerWidth
    const vh = window.innerHeight

    // 计算到各边的距离 / Calculate distance to each edge
    const distLeft = x.value
    const distRight = vw - (x.value + size)
    const distTop = y.value
    const distBottom = vh - (y.value + size)

    const minDist = Math.min(distLeft, distRight, distTop, distBottom)

    if (minDist <= snapThreshold) {
      isSnapped.value = true
      if (minDist === distLeft) {
        x.value = -(size / 2)
        snapSide.value = 'left'
      } else if (minDist === distRight) {
        x.value = vw - size / 2
        snapSide.value = 'right'
      } else if (minDist === distTop) {
        y.value = -(size / 2)
        snapSide.value = 'top'
      } else {
        y.value = vh - size / 2
        snapSide.value = 'bottom'
      }
    }

    // 纵向限位 / Vertical clamping
    y.value = Math.max(-(size / 2), Math.min(vh - size / 2, y.value))
    x.value = Math.max(-(size / 2), Math.min(vw - size / 2, x.value))
  }

  // 窗口尺寸变化时保持可见 / Keep visible on window resize
  function onResize() {
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (x.value + size / 2 > vw) x.value = vw - size / 2
    if (y.value + size / 2 > vh) y.value = vh - size / 2
    if (x.value < -(size / 2)) x.value = -(size / 2)
    if (y.value < -(size / 2)) y.value = -(size / 2)
  }

  onMounted(() => window.addEventListener('resize', onResize))
  onUnmounted(() => window.removeEventListener('resize', onResize))

  return {
    x, y, isDragging, hasDragged, isSnapped, snapSide,
    onPointerDown, onPointerMove, onPointerUp,
  }
}
