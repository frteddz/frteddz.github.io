(function () {
  "use strict";

  document.documentElement.classList.add("ui-ready");

  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initNav() {
    var toggle = document.getElementById("nav-toggle");
    var links = document.querySelector(".nav__links");
    if (!toggle || !links) return;

    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute(
        "aria-label",
        window.SITE.t[document.documentElement.lang][open ? "nav.close" : "nav.menu"]
      );
      document.body.classList.toggle("nav-open", open);
    });

    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
      });
    });
  }

  function initReveals() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal], [data-reveal-group]").forEach(function (el) {
        el.classList.add("in");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add("in");
          if (el.hasAttribute("data-reveal-group")) {
            el.querySelectorAll("[data-reveal]").forEach(function (child, i) {
              child.style.setProperty("--rd", i * 90 + "ms");
              child.classList.add("in");
            });
          }
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    document.querySelectorAll("[data-reveal-group]").forEach(function (el) {
      io.observe(el);
    });
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (!el.closest("[data-reveal-group]")) io.observe(el);
    });
  }

  function initIntro() {
    if (!motionOK) return;
    var intro = document.querySelectorAll("[data-intro]");
    if (!intro.length) return;

    intro.forEach(function (el, i) {
      el.style.setProperty("--intro-delay", 250 + i * 110 + "ms");
    });

    requestAnimationFrame(function () {
      document.body.classList.add("intro-play");
      requestAnimationFrame(function () {
        intro.forEach(function (el) {
          el.classList.add("is-in");
        });
      });
    });
  }

  function initCatalog() {
    var cats = document.querySelectorAll(".cat");
    var tabs = document.querySelectorAll(".tab");
    if (!cats.length || !tabs.length) return;

    function setActive(id) {
      tabs.forEach(function (tab) {
        var current = tab.getAttribute("href") === "#" + id;
        if (current) tab.setAttribute("aria-current", "true");
        else tab.removeAttribute("aria-current");
      });
      cats.forEach(function (cat) {
        cat.classList.toggle("is-active", cat.id === id);
      });
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) setActive(entry.target.id);
          });
        },
        { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
      );
      cats.forEach(function (cat) {
        io.observe(cat);
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function (e) {
        e.preventDefault();
        var target = document.querySelector(tab.getAttribute("href"));
        if (!target) return;
        target.scrollIntoView({
          behavior: motionOK ? "smooth" : "auto",
          block: "start",
        });
        try {
          history.replaceState(null, "", tab.getAttribute("href"));
        } catch (e) {}
      });
    });
  }

  function initNavSpy() {
    var links = document.querySelectorAll('.nav__links a[href^="#"]');
    var sections = [];
    links.forEach(function (link) {
      var target = document.querySelector(link.getAttribute("href"));
      if (target) sections.push({ link: link, target: target });
    });
    if (!sections.length || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (l) {
            l.removeAttribute("aria-current");
          });
          var match = sections.find(function (s) {
            return s.target === entry.target;
          });
          if (match) match.link.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (s) {
      io.observe(s.target);
    });
  }

  function initMagnetic() {
    if (!finePointer || !motionOK) return;
    document.querySelectorAll(".magnetic").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        el.style.setProperty("--mx", x * 6 + "px");
        el.style.setProperty("--my", y * 6 + "px");
      });
      el.addEventListener("mouseleave", function () {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      });
    });
  }

  function initCursor() {
    var glow = document.getElementById("cursor-glow");
    if (!glow || !finePointer || !motionOK) return;

    var tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      raf = null;

    function loop() {
      raf = window.requestAnimationFrame(function () {
        cx += (tx - cx) * 0.16;
        cy += (ty - cy) * 0.16;
        glow.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
        if (Math.abs(tx - cx) < 0.4 && Math.abs(ty - cy) < 0.4) {
          glow.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
          raf = null;
          return;
        }
        loop();
      });
    }

    window.addEventListener(
      "pointermove",
      function (e) {
        tx = e.clientX;
        ty = e.clientY;
        glow.classList.add("is-on");
        if (!raf) loop();
      },
      { passive: true }
    );

    document.querySelectorAll("a, button, .project").forEach(function (el) {
      el.addEventListener("pointerenter", function () {
        glow.classList.add("is-hot");
      });
      el.addEventListener("pointerleave", function () {
        glow.classList.remove("is-hot");
      });
    });
  }

  function initParallax() {
    if (window.innerWidth < 768) return;
    var targets = document.querySelectorAll("[data-parallax]");
    if (!targets.length || !motionOK) return;

    var ticking = false;

    function update() {
      if (window.innerWidth < 768) return;
      var vh = window.innerHeight;
      targets.forEach(function (el) {
        var factor = parseFloat(el.getAttribute("data-parallax")) || 0.1;
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var offset = (r.top + r.height / 2 - vh / 2) * -factor;
        el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  function initAutoplayVideos() {
    var videos = Array.prototype.slice.call(document.querySelectorAll("video[autoplay]"));
    if (!videos.length) return;

    if (!motionOK) {
      videos.forEach(function (v) { v.pause(); });
      return;
    }

    var state = new WeakMap();

    function toggle(v, play) {
      if (state.get(v) === play) return;
      state.set(v, play);
      if (play) v.play().catch(function () {});
      else v.pause();
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            toggle(entry.target, entry.isIntersecting);
          });
        },
        { threshold: 0.15 }
      );
      videos.forEach(function (v) { io.observe(v); });
    } else {
      videos.forEach(function (v) { toggle(v, true); });
    }
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveals();
    initIntro();
    initCatalog();
    initNavSpy();
    initMagnetic();
    initCursor();
    initParallax();
    initAutoplayVideos();
    initYear();
  });
})();
