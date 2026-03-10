# 账号体系与系统设置（M6）

本文档覆盖截至 2026-03-10 的账号与平台配置能力，基于 `server/src/auth/*`、`server/src/users/*`、`server/src/system-settings/*` 当前实现。

## 1. 模块目标

M6 解决以下问题：

1. 打通 GitHub OAuth、Google OAuth 与本地账号注册/登录的统一认证链路。
2. 建立邮箱验证体系（注册链接 + 6 位验证码 + 冷却重发）。
3. 打通用户自助账号管理（资料、密码、改绑邮箱、账号绑定、账号解绑）。
4. 落地管理员用户治理（分页检索、禁用、角色变更、密码重置、审计日志）。
5. 落地管理员系统配置中心（邮件、验证码）并支持加密存储与审计。

## 2. 账号模型

## 2.1 账号类型（服务层）

- `LOCAL`：仅本地密码账号
- `GITHUB`：仅 GitHub OAuth 账号
- `GOOGLE`：仅 Google OAuth 账号
- `MIXED`：存在 2 种及以上登录源（如 GitHub + Local、Google + Local）

## 2.2 账号状态（服务层）

- `ACTIVE`：账号可用且通过验证策略
- `PENDING`：`status=ACTIVE` 且 `emailVerifyRequired=true` 且 `emailVerifiedAt is null`
- `BANNED`：`status=DISABLED`

## 2.3 登录源字段（接口层）

- `authProvider/accountType`：聚合视角（`LOCAL` / `GITHUB` / `GOOGLE` / `MIXED`）
- `authProviders`：细粒度登录源数组（按顺序返回 `LOCAL`、`GITHUB`、`GOOGLE`）

## 3. 核心业务流程

## 3.1 本地注册与登录

1. `POST /api/auth/register` 校验 `username/email/password/captchaToken`。
2. 创建本地用户（`emailVerifyRequired=true`），发送验证邮件。
3. 验证前，`POST /api/auth/login` 会返回 401（邮箱未验证）。
4. 完成邮箱验证后，登录成功并签发 JWT。

输入规则：

- 用户名：`3~32` 位，`[a-zA-Z0-9_-]`
- 密码：`8~72` 位
- 邮箱：标准格式校验

## 3.2 邮箱验证

支持两种验证方式：

- `GET /api/auth/email/verify?token=...`
- `POST /api/auth/email/verify-code`（`email + 6 位 code`）

验证成功后：

- 消费当前 token/code，并批量失效同用途未消费记录
- 根据用途落库（注册、改绑邮箱、本地绑定）
- 立即签发 JWT 返回前端

重发限制：

- `POST /api/auth/email/resend`
- 冷却时间由 `EMAIL_VERIFY_RESEND_COOLDOWN_SECONDS` 控制（默认 60 秒）

## 3.3 OAuth 登录、绑定、解绑与恢复绑定（GitHub / Google）

- GitHub 登录：`GET /api/auth/github` + `GET /api/auth/github/callback`
- Google 登录：`GET /api/auth/google` + `GET /api/auth/google/callback`
- GitHub 绑定：`POST /api/auth/github/bind`（返回带短期 `state` 的授权地址）
- Google 绑定：`POST /api/auth/google/bind`（返回带短期 `state` 的授权地址）

绑定约束：

- 仅已登录用户可发起
- 目标账号必须已有本地密码（否则返回 `USER_GITHUB_BIND_LOCAL_ONLY` / `USER_GOOGLE_BIND_LOCAL_ONLY`）
- 同一账号同一 provider 不可重复绑定（`USER_GITHUB_ALREADY_BOUND` / `USER_GOOGLE_ALREADY_BOUND`）
- 若 provider 身份已绑定到其他账号，会触发归并保护（`USER_OAUTH_ALREADY_BOUND_TO_OTHER`）

解绑能力：

- 用户自助解绑：`DELETE /api/users/me/oauth/:provider`
- 管理员强制解绑：`DELETE /api/admin/users/:id/oauth/:provider`

解绑约束：

- provider 参数仅支持 `github/google`（服务端归一化为 `GITHUB/GOOGLE`）
- 目标 provider 未绑定时返回 `USER_OAUTH_PROVIDER_NOT_BOUND`
- 不允许解绑最后一个登录方式（返回 `USER_LOGIN_METHOD_LAST_ONE`）
- GitHub 解绑时会同步处理遗留字段 `User.githubId`

OAuth 账号恢复绑定（Rebind）：

1. 用户解绑后，`UserOAuthAccount` 记录不会删除，而是标记 `isActive=false`、记录 `unboundAt`。
2. 若用户后续直接用该第三方登录，登录链路会返回 `USER_OAUTH_UNBOUND_REBIND_REQUIRED`，提示需先在已登录态完成绑定。
3. 用户在安全中心重新发起 `POST /api/auth/:provider/bind`，通过 OAuth 回调带 `state` 进入绑定流程后，可重新激活原记录（`isActive=true`，清空 `unboundAt`）。
4. 若该第三方身份被历史“空壳账号”占用（无本地密码、无管理员角色、无业务数据且仅该单一身份），系统会将身份迁移到当前账号并删除空壳账号；不满足条件时返回冲突错误并拒绝迁移。

## 3.4 用户自助账号管理

- 资料：`GET/PATCH /api/users/me/profile`
- 密码：`PATCH /api/users/me/password`
- 改绑邮箱：`POST /api/users/me/email-change/request` + `POST /api/users/me/email-change/resend`
- 本地绑定：`POST /api/users/me/local-bind/request` + `POST /api/users/me/local-bind/resend`

注意：本地绑定用于 OAuth-only 账号（GitHub-only / Google-only）补齐本地密码登录能力。

## 3.5 管理员用户治理

- 列表分页筛选：`GET /api/admin/users`
- 用户详情：`GET /api/admin/users/:id`
- 编辑资料：`PATCH /api/admin/users/:id`
- 角色变更：`PATCH /api/admin/users/:id/role`
- 状态变更：`PATCH /api/admin/users/:id/status`
- 密码重置：`POST /api/admin/users/:id/password-reset`
- 代发验证：`POST /api/admin/users/:id/resend-verification`
- 强制解绑第三方：`DELETE /api/admin/users/:id/oauth/:provider`

强约束：

- 管理员不能修改自己的角色或状态
- 最后一个 ACTIVE 管理员受保护，不能被降权或禁用
- 管理员操作会写入 `AdminUserActionLog`

## 3.6 管理员系统设置

- 邮件配置：`GET/PATCH /api/admin/settings/mail`
- 测试邮件：`POST /api/admin/settings/mail/test`
- 验证码配置：`GET/PATCH /api/admin/settings/captcha`

配置安全：

- SMTP 密码与验证码密钥通过 AES-256-GCM 加密后落库
- 响应层仅返回 `smtpPassConfigured/secretConfigured`，不返还明文
- 配置更新与测试行为写入 `SystemConfigAuditLog`

## 4. 接口契约清单

## 4.1 Auth

| 路由 | 方法 | 权限 | 关键请求字段 | 关键返回字段 |
| --- | --- | --- | --- | --- |
| `/api/auth/github` | GET | 公开 | `state?` | OAuth 302 跳转 |
| `/api/auth/google` | GET | 公开 | `state?` | OAuth 302 跳转 |
| `/api/auth/github/bind` | POST | JWT | - | `authorizeUrl,provider` |
| `/api/auth/google/bind` | POST | JWT | - | `authorizeUrl,provider` |
| `/api/auth/github/callback` | GET | 公开 | `code,state?` | 登录回调或绑定回调重定向 |
| `/api/auth/google/callback` | GET | 公开 | `code,state?` | 登录回调或绑定回调重定向 |
| `/api/auth/register` | POST | 公开 | `username,email,password,captchaToken` | `verificationSent,requiresEmailVerification,email,expiresAt` |
| `/api/auth/login` | POST | 公开 | `identifier,password,captchaToken?` | `access_token` |
| `/api/auth/email/verify` | GET | 公开 | `token(query)` | `verified,email,userId,purpose,access_token` |
| `/api/auth/email/verify-code` | POST | 公开 | `email,code` | `verified,email,userId,purpose,access_token` |
| `/api/auth/email/resend` | POST | 公开 | `email` | `resent,email,alreadyVerified?` |
| `/api/auth/password-reset/confirm` | POST | 公开 | `token,newPassword,confirmNewPassword` | `reset` |
| `/api/auth/captcha/config` | GET | 公开 | - | `enabled,provider,siteKey,registerEnabled,loginEnabled` |
| `/api/auth/me` | GET | JWT | - | `userId,role,authProvider,accountType,authProviders,status,email*` |

## 4.2 Users（自助）

| 路由 | 方法 | 权限 | 说明 |
| --- | --- | --- | --- |
| `/api/users/me/profile` | GET | JWT | 获取当前用户资料 |
| `/api/users/me/profile` | PATCH | JWT | 更新 `username/displayName/avatar/bio` |
| `/api/users/me/password` | PATCH | JWT | 修改密码 |
| `/api/users/me/email-change/request` | POST | JWT | 发起改绑邮箱验证 |
| `/api/users/me/email-change/resend` | POST | JWT | 重发改绑邮箱验证 |
| `/api/users/me/local-bind/request` | POST | JWT | 发起本地绑定验证 |
| `/api/users/me/local-bind/resend` | POST | JWT | 重发本地绑定验证 |
| `/api/users/me/resend-verification` | POST | JWT | 重发当前邮箱验证 |
| `/api/users/me/oauth/:provider` | DELETE | JWT | 解绑当前用户第三方登录（`github/google`） |

## 4.3 Admin Users

| 路由 | 方法 | 权限 | 说明 |
| --- | --- | --- | --- |
| `/api/admin/users` | GET | JWT + ADMIN | 分页检索（`keyword/role/status/page/pageSize`） |
| `/api/admin/users/:id` | GET | JWT + ADMIN | 用户详情 |
| `/api/admin/users/:id` | PATCH | JWT + ADMIN | 编辑资料与邮箱 |
| `/api/admin/users/:id/role` | PATCH | JWT + ADMIN | 切换角色 |
| `/api/admin/users/:id/status` | PATCH | JWT + ADMIN | 封禁/解封 |
| `/api/admin/users/:id/password-reset` | POST | JWT + ADMIN | 管理员重置密码（`LINK` / `TEMP_PASSWORD`） |
| `/api/admin/users/:id/resend-verification` | POST | JWT + ADMIN | 管理员代发验证邮件 |
| `/api/admin/users/:id/oauth/:provider` | DELETE | JWT + ADMIN | 管理员强制解绑第三方登录（`github/google`） |

## 4.4 Admin Settings

| 路由 | 方法 | 权限 | 说明 |
| --- | --- | --- | --- |
| `/api/admin/settings/mail` | GET | JWT + ADMIN | 获取邮件配置 |
| `/api/admin/settings/mail` | PATCH | JWT + ADMIN | 更新邮件配置 |
| `/api/admin/settings/mail/test` | POST | JWT + ADMIN | 测试邮件发送 |
| `/api/admin/settings/captcha` | GET | JWT + ADMIN | 获取验证码配置 |
| `/api/admin/settings/captcha` | PATCH | JWT + ADMIN | 更新验证码配置 |

## 5. 数据库映射

| 表/枚举 | 关键作用 | 关联功能 |
| --- | --- | --- |
| `User` + `UserStatus` | 账号主信息、状态、认证方式、待确认字段 | 登录、资料、封禁 |
| `EmailVerificationToken` + `EmailVerificationPurpose` | 多用途邮箱验证 | 注册验证、改绑邮箱、本地绑定 |
| `UserOAuthAccount` + `OAuthProvider` | 第三方登录身份映射 | GitHub/Google 登录、绑定、解绑与恢复绑定 |
| `PasswordResetToken` | 管理员密码重置链接 | `/admin/users/:id/password-reset`（LINK） |
| `AdminUserActionLog` + `AdminUserActionType` | 管理员用户治理审计 | 角色、状态、资料、重置密码、代发验证 |
| `SystemMailConfig` + `MailProvider` | 邮件网关配置 | 验证邮件、重置邮件、测试邮件 |
| `SystemCaptchaConfig` + `CaptchaProvider` | 登录/注册验证码策略 | `/auth/register`、`/auth/login` |
| `SystemConfigAuditLog` + `SystemConfigAuditCategory` | 配置操作审计 | 系统设置后台 |

## 6. 关键错误码与约束

- `USER_SELF_ROLE_CHANGE_FORBIDDEN`：禁止管理员修改自己的角色
- `USER_SELF_STATUS_CHANGE_FORBIDDEN`：禁止管理员修改自己的状态
- `USER_LAST_ADMIN_PROTECTED`：最后一个管理员保护
- `USER_EMAIL_TAKEN` / `USER_USERNAME_TAKEN`：账号唯一性冲突
- `USER_GITHUB_BIND_LOCAL_ONLY` / `USER_GOOGLE_BIND_LOCAL_ONLY`：仅本地账号可发起对应 OAuth 绑定
- `USER_GITHUB_ALREADY_BOUND` / `USER_GOOGLE_ALREADY_BOUND`：同账号同 provider 重复绑定
- `USER_OAUTH_ALREADY_BOUND_TO_OTHER` / `OAUTH_EMAIL_CONFLICT`：OAuth 身份冲突
- `OAUTH_BIND_STATE_INVALID` / `OAUTH_BIND_STATE_PROVIDER_MISMATCH`：OAuth 绑定状态校验失败
- `USER_OAUTH_UNBOUND_REBIND_REQUIRED`：该 OAuth 身份已解绑，需先在已登录态重新绑定
- `USER_OAUTH_PROVIDER_NOT_BOUND` / `USER_OAUTH_PROVIDER_INVALID`：解绑目标 provider 非法或未绑定
- `USER_LOGIN_METHOD_LAST_ONE`：禁止解绑最后一个登录方式
- `PASSWORD_RESET_TOKEN_INVALID`：密码重置 token 无效或过期
- `captchaToken is required` / `Captcha validation failed`：验证码缺失或失败

## 7. 依赖与配置要求

必须配置：

- `JWT_SECRET`
- `SETTINGS_ENCRYPTION_KEY`
- `FRONTEND_URL`
- `DATABASE_URL`

建议配置：

- `BACKEND_PUBLIC_URL`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_CALLBACK_URL`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL`
- `EMAIL_VERIFY_TOKEN_TTL_MINUTES`
- `EMAIL_VERIFY_RESEND_COOLDOWN_SECONDS`
- `PASSWORD_RESET_TOKEN_TTL_MINUTES`

## 8. 当前风险与实现偏差

1. 本地 DTO 尚未接入 `class-validator` 注解，校验集中在 Service 层，错误结构不完全统一。
2. `UsersService` 当前手动 new `PasswordService/EmailVerificationService`，未完全走 Nest DI，后续可收敛。
3. OAuth 身份处于兼容期：`User.githubId` 与 `UserOAuthAccount` 双源并存，迁移回填不完整会增加归并复杂度。
4. 验证码验证依赖外部网络（Cloudflare/Google），在弱网或供应商异常时会影响登录/注册。

## 9. 验收清单

- [ ] 本地注册后未验证不可登录；验证成功后可拿到 JWT。
- [ ] `auth/me` 可返回 `authProvider + accountType + authProviders + status`，前端能正确渲染账户类型与登录源标签。
- [ ] 管理员分页查询、禁用、角色切换、密码重置均可落库并写审计。
- [ ] 邮件和验证码配置更新后可即时生效，且密钥不以明文返回。
- [ ] 关键环境变量缺失时，服务可给出明确错误而非静默失败。
