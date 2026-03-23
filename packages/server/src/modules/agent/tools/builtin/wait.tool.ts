/**
 * 等待工具 — 暂停执行一段时间
 * Wait tool — pauses execution for a period of time
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';

export class WaitTool extends BaseTool {
  readonly name = 'wait';
  readonly description = 'Wait for a specified duration';
  readonly schema = z
    .object({
      ms: z.number().nonnegative().optional().describe('Wait duration in milliseconds'),
      seconds: z.number().nonnegative().optional().describe('Wait duration in seconds'),
    })
    .refine((params) => typeof params.ms === 'number' || typeof params.seconds === 'number', {
      message: 'Either ms or seconds is required',
    });

  async execute(params: z.infer<typeof this.schema>): Promise<string> {
    const ms = typeof params.ms === 'number' ? params.ms : (params.seconds as number) * 1000;
    return `Wait for ${ms}ms`;
  }
}
