# 联脉（ReachFlow）Landing Page

联脉（ReachFlow）着陆页是一份静态前端交付件，覆盖品牌价值传达、线索收集、合规信任构建、A/B 推广准备和埋点事件。该仓库包含完整的 HTML、CSS、JavaScript 与占位资产，可直接部署至任意静态站点服务。

---

## 功能概览

- **完整信息架构**：首屏 Hero、痛点对比、三步工作流、场景、关键能力、指标、客户证言、价格方案、FAQ、底部 CTA 与合规页脚。
- **交互组件**：移动端菜单、场景切换、样例外联文案 Modal、合规抽屉、表单校验与提示 Toast、FAQ 埋点。
- **A/B 变量**：通过 URL 参数切换 H1、次级 CTA、表单字段数量、信任呈现、价格可见性等。
- **埋点事件**：CTA 点击、表单流程、场景切换、定价选择、FAQ 展开、合规抽屉查看等，统一写入 `dataLayer`。
- **资产占位**：favicon、OG 图、二维码/Logo/图标预留，方便设计 & 品牌素材后续替换。

---

## 目录结构

```
.
├── index.html        # 页面结构与文案
├── styles.css        # 品牌主题、响应式布局、组件样式
├── app.js            # 交互逻辑、埋点与 A/B 控制
└── assets
    ├── favicon.svg
    └── og-image.svg  # OG 占位图，可替换为正式设计稿
```

---

## 本地开发与预览

项目无需构建步骤，任意静态服务器即可运行：

```bash
# macOS or Linux
python3 -m http.server 3000

# 或使用 Node 工具
npx serve .
```

访问 `http://localhost:3000` 预览。若直接打开文件（`file://`），部分模块交互仍可运行，但推荐使用本地服务器以模拟生产环境。

---

## 表单与埋点对接

`app.js` 中表单提交逻辑目前仅执行前端校验，并发送成功 Toast。接入真实后端时：

1. 在 `heroForm()` 中补充 `fetch` / `XMLHttpRequest` 调用，提交到你的 API / Webhook（如 CRM、飞书、企业微信机器人等）。
2. 成功回调后触发 `trackEvent("form_submit_success", data)`；失败时调用 `trackEvent("form_submit_fail", { reason })` 并展示错误提示。
3. 根据合规策略，记录/脱敏用户输入，确保符合隐私要求。

`trackEvent(name, payload)` 默认将事件推入 `window.dataLayer`。若使用其他埋点方案，可在此函数中转写入对应 SDK。

---

## A/B 变量说明

通过 URL 参数控制 VARIANT：

| 参数               | 取值示例                 | 作用说明                                           |
|--------------------|--------------------------|----------------------------------------------------|
| `ab_h1`            | `B`                      | 切换首屏标题为“首批可联对象，T+24 必达”             |
| `ab_secondary`     | `demo` / `whitepaper`    | 切换次级 CTA 文案与埋点事件                         |
| `ab_form_fields`   | `extended` / `5`         | 展示“预估月外联量”额外字段（仅延伸，不设必填）     |
| `ab_trust`         | `logos` / `metrics`      | 切换首屏信任呈现：Logo 墙或指标徽章                 |
| `ab_pricing`       | `hidden`                 | 隐藏价格（显示“联系我们获取报价”）                 |

示例 URL：

```
https://example.com/?ab_h1=B&ab_secondary=whitepaper&ab_trust=metrics
```

若无需 A/B，自然访问即可使用默认配置。

---

## 品牌与设计交付

- **字体**：默认引用系统字体 & 思源黑体/阿里巴巴普惠体栈。如需线上加载 Web Font，请在 `styles.css` 中补充 `@font-face` 并设置 `font-display: swap`。
- **颜色**：主色 #2F6FED、辅色 #1BBF72、警示 #F59E0B、错误 #EF4444，详见 `:root` 变量定义。
- **响应式**：断点覆盖 ≥1200、1024、768、640 级别。移动端按钮与输入控件高度 ≥44px，符合可访问性指引。
- **资产替换**：将 `logo-placeholder`、`qr-placeholder` 等占位元素替换为真实图片即可；OG/Favicon 可用设计团队输出版。

---

## 部署建议

1. 构建产物即仓库根目录，可上传至 Vercel / Netlify / Cloudflare Pages / 阿里云 OSS 等。
2. 若需接入分析脚本（GA、百度统计等），在 `index.html` `<head>` 或 `</body>` 前追加即可，建议异步加载。
3. 确保服务器配置 `Cache-Control`，CSS/JS 可长缓存，HTML 设置短缓存或 no-cache 以便 A/B 实验快速生效。

---

## 后续迭代路线（参考）

- **M1**（上线 +3 天）：表单提交 → 邮件或企微 Webhook 打通；Hero/Workflow/CTA 先行上线。
- **M2**（+7 天）：价格、FAQ、合规抽屉、埋点全量接入；首轮 A/B 实验。
- **M3**（+14 天）：真实客户素材替换 Logo/证言；完善 SEO/OG；进行性能优化（LCP ≤ 2.5s）。

交付负责人与设计、开发、运营可依据以上节点协作推进。
