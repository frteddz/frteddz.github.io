(function () {
  "use strict";

  document.documentElement.classList.add("ui-ready");

  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── NAV ────────────────────────────────────────────────── */
  function initNav() {
    var pill = document.querySelector(".nav-indicator-pill");
    var links = document.querySelectorAll(".nav-link");
    if (!pill || !links.length) return;

    var PAD = 8;

    function textRect(el) {
      var range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect();
    }

    function movePillTo(link) {
      var t = textRect(link);
      var parent = link.parentElement;
      var pr = parent.getBoundingClientRect();
      var border = parseFloat(getComputedStyle(parent).borderLeftWidth) || 0;
      var left = Math.round(t.left - pr.left - PAD - border);
      var width = Math.round(t.width + PAD * 2);
      pill.style.left = left + "px";
      pill.style.width = width + "px";
    }

    function moveToActive() {
      var cur = document.querySelector(".nav-link.active");
      if (cur) movePillTo(cur);
    }

    var active = document.querySelector(".nav-link.active");
    if (active) {
      requestAnimationFrame(function () { movePillTo(active); });
    }

    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var href = link.getAttribute("href");
        var target = document.querySelector(href);
        if (!target) return;
        target.scrollIntoView({ behavior: motionOK ? "smooth" : "auto", block: "start" });
        try { history.replaceState(null, "", href); } catch (err) {}
      });

      link.addEventListener("mouseenter", function () { movePillTo(link); });
      link.addEventListener("mouseleave", moveToActive);
    });

    var sections = [];
    links.forEach(function (link) {
      var target = document.querySelector(link.getAttribute("href"));
      if (target) sections.push({ link: link, target: target });
    });

    if (sections.length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            links.forEach(function (l) { l.classList.remove("active"); });
            var match = sections.find(function (s) { return s.target === entry.target; });
            if (match) {
              match.link.classList.add("active");
              movePillTo(match.link);
            }
          });
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
      );
      sections.forEach(function (s) { io.observe(s.target); });
    }

    window.addEventListener("resize", moveToActive);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(moveToActive);
    }
    window.addEventListener("load", moveToActive);
  }

  /* ── REVEALS ───────────────────────────────────────────── */
  function initReveals() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.classList.add("revealed");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("revealed");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      io.observe(el);
    });
  }

  /* ── INTRO ANIMATION ───────────────────────────────────── */
  function initIntro() {
    if (!motionOK) {
      document.body.classList.add("no-motion");
      return;
    }
    var intro = document.querySelectorAll("[data-intro]");
    if (!intro.length) return;

    document.body.classList.add("intro-active");

    intro.forEach(function (el, i) {
      el.style.setProperty("--intro-delay", 250 + i * 110 + "ms");
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        intro.forEach(function (el) { el.classList.add("is-in"); });
        setTimeout(function () {
          document.body.classList.remove("intro-active");
        }, 1800);
      });
    });
  }

  /* ── CURSOR GLOW ───────────────────────────────────────── */
  function initCursor() {
    var glow = document.getElementById("cursor-glow");
    if (!glow || !finePointer || !motionOK) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    function loop() {
      raf = window.requestAnimationFrame(function () {
        cx += (tx - cx) * 0.16;
        cy += (ty - cy) * 0.16;
        glow.style.left = cx + "px";
        glow.style.top = cy + "px";
        if (Math.abs(tx - cx) < 0.4 && Math.abs(ty - cy) < 0.4) {
          glow.style.left = tx + "px";
          glow.style.top = ty + "px";
          raf = null;
          return;
        }
        loop();
      });
    }

    window.addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) loop();
    }, { passive: true });
  }

  /* ── YEAR ──────────────────────────────────────────────── */
  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ── BOOT ──────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveals();
    initIntro();
    initCursor();
    initYear();
  });
})();
