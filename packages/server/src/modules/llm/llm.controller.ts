/**
 * LLM 控制器 — 提供 LLM 配置的 RESTful API 端点
 * LLM controller — provides RESTful API endpoints for LLM configuration
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { LLMService } from './llm.service';
import { CreateLLMDto } from './dto/create-llm.dto';
import { UpdateLLMDto } from './dto/update-llm.dto';

@Controller('api/llm')
export class LLMController {
  constructor(private readonly llmService: LLMService) {}

  // 获取所有 LLM 配置 / Get all LLM configs
  @Get()
  findAll() {
    return this.llmService.findAll();
  }

  // 根据 ID 获取单个 LLM 配置 / Get a single LLM config by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.llmService.findOne(id);
  }

  // 创建新的 LLM 配置 / Create a new LLM config
  @Post()
  create(@Body() dto: CreateLLMDto) {
    return this.llmService.create(dto);
  }

  // 更新指定 ID 的 LLM 配置 / Update an LLM config by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLLMDto) {
    return this.llmService.update(id, dto);
  }

  // 删除指定 ID 的 LLM 配置 / Delete an LLM config by ID
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.llmService.remove(id);
  }
}
