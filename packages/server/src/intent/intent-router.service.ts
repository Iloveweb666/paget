/**
 * 意图路由服务 — 判断用户输入是对话还是自动化操作，并路由到对应处理流程
 * Intent router service — classifies user input as chat or automation, and routes to appropriate handler
 *
 * 规则优先：正则匹配自动化/对话关键词。规则无法判断时，回退到 LLM 单轮分类。
 * Rule-first: regex matches automation/chat keywords. Falls back to LLM classification when rules are inconclusive.
 */
import { Injectable, Logger } from '@nestjs/common';
import { IntentType, type IntentResult, type RouteResult } from '@paget/shared';
import { LLMService } from '../llm/llm.service';

// 自动化关键词正则（中英文）/ Automation keyword patterns (Chinese + English)
const AUTOMATION_PATTERNS = [
  /点击/, /填写/, /输入/, /选择/, /提交/, /勾选/, /取消勾选/, /滚动/, /打开/, /跳转/,
  /帮我.{0,10}(填|写|点|选|输|按|提交)/,
  /把.{0,20}(改|填|设|选|输入|写)(为|成|到)/,
  /\bclick\b/i, /\bfill\b/i, /\btype\b/i, /\binput\b/i, /\bselect\b/i,
  /\bsubmit\b/i, /\bcheck\b/i, /\buncheck\b/i, /\bscroll\b/i, /\bnavigate\b/i, /\bopen\b/i,
];

// 对话关键词正则（中英文）/ Chat keyword patterns (Chinese + English)
const CHAT_PATTERNS = [
  /什么是/, /怎么/, /为什么/, /如何/, /请问/, /解释/, /介绍/, /告诉我/, /你是/, /你好/, /谢谢/, /你能做什么/,
  /\bwhat\b/i, /\bhow\b/i, /\bwhy\b/i, /\bexplain\b/i, /\bdescribe\b/i,
  /\btell me\b/i, /\bwho are you\b/i, /\bhello\b/i, /\bhi\b/i, /\bthanks?\b/i, /\bhelp\b/i,
];

@Injectable()
export class IntentRouterService {
  private readonly logger = new Logger(IntentRouterService.name);

  constructor(private readonly llmService: LLMService) {}

  /**
   * 分类用户意图 / Classify user intent
   * 规则优先，规则无法判断时回退到 LLM / Rule-first, falls back to LLM when rules are inconclusive
   */
  async classifyIntent(userMessage: string): Promise<IntentResult> {
    // 规则匹配 / Rule-based matching
    const ruleResult = this.classifyByRules(userMessage);
    if (ruleResult) {
      this.logger.debug(`Rule-based classification: "${userMessage}" → ${ruleResult.type}`);
      return ruleResult;
    }

    // LLM 回退分类 / LLM fallback classification
    return this.classifyByLLM(userMessage);
  }

  /**
   * 意图路由 — 将分类结果映射到处理流程
   * Route intent — map classification result to handler
   */
  async route(intent: IntentResult): Promise<RouteResult> {
    if (intent.type === IntentType.PAGE_OPERATION && intent.confidence >= 0.6) {
      return { routeTo: 'agent_loop' };
    }

    if (intent.type === IntentType.CONVERSATION && intent.confidence >= 0.6) {
      return { routeTo: 'direct_chat' };
    }

    // 置信度低或意图未知 — 默认走对话 / Low confidence or unknown intent — default to chat
    return { routeTo: 'direct_chat' };
  }

  /**
   * 使用规则匹配意图 / Classify intent using rule-based matching
   */
  private classifyByRules(text: string): IntentResult | null {
    let automationScore = 0;
    let chatScore = 0;

    for (const pattern of AUTOMATION_PATTERNS) {
      if (pattern.test(text)) automationScore++;
    }
    for (const pattern of CHAT_PATTERNS) {
      if (pattern.test(text)) chatScore++;
    }

    // 有明确倾向时直接返回 / Return directly when there's a clear tendency
    if (automationScore > 0 && chatScore === 0) {
      return { type: IntentType.PAGE_OPERATION, confidence: 0.95 };
    }
    if (chatScore > 0 && automationScore === 0) {
      return { type: IntentType.CONVERSATION, confidence: 0.95 };
    }

    // 两者都有匹配时，取分数更高的 / When both match, take the higher score
    if (automationScore >= 2 && automationScore > chatScore) {
      return { type: IntentType.PAGE_OPERATION, confidence: 0.7 };
    }
    if (chatScore >= 2 && chatScore > automationScore) {
      return { type: IntentType.CONVERSATION, confidence: 0.7 };
    }

    // 规则无法判断 / Rules are inconclusive
    return null;
  }

  /**
   * 使用 LLM 分类意图 / Classify intent using LLM
   * 直接调用 OpenAI API（不使用工具模式）/ Direct OpenAI API call (no tools mode)
   */
  private async classifyByLLM(text: string): Promise<IntentResult> {
    try {
      this.logger.debug(`Falling back to LLM classification for: "${text}"`);
      const llm = this.llmService.getLLM();

      const response = await fetch(`${llm.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(llm.config.apiKey && { Authorization: `Bearer ${llm.config.apiKey}` }),
        },
        body: JSON.stringify({
          model: llm.config.model,
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: `You are an intent classifier. Classify the user message into exactly one category.
Respond with ONLY "page_operation" or "conversation", nothing else.
- "page_operation": The user wants to perform actions on a web page (click, fill, select, submit, etc.)
- "conversation": The user is asking a question, making conversation, or seeking information.`,
            },
            { role: 'user', content: text },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim().toLowerCase() || '';

      if (content === 'page_operation') {
        return { type: IntentType.PAGE_OPERATION, confidence: 0.85, reasoning: 'LLM classification' };
      }
      if (content === 'conversation') {
        return { type: IntentType.CONVERSATION, confidence: 0.85, reasoning: 'LLM classification' };
      }
    } catch (err) {
      this.logger.warn('LLM intent classification failed, defaulting to conversation', err);
    }

    // 默认为对话 / Default to conversation
    return { type: IntentType.CONVERSATION, confidence: 0.5, reasoning: 'Default fallback' };
  }
}
