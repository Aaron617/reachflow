const dataLayer = window.dataLayer || [];

const trackEvent = (name, payload = {}) => {
  dataLayer.push({ event: name, ...payload });
  console.debug(`[track] ${name}`, payload);
};

const select = (selector, scope = document) => scope.querySelector(selector);
const selectAll = (selector, scope = document) =>
  Array.from(scope.querySelectorAll(selector));

const toggleHidden = (element, shouldHide = true) => {
  if (!element) return;
  element.classList.toggle("hidden", shouldHide);
};

const applyABVariants = () => {
  const params = new URLSearchParams(window.location.search);
  if (![...params.keys()].some((key) => key.startsWith("ab_"))) return;

  const changes = {};

  const heroTitle = select(".hero-content h1");
  const h1Variant = params.get("ab_h1");
  if (heroTitle && h1Variant === "B") {
    heroTitle.textContent = "联脉｜首批可联对象，T+24 必达";
    changes.ab_h1 = "B";
  }

  const secondaryVariant = params.get("ab_secondary");
  if (secondaryVariant) {
    const buttons = selectAll("[data-secondary-cta]");
    if (secondaryVariant === "whitepaper") {
      buttons.forEach((btn) => {
        btn.textContent = "下载白皮书";
        btn.dataset.track = "whitepaper_download";
      });
      changes.ab_secondary = "whitepaper";
    } else if (secondaryVariant === "demo") {
      buttons.forEach((btn) => {
        btn.textContent = "预约 Demo";
        btn.dataset.track = "demo_request";
      });
      changes.ab_secondary = "demo";
    }
  }

  const formVariant = params.get("ab_form_fields");
  const extraField = select("[data-variant-field='extended']");
  if (extraField) {
    const extraInput = extraField.querySelector("input");
    if (formVariant === "5" || formVariant === "extended") {
      extraField.classList.remove("hidden");
      extraInput?.removeAttribute("required");
      changes.ab_form_fields = formVariant;
    } else {
      extraField.classList.add("hidden");
      extraInput?.removeAttribute("required");
    }
  }

  const trustVariant = params.get("ab_trust");
  const trustLogos = select(".hero-trust-logos");
  const trustMetrics = select(".hero-trust-metrics");
  if (trustLogos && trustMetrics) {
    if (trustVariant === "metrics") {
      trustLogos.classList.add("hidden");
      trustMetrics.classList.remove("hidden");
      trustLogos.setAttribute("aria-hidden", "true");
      trustMetrics.setAttribute("aria-hidden", "false");
      changes.ab_trust = "metrics";
    } else if (trustVariant === "logos") {
      trustLogos.classList.remove("hidden");
      trustMetrics.classList.add("hidden");
      trustLogos.setAttribute("aria-hidden", "false");
      trustMetrics.setAttribute("aria-hidden", "true");
      changes.ab_trust = "logos";
    }
  }

  const pricingVariant = params.get("ab_pricing");
  if (pricingVariant) {
    selectAll("#pricing .price").forEach((priceEl) => {
      if (!priceEl.dataset.originalPrice) {
        priceEl.dataset.originalPrice = priceEl.textContent.trim();
      }
      if (pricingVariant === "hidden") {
        priceEl.textContent = "联系我们获取报价";
      } else if (priceEl.dataset.originalPrice) {
        priceEl.textContent = priceEl.dataset.originalPrice;
      }
    });
    changes.ab_pricing = pricingVariant;
  }

  if (Object.keys(changes).length > 0) {
    trackEvent("ab_variant_applied", changes);
  }
};

const mobileNav = () => {
  const toggle = select(".nav-toggle");
  const nav = select(".site-nav");
  if (!toggle || !nav) return;

  const overlay = document.createElement("div");
  overlay.className = "mobile-nav-overlay";
  document.body.appendChild(overlay);

  const closeNav = () => {
    nav.classList.remove("open");
    overlay.classList.remove("show");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  };

  const openNav = () => {
    nav.classList.add("open");
    overlay.classList.add("show");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
  };

  toggle.addEventListener("click", () => {
    if (nav.classList.contains("open")) {
      closeNav();
    } else {
      openNav();
    }
  });

  overlay.addEventListener("click", closeNav);

  selectAll(".site-nav a").forEach((link) =>
    link.addEventListener("click", closeNav)
  );
};

const scenarioTabs = () => {
  const tabs = selectAll(".scenario-tab");
  const panels = selectAll(".scenario-panel");
  if (!tabs.length) return;

  const activate = (scenario) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.scenario === scenario;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active.toString());
    });
    panels.forEach((panel) => {
      const active = panel.dataset.panel === scenario;
      panel.classList.toggle("active", active);
      panel.setAttribute("aria-hidden", (!active).toString());
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const scenario = tab.dataset.scenario;
      activate(scenario);
      trackEvent("scenario_tab_click", { scenario });
    });
  });

  activate(tabs[0].dataset.scenario);
};

const modalController = () => {
  const modal = select("#template-modal");
  if (!modal) return;

  const openButtons = selectAll("[data-modal-open='template-modal']");
  const closeElements = selectAll("[data-modal-close]", modal);

  const open = () => {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    trackEvent("template_modal_view");
  };

  const close = () => {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  openButtons.forEach((btn) => btn.addEventListener("click", open));
  closeElements.forEach((el) => el.addEventListener("click", close));
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
};

const modalTabs = () => {
  const tabs = selectAll(".modal-tab");
  const panels = selectAll(".template-panel");
  if (!tabs.length) return;

  const activate = (key) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.template === key;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active.toString());
    });
    panels.forEach((panel) => {
      const active = panel.dataset.templatePanel === key;
      panel.classList.toggle("active", active);
    });
  };

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => activate(tab.dataset.template))
  );

  activate(tabs[0].dataset.template);
};

const drawerController = () => {
  const drawer = select("#compliance-drawer");
  if (!drawer) return;

  const openButtons = selectAll("[data-drawer-open='compliance-drawer']");
  const closeElements = selectAll("[data-drawer-close]", drawer);

  const open = () => {
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    trackEvent("compliance_view");
  };

  const close = () => {
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  openButtons.forEach((btn) => btn.addEventListener("click", open));
  closeElements.forEach((el) => el.addEventListener("click", close));
  drawer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
};

const toast = (message) => {
  const el = select("#form-toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => {
    el.classList.remove("show");
  }, 4000);
};

const validateContact = (value) => {
  const emailPattern =
    /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  const phonePattern = /^[+\d][\d\s-]{6,}$/;
  const isEmail = emailPattern.test(value);
  const isPhone = phonePattern.test(value);
  const isWeChat = /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/.test(value);
  return isEmail || isPhone || isWeChat;
};

const heroForm = () => {
  const form = select("#hero-form");
  if (!form) return;

  const contactError = select("[data-error-for='contact']", form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!validateContact(data.contact.trim())) {
      contactError.textContent = "请输入有效的邮箱、电话或微信号。";
      trackEvent("form_submit_fail", { reason: "invalid_contact" });
      return;
    }

    contactError.textContent = "";
    trackEvent("form_submit_success", data);
    form.reset();
    toast("提交成功！我们将在 24 小时内联系你。");
  });

  select("#contact-info", form)?.addEventListener("blur", (event) => {
    const value = event.target.value.trim();
    if (value && !validateContact(value)) {
      contactError.textContent = "请输入有效的邮箱、电话或微信号。";
    } else {
      contactError.textContent = "";
    }
  });

  selectAll("input, select", form).forEach((field) =>
    field.addEventListener("focus", () => {
      trackEvent("form_start", { field: field.name });
    })
  );
};

const attachTrackers = () => {
  selectAll("[data-track]").forEach((element) => {
    element.addEventListener("click", () => {
      const eventName = element.dataset.track;
      const payload = element.dataset.payload ? JSON.parse(element.dataset.payload) : {};
      trackEvent(eventName, payload);
    });
  });
};

const faqTracker = () => {
  selectAll("#faq details").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) {
        const summary = select("summary", item);
        trackEvent("faq_expand", { question: summary?.textContent?.trim() });
      }
    });
  });
};

const smoothScrollTriggers = () => {
  selectAll("[data-scroll-target]").forEach((trigger) => {
    const targetSelector = trigger.dataset.scrollTarget;
    if (!targetSelector) return;

    trigger.addEventListener("click", (event) => {
      const target = select(targetSelector);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
};

const escapeHTML = (text = "") =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const inlineMarkdown = (text = "") =>
  text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((https?:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

const markdownToHTML = (markdown = "") => {
  const escaped = escapeHTML(markdown);
  const lines = escaped.split(/\r?\n/);
  let html = "";
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html += "</ul>";
      inUl = false;
    }
    if (inOl) {
      html += "</ol>";
      inOl = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      closeLists();
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      closeLists();
      const level = headingMatch[1].length;
      html += `<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`;
      return;
    }

    const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      if (!inUl) {
        closeLists();
        html += "<ul>";
        inUl = true;
      }
      html += `<li>${inlineMarkdown(ulMatch[1])}</li>`;
      return;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!inOl) {
        closeLists();
        html += "<ol>";
        inOl = true;
      }
      html += `<li>${inlineMarkdown(olMatch[1])}</li>`;
      return;
    }

    if (/^>\s+/.test(trimmed)) {
      closeLists();
      html += `<blockquote>${inlineMarkdown(trimmed.replace(/^>\s+/, ""))}</blockquote>`;
      return;
    }

    closeLists();
    html += `<p>${inlineMarkdown(trimmed)}</p>`;
  });

  closeLists();
  return html || `<p>${escapeHTML(markdown)}</p>`;
};

const setFooterYear = () => {
  const yearEl = select("#footer-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
};

const initResearchPage = () => {
  if (document.body.dataset.page !== "research") return;

  const STORAGE_KEY = "reachflow_research_chat_history";
  const getApiBaseUrl = () => {
    const fromConfig = window.__RESEARCH_CONFIG__?.apiBaseUrl || document.body.dataset.apiBaseUrl || "";
    return fromConfig.replace(/\/$/, "");
  };

  const form = select("#research-form");
  if (!form) return;

  const messagesEl = select("#chat-messages");
  const timelineList = select("#timeline-list");
  const streamStatusEl = select("#stream-status");
  const queryInput = select("#research-query", form);
  const providerSelect = select("#research-provider", form);
  const apiKeyInput = select("#research-api-key", form);
  const modelInput = select("#research-model", form);
  const baseUrlInput = select("#research-base-url", form);
  const exaKeyInput = select("#research-exa-key", form);
  const advancedToggle = select(".chat-advanced-toggle");
  const advancedPanel = select("#research-advanced");
  const clearChatBtn = select("[data-clear-chat]");
  const stopStreamBtn = select("[data-stop-stream]");
  const sendBtn = select("button[type='submit']", form);

  let chatHistory = [];
  let assistantStream = { element: null, content: "", meta: "联脉 Agent" };
  let streamAbortController = null;
  let streamActive = false;

  const scrollMessagesToBottom = () => {
    if (!messagesEl) return;
    messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: "smooth" });
  };

  const createMessageElement = (role, content, meta) => {
    const wrapper = document.createElement("div");
    wrapper.className = `chat-message ${role}`;
    const metaEl = document.createElement("div");
    metaEl.className = "chat-meta";
    metaEl.textContent = meta || (role === "user" ? "你" : "联脉 Agent");
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    if (role === "bot") {
      bubble.classList.add("markdown");
      bubble.innerHTML = markdownToHTML(content);
    } else {
      bubble.innerHTML = `<p>${escapeHTML(content)}</p>`;
    }

    if (role === "error") {
      wrapper.classList.add("error");
    }

    wrapper.append(metaEl, bubble);
    return wrapper;
  };

  const persistHistory = () => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages: chatHistory, provider: providerSelect?.value || "openai" })
      );
    } catch (error) {
      console.warn("Failed to persist research chat history", error);
    }
  };

  const appendMessage = (message, { save = true } = {}) => {
    if (!messagesEl) return null;
    const element = createMessageElement(message.role, message.content, message.meta);
    messagesEl.appendChild(element);
    if (save) {
      chatHistory.push({ role: message.role, content: message.content, meta: message.meta });
      persistHistory();
    }
    scrollMessagesToBottom();
    return element;
  };

  const updateAssistantStream = (chunk = "", metaLabel) => {
    if (!chunk) return;
    if (!assistantStream.element) {
      assistantStream = {
        element: createMessageElement("bot", "", metaLabel || "联脉 Agent"),
        content: "",
        meta: metaLabel || "联脉 Agent",
      };
      assistantStream.element.dataset.streaming = "true";
      messagesEl?.appendChild(assistantStream.element);
      chatHistory.push({ role: "bot", content: "", meta: assistantStream.meta, streaming: true });
    }
    assistantStream.content += chunk;
    const bubble = select(".chat-bubble", assistantStream.element);
    if (bubble) {
      bubble.classList.add("markdown");
      bubble.innerHTML = markdownToHTML(assistantStream.content);
    }
    const last = chatHistory[chatHistory.length - 1];
    if (last?.streaming) {
      last.content = assistantStream.content;
      persistHistory();
    }
    scrollMessagesToBottom();
  };

  const finalizeAssistantStream = (finalText = "", metaLabel) => {
    if (!assistantStream.element && finalText) {
      appendMessage({ role: "bot", content: finalText, meta: metaLabel || "联脉 Agent" });
      return;
    }
    if (!assistantStream.element) return;
    const text = finalText || assistantStream.content;
    if (text) {
      const bubble = select(".chat-bubble", assistantStream.element);
      if (bubble) bubble.innerHTML = markdownToHTML(text);
    }
    const last = chatHistory[chatHistory.length - 1];
    if (last?.streaming) {
      last.content = text;
      delete last.streaming;
      persistHistory();
    }
    assistantStream.element.dataset.streaming = "false";
    assistantStream = { element: null, content: "", meta: metaLabel || "联脉 Agent" };
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return new Date().toLocaleTimeString("zh-CN", { hour12: false });
    const ms = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
    return new Date(ms).toLocaleTimeString("zh-CN", { hour12: false });
  };

  const resetTimeline = () => {
    if (!timelineList) return;
    timelineList.innerHTML = '<li class="timeline-empty">暂无事件</li>';
  };

  const addTimelineEntry = (type, description, { html, timestamp } = {}) => {
    if (!timelineList) return;
    const emptyState = select(".timeline-empty", timelineList);
    emptyState?.remove();
    const item = document.createElement("li");
    item.className = "timeline-entry";
    item.innerHTML = `
      <div class="timeline-type">${escapeHTML(type)}</div>
      <div class="timeline-time">${formatTimestamp(timestamp)}</div>
      <p class="timeline-body">${html ?? escapeHTML(description || "-")}</p>
    `;
    timelineList.appendChild(item);
    timelineList.scrollTo({ top: timelineList.scrollHeight, behavior: "smooth" });
  };

  const setStreamStatus = (state, label) => {
    if (!streamStatusEl) return;
    streamStatusEl.dataset.status = state;
    streamStatusEl.textContent = label;
  };

  const setStreamingState = (active) => {
    streamActive = active;
    sendBtn && (sendBtn.disabled = active);
    stopStreamBtn && (stopStreamBtn.disabled = !active);
  };

  const buildPayload = (query) => {
    const provider = (providerSelect?.value || "openai").toLowerCase();
    const payload = { query, provider };
    const model = modelInput?.value.trim();
    if (model) payload.model = model;
    const baseUrl = baseUrlInput?.value.trim();
    if (baseUrl) payload.openai_base_url = baseUrl;
    const exaKey = exaKeyInput?.value.trim();
    if (exaKey) payload.exa_api_key = exaKey;
    const providerKey = apiKeyInput?.value.trim();
    if (providerKey) {
      if (provider === "openai") payload.openai_api_key = providerKey;
      if (provider === "anthropic") payload.anthropic_api_key = providerKey;
      if (provider === "gemini") payload.gemini_api_key = providerKey;
    }
    return payload;
  };

  const extractText = (data) => {
    if (!data) return "";
    if (typeof data === "string") return data;
    if (typeof data.text === "string") return data.text;
    if (typeof data.content === "string") return data.content;
    if (Array.isArray(data.content)) {
      return data.content
        .map((part) => (typeof part === "string" ? part : part.text || part.content || ""))
        .join("");
    }
    if (typeof data.result === "string") return data.result;
    return "";
  };

  const formatResultsHTML = (results = []) => {
    if (!Array.isArray(results) || !results.length) return escapeHTML("未返回结果");
    const top = results.slice(0, 3);
    const items = top
      .map((item) => {
        const title = escapeHTML(item.title || "结果");
        const url = escapeHTML(item.url || "");
        const snippet = escapeHTML(item.text || item.snippet || "");
        return `<p><strong>${title}</strong><br /><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a><br />${snippet}</p>`;
      })
      .join("");
    return items;
  };

  const normalizeEventType = (value) => {
    if (!value) return "";
    return value.toString().trim().toLowerCase();
  };

  const isSensitiveUserEvent = (rawLabel) => {
    const normalized = normalizeEventType(rawLabel);
    if (!normalized && typeof rawLabel === "string") {
      return rawLabel.trim() === "用户输入";
    }
    return ["user_message", "user_input", "userquery", "user"]
      .some((key) => normalized === key);
  };

  const handleStreamEvent = (rawType, payload) => {
    const type = payload?.event || rawType || "message";
    if (isSensitiveUserEvent(type)) return;
    const normalizedType = normalizeEventType(type) || "message";
    const data = payload?.data ?? payload;
    const timestamp = payload?.timestamp ?? data?.timestamp;

    switch (normalizedType) {
      case "search_start":
        addTimelineEntry("搜索开始", data?.query || "Exa 搜索", { timestamp });
        break;
      case "search_results":
        addTimelineEntry(
          "搜索结果",
          `${(data?.results?.length ?? 0).toString()} 条候选`,
          { timestamp, html: formatResultsHTML(data?.results) }
        );
        break;
      case "open_url_start":
        addTimelineEntry("抓取网页", data?.url || "获取网页内容", { timestamp });
        break;
      case "open_url_result":
        addTimelineEntry("抓取完成", data?.title || data?.url || "网页已解析", { timestamp });
        break;
      case "tool_result":
        addTimelineEntry(data?.tool || "工具输出", data?.output || data?.message || "完成", { timestamp });
        break;
      case "assistant_message":
        updateAssistantStream(extractText(data), data?.meta || data?.model || data?.provider);
        break;
      case "log":
        addTimelineEntry(data?.title || "日志", extractText(data) || data?.message || "-", { timestamp });
        break;
      case "final":
        finalizeAssistantStream(extractText(data) || data?.result, data?.meta);
        addTimelineEntry("最终答案", "报告已生成", { timestamp });
        setStreamStatus("active", "整理中");
        break;
      case "error":
        finalizeAssistantStream();
        setStreamStatus("error", "异常");
        appendMessage({ role: "error", content: data?.message || data?.detail || "未知错误", meta: "错误" });
        addTimelineEntry("错误", data?.message || data?.detail || "未知错误", { timestamp });
        break;
      case "ping":
        setStreamStatus("active", "连接正常");
        break;
      case "done":
      case "close":
        finalizeAssistantStream();
        setStreamStatus("idle", "已完成");
        break;
      default:
        if (normalizedType !== "assistant_message") {
          addTimelineEntry(type.replace(/_/g, " "), extractText(data) || JSON.stringify(data), { timestamp });
        }
    }
  };

  const handleSSEChunk = (chunk) => {
    const lines = chunk.split("\n");
    let eventType = "message";
    let dataBuffer = "";
    for (const line of lines) {
      if (line.startsWith("event:")) eventType = line.slice(6).trim();
      if (line.startsWith("data:")) dataBuffer += line.slice(5).trim();
    }
    if (!dataBuffer) return;
    try {
      const payload = JSON.parse(dataBuffer);
      handleStreamEvent(eventType, payload);
    } catch (error) {
      console.warn("Failed to parse SSE chunk", chunk, error);
    }
  };

  const closeActiveStream = (reasonLabel) => {
    if (!streamAbortController) return;
    streamAbortController.abort();
    streamAbortController = null;
    addTimelineEntry("连接中断", reasonLabel || "已停止流式输出");
    setStreamStatus("idle", "已停止");
    setStreamingState(false);
  };

  const startStream = async (payload) => {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      appendMessage({ role: "error", content: "未配置后端地址，请联系管理员", meta: "系统" });
      return;
    }

    if (!window.ReadableStream) {
      appendMessage({ role: "error", content: "当前浏览器不支持流式输出", meta: "提示" });
      return;
    }

    streamAbortController = new AbortController();
    setStreamingState(true);
    setStreamStatus("active", "进行中");
    resetTimeline();
    addTimelineEntry("任务创建", "已提交任务");

    try {
      const response = await fetch(`${apiBaseUrl}/research/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
        signal: streamAbortController.signal,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `请求失败（${response.status}）`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        try {
          const fallbackData = await response.json();
          handleStreamEvent("final", fallbackData);
          handleStreamEvent("done");
        } catch (parseError) {
          throw new Error("服务未返回流式数据");
        }
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("浏览器不支持流式读取");

      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          if (chunk.trim()) handleSSEChunk(chunk.trim());
        }
      }
      if (buffer.trim()) handleSSEChunk(buffer.trim());
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("research_stream_failed", error);
        appendMessage({ role: "error", content: error.message, meta: "错误" });
        addTimelineEntry("错误", error.message);
        setStreamStatus("error", "异常");
        trackEvent("research_error", { provider: payload.provider, reason: error.message });
      }
    } finally {
      finalizeAssistantStream();
      streamAbortController = null;
      setStreamingState(false);
      if (streamStatusEl?.dataset.status !== "error") {
        setStreamStatus("idle", "待机");
      }
    }
  };

  const restoreHistory = () => {
    try {
      const cachedRaw = sessionStorage.getItem(STORAGE_KEY);
      if (!cachedRaw) return;
      const cached = JSON.parse(cachedRaw);
      chatHistory = Array.isArray(cached?.messages) ? cached.messages : [];
      if (cached?.provider && providerSelect) {
        providerSelect.value = cached.provider;
      }
      chatHistory.forEach((message) => appendMessage(message, { save: false }));
      if (chatHistory.length) {
        toast("已载入历史对话");
      }
    } catch (error) {
      console.warn("Failed to restore research chat history", error);
      chatHistory = [];
    }
  };

  const clearChat = () => {
    chatHistory = [];
    persistHistory();
    if (messagesEl) {
      selectAll(".chat-message", messagesEl).forEach((messageEl) => {
        if (messageEl.dataset.static === "true") return;
        messageEl.remove();
      });
    }
    resetTimeline();
    assistantStream = { element: null, content: "", meta: "联脉 Agent" };
  };

  const submitResearch = (event) => {
    event.preventDefault();
    if (streamActive) {
      toast("请先等待当前任务完成");
      return;
    }
    const query = queryInput?.value.trim();
    if (!query) {
      toast("请先填写查询内容");
      return;
    }

    appendMessage({ role: "user", content: query, meta: "你" });
    queryInput.value = "";

    let payload;
    try {
      payload = buildPayload(query);
    } catch (error) {
      appendMessage({ role: "error", content: error.message, meta: "提示" });
      return;
    }

    trackEvent("research_submit", { provider: payload.provider });
    startStream(payload);
  };

  advancedToggle?.addEventListener("click", () => {
    const expanded = advancedToggle.getAttribute("aria-expanded") === "true";
    advancedToggle.setAttribute("aria-expanded", (!expanded).toString());
    advancedPanel?.classList.toggle("hidden", expanded);
  });

  clearChatBtn?.addEventListener("click", () => {
    if (streamActive) closeActiveStream("已终止并清空");
    clearChat();
    toast("聊天记录已清空");
  });

  stopStreamBtn?.addEventListener("click", () => closeActiveStream("手动停止"));

  form.addEventListener("submit", submitResearch);

  const syncProviderLabel = () => {
    const label = select("label[for='research-api-key']", form);
    if (!label || !providerSelect) return;
    const selectedOption = providerSelect.options[providerSelect.selectedIndex];
    const providerName = selectedOption?.textContent?.trim();
    label.textContent = `${providerName || "Provider"} API Key（可选）`;
  };

  providerSelect?.addEventListener("change", syncProviderLabel);
  syncProviderLabel();
  resetTimeline();
  restoreHistory();
  setStreamStatus("idle", "待机");
};

const init = () => {
  applyABVariants();
  mobileNav();
  scenarioTabs();
  modalController();
  modalTabs();
  drawerController();
  heroForm();
  attachTrackers();
  faqTracker();
  smoothScrollTriggers();
  setFooterYear();
  initResearchPage();
};

document.addEventListener("DOMContentLoaded", init);
