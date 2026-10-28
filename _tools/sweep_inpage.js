// Injected into a page: exercise every control under `root`, record errors and canvas changes.
(async function(rootSel, canvasSel){
  const errs=[];window.addEventListener('error',e=>errs.push(String(e.message||e.error)));window.addEventListener('unhandledrejection',e=>errs.push('rejection: '+e.reason));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms)),frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const cv=document.querySelector(canvasSel);
  function sig(){const w=cv.width,h=cv.height;if(!w||!h)return{hash:0,ink:0,w,h};const c=cv.getContext('2d'),d=c.getImageData(0,0,w,h).data;let hash=0,ink=0;
    for(let y=0;y<h;y+=Math.max(1,h>>6))for(let x=0;x<w;x+=Math.max(1,w>>6)){const i=(y*w+x)*4,v=d[i]*3+d[i+1]*5+d[i+2]*7;hash=(hash*31+v)>>>0;if(d[i]+d[i+1]+d[i+2]>150)ink++;}return{hash,ink,w,h};}
  const out=[];let prev=(await frames(),sig());
  async function step(label,fn,settle=350){const e0=errs.length;try{fn();}catch(e){errs.push('handler: '+e.message);}await frames();await sleep(settle);await frames();const s=sig();
    out.push({label,err:errs.slice(e0),changed:s.hash!==prev.hash,ink:s.ink,size:s.w+'x'+s.h});prev=s;}
  const root=document.querySelector(rootSel);
  const ranges=[...root.querySelectorAll('input[type=range]')];
  for(const r of ranges){const name=(r.closest('label')?.querySelector('span')?.textContent||'slider').trim().slice(0,30),mn=+r.min,mx=+r.max;
    for(const [tag,v] of [['min',mn],['mid',mn+(mx-mn)/2],['max',mx],['start',+r.defaultValue]]){await step(`slider "${name}" → ${tag} (${v})`,()=>{r.value=v;r.dispatchEvent(new Event('input',{bubbles:true}));});}}
  const btns=[...root.querySelectorAll('button')];
  for(const b of btns){const name=b.textContent.trim().replace(/\s+/g,' ').slice(0,40);const long=/Run|Play|Simulate|Sweep|Let it keep|Race|Follow the most|learner choose/.test(name);
    await step(`button "${name}"`,()=>b.click(),long?1600:350);
    if(/Play|Pause|keep learning|Run 40|Run 20/.test(name)&&/Pause|❚❚/.test(b.textContent)){await step(`button "${name}" (stop)`,()=>b.click());}}
  // pointer: click a few spots on the canvas
  const r=cv.getBoundingClientRect();for(const [fx,fy] of [[.3,.4],[.5,.8],[.7,.3]]){await step(`canvas click ${fx},${fy}`,()=>{const o={clientX:r.left+r.width*fx,clientY:r.top+r.height*fy,bubbles:true,pointerId:1};cv.dispatchEvent(new PointerEvent('pointerdown',o));cv.dispatchEvent(new PointerEvent('pointermove',o));cv.dispatchEvent(new PointerEvent('pointerup',o));});}
  return out;
})
