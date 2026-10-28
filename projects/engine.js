'use strict';
/* Shared engine for the project pages: one dark canvas, a narration line, controls built by each visual.
   Same visual language as the story's labs: 3Blue1Brown-style colours on a dark screen, hand-written notes. */
(function(){
const TAU=Math.PI*2;
const COL={bg:'#12171d',grid:'rgba(236,231,220,.035)',axis:'#46535e',text:'#c9d2d8',dim:'#80909b',faint:'#2c3843',white:'#ece7dc',
  A:'#f4c95d',B:'#58c4dd',green:'#83c167',red:'#fc6255',teal:'#5cd0b3',purple:'#b48ccd',gold:'#f0ac5f',hand:'#efe2c2'};
const FONT={sans:'"Helvetica Neue",Helvetica,Arial,sans-serif',serif:'Georgia,"Times New Roman",serif',
  mono:'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',hand:'"Bradley Hand","Noteworthy","Segoe Print","Comic Sans MS",cursive'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t, now=()=>performance.now();
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function rng(seed){let a=(seed>>>0)||1;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss(r){let u=0;while(u===0)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*r());}
const phi=x=>Math.exp(-.5*x*x)/Math.sqrt(TAU);
function Phi(x){const t=1/(1+.2316419*Math.abs(x)),d=.3989422804*Math.exp(-x*x/2),p=d*t*(.31938153+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>0?1-p:p;}
const pct=p=>Math.round(p*100)+'%';
const H=ps=>{let h=0;for(const p of ps)if(p>1e-12)h-=p*Math.log2(p);return h;};
function line(c,x1,y1,x2,y2,col,w=1,a=1,dash){c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();}
function dot(c,x,y,r,col,a=1){c.save();c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function ring(c,x,y,r,col,w=1.5,a=1,fill){c.save();c.globalAlpha=a;if(fill){c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.restore();}
function rect(c,x,y,w,h,col,a=1){c.save();c.globalAlpha=a;c.fillStyle=col;c.fillRect(x,y,w,h);c.restore();}
function txt(c,s,x,y,o={}){c.save();c.globalAlpha=o.a==null?1:o.a;c.fillStyle=o.col||COL.text;c.font=`${o.italic?'italic ':''}${o.weight||400} ${o.size||12}px ${FONT[o.font||'sans']}`;c.textAlign=o.align||'left';c.textBaseline=o.base||'alphabetic';
  if(o.halo!==false){c.save();c.globalAlpha=Math.min(1,(o.a==null?1:o.a)*.85);c.strokeStyle=COL.bg;c.lineWidth=3.5;c.lineJoin='round';c.strokeText(s,x,y);c.restore();}c.fillText(s,x,y);c.restore();}
function mono(c,s,x,y,o={}){txt(c,s,x,y,Object.assign({font:'mono',size:10,col:COL.dim},o));}
function hand(c,s,x,y,o={}){const size=o.size||15;String(s).split('\n').forEach((l,i)=>txt(c,l,x,y+i*size*1.18,{font:'hand',size,col:o.col||COL.hand,align:o.align||'left',a:o.a==null?.95:o.a}));}
function arrow(c,x1,y1,x2,y2,o={}){const col=o.col||COL.hand,bend=o.bend==null?.22:o.bend,mx=(x1+x2)/2,my=(y1+y2)/2,dx=x2-x1,dy=y2-y1,cx=mx-dy*bend,cy=my+dx*bend;
  c.save();c.strokeStyle=col;c.lineWidth=o.w||1.4;c.lineCap='round';c.globalAlpha=o.a==null?.9:o.a;c.beginPath();
  for(let i=0;i<=26;i++){const t=i/26,x=(1-t)*(1-t)*x1+2*(1-t)*t*cx+t*t*x2,y=(1-t)*(1-t)*y1+2*(1-t)*t*cy+t*t*y2;i?c.lineTo(x,y):c.moveTo(x,y);}
  c.stroke();const ang=Math.atan2(y2-cy,x2-cx),hl=8;c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-hl*Math.cos(ang-.45),y2-hl*Math.sin(ang-.45));c.moveTo(x2,y2);c.lineTo(x2-hl*Math.cos(ang+.45),y2-hl*Math.sin(ang+.45));c.stroke();c.restore();}
function wrap(c,s,x,y,maxW,o={}){c.save();c.font=`${o.size||12}px ${FONT[o.font||'sans']}`;const words=String(s).split(' ');let l='',yy=y;const lh=(o.size||12)*1.35;
  for(const w of words){const t=l?l+' '+w:w;if(c.measureText(t).width>maxW&&l){txt(c,l,x,yy,o);l=w;yy+=lh;}else l=t;}if(l)txt(c,l,x,yy,o);c.restore();return yy+lh;}
function axes(c,x0,y0,x1,y1,o={}){line(c,x0,y1,x1,y1,COL.axis,1);line(c,x0,y0,x0,y1,COL.axis,1);if(o.x)mono(c,o.x,x1,y1+28,{align:'right'});if(o.y)mono(c,o.y,x0,y0-10);}
function curve(c,pts,col,w=2,a=.95,dash){c.save();c.strokeStyle=col;c.lineWidth=w;c.globalAlpha=a;if(dash)c.setLineDash(dash);c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();}

/* ---------- controls ---------- */
function makeControls(el,request){let row=null;
  const api={
    row(cls){row=document.createElement('div');row.className='lab-row'+(cls?' '+cls:'');el.appendChild(row);return row;},
    button(label,onClick,o={}){if(!row)api.row();const b=document.createElement('button');b.className=o.quiet?'quiet':'experiment'+(o.primary?'':' secondary');b.innerHTML=label;b.addEventListener('click',()=>{onClick(b);request();});row.appendChild(b);return b;},
    slider(label,o,onInput){const l=document.createElement('label');l.className='slider';const s=document.createElement('span');s.textContent=label;const i=document.createElement('input');i.type='range';i.min=o.min;i.max=o.max;i.step=o.step;i.value=o.value;
      const out=document.createElement('output');const fmt=o.fmt||(v=>v);out.textContent=fmt(+i.value);i.addEventListener('input',()=>{out.textContent=fmt(+i.value);onInput(+i.value);request();});
      l.append(s,i,out);el.appendChild(l);row=null;return{set(v){i.value=v;out.textContent=fmt(+v);},input:i};},
    choice(label,options,value,onChange){api.row();if(label){const s=document.createElement('span');s.className='lab-label';s.textContent=label;row.appendChild(s);}const g=document.createElement('span');g.className='segmented';g.setAttribute('role','group');
      const btns=options.map(([v,t])=>{const b=document.createElement('button');b.textContent=t;b.setAttribute('aria-pressed',String(v===value));b.addEventListener('click',()=>{btns.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));onChange(v);request();});g.appendChild(b);return b;});
      row.appendChild(g);row=null;return{set(v){btns.forEach((b,k)=>b.setAttribute('aria-pressed',String(options[k][0]===v)));}};}};
  return api;}

/* ---------- stage ---------- */
function mount(id,root){const make=window.ProjectVisuals&&window.ProjectVisuals[id];if(!make)return;
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),say=root.querySelector('.scene-result'),legend=root.querySelector('.legend'),controls=root.querySelector('.lab-panel');
  const S={w:1,h:1,dpr:1,raf:0};let vis;
  const request=()=>{if(!S.raf)S.raf=requestAnimationFrame(frame);};
  const paused=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(){S.raf=0;ctx.setTransform(S.dpr,0,0,S.dpr,0,0);ctx.clearRect(0,0,S.w,S.h);ctx.fillStyle=COL.bg;ctx.fillRect(0,0,S.w,S.h);
    ctx.save();ctx.strokeStyle=COL.grid;for(let x=24;x<S.w;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,S.h);ctx.stroke();}for(let y=24;y<S.h;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(S.w,y);ctx.stroke();}ctx.restore();
    if(vis.draw(ctx,S.w,S.h,S.w<560))request();}
  function resize(){const r=canvas.getBoundingClientRect();S.dpr=Math.min(devicePixelRatio||1,2);S.w=Math.max(1,r.width);S.h=Math.max(1,r.height);canvas.width=Math.round(S.w*S.dpr);canvas.height=Math.round(S.h*S.dpr);request();}
  const api={say:t=>{say.textContent=t;canvas.setAttribute('aria-label',t);},request,paused,controls:makeControls(controls,request),narrow:()=>S.w<560};
  vis=make(api);if(legend)legend.innerHTML=vis.legend||'';
  const pt=(type,e)=>{if(!vis.pointer)return;const r=canvas.getBoundingClientRect();vis.pointer(type,e.clientX-r.left,e.clientY-r.top,e);};
  canvas.addEventListener('pointermove',e=>pt('move',e));canvas.addEventListener('pointerdown',e=>pt('down',e));canvas.addEventListener('pointerup',e=>pt('up',e));canvas.addEventListener('pointerleave',e=>pt('leave',e));
  new ResizeObserver(resize).observe(canvas.parentElement);resize();if(vis.start)vis.start();}
window.PV={TAU,COL,FONT,clamp,lerp,now,ease,rng,gauss,phi,Phi,pct,H,line,dot,ring,rect,txt,mono,hand,arrow,wrap,axes,curve,mount};
window.ProjectVisuals=window.ProjectVisuals||{};
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-visual]').forEach(el=>mount(el.dataset.visual,el));});
})();
