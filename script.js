/* ============================================================
   ALON SHEMIS — interactions
   i18n switching · sticky header · scroll reveal · ken-burns
   custom cursor · mobile nav · form · reduced-motion guard
   ============================================================ */
(function () {
  "use strict";

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dict = window.I18N || {};
  const SUPPORTED = ["he", "fr", "en"];
  const DEFAULT_LANG = "he";

  /* ---------- Language resolution ---------- */
  function resolveInitialLang() {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get("lang");
    if (fromUrl && SUPPORTED.includes(fromUrl)) return fromUrl;
    const stored = localStorage.getItem("as-lang");
    if (stored && SUPPORTED.includes(stored)) return stored;
    return DEFAULT_LANG;
  }

  function applyStrings(lang) {
    const table = dict[lang];
    if (!table) return;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (table[key] != null) el.textContent = table[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (table[key] != null) el.setAttribute("placeholder", table[key]);
    });
  }

  function setLang(lang, { animate = true } = {}) {
    const table = dict[lang];
    if (!table) return;
    const html = document.documentElement;

    const commit = () => {
      html.setAttribute("lang", lang);
      html.setAttribute("dir", table.dir || "ltr");
      applyStrings(lang);
      // sync all language switches
      document.querySelectorAll(".lang-btn").forEach((b) => {
        b.classList.toggle("is-active", b.getAttribute("data-lang") === lang);
        b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false");
      });
      localStorage.setItem("as-lang", lang);
    };

    if (animate && !REDUCED) {
      const main = document.getElementById("main");
      const targets = [main, document.querySelector(".site-header"), document.querySelector(".site-footer")].filter(Boolean);
      targets.forEach((t) => { t.style.transition = "opacity 150ms ease"; t.style.opacity = "0.3"; });
      window.setTimeout(() => {
        commit();
        targets.forEach((t) => { t.style.opacity = "1"; });
        window.setTimeout(() => targets.forEach((t) => { t.style.transition = ""; }), 200);
      }, 160);
    } else {
      commit();
    }
  }

  // wire switches
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
  });

  // initial (no animation on first paint)
  setLang(resolveInitialLang(), { animate: false });

  /* ---------- Sticky header ---------- */
  const header = document.getElementById("header");
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    const closeNav = () => {
      mobileNav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mobileNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (REDUCED || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- Subtle hero parallax ----------
     Move the hero content (not .hero-bg, which owns the ken-burns
     animation) so both effects coexist without clobbering each other. */
  const heroContent = document.querySelector(".hero-content");
  const heroSection = document.querySelector(".hero");
  if (heroContent && heroSection && !REDUCED) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = Math.min(window.scrollY, window.innerHeight);
          heroContent.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
          heroContent.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.85)));
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------- Custom cursor (desktop, fine pointer) ---------- */
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const cursor = document.getElementById("cursor");
  if (fine && !REDUCED && cursor) {
    document.body.classList.add("cursor-ready");
    let cx = 0, cy = 0, tx = 0, ty = 0, raf;
    const loop = () => {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    loop();
    const hoverables = "a, button, input, textarea, .card";
    document.querySelectorAll(hoverables).forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
    });
  }

  /* ---------- Contact form (no backend — graceful confirm) ---------- */
  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const lang = document.documentElement.getAttribute("lang") || DEFAULT_LANG;
      const table = dict[lang] || dict[DEFAULT_LANG];
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (note) note.textContent = table["contact.sent"] || "Thank you.";
      form.reset();
    });
  }
})();
