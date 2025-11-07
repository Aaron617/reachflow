# Web 前端流式对接说明

本文档面向前端同学，目标是把新的 `/research/stream` SSE 接口接入网页端，让用户像聊天一样实时看到 Deep Research Agent 的推理过程、搜索状态和最终答案。

## 1. 后端接口概览
- **URL**：`POST /research/stream`
- **请求体**（JSON）：与原来的 `/research` 相同，如 `query`、`provider`、`model`、`openai_base_url` 等。
- **响应**：`text/event-stream`。后端会持续推送事件，直到任务结束。
- **事件类型**：
  - `user_message`：收到的用户输入。
  - `log`：通用日志（暂未广泛使用，可预留）。
  - `search_start` / `search_results`：Exa 搜索起止以及每批筛选后的结果。
  - `open_url_start` / `open_url_result`：按 URL 抓取网页内容的状态。
  - `tool_result`：本地工具或代码执行的输出。
  - `assistant_message`：LLM 各阶段的回答（OpenAI/Anthropic/Gemini 都会推送）。
  - `final`：完成后的最终回答（含 `<final>` 区块内容）。
  - `error`：执行异常。
  - `ping`：15 秒心跳，防止连接超时。
  - `done`：Agent 收尾完成。
  - `close`：服务端即将关闭 SSE 流，可视作结束信号。

每条 SSE 的 `data` 字段都是 JSON，结构示例：
```json
{
  "event": "search_results",
  "data": {
    "query": "特朗普近况",
    "results": [
      {"title": "...", "url": "...", "text": "..."}
    ]
  },
  "timestamp": 1731000000.0
}
```

## 2. 前端接入建议
### 2.1 建立连接
1. 用户在页面输入查询后，先把 form 数据存下来（query/provider/model 等）。
2. 通过 `fetch('/research/stream', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })` 发送一个 “kick-off” 请求，让后端创建任务（本接口直接返回 SSE，不需要额外的 task_id）。
3. 为了持续接收事件，使用 `EventSource` 无法直接 POST，所以推荐使用以下方法之一：
   - **方案 A：自定义 fetch + ReadableStream**（现代浏览器支持）：
     ```js
     const response = await fetch('/research/stream', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload)
     });
     const reader = response.body.getReader();
     // 按行解析 SSE
     ```
   - **方案 B：后端增加 GET + querystring 版本**，前端先 POST （返回 task_id），再用 `EventSource('/research/stream?task=xxx')` 订阅。若短期只用 POST，就请采纳方案 A。

以下提供方案 A 的解析模板：
```js
async function startStream(payload) {
  const resp = await fetch('/research/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);

  const decoder = new TextDecoder();
  const reader = resp.body.getReader();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      handleSSEChunk(chunk);
    }
  }
}

function handleSSEChunk(chunk) {
  const lines = chunk.split('\n');
  let eventType = 'message';
  let data = '';
  for (const line of lines) {
    if (line.startsWith('event:')) eventType = line.slice(6).trim();
    if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!data) return;
  const payload = JSON.parse(data);
  dispatchEvent(eventType, payload);
}
```

### 2.2 UI 更新建议
- **会话流展示**：
  - `user_message`：立刻把用户输入追加到聊天面板。
  - `assistant_message`：当作分段回答，可以逐条显示；如果要模拟“typing”，可以把字符串 append 到当前气泡。
  - `search_results` / `open_url_result`：放到“研究日志”侧栏或折叠面板里，显示标题、链接和摘要。
  - `tool_result`：标注执行的工具名以及结果摘要。
  - `final`：高亮显示最终报告，可覆盖之前的草稿或另开一个面板。
  - `error`：弹出 toast 或在 log 区块顶部显示。
- **进度条**：
  - 可根据事件顺序简单估算进度（例如 `user_message`→`search_start`→多次 `search_results`→`assistant_message`→`final`）。
  - 如果 `payload.progress` 不为空，可直接驱动进度条。
- **连接状态**：
  - 收到 `ping` 就更新“连接正常”的标识。
  - 收到 `done`/`close` 时，关闭 reader（或 `controller.abort()`），并允许用户重新发起下一次查询。

## 3. 需要前端完成的事项
1. 在 `app.js` 中封装 `startStream(payload)`，调用上述解析逻辑。
2. 将事件分发到 UI：
   - 维持一个 `messages` 数组，结构 `{ role: 'user' | 'assistant' | 'system', content: string }`，用于主聊天窗口。
   - 维护一个 `timeline` 用来记录搜索/工具等节点。
3. 为 “开始背调” 按钮增加 loading 状态：连接建立后禁用按钮，结束时恢复。
4. 处理取消：用户点击“停止”时，调用 `reader.cancel()` 或 `controller.abort()`，并给后端发送中断信号（目前暂无专门 API，可选用 `AbortController` 直接断开 HTTP）。
5. 根据需要美化 UI（气泡、渐进式输出、滚动定位等）。

## 4. 注意事项
- 仍需遵守 CORS 配置：默认允许 `localhost:3000/5500`。如果前端跑在其他端口，请让后端设置 `CORS_ALLOW_ORIGINS`。
- 因为 SSE 是长连接，请确保页面在卸载或用户切换任务时关闭原有 stream，避免同时开启多个长连接。
- 如果将来要兼容旧浏览器，可考虑引入 polyfill 或切到 WebSocket；但当前 Chrome/Edge/Safari 的 `fetch + ReadableStream` 已经足够。

如需更多事件字段或有其它 UI 需求，随时反馈。EOF
