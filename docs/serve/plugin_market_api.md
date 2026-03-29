# 插件市场通讯协议（M6，2026-03-29 迭代）

本文档对应 `web/fileup.dev` 与 `server` 当前实现，描述 GioPic 浏览器扩展、插件市场前端以及插件市场后端之间的协作约束。

本轮更新的核心目标是让市场端完整适配统一插件体系的第三类插件：`editor-adapter`。

## 1. 本轮变化摘要

- 插件类型从双类型扩展为三类型：
  - `kind: "uploader"`
  - `kind: "site-detector"`
  - `kind: "editor-adapter"`
- `window.postMessage` 的消息类型没有变化，但安装载荷 schema 已扩展。
- 市场安装仍然必须使用后端返回的完整 `versions[0].content` 原样透传。
- 服务端提交校验已经改为按 `kind` 分流：
  - `uploader` 校验 `uploader.script` 与 `uploader.inputs`
  - `site-detector` 校验 `detector.targetDriveType`、`detector.detectScript`、`detector.extractScript`
  - `editor-adapter` 校验 `editorAdapter.editorType`、`editorAdapter.displayName`、`editorAdapter.detectScript`、`editorAdapter.injectScript`
- 市场预览、后台审核、风险分析都需要识别三类插件的可执行脚本字段。

## 2. 与后端耦合链路

### 2.1 市场列表与详情

前端通过以下接口从市场后端获取插件数据：

```http
GET /api/plugins
GET /api/plugins/:id
```

当前实现约束：

- 响应体中的 `versions[0]` 必须是展示/安装所用的最新有效版本
- `versions[0].content` 必须是完整插件 JSON
- 前端安装时不得用摘要字段重新拼装插件对象

### 2.2 提交插件

```http
POST /api/plugins
```

当前后端会接收：

- 顶层元数据：`id`、`name`、`version`、`description`、`icon`、`kind`
- 完整 `content`
- 可选的顶层辅助字段：
  - `script`
  - `targetDriveType`
  - `editorType`
  - `displayName`
  - `detectScript`
  - `extractScript`
  - `injectScript`

说明：

- 最终落库与审核都以完整 `content` 为准。
- 顶层辅助字段仅用于服务端归一化，不应替代完整 `content`。

### 2.3 安装记录

```http
POST /api/plugins/:id/download
```

该接口用于记录扩展内置在线市场中的安装或更新动作。

- 当前前端不依赖返回体
- 请求成功即可
- 失败时允许降级，不应阻塞实际安装

## 3. 扩展检测

```javascript
const isGioPicInstalled = document.documentElement.hasAttribute('data-giopic-page-bundle')
```

## 4. 网页桥接安全边界

扩展对“网页 -> GioPic 扩展”的插件管理桥接做了来源隔离。

- 默认只有 `https://fileup.dev/` 拥有完整权限
- 完整权限站点可在扩展设置中维护
- 授权按 `origin` 判断，且只接受 `https://` 站点

完整权限包括：

- `GIOPIC_INSTALL_PLUGIN`
- `GIOPIC_TOGGLE_PLUGIN`
- `GIOPIC_UNINSTALL_PLUGIN`
- `GIOPIC_GET_INSTALLED_PLUGINS` 返回完整 `PluginMeta`

非授权站点：

- 仍可调用 `GIOPIC_GET_INSTALLED_PLUGINS`
- 但只会得到基础摘要，不会暴露完整脚本字段
- 其余插件管理操作会被拒绝

拒绝时返回：

```json
{
  "success": false,
  "error": "Only authorized plugin market sites can perform this action"
}
```

## 5. 消息协议

### 5.1 安装 / 更新插件

请求：`GIOPIC_INSTALL_PLUGIN`

```javascript
window.postMessage({
  type: 'GIOPIC_INSTALL_PLUGIN',
  plugin: fullPluginContent,
}, '*')
```

结果：`GIOPIC_INSTALL_PLUGIN_RESULT`

- `success: boolean`
- `pluginId?: string`
- `error?: string`

说明：

- 安装与更新共用同一消息
- 若同 `id` 已存在，扩展执行覆盖更新并自动启用
- `plugin` 必须直接使用后端返回的完整 `content`

### 5.2 获取已安装插件

请求：`GIOPIC_GET_INSTALLED_PLUGINS`

响应：`GIOPIC_GET_INSTALLED_PLUGINS_RESULT`

- `success: boolean`
- `plugins?: PluginMeta[] | PluginPublicSummary[]`
- `error?: string`

说明：

- 授权站点返回完整插件元数据
- 非授权站点只返回可公开摘要，不返回完整运行时代码

### 5.3 启用 / 禁用插件

请求：`GIOPIC_TOGGLE_PLUGIN`

```javascript
window.postMessage({
  type: 'GIOPIC_TOGGLE_PLUGIN',
  pluginId: 'org.example.plugin',
  enabled: true,
}, '*')
```

响应：`GIOPIC_TOGGLE_PLUGIN_RESULT`

### 5.4 卸载插件

请求：`GIOPIC_UNINSTALL_PLUGIN`

```javascript
window.postMessage({
  type: 'GIOPIC_UNINSTALL_PLUGIN',
  pluginId: 'org.example.plugin',
}, '*')
```

响应：`GIOPIC_UNINSTALL_PLUGIN_RESULT`

### 5.5 插件变更广播

通知：`GIOPIC_PLUGINS_UPDATED`

建议收到后立即重新请求 `GIOPIC_GET_INSTALLED_PLUGINS`。

## 6. 三类插件的最小载荷要求

### 6.1 通用字段

所有插件都至少应包含：

- `id`
- `name`
- `version`
- `kind`

兼容说明：

- 历史未声明 `kind` 的旧插件按 `uploader` 兼容
- 市场前后端现在都应显式读写 `kind`

### 6.2 uploader

必填：

- `uploader`
- `uploader.script`
- `uploader.inputs`

补充：

- `uploader.inputs` 支持 `text`、`password`、`checkbox`、`select`、`textarea`、`number`、`switch`、`kv-pairs`
- 支持 `visibleWhen` / `disabledWhen`
- 支持 `dataSource`
- 支持 `uploader.inputs[].dataSource.script`

### 6.3 site-detector

必填：

- `detector`
- `detector.targetDriveType`
- `detector.detectScript`
- `detector.extractScript`

补充：

- 可包含 `detector.match`
- 可包含 `detector.presentation`
- 可包含 `detector.priority`
- 可包含 `detector.actionForm`

### 6.4 editor-adapter

必填：

- `editorAdapter`
- `editorAdapter.editorType`
- `editorAdapter.displayName`
- `editorAdapter.detectScript`
- `editorAdapter.injectScript`

补充：

- `editorAdapter.detectScript` 与 `editorAdapter.injectScript` 是函数源码字符串
- 其执行语义不同于 `uploader` / `site-detector` 的 `return async function(...) {}` 包装脚本
- 市场与后端只负责原样保存、展示与分发，不应在传输链路中改写函数源码

## 7. 可执行字符串透传清单

下列字段都视为“运行时代码”，必须原样透传：

- `plugin.uploader.script`
- `plugin.uploader.inputs[].dataSource.script`
- `plugin.detector.detectScript`
- `plugin.detector.extractScript`
- `plugin.editorAdapter.detectScript`
- `plugin.editorAdapter.injectScript`

禁止行为：

- 禁止先 parse 成函数再 stringify 回去
- 禁止丢失换行、缩进、转义
- 禁止只保留摘要字段后在安装时重建对象

## 8. 市场前端实现要求

### 8.1 列表页

可以展示摘要字段：

- `name`
- `description`
- `icon`
- `author`
- `version`
- `downloads`
- `kind`

但安装时必须直接使用完整 `content`。

### 8.2 详情页 / 审核页 / 后台预览

需要按 `kind` 区分展示：

- `uploader`：`uploader.inputs`、`visibleWhen`、`disabledWhen`、`dataSource`、`uploader.script`
- `site-detector`：`detector.targetDriveType`、`match`、`presentation`、`actionForm`、`detectScript`、`extractScript`
- `editor-adapter`：`editorAdapter.editorType`、`displayName`、`detectScript`、`injectScript`

### 8.3 风险分析建议

后台审核至少应纳入这些脚本：

- `uploader.script`
- `uploader.inputs[].dataSource.script`
- `detector.detectScript`
- `detector.extractScript`
- `editorAdapter.detectScript`
- `editorAdapter.injectScript`

对 `site-detector` 还建议额外标记：

- 是否使用广泛域名匹配
- 是否声明 `actionForm`
- 是否出现 `sendMessage(...)`

### 8.4 提交页 / 在线编辑器

当前市场前端至少应支持：

- `kind` 三选一切换
- `uploader` 脚本编辑
- `site-detector` 脚本编辑
- `editor-adapter` 的 `editorType`、`displayName`、`detectScript`、`injectScript`
- 完整 JSON 编辑与预览

如果暂时不做完整的可视化配置器，至少要保证完整 JSON 编辑器始终可用。

## 9. 安装示例

```javascript
async function installFromMarketplace(pluginId) {
  const listRes = await api.get('/plugins')
  const plugin = listRes.data.find((item) => item.id === pluginId)
  const fullContent = plugin?.versions?.[0]?.content

  if (!fullContent) {
    throw new Error('Missing full plugin content')
  }

  await api.post(`/plugins/${pluginId}/download`).catch(() => undefined)

  window.postMessage(
    {
      type: 'GIOPIC_INSTALL_PLUGIN',
      plugin: fullContent,
    },
    '*',
  )
}
```

## 10. 验收清单

- [ ] 扩展未安装时，市场页能提示不可安装状态
- [ ] 安装载荷来自后端完整 `content`，未做摘要重建
- [ ] `uploader`、`site-detector`、`editor-adapter` 均可通过前端预览与提交流程
- [ ] `GIOPIC_INSTALL_PLUGIN` 可正确下发第三类插件完整 JSON
- [ ] `GIOPIC_PLUGINS_UPDATED` 后本地安装状态可自动同步
- [ ] 详情页 / 审核页 / 风险分析能区分并展示三类插件字段
