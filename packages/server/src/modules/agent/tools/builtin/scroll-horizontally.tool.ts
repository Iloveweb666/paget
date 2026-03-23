/**
 * 水平滚动工具 — 控制页面或容器的水平滚动
 * Horizontal scroll tool — controls horizontal scrolling on page or container
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';

export class ScrollHorizontallyTool extends BaseTool {
  readonly name = 'scroll_horizontally';
  readonly description = 'Scroll horizontally on page or container';
  readonly schema = z.object({
    direction: z.enum(['left', 'right']).describe('Horizontal scroll direction'),
    amount: z.number().optional().describe('Scroll amount in pixels'),
    index: z.number().optional().describe('Optional target container index'),
  });

  async execute(params: z.infer<typeof this.schema>): Promise<string> {
    return `Scroll ${params.direction} horizontally${typeof params.amount === 'number' ? ` by ${params.amount}px` : ''}`;
  }
}
