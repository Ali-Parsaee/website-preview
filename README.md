# Ali Parsaee — connected research story

Local static website prototype, built from Ali's approved narrative and the vault's research portfolio. **Nothing is published.**

## Open

```sh
python3 -m http.server 8090 --bind 127.0.0.1
```

Visit http://127.0.0.1:8090/. Opening `index.html` directly also works. No build step, frameworks, runtime dependencies, telemetry, or remote fonts.

## Experience

The opening follows one connected question through five chapters:

1. **The problem:** act on an incomplete picture; reveal an observation that changes the apparent choice.
2. **Observe:** spend a finite budget on longer follow-up or another observation.
3. **Represent:** rearrange the same evidence into shared structure.
4. **Collaborate:** combine partial views; investigate the effect of a shared blind spot.
5. **Decide:** compare weak and clearer support, including withholding a conclusion.

The same 96 evidence objects and two action anchors persist across the scenes. They transform on interaction rather than running an idle animation loop. Motion respects the system preference and the in-page pause control. All numerical budgets and drawings are conceptual illustrations, not experimental results.

A 24-project gallery has subject-specific SVG drawings, filters, and keyboard-accessible project dialogs. Six projects include expandable mathematical questions. The existing research essay, background and professional links remain accessible directly. Without JavaScript, the text chapters and expandable project summaries remain readable.

## Files

- `index.html`: complete narrative, static project records, background, and modal shell.
- `site.js`: procedural canvas scenes, project SVG illustrations, navigation, controls, filters and dialogs.
- `style.css`: responsive layout, typography, reduced-motion and print styles.
- `Pics/Ali_Ferris_Wheel.jpg`: supplied portrait.
- `blogpost1.html`: existing essay, unchanged.
- `old-index.html`, `dial-index.html`: earlier versions, unchanged.
- `.backups/2026-10-24/`: prior implementation, ignored by Git. It is also retained in Git history.

Work stays on branch `lab`; Ali decides what goes live.

## Source and scope

The narrative follows `_buddy/handoff/website-story-and-project-map-2026-10-23.md`. Project descriptions draw on the Research Portfolio and publication ledger, including the October 13/14 corrections. Preparation, exploration, published work, and future directions are distinguished. No clinical datasets were read. Links are the supplied paper/preprint/DOI URLs; summaries have not been independently re-audited against every full manuscript.

## Verification

Headless Chrome checks cover five chapters, observation-budget limits and reset, representation/sharing/evidence controls, keyboard chapter selection, 24 project dialogs and focus return, six filters, anchors and the supplied portrait. Layout checked at widths 320, 390, 650, 768, 1024, 1440 and 1920. Desktop and mobile scenes, project gallery and dialog screenshots were visually reviewed. QA scripts and images stay outside the repo at `~/Library/Caches/obsidian-buddy/website-qa/`.

## Added 2026-10-24 (Claude)

- `world.html`: the interactive Research World map (a public copy of the Studio scene `research-world-public`, exported in the `navy` theme so it matches this page; system fonts, no remote fonts). Linked from the nav ("The map"), from the "one question" section, and from 17 project cards ("See it on the map", `world.html?info=<star>`). Regenerate with `~/.config/buddy/studio -s research-world-public 'export "Life planning with claude/Designs/research-world-public.html"'` and copy it here.
- `writing.html` (index), `blogpost1.html` restyled in this design, `blog.html` → redirect, `404.html`.
- Link preview (Open Graph / Twitter) tags, `og.png` (1200×630, from the hero), SVG favicon, photo resized to 540 px (was 2316 px, 648 KB → 100 KB; original in `.backups/photo/`).
- Removed one internal phrase from a card ("published author order in the current ledger").
