/**
 * 询问用户工具 — 当信息不足时向用户提问
 * Ask-user tool — asks user for clarification when information is insufficient
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';

export class AskUserTool extends BaseTool {
  readonly name = 'ask_user';
  readonly description = 'Ask the user for clarification';
  readonly schema = z.object({
    question: z.string().describe('Question to ask the user'),
  });

  async execute(params: z.infer<typeof this.schema>): Promise<string> {
    return params.question;
  }
}
