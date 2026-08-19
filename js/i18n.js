(function () {
  "use strict";

  var SITE = window.SITE;
  var DEFAULT_LANG = "en";

  var PROJ_MAP = {};
  SITE.categories.forEach(function (cat) {
    (SITE.projects[cat.id] || []).forEach(function (p) {
      PROJ_MAP[p.slug] = p;
    });
  });

  function apply(lang) {
    if (!SITE.t[lang]) lang = DEFAULT_LANG;
    var t = SITE.t[lang];

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var value = t[key];
      if (value === undefined) return;
      el.textContent = value.replace("{year}", String(new Date().getFullYear()));
    });

    document.querySelectorAll("[data-project]").forEach(function (card) {
      var proj = PROJ_MAP[card.getAttribute("data-project")];
      if (!proj) return;
      var desc = card.querySelector("[data-project-desc]");
      var tag = card.querySelector("[data-project-tag]");
      var img = card.querySelector("img");
      if (desc) desc.textContent = proj.desc[lang];
      if (tag) tag.textContent = proj.tag[lang];
      if (img) img.setAttribute("alt", proj.alt[lang]);
    });

    var title = t["meta.title"];
    var desc = t["meta.desc"];
    document.title = title;
    document.querySelector('meta[name="description"]').setAttribute("content", desc);
    document.querySelector('meta[property="og:title"]').setAttribute("content", title);
    document.querySelector('meta[property="og:description"]').setAttribute("content", desc);
    document.querySelector('meta[property="og:locale"]').setAttribute("content", "en_US");
    document.querySelector('meta[name="twitter:title"]').setAttribute("content", title);
    document.querySelector('meta[name="twitter:description"]').setAttribute("content", desc);
  }

  window.i18n = {
    apply: apply,
  };

  apply(DEFAULT_LANG);
})();
