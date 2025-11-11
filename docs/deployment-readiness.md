# Research 部署与多用户自查

> 适用：将 `research.html` + `app.js` 前端上传到服务器，面向内测用户提供 Research 服务前的自查指引。

## 结论速览
- **可上线**：前端是纯静态页面，所有状态都保存在浏览器内存 / `sessionStorage`，天然支持多用户并发访问，只要后端 `/research` 支持并发 SSE 即可。
- **需配套**：仍需确认后端接入（API Base URL、鉴权、速率限制、日志脱敏）和运维（TLS、缓存、监控）。本文提供上线前 Checklist。

## 代码现状
- `research.html`：通过 `<body data-api-base-url> + window.__RESEARCH_CONFIG__` 决定后端地址；静态资源可直接托管在任意 CDN / object storage。
- `app.js`：
  - `initResearchPage()`（约 430 行）封装全部交互；`startStream()` 使用 `fetch(${apiBaseUrl}/research)` 建立 SSE 任务。
  - `sessionStorage` 键 `reachflow_research_chat_history` 只在同一 Tab 生效，多用户互不干扰。
  - `user_message` 事件不会写入“研究日志”，避免在 UI 暴露 Prompt；“任务创建”也固定展示 “已提交任务”。
  - “停止”按钮通过 `AbortController` 关闭单个 Tab 的流式连接，不会影响其它用户。
- 样式层（`styles.css`）仅控制外观，与并发无关。

## 多用户部署要点
1. **API Base URL**：为不同环境（内网、灰度、生产）设置对应的 `data-api-base-url` 或在部署时动态注入 `window.__RESEARCH_CONFIG__.apiBaseUrl`。
2. **SSE 并发**：确认 `/research` 支持大量并发连接（每个用户一条），并设置适当的 `keep-alive` 与超时时间。
3. **鉴权 & 限流**：前端目前未做登录；建议在上线版本前：
   - 通过反向代理限制访问源 IP（白名单）或在页面添加 Token 输入。
   - 后端按 IP / 用户标识做 QPS 限流，避免被滥用。
4. **敏感信息**：
   - Timeline 已屏蔽用户输入，但网络面板仍能看到请求体；如果 Prompt 需加密，需在后端做脱敏或在前端增加自定义加密。
   - 浏览器可选填 Provider API Key，这会跟随请求发送到你的后端，务必在后端安全存储或直接忽略，改用服务器托管的密钥。
5. **缓存策略**：HTML 建议 `no-cache`，CSS/JS 可长缓存（带 Hash）；便于热更新。
6. **监控日志**：在反向代理层记录请求量、错误率；后端日志写入时要过滤 `payload.query` 等字段。

## 上线 Checklist
- [ ] 配置后端地址（`data-api-base-url` 或运行时注入）。
- [ ] 反向代理开启 HTTPS，设置 `Content-Security-Policy` 与 `Strict-Transport-Security`。
- [ ] 校验 `/research` CORS 允许页面域名，且响应头包含 `Content-Type: text/event-stream`、`Cache-Control: no-cache`。
- [ ] 针对 `user_message` / Prompt 做日志脱敏；在 APM 中仅记录任务 ID。
- [ ] 压测：至少模拟 50 个并发用户发起查询，确认后端 CPU / 内存 / SSE 句柄占用可控。
- [ ] 观察超时、错误码，并验证前端 Toast / timeline 状态是否符合预期。
- [ ] 预留回滚方案：例如前端静态资源版本化（`/v2025-11-11/`）。

## 多用户验收步骤
1. 在两个不同浏览器或隐身窗口同时访问内测域名，发送不同查询；确保互不影响、日志不串行。
2. 用户 A 点击“停止”，确认只关闭自己的任务，用户 B 正常继续。
3. 切换网络（4G/弱网）测试断线重连：应出现“连接中断”提示并恢复待机。
4. 清空聊天记录按钮只影响本会话，刷新后恢复初始状态。

## 后续建议
- **鉴权**：集成公司统一登录 / 短链 Token，杜绝未授权访问。
- **配额管理**：在后端按团队或项目维度分配调用额度，并在前端显示剩余额度。
- **观测**：为 `research_submit`、`research_error` 事件接入埋点平台，用于监控真实流量。
- **国际化**：若需海外内测，可在 `app.js` 抽离文案，使用字典驱动。

---
如发现新的合规或性能要求，可在本文件追加条目，保持部署自查与代码迭代同步。
