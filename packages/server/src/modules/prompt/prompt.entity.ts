/**
 * 提示词模板实体 — 存储系统提示词、指令提示词和页面提示词模板
 * Prompt template entity — stores system, instruction, and page prompt templates
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('prompt_templates')
export class PromptTemplateEntity {
  // 主键，自动生成 UUID / Primary key, auto-generated UUID
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // 模板名称 / Template name
  @Column({ length: 200 })
  name!: string;

  // 模板内容（支持 {{variable}} 占位符） / Template content (supports {{variable}} placeholders)
  @Column({ type: 'text' })
  content!: string;

  // 模板变量定义列表（JSON 格式，可为空） / Template variable definitions list (JSON format, nullable)
  @Column({ type: 'json', nullable: true })
  variables!: Array<{
    name: string;           // 变量名 / Variable name
    description?: string;   // 变量描述 / Variable description
    defaultValue?: string;  // 默认值 / Default value
    required?: boolean;     // 是否必填 / Whether required
  }> | null;

  // 模板类型：system（系统提示词）、instruction（指令）、page（页面描述） / Template type: system, instruction, or page
  @Column({ type: 'enum', enum: ['system', 'instruction', 'page'], default: 'system' })
  type!: 'system' | 'instruction' | 'page';

  // 版本号 / Version number
  @Column({ type: 'int', default: 1 })
  version!: number;

  // 是否启用 / Whether active
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // 创建时间 / Creation timestamp
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // 更新时间 / Update timestamp
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
