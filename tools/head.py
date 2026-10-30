#!/usr/bin/env python3
"""Balises de tête des pages : adresse canonique, hreflang FR/EN, aperçu de partage (Open Graph).
Écrit entre <!-- head:start --> et <!-- head:end -->, et régénère sitemap.xml. Relançable.

Usage : python3 tools/head.py
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://gnu6dotlive.github.io/"
PAIRS = [("index.html", "en/index.html"), ("dossiers/gnosix-ds.html", "en/dossiers/gnosix-ds.html"),
         ("dossiers/blob-in.html", "en/dossiers/blob-in.html"), ("dossiers/parcours.html", "en/dossiers/parcours.html")]


def url(page: str) -> str:
    return BASE + page.removesuffix("index.html")


def meta(page: str, fr: str, en: str, lang: str) -> str:
    s = (ROOT / page).read_text(encoding="utf-8")
    title = html.unescape(re.search(r"<title>(.*?)</title>", s).group(1))
    desc = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', s).group(1))
    image = BASE + ("assets/og-en.png" if lang == "en" else "assets/og.png")
    e = lambda v: html.escape(v, quote=True)
    return "\n".join([
        "<!-- head:start -->",
        f'<link rel="canonical" href="{url(page)}">',
        f'<link rel="alternate" hreflang="fr" href="{url(fr)}">',
        f'<link rel="alternate" hreflang="en" href="{url(en)}">',
        f'<link rel="alternate" hreflang="x-default" href="{url(fr)}">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="gnu6dotlive">',
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:url" content="{url(page)}">',
        f'<meta property="og:image" content="{image}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:locale" content="{"en_US" if lang == "en" else "fr_CA"}">',
        '<meta name="twitter:card" content="summary_large_image">',
        "<!-- head:end -->",
    ])


def main():
    urls = []
    for fr, en in PAIRS:
        for page, lang in ((fr, "fr"), (en, "en")):
            p = ROOT / page
            s = p.read_text(encoding="utf-8")
            s = re.sub(r"<!-- head:start -->.*?<!-- head:end -->\n", "", s, flags=re.S)
            block = meta(page, fr, en, lang)
            s = s.replace("<script src=", block + "\n<script src=", 1)
            p.write_text(s, encoding="utf-8")
            urls.append(url(page))
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
    print(f"{len(urls)} pages, sitemap.xml")


if __name__ == "__main__":
    main()
