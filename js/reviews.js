/* =========================================================================
   reviews.js — ביקורות מגוגל.
   אם הוגדרו googleApiKey + googlePlaceId ב-data.js → שליפה חיה דרך
   Google Places API. אחרת → שימוש בביקורות הסטטיות (STATIC_REVIEWS).
   ========================================================================= */
(function () {
  "use strict";

  const grid = document.getElementById("reviewsGrid");
  if (!grid || typeof SITE_CONFIG === "undefined") return;

  const esc =
    (window.__abdu && window.__abdu.escapeHtml) ||
    (s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));

  /* ---------- רינדור כרטיס ביקורת ---------- */
  function stars(rating) {
    const full = Math.round(rating);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }

  function renderReviews(reviews) {
    if (!reviews || !reviews.length) {
      renderReviews(STATIC_REVIEWS);
      return;
    }
    grid.innerHTML = reviews
      .map(r => {
        const initial = (r.author || "?").trim().charAt(0);
        return `
        <div class="review-card reveal">
          <div class="review-head">
            <div class="review-avatar">${esc(initial)}</div>
            <div>
              <div class="review-author">${esc(r.author)}</div>
              ${r.meta ? `<div class="review-meta">${esc(r.meta)}</div>` : ""}
              <div class="review-date">${esc(r.relative || "")}</div>
            </div>
          </div>
          <div class="review-stars" aria-label="דירוג ${r.rating} מתוך 5">${stars(r.rating)}</div>
          <p class="review-text">${esc(r.text)}</p>
          <div class="review-source">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.1 7.1 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z"/></svg>
            ביקורת מ-Google
          </div>
        </div>`;
      })
      .join("");

    // הפעלת אנימציית reveal
    if (window.__abdu && window.__abdu.revealObserver) {
      grid.querySelectorAll(".reveal").forEach(el => window.__abdu.revealObserver.observe(el));
    } else {
      grid.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
    }
  }

  /* ---------- שליפה חיה מ-Google Places ---------- */
  function loadGoogleReviews() {
    const { googleApiKey, googlePlaceId } = SITE_CONFIG;

    // טעינת Google Maps JS API באופן דינמי
    window.__initAbduPlaces = function () {
      try {
        const svc = new google.maps.places.PlacesService(document.createElement("div"));
        svc.getDetails(
          { placeId: googlePlaceId, fields: ["reviews", "rating", "url"], language: "he" },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place && place.reviews) {
              const mapped = place.reviews.map(rv => ({
                author: rv.author_name,
                rating: rv.rating,
                text: rv.text,
                relative: rv.relative_time_description,
              }));
              renderReviews(mapped);
              if (place.url) {
                const link = document.getElementById("googleReviewsLink");
                if (link) link.href = place.url;
              }
            } else {
              console.warn("Places API לא החזיר ביקורות (status: " + status + "). מציג ביקורות סטטיות.");
              renderReviews(STATIC_REVIEWS);
            }
          }
        );
      } catch (err) {
        console.warn("שגיאה ב-Places API, מציג ביקורות סטטיות:", err);
        renderReviews(STATIC_REVIEWS);
      }
    };

    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      encodeURIComponent(googleApiKey) +
      "&libraries=places&language=he&callback=__initAbduPlaces";
    script.async = true;
    script.onerror = () => {
      console.warn("טעינת Google Maps API נכשלה. מציג ביקורות סטטיות.");
      renderReviews(STATIC_REVIEWS);
    };
    document.head.appendChild(script);
  }

  /* ---------- החלטה ---------- */
  if (SITE_CONFIG.googleApiKey && SITE_CONFIG.googlePlaceId) {
    loadGoogleReviews();
  } else {
    renderReviews(STATIC_REVIEWS);
  }
})();
