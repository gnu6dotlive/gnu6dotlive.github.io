/* Thème clair / sombre. Par défaut, le site suit le réglage du système ; le bouton
   à côté de FR · EN fait défiler système → clair → sombre, et le navigateur retient
   le choix. Chargé avant la feuille de style, pour que la page s'affiche d'emblée
   dans le bon thème. Sans JavaScript, le site suit le système, sans bouton. */
(function () {
  "use strict";
  var KEY = "prologue-theme";
  var root = document.documentElement;
  var DARK = "screen and (prefers-color-scheme: dark)";

  function stored() {
    try { return localStorage.getItem(KEY) || "system"; } catch (err) { return "system"; }
  }
  function store(v) {
    try { if (v === "system") localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (err) { /* rien */ }
  }

  // les schémas et animations : leur version sombre suit le même choix
  function sources(v) {
    var media = v === "dark" ? "screen" : v === "light" ? "not all" : DARK;
    Array.prototype.forEach.call(document.querySelectorAll("picture > source[srcset*='/dark/']"), function (s) {
      if (s.getAttribute("media") !== media) s.setAttribute("media", media);
    });
  }

  function apply(v) {
    if (v === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", v);
    if (document.readyState !== "loading") sources(v);
  }
  apply(stored());

  var en = root.lang === "en";
  var WORDS = en
    ? { system: "Theme: follows the system", light: "Theme: light", dark: "Theme: dark", next: "change" }
    : { system: "Thème : celui du système", light: "Thème : clair", dark: "Thème : sombre", next: "changer" };
  // icônes Tabler (MIT) : device-desktop, sun, moon
  var ICON = {
    system: "M3 5a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10 M7 20h10 M9 16v4 M15 16v4",
    light: "M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7",
    dark: "M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008"
  };
  var ORDER = ["system", "light", "dark"];

  function paint(b, v) {
    b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + ICON[v] + '"/></svg>';
    b.setAttribute("aria-label", WORDS[v] + " (" + WORDS.next + ")");
    b.title = WORDS[v];
    b.setAttribute("data-mode", v);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var v = stored();
    sources(v);
    var lang = document.querySelector(".site-header .lang-switch");
    if (!lang) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "theme-switch";
    paint(b, v);
    b.addEventListener("click", function () {
      v = ORDER[(ORDER.indexOf(v) + 1) % ORDER.length];
      store(v);
      apply(v);
      paint(b, v);
    });
    var tools = document.createElement("div");
    tools.className = "header-tools";
    lang.parentNode.insertBefore(tools, lang);
    tools.appendChild(b);
    tools.appendChild(lang);
  });
})();
