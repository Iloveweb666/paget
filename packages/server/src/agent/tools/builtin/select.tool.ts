/**
 * 选择工具 — 通过元素索引选择下拉项
 * Select tool — selects an option in a dropdown by element index
 */
import { z } from 'zod';
import { BaseTool } from '../base.tool';

export class SelectTool extends BaseTool {
  readonly name = 'select';
  readonly description = 'Select an option in a dropdown by element index';
  readonly schema = z
    .object({
      index: z.number().describe('Element index of the select element'),
      value: z.string().optional().describe('Option text/value to select'),
      optionText: z.string().optional().describe('Alias of value, kept for compatibility'),
      blur: z
        .boolean()
        .optional()
        .describe('Whether to blur after selection (default true)'),
    })
    .refine((params) => !!params.value || !!params.optionText, {
      message: 'Either value or optionText is required',
    });

  async execute(params: z.infer<typeof this.schema>): Promise<string> {
    const value = params.value ?? params.optionText ?? '';
    return `Select "${value}" in element [${params.index}]`;
  }
}
