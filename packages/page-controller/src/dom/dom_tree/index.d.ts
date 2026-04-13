/**
 * DOM 树提取引擎类型声明（移植自 browser-use）
 * Type declarations for DOM tree extraction engine (ported from browser-use)
 */
import type { FlatDomTree } from './type'

interface DomTreeConfig {
  doHighlightElements?: boolean
  focusHighlightIndex?: number
  viewportExpansion?: number
  debugMode?: boolean
  interactiveBlacklist?: (Element | (() => Element))[]
  interactiveWhitelist?: (Element | (() => Element))[]
  highlightOpacity?: number
  highlightLabelOpacity?: number
}

declare function domTree(config?: DomTreeConfig): FlatDomTree
export default domTree
