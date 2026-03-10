# FileUp Serve 文档总览（后端耦合版）

本目录按“先整合，再按域拆分”的方式维护为 7 个模块，统一以 `server/` 当前实现为基线。

> 排除文件：`plugin_dev_guide.md`（按你的要求保留原状，不参与本次拆分）。

## 1. 模块目录

| 模块 | 文件 | 责任边界 | 主要后端耦合点 |
| --- | --- | --- | --- |
| M1 基线架构 | `backend_architecture.md` | 系统基线、统一术语、核心接口契约、跨模块数据模型 | `server/src/main.ts`、`server/prisma/schema.prisma`、`server/src/auth/*`、`server/src/users/*`、`server/src/system-settings/*`、`server/src/plugins/*` |
| M2 运营后台 | `admin_console_redesign.md` | `/admin` 工作台 IA、运营动作、真实/演示边界 | `plugins.controller.ts`、`admin-users.controller.ts`、`system-settings.controller.ts` |
| M3 版本生命周期 | `plugin_version_management.md` | `activeVersion`、回滚、软删除、版本审计日志 | `Plugin.activeVersionId`、`PluginVersion.deletedAt`、`PluginVersionActionLog` |
| M4 评价闭环 | `plugin_review_system.md` | 评价发布、作者/管理员回复、删除与展示兼容层 | `PluginReview`、`PluginReviewReply`、`/plugins/:id/reviews*` |
| M5 市场通讯 | `plugin_market_api.md` | Web 市场与 GioPic 扩展消息协议、安装载荷约束 | `PluginVersion.content`、`window.postMessage` 协议、`PluginMarketplace.vue` |
| M6 账号与系统设置 | `auth_account_system_settings.md` | 本地账号、GitHub/Google OAuth、邮箱验证、多 provider 绑定/解绑/恢复绑定、管理员用户治理、系统邮件/验证码配置 | `/auth/*`、`/users/*`、`/admin/users/*`、`/admin/settings/*` |
| M7 数据库迁移 | `database_migrations_20260309.md` | 2026-03-08 ~ 2026-03-10 数据库结构增量（含 OAuth 解绑支持）、上线顺序与兼容要点 | `prisma/schema.prisma`、`prisma/migrations/*`、`docs/prisma-baseline-and-deploy.md` |

## 2. 阅读顺序

1. 先读 M1（基础约束与统一术语）。
2. 做账号、权限、系统配置相关开发时读 M6。
3. 做插件市场、审核、版本、评价时读 M2/M3/M4/M5。
4. 涉及发布与数据库上线时读 M7。

## 3. 能力映射

| 能力点 | 归属模块 | 说明 |
| --- | --- | --- |
| NestJS + Prisma + MySQL 架构与统一接口前缀 | M1 | 作为唯一基线，不在业务模块重复定义 |
| 插件提交/审核/市场安装流程 | M1 + M2 + M3 + M5 | M1 讲主流程，M2 讲后台操作，M3 讲版本治理，M5 讲安装协议 |
| 评价系统权限与接口 | M4 | “单次评价 + 多次回复 + 兼容 authorReply” |
| 本地注册登录、GitHub/Google OAuth、邮箱验证、账号绑定/解绑/恢复绑定、密码重置 | M6 | 覆盖 `/auth` + `/users` + `/admin/users` |
| 邮件与验证码系统配置 | M6 | 覆盖 `/admin/settings/mail`、`/admin/settings/captcha` |
| 近期数据库演进与迁移发布顺序 | M7 | 直接对齐 migration SQL 与 schema |

## 4. 统一维护规范

- 接口、权限、字段定义以 `server/` 代码为准，不以前端 UI 文案为准。
- 新增认证/账号/系统配置接口：先更新 M1，再更新 M6。
- 变更 Prisma 字段或迁移：至少同步 M1 + M7，必要时更新业务模块。
- 管理台文档必须明确区分“真实后端能力”和“前端演示态能力”。
