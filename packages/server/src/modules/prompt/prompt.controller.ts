/**
 * 提示词控制器 — 提供提示词模板的 RESTful API 端点
 * Prompt controller — provides RESTful API endpoints for prompt templates
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { PromptService } from './prompt.service';

@Controller('api/prompt')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  // 获取所有提示词模板 / Get all prompt templates
  @Get()
  findAll() {
    return this.promptService.findAll();
  }

  // 根据 ID 获取单个模板 / Get a single template by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promptService.findOne(id);
  }

  // 创建新的提示词模板 / Create a new prompt template
  @Post()
  create(@Body() data: any) {
    return this.promptService.create(data);
  }

  // 更新指定 ID 的模板 / Update a template by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.promptService.update(id, data);
  }
}
