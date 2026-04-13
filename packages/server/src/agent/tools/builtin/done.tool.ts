/**
 * 完成工具 — 标记任务已完成并附带总结消息
 * Done tool — marks the task as completed with a summary message
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';

export class DoneTool extends BaseTool {
  readonly name = 'done';
  readonly description = 'Mark the task as completed with a summary message';
  // 参数模式：任务完成总结 / Parameter schema: task completion summary
  readonly schema = z.object({
    message: z.string().describe('Summary of what was accomplished'),
  });

  async execute(params: z.infer<typeof this.schema>): Promise<string> {
    // 返回完成消息（智能体循环检测到 done 工具后会终止） / Return the completion message (agent loop terminates when done tool is detected)
    return params.message;
  }
}
