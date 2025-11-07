# Reachflow Research 子页面规划（AI 背调 for 外贸）

## 1. 项目背景
- 目标：在 Reachflow 前端新增一个独立的 `research` 子页面，对接已部署的 Deep Research Backend，用于验证外贸场景下的 AI 背调流程。
- 交付：静态页面（可通过 `/research.html` 或 SPA 路由 `/research` 访问），含表单提交、状态反馈与结果展示；前端直接调用后端 `/research` POST 接口。

## 2. 用户旅程与交互流程
1. 用户进入 `Research` 页看到功能简介、使用说明与输入表单。
2. 输入查询关键词（必填）以及可选的 API Key/模型配置 → 点击“开始背调”。
3. 前端调用后端接口，显示加载状态；若成功返回，则以富文本/markdown 区域显示结果；失败则展示错误信息和重试按钮。
4. 结果区域支持复制、再次编辑查询（保留上次输入），并可以重新发起请求。

## 3. 页面结构（建议）
- **Hero/简介**：一句话价值主张 + 场景简介 + CTA 按钮滚动到表单。
- **表单区卡片**：
  - `query` 文本域（必填，支持多行。这边主要是输入他们那边收集的基本的客户信息）
  - 可选的 API Key 输入框（仅当用户需要覆盖默认 key）
  - 可选 `model` / `openai_base_url` / `exa_api_key` 字段。这部分折叠到高级设置里面吧。
  - “开始背调”提交按钮 + 次级按钮“重置”
- **结果展示区**：
  - Loading skeleton / spinner
  - 成功：（可使用简单 renderer）或保留 `<pre>` 文本。模型一般会输出一个markdown，我们把这个渲染即可。
  - 失败：错误提示、HTTP 状态与后端 message
- **FAQ/说明**：写明数据来源、限制、隐私提示

## 4. 技术方案
- 架构：保持现有静态站（`index.html` + `app.js`）。新增 `research.html`（或 `pages/research/index.html`）+ 对应样式与脚本。
- JS 模块：在 `app.js` 中新增 `initResearchPage()`，仅在 `body[data-page="research"]` 或通过 URL 判断时运行。
- 接口：
  - `POST {BACKEND_BASE_URL}/research`
  - 请求体：与 FastAPI `ResearchRequest` 模型一致
  - Response：`{ provider, model, result }`
- 环境变量：前端需在构建/部署时写入 `BACKEND_BASE_URL`（可透过 `<script>` 注入 `window.__RESEARCH_CONFIG__`）。
- 错误处理：区分 4xx（缺少 key 等配置）与 5xx（Agent 错误）。
- 国际化：页面 copy 默认中文，必要处添加英文 tooltip 方便外籍同事。

## 5. 数据流与状态管理
1. 用户输入被序列化为 payload。
2. 表单提交→禁用按钮 + 显示 loading。
3. `fetch` 调用（`Content-Type: application/json`）。
4. 根据响应更新 UI；将结果缓存到 `sessionStorage` 便于刷新后恢复（可选）。
5. 所有请求事件触发埋点 `trackEvent('research_submit', {...})` 等。

## 6. 开发步骤拆解
1. **准备**：确认后端基地址与 CORS 设置；在 `.env` 或部署配置中提供 `RESEARCH_API_BASE_URL`。
2. **页面骨架**：复制 `index.html` 的 header/footer，创建 `research.html`，设置 `<body data-page="research">`。
3. **样式**：在 `styles.css` 加入 `research` 命名空间下的布局（例如 `.research-hero`, `.research-card`）。
4. **脚本**：
   - 在 `app.js` 尾部新增初始化函数；绑定表单 submit、渲染状态、结果 markdown。
   - 复用现有 `trackEvent`；添加新的事件名称。
5. **配置注入**：在 `research.html` 中注入 `<script>window.__RESEARCH_CONFIG__ = { apiBaseUrl: 'https://...' };</script>`，或读取公共 `config.js`。
6. **结果渲染/错误提示**：实现 `renderResult(text)`、`renderError(message)`；支持 collapse、复制按钮。
7. **测试**：
   - 手动：输入示例查询，验证成功 / 缺少 key / API error。
   - 网络失败模拟：关闭网络或设错 URL，检查降级体验。
8. **上线**：
   - 将 `research.html` 纳入部署流程。
   - 在导航或页脚加入入口链接（可受控 AB 测试）。

## 7. 验收标准
- 表单验证（空查询禁止提交；输入合法性提示）。
- 交互状态清晰（提交中、成功、失败）。
- 结果可复制、支持长文本滚动。
- 接口错误信息可追踪（在控制台打印完整响应）。
- 页面通过移动端基本适配。

## 8. 后续考虑
- 支持多查询历史记录与导出。
- 增加“引用来源”分栏，若后端返回结构化数据可分块展示。
- 权限控制：后续接入登录或限流统计。
- 数据安全：前端不长久存储用户 Key；使用 session-scoped storage，离开页面即清理。
