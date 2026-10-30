# gnu6dotlive.github.io

Le hub de l'organisation : https://gnu6dotlive.github.io/ (FR) et `/en/` (EN).

La page d'accueil est une **scène [in.gnu6](https://github.com/gnu6dotlive/in.gnu6)** : chaque dépôt est une
identité, chaque lien réel entre deux dépôts une relation, et chaque relation renvoie au fichier qui la
prouve. Le moteur tient la scène et ses ressorts ; PixiJS peint la matière (plaques, liens) ; le texte et les
liens restent du HTML ordinaire. Sans JavaScript, sur un écran de moins de 760 px ou sans WebGL, la même page
s'affiche immobile : des cartes, puis la liste des liens et de leurs preuves.

Les dossiers longs sont des pages à lire, à part (`dossiers/`, `en/dossiers/`). Le premier : **gnosix.ds**.
Les quatre dossiers du 29 octobre 2026 restent dans [prologue](https://gnu6dotlive.github.io/prologue/).

## Structure

```
index.html, en/index.html     la scène (le HTML porte tout le contenu)
dossiers/, en/dossiers/       les dossiers, en pages
receipts/                     les relevés de qualification cités par les dossiers
src/hub.ts                    le client in.gnu6 : lit la page, en fait une scène, vise, projette
vendor/in.gnu6/               le moteur, copié octet pour octet à une révision exacte (MIT)
assets/hub.js                 le paquet compilé (esbuild), servi tel quel par GitHub Pages
assets/style.css, theme.js    gnosix.ds : couleurs, thème clair/sombre, encadrés
tools/in-gnu6.mjs             sync <révision> | check : la copie du moteur et son manifeste
tools/build.mjs               vérifie la copie, puis compile src/hub.ts en assets/hub.js
tools/head.py                 canonique, hreflang, aperçu de partage (assets/og*.png), sitemap.xml
```

## Compiler

```sh
npm install
node tools/build.mjs          # échoue si la copie d'in.gnu6 a été modifiée
```

Le moteur ne se modifie jamais ici : une correction se fait dans in.gnu6 (branche et PR), puis
`node tools/in-gnu6.mjs sync <révision fusionnée>`.

Contenu sous CC BY 4.0 ; code du hub sous MIT ; in.gnu6 et PixiJS gardent leur licence MIT.
