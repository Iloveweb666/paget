/**
 * 应用程序入口文件 — 初始化并启动 NestJS 服务器
 * Application entry point — initializes and starts the NestJS server
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// 启动函数：创建应用并配置中间件 / Bootstrap function: create app and configure middleware
async function bootstrap() {
  // 创建 NestJS 应用实例 / Create the NestJS application instance
  const app = await NestFactory.create(AppModule);

  // 注册全局验证管道（自动转换类型、剥离白名单外的字段） / Register global validation pipe (auto-transform types, strip non-whitelisted fields)
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  // 注册全局异常过滤器（统一错误响应格式） / Register global exception filter (unified error response format)
  app.useGlobalFilters(new GlobalExceptionFilter());
  // 注册全局响应拦截器（统一成功响应格式） / Register global response interceptor (unified success response format)
  app.useGlobalInterceptors(new TransformInterceptor());

  // 启用跨域 / Enable CORS
  app.enableCors();

  // 从配置服务中获取端口号，默认 3000 / Get the port from config service, default 3000
  const configService = app.get(ConfigService);
  const port = configService.get('SERVER_PORT', 3000);

  // 监听端口并启动服务 / Listen on port and start the server
  await app.listen(port);
  console.log(`Paget server running on http://localhost:${port}`);
}

// 执行启动函数 / Execute the bootstrap function
bootstrap();
