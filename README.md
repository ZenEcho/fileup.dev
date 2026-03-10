# fileup.dev Web

GioPic Web Extension 官方网站前端项目，基于 Vue 3 + TypeScript + Vite，包含首页、插件市场、插件提交、开发者控制台和后台审核页面。

## 技术栈

- Vue 3（Composition API）
- TypeScript
- Vite 7（`@vitejs/plugin-vue`）
- UnoCSS（`presetUno` + `presetAttributify` + `presetIcons`）
- Naive UI
- Vue Router 4
- Pinia 3
- Vue I18n 11（中英文）
- Axios
- VueUse
- WebMCP（`@mcp-b/global`，在 `src/plugins/webmcp.ts` 初始化）

## 运行环境

- Node.js `>= 22.0.0`（仓库 `.node-version` 为 `22.11.0`）
- pnpm（建议 pnpm 10+）

## 安装依赖

```bash
pnpm install
```

## 本地开发

```bash
pnpm dev
```

- 默认启动 Vite 开发服务器（通常是 `http://localhost:5173`）。
- 前端 API 默认指向 `http://127.0.0.1:3000/api`。

## 环境变量（可选）

在项目根目录创建 `.env.local` 覆盖后端地址：

```bash
VITE_API_BASE_URL=http://127.0.0.1:3000/api
```

说明：`VITE_API_BASE_URL` 会被 `src/common/services/api.ts` 读取；未配置时使用默认值 `http://127.0.0.1:3000/api`。

## 构建与预览

```bash
pnpm build
pnpm preview
```

- `pnpm build` 会先执行 `vue-tsc -b` 做类型检查，再执行 `vite build` 输出 `dist/`。
- `pnpm preview` 用于本地预览生产构建产物（通常端口 `4173`）。

## 推荐开发流程

1. 启动后端服务（确保 `/api` 前缀可访问，默认 `127.0.0.1:3000`）。
2. 执行 `pnpm dev` 启动前端开发服务。
3. 按模块开发页面：

- `src/homepage` 首页与登录回调。
- `src/frontend` 插件市场、提交、开发者控制台。
- `src/backstage` 管理员审核页。
- `src/common` 通用组件、状态、API、国际化与样式。

4. 提交前执行 `pnpm build`，确认类型检查与打包通过。
5. 需要验收生产效果时执行 `pnpm preview`。

## 目录结构（当前）

### 根目录树

```text
fileup.dev/
├─ .github/                         # GitHub 工作流与仓库配置
├─ .vscode/                         # 本地编辑器配置
├─ docs/                            # 项目文档与示例配置
│  ├─ examples/                     # 插件配置示例 JSON
│  ├─ serve/                        # 后端/接口/管理台相关设计文档
│  ├─ plugin_architecture.md        # 插件架构说明
│  ├─ plugin_dev_guide.md           # 插件开发指南
│  └─ plugin_template.json          # 插件模板
├─ public/                          # 静态资源（构建时原样拷贝）
├─ src/                             # 前端源码（见下方详细目录树）
├─ dist/                            # 生产构建产物（pnpm build 生成）
├─ index.html                       # Vite 入口 HTML
├─ package.json                     # 脚本与依赖清单
├─ pnpm-lock.yaml                   # pnpm 锁文件
├─ tsconfig.json                    # TypeScript 顶层配置
├─ tsconfig.app.json                # 应用 TS 配置
├─ tsconfig.node.json               # Node 侧 TS 配置
├─ vite.config.ts                   # Vite 构建配置
├─ uno.config.ts                    # UnoCSS 配置
├─ tailwind.config.ts               # Tailwind 配置（历史/兼容）
└─ README.md                        # 项目说明（本文件）
```

### src 详细目录树

```text
src/
├─ main.ts                          # 应用启动入口（挂载 Pinia / Router / I18n）
├─ App.vue                          # 根组件
├─ router/
│  └─ index.ts                      # 路由定义与导航守卫
├─ plugins/
│  └─ webmcp.ts                     # WebMCP 初始化
│
├─ homepage/                        # 官网/登录相关边界
│  ├─ pages/
│  │  ├─ HomeView.vue               # 首页
│  │  ├─ AuthCallback.vue           # GitHub 登录回调页
│  │  └─ index.ts                   # pages 统一导出
│  └─ components/
│     ├─ Hero.vue                   # 首屏
│     ├─ Features.vue               # 特性介绍
│     ├─ Providers.vue              # 支持平台/服务展示
│     ├─ Showcase.vue               # 展示区
│     └─ index.ts                   # 组件统一导出
│
├─ frontend/                        # 开发者前台边界
│  ├─ pages/
│  │  ├─ PluginMarketplace.vue      # 插件市场页（编排层）
│  │  ├─ SubmitPlugin.vue           # 插件提交页
│  │  ├─ Dashboard.vue              # 开发者控制台
│  │  └─ index.ts                   # pages 统一导出
│  ├─ sections/
│  │  ├─ marketplace/
│  │  │  ├─ MarketplaceGridSection.vue  # 市场插件卡片区块
│  │  │  ├─ PluginDetailsModal.vue      # 插件详情弹窗区块
│  │  │  └─ index.ts
│  │  └─ submit/
│  │     ├─ SubmitTestAndPreview.vue    # 提交页测试与预览区块
│  │     └─ index.ts
│  ├─ components/
│  │  ├─ PluginTester.vue           # 测试组件（当前为薄壳，调用 composable）
│  │  ├─ PluginContentPreview.vue   # 兼容导出壳（转发到 common/ui）
│  │  └─ ScriptCodeEditor.vue       # 兼容导出壳（转发到 common/ui）
│  └─ composables/
│     ├─ pluginTester.ts            # PluginTester 脚本执行/MockCtx 工具
│     ├─ usePluginTester.ts         # PluginTester 主逻辑 composable
│     └─ index.ts                   # composables 统一导出
│
├─ backstage/                       # 管理后台边界
│  ├─ pages/
│  │  ├─ AdminReview.vue            # 管理后台页（编排层）
│  │  └─ index.ts                   # pages 统一导出
│  ├─ sections/
│  │  └─ admin/
│  │     ├─ AdminDashboardSection.vue       # 仪表盘区块
│  │     ├─ AdminPluginReviewSection.vue    # 插件审核区块
│  │     ├─ AdminPluginManagementSection.vue# 插件管理区块
│  │     ├─ AdminVersionManagementSection.vue# 版本管理区块
│  │     ├─ AdminReviewManagementSection.vue # 评价管理区块
│  │     ├─ AdminUserManagementSection.vue   # 用户管理区块
│  │     ├─ AdminDownloadStatsSection.vue    # 下载统计区块
│  │     ├─ AdminSystemLogsSection.vue       # 系统日志区块
│  │     ├─ TrendChart.vue                   # 趋势图子组件
│  │     └─ index.ts
│  ├─ composables/
│  │  ├─ adminHelpers.ts             # 管理端通用辅助函数
│  │  ├─ useAdminVersionManagement.ts# 版本管理逻辑
│  │  ├─ useAdminReviewManagement.ts # 评价管理逻辑
│  │  ├─ useAdminPluginManagement.ts # 插件管理逻辑
│  │  ├─ useAdminUserManagement.ts   # 用户管理逻辑
│  │  └─ index.ts
│  └─ constants/
│     ├─ admin.ts                    # 后台菜单/筛选项常量与类型
│     └─ index.ts
│
└─ common/                          # 共享层（跨 homepage/frontend/backstage）
   ├─ api/
   │  ├─ client.ts                  # Axios 实例与基础配置
   │  ├─ auth.ts                    # 认证接口
   │  ├─ plugins.ts                 # 插件相关接口
   │  ├─ reviews.ts                 # 评价相关接口
   │  ├─ versions.ts                # 版本相关接口
   │  ├─ audit.ts                   # 审核/管理相关接口
   │  └─ index.ts                   # API 统一导出
   ├─ types/
   │  ├─ auth.ts                    # 认证类型
   │  ├─ plugin.ts                  # 插件类型
   │  ├─ review.ts                  # 评价类型
   │  ├─ version.ts                 # 版本类型
   │  ├─ admin.ts                   # 管理端类型
   │  └─ index.ts                   # 类型统一导出
   ├─ composables/
   │  ├─ useAuthRedirect.ts         # 登录跳转相关
   │  ├─ useDateFormat.ts           # 时间/数字格式化
   │  ├─ usePluginStatus.ts         # 插件状态文案/样式映射
   │  └─ index.ts
   ├─ ui/
   │  ├─ PluginContentPreview.vue   # 插件内容预览通用组件
   │  ├─ ScriptCodeEditor.vue       # 脚本编辑器通用组件
   │  ├─ StatusTag.vue              # 状态标签通用组件
   │  └─ index.ts
   ├─ components/
   │  ├─ Header.vue                 # 顶部导航
   │  ├─ Footer.vue                 # 页脚
   │  └─ index.ts
   ├─ stores/
   │  ├─ auth.ts                    # Pinia 鉴权状态
   │  └─ index.ts
   ├─ locales/
   │  ├─ zh-CN.ts                   # 中文文案
   │  ├─ en.ts                      # 英文文案
   │  └─ index.ts
   ├─ utils/
   │  ├─ plugin.ts                  # 插件内容校验/格式化工具
   │  ├─ i18n.ts                    # i18n 初始化辅助
   │  └─ index.ts
   ├─ styles/
   │  └─ style.css                  # 全局样式
   ├─ assets/
   │  └─ logo256.png                # 项目 Logo
   └─ services/
      ├─ api.ts                     # 兼容层（转发到 common/api）
      └─ index.ts
```

### 边界说明（重构后）

- `homepage`：官网展示和认证回调页面。
- `frontend`：开发者使用的功能页（市场、提交、控制台）。
- `backstage`：管理员后台与各业务区块。
- `common`：公共 API、类型、状态、composables、UI 组件，供各边界复用。
