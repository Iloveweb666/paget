/**
 * 应用配置模块 — 加载环境变量并全局注册
 * Application config module — loads environment variables and registers globally
 */
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // 全局可用，无需在其他模块重复导入 / Available globally, no need to re-import in other modules
      envFilePath: ['.env', '../../.env'], // 支持多级目录查找 .env 文件 / Support multi-level .env file lookup
    }),
  ],
})
export class AppConfigModule {}
