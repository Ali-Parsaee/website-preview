# Ali Parsaee — website design lab

A local redesign for PhD committees and research hiring, organized around the value of information.

## Preview

From this folder:

```sh
python3 -m http.server 8090 --bind 127.0.0.1
```

Open http://127.0.0.1:8090/. The page also works by opening `index.html` directly. No build step, external dependencies, analytics, or remote font requests.

## Files

- `index.html`: homepage, all 14 research entries, writing, and background.
- `style.css`: responsive layout, typography, print, and reduced-motion styles.
- `site.js`: five interactive research themes, conceptual SVG figures, and research filters.
- `Pics/Ali_Ferris_Wheel.jpg`: supplied portrait.
- `blogpost1.html`: existing essay, retained unchanged.
- `old-index.html` and `dial-index.html`: earlier designs, retained unchanged.
- `.backups/`: local snapshots before this redesign (ignored by Git).

The homepage has three levels: a plain-language research identity; an interactive map revealing explanations and conceptual figures; and optional mathematics and paper details. Research and professional background are accessible immediately.

Content is based on the supplied 2026-10-23 website brief. Status labels distinguish publications, preprints, work under review, work in preparation, and future directions. Only paper URLs supplied in the brief are linked. The figures are conceptual, not empirical results.

## Local-only workflow

Work stays on branch `lab`. No deployment or publication was performed. Ali decides what goes live.

Browser checks covered all five themes, all seven filters, 14 paper disclosures, arrow-key navigation, anchor targets, the portrait, and horizontal overflow at widths 320, 390, 768, 1024, 1440, and 1920. Desktop and mobile screenshots were visually reviewed. QA artifacts are outside this checkout at `~/Library/Caches/obsidian-buddy/website-qa/`.
