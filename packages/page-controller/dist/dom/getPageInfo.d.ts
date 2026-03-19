/**
 * 获取页面滚动和视口指标信息
 * Get page scroll and viewport metrics
 */
export interface PageInfo {
    viewport_width: number;
    viewport_height: number;
    page_width: number;
    page_height: number;
    scroll_x: number;
    scroll_y: number;
    pixels_above: number;
    pixels_below: number;
    pixels_left: number;
    pixels_right: number;
    pages_above: number;
    pages_below: number;
    total_pages: number;
    current_page_position: number;
}
/**
 * 计算页面滚动和视口的度量信息
 * Calculate page scroll and viewport metrics
 */
export declare function getPageInfo(): PageInfo;
//# sourceMappingURL=getPageInfo.d.ts.map