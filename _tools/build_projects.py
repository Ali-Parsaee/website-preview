"""Build projects/<id>.html for every paper in projects_content.py. Run from anywhere: python3 _tools/build_projects.py"""
import html, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from projects_content import P, CH
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = '7.2'
def page(p, prev, nxt):
    e = html.escape
    ch, chname = CH[p['fam']]
    links = ''.join(f'<a href="{e(u)}">{e(t)} ↗</a>' for t, u in p['links'])
    found = ''.join(f'<li>{e(f)}</li>' for f in p['found'])
    unpub = ('<p class="pj-unpub">This manuscript is under review. This page explains the question and the idea; '
             'results will be added once the paper is public.</p>') if p['kind'] == 'manuscript' else ''
    fit = (f'<a href="../index.html#chapter-{ch}">Part of the story: {chname} ↗</a>' if ch is not None else '') + '<a href="../index.html#research">All projects ↗</a>'
    note = f'<br>{e(p["note"])}' if p['note'] else ''
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(p["title"])} · Ali Parsaee</title><meta name="description" content="{e(p["point"])}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23172331'/%3E%3Ccircle cx='16' cy='16' r='6.5' fill='%23a54731'/%3E%3Ccircle cx='16' cy='16' r='2.3' fill='%23eeeae2'/%3E%3C/svg%3E">
<link rel="stylesheet" href="../style.css?v={V}"><link rel="stylesheet" href="project.css?v={V}">
<script src="engine.js?v={V}" defer></script><script src="visuals-1.js?v={V}" defer></script><script src="visuals-2.js?v={V}" defer></script><script src="visuals-3.js?v={V}" defer></script>
</head><body><main class="pj">
<nav class="pj-top"><a href="../index.html">← Ali Parsaee</a><a href="../index.html#research">All projects</a></nav>
<header class="pj-head"><div><p class="pj-label"><span>{e(p["num"])}</span>{e(p["famlabel"])}</p><h1>{e(p["title"])}</h1><p class="pj-q">{e(p["question"])}</p></div>
<div class="pj-meta"><p class="status">{e(p["status"])}</p><p class="full">{e(p["full"])}</p><p>{p["authors"]}{note}</p><div class="links">{links}</div></div></header>
<p class="pj-point">{e(p["point"])}</p>
<figure class="world" data-visual="{p["id"]}"><div class="world-top"><span>{e(p["title"])}: try it</span></div>
<div class="canvas-wrap"><canvas role="img" aria-label="Interactive illustration. Its current state is described below."></canvas></div>
<p class="scene-result" aria-live="polite"></p><div class="lab-panel"><div class="lab-controls"></div></div>
<figcaption><span class="legend"></span><span>Working model · details below</span></figcaption></figure>
<p class="pj-caption">{e(p["caption"])}</p>
{unpub}<section class="pj-cols"><div><h2>The problem</h2><p>{e(p["problem"])}</p></div><div><h2>What we did</h2><p>{e(p["did"])}</p></div><div><h2>What we found</h2><ul>{found}</ul></div></section>
<details class="deeper"><summary>Go deeper</summary><p>{e(p["deeper"])}</p></details>
<div class="pj-fit">{fit}</div>
<nav class="pj-nav"><a href="{prev["id"]}.html"><small>Previous</small>← {e(prev["title"])}</a><a href="{nxt["id"]}.html" style="text-align:right"><small>Next</small>{e(nxt["title"])} →</a></nav>
</main></body></html>
'''
for i, p in enumerate(P):
    out = os.path.join(ROOT, 'projects', p['id'] + '.html')
    open(out, 'w', encoding='utf-8').write(page(p, P[i - 1], P[(i + 1) % len(P)]))
print('built', len(P), 'pages:', ' '.join(p['id'] for p in P))
