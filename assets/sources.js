/* Fiche de source : au survol ou au focus d'un lien .src, une carte présente la source
   (titre, description, adresse) avec un lien « Ouvrir ». Sans JavaScript, le lien
   reste un lien ordinaire. Pas de fondu : la carte apparaît et disparaît d'un bloc. */
(function () {
  "use strict";
  var card, hideTimer, current;

  function build() {
    card = document.createElement("div");
    card.className = "src-card";
    card.setAttribute("role", "tooltip");
    card.id = "src-card";
    card.hidden = true;
    card.innerHTML =
      '<p class="src-card-title"></p>' +
      '<p class="src-card-desc"></p>' +
      '<a class="src-card-open" target="_blank" rel="noopener"><span class="src-card-url"></span><span aria-hidden="true">↗</span></a>';
    card.addEventListener("mouseenter", function () { clearTimeout(hideTimer); });
    card.addEventListener("mouseleave", scheduleHide);
    document.body.appendChild(card);
  }

  function place(link) {
    var r = link.getBoundingClientRect();
    var w = card.offsetWidth, h = card.offsetHeight, gap = 8, margin = 12;
    var left = Math.min(Math.max(margin, r.left), window.innerWidth - w - margin);
    var top = r.bottom + gap;
    if (top + h > window.innerHeight - margin) top = r.top - h - gap;
    card.style.left = left + "px";
    card.style.top = Math.max(margin, top) + "px";
  }

  function show(link) {
    clearTimeout(hideTimer);
    if (!card) build();
    current = link;
    card.querySelector(".src-card-title").textContent = link.dataset.title || link.textContent;
    card.querySelector(".src-card-desc").textContent = link.dataset.desc || "";
    card.querySelector(".src-card-url").textContent = link.dataset.meta || link.href;
    var open = card.querySelector(".src-card-open");
    open.href = link.href;
    link.setAttribute("aria-describedby", "src-card");
    card.hidden = false;
    place(link);
  }

  function hide() {
    if (card) card.hidden = true;
    if (current) current.removeAttribute("aria-describedby");
    current = null;
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 220);
  }

  document.addEventListener("mouseover", function (e) {
    var link = e.target.closest && e.target.closest("a.src");
    if (link) show(link);
  });
  document.addEventListener("mouseout", function (e) {
    var link = e.target.closest && e.target.closest("a.src");
    if (link && !link.contains(e.relatedTarget)) scheduleHide();
  });
  document.addEventListener("focusin", function (e) {
    var link = e.target.closest && e.target.closest("a.src");
    if (link) show(link);
    else if (!(card && card.contains(e.target))) hide();
  });
  // Au toucher, pas de survol : le premier toucher montre la fiche, le second
  // (ou « Ouvrir » dans la fiche) suit le lien. Toucher ailleurs la referme.
  var touchArmed = null, lastTouch = 0;
  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
    var link = e.target.closest && e.target.closest("a.src");
    lastTouch = Date.now();
    touchArmed = link && current === link && card && !card.hidden ? link : null;
    if (!link && !(card && card.contains(e.target))) hide();
  });
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("a.src");
    if (!link || Date.now() - lastTouch > 800) return;   // souris et clavier : lien direct
    if (touchArmed !== link) {
      e.preventDefault();
      clearTimeout(hideTimer);
      show(link);
    }
    touchArmed = null;
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  window.addEventListener("scroll", function () { if (current) place(current); }, { passive: true });
  window.addEventListener("resize", function () { if (current) place(current); });
})();
