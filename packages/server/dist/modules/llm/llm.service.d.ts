import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
export declare class LLMService {
    private readonly configService;
    private cachedModel;
    constructor(configService: ConfigService);
    /**
     * 获取 LangChain ChatModel 实例（单例复用）
     * Get a LangChain ChatModel instance (singleton, reused across calls)
     */
    getChatModel(): Promise<ChatOpenAI>;
}
//# sourceMappingURL=llm.service.d.ts.map