"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigModule = void 0;
/**
 * 应用配置模块 — 加载环境变量并全局注册
 * Application config module — loads environment variables and registers globally
 */
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let AppConfigModule = class AppConfigModule {
};
exports.AppConfigModule = AppConfigModule;
exports.AppConfigModule = AppConfigModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true, // 全局可用，无需在其他模块重复导入 / Available globally, no need to re-import in other modules
                envFilePath: ['.env', '../../.env'], // 支持多级目录查找 .env 文件 / Support multi-level .env file lookup
            }),
        ],
    })
], AppConfigModule);
//# sourceMappingURL=config.module.js.map