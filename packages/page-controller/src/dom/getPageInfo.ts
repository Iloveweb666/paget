/**
 * 获取页面滚动和视口指标信息
 * Get page scroll and viewport metrics
 */
export interface PageInfo {
  // 视口尺寸 / Viewport dimensions
  viewport_width: number
  viewport_height: number
  // 页面总尺寸 / Total page dimensions
  page_width: number
  page_height: number
  // 当前滚动位置 / Current scroll position
  scroll_x: number
  scroll_y: number
  // 视口外像素数 / Pixels outside viewport
  pixels_above: number
  pixels_below: number
  pixels_left: number
  pixels_right: number
  // 页面计数 / Page counts
  pages_above: number
  pages_below: number
  total_pages: number
  // 当前位置百分比 / Current position percentage
  current_page_position: number
}

/**
 * 计算页面滚动和视口的度量信息
 * Calculate page scroll and viewport metrics
 */
export function getPageInfo(): PageInfo {
  const viewport_width = window.innerWidth
  const viewport_height = window.innerHeight

  const page_width = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth || 0)
  const page_height = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight || 0,
  )

  const scroll_x = window.scrollX || document.documentElement.scrollLeft || 0
  const scroll_y = window.scrollY || document.documentElement.scrollTop || 0

  const pixels_below = Math.max(0, page_height - (window.innerHeight + scroll_y))
  const pixels_right = Math.max(0, page_width - (window.innerWidth + scroll_x))

  return {
    viewport_width,
    viewport_height,
    page_width,
    page_height,
    scroll_x,
    scroll_y,
    pixels_above: scroll_y,
    pixels_below,
    pages_above: viewport_height > 0 ? scroll_y / viewport_height : 0,
    pages_below: viewport_height > 0 ? pixels_below / viewport_height : 0,
    total_pages: viewport_height > 0 ? page_height / viewport_height : 0,
    current_page_position: scroll_y / Math.max(1, page_height - viewport_height),
    pixels_left: scroll_x,
    pixels_right,
  }
}
