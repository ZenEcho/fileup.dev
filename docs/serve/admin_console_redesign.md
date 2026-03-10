# 管理员后台工作台模块（M2）

本文档对应 `/admin` 工作台（`src/backstage/pages/*`），聚焦管理员后台能力边界、后端耦合关系与演示态边界。

## 1. 模块定位

目标：把管理员能力从“单点审核”升级为“审核 + 运营 + 版本治理 + 评价治理 + 用户治理 + 系统设置 + 日志”的统一工作台。

路由入口：`/admin`

依赖后端模块：

- `plugins.controller.ts`
- `admin-users.controller.ts`
- `users.controller.ts`（兼容旧接口）
- `system-settings.controller.ts`

## 2. 信息架构（IA）

```text
管理员后台
├── 仪表盘 Dashboard
├── 插件审核
├── 插件管理
├── 插件版本管理
├── 插件评价管理
├── 用户管理
├── 系统设置
├── 下载统计
└── 系统日志
```

## 3. 子模块与后端耦合矩阵

| 子模块 | 前端主数据源 | 后端接口 | 当前状态 |
| --- | --- | --- | --- |
| 仪表盘 | 插件/用户聚合统计 | `GET /plugins/admin/all`、`GET /admin/users` | 真实接口 |
| 插件审核 | 待审核版本 + 审核动作 | `GET /plugins/pending`、`PATCH /plugins/:id/versions/:version/audit` | 真实接口 |
| 插件管理 | 全量插件运营操作 | `GET /plugins/admin/all`、`PATCH /plugins/:id/visibility`、`DELETE /plugins/:id` | 真实接口 |
| 插件版本管理 | 版本列表、回滚、删除、日志 | `GET /plugins/:id/versions`、`PATCH /plugins/:id/versions/:version/rollback`、`DELETE /plugins/:id/versions/:version`、`GET /plugins/:id/versions/actions` | 真实接口 |
| 插件评价管理 | 评价列表、回复、删除 | `GET /plugins/:id/reviews`、`PATCH /plugins/:id/reviews/:reviewId/reply`、`DELETE /plugins/:id/reviews/:reviewId` | 真实接口 |
| 用户管理 | 用户分页、详情、编辑、角色、状态、重置密码 | `GET /admin/users*`、`PATCH /admin/users/:id*`、`POST /admin/users/:id/password-reset`、`POST /admin/users/:id/resend-verification` | 真实接口 |
| 系统设置 | 邮件与验证码配置 | `GET/PATCH /admin/settings/mail`、`POST /admin/settings/mail/test`、`GET/PATCH /admin/settings/captcha` | 真实接口 |
| 下载统计 | 总览/趋势/明细 | 仅复用 `downloads` 汇总字段 | 明细与趋势为前端模拟 |
| 系统日志 | 审核日志 + 版本动作 + 配置审计 + 用户治理审计 | 版本日志来自 `GET /plugins/:id/versions/actions`，其余日志目前前端聚合 | 混合态 |

## 4. 关键实现约束

## 4.1 插件审核

- 审核对象来源：`GET /plugins/pending` 返回的 `versions[]`。
- 审核动作：`PATCH /plugins/:id/versions/:version/audit`。
- 审核内容预览：基于 `PluginVersion.content`，而不是 `Plugin` 摘要字段。

## 4.2 版本治理

- 版本列表请求携带 `includeDeleted=true`。
- 回滚写入 `activeVersionId` 并生成动作日志。
- 删除为软删除（`deletedAt/deletedById/deleteReason`）。

## 4.3 评价治理

- 评价详情与回复采用后端返回的 `reviews[].replies`。
- 管理员删除评价走服务端权限校验（非 ADMIN 会被拒绝）。

## 4.4 用户治理

- `PATCH /admin/users/:id/role`：角色切换，受“最后一个管理员保护”约束。
- `PATCH /admin/users/:id/status`：封禁/解封（`ACTIVE/BANNED`），已真实落库。
- `PATCH /admin/users/:id`：可编辑 `username/displayName/avatar/bio/email/adminNote`。
- 用户登录源展示已升级为 `authProviders[]`（支持 `LOCAL/GITHUB/GOOGLE` 多标签），不再只依赖单值 `authProvider`。
- `POST /admin/users/:id/password-reset`：支持 `LINK` 与 `TEMP_PASSWORD` 两种模式。
- 管理员不能修改自己的角色或状态（后端硬限制）。

## 4.5 系统设置治理

- 邮件配置更新后只返回 `smtpPassConfigured`，不回传明文口令。
- 测试邮件返回明确 `success/errorMessage`，并写入配置审计日志。
- 验证码支持 `TURNSTILE/RECAPTCHA` 与登录/注册分场景开关。

## 5. 风险检测规则（前端辅助）

风险检测为前端静态命中，不替代服务端安全扫描。

评分规则：

- `eval(...)`：+25
- `new Function(...)`：+20
- `document.cookie`：+16
- `fetch("http...")`：+10

等级阈值：

- `LOW`: `< 30`
- `MEDIUM`: `30~64`
- `HIGH`: `>= 65`

## 6. 真实能力与演示态边界

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 审核通过/拒绝 | 真实 | 后端落库并更新状态 |
| 强制下架/恢复可见 | 真实 | `adminDisabled` 与 `isPublic` 联动 |
| 插件删除 | 真实 | 后端级联删除版本和下载记录 |
| 版本回滚/删除 | 真实 | 事务 + 审计日志 |
| 评价删除/回复 | 真实 | 权限由后端校验 |
| 用户角色切换 | 真实 | `ADMIN/DEVELOPER` 双向切换 |
| 用户封禁/解封 | 真实 | `PATCH /admin/users/:id/status` 落库 |
| 用户重置密码/代发验证 | 真实 | `password-reset` / `resend-verification` 已落地 |
| 邮件与验证码系统设置 | 真实 | `/admin/settings/*` 已落地 |
| 下载明细与趋势明细 | 演示 | 由 `downloads` 汇总值前端拆分模拟 |
| 系统日志全量查询 | 混合 | 后端已写日志表，但前端暂未统一查询接口 |

## 7. 与后端协同建议（下一步）

1. 新增管理员日志查询接口：覆盖 `AdminUserActionLog`、`SystemConfigAuditLog`。
2. 新增下载统计接口：`overview/details/trend`，减少前端模拟。
3. 审核接口增加结构化 `reason` 字段，统一后台日志展示。
4. 将脚本风险扫描下沉到服务端或异步任务，形成可追溯扫描结果。

## 8. 验收清单

- [ ] `/admin` 仅管理员可访问（前端路由 + 后端接口双重约束）。
- [ ] 审核、上下架、删除、版本回滚、版本删除均可真实落库。
- [ ] 用户角色切换、封禁解封、密码重置、代发验证均可真实执行。
- [ ] 系统设置（邮件/验证码）可真实读写并具备审计记录。
- [ ] 演示态功能在 UI 中有明确提示，不与真实能力混淆。
