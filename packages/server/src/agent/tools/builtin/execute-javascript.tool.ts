/**
 * JavaScript 执行工具 — 在页面上下文执行代码
 * Execute-javascript tool — runs JavaScript in page context
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';

export class ExecuteJavascriptTool extends BaseTool {
  readonly name = 'execute_javascript';
  readonly description = 'Execute JavaScript in page context (use sparingly)';
  readonly schema = z.object({
    code: z.string().describe('JavaScript code to execute'),
  });

  async execute(params: z.infer<typeof this.schema>): Promise<string> {
    return `Execute JavaScript: ${params.code.slice(0, 120)}`;
  }
}
