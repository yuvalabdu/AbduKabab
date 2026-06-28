/* =========================================================================
   analytics.js — מנגנון Insight: הסכמה לעוגיות + טעינת GA4 + Microsoft Clarity
   + מעקב אחר לחיצות על כפתורים חשובים.

   איך מוסיפים מעקב לכפתור חדש בעתיד:
     מוסיפים ל-element את ה-attribute  data-track="event_name"
     ופרמטרים אופציונליים  data-track-<key>="value"  (למשל data-track-method="waze").
     אין צורך לגעת בקובץ הזה.
   ========================================================================= */
(function () {
  "use strict";

  const CFG = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.analytics) || {};
  const GA4_ID = (CFG.ga4Id || "").trim();
  const CLARITY_ID = (CFG.clarityId || "").trim();
  const CONSENT_KEY = "abdu_consent";          // localStorage: "granted" / "denied"

  let toolsLoaded = false;

  /* ------------------------------------------------------------------ */
  /* טעינת הכלים (GA4 + Clarity) — נקרא רק אחרי הסכמה                     */
  /* ------------------------------------------------------------------ */
  function loadTools() {
    if (toolsLoaded) return;
    toolsLoaded = true;
    if (GA4_ID) loadGA4();
    if (CLARITY_ID) loadClarity();
  }

  function loadGA4() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID);

    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_ID);
    document.head.appendChild(s);
  }

  function loadClarity() {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  /* ------------------------------------------------------------------ */
  /* שליחת אירוע — בטוח גם אם GA4 לא נטען (no-op)                         */
  /* ------------------------------------------------------------------ */
  function trackEvent(name, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }
  }

  /* ------------------------------------------------------------------ */
  /* מאזין לחיצות מרכזי — קורא data-track + data-track-* מכל האתר          */
  /* ------------------------------------------------------------------ */
  document.addEventListener("click", function (e) {
    const el = e.target.closest("[data-track]");
    if (!el) return;
    const name = el.getAttribute("data-track");
    if (!name) return;

    const params = {};
    for (const attr of el.attributes) {
      // data-track-method="waze"  ->  params.method = "waze"
      if (attr.name.startsWith("data-track-")) {
        params[attr.name.slice("data-track-".length)] = attr.value;
      }
    }
    trackEvent(name, params);
  });

  /* ------------------------------------------------------------------ */
  /* באנר הסכמה לעוגיות                                                  */
  /* ------------------------------------------------------------------ */
  function initConsent() {
    const banner = document.getElementById("cookieConsent");
    const acceptBtn = document.getElementById("cookieAccept");
    const textEl = document.getElementById("cookieText");
    if (textEl && CFG.consentText) textEl.textContent = CFG.consentText;
    if (acceptBtn && CFG.consentButton) acceptBtn.textContent = CFG.consentButton;
    const stored = localStorage.getItem(CONSENT_KEY);

    if (stored === "granted") {
      loadTools();
      return;
    }
    if (stored === "denied") return;

    // אין החלטה עדיין — מציגים את הבאנר (אם קיים במסמך)
    if (!banner) { return; }
    banner.classList.remove("hidden");
    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        localStorage.setItem(CONSENT_KEY, "granted");
        banner.classList.add("hidden");
        loadTools();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initConsent);
  } else {
    initConsent();
  }

  // חשיפה לשימוש ידני/עתידי (למשל לעקוב אחרי שליחת טופס הזמנה)
  window.__abduTrack = trackEvent;
})();
