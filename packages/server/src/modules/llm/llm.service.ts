/**
 * LLM 服务 — 管理大语言模型配置的 CRUD 操作，并提供 LangChain ChatModel 实例
 * LLM service — manages CRUD operations for LLM configs and provides LangChain ChatModel instances
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatOpenAI } from '@langchain/openai';
import { LLMConfigEntity } from './llm.entity';
import { CreateLLMDto } from './dto/create-llm.dto';
import { UpdateLLMDto } from './dto/update-llm.dto';

@Injectable()
export class LLMService {
  /**
   * LangChain ChatModel 实例缓存，以配置 ID 为键
   * Cache of LangChain ChatModel instances keyed by config ID
   */
  private modelCache = new Map<string, ChatOpenAI>();

  constructor(
    @InjectRepository(LLMConfigEntity)
    private readonly llmRepo: Repository<LLMConfigEntity>,
  ) {}

  // 查询所有 LLM 配置，按创建时间升序 / Find all LLM configs, ordered by creation time ascending
  async findAll(): Promise<LLMConfigEntity[]> {
    return this.llmRepo.find({ order: { createdAt: 'ASC' } });
  }

  // 根据 ID 查询单个 LLM 配置，不存在则抛出异常 / Find a single LLM config by ID, throw if not found
  async findOne(id: string): Promise<LLMConfigEntity> {
    const config = await this.llmRepo.findOneBy({ id });
    if (!config) throw new NotFoundException(`LLM config ${id} not found`);
    return config;
  }

  // 查找默认 LLM 配置 / Find the default LLM config
  async findDefault(): Promise<LLMConfigEntity | null> {
    return this.llmRepo.findOneBy({ isDefault: true });
  }

  // 创建新的 LLM 配置；如果设为默认，先取消其他默认标记 / Create a new LLM config; if set as default, unmark other defaults first
  async create(dto: CreateLLMDto): Promise<LLMConfigEntity> {
    if (dto.isDefault) {
      await this.llmRepo.update({}, { isDefault: false });
    }
    const entity = this.llmRepo.create(dto);
    return this.llmRepo.save(entity);
  }

  // 更新 LLM 配置；如果设为默认，先取消其他默认标记 / Update an LLM config; if set as default, unmark other defaults first
  async update(id: string, dto: UpdateLLMDto): Promise<LLMConfigEntity> {
    const config = await this.findOne(id);
    if (dto.isDefault) {
      await this.llmRepo.update({}, { isDefault: false });
    }
    Object.assign(config, dto);
    this.modelCache.delete(id); // 使缓存失效 / Invalidate cache
    return this.llmRepo.save(config);
  }

  // 删除 LLM 配置并清除对应的模型缓存 / Remove an LLM config and clear its model cache
  async remove(id: string): Promise<void> {
    const config = await this.findOne(id);
    this.modelCache.delete(id);
    await this.llmRepo.remove(config);
  }

  /**
   * 根据配置 ID 获取 LangChain ChatModel 实例，实例会被缓存复用
   * Get a LangChain ChatModel instance for the given config ID. Instances are cached and reused.
   */
  async getChatModel(configId?: string): Promise<ChatOpenAI> {
    // 如果指定了配置 ID 则查找该配置，否则使用默认配置 / If configId is specified, find that config; otherwise use the default
    const config = configId
      ? await this.findOne(configId)
      : await this.findDefault();

    if (!config) {
      throw new NotFoundException('No LLM config available');
    }

    // 如果缓存中已有实例则直接返回 / Return cached instance if available
    if (this.modelCache.has(config.id)) {
      return this.modelCache.get(config.id)!;
    }

    // 创建新的 ChatOpenAI 实例 / Create a new ChatOpenAI instance
    const model = new ChatOpenAI({
      openAIApiKey: config.apiKey,
      modelName: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      configuration: {
        baseURL: config.baseUrl,
      },
    });

    // 缓存实例以供复用 / Cache the instance for reuse
    this.modelCache.set(config.id, model);
    return model;
  }
}
