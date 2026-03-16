/**
 * 意图分类器 — 判断用户输入是对话还是自动化操作
 * Intent classifier — determines if user input is chat or automation
 *
 * 规则优先：正则匹配自动化/对话关键词。规则无法判断时，回退到 LLM 单轮分类。
 * Rule-first: regex matches automation/chat keywords. Falls back to LLM classification when rules are inconclusive.
 */
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Logger } from "@nestjs/common";

const logger = new Logger("IntentClassifier");

// 意图类型 / Intent type
export type Intent = "chat" | "automation";

// 自动化关键词正则（中英文）/ Automation keyword patterns (Chinese + English)
const AUTOMATION_PATTERNS = [
  // 中文自动化关键词 / Chinese automation keywords
  /点击/,
  /填写/,
  /输入/,
  /选择/,
  /提交/,
  /勾选/,
  /取消勾选/,
  /滚动/,
  /打开/,
  /跳转/,
  /帮我.{0,10}(填|写|点|选|输|按|提交)/,
  /把.{0,20}(改|填|设|选|输入|写)(为|成|到)/,
  // 英文自动化关键词 / English automation keywords
  /\bclick\b/i,
  /\bfill\b/i,
  /\btype\b/i,
  /\binput\b/i,
  /\bselect\b/i,
  /\bsubmit\b/i,
  /\bcheck\b/i,
  /\buncheck\b/i,
  /\bscroll\b/i,
  /\bnavigate\b/i,
  /\bopen\b/i,
];

// 对话关键词正则（中英文）/ Chat keyword patterns (Chinese + English)
const CHAT_PATTERNS = [
  // 中文对话关键词 / Chinese chat keywords
  /什么是/,
  /怎么/,
  /为什么/,
  /如何/,
  /请问/,
  /解释/,
  /介绍/,
  /告诉我/,
  /你是/,
  /你好/,
  /谢谢/,
  /你能做什么/,
  // 英文对话关键词 / English chat keywords
  /\bwhat\b/i,
  /\bhow\b/i,
  /\bwhy\b/i,
  /\bexplain\b/i,
  /\bdescribe\b/i,
  /\btell me\b/i,
  /\bwho are you\b/i,
  /\bhello\b/i,
  /\bhi\b/i,
  /\bthanks?\b/i,
  /\bhelp\b/i,
];

/**
 * 使用规则匹配意图 / Classify intent using rule-based matching
 * 返回 null 表示规则无法确定 / Returns null if rules are inconclusive
 */
function classifyByRules(text: string): Intent | null {
  let automationScore = 0;
  let chatScore = 0;

  for (const pattern of AUTOMATION_PATTERNS) {
    if (pattern.test(text)) automationScore++;
  }

  for (const pattern of CHAT_PATTERNS) {
    if (pattern.test(text)) chatScore++;
  }

  // 有明确倾向时直接返回 / Return directly when there's a clear tendency
  if (automationScore > 0 && chatScore === 0) return "automation";
  if (chatScore > 0 && automationScore === 0) return "chat";

  // 两者都有匹配时，取分数更高的（需要明显差距）/ When both match, take the higher score (requires significant gap)
  if (automationScore >= 2 && automationScore > chatScore) return "automation";
  if (chatScore >= 2 && chatScore > automationScore) return "chat";

  // 规则无法判断 / Rules are inconclusive
  return null;
}

// LLM 分类提示词 / LLM classification prompt
const CLASSIFIER_PROMPT = `You are an intent classifier. Classify the user message into exactly one of two categories:
- "chat": The user is asking a question, making conversation, or seeking information.
- "automation": The user wants to perform actions on a web page (click, fill, select, submit, etc.).

Respond with ONLY the word "chat" or "automation", nothing else.`;

/**
 * 分类用户意图：对话或自动化 / Classify user intent: chat or automation
 * 规则优先，规则无法判断时回退到 LLM / Rule-first, falls back to LLM when rules are inconclusive
 */
export async function classifyIntent(
  model: ChatOpenAI,
  text: string,
): Promise<Intent> {
  // 规则匹配 / Rule-based matching
  const ruleResult = classifyByRules(text);
  if (ruleResult) {
    logger.debug(`Rule-based classification: "${text}" → ${ruleResult}`);
    return ruleResult;
  }

  // LLM 回退分类 / LLM fallback classification
  try {
    logger.debug(`Falling back to LLM classification for: "${text}"`);
    const response = await model.invoke([
      new SystemMessage(CLASSIFIER_PROMPT),
      new HumanMessage(text),
    ]);
    const content =
      typeof response.content === "string"
        ? response.content.trim().toLowerCase()
        : "";

    if (content === "chat" || content === "automation") {
      logger.debug(`LLM classification: "${text}" → ${content}`);
      return content;
    }
  } catch (err) {
    logger.warn("LLM intent classification failed, defaulting to chat", err);
  }

  // 默认为对话 / Default to chat
  return "chat";
}
