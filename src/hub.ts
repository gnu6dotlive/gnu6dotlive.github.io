/**
 * Le hub : une scène [in.gnu6] (vendor/in.gnu6), projetée en PixiJS (la matière : les plaques et les liens)
 * et en DOM (le texte et les liens, qui restent ceux de la page).
 *
 * La page porte tout : les nœuds sont des articles, les liens une liste sourcée. Sans JavaScript, sur un
 * écran étroit ou sans WebGL, elle reste telle quelle. Ici, le moteur lit cette page, en fait une scène
 * (une identité par dépôt, une relation par lien), et le hub ne fait que proposer des cibles :
 *   - au repos, chaque nœud vise sa place ;
 *   - au survol (ou au focus), ses voisins se rapprochent de lui et ses liens disent ce qu'ils sont ;
 *   - au clic, sa plaque s'étire jusqu'à couvrir la scène, puis la page du dossier s'ouvre.
 * Rien ne se redessine au repos : la boucle s'arrête quand toutes les cibles sont atteintes.
 */
import { Application, Graphics } from "pixi.js";
import type { EntityId, PoseTarget, SceneEntity, SceneRelation, SpringLaw } from "../vendor/in.gnu6/src/algebra/types";
import { SceneEngine } from "../vendor/in.gnu6/src/scene/engine";

const RESSORT: SpringLaw = { stiffness: 170, damping: 26, mass: 1 }; // ζ ≈ 1 : amorti critique, sans rebond
const ETIREMENT: SpringLaw = { stiffness: 260, damping: 32, mass: 1 };
const RAPPROCHEMENT = 0.12; // part du chemin qu'un voisin fait vers le nœud survolé
const LOUPE = 1.04; // la plaque survolée grandit un peu ; le texte, jamais
const LARGEUR_MIN = 760; // en deçà, la page reste une liste

interface Noeud { id: EntityId; el: HTMLElement; lien: HTMLAnchorElement | null; x: number; y: number; w: number; h: number }
interface Lien { rel: SceneRelation; planned: boolean; li: HTMLElement }

const asId = (s: string) => s as EntityId;
const reduit = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function couleurs() {
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim() || "#888888";
  return {
    plaque: v("--ds-pure-white"),
    filet: v("--ds-hairline"),
    encre: v("--ds-slate"),
    accent: v("--ds-signal-orange"),
    accentEncre: v("--ds-signal-orange-700"),
  };
}

function demarrer(): void {
  const scene = document.getElementById("scene");
  if (!scene || window.innerWidth < LARGEUR_MIN) return;

  const noeuds: Noeud[] = Array.from(scene.querySelectorAll<HTMLElement>(".node")).map((el) => ({
    id: asId(el.dataset.id ?? ""),
    el,
    lien: el.querySelector<HTMLAnchorElement>(".node-title a"),
    x: Number(el.dataset.x),
    y: Number(el.dataset.y),
    w: 0,
    h: 0,
  }));
  const parId = new Map(noeuds.map((n) => [n.id, n]));
  const liens: Lien[] = Array.from(scene.querySelectorAll<HTMLElement>(".relation")).map((li) => {
    return {
      rel: { kind: (li.dataset.kind ?? "ext:link") as SceneRelation["kind"], from: asId(li.dataset.from ?? ""), to: asId(li.dataset.to ?? "") },
      planned: li.dataset.planned === "1",
      li,
    };
  });

  document.documentElement.classList.add("hub-live");
  // la scène tient dans ce qui reste de la fenêtre sous l'introduction : on la voit en entier sans défiler
  const ajuster = () => {
    const haut = scene.getBoundingClientRect().top + window.scrollY;
    scene.style.height = Math.max(420, window.innerHeight - haut - 16) + "px";
  };
  ajuster();
  const plan = document.createElement("div");
  plan.className = "scene-plane";
  scene.prepend(plan);
  // la fiche : à côté de l'introduction, elle dit ce qu'est le dernier nœud visé et liste ses liens, avec
  // leurs preuves ; elle ne couvre jamais la scène, et reste en place pour qu'on puisse suivre ses liens
  // la plaque qui s'étire passe au-dessus de tout le reste de la scène : une seule forme, sans rien qui la traverse
  const extrusion = document.createElement("div");
  extrusion.className = "hub-extrusion";
  extrusion.hidden = true;
  scene.appendChild(extrusion);
  const fiche = document.querySelector<HTMLElement>(".hub-fiche");
  const remplir = (id: EntityId) => {
    const n = parId.get(id);
    if (!fiche || !n) return;
    const titre = fiche.querySelector<HTMLElement>(".fiche-titre")!;
    const phrase = fiche.querySelector<HTMLElement>(".fiche-phrase")!;
    const liste = fiche.querySelector<HTMLElement>(".fiche-liens")!;
    titre.replaceChildren(n.el.querySelector(".node-title a")!.cloneNode(true));
    phrase.textContent = n.el.querySelector(".node-line")?.textContent ?? "";
    liste.replaceChildren(...liens.filter((l) => l.rel.from === id || l.rel.to === id).map((l) => {
      const item = l.li.cloneNode(true) as HTMLElement;
      item.removeAttribute("data-from");
      return item;
    }));
    fiche.dataset.vide = "0";
  };

  // la scène : une identité par nœud, une relation par lien ; le moteur refuse tout état incohérent
  const mesurer = () => {
    for (const n of noeuds) { n.w = n.el.offsetWidth; n.h = n.el.offsetHeight; }
  };
  mesurer();
  const place = (n: Noeud) => {
    const r = scene.getBoundingClientRect();
    const marge = 24;
    return {
      x: marge + n.w / 2 + n.x * (r.width - n.w - 2 * marge),
      y: marge + n.h / 2 + n.y * (r.height - n.h - 2 * marge),
    };
  };
  const entite = (n: Noeud): SceneEntity => ({
    id: n.id,
    role: "card",
    pose: { position: place(n), rotation: 0, scale: { x: 1, y: 1 } },
    velocity: { linear: { x: 0, y: 0 }, angular: 0, scale: { x: 0, y: 0 } },
    shape: { kind: "rect", width: n.w, height: n.h, radius: 14 },
    z: 0,
    visible: true,
    parent: null,
  });
  const moteur = new SceneEngine();
  moteur.mutate({ add: noeuds.map(entite), relations: liens.map((l) => l.rel) });

  const voisins = (id: EntityId) =>
    new Set(moteur.snapshot().relations.flatMap((r) => (r.from === id ? [r.to] : r.to === id ? [r.from] : [])));

  let survole: EntityId | null = null;
  let etire: EntityId | null = null;

  const cibles = (): PoseTarget[] => {
    const proches = survole ? voisins(survole) : new Set<EntityId>();
    const centre = survole ? place(parId.get(survole)!) : null;
    const r = scene.getBoundingClientRect();
    return noeuds.map((n) => {
      const base = place(n);
      if (etire === n.id) {
        return {
          entityId: n.id,
          spring: ETIREMENT,
          pose: { position: { x: r.width / 2, y: r.height / 2 }, rotation: 0, scale: { x: r.width / n.w, y: r.height / n.h } },
        };
      }
      const position = centre && proches.has(n.id)
        ? { x: base.x + RAPPROCHEMENT * (centre.x - base.x), y: base.y + RAPPROCHEMENT * (centre.y - base.y) }
        : base;
      const s = survole === n.id ? LOUPE : 1;
      return { entityId: n.id, spring: RESSORT, pose: { position, rotation: 0, scale: { x: s, y: s } } };
    });
  };

  // la matière, en PixiJS, derrière le texte
  const app = new Application();
  let pret = false;
  let teintes = couleurs();
  const liensG = new Graphics();
  const plaquesG = new Graphics();

  const composer = () => {
    if (!pret) return;
    const etat = moteur.snapshot();
    const proches = survole ? voisins(survole) : new Set<EntityId>();
    liensG.clear();
    for (const l of liens) {
      const a = etat.entities.get(l.rel.from)!.pose.position;
      const b = etat.entities.get(l.rel.to)!.pose.position;
      const actif = survole !== null && (l.rel.from === survole || l.rel.to === survole);
      const couleur = actif ? teintes.accent : teintes.filet;
      const largeur = actif ? 2 : 1.25;
      if (l.planned) {
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        const pas = 7;
        for (let t = 0; t < d; t += pas * 2) {
          const t2 = Math.min(d, t + pas);
          liensG.moveTo(a.x + ((b.x - a.x) * t) / d, a.y + ((b.y - a.y) * t) / d);
          liensG.lineTo(a.x + ((b.x - a.x) * t2) / d, a.y + ((b.y - a.y) * t2) / d);
        }
      } else {
        liensG.moveTo(a.x, a.y).lineTo(b.x, b.y);
      }
      liensG.stroke({ width: largeur, color: couleur });
    }
    plaquesG.clear();
    extrusion.hidden = !etire;
    for (const n of noeuds) {
      const e = etat.entities.get(n.id)!;
      const w = n.w * e.pose.scale.x;
      const h = n.h * e.pose.scale.y;
      if (etire === n.id) {
        extrusion.style.transform = `translate(${e.pose.position.x - w / 2}px, ${e.pose.position.y - h / 2}px)`;
        extrusion.style.width = w + "px";
        extrusion.style.height = h + "px";
        n.el.style.transform = `translate(${e.pose.position.x - n.w / 2}px, ${e.pose.position.y - n.h / 2}px)`;
        continue;
      }
      const actif = survole === n.id || etire === n.id;
      plaquesG
        .roundRect(e.pose.position.x - w / 2, e.pose.position.y - h / 2, w, h, 14)
        .fill({ color: teintes.plaque })
        .stroke({ width: actif ? 2 : 1, color: actif ? teintes.accent : proches.has(n.id) ? teintes.accentEncre : teintes.filet });
      n.el.style.transform = `translate(${e.pose.position.x - n.w / 2}px, ${e.pose.position.y - n.h / 2}px)`;
    }
  };
  // chaque image composée est aussitôt présentée
  const dessiner = () => {
    if (!pret) return;
    composer();
    app.renderer.render(app.stage);
  };

  // la boucle ne tourne que tant qu'une cible n'est pas atteinte
  let boucle = 0;
  let avant = 0;
  const viser = () => {
    moteur.mutate({ targets: cibles() });
    if (reduit()) {
      for (const n of noeuds) moteur.settleTarget(n.id);
      dessiner();
      return;
    }
    if (!boucle) { avant = performance.now(); boucle = requestAnimationFrame(image); }
  };
  const image = (t: number) => {
    moteur.step((t - avant) / 1000);
    avant = t;
    dessiner();
    const fini = noeuds.every((n) => moteur.isTargetSettled(n.id));
    boucle = fini ? 0 : requestAnimationFrame(image);
  };

  // gestes : survol et focus visent, le clic étire puis ouvre
  const sur = (id: EntityId | null) => {
    if (etire || survole === id) return;
    survole = id;
    if (id) remplir(id);
    viser();
  };
  for (const n of noeuds) {
    n.el.addEventListener("pointerenter", () => sur(n.id));
    n.el.addEventListener("pointerleave", () => sur(null));
    n.el.addEventListener("focusin", () => sur(n.id));
    n.el.addEventListener("focusout", () => sur(null));
    n.el.addEventListener("click", (ev) => {
      const href = n.lien?.href;
      if (!href || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
      ev.preventDefault();
      if (reduit()) { location.href = href; return; }
      etire = n.id;
      survole = null;
      if (fiche) fiche.hidden = true;
      n.el.classList.add("node-leaving");
      viser();
      const partir = () => (moteur.isTargetSettled(n.id) ? (location.href = href) : requestAnimationFrame(partir));
      requestAnimationFrame(partir);
      setTimeout(() => { location.href = href; }, 900);
    });
  }
  // revenir par « précédent » : la page est restaurée telle quelle, sans plaque étirée
  window.addEventListener("pageshow", (ev) => {
    if (!ev.persisted || !etire) return;
    noeuds.forEach((n) => n.el.classList.remove("node-leaving"));
    etire = null;
    extrusion.hidden = true;
    if (fiche) fiche.hidden = false;
    for (const n of noeuds) moteur.settleTarget(n.id);
    viser();
  });

  const retailler = () => {
    if (window.innerWidth < LARGEUR_MIN) { location.reload(); return; }
    ajuster();
    mesurer();
    if (pret) app.renderer.resize(scene.clientWidth, scene.clientHeight);
    viser();
  };
  window.addEventListener("resize", retailler);
  new MutationObserver(() => { teintes = couleurs(); dessiner(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { teintes = couleurs(); dessiner(); });

  app
    .init({ backgroundAlpha: 0, antialias: true, resolution: window.devicePixelRatio || 1, autoDensity: true, width: scene.clientWidth, height: scene.clientHeight })
    .then(() => {
      app.ticker.stop(); // la scène décide quand peindre : rien au repos
      app.stage.addChild(liensG, plaquesG);
      app.canvas.className = "scene-canvas";
      app.canvas.setAttribute("aria-hidden", "true");
      plan.prepend(app.canvas);
      pret = true;
      viser();
      dessiner();
    })
    .catch(() => {
      // sans WebGL, la page reste une liste
      document.documentElement.classList.remove("hub-live");
      plan.remove();
    });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", demarrer);
else demarrer();
