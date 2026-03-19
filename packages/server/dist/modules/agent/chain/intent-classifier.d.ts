/**
 * 意图分类器 — 判断用户输入是对话还是自动化操作
 * Intent classifier — determines if user input is chat or automation
 *
 * 规则优先：正则匹配自动化/对话关键词。规则无法判断时，回退到 LLM 单轮分类。
 * Rule-first: regex matches automation/chat keywords. Falls back to LLM classification when rules are inconclusive.
 */
import { ChatOpenAI } from "@langchain/openai";
export type Intent = "chat" | "automation";
/**
 * 分类用户意图：对话或自动化 / Classify user intent: chat or automation
 * 规则优先，规则无法判断时回退到 LLM / Rule-first, falls back to LLM when rules are inconclusive
 */
export declare function classifyIntent(model: ChatOpenAI, text: string): Promise<Intent>;
//# sourceMappingURL=intent-classifier.d.ts.map