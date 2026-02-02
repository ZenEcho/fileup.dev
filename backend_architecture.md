# GioPic 插件市场后端架构设计文档

本文档描述了 GioPic 插件市场的后端架构，旨在支持插件的提交、审核、管理以及公共市场的展示与分发。

## 1. 系统概述

GioPic 插件市场后端是一个中心化的服务，连接插件开发者、管理员和最终用户。
- **开发者**：提交和更新插件。
- **管理员**：审核插件代码（安全性/规范性），管理市场秩序。
- **用户**：在前端市场浏览、搜索并安装经过审核的插件。

## 2. 技术栈选型 (建议)

- **Runtime**: Node.js (LTS)
- **Framework**: NestJS (TypeScript, 模块化, 易于维护)
- **Database**: PostgreSQL (配合 JSONB 存储插件配置)
- **ORM**: Prisma
- **Authentication**: JWT + GitHub OAuth (开发者主要通过 GitHub 登录)
- **Validation**: Zod 或 class-validator (严格校验插件 JSON Schema)

## 3. 数据库设计 (Schema)

### 3.1 Users (用户表)
存储开发者和管理员信息。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID | 主键 |
| `githubId` | String | GitHub 唯一标识 |
| `username` | String | 显示名 |
| `avatar` | String | 头像 URL |
| `role` | Enum | `DEVELOPER`, `ADMIN` |
| `createdAt` | DateTime | 注册时间 |

### 3.2 Plugins (插件主表)
存储插件的基础元数据（不包含具体版本代码）。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String | 插件唯一标识 (如 `org.example.plugin`)，作为主键 |
| `authorId` | UUID | 关联 Users 表 |
| `name` | String | 最新显示名称 |
| `description` | String | 最新描述 |
| `icon` | String | 图标 URL 或 Class |
| `downloads` | BigInt | 总下载/安装量 |
| `isPublic` | Boolean | 是否在市场可见 (下架控制) |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 最后更新时间 |

### 3.3 PluginVersions (插件版本表)
存储插件的具体代码和版本历史。**审核针对的是具体版本**。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID | 主键 |
| `pluginId` | String | 关联 Plugins 表 |
| `version` | String | 语义化版本号 (e.g. `1.0.0`) |
| `content` | JSON | **完整的插件 JSON 内容** (包含 script, inputs 等) |
| `changelog` | String | 更新日志 |
| `status` | Enum | `PENDING` (待审核), `APPROVED` (通过), `REJECTED` (拒绝) |
| `auditLog` | String | 审核意见/拒绝理由 |
| `auditorId` | UUID | 审核管理员 ID |
| `createdAt` | DateTime | 提交时间 |

## 4. 业务流程与 API 设计

### 4.1 插件提交与更新 (Developer)

1.  **创建/更新插件**: 开发者上传符合 `plugin_dev_guide.md` 规范的 JSON 文件。
2.  **后端校验**:
    -   验证 JSON Schema (必填字段、类型)。
    -   验证 `id` 是否归属当前用户（首次提交锁定 `id` 归属）。
    -   验证 `version` 是否大于当前最新版本。
3.  **状态置位**: 新版本存入 `PluginVersions` 表，状态默认为 `PENDING`。

**API Endpoints**:
- `POST /api/dev/plugins`: 提交新插件/新版本。
- `GET /api/dev/plugins`: 获取我的插件列表及状态。
- `DELETE /api/dev/plugins/:id`: 申请下架。

### 4.2 插件审核 (Admin)

1.  **获取待办**: 管理员拉取状态为 `PENDING` 的版本列表。
2.  **代码审查**:
    -   检查 `script` 是否包含恶意代码 (如外发敏感数据、挖矿等)。
    -   检查 `inputs` 定义是否合理。
3.  **决策**:
    -   **通过 (Approve)**: 状态变更为 `APPROVED`。更新 `Plugins` 主表的元数据（name, icon, description）以匹配最新通过的版本。
    -   **拒绝 (Reject)**: 状态变更为 `REJECTED`，填写拒绝理由。

**API Endpoints**:
- `GET /api/admin/reviews`: 获取待审核列表。
- `GET /api/admin/reviews/:versionId`: 获取版本详情（代码对比）。
- `POST /api/admin/reviews/:versionId/approve`: 通过。
- `POST /api/admin/reviews/:versionId/reject`: 拒绝。

### 4.3 市场展示 (Public)

前端市场仅展示状态为 `APPROVED` 的最新版本插件。

**API Endpoints**:
- `GET /api/market/plugins`: 插件列表。
    -   **Params**:
        -   `page`, `limit`: 分页。
        -   `sort`: `popular` (按 downloads 降序), `newest` (按 updatedAt 降序)。
        -   `q`: 搜索关键词 (name, description, author)。
    -   **Response**: 插件摘要列表 (不含 script, inputs 等大字段)。
- `GET /api/market/plugins/:id`: 获取插件详情。
    -   **Response**: 包含完整 JSON 内容 (用于安装)。
    -   **Action**: 调用此接口时，增加 `downloads` 计数（需做防刷限制，如 IP 限制）。

## 5. 安全与风控

1.  **沙箱隔离**: 虽然插件在前端运行，但后端应静态分析 `script`，标记高危操作（如混淆代码、过多的 `fetch` 调用）。
2.  **身份认证**: 强制 GitHub 登录，确保开发者身份可追溯。
3.  **命名空间保护**: 
    -   保留 `org.giopic.*` 或 `cc.pixelpunk.*` 等官方前缀。
    -   先到先得原则保护 `plugin.id`。
4.  **内容审核**: 插件描述和图标不得包含违法违规内容。

## 6. 与前端集成 (PluginMarketplace.vue)

前端需进行以下改造以对接后端：

1.  **数据源替换**: 将 `PluginMarketplace.vue` 中的 Mock `plugins` 数据替换为 `fetch('/api/market/plugins')`。
2.  **排序适配**:
    -   `popular`: 映射到后端 SQL `ORDER BY downloads DESC`。
    -   `newest`: 映射到后端 SQL `ORDER BY "updatedAt" DESC`。
3.  **安装流程**:
    -   点击安装时，调用 `GET /api/market/plugins/:id` 获取完整 JSON。
    -   通过 `window.postMessage` 发送给扩展。

## 7. 扩展功能 (Future)

-   **插件评分/评论**: 用户安装后可评分。
-   **插件统计**: 开发者查看每日安装量趋势。
-   **WebHook**: 插件审核通过后通知开发者 (Email/GitHub)。
