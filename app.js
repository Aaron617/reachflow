const dataLayer = window.dataLayer || [];

const trackEvent = (name, payload = {}) => {
  dataLayer.push({ event: name, ...payload });
  console.debug(`[track] ${name}`, payload);
};

const select = (selector, scope = document) => scope.querySelector(selector);
const selectAll = (selector, scope = document) =>
  Array.from(scope.querySelectorAll(selector));

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
};

document.addEventListener("DOMContentLoaded", init);
