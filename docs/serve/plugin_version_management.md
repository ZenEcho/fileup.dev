# 插件版本生命周期管理（M3）

本文档聚焦插件版本治理能力，所有规则以 `server/src/plugins/plugins.service.ts` 和 `schema.prisma` 为准。

## 1. 模块目标

解决三个核心问题：

1. 可以显式指定“当前生效版本”（不再依赖“最新通过版本”隐式推断）。
2. 可以回滚到历史稳定版本。
3. 可以软删除无效版本并保留审计线索。

## 2. 数据模型耦合

## 2.1 Plugin

- `activeVersionId`: 当前生效版本指针。
- `lastVersionActionAt`: 最近一次版本动作时间。

## 2.2 PluginVersion

- `status`: `PENDING/APPROVED/REJECTED`
- `deletedAt/deletedById/deleteReason`: 软删除字段。
- 唯一约束：`@@unique([pluginId, version])`

## 2.3 PluginVersionActionLog

- `action`: `ROLLBACK/DELETE`
- `fromVersion/toVersion/targetVersion`
- `operatorId/reason/createdAt`

## 3. 权限模型

| 操作 | 未登录 | 插件作者 | 管理员 |
| --- | --- | --- | --- |
| 查看版本列表 | ❌ | ✅（仅自己插件） | ✅ |
| 回滚版本 | ❌ | ✅（仅自己插件） | ✅ |
| 删除版本 | ❌ | ✅（仅自己插件） | ✅ |
| 查看动作日志 | ❌ | ✅（仅自己插件） | ✅ |

权限校验由 `ensureVersionManagePermission` 统一执行。

## 4. 生效版本规则

`resolveEffectiveActiveVersion` 规则：

1. 若 `activeVersionId` 指向版本存在且为 `APPROVED` 且未删除，则直接作为生效版本。
2. 否则退化为最新可用 `APPROVED` 版本。
3. 当发生退化时，会尝试自愈写回 `Plugin.activeVersionId`。

## 5. 接口契约

统一前缀：`/api/plugins`

## 5.1 获取版本列表

`GET /:id/versions?includeDeleted=true|false`

返回核心字段：

- `activeVersion`
- `versions[].isActive`
- `versions[].deletedAt`

## 5.2 回滚版本

`PATCH /:id/versions/:version/rollback`

请求体：

```json
{
  "reason": "可选原因"
}
```

执行约束：

1. 目标版本必须存在、`APPROVED`、未删除。
2. 目标版本不能等于当前生效版本。
3. 必须在事务中完成：
   - 更新 `Plugin.activeVersionId`
   - 同步摘要字段（`name/description/icon`）
   - 更新 `lastVersionActionAt`
   - 写入 `PluginVersionActionLog(ROLLBACK)`

## 5.3 删除版本

`DELETE /:id/versions/:version?reason=...`

执行约束：

1. 目标版本必须存在且未删除。
2. 不允许删除当前生效版本。
3. 若目标版本是 `APPROVED`，删除后必须至少保留 1 个可用 `APPROVED` 版本。
4. 删除为软删除（写入 `deletedAt/deletedById/deleteReason`）。
5. 事务中写 `PluginVersionActionLog(DELETE)` 并更新 `lastVersionActionAt`。

## 5.4 版本动作日志

`GET /:id/versions/actions`

返回最近 100 条动作，包含操作者 `username/avatar`。

## 6. 错误码（当前实现）

| 场景 | 状态码 | code |
| --- | --- | --- |
| 无权限管理该插件版本 | 403 | `PLUGIN_VERSION_FORBIDDEN` |
| 插件不存在 | 404 | `PLUGIN_NOT_FOUND` |
| 回滚目标非法（非 APPROVED 或已删除） | 400 | `PLUGIN_VERSION_ROLLBACK_INVALID_TARGET` |
| 无可用生效版本 | 409 | `PLUGIN_VERSION_NO_APPROVED_ACTIVE` |
| 回滚目标已是当前版本 | 409 | `PLUGIN_VERSION_ALREADY_ACTIVE` |
| 版本不存在 | 404 | `PLUGIN_VERSION_NOT_FOUND` |
| 删除当前生效版本 | 409 | `PLUGIN_VERSION_DELETE_ACTIVE_FORBIDDEN` |
| 删除后无可用 APPROVED 版本 | 409 | `PLUGIN_VERSION_DELETE_LAST_APPROVED_FORBIDDEN` |

## 7. 前端耦合点

## 7.1 开发者中心（`Dashboard.vue`）

- 入口：插件卡片进入版本管理。
- 核心动作：查看版本、回滚、删除、查看动作日志。

## 7.2 管理后台（`AdminReview.vue`）

- 版本管理子模块使用同一套接口。
- 管理员可跨作者执行版本治理动作。

## 8. 一致性要求

1. 回滚/删除必须事务化。
2. 返回值需带最新 `activeVersion` 语义，便于前端刷新。
3. 回滚后市场安装载荷应立即切换到目标版本 `content`。
4. 删除仅软删除，不做物理清理。

## 9. 非目标（当前不覆盖）

- 自动语义化版本递增。
- 灰度发布、分流发布。
- 多生效版本并发分发。

## 10. 验收清单

- [ ] 版本列表可识别当前生效版本。
- [ ] 回滚后安装流量切到目标版本。
- [ ] 删除动作不会破坏“至少一个可用 APPROVED 版本”约束。
- [ ] 所有版本治理动作都能在日志中追溯操作者与原因。
