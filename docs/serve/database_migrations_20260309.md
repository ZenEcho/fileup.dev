# 数据库迁移与模型变更（M7）

本文档汇总 `server/prisma/migrations` 在 2026-03-08 ~ 2026-03-10 的增量变更，目标是回答“数据库改了什么、上线要注意什么”。

## 1. 迁移范围

本次纳入以下 8 个迁移：

1. `20260308093000_add_plugin_review_system`
2. `20260308195000_add_plugin_version_management`
3. `20260309083000_add_local_auth`
4. `20260309113000_add_email_verification_and_system_settings`
5. `20260309150000_add_user_profile_admin_user_management`
6. `20260309173000_add_account_management_features`
7. `20260310110000_add_google_oauth_accounts`
8. `20260310123000_add_oauth_unbind_support`

## 2. 迁移时间线

| 迁移 ID | 主题 | 核心变化 |
| --- | --- | --- |
| `20260308093000` | 插件评价系统 | 新增 `PluginReview`、`PluginReviewReply` |
| `20260308195000` | 版本治理 | `Plugin.activeVersionId`、`PluginVersion` 软删除字段、`PluginVersionActionLog` |
| `20260309083000` | 本地认证基础 | `User` 新增 `email/passwordHash/status`，`githubId` 可空 |
| `20260309113000` | 邮箱验证与系统设置 | 新增 `EmailVerificationToken`、`SystemMailConfig`、`SystemCaptchaConfig`、`SystemConfigAuditLog` |
| `20260309150000` | 用户资料与管理员治理 | `User` 新增资料/审计字段，新增 `AdminUserActionLog` |
| `20260309173000` | 账号管理增强 | `User.pendingEmail*`、`EmailVerificationToken.purpose`、`PasswordResetToken`、管理员动作枚举扩展 |
| `20260310110000` | OAuth 账号归一化 | 新增 `UserOAuthAccount`、`OAuthProvider`，并回填历史 `githubId` 身份 |
| `20260310123000` | OAuth 解绑支持 | `UserOAuthAccount` 新增解绑状态字段，管理员动作新增 `FORCE_UNBIND_OAUTH` |

## 3. 结构变更详情

## 3.1 User 表新增字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `email` | `VARCHAR(191)` + unique | 本地登录邮箱 |
| `passwordHash` | `VARCHAR(255)` | scrypt 哈希 |
| `status` | `ENUM('ACTIVE','DISABLED')` | 账号可用状态 |
| `emailVerifiedAt` | `DATETIME(3)` | 邮箱验证完成时间 |
| `emailVerifyRequired` | `BOOLEAN` | 是否必须验证邮箱 |
| `lastVerificationSentAt` | `DATETIME(3)` | 最近验证邮件发送时间 |
| `displayName` | `VARCHAR(100)` | 显示名称 |
| `bio` | `TEXT` | 个人简介 |
| `adminNote` | `TEXT` | 管理员备注 |
| `lastLoginAt` | `DATETIME(3)` | 最近登录时间 |
| `passwordUpdatedAt` | `DATETIME(3)` | 最近改密时间 |
| `updatedAt` | `DATETIME(3)` | 更新时间 |
| `pendingEmail` | `VARCHAR(191)` + unique | 待确认邮箱 |
| `pendingEmailPurpose` | `ENUM('EMAIL_CHANGE','LOCAL_BIND')` | 待确认邮箱用途 |
| `pendingPasswordHash` | `VARCHAR(255)` | 本地绑定待生效密码 |

同时：

- `githubId` 调整为可空（支持纯本地账号）。
- 新增唯一索引 `User_email_key`、`User_pendingEmail_key`。

## 3.2 新增业务表

| 表 | 作用 | 关键字段 |
| --- | --- | --- |
| `PluginReview` | 插件评价 | `pluginId,userId,rating,content` |
| `PluginReviewReply` | 评价回复 | `reviewId,userId,content` |
| `PluginVersionActionLog` | 版本动作审计 | `action,fromVersion,toVersion,targetVersion,operatorId` |
| `EmailVerificationToken` | 邮箱验证令牌 | `purpose,tokenHash,codeHash,expiresAt,consumedAt` |
| `SystemMailConfig` | 邮件配置单例 | `id='default',smtpPassEncrypted,enabled` |
| `SystemCaptchaConfig` | 验证码配置单例 | `provider,secretEncrypted,registerEnabled,loginEnabled` |
| `SystemConfigAuditLog` | 系统配置审计 | `category,action,operatorId,success,detail` |
| `AdminUserActionLog` | 管理员用户治理审计 | `action,operatorId,targetUserId,detail` |
| `PasswordResetToken` | 密码重置令牌 | `tokenHash,expiresAt,consumedAt,createdByAdminId` |
| `UserOAuthAccount` | 第三方账号映射 | `provider,providerUserId,providerEmail,userId,isActive,unboundAt` |

## 3.3 OAuth 解绑相关字段

- `UserOAuthAccount.isActive`：是否为可用绑定（解绑后置 `false`）
- `UserOAuthAccount.unboundAt`：解绑时间
- 解绑采用软状态，不删除 identity，支持后续恢复绑定

## 3.4 插件域结构增强

- `Plugin` 新增：`activeVersionId`、`lastVersionActionAt`
- `PluginVersion` 新增：`deletedAt`、`deletedById`、`deleteReason`
- 新建 `PluginVersionActionLog` 支持版本回滚/删除审计

## 3.5 新增/扩展枚举

| 枚举 | 新值 |
| --- | --- |
| `UserStatus` | `ACTIVE` / `DISABLED` |
| `EmailVerificationPurpose` | `REGISTER` / `EMAIL_CHANGE` / `LOCAL_BIND` |
| `PendingEmailPurpose` | `EMAIL_CHANGE` / `LOCAL_BIND` |
| `OAuthProvider` | `GITHUB` / `GOOGLE` |
| `AdminUserActionType` | 新增 `RESET_PASSWORD`、`FORCE_UNBIND_OAUTH` |
| `MailProvider` | `SMTP` |
| `CaptchaProvider` | `TURNSTILE` / `RECAPTCHA` |
| `SystemConfigAuditCategory` | `MAIL` / `CAPTCHA` |
| `PluginVersionActionType` | `ROLLBACK` / `DELETE` |

## 3.6 索引与外键重点

新增重点索引：

- `EmailVerificationToken_userId_purpose_createdAt_idx`
- `EmailVerificationToken_email_purpose_createdAt_idx`
- `PasswordResetToken_tokenHash_idx`
- `AdminUserActionLog_operatorId_createdAt_idx`
- `PluginVersion_pluginId_deletedAt_createdAt_idx`
- `UserOAuthAccount_provider_providerUserId_key`
- `UserOAuthAccount_provider_userId_key`
- `UserOAuthAccount_userId_provider_isActive_idx`

新增重点外键：

- `PasswordResetToken.userId -> User.id`（CASCADE）
- `PasswordResetToken.createdByAdminId -> User.id`（SET NULL）
- `AdminUserActionLog.operatorId/targetUserId -> User.id`（CASCADE）
- `UserOAuthAccount.userId -> User.id`（CASCADE）
- `Plugin.activeVersionId -> PluginVersion.id`（SET NULL）

## 4. 上线顺序与部署建议

## 4.1 新库（空库）

直接执行：

```bash
corepack pnpm exec prisma migrate deploy
corepack pnpm exec prisma generate
```

## 4.2 历史非空库（可能触发 P3005）

按 `server/docs/prisma-baseline-and-deploy.md` 做一次性 baseline：

```bash
corepack pnpm exec prisma migrate resolve --applied 20260202011313_init
corepack pnpm exec prisma migrate resolve --applied 20260202032856_add_admin_disabled_and_cascade_delete
corepack pnpm exec prisma migrate resolve --applied 20260308093000_add_plugin_review_system
corepack pnpm exec prisma migrate resolve --applied 20260308195000_add_plugin_version_management
corepack pnpm exec prisma migrate resolve --applied 20260309083000_add_local_auth
corepack pnpm exec prisma migrate resolve --applied 20260309113000_add_email_verification_and_system_settings
corepack pnpm exec prisma migrate resolve --applied 20260309150000_add_user_profile_admin_user_management
corepack pnpm exec prisma migrate resolve --applied 20260309173000_add_account_management_features
corepack pnpm exec prisma migrate resolve --applied 20260310110000_add_google_oauth_accounts
corepack pnpm exec prisma migrate resolve --applied 20260310123000_add_oauth_unbind_support
corepack pnpm exec prisma migrate deploy
```

再执行：

```bash
corepack pnpm exec prisma migrate status
corepack pnpm exec prisma generate
corepack pnpm build
```

## 5. 兼容性与数据风险

1. `User.pendingEmail` 是唯一索引，历史脏数据会阻塞迁移。
2. 新增 `User.updatedAt NOT NULL DEFAULT CURRENT_TIMESTAMP(3)`，老库若结构偏差可能需要手工修复。
3. 邮箱验证和密码重置都依赖时间窗口，数据库与应用服务器时钟偏差会影响体验。
4. `UserOAuthAccount` 唯一约束对历史重复身份敏感，迁移前需清理脏数据。
5. OAuth 解绑采用软状态（`isActive`），如果历史数据存在“同 provider 多状态冲突”，会影响恢复绑定路径。
6. 新增表较多，发布前需确认数据库账号具备 `CREATE/ALTER/INDEX/FOREIGN KEY` 权限。

## 6. 发布后核验清单

- [ ] `prisma migrate status` 显示 8 个目标迁移均为 applied。
- [ ] `User` 表含 `email/pendingEmail/status/passwordHash` 等新字段。
- [ ] `PasswordResetToken`、`AdminUserActionLog`、`SystemMailConfig`、`SystemCaptchaConfig`、`UserOAuthAccount` 表已创建。
- [ ] `UserOAuthAccount` 存在 `isActive/unboundAt` 字段，且有 `userId,provider,isActive` 复合索引。
- [ ] 管理员强制解绑操作可落库并写 `FORCE_UNBIND_OAUTH` 审计。
- [ ] 登录、注册、验证码、系统设置、OAuth 解绑流程可正常读写。