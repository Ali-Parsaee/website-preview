'use strict';
/* Five small labs, one per chapter of the story. Each one is a working model, not a picture:
   1. what a test is worth (two Gaussian-process response curves and the value of information)
   2. which follow-up to buy, and for how long, when outcomes are censored
   3. which representation to keep, and how few bits it needs
   4. crowds of agents, and why a shared blind spot puts a floor under their error
   5. when the evidence supports a decision, and when the honest answer is to withhold one
   Everything is drawn in CSS pixels on one canvas; only the active lab draws.
   Visual language: a dark "screen" with 3Blue1Brown-style colours, and hand-written notes on top. */
(function(){
const TAU=Math.PI*2;
const COL={bg:'#12171d',grid:'rgba(236,231,220,.035)',axis:'#46535e',text:'#c9d2d8',dim:'#80909b',faint:'#2c3843',white:'#ece7dc',
  A:'#f4c95d',B:'#58c4dd',green:'#83c167',red:'#fc6255',teal:'#5cd0b3',purple:'#b48ccd',hand:'#efe2c2'};
const FONT={sans:'"Helvetica Neue",Helvetica,Arial,sans-serif',serif:'Georgia,"Times New Roman",serif',
  mono:'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',hand:'"Bradley Hand","Noteworthy","Segoe Print","Comic Sans MS",cursive'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t, now=()=>performance.now();
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function rng(seed){let a=(seed>>>0)||1;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss(r){let u=0;while(u===0)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*r());}
const phi=x=>Math.exp(-.5*x*x)/Math.sqrt(TAU);
function Phi(x){const t=1/(1+.2316419*Math.abs(x)),d=.3989422804*Math.exp(-x*x/2),p=d*t*(.31938153+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>0?1-p:p;}
function chol(A,n){const L=new Float64Array(n*n);for(let i=0;i<n;i++)for(let j=0;j<=i;j++){let s=A[i*n+j];for(let k=0;k<j;k++)s-=L[i*n+k]*L[j*n+k];if(i===j){if(!(s>0))return null;L[i*n+i]=Math.sqrt(s);}else L[i*n+j]=s/L[j*n+j];}return L;}
function cholJ(A,n){let j=1e-10;for(let t=0;t<10;t++){const B=Float64Array.from(A);for(let i=0;i<n;i++)B[i*n+i]+=j;const L=chol(B,n);if(L)return L;j*=10;}return null;}
function fwd(L,b,n){const x=new Float64Array(n);for(let i=0;i<n;i++){let s=b[i];for(let k=0;k<i;k++)s-=L[i*n+k]*x[k];x[i]=s/L[i*n+i];}return x;}
function bwd(L,b,n){const x=new Float64Array(n);for(let i=n-1;i>=0;i--){let s=b[i];for(let k=i+1;k<n;k++)s-=L[k*n+i]*x[k];x[i]=s/L[i*n+i];}return x;}
const argmax=a=>{let b=0;for(let i=1;i<a.length;i++)if(a[i]>a[b])b=i;return b;};
const pct=p=>Math.round(p*100)+'%';
const $=s=>document.querySelector(s);

/* ---------- drawing helpers (all in CSS pixels) ---------- */
function line(c,x1,y1,x2,y2,col,w=1,a=1,dash){c.save();c.globalAlpha=a;c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();}
function dot(c,x,y,r,col,a=1){c.save();c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function ring(c,x,y,r,col,w=1.5,a=1,fill){c.save();c.globalAlpha=a;if(fill){c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.restore();}
function txt(c,s,x,y,o={}){c.save();c.globalAlpha=o.a==null?1:o.a;c.fillStyle=o.col||COL.text;c.font=`${o.italic?'italic ':''}${o.weight||400} ${o.size||12}px ${FONT[o.font||'sans']}`;c.textAlign=o.align||'left';c.textBaseline=o.base||'alphabetic';if(o.halo!==false){c.save();c.globalAlpha=Math.min(1,(o.a==null?1:o.a)*.85);c.strokeStyle=COL.bg;c.lineWidth=3.5;c.lineJoin='round';c.strokeText(s,x,y);c.restore();}c.fillText(s,x,y);c.restore();}
function hand(c,s,x,y,o={}){const size=o.size||15;String(s).split('\n').forEach((l,i)=>txt(c,l,x,y+i*size*1.18,{font:'hand',size,col:o.col||COL.hand,align:o.align||'left',a:o.a==null?.95:o.a}));}
function sketchArrow(c,x1,y1,x2,y2,o={}){
  const col=o.col||COL.hand,bend=o.bend==null?.22:o.bend,mx=(x1+x2)/2,my=(y1+y2)/2,dx=x2-x1,dy=y2-y1,cx=mx-dy*bend,cy=my+dx*bend;
  c.save();c.strokeStyle=col;c.lineWidth=o.w||1.4;c.lineCap='round';c.lineJoin='round';c.globalAlpha=o.a==null?.9:o.a;c.beginPath();
  for(let i=0;i<=26;i++){const t=i/26,x=(1-t)*(1-t)*x1+2*(1-t)*t*cx+t*t*x2,y=(1-t)*(1-t)*y1+2*(1-t)*t*cy+t*t*y2,wb=Math.sin(t*11+x1*.07)*.7;i?c.lineTo(x+wb,y-wb):c.moveTo(x,y);}
  c.stroke();const ang=Math.atan2(y2-cy,x2-cx),hl=8;c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-hl*Math.cos(ang-.45),y2-hl*Math.sin(ang-.45));c.moveTo(x2,y2);c.lineTo(x2-hl*Math.cos(ang+.45),y2-hl*Math.sin(ang+.45));c.stroke();c.restore();}
function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function button(id){return document.getElementById(id);}

/* ---------- the stage ---------- */
const Stage={canvas:null,ctx:null,w:0,h:0,dpr:1,labs:[],active:-1,raf:0,ui:null};
function request(){if(!Stage.raf)Stage.raf=requestAnimationFrame(frame);}
function frame(){Stage.raf=0;const c=Stage.ctx,lab=Stage.labs[Stage.active];if(!c||!lab)return;
  c.setTransform(Stage.dpr,0,0,Stage.dpr,0,0);c.clearRect(0,0,Stage.w,Stage.h);c.fillStyle=COL.bg;c.fillRect(0,0,Stage.w,Stage.h);
  c.save();c.strokeStyle=COL.grid;c.lineWidth=1;for(let x=24;x<Stage.w;x+=48){c.beginPath();c.moveTo(x,0);c.lineTo(x,Stage.h);c.stroke();}for(let y=24;y<Stage.h;y+=48){c.beginPath();c.moveTo(0,y);c.lineTo(Stage.w,y);c.stroke();}c.restore();
  if(lab.draw(c,Stage.w,Stage.h))request();}
function resize(){const r=Stage.canvas.getBoundingClientRect();Stage.dpr=Math.min(window.devicePixelRatio||1,2);Stage.w=Math.max(1,r.width);Stage.h=Math.max(1,r.height);
  Stage.canvas.width=Math.round(Stage.w*Stage.dpr);Stage.canvas.height=Math.round(Stage.h*Stage.dpr);request();}
function pointer(type,e){const lab=Stage.labs[Stage.active];if(!lab||!lab.pointer)return;const r=Stage.canvas.getBoundingClientRect();lab.pointer(type,e.clientX-r.left,e.clientY-r.top,e);}
function makeApi(index){return{
  say:t=>{if(Stage.active!==index)return;Stage.ui.say(t);Stage.canvas.setAttribute('aria-label',t);},
  legend:h=>Stage.ui.legend(h),
  explored:()=>Stage.ui.explored(index),
  paused:()=>Stage.ui.paused(),
  request,
  isActive:()=>Stage.active===index};}

/* =====================================================================================
   LAB 1 — The problem: what is a test worth?
   Two treatments. For each kind of patient (left to right) an unknown curve says how well
   each one works; each curve has a Gaussian-process posterior, and the faint lines are
   worlds that still fit the evidence. The strip is the treatment we would choose today for
   each kind of patient. The bars are the value of one more test: the expected improvement
   in that choice, averaged over patients (a knowledge gradient), against the price of a test.
   ===================================================================================== */
function makeLab1(api){
  const M=81,xs=new Float64Array(M),ell=.13,sn=.45,NW=9,ARMS=['A','B'],RACE_W=40,RACE_N=30,RACE_AT=10;
  for(let i=0;i<M;i++)xs[i]=i/(M-1);
  const K=new Float64Array(M*M);for(let i=0;i<M;i++)for(let j=0;j<M;j++){const d=xs[i]-xs[j];K[i*M+j]=Math.exp(-d*d/(2*ell*ell));}
  const LK=cholJ(K,M);
  const S={seed:3,truth:null,Z:null,obs:[],an:null,vmax:.12,samples:null,prev:null,morph:null,price:.001,hover:null,revealed:false,playing:false,timer:0,pulses:[],stopped:false,mode:'world',race:null,raceJob:0,raceT:0,orng:null,down:null};
  const G={};
  const armCol=a=>a==='A'?COL.A:COL.B;
  const fv=v=>v<1e-4?'almost nothing':v.toPrecision(2);
  const fp=v=>v.toFixed(4).replace(/0+$/,'').replace(/\.$/,'');
  function priorCurve(r){const z=new Float64Array(M);for(let i=0;i<M;i++)z[i]=gauss(r);const t=new Float64Array(M);for(let i=0;i<M;i++){let v=0;for(let k=0;k<=i;k++)v+=LK[i*M+k]*z[k];t[i]=v;}return t;}
  const crossings=(a,b)=>{let c=0;for(let i=1;i<M;i++)if((a[i]>=b[i])!==(a[i-1]>=b[i-1]))c++;return c;};
  function makeTruth(r){let A,B,t=0,c;do{A=priorCurve(r);B=priorCurve(r);c=crossings(A,B);t++;}while(t<60&&(c<1||c>3));return{A,B};}
  function gp(obs){const n=obs.length,mu=new Float64Array(M),C=new Float64Array(M*M);if(!n){C.set(K);return{mu,C};}
    const Koo=new Float64Array(n*n);for(let a=0;a<n;a++)for(let b=0;b<n;b++)Koo[a*n+b]=K[obs[a].i*M+obs[b].i]+(a===b?sn*sn:0);
    const Lo=cholJ(Koo,n),y=new Float64Array(n);for(let a=0;a<n;a++)y[a]=obs[a].y;const al=bwd(Lo,fwd(Lo,y,n),n),V=new Float64Array(n*M),col=new Float64Array(n);
    for(let g=0;g<M;g++){let m=0;for(let a=0;a<n;a++){col[a]=K[obs[a].i*M+g];m+=col[a]*al[a];}mu[g]=m;const v=fwd(Lo,col,n);for(let a=0;a<n;a++)V[a*M+g]=v[a];}
    for(let g=0;g<M;g++)for(let h=g;h<M;h++){let s=K[g*M+h];for(let a=0;a<n;a++)s-=V[a*M+g]*V[a*M+h];C[g*M+h]=C[h*M+g]=s;}
    return{mu,C};}
  const kg2=(d,s)=>{if(s<1e-9)return 0;const u=Math.abs(d)/s;return Math.max(0,s*(phi(u)-u*(1-Phi(u))));};
  function analyse(obs,withValue){
    const P={A:gp(obs.filter(o=>o.arm==='A')),B:gp(obs.filter(o=>o.arm==='B'))},d=new Float64Array(M),pA=new Float64Array(M);
    for(let x=0;x<M;x++){d[x]=P.A.mu[x]-P.B.mu[x];pA[x]=Phi(d[x]/Math.sqrt(Math.max(1e-12,P.A.C[x*M+x]+P.B.C[x*M+x])));}
    const an={P,d,pA,voi:null,best:null};if(!withValue)return an;
    an.voi={A:new Float64Array(M),B:new Float64Array(M)};an.best={arm:'A',i:0,v:-1};
    for(const a of ARMS){const C=P[a].C,out=an.voi[a];for(let j=0;j<M;j++){const den=Math.sqrt(C[j*M+j]+sn*sn);let v=0;for(let x=0;x<M;x++)v+=kg2(d[x],Math.abs(C[x*M+j])/den);out[j]=v/M;if(out[j]>an.best.v)an.best={arm:a,i:j,v:out[j]};}}
    return an;}
  const accuracy=(an,T)=>{let ok=0;for(let x=0;x<M;x++)if((an.d[x]>=0)===(T.A[x]>=T.B[x]))ok++;return ok/M;};
  const shareA=()=>{let n=0;for(let x=0;x<M;x++)if(S.an.d[x]>=0)n++;return Math.round(n/M*100);};
  function curves(an){const out={};for(const a of ARMS){const L=cholJ(an.P[a].C,M),mu=an.P[a].mu;
    out[a]=S.Z[a].map((z,k)=>{const s=new Float64Array(M);for(let i=0;i<M;i++){let v=mu[i];if(k&&L)for(let q=0;q<=i;q++)v+=L[i*M+q]*z[q];s[i]=v;}return s;});}return out;}
  function shown(){if(!S.prev||!S.morph)return S.samples;const p=S.morph.dur?ease(clamp((now()-S.morph.t0)/S.morph.dur,0,1)):1;if(p>=1)return S.samples;
    const o={};for(const a of ARMS)o[a]=S.samples[a].map((s,k)=>{const q=new Float64Array(M),pr=S.prev[a][k];for(let i=0;i<M;i++)q[i]=lerp(pr[i],s[i],p);return q;});return o;}
  function compute(){S.an=analyse(S.obs,true);const ns=curves(S.an);S.prev=S.samples?shown():null;S.samples=ns;S.morph=S.prev?{t0:now(),dur:api.paused()?0:650}:null;}
  function setPlayLabel(){const b=button('c1-play');if(b)b.innerHTML=S.playing?'Pause <span>❚❚</span>':'Let it keep learning <span>▶</span>';}
  function setRaceLabel(){const b=button('c1-race');if(b)b.textContent=S.mode==='race'?'Back to the curves':'Race: learner vs random';}
  function setTruthLabel(){const b=button('c1-truth');if(b)b.textContent=S.revealed?'Hide the truth':'Reveal the truth';}
  function stopPlay(){S.playing=false;clearTimeout(S.timer);setPlayLabel();}
  function newWorld(seed){stopPlay();S.seed=seed;const r=rng(seed*7919+17);S.truth=makeTruth(r);
    S.Z={A:[],B:[]};for(const a of ARMS)for(let k=0;k<=NW;k++){const z=new Float64Array(M);if(k)for(let i=0;i<M;i++)z[i]=gauss(r);S.Z[a].push(z);}
    S.orng=rng(seed*104729+3);S.obs=[];S.revealed=false;S.stopped=false;S.pulses=[];S.samples=null;S.prev=null;S.mode='world';
    compute();S.vmax=S.an.best.v;setRaceLabel();setTruthLabel();}
  function observe(arm,i,who){if(S.mode!=='world')return;const an0=S.an,before=an0.voi[arm][i];
    const y=S.truth[arm][i]+sn*gauss(S.orng);S.obs.push({arm,i,y});S.pulses.push({arm,i,y,t0:now()});compute();api.explored();
    let flips=0;for(let x=0;x<M;x++)if((an0.d[x]>=0)!==(S.an.d[x]>=0))flips++;
    const changed=flips?`It changed the choice for ${Math.max(1,Math.round(flips/M*100))}% of patients.`:'The choice stayed the same.';
    let m;
    if(who==='learner')m=`The learner tested ${arm} where a test was worth most (${fv(before)}). ${changed}`;
    else if(who==='random')m=`A test of ${arm} at a random spot, worth ${fv(before)}${before<S.price?', less than its price':''}. ${changed}`;
    else if(before<S.price)m=`That test of ${arm} was worth ${fv(before)}, less than its price of ${fp(S.price)}. ${flips?changed:'It sharpened a curve where the choice was already clear.'}`;
    else m=`That test of ${arm} was worth ${fv(before)}, more than its price. ${changed}`;
    api.say(m);api.request();}
  function actNow(){const n=S.obs.length;api.say(`No test is worth its price now, so act: A for ${shareA()}% of patients, B for the rest. ${n} test${n===1?'':'s'}, cost ${(n*S.price).toFixed(3)}. Much of both curves is still uncertain, but no single test there would pay for itself.`);}
  function step(){if(!S.playing)return;const b=S.an.best;
    if(b.v<S.price){S.playing=false;S.stopped=true;setPlayLabel();actNow();api.request();return;}
    observe(b.arm,b.i,'learner');S.timer=setTimeout(step,900);}
  function play(){if(S.mode!=='world')toggleRace(false);if(S.playing){stopPlay();api.say('Paused. Click near a curve to test it yourself, or carry on.');return;}S.playing=true;S.stopped=false;setPlayLabel();step();}
  const matchAt=R=>{const goal=R.L[RACE_AT]/R.W;for(let s=0;s<=R.N;s++)if(R.R[s]/R.W>=goal)return s;return null;};
  function raceSummary(){const R=S.race;if(!R||R.done<R.W)return;const l=R.L[RACE_AT]/R.W,m=matchAt(R);
    api.say(`${R.W} new pairs of treatments. After ${RACE_AT} well-chosen tests, ${pct(l)} of patients get the better treatment. Testing at random needs ${m===null?`more than ${R.N}`:m} tests to do as well${m?`: the same decisions for ${Math.round((1-RACE_AT/m)*100)}% fewer tests`:''}.`);}
  function startRace(){const R={W:RACE_W,N:RACE_N,done:0,L:new Float64Array(RACE_N+1),R:new Float64Array(RACE_N+1)};S.race=R;const job=++S.raceJob;
    api.say(`Simulating ${RACE_W} new pairs of treatments. The learner and a random tester each get ${RACE_N} tests.`);
    const one=w=>{const r=rng(5000+w*13),T=makeTruth(r);
      for(let st=0;st<2;st++){const obs=[],r2=rng(9000+w*7+st);for(let s=0;s<=R.N;s++){const an=analyse(obs,st===0&&s<R.N);(st?R.R:R.L)[s]+=accuracy(an,T);
        if(s<R.N){let arm,i;if(st===0){arm=an.best.arm;i=an.best.i;}else{arm=r2()<.5?'A':'B';i=Math.floor(r2()*M);}obs.push({arm,i,y:T[arm][i]+sn*gauss(r2)});}}}
      R.done++;};
    const tick=()=>{if(job!==S.raceJob)return;one(R.done);api.request();if(R.done<R.W)setTimeout(tick,16);else{api.explored();if(S.mode==='race')raceSummary();}};
    setTimeout(tick,30);}
  function toggleRace(on){stopPlay();if(on==null)on=S.mode!=='race';S.mode=on?'race':'world';S.hover=null;setRaceLabel();
    if(on){S.raceT=now();if(!S.race)startRace();else raceSummary();}
    else api.say('Back to the curves. Click near a curve to test it, or let the learner choose.');api.request();}
  function geo(w,h){const n=w<540;G.n=n;G.l=n?28:56;G.r=w-(n?30:50);G.t=n?44:52;G.b=Math.round(h*(n?.5:.53));G.sy=G.b+(n?26:30);G.sh=n?9:11;G.vt=G.sy+G.sh+(n?42:46);G.vb=h-(n?20:24);G.y0=-2.6;G.y1=2.6;}
  const X=i=>G.l+(G.r-G.l)*xs[i], Y=v=>G.b-(v-G.y0)/(G.y1-G.y0)*(G.b-G.t);
  const idxAt=x=>clamp(Math.round((x-G.l)/(G.r-G.l)*(M-1)),0,M-1);
  const barH=v=>(G.vb-G.vt)*Math.sqrt(clamp(v/S.vmax,0,1));
  function armAt(i,y){if(y<=G.b+8){const ws=shown();return Math.abs(Y(ws.A[0][i])-y)<=Math.abs(Y(ws.B[0][i])-y)?'A':'B';}return S.an.voi.A[i]>=S.an.voi.B[i]?'A':'B';}
  function curvePath(c,s){c.beginPath();for(let i=0;i<M;i++){const y=clamp(Y(s[i]),G.t-8,G.b+8);i?c.lineTo(X(i),y):c.moveTo(X(i),y);}}
  function drawWorld(c,w,h){let anim=false;const ws=shown(),an=S.an;if(S.morph&&S.morph.dur&&now()-S.morph.t0<S.morph.dur)anim=true;
    txt(c,'how well it works',G.l,G.t-18,{font:'mono',size:10,col:COL.dim});
    line(c,G.l,Y(0),G.r,Y(0),COL.axis,1,.5);
    // worlds that still fit, then the best guess for each treatment
    for(const a of ARMS){c.save();c.strokeStyle=armCol(a);c.lineWidth=1;c.globalAlpha=.26;for(let k=1;k<ws[a].length;k++){curvePath(c,ws[a][k]);c.stroke();}c.restore();}
    for(const a of ARMS){c.save();c.strokeStyle=armCol(a);c.lineWidth=2.4;c.globalAlpha=.95;curvePath(c,ws[a][0]);c.stroke();c.restore();}
    let ya=Y(ws.A[0][M-1]),yb=Y(ws.B[0][M-1]);if(Math.abs(ya-yb)<20){const m=(ya+yb)/2,s=ya<=yb?-1:1;ya=m+s*10;yb=m-s*10;}
    txt(c,'A',G.r+10,ya+7,{font:'serif',size:G.n?17:21,col:COL.A});txt(c,'B',G.r+10,yb+7,{font:'serif',size:G.n?17:21,col:COL.B});
    if(S.revealed){for(const a of ARMS){c.save();c.strokeStyle=armCol(a);c.lineWidth=1.7;c.globalAlpha=.95;c.setLineDash([2,5]);curvePath(c,S.truth[a]);c.stroke();c.restore();}
      if(!G.n){const i=Math.round(M*.1),top=Math.min(Y(S.truth.A[i]),Y(S.truth.B[i]));hand(c,'dotted: the true curves',X(i),Math.max(G.t+2,top-16),{size:14});}}
    S.obs.forEach(o=>{dot(c,X(o.i),Y(o.y),4.6,COL.bg);dot(c,X(o.i),Y(o.y),3.4,armCol(o.arm));});
    S.pulses=S.pulses.filter(p=>now()-p.t0<900);S.pulses.forEach(p=>{const t=(now()-p.t0)/900;ring(c,X(p.i),Y(p.y),5+t*22,armCol(p.arm),1.6,1-t);anim=true;});
    // the choice we would make today, kind of patient by kind of patient
    const cw=(G.r-G.l)/(M-1);
    txt(c,G.n?'today’s choice':'the treatment we would choose today, for each kind of patient',G.l,G.sy-8,{font:'mono',size:10,col:COL.dim});
    for(let x=0;x<M;x++){c.save();c.globalAlpha=.2+.8*Math.abs(2*an.pA[x]-1);c.fillStyle=an.d[x]>0?COL.A:an.d[x]<0?COL.B:COL.dim;c.fillRect(X(x)-cw/2,G.sy,cw+.6,G.sh);c.restore();}
    txt(c,'kind of patient →',G.r,G.sy+G.sh+16,{font:'mono',size:10,col:COL.dim,align:'right'});
    // what one more test is worth, at each place, for the more valuable treatment to test there
    const bw=Math.max(1.2,cw-1.2),priceY=G.vb-barH(S.price),best=an.best;
    if(!S.hover)txt(c,'value of one more test here',G.l,G.vt-8,{font:'mono',size:10,col:COL.dim});
    for(let x=0;x<M;x++){const a=an.voi.A[x]>=an.voi.B[x]?'A':'B',v=an.voi[a][x],hgt=barH(v),worth=v>=S.price,hov=S.hover&&S.hover.i===x;
      c.save();c.globalAlpha=hov?1:worth?.88:.32;c.fillStyle=worth?armCol(a):COL.dim;c.fillRect(X(x)-bw/2,G.vb-hgt,bw,hgt);c.restore();}
    line(c,G.l,priceY,G.r,priceY,COL.red,1.2,.9,[5,4]);
    txt(c,`price of one test ${fp(S.price)}`,G.r,priceY-5,{font:'mono',size:10,col:COL.red,align:'right'});
    if(best.v>=S.price){const x=X(best.i),y=G.vb-barH(best.v);c.save();c.fillStyle=armCol(best.arm);c.beginPath();c.moveTo(x,y-4);c.lineTo(x-5,y-11);c.lineTo(x+5,y-11);c.fill();c.restore();}
    if(!G.n)txt(c,`${S.obs.length} test${S.obs.length===1?'':'s'} · cost ${(S.obs.length*S.price).toFixed(3)}`,G.r,G.t-18,{font:'mono',size:10,col:COL.dim,align:'right'});
    if(S.hover){const {i,arm}=S.hover,x=X(i),v=an.voi[arm][i];line(c,x,G.t,x,G.vb,COL.white,1,.2);ring(c,x,Y(ws[arm][0][i]),7,armCol(arm),1.5,.95);
      txt(c,`test ${arm} here: worth ${fv(v)}${v>=S.price?'':', below its price'}`,clamp(x,G.l+120,G.r-120),G.vt-8,{font:'mono',size:10,col:v>=S.price?armCol(arm):COL.dim,align:'center'});}
    // hand-written notes
    if(!S.obs.length&&!S.playing){const i=Math.round(M*.3),k=ws.B[2],tx=X(i)+(G.n?8:22),ty=G.t+(G.n?4:8);
      hand(c,'each faint line is a world\nthat still fits the evidence',tx,ty,{size:G.n?13:15});sketchArrow(c,tx+6,ty+26,X(i)+2,clamp(Y(k[i]),G.t+40,G.b-6),{bend:.25});
      if(!G.n){const bi=best.i,left=bi>M*.6,bx=X(bi)+(left?-215:34),by=G.vt+14;hand(c,'what one more test is worth,\nbefore you pay for it',bx,by,{size:14});sketchArrow(c,bx+(left?175:-6),by+6,X(bi)+(left?-4:4),G.vb-barH(best.v)+6,{bend:-.3});}}
    else if(S.stopped&&!G.n){hand(c,'nothing left is worth\nits price: act now',G.r-195,priceY-30,{size:15});
      let bi=-1,bu=0;for(let x=4;x<M-4;x++){if(Math.abs(2*an.pA[x]-1)<.9)continue;const u=an.P.A.C[x*M+x]+an.P.B.C[x*M+x];if(u>bu){bu=u;bi=x;}}
      if(bi>=0&&bu>.25){const a=an.d[bi]>=0?'B':'A',sd=Math.sqrt(an.P[a].C[bi*M+bi]),yy=clamp(Y(an.P[a].mu[bi]+1.6*sd),G.t+30,G.b);const tx=clamp(X(bi)-60,G.l,G.r-190),ty=Math.max(G.t+2,yy-38);
        hand(c,'still unsure here,\nbut the choice is clear',tx,ty,{size:14});sketchArrow(c,tx+40,ty+24,X(bi),yy,{bend:.2});}}
    return anim;}
  function drawRace(c,w,h){const R=S.race;if(!R)return false;const n=Math.max(1,R.done),x0=G.l+30,x1=G.r-10,y0=G.t+26,y1=G.vb-34,X2=s=>x0+(x1-x0)*s/R.N,Y2=p=>y1-(clamp(p,.4,1)-.4)/.6*(y1-y0);
    const p=api.paused()?1:clamp((now()-S.raceT)/1500,0,1);
    for(let q=.4;q<=1.001;q+=.1){line(c,x0,Y2(q),x1,Y2(q),COL.faint,1,.8);txt(c,pct(q),x0-8,Y2(q)+3,{font:'mono',size:10,col:COL.dim,align:'right'});}
    for(let s=0;s<=R.N;s+=5)txt(c,String(s),X2(s),y1+16,{font:'mono',size:10,col:COL.dim,align:'center'});
    txt(c,'tests →',x1,y1+30,{font:'mono',size:10,col:COL.dim,align:'right'});
    txt(c,G.n?`better treatment chosen, ${R.done}/${R.W} worlds`:`patients given the better treatment, averaged over ${R.done} of ${R.W} worlds`,x0,y0-14,{font:'mono',size:10,col:COL.dim});
    [[R.L,COL.green,'choosing where to test'],[R.R,COL.white,'testing at random']].forEach(([a,col,label],k)=>{c.save();c.strokeStyle=col;c.lineWidth=2.4;c.globalAlpha=.95;c.beginPath();
      const upto=p*R.N;for(let s=0;s<=Math.floor(upto);s++){const y=Y2(a[s]/n);s?c.lineTo(X2(s),y):c.moveTo(X2(s),y);}
      const fl=Math.floor(upto);if(fl<R.N){const fr=upto-fl;c.lineTo(lerp(X2(fl),X2(fl+1),fr),lerp(Y2(a[fl]/n),Y2(a[fl+1]/n),fr));}c.stroke();c.restore();
      if(p>=1){dot(c,X2(R.N),Y2(a[R.N]/n),4,col);txt(c,label,X2(R.N)-8,Y2(a[R.N]/n)+(k?16:-10),{size:12,col,align:'right'});}});
    if(p>=1&&R.done>=R.W){const m=matchAt(R),y=Y2(R.L[RACE_AT]/n),xe=m===null?X2(R.N):X2(m);line(c,X2(RACE_AT),y,xe,y,COL.hand,1.3,.85,[3,4]);ring(c,X2(RACE_AT),y,6,COL.green,1.6);if(m!==null)ring(c,xe,y,6,COL.white,1.6);
      if(!G.n)hand(c,m===null?`random testing never\ncatches up in ${R.N} tests`:`random testing needs ${m} tests\nto match ${RACE_AT} chosen ones`,X2(RACE_AT)+14,y+26,{size:15});}
    return p<1||R.done<R.W;}
  function bind(){
    button('c1-best').addEventListener('click',()=>{if(S.mode!=='world')toggleRace(false);stopPlay();const b=S.an.best;observe(b.arm,b.i,'learner');
      if(b.v<S.price)api.say(`Even the best test left was worth only ${fv(b.v)}, less than its price. The learner would have stopped before this one.`);});
    button('c1-play').addEventListener('click',play);
    button('c1-random').addEventListener('click',()=>{if(S.mode!=='world')toggleRace(false);stopPlay();observe(S.orng()<.5?'A':'B',Math.floor(S.orng()*M),'random');});
    button('c1-truth').addEventListener('click',()=>{if(S.mode!=='world')toggleRace(false);S.revealed=!S.revealed;setTruthLabel();
      if(S.revealed)api.say(`In the true world, today’s choice gives ${pct(accuracy(S.an,S.truth))} of patients the better treatment${S.obs.length?'':', by luck alone'}.`);api.explored();api.request();});
    button('c1-new').addEventListener('click',()=>{newWorld(S.seed+1);api.say('A new pair of treatments. Nothing tested yet, so every faint line fits.');api.request();});
    button('c1-race').addEventListener('click',()=>toggleRace());
    const pr=button('c1-price'),out=button('c1-price-out');
    pr.addEventListener('input',()=>{S.price=+pr.value;out.textContent=fp(S.price);S.stopped=false;
      api.say(S.an.best.v>=S.price?'At this price some tests are still worth buying: the coloured bars.':'At this price no test is worth buying. Act on today’s choice.');api.request();});
  }
  newWorld(3);bind();
  button('c1-reset').addEventListener('click',()=>{S.price=.001;button('c1-price').value=.001;button('c1-price-out').textContent=fp(.001);newWorld(3);api.say('Back to the start: two treatments, nothing tested yet. Press “Let it keep learning”, or click near a curve.');api.request();});
  return{title:'Two treatments, and what a test is worth',
    legend:'<i class="lg line a"></i> treatment A <i class="lg line b"></i> treatment B <i class="lg dot a"></i><i class="lg dot b"></i> test results <i class="lg bar a"></i><i class="lg bar b"></i> a test worth its price',
    enter(){api.say(S.obs.length?`${S.obs.length} test${S.obs.length===1?'':'s'} so far. Today’s choice: A for ${shareA()}% of patients, B for the rest.`:'Two treatments. For each kind of patient, left to right, an unknown curve says how well each works: yellow for A, blue for B. The faint lines are worlds that still fit the evidence. The bars show what one more test would be worth, before you pay for it.');},
    leave(){stopPlay();},
    autoplay(){if(!S.playing&&!S.obs.length&&S.mode==='world')play();},
    draw(c,w,h){geo(w,h);return S.mode==='race'?drawRace(c,w,h):drawWorld(c,w,h);},
    pointer(type,x,y){if(S.mode!=='world')return;const inX=x>=G.l-6&&x<=G.r+6,inY=y>=G.t-10&&y<=G.vb+6;
      if(type==='move'){let h=null;if(inX&&inY){const i=idxAt(x);h={i,arm:armAt(i,y)};}if(JSON.stringify(h)!==JSON.stringify(S.hover)){S.hover=h;api.request();}}
      else if(type==='leave'){if(S.hover){S.hover=null;api.request();}S.down=null;}
      else if(type==='down'){S.down={x,y};}
      else if(type==='up'&&S.down&&Math.hypot(x-S.down.x,y-S.down.y)<8&&inX&&inY){const i=idxAt(x);S.down=null;stopPlay();observe(armAt(i,y),i,'you');}},
    touch:'pan-y'};
}

/* =====================================================================================
   LAB 2 — Observe: which follow-up is worth buying, and for how long?
   Twelve patients on two treatments. A filled dot is an event (an answer); an open circle
   is "not yet" (censored). Each arm: exponential event times, Gamma posterior on the rate.
   The learner scores every patient × duration by expected information about "which arm is
   better" per month of follow-up, the idea behind my master's thesis.
   ===================================================================================== */
function makeLab2(api){
  const N=12,HZ=24,BUD=36,DUR=[3,6,12];
  const S={pts:[],budget:BUD,ext:6,seed:11,hover:-1,anims:[],pick:null,better:'A',r:null,down:null};
  const G={};
  const isEv=p=>p.T<=p.F, lab=p=>p.arm+p.k;
  function newCohort(seed){S.seed=seed;const r=rng(seed*613+29);S.better=r()<.5?'A':'B';const rate={A:S.better==='A'?1/22:1/7,B:S.better==='A'?1/7:1/22};
    S.pts=[];for(let i=0;i<N;i++){const arm=i<N/2?'A':'B',T=-Math.log(1-r())/rate[arm],F=Math.round((2+r()*5)*2)/2;S.pts.push({arm,k:i%(N/2)+1,T,F});}
    S.budget=BUD;S.anims=[];S.pick=null;S.r=rng(seed*17+3);meter();}
  function post(arm,pts){let ev=0,ex=0;for(const p of pts||S.pts)if(p.arm===arm){ev+=isEv(p)?1:0;ex+=Math.min(p.T,p.F);}return{a:1+ev,b:8+ex};}
  function pBetter(pa,pb){const m=q=>Math.log(q.a/q.b)-1/(2*q.a),v=q=>1/q.a+1/(2*q.a*q.a);return Phi((m(pb)-m(pa))/Math.sqrt(v(pa)+v(pb)));}
  const Hb=p=>{p=clamp(p,1e-9,1-1e-9);return-(p*Math.log2(p)+(1-p)*Math.log2(1-p));};
  const cert=()=>pBetter(post('A'),post('B'));
  function plan(){const pa=post('A'),pb=post('B'),H0=Hb(pBetter(pa,pb));let best=null;
    for(const p of S.pts){if(isEv(p)||p.F>=HZ)continue;for(const e0 of DUR){const ext=Math.min(e0,HZ-p.F,S.budget);if(ext<=0)continue;const e=ext,q0=p.arm==='A'?pa:pb,lam=q0.a/q0.b,q=1-Math.exp(-lam*ext);
      const extra=q>1e-9?1/lam-ext*Math.exp(-lam*ext)/q:ext,ev={a:q0.a+1,b:q0.b+extra},cn={a:q0.a,b:q0.b+ext};
      const pe=p.arm==='A'?pBetter(ev,pb):pBetter(pa,ev),pc=p.arm==='A'?pBetter(cn,pb):pBetter(pa,cn),val=(H0-(q*Hb(pe)+(1-q)*Hb(pc)))/e;
      if(!best||val>best.val)best={p,e,val};}}return best;}
  function meter(){const m=button('c2-meter'),o=button('c2-budget');if(m)m.style.width=(S.budget/BUD*100)+'%';if(o)o.textContent=`${S.budget} of ${BUD} months left`;}
  function extend(p,e,who){if(isEv(p)||p.F>=HZ||S.budget<=0)return false;e=Math.min(e,S.budget,HZ-p.F);const from=Math.min(p.T,p.F);p.F+=e;S.budget-=e;const to=Math.min(p.T,p.F);
    S.anims.push({p,from,to,t0:now(),dur:api.paused()?0:Math.max(450,(to-from)*85)});meter();api.explored();
    const c=cert(),fv=c>=.5?'A':'B',fp=Math.round(Math.max(c,1-c)*100);
    let m=who==='learner'?`The learner chose ${lab(p)} for +${e} months: the most information per month of follow-up. `:'';
    m+=isEv(p)?`${lab(p)} had the event at month ${p.T.toFixed(1)}: a complete answer.`:`Still “not yet” at month ${p.F}: no event, but now we know ${lab(p)} lasted at least ${p.F} months. That is information too.`;
    m+=` The evidence favours ${fv}: ${fp} in 100.`;
    if(S.budget<=0)m+=` The budget is spent. Which patient to follow, and for how long, under a budget: that is the question of my master’s thesis.`;
    api.say(m);api.request();return true;}
  function geo(w,h){const n=w<560;G.n=n;
    if(!n){G.sx0=74;G.sx1=Math.round(w*.58);G.top=58;G.bot=h-62;G.px0=Math.round(w*.655);G.px1=w-26;G.pt=70;G.pb=Math.round(h*.6);}
    else{G.sx0=48;G.sx1=w-18;G.top=48;G.bot=Math.round(h*.58);G.px0=48;G.px1=w-18;G.pt=G.bot+52;G.pb=h-74;}
    G.gap=14;G.rh=(G.bot-G.top-G.gap)/N;}
  const xT=t=>G.sx0+(G.sx1-G.sx0)*t/HZ, yR=i=>G.top+(i+.5)*G.rh+(i>=N/2?G.gap:0);
  function rowAt(x,y){if(x<G.sx0-40||x>G.sx1+20)return-1;for(let i=0;i<N;i++)if(Math.abs(y-yR(i))<=G.rh/2)return i;return-1;}
  function km(arm){const d=S.pts.filter(p=>p.arm===arm).map(p=>({t:Math.min(p.T,p.F),e:isEv(p)})).sort((a,b)=>a.t-b.t);let s=1,n=d.length;const st=[[0,1]],cs=[];
    for(let i=0;i<d.length;){const t=d[i].t;let ev=0,c=0;while(i<d.length&&d[i].t===t){d[i].e?ev++:c++;i++;}if(ev){s*=1-ev/n;st.push([t,s]);}if(c)cs.push([t,s]);n-=ev+c;}
    return{st,cs,end:d.length?d[d.length-1].t:0};}
  function draw(c,w,h){geo(w,h);let anim=false;
    txt(c,'months of follow-up →',G.sx1,G.bot+(G.n?28:34),{font:'mono',size:10,col:COL.dim,align:'right'});
    for(let t=0;t<=HZ;t+=6){line(c,xT(t),G.top-6,xT(t),G.bot+6,COL.faint,1,.7);txt(c,String(t),xT(t),G.bot+(G.n?16:20),{font:'mono',size:10,col:COL.dim,align:'center'});}
    txt(c,'treatment A',G.sx0,G.top-14,{font:'mono',size:10,col:COL.A});txt(c,'treatment B',G.sx0,yR(N/2)-G.rh/2-6,{font:'mono',size:10,col:COL.B});
    S.anims=S.anims.filter(a=>!a.dur||now()-a.t0<a.dur);
    S.pts.forEach((p,i)=>{const y=yR(i),col=p.arm==='A'?COL.A:COL.B,a=S.anims.find(q=>q.p===p);let end=Math.min(p.T,p.F),done=true;
      if(a){end=lerp(a.from,a.to,ease(clamp((now()-a.t0)/a.dur,0,1)));done=false;anim=true;}
      txt(c,lab(p),G.sx0-12,y+4,{font:'mono',size:10,col,align:'right'});
      if(!isEv(p)&&p.F<HZ)line(c,xT(end),y,xT(HZ),y,COL.dim,1,.28,[2,5]);
      line(c,xT(0),y,xT(end),y,col,2.2,.88);
      if(i===S.hover&&!isEv(p)&&p.F<HZ&&S.budget>0){const e=Math.min(S.ext,S.budget),to=Math.min(HZ,p.F+e);line(c,xT(p.F),y,xT(to),y,col,2.2,.45,[4,4]);txt(c,`+${e} mo`,xT(to)+6,y+4,{font:'mono',size:10,col});}
      if(done&&isEv(p))dot(c,xT(end),y,4.8,col);else ring(c,xT(end),y,4.4,col,1.6,1,COL.bg);
      if(S.pick&&S.pick.p===p&&now()-S.pick.t0<3600){ring(c,xT(end),y,11,COL.hand,1.2,.9);if(!G.n){hand(c,'most information\nper month',xT(end)+16,y-14,{size:13});}anim=true;}});
    // Kaplan–Meier curves on the right (below on small screens)
    const X2=t=>G.px0+(G.px1-G.px0)*t/HZ,Y2=s=>G.pb-(G.pb-G.pt)*s;
    line(c,G.px0,G.pb,G.px1,G.pb,COL.axis,1);line(c,G.px0,G.pt,G.px0,G.pb,COL.axis,1);
    txt(c,'still event-free',G.px0,G.pt-10,{font:'mono',size:10,col:COL.dim});
    [0,12,24].forEach(t=>txt(c,String(t),X2(t),G.pb+14,{font:'mono',size:10,col:COL.dim,align:'center'}));
    [['A',COL.A],['B',COL.B]].forEach(([arm,col])=>{const k=km(arm);c.save();c.strokeStyle=col;c.lineWidth=2;c.beginPath();let lx=G.px0,ly=Y2(1);c.moveTo(lx,ly);
      k.st.slice(1).forEach(([t,s])=>{c.lineTo(X2(t),ly);ly=Y2(s);c.lineTo(X2(t),ly);});c.lineTo(X2(k.end),ly);c.stroke();c.restore();
      k.cs.forEach(([t,s])=>line(c,X2(t),Y2(s)-4,X2(t),Y2(s)+4,col,1.3,.9));});
    // how sure we are about which treatment is better
    const p=cert(),gy=G.pb+(G.n?30:46),gx=G.px0,gw=G.px1-G.px0;
    txt(c,'which keeps patients event-free longer?',gx,gy,{font:'mono',size:10,col:COL.dim});
    c.save();roundRect(c,gx,gy+8,gw,7,3.5);c.clip();c.fillStyle=COL.A;c.fillRect(gx,gy+8,gw*p,7);c.fillStyle=COL.B;c.fillRect(gx+gw*p,gy+8,gw*(1-p),7);c.restore();
    txt(c,`A ${pct(p)}`,gx,gy+30,{font:'mono',size:11,col:COL.A});txt(c,`${pct(1-p)} B`,gx+gw,gy+30,{font:'mono',size:11,col:COL.B,align:'right'});
    if(!G.n){txt(c,`budget: ${S.budget} of ${BUD} months`,gx,gy+54,{font:'mono',size:10,col:COL.dim});c.save();c.globalAlpha=.8;c.fillStyle=COL.faint;c.fillRect(gx,gy+60,gw,4);c.fillStyle=COL.red;c.fillRect(gx,gy+60,gw*S.budget/BUD,4);c.restore();}
    if(S.budget===BUD&&!G.n&&S.pts.some(p=>!isEv(p))){const i=S.pts.findIndex(p=>!isEv(p)),y=yR(i),x=xT(Math.min(S.pts[i].T,S.pts[i].F));hand(c,'open circle: “not yet”.\nclick to watch longer',x+40,y+30,{size:14});sketchArrow(c,x+36,y+24,x+8,y+5,{bend:-.25});}
    return anim;}
  function bind(){
    button('c2-best').addEventListener('click',()=>{const b=plan();if(!b){api.say(S.budget<=0?'The budget is spent.':'Nothing left to follow up: every patient has an answer or reached month 24.');return;}S.pick={p:b.p,t0:now()};extend(b.p,b.e,'learner');});
    button('c2-random').addEventListener('click',()=>{const open=S.pts.filter(p=>!isEv(p)&&p.F<HZ);if(!open.length||S.budget<=0){api.say(S.budget<=0?'The budget is spent.':'Nothing left to follow up.');return;}
      const p=open[Math.floor(S.r()*open.length)],e=DUR[Math.floor(S.r()*3)];S.pick=null;extend(p,e,'random');});
    button('c2-new').addEventListener('click',()=>{newCohort(S.seed+1);api.say('A new cohort of twelve patients. Same question: which treatment keeps them event-free longer?');api.request();});
    document.querySelectorAll('[data-ext]').forEach(b=>b.addEventListener('click',()=>{S.ext=+b.dataset.ext;document.querySelectorAll('[data-ext]').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));api.request();}));
  }
  newCohort(11);bind();
  button('c2-reset').addEventListener('click',()=>{newCohort(11);S.ext=6;document.querySelectorAll('[data-ext]').forEach(a=>a.setAttribute('aria-pressed',String(a.dataset.ext==='6')));api.say('Back to the start: twelve patients, 36 months of follow-up to spend.');api.request();});
  return{title:'Follow-up costs time',
    legend:'<i class="lg dot a"></i><i class="lg dot b"></i> event: an answer <i class="lg ring"></i> “not yet”: censored <i class="lg line dim"></i> the future we haven’t paid to see',
    enter(){api.say('Twelve patients, two treatments. A filled dot is an answer: the event happened. An open circle means “not yet”: they were fine when we last checked. Watching longer costs months of follow-up, and might still end in “not yet”.');},
    draw,
    pointer(type,x,y){const r=rowAt(x,y);
      if(type==='move'){if(r!==S.hover){S.hover=r;api.request();}}
      else if(type==='leave'){S.hover=-1;api.request();}
      else if(type==='down')S.down={x,y};
      else if(type==='up'&&S.down&&Math.hypot(x-S.down.x,y-S.down.y)<8&&r>=0){const p=S.pts[r];S.down=null;
        if(isEv(p))api.say(`${lab(p)} already gave a full answer at month ${p.T.toFixed(1)}.`);else if(p.F>=HZ)api.say(`${lab(p)} reached the end of the study, still event-free.`);else if(S.budget<=0)api.say('The budget is spent.');else{S.pick=null;extend(p,S.ext,'you');}}},
    touch:'pan-y'};
}

/* =====================================================================================
   LAB 3 — Represent: what should we keep?
   120 points in two classes. We keep one number per point: its position along a direction.
   Turn the direction (drag), cut the number to a few bits, or ask a different question.
   ===================================================================================== */
function makeLab3(api){
  const N=120;const S={pts:[],theta:115*Math.PI/180,bits:6,task:1,found:{},best:{},anim:null,drag:false,touched:false};
  const G={};
  (function gen(){const r=rng(2027),u=35*Math.PI/180,ux=Math.cos(u),uy=Math.sin(u),vx=-uy,vy=ux;
    for(let i=0;i<N;i++){const cls=i<N/2?0:1,a=(cls?1:-1)*1.3+gauss(r)*.48,b=gauss(r)*1.85;S.pts.push({x:a*ux+b*vx,y:a*uy+b*vy,c1:cls,c2:(b+gauss(r)*.22)>0?1:0});}})();
  const lab=p=>S.task===1?p.c1:p.c2;
  const proj=th=>{const c=Math.cos(th),s=Math.sin(th);return S.pts.map(p=>p.x*c+p.y*s);};
  function accBits(pr,b){const lo=Math.min(...pr),hi=Math.max(...pr),nb=1<<b,c0=new Array(nb).fill(0),c1=new Array(nb).fill(0);
    pr.forEach((v,i)=>{const k=clamp(Math.floor((v-lo)/(hi-lo+1e-12)*nb),0,nb-1);(lab(S.pts[i])?c1:c0)[k]++;});let t0=0,t1=0;for(let k=0;k<nb;k++){t0+=c0[k];t1+=c1[k];}let b0=0,b1=0,best=Math.max(t0,t1);for(let k=0;k<nb;k++){b0+=c0[k];b1+=c1[k];best=Math.max(best,b0+t1-b1,b1+t0-b0);}return best/N;}
  function fisher(th){const pr=proj(th);let m0=0,m1=0,n0=0,n1=0;pr.forEach((v,i)=>{if(lab(S.pts[i])){m1+=v;n1++;}else{m0+=v;n0++;}});m0/=n0;m1/=n1;
    let v0=0,v1=0;pr.forEach((v,i)=>{if(lab(S.pts[i]))v1+=(v-m1)**2;else v0+=(v-m0)**2;});return(m1-m0)**2/(v0/n0+v1/n1);}
  function bestTheta(){let bt=0,bf=-1;for(let d=0;d<180;d++){const th=d*Math.PI/180,f=fisher(th);if(f>bf){bf=f;bt=th;}}return bt;}
  const norm=t=>{t%=Math.PI;return t<0?t+Math.PI:t;};
  function th(){if(!S.anim)return S.theta;const p=S.anim.dur?ease(clamp((now()-S.anim.t0)/S.anim.dur,0,1)):1;const v=lerp(S.anim.from,S.anim.to,p);if(p>=1){S.theta=norm(S.anim.to);S.anim=null;report();syncSlider();}return v;}
  function animateTo(t){let from=S.theta,d=t-from;while(d>Math.PI/2)d-=Math.PI;while(d<-Math.PI/2)d+=Math.PI;S.anim={from,to:from+d,t0:now(),dur:api.paused()?0:1300};api.request();}
  function syncSlider(){const s=button('c3-angle'),o=button('c3-angle-out');const deg=Math.round(norm(S.theta)*180/Math.PI)%180;if(s)s.value=deg;if(o)o.textContent=deg+'°';}
  function report(){const pr=proj(S.theta),a=accBits(pr,S.bits),hiA=accBits(pr,6),p=Math.round(a*100);
    if(hiA>=.93&&!S.found[S.task]){S.found[S.task]=true;S.best[S.task]=S.theta;api.explored();}
    let m;
    if(S.found[1]&&S.found[2]&&hiA>=.93)m=`Two directions, two questions answered. A memory that keeps a few right summaries can answer both; one that keeps everything pays for detail it never uses.`;
    else if(S.task===2&&!S.found[2]&&hiA<.8)m=`Same points, a different question. The direction that answered the first one is nearly useless here: ${p}% correct. What to keep depends on what you need to answer.`;
    else if(a>=.93&&S.bits<=2)m=`${S.bits} bit${S.bits>1?'s':''} per point, ${p}% correct. Keep the right distinction, and the rest can go.`;
    else if(hiA>=.93&&a<.9)m=`Too few bits: ${S.bits} bit${S.bits>1?'s':''} can’t hold the boundary in the right place yet. ${p}% correct.`;
    else if(hiA>=.93)m=`This direction separates them: ${p}% correct from one number per point. Now try keeping fewer bits.`;
    else if(hiA<.75)m=`We keep one number per point: where it falls along the white line. In this direction the two groups overlap: ${p}% correct. Drag the line to turn it.`;
    else m=`${p}% correct. Closer: keep turning.`;
    api.say(m);}
  function geo(w,h){const n=w<560;G.n=n;
    if(!n){G.cx=Math.round(w*.29);G.cy=Math.round(h*.52);G.R=Math.min(w*.24,h*.38);G.x0=Math.round(w*.57);G.x1=w-30;G.sy=Math.round(h*.5);}
    else{G.R=Math.min(w*.36,h*.21);G.cx=Math.round(w/2);G.cy=Math.round(40+G.R);G.x0=34;G.x1=w-24;G.sy=Math.round(h*.8);}
    G.k=G.R/4.6;}
  const colOf=p=>S.task===1?(p.c1?COL.B:COL.A):(p.c2?COL.purple:COL.teal);
  function draw(c,w,h){geo(w,h);const t=th(),cs=Math.cos(t),sn=Math.sin(t),anim=!!S.anim;
    ring(c,G.cx,G.cy,G.R+8,COL.faint,1,.9);line(c,G.cx-G.R,G.cy,G.cx+G.R,G.cy,COL.faint,1,.6);line(c,G.cx,G.cy-G.R,G.cx,G.cy+G.R,COL.faint,1,.6);
    txt(c,S.task===1?'question 1: is it A or B?':'question 2: which side is it on?',G.cx,G.cy-G.R-22,{font:'mono',size:10,col:COL.dim,align:'center'});
    if(S.task===2&&S.found[1]){const b=S.best[1];line(c,G.cx-Math.cos(b)*G.R,G.cy+Math.sin(b)*G.R,G.cx+Math.cos(b)*G.R,G.cy-Math.sin(b)*G.R,COL.A,1.2,.35,[5,5]);}
    // projections: every point keeps one number, its foot on the line
    S.pts.forEach(p=>{const px=G.cx+p.x*G.k,py=G.cy-p.y*G.k,s=p.x*cs+p.y*sn,fx=G.cx+s*cs*G.k,fy=G.cy-s*sn*G.k;line(c,px,py,fx,fy,colOf(p),.8,.13);});
    S.pts.forEach(p=>dot(c,G.cx+p.x*G.k,G.cy-p.y*G.k,2.7,colOf(p),.95));
    const ex=Math.cos(t)*(G.R+4),ey=Math.sin(t)*(G.R+4);line(c,G.cx-ex,G.cy+ey,G.cx+ex,G.cy-ey,COL.white,1.8,.9);
    ring(c,G.cx+ex,G.cy-ey,7,COL.white,1.6,1,COL.bg);
    if(!S.touched&&!G.n){hand(c,'drag to turn\nthe direction we keep',G.cx+ex+14,G.cy-ey-18,{size:14});}
    // the kept number line, the bins, and the two groups along it
    const pr=proj(t),lo=-4.6,hi=4.6,SX=v=>G.x0+(G.x1-G.x0)*(v-lo)/(hi-lo);
    line(c,G.x0,G.sy,G.x1,G.sy,COL.white,1.3,.8);txt(c,'the one number we keep',G.x0,G.sy+(G.n?30:38),{font:'mono',size:10,col:COL.dim});
    const plo=Math.min(...pr),phi2=Math.max(...pr),nb=1<<S.bits;if(S.bits<=5)for(let k=0;k<=nb;k++){const v=plo+(phi2-plo)*k/nb;line(c,SX(v),G.sy-26,SX(v),G.sy+10,COL.red,1,.55);}
    const hb=28,hc=[new Array(hb).fill(0),new Array(hb).fill(0)];pr.forEach((v,i)=>{const k=clamp(Math.floor((v-lo)/(hi-lo)*hb),0,hb-1);hc[lab(S.pts[i])][k]++;});
    [0,1].forEach(cl=>{const col=S.task===1?(cl?COL.B:COL.A):(cl?COL.purple:COL.teal);c.save();c.globalAlpha=.55;c.fillStyle=col;
      for(let k=0;k<hb;k++){const bh=hc[cl][k]*(G.n?4.5:6),x=SX(lo+(hi-lo)*k/hb);c.fillRect(x+1,G.sy-30-bh-(cl?0:0),(G.x1-G.x0)/hb-2,bh);}c.restore();});
    pr.forEach((v,i)=>dot(c,SX(v),G.sy+(lab(S.pts[i])?7:-7)+((i*37)%7-3)*.6,2.2,colOf(S.pts[i]),.9));
    const a=accBits(pr,S.bits);txt(c,pct(a),G.x1,G.n?G.sy+60:Math.round(h*.24),{font:'serif',size:G.n?30:42,col:COL.white,align:'right'});
    txt(c,`correct, keeping ${S.bits} bit${S.bits>1?'s':''} per point`,G.x1,G.n?G.sy+76:Math.round(h*.24)+18,{font:'mono',size:10,col:COL.dim,align:'right'});
    if(a>=.93&&S.bits<=2&&!G.n){hand(c,'one bit is enough\nwhen it’s the right bit',G.x0,Math.round(h*.18),{size:15});}
    return anim;}
  function bind(){
    const s=button('c3-angle'),bs=button('c3-bits'),bo=button('c3-bits-out');
    s.addEventListener('input',()=>{S.anim=null;S.theta=(+s.value)*Math.PI/180;S.touched=true;button('c3-angle-out').textContent=s.value+'°';report();api.request();});
    bs.addEventListener('input',()=>{S.bits=+bs.value;bo.textContent=S.bits;report();api.request();});
    button('c3-find').addEventListener('click',()=>{S.touched=true;animateTo(bestTheta());});
    button('c3-task').addEventListener('click',()=>{S.task=S.task===1?2:1;button('c3-task').textContent=S.task===1?'Ask a different question':'Back to the first question';report();api.request();});
  }
  bind();
  button('c3-reset').addEventListener('click',()=>{S.anim=null;S.drag=false;S.theta=115*Math.PI/180;S.bits=6;S.task=1;S.found={};S.best={};S.touched=false;button('c3-bits').value=6;button('c3-bits-out').textContent='6';button('c3-task').textContent='Ask a different question';syncSlider();report();api.request();});
  return{title:'The same evidence, kept differently',
    legend:'<i class="lg dot a"></i><i class="lg dot b"></i> two kinds of point <i class="lg line w"></i> the direction we keep <i class="lg line r"></i> bin edges: what a few bits can hold',
    enter(){report();},
    draw,
    pointer(type,x,y,e){const d=Math.hypot(x-G.cx,y-G.cy);
      if(type==='down'&&d<G.R+24){S.drag=true;S.touched=true;S.anim=null;try{Stage.canvas.setPointerCapture(e.pointerId);}catch(err){}}
      if((type==='move'&&S.drag)||(type==='down'&&S.drag)){S.theta=norm(Math.atan2(G.cy-y,x-G.cx));syncSlider();report();api.request();}
      if(type==='up'||type==='leave'){if(S.drag){S.drag=false;report();}}},
    touch:'pan-y'};
}

/* =====================================================================================
   LAB 4 — Collaborate: no one sees the whole picture.
   Each agent guesses a hidden value with its own noise, plus a blind spot shared with agents
   of the same kind. Averaging cancels independent mistakes, never shared ones.
   ===================================================================================== */
function makeLab4(api){
  const SIG=12;const S={seed:5,truth:50,N:4,rho:0,K:1,eps:[],beta:[],born:new Array(64).fill(0)};const G={};
  function regen(seed){S.seed=seed;const r=rng(seed*97+1);S.truth=30+r()*40;S.eps=Array.from({length:64},()=>gauss(r));S.beta=Array.from({length:6},()=>gauss(r));}
  const est=i=>S.truth+SIG*(Math.sqrt(S.rho)*S.beta[i%S.K]+Math.sqrt(1-S.rho)*S.eps[i]);
  const mean=()=>{let s=0;for(let i=0;i<S.N;i++)s+=est(i);return s/S.N;};
  const floorErr=(N,rho,K)=>SIG*Math.sqrt(Math.max(0,rho/K+(1-rho)/N));
  const famCol=k=>[COL.A,COL.B,COL.teal,COL.purple,COL.green,COL.red][k%6];
  function report(){const m=mean(),err=Math.abs(m-S.truth);let beat=0;for(let i=0;i<S.N;i++)if(Math.abs(est(i)-S.truth)>err)beat++;
    let msg;
    if(S.N===1)msg='One agent, one guess, and no way to tell how wrong it is.';
    else if(S.rho===0)msg=`${S.N} agents whose mistakes differ. Their average is off by ${err.toFixed(1)}, closer than ${beat} of the ${S.N} individual guesses. Its typical error shrinks like 1/√N.`;
    else if(S.K===1)msg=`They share a blind spot. Adding more agents of the same kind stops helping: the error levels off near ${floorErr(64,S.rho,1).toFixed(1)}, however large the crowd.`;
    else msg=`${S.K} kinds of agent, each with its own blind spot. Mixing them lowers the floor to about ${floorErr(64,S.rho,S.K).toFixed(1)}: diversity, not size.`;
    api.say(msg);}
  function sync(){const n=button('c4-n'),no=button('c4-n-out'),r=button('c4-rho'),ro=button('c4-rho-out');if(n)n.value=S.N;if(no)no.textContent=S.N;if(r)r.value=S.rho;if(ro)ro.textContent=S.rho.toFixed(2);}
  function setN(n){n=clamp(n,1,64);for(let i=S.N;i<n;i++)S.born[i]=now();S.N=n;sync();report();api.explored();api.request();}
  function geo(w,h){const n=w<560;G.n=n;
    if(!n){G.ax0=50;G.ax1=Math.round(w*.6);G.at=70;G.ab=Math.round(h*.44);G.ly=Math.round(h*.62);G.cx0=Math.round(w*.68);G.cx1=w-28;G.ct=78;G.cb=Math.round(h*.62);}
    else{G.ax0=24;G.ax1=w-24;G.at=48;G.ab=Math.round(h*.27);G.ly=Math.round(h*.41);G.cx0=52;G.cx1=w-22;G.ct=Math.round(h*.66);G.cb=h-40;}}
  const LX=v=>G.ax0+(G.ax1-G.ax0)*clamp(v,0,100)/100;
  function draw(c,w,h){geo(w,h);let anim=false;
    const cols=Math.min(S.N,G.n?16:16),rows=Math.ceil(S.N/cols);
    for(let i=0;i<S.N;i++){const cx=i%cols,ry=Math.floor(i/cols),ax=G.ax0+(G.ax1-G.ax0)*(cx+.5)/cols,ay=G.at+(G.ab-G.at)*(rows===1?.5:ry/(rows-1)),
      age=(now()-S.born[i])/600,k=clamp(age,0,1),e=est(i),col=famCol(i%S.K);if(age<1)anim=true;
      const tx=lerp(ax,LX(e),ease(k)),ty=lerp(ay,G.ly,ease(k));
      line(c,ax,ay,tx,ty,col,1,.28);dot(c,ax,ay,4.6*(.4+.6*ease(k)),col);if(k>=1)line(c,LX(e),G.ly-7,LX(e),G.ly+7,col,1.6,.85);}
    line(c,G.ax0,G.ly,G.ax1,G.ly,COL.white,1.2,.75);for(let v=0;v<=100;v+=20)txt(c,String(v),LX(v),G.ly+20,{font:'mono',size:10,col:COL.dim,align:'center'});
    const m=mean();line(c,LX(S.truth),G.ly-48,LX(S.truth),G.ly+28,COL.white,1.4,.9,[4,4]);txt(c,'the true answer',LX(S.truth),G.ly+42,{font:'mono',size:10,col:COL.white,align:'center'});
    ring(c,LX(m),G.ly,10,COL.green,2.2,1,COL.bg);txt(c,'the crowd’s answer',LX(m),G.ly-18,{font:'mono',size:10,col:COL.green,align:LX(m)>LX(S.truth)?'left':'right'});
    if(Math.abs(LX(m)-LX(S.truth))>3){line(c,LX(S.truth),G.ly+56,LX(m),G.ly+56,COL.red,2,.9);txt(c,`off by ${Math.abs(m-S.truth).toFixed(1)}`,(LX(m)+LX(S.truth))/2,G.ly+72,{font:'mono',size:10,col:COL.red,align:'center'});}
    // typical error against crowd size
    const XN=n=>G.cx0+(G.cx1-G.cx0)*Math.log(n)/Math.log(64),YE=e=>G.cb-(G.cb-G.ct)*clamp(e/(SIG*1.05),0,1);
    line(c,G.cx0,G.cb,G.cx1,G.cb,COL.axis,1);line(c,G.cx0,G.ct,G.cx0,G.cb,COL.axis,1);
    txt(c,'typical error',G.cx0,G.ct-10,{font:'mono',size:10,col:COL.dim});[1,4,16,64].forEach(n=>txt(c,String(n),XN(n),G.cb+14,{font:'mono',size:10,col:COL.dim,align:'center'}));
    txt(c,'agents →',G.cx1,G.cb+28,{font:'mono',size:10,col:COL.dim,align:'right'});
    const curve=(rho,K,col,label)=>{c.save();c.strokeStyle=col;c.lineWidth=2;c.beginPath();for(let n=1;n<=64;n++){const x=XN(n),y=YE(floorErr(n,rho,K));n>1?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.restore();txt(c,label,G.cx1,YE(floorErr(64,rho,K))-6,{font:'mono',size:10,col,align:'right'});};
    curve(0,1,COL.green,'mistakes differ');if(S.rho>0)curve(S.rho,1,COL.red,'one shared blind spot');if(S.rho>0&&S.K>1)curve(S.rho,S.K,COL.teal,`${S.K} kinds mixed`);
    dot(c,XN(S.N),YE(floorErr(S.N,S.rho,S.K)),5,COL.white);
    if(S.N<=4&&S.rho===0&&!G.n){hand(c,'add agents, or give them\nthe same blind spot',G.ax1-170,G.at-10,{size:14});}
    return anim;}
  function bind(){
    const n=button('c4-n'),r=button('c4-rho');
    n.addEventListener('input',()=>setN(+n.value));
    r.addEventListener('input',()=>{S.rho=+r.value;sync();report();api.explored();api.request();});
    button('c4-add').addEventListener('click',()=>setN(S.N+1));
    button('c4-diverse').addEventListener('click',()=>{S.K=Math.min(6,S.K+1);if(S.rho===0){S.rho=.5;}if(S.N<2*S.K)setN(2*S.K);sync();report();api.explored();api.request();});
    button('c4-new').addEventListener('click',()=>{regen(S.seed+1);report();api.request();});
  }
  regen(5);bind();sync();
  button('c4-reset').addEventListener('click',()=>{regen(5);S.N=4;S.rho=0;S.K=1;S.born.fill(0);sync();report();api.request();});
  return{title:'Many partial views',
    legend:'<i class="lg dot a"></i> an agent and its guess <i class="lg ring g"></i> the crowd’s average <i class="lg line r"></i> its error',
    enter(){report();},draw,touch:'pan-y'};
}

/* =====================================================================================
   LAB 5 — Decide: what can we conclude?
   A study estimates the benefit of personalizing a treatment. Its 90% interval either clears
   the bar ("personalize"), falls short of it ("one rule is enough"), or straddles it
   ("withhold"). Run it once, or a hundred times, at different sizes.
   ===================================================================================== */
function makeLab5(api){
  const TAU2=2.0,DELTA=.1,LO=-.6,HI=1.0;const S={truth:.2,n:120,last:null,many:null,showTruth:false,seed:9,r:null};const G={};
  const se=n=>TAU2/Math.sqrt(n);
  const verdict=(e,n)=>{const h=1.645*se(n);return e-h>DELTA?'act':e+h<DELTA?'one':'withhold';};
  const VC={act:COL.green,one:COL.B,withhold:COL.red},VT={act:'Personalize',one:'One rule is enough',withhold:'Withhold: it can’t tell yet'};
  function newTruth(seed){S.seed=seed;const r=rng(seed*7+3);S.truth=[0,.05,.2,.35,.5][Math.floor(r()*5)];S.r=rng(seed*11+5);S.last=null;S.many=null;S.showTruth=false;}
  const nFromSlider=v=>Math.round(10*Math.pow(10,v/100*2.5));
  function run(){const e=S.truth+se(S.n)*gauss(S.r);S.last={e,n:S.n,v:verdict(e,S.n),t0:now()};S.many=null;api.explored();
    const h=1.645*se(S.n);let m=`One study of ${S.n} patients: estimated benefit ${e.toFixed(2)} ± ${h.toFixed(2)}. Verdict: ${VT[S.last.v].toLowerCase()}.`;
    if(S.last.v==='withhold')m+=' Declining to conclude is an honest result, not a failure.';api.say(m);api.request();}
  function runMany(){const arr=[];for(let k=0;k<100;k++){const e=S.truth+se(S.n)*gauss(S.r);arr.push({e,v:verdict(e,S.n)});}S.many={arr,n:S.n,t0:now()};S.showTruth=true;S.last=null;api.explored();
    const c={act:0,one:0,withhold:0};arr.forEach(a=>c[a.v]++);const worth=S.truth>DELTA;
    let m=`100 studies of ${S.n} patients each: personalize ${c.act}, one rule ${c.one}, withhold ${c.withhold}. The true benefit was ${S.truth.toFixed(2)}, ${worth?'worth personalizing':'not worth personalizing'}.`;
    m+=worth?(c.act<50?' With this few patients a real benefit usually goes unseen: the honest answer is “collect more”, not “no”.':' With enough patients, the real benefit shows.'):(c.act>5?' A few studies still claim a benefit that isn’t there. Requiring the whole interval to clear the line keeps that rare.':' Requiring the whole interval to clear the line keeps false claims rare.');
    api.say(m);api.request();}
  function sync(){const o=button('c5-n-out');if(o)o.textContent=S.n;}
  function geo(w,h){const n=w<560;G.n=n;G.x0=n?28:56;G.x1=w-(n?20:40);G.ly=Math.round(h*(n?.66:.68));G.top=n?70:84;}
  const X=v=>G.x0+(G.x1-G.x0)*(v-LO)/(HI-LO);
  function draw(c,w,h){geo(w,h);let anim=false;
    c.save();c.globalAlpha=.06;c.fillStyle=COL.green;c.fillRect(X(DELTA),G.top,X(HI)-X(DELTA),G.ly-G.top);c.restore();
    line(c,G.x0,G.ly,G.x1,G.ly,COL.white,1.3,.8);for(let v=-.6;v<=1.001;v+=.2)txt(c,v.toFixed(1),X(v),G.ly+18,{font:'mono',size:10,col:COL.dim,align:'center'});
    txt(c,'estimated benefit of personalizing →',G.x1,G.ly+34,{font:'mono',size:10,col:COL.dim,align:'right'});
    line(c,X(0),G.top,X(0),G.ly,COL.dim,1,.6);txt(c,'no benefit',X(0)-6,G.top+12,{font:'mono',size:10,col:COL.dim,align:'right'});
    line(c,X(DELTA),G.top,X(DELTA),G.ly,COL.green,1.4,.85,[5,4]);txt(c,'worth personalizing',X(DELTA)+6,G.top+12,{font:'mono',size:10,col:COL.green});
    if(S.showTruth){line(c,X(S.truth),G.top+24,X(S.truth),G.ly,COL.hand,1.6,.95,[2,4]);txt(c,'the true benefit',X(S.truth)+6,G.top+38,{font:'hand',size:15,col:COL.hand});}
    if(S.last){const L=S.last,s=se(L.n),h1=1.645*s,p=api.paused()?1:clamp((now()-L.t0)/700,0,1);if(p<1)anim=true;const peak=(G.ly-G.top)*.62;
      c.save();c.globalAlpha=.16*ease(p);c.fillStyle=VC[L.v];c.beginPath();c.moveTo(X(LO),G.ly);for(let i=0;i<=200;i++){const v=LO+(HI-LO)*i/200,z=(v-L.e)/s;c.lineTo(X(v),G.ly-peak*ease(p)*Math.exp(-.5*z*z));}c.lineTo(X(HI),G.ly);c.fill();c.restore();
      line(c,X(L.e-h1),G.ly-10,X(L.e+h1),G.ly-10,VC[L.v],5,.95);dot(c,X(L.e),G.ly-10,6,COL.white);
      txt(c,VT[L.v],G.n?G.x0:X(.5),G.top-24,{font:'serif',size:G.n?20:26,col:VC[L.v],align:G.n?'left':'center',a:ease(p)});
      if(!G.n)hand(c,'the interval is what\nwe can honestly claim',X(L.e+h1)+16,G.ly-56,{size:14,a:ease(p)});}
    if(S.many){const arr=S.many.arr,bins={},bw=(HI-LO)/80,p=api.paused()?1:clamp((now()-S.many.t0)/1200,0,1),show=Math.floor(arr.length*p);if(p<1)anim=true;
      for(let k=0;k<show;k++){const a=arr[k],b=Math.round((a.e-LO)/bw);bins[b]=(bins[b]||0)+1;const y=G.ly-8-(bins[b]-1)*7;if(y>G.top)dot(c,X(LO+b*bw),y,3,VC[a.v],.95);}
      const cnt={act:0,one:0,withhold:0};arr.slice(0,show).forEach(a=>cnt[a.v]++);
      txt(c,G.n?`act ${cnt.act} · one rule ${cnt.one} · withhold ${cnt.withhold}`:`personalize ${cnt.act}   ·   one rule ${cnt.one}   ·   withhold ${cnt.withhold}`,G.n?G.x0:X(.2),G.top-24,{font:'mono',size:G.n?10:13,col:COL.white,align:G.n?'left':'center'});}
    if(!S.last&&!S.many){txt(c,`a study of ${S.n} patients is ready`,X(.2),G.top-24,{font:'mono',size:12,col:COL.dim,align:'center'});if(!G.n)hand(c,'run it, and see what\nthe evidence lets us say',X(.3),G.ly-120,{size:15});}
    return anim;}
  function bind(){const s=button('c5-n');S.n=nFromSlider(+s.value);s.addEventListener('input',()=>{S.n=nFromSlider(+s.value);sync();S.last=null;S.many=null;api.say(`${S.n} patients per study. Run it once, or a hundred times.`);api.request();});
    button('c5-run').addEventListener('click',run);button('c5-many').addEventListener('click',runMany);
    button('c5-new').addEventListener('click',()=>{newTruth(S.seed+1);api.say('A new true benefit, hidden. Run a study to find out what the evidence can say.');api.request();});}
  newTruth(9);bind();sync();
  button('c5-reset').addEventListener('click',()=>{newTruth(9);button('c5-n').value=43;S.n=nFromSlider(43);sync();api.say(`Back to the start: a hidden true benefit, and a study of ${S.n} patients ready to run.`);api.request();});
  return{title:'From evidence to a decision',
    legend:'<i class="lg bar g"></i> personalize <i class="lg bar b"></i> one rule is enough <i class="lg bar r"></i> withhold: it can’t tell yet',
    enter(){api.say('A study estimates whether a personalized treatment rule beats one rule for everyone. Its uncertainty decides what we may honestly say: act, don’t, or withhold.');},draw,touch:'pan-y'};
}

/* ---------- public interface ---------- */
window.Labs={
  mount(canvas,ui){Stage.canvas=canvas;Stage.ctx=canvas.getContext('2d');Stage.ui=ui;
    const makers=[makeLab1,makeLab2,makeLab3,makeLab4,makeLab5];
    Stage.labs=makers.map((mk,i)=>{try{return mk(makeApi(i));}catch(err){console.error('lab',i+1,err);return{title:'',legend:'',enter(){},draw(){return false;}};}});
    canvas.addEventListener('pointermove',e=>pointer('move',e));canvas.addEventListener('pointerdown',e=>pointer('down',e));
    canvas.addEventListener('pointerup',e=>pointer('up',e));canvas.addEventListener('pointerleave',e=>pointer('leave',e));canvas.addEventListener('pointercancel',e=>pointer('leave',e));
    new ResizeObserver(resize).observe(canvas.parentElement);resize();return this;},
  show(i){const old=Stage.labs[Stage.active];if(old&&old.leave)old.leave();Stage.active=i;const lab=Stage.labs[i];if(!lab)return;
    Stage.canvas.style.touchAction=lab.touch||'pan-y';Stage.ui.legend(lab.legend||'');if(Stage.ui.title)Stage.ui.title(lab.title||'');if(lab.enter)lab.enter();request();},
  autoplay(i){const lab=Stage.labs[i];if(lab&&lab.autoplay&&Stage.active===i)lab.autoplay();},
  redraw:request
};
})();
