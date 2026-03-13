/**
 * 输入工具 — 通过元素索引向表单字段输入文本
 * Input tool — inputs text into a form field by its index
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';

export class InputTool extends BaseTool {
  readonly name = 'input';
  readonly description = 'Input text into a form field by its index';
  // 参数模式：目标元素索引 + 输入文本 / Parameter schema: target element index + text to input
  readonly schema = z.object({
    index: z.number().describe('Element index to input text into'),
    text: z.string().describe('Text to input'),
  });

  async execute(params: z.infer<typeof this.schema>): Promise<string> {
    // 返回动作描述（实际输入由客户端执行） / Return action description (actual input is executed by the client)
    return `Input "${params.text}" into element [${params.index}]`;
  }
}
