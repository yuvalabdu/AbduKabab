/* =========================================================================
   main.js — לוגיקת האתר: ניווט, סיפור, תפריט, גלריה, שעות, מפה.
   ========================================================================= */
(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- שנה בפוטר ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header scrolled state ---------- */
  const header = $("#header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 30);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- תפריט מובייל ---------- */
  const navToggle = $("#navToggle");
  const nav = $("#nav");
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });
  $$(".nav-link").forEach(link =>
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Scrollspy ---------- */
  const navLinks = $$(".nav-link");
  const spy = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + id));
      }
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("section[id]").forEach(s => spy.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); revealObserver.unobserve(e.target); }
    }),
    { threshold: 0.12 }
  );
  $$(".reveal").forEach(el => revealObserver.observe(el));

  /* ---------- הסיפור שלנו ---------- */
  const storyText = $("#storyText");
  if (storyText && typeof STORY !== "undefined") {
    storyText.innerHTML = STORY.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("");
  }

  /* ---------- תפריט: טבלת שיפודים ---------- */
  function priceCell(v) {
    return v == null
      ? '<td class="mt-cell mt-empty">–</td>'
      : `<td class="mt-cell"><span class="mt-price">${v}</span></td>`;
  }

  const skewerTable = $("#skewerTable");
  if (skewerTable && typeof MENU_SKEWERS !== "undefined") {
    const m = MENU_SKEWERS;
    let head1 = '<tr><th class="mt-name" rowspan="2">מנה</th>';
    m.serveTypes.forEach(s => head1 += `<th class="mt-group" colspan="2">${escapeHtml(s)}</th>`);
    head1 += "</tr>";
    let head2 = "<tr>";
    m.serveTypes.forEach(() => head2 += '<th class="mt-sub">שיפוד 1</th><th class="mt-sub">2 שיפודים</th>');
    head2 += "</tr>";

    const body = m.rows.map(r => {
      const cells = r.p.map(pair => priceCell(pair[0]) + priceCell(pair[1])).join("");
      return `<tr><th class="mt-name mt-row">${escapeHtml(r.name)}</th>${cells}</tr>`;
    }).join("");

    skewerTable.innerHTML = `<thead>${head1}${head2}</thead><tbody>${body}</tbody>`;
  }

  /* ---------- תפריט: כרטיסים (ספיישלים / תוספות) ---------- */
  function renderMenuCards(grid, items) {
    if (!grid || !items) return;
    grid.innerHTML = items.map(it => `
      <div class="menu-item">
        <div class="menu-item-main">
          <div class="menu-item-name">${escapeHtml(it.name)}</div>
          ${it.desc ? `<div class="menu-item-desc">${escapeHtml(it.desc)}</div>` : ""}
        </div>
        <div class="menu-item-price">${escapeHtml(String(it.price))}</div>
      </div>`).join("");
  }
  if (typeof MENU_SPECIALS !== "undefined") renderMenuCards($("#specialsGrid"), MENU_SPECIALS);
  if (typeof MENU_EXTRAS !== "undefined")   renderMenuCards($("#extrasGrid"), MENU_EXTRAS);

  /* ---------- גלריה ---------- */
  const galleryGrid = $("#galleryGrid");
  if (typeof GALLERY !== "undefined" && galleryGrid) {
    galleryGrid.innerHTML = GALLERY.map((g, i) => `
      <div class="gallery-item" data-i="${i}">
        <img src="${g.src}" alt="${escapeHtml(g.alt || "תמונה")}" loading="lazy" />
      </div>`).join("");
  }

  /* ---------- Lightbox ---------- */
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  let currentIdx = 0;
  function showLightbox() { const g = GALLERY[currentIdx]; lightboxImg.src = g.src; lightboxImg.alt = g.alt || ""; }
  function openLightbox(i) {
    currentIdx = i; showLightbox();
    lightbox.classList.add("open"); lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lightbox.classList.remove("open"); lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function step(dir) { currentIdx = (currentIdx + dir + GALLERY.length) % GALLERY.length; showLightbox(); }

  if (galleryGrid) {
    galleryGrid.addEventListener("click", e => {
      const item = e.target.closest(".gallery-item");
      if (item) openLightbox(Number(item.dataset.i));
    });
    $("#lightboxClose").addEventListener("click", closeLightbox);
    $("#lightboxPrev").addEventListener("click", () => step(1));   // RTL: שמאל = הבא
    $("#lightboxNext").addEventListener("click", () => step(-1));
    lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener("keydown", e => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") step(-1);
      if (e.key === "ArrowLeft") step(1);
    });
  }

  /* ---------- שעות פתיחה ---------- */
  const hoursList = $("#hoursList");
  const hoursStatus = $("#hoursStatus");
  const toMinutes = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

  if (typeof HOURS !== "undefined" && hoursList) {
    const now = new Date();
    const todayDow = now.getDay();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    hoursList.innerHTML = HOURS.map(h => {
      const isToday = h.day === todayDow;
      const timeText = h.closed ? "סגור" : `${h.open} – ${h.close === "00:00" ? "24:00" : h.close}`;
      return `<li class="${isToday ? "today" : ""}">
          <span class="hours-day">${h.label}</span>
          <span class="hours-time${h.closed ? " closed-day" : ""}">${timeText}</span>
        </li>`;
    }).join("");

    const today = HOURS.find(h => h.day === todayDow);
    let isOpen = false;
    if (today && !today.closed) {
      let closeMin = toMinutes(today.close);
      if (closeMin <= toMinutes(today.open)) closeMin += 24 * 60; // חוצה חצות
      isOpen = nowMin >= toMinutes(today.open) && nowMin < closeMin;
    }
    if (hoursStatus) {
      hoursStatus.className = "hours-status " + (isOpen ? "open" : "closed");
      hoursStatus.innerHTML = `<span class="dot"></span>${isOpen ? "פתוח עכשיו" : "סגור כעת"}`;
    }
  }

  /* ---------- מפה וניווט ---------- */
  if (typeof SITE_CONFIG !== "undefined") {
    const q = encodeURIComponent(SITE_CONFIG.mapQuery || SITE_CONFIG.address || "");
    const wazeLink = $("#wazeLink");
    const gmapsLink = $("#gmapsLink");
    const mapIframe = $("#mapIframe");
    if (wazeLink) wazeLink.href = `https://waze.com/ul?q=${q}&navigate=yes`;
    if (gmapsLink) gmapsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
    if (mapIframe) mapIframe.src = `https://maps.google.com/maps?q=${q}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

    const grl = $("#googleReviewsLink");
    if (grl && SITE_CONFIG.googleBusinessUrl) grl.href = SITE_CONFIG.googleBusinessUrl;
  }

  // חשיפה ל-reviews.js
  window.__abdu = { escapeHtml, revealObserver };
})();
