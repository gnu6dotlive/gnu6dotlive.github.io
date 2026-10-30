/* Sommaire : marque la section en cours d'un triangle, dans la colonne et dans le
   bloc repliable. Sans JavaScript, le sommaire reste une liste de liens. */
(function () {
  "use strict";
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc-side a, .toc-top a"));
  if (!links.length || !("IntersectionObserver" in window)) return;
  var heads = Array.prototype.slice.call(document.querySelectorAll("main h2[id]"));
  var current = null;

  function mark(id) {
    if (id === current) return;
    current = id;
    links.forEach(function (a) {
      var on = a.getAttribute("href") === "#" + id;
      a.classList.toggle("is-current", on);
      if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
    });
  }

  // la section en cours est la dernière dont le titre est passé sous l'en-tête
  function update() {
    var top = 120, id = heads.length ? heads[0].id : null;
    heads.forEach(function (h) { if (h.getBoundingClientRect().top - top <= 0) id = h.id; });
    mark(id);
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }, { passive: true });
  update();

  // dans le bloc repliable, choisir une section referme le bloc
  var top = document.querySelector(".toc-top");
  if (top) top.addEventListener("click", function (e) {
    if (e.target.closest("a")) top.removeAttribute("open");
  });
})();
