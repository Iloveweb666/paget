/**
 * 滚动工具 — 控制页面或容器的垂直滚动
 * Scroll tool — controls vertical scrolling on page or container
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';

export class ScrollTool extends BaseTool {
  readonly name = 'scroll';
  readonly description = 'Scroll vertically on page or container';
  readonly schema = z.object({
    direction: z.enum(['up', 'down']).describe('Scroll direction'),
    amount: z.number().optional().describe('Scroll amount in pixels'),
    index: z.number().optional().describe('Optional target container index'),
  });

  async execute(params: z.infer<typeof this.schema>): Promise<string> {
    return `Scroll ${params.direction}${typeof params.amount === 'number' ? ` by ${params.amount}px` : ''}`;
  }
}
