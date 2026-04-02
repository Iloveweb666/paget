/**
 * LLM model custom config table - centralizes provider/model specific request overrides
 * LLM 模型自定义配置表 —— 统一维护不同提供商/模型的请求覆盖项
 */

export interface ChatModelConfigurationOverrides {
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
}

export interface ChatModelOverrides {
  temperature?: number;
  maxTokens?: number;
  modelKwargs?: Record<string, unknown>;
  configuration?: ChatModelConfigurationOverrides;
}

interface LLMModelConfigEntry {
  id: string;
  matchPrefixes: string[];
  overrides: ChatModelOverrides;
}

const LLM_MODEL_CONFIGS: LLMModelConfigEntry[] = [
  {
    id: "qwen",
    matchPrefixes: ["qwen"],
    overrides: {
      modelKwargs: {
        enable_thinking: false,
      },
    },
  },
];

export function normalizeModelName(modelName: string): string {
  let normalizedName = modelName.toLowerCase();

  if (normalizedName.includes("/")) {
    normalizedName = normalizedName.split("/")[1];
  }

  normalizedName = normalizedName.replace(/_/g, "");
  normalizedName = normalizedName.replace(/\./g, "");

  return normalizedName;
}

/**
 * Resolve model specific overrides by normalized prefix matching.
 * 通过标准化后的模型名前缀匹配，解析模型专属覆盖项。
 */
export function resolveChatModelOverrides(modelName: string): ChatModelOverrides {
  const normalizedModelName = normalizeModelName(modelName);

  return LLM_MODEL_CONFIGS.reduce<ChatModelOverrides>((acc, config) => {
    const matched = config.matchPrefixes.some((prefix) =>
      normalizedModelName.startsWith(prefix),
    );
    if (!matched) {
      return acc;
    }

    return {
      ...acc,
      ...config.overrides,
      modelKwargs: {
        ...(acc.modelKwargs ?? {}),
        ...(config.overrides.modelKwargs ?? {}),
      },
      configuration: {
        ...(acc.configuration ?? {}),
        ...(config.overrides.configuration ?? {}),
        defaultHeaders: {
          ...(acc.configuration?.defaultHeaders ?? {}),
          ...(config.overrides.configuration?.defaultHeaders ?? {}),
        },
      },
    };
  }, {});
}

