/**
 * LLM 配置实体 — 存储大语言模型的连接与参数配置
 * LLM config entity — stores connection and parameter configuration for large language models
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('llm_configs')
export class LLMConfigEntity {
  // 主键，自动生成 UUID / Primary key, auto-generated UUID
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // 配置名称（便于用户区分不同配置） / Config name (helps users distinguish different configs)
  @Column({ length: 100 })
  name!: string;

  // API 基础地址 / API base URL
  @Column({ name: 'base_url', length: 500 })
  baseUrl!: string;

  // API 密钥（加密存储在数据库中） / API key (stored encrypted in database)
  @Column({ name: 'api_key', length: 500 })
  apiKey!: string;

  // 模型名称（如 gpt-4、claude-3 等） / Model name (e.g., gpt-4, claude-3, etc.)
  @Column({ length: 100 })
  model!: string;

  // 温度参数，控制输出随机性，默认 0.7 / Temperature parameter, controls output randomness, default 0.7
  @Column({ type: 'float', default: 0.7 })
  temperature!: number;

  // 最大 token 数，默认 4096 / Maximum token count, default 4096
  @Column({ name: 'max_tokens', type: 'int', default: 4096 })
  maxTokens!: number;

  // 是否为默认配置 / Whether this is the default config
  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  // 创建时间 / Creation timestamp
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // 更新时间 / Update timestamp
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
