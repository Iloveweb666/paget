/**
 * 数据库模块 — 通过 TypeORM 异步连接 MySQL
 * Database module — connects to MySQL asynchronously via TypeORM
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get('DB_HOST', 'localhost'),           // 数据库主机地址 / Database host address
        port: config.get('DB_PORT', 3306),                  // 数据库端口 / Database port
        username: config.get('DB_USERNAME', 'root'),        // 数据库用户名 / Database username
        password: config.get('DB_PASSWORD', ''),            // 数据库密码 / Database password
        database: config.get('DB_DATABASE', 'paget'),       // 数据库名 / Database name
        autoLoadEntities: true,                             // 自动加载实体 / Auto-load entities
        synchronize: config.get('NODE_ENV') !== 'production', // 非生产环境自动同步表结构 / Auto-sync schema in non-production
        logging: config.get('NODE_ENV') !== 'production',     // 非生产环境开启 SQL 日志 / Enable SQL logging in non-production
      }),
    }),
  ],
})
export class DatabaseModule {}
