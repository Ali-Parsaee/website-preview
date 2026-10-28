# _tools (not published: Jekyll skips folders starting with "_")

- `build_projects.py` + `projects_content.py`: generate `projects/<id>.html`. Edit the content file, then run `python3 _tools/build_projects.py`.
- `sweep_run.js` + `sweep_inpage.js`: bug sweep. Works every slider (min/mid/max/start), button and option, and clicks the canvas, then reports JavaScript errors, near-blank canvases and controls that did not change the picture. Needs Google Chrome and a local server (`python3 -m http.server 8090`).

```
node _tools/sweep_run.js http://127.0.0.1:8090/projects/memory.html .lab-panel canvas 1440 900 0
node _tools/sweep_run.js http://127.0.0.1:8090/ '.lab-controls[data-lab="0"]' '#world-canvas' 1440 900 0
```
Phone size: `390 844 1`. Set `VERBOSE=1` to list unchanged actions.
