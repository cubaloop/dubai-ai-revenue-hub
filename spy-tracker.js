(function () {
  "use strict";
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "david") {
      localStorage.setItem("tecno_spy_admin_excluded", "true");
    }
    if (localStorage.getItem("tecno_spy_admin_excluded") === "true") {
      return;
    }

    const SUPABASE_URL = "https://jyrqzjctkmzdvmraqrcv.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5cnF6amN0a216ZHZtcmFxcmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NzI4NzcsImV4cCI6MjA1ODE0ODg3N30.d2U_e3rZ_A3t2c-T6hB2K5G-0r3A5t4_9X6n7W8q1M0";
    const SITE_ID = window.SPY_SITE_ID || "dubai-ai-revenue-hub";
    const SITE_NAME = window.SPY_SITE_NAME || document.title || SITE_ID;
    const SITE_CATEGORY = window.SPY_SITE_CATEGORY || "dubai";

    let visitorId = localStorage.getItem("spy_visitor_id");
    if (!visitorId) {
      visitorId = "v_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem("spy_visitor_id", visitorId);
    }
    const sessionId = "s_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    const leadRef = params.get("v") || params.get("lead") || params.get("ref") || "Directo";

    let activeSeconds = 0;
    let maxScroll = 0;
    let conversionsCount = 0;
    const conversionEvents = [];
    const sectionsViewed = {};

    window.addEventListener("scroll", function () {
      const h = document.documentElement;
      const b = document.body;
      const st = "scrollTop";
      const sh = "scrollHeight";
      const pct = Math.round(((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight || 1)) * 100);
      if (pct > maxScroll) maxScroll = Math.min(100, Math.max(0, pct));
    }, { passive: true });

    document.addEventListener("click", function (e) {
      const a = e.target.closest("a, button");
      if (!a) return;
      const href = (a.getAttribute("href") || "").toLowerCase();
      const txt = (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 60);
      if (href.includes("wa.me") || href.includes("whatsapp") || href.includes("tel:") || a.dataset.spyConvert) {
        conversionsCount += 1;
        conversionEvents.push({ type: "cta_click", label: txt || href, at: new Date().toISOString() });
        sendHeartbeat();
      }
    }, true);

    function getDeviceInfo() {
      let gpu = "unknown";
      try {
        const c = document.createElement("canvas");
        const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
        if (gl) {
          const dbg = gl.getExtension("WEBGL_debug_renderer_info");
          if (dbg) gpu = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
        }
      } catch (_) {}
      return {
        ua: navigator.userAgent,
        lang: (navigator.languages || [navigator.language]).join(","),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
        screen: window.screen.width + "x" + window.screen.height + "@" + (window.devicePixelRatio || 1) + "x",
        cores: navigator.hardwareConcurrency || null,
        ram_gb: navigator.deviceMemory || null,
        gpu: gpu
      };
    }

    const devInfo = getDeviceInfo();

    function sendHeartbeat() {
      const payload = {
        id: sessionId,
        site_id: SITE_ID,
        site_name: SITE_NAME,
        visitor_id: visitorId,
        lead_tag: leadRef,
        referrer: document.referrer || "direct",
        device_model: devInfo.gpu,
        screen_res: devInfo.screen,
        timezone: devInfo.tz,
        languages: devInfo.lang,
        duration_seconds: activeSeconds,
        active_seconds: activeSeconds,
        max_scroll_pct: maxScroll,
        sections_viewed: sectionsViewed,
        conversions_count: conversionsCount,
        conversion_events: conversionEvents,
        is_online: document.visibilityState === "visible",
        last_seen_at: new Date().toISOString()
      };
      fetch(SUPABASE_URL + "/rest/v1/web_spy_visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": "Bearer " + SUPABASE_KEY,
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    }

    setInterval(function () {
      if (document.visibilityState === "visible") {
        activeSeconds += 15;
        sendHeartbeat();
      }
    }, 15000);

    setTimeout(sendHeartbeat, 1500);
  } catch (_) {}
})();
