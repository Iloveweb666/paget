/**
 * 点击工具 — 通过元素索引点击页面元素
 * Click tool — clicks a page element by its index
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';

export class ClickTool extends BaseTool {
  readonly name = 'click';
  readonly description = 'Click an element by its index';
  // 参数模式：元素索引 + 可选失焦控制 / Parameter schema: index + optional blur control
  readonly schema = z.object({
    index: z.number().describe('Element index to click'),
    blur: z
      .boolean()
      .optional()
      .describe('Whether to blur after this click (default true; use false for intermediate dropdown steps)'),
  });

  async execute(params: z.infer<typeof this.schema>): Promise<string> {
    // 实际执行发生在客户端（通过 WebSocket 传递），这里仅返回动作描述 / Actual execution happens on the client side via WebSocket; this only returns the action description
    return `Click element [${params.index}]`;
  }
}
