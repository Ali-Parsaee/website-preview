'use strict';
(function(){const {COL,clamp,now,rng,gauss,pct,H,line,dot,ring,rect,txt,mono,hand,arrow,axes,curve}=PV;const V=window.ProjectVisuals;

/* 6. LoopBench: agents on an odd cycle with two colours. A perfect colouring is impossible; the best is one
   conflict. Identical deterministic agents flip together forever. Agents that notice the loop and change
   their own rule break the symmetry. Simulated agents; the benchmark numbers quoted are the paper's. */
V.loopbench=api=>{const S={N:5,agent:'greedy',seed:1,hist:[],timer:0};
  function reset(){const r=rng(S.seed);S.r=r;S.col=Array(S.N).fill(0);S.wait=Array(S.N).fill(0);S.rule=Array(S.N).fill(false);S.hist=[S.col.slice()];S.round=0;}
  const conf=(col,i)=>(col[i]===col[(i+1)%S.N])+(col[i]===col[(i+S.N-1)%S.N]);
  const total=col=>col.reduce((a,_,i)=>a+(col[i]===col[(i+1)%S.N]?1:0),0);
  function step(){const c=S.col,n=c.slice();for(let i=0;i<S.N;i++){const k=conf(c,i);
      if(S.agent==='greedy'){if(k>0)n[i]=1-c[i];}
      else if(S.agent==='random'){if(k>0&&S.r()<.5)n[i]=1-c[i];}
      else{const h=S.hist,osc=h.length>=3&&h[h.length-1][i]!==h[h.length-2][i]&&h[h.length-2][i]!==h[h.length-3][i];if(osc&&!S.rule[i])S.rule[i]=true;
        if(!S.rule[i]){if(k>0)n[i]=1-c[i];}else if(k===2){if(S.wait[i]>0)S.wait[i]--;else{n[i]=1-c[i];S.wait[i]=1+Math.floor(S.r()*3);}}}}
    S.col=n;S.hist.push(n.slice());S.round++;}
  function stats(){const h=S.hist.slice(-20),minC=1,prox=h.filter(c=>total(c)===minC).length/h.length;let changes=0;for(let k=1;k<h.length;k++)if(h[k].some((v,i)=>v!==h[k-1][i]))changes++;return{prox,stab:1-changes/Math.max(1,h.length-1),now:total(S.col)};}
  function say(){const s=stats(),d={greedy:'Identical, deterministic agents: every conflicted agent flips at once, so the ring flips back and forth forever.',random:'Agents that flip at random when in conflict get close to the best colouring, but keep moving the conflict around the ring.',reflective:'Agents that look at their own history, notice the loop and adopt a new rule (wait a random number of rounds, accept a single conflict) settle into the best possible colouring and stay there.'}[S.agent];
    api.say(`Round ${S.round}: ${s.now} conflict${s.now===1?'':'s'} (the minimum on an odd ring is 1). ${d}`);}
  const c=api.controls;const go=()=>{if(S.timer){clearInterval(S.timer);S.timer=0;return;}S.timer=setInterval(()=>{step();say();api.request();if(S.round>=60){clearInterval(S.timer);S.timer=0;}},api.paused()?40:380);};
  c.button('Play <span>▶</span>',go,{primary:true});c.button('One round',()=>{step();say();});c.button('Start over <span>↺</span>',()=>{clearInterval(S.timer);S.timer=0;reset();say();});
  c.choice('Agents',[['greedy','identical greedy'],['random','random flippers'],['reflective','reflect on their history']],'greedy',v=>{S.agent=v;clearInterval(S.timer);S.timer=0;reset();say();});
  c.choice('Ring',[[3,'3 nodes'],[5,'5 nodes'],[11,'11 nodes']],5,v=>{S.N=v;clearInterval(S.timer);S.timer=0;reset();say();});
  reset();
  return{legend:'<i class="lg dot a"></i><i class="lg dot b"></i> the two colours <i class="lg line r"></i> a conflict: neighbours share a colour',start:say,
    draw(c,w,h,n){const cx=n?w/2:w*.27,cy=n?h*.28:h*.5,R=Math.min(n?w*.3:w*.19,n?h*.2:h*.34),P=i=>[cx+R*Math.sin(i/S.N*2*Math.PI),cy-R*Math.cos(i/S.N*2*Math.PI)];
      for(let i=0;i<S.N;i++){const j=(i+1)%S.N,[x1,y1]=P(i),[x2,y2]=P(j),bad=S.col[i]===S.col[j];line(c,x1,y1,x2,y2,bad?COL.red:COL.faint,bad?3:1.5);}
      for(let i=0;i<S.N;i++){const [x,y]=P(i);dot(c,x,y,n?12:15,S.col[i]?COL.B:COL.A);if(S.rule[i])ring(c,x,y,n?17:21,COL.hand,1.3,.9);}
      const hx=n?20:w*.55,hy=n?h*.55:50,hw=n?w-40:w*.4,hh=n?h*.38:h-100,rows=S.hist.slice(-30),cw=hw/S.N,rh=Math.min(14,hh/30);
      mono(c,'rounds ↓ (last 30) · one column per agent',hx,hy-10);rows.forEach((r,k)=>r.forEach((v,i)=>rect(c,hx+i*cw+1,hy+k*rh,cw-2,rh-2,v?COL.B:COL.A,.85)));
      if(!n&&S.agent==='greedy'&&S.round>3)hand(c,'stuck in a loop:\nthe stripes never end',hx-150,hy+70,{size:14});
      if(!n&&S.agent==='reflective'&&S.rule.some(x=>x))hand(c,'circled agents changed\ntheir own rule',cx-60,cy+R+44,{size:14});
      return false;}};
};

/* 7. From Signals to Structure: a Lewis signalling game with simple learning agents. Agents that keep a
   persistent notebook keep their conventions; agents that only see a rolling window forget them once the
   code space is large. A toy model of the paper's LLM experiments, not those experiments. */
V.signals=api=>{const NO=8,NC=4,R=200,WIN=40,RE=20;const S={cap:12,seed:1,res:null,sweep:null,t0:0};
  function play(cap,mode,seed){const r=rng(seed),log=[],ws=[...Array(NO)].map(()=>Array(cap).fill(1)),wr=[...Array(cap)].map(()=>Array(NO).fill(1)),acc=[];
    const pick=w=>{const s=w.reduce((a,b)=>a+b,0);let u=r()*s;for(let k=0;k<w.length;k++){u-=w[k];if(u<=0)return k;}return w.length-1;};
    for(let t=0;t<R;t++){const cand=[];while(cand.length<NC){const o=Math.floor(r()*NO);if(!cand.includes(o))cand.push(o);}const tgt=cand[0];
      let sw,rw;if(mode==='notebook'){sw=ws[tgt];rw=wr;}else{sw=Array(cap).fill(1);rw=[...Array(cap)].map(()=>Array(NO).fill(1));for(const e of log.slice(-WIN))if(e.ok){if(e.t===tgt)sw[e.s]+=RE;rw[e.s][e.t]+=RE;}}
      const sig=pick(sw),g=cand[pick(cand.map(o=>rw[sig][o]))],ok=g===tgt;acc.push(ok?1:0);log.push({t:tgt,s:sig,ok});if(ok){ws[tgt][sig]+=RE;wr[sig][tgt]+=RE;}}
    return acc;}
  const roll=a=>a.map((_,i)=>{const s=a.slice(Math.max(0,i-19),i+1);return s.reduce((x,y)=>x+y,0)/s.length;});
  function run(){const avg=m=>{const out=Array(R).fill(0);for(let s=0;s<6;s++){const a=play(S.cap,m,S.seed*100+s);a.forEach((v,i)=>out[i]+=v/6);}return roll(out);};S.res={notebook:avg('notebook'),window:avg('window')};S.t0=now();}
  function sweep(){const caps=[4,6,8,12,16,25,32],late=(m,c)=>{let s=0;for(let k=0;k<6;k++){const a=play(c,m,900+k);s+=a.slice(150).reduce((x,y)=>x+y,0)/50;}return s/6;};S.sweep=caps.map(c=>({c,nb:late('notebook',c),wi:late('window',c)}));
    api.say('Late-game accuracy (rounds 151–200) as the number of available signals grows. In this toy, agents that only see a rolling window do best with a moderate number of signals and get worse as the code space outgrows what they can track, while notebook agents keep improving with more room. The paper found the same pattern with LLM agents: a persistent notebook reached 0.867 ± 0.023 at capacity 25, and capacity 8 (one signal per object) was a fragile point, not an optimum.');}
  const c=api.controls;c.slider('Signals available (channel capacity)',{min:4,max:32,step:1,value:12},v=>{S.cap=v;run();say();});
  c.row();c.button('Sweep channel sizes <span>→</span>',sweep,{primary:true});c.button('New game',()=>{S.seed++;run();say();});c.button('Start over <span>↺</span>',()=>{S.cap=12;S.seed=1;S.sweep=null;run();say();});
  function say(){const f=m=>S.res[m].slice(-1)[0];api.say(`${NO} objects, ${NC} shown each round, ${S.cap} possible signals. After ${R} rounds the notebook agents are right ${pct(f('notebook'))} of the time; agents that only remember the last ${WIN} rounds, ${pct(f('window'))}. Chance is 25%.`);}
  run();
  return{legend:'<i class="lg line g"></i> persistent notebook <i class="lg line w"></i> rolling window only <i class="lg line dim"></i> chance (25%)',start:say,
    draw(c,w,h,n){const x0=n?36:60,x1=n?w-16:(S.sweep?w*.55:w-30),y0=50,y1=h-50,X=t=>x0+(x1-x0)*t/R,Y=a=>y1-(y1-y0)*a;axes(c,x0,y0,x1,y1,{x:'rounds →',y:'how often the receiver picks the right object'});
      for(let a=0;a<=1;a+=.25)mono(c,pct(a),x0-6,Y(a)+3,{align:'right'});line(c,x0,Y(.25),x1,Y(.25),COL.dim,1,.6,[3,5]);
      const p=api.paused()?1:clamp((now()-S.t0)/1600,0,1),k=Math.floor(R*p);[['notebook',COL.green],['window',COL.white]].forEach(([m,col])=>curve(c,S.res[m].slice(0,k).map((v,i)=>[X(i),Y(v)]),col,2.2));
      if(S.sweep&&!n){const sx=w*.62,sw=w*.33,Xc=cc=>sx+sw*Math.log(cc/4)/Math.log(8);axes(c,sx,y0,sx+sw,y1,{x:'signals available',y:'late-game accuracy'});
        [['nb',COL.green],['wi',COL.white]].forEach(([k2,col])=>{curve(c,S.sweep.map(s=>[Xc(s.c),Y(s[k2])]),col,2);S.sweep.forEach(s=>dot(c,Xc(s.c),Y(s[k2]),3,col));});S.sweep.forEach(s=>mono(c,String(s.c),Xc(s.c),y1+14,{align:'center'}));}
      return p<1;}};
};

/* 8. Memory is communication: the remembering–signalling frontier. A target repeats with probability q;
   keeping more of the history lowers the message needed to identify it. Exact entropies for this toy process. */
V.communication=api=>{const S={q:.6,N:8};
  function need(m){const g=2**m,s=S.N/g;let h=0;for(let y=0;y<s;y++){const p=[];for(let x=0;x<S.N;x++){const inG=x<s;let v=0;for(let yy=0;yy<s;yy++)v+=(x===yy?S.q:(1-S.q)/(S.N-1))/s;p.push(v);}h=H(p);break;}return h;}
  const c=api.controls;c.slider('Chance the target repeats from the last round',{min:0,max:.95,step:.05,value:.6,fmt:v=>pct(v)},v=>{S.q=v;say();});
  c.choice('Possible targets',[[4,'4'],[8,'8'],[16,'16']],8,v=>{S.N=v;say();});
  c.row();c.button('Start over <span>↺</span>',()=>{S.q=.6;S.N=8;say();});
  function say(){const lg=Math.log2(S.N);api.say(`With no memory the message must carry ${need(0).toFixed(2)} bits. Remembering the last target (${lg} bits) cuts that to ${need(lg).toFixed(2)}. The more predictable the history, the less there is to say. In the paper's first referential games, targets that repeated came with shorter successful messages, while a hidden cyclic rule did not shorten them: predictability only helps if the agent can use its history.`);}
  return{legend:'<i class="lg line g"></i> least message needed for each memory size <i class="lg bar g"></i> achievable region',start:say,
    draw(c,w,h,n){const lg=Math.log2(S.N),x0=n?44:80,x1=w-(n?20:60),y0=60,y1=h-60,X=m=>x0+(x1-x0)*m/lg,Y=b=>y1-(y1-y0)*b/lg;axes(c,x0,y0,x1,y1,{x:'memory kept (bits) →',y:'message needed (bits)'});
      for(let m=0;m<=lg;m++){mono(c,String(m),X(m),y1+14,{align:'center'});mono(c,String(m),x0-8,Y(m)+3,{align:'right'});}
      const pts=[];for(let m=0;m<=lg;m++)pts.push([X(m),Y(need(m))]);c.save();c.globalAlpha=.1;c.fillStyle=COL.green;c.beginPath();c.moveTo(X(0),y0);pts.forEach(([x,y])=>c.lineTo(x,y));c.lineTo(X(lg),y0);c.closePath();c.fill();c.restore();
      for(const q2 of[.2,.4,.8])if(Math.abs(q2-S.q)>.05){const o=S.q;S.q=q2;const pp=[];for(let m=0;m<=lg;m++)pp.push([X(m),Y(need(m))]);S.q=o;curve(c,pp,COL.dim,1,.5,[3,4]);}
      curve(c,pts,COL.green,2.6);pts.forEach(([x,y])=>dot(c,x,y,4,COL.green));
      if(!n){hand(c,'the frontier: any point above\nit reaches the same accuracy',X(lg*.45),Y(need(Math.round(lg*.45)))-48,{size:14});mono(c,'dashed: other repeat rates',x1,y0+4,{align:'right'});}
      return false;}};
};

/* 9. Cooperative observation: what a personal AI can observe depends on whether its help earns the access.
   Illustrative dynamics, not data. */
V.cooperative=api=>{const S={quality:.6,cost:.35,seed:2};
  function sim(){const r=rng(S.seed),a=[.2],u=[];let T=0;for(let t=0;t<52;t++){const ac=a[a.length-1],use=clamp(S.quality*Math.sqrt(ac)+.12*gauss(r),0,1);u.push(use);T=.7*T+.3*(use-S.cost*ac-.15);a.push(clamp(ac+.12*T,0,1));}return{a,u};}
  const c=api.controls;c.slider('How well the system turns observation into help',{min:.1,max:1,step:.05,value:.6,fmt:v=>v.toFixed(2)},v=>{S.quality=v;say();});
  c.slider('Privacy and effort cost of sharing',{min:0,max:1,step:.05,value:.35,fmt:v=>v.toFixed(2)},v=>{S.cost=v;say();});
  c.row();c.button('Another year',()=>{S.seed++;say();});c.button('Start over <span>↺</span>',()=>{S.quality=.6;S.cost=.35;S.seed=2;say();});
  function say(){const {a}=sim(),end=a[a.length-1];api.say(end>.6?`Help that is useful and inspectable earns more access, and more access makes the help better: by week 52 the system sees ${pct(end)} of what it could.`:end<.15?`Help that costs more than it gives makes the user narrow the channel, and less observation makes the help worse: by week 52 access has shrunk to ${pct(end)}.`:`The loop is balanced: access settles near ${pct(end)}.`);}
  return{legend:'<i class="lg line a"></i> how much the system may observe <i class="lg line b"></i> how useful its help was',start:say,
    draw(c,w,h,n){const {a,u}=sim(),x0=n?36:60,x1=n?w-16:w*.6,y0=50,y1=h-50,X=t=>x0+(x1-x0)*t/52,Y=v=>y1-(y1-y0)*v;axes(c,x0,y0,x1,y1,{x:'weeks →'});
      curve(c,u.map((v,t)=>[X(t),Y(v)]),COL.B,1.6,.8);curve(c,a.map((v,t)=>[X(t),Y(v)]),COL.A,2.6);mono(c,'access',X(52),Y(a[52])-8,{align:'right',col:COL.A});
      if(!n){const cx=w*.8,cy=h*.48,R=Math.min(w*.13,h*.3),lab=['observe','model the user','act','user evaluates'],ang=k=>-Math.PI/2+k*Math.PI/2,P=k=>[cx+R*Math.cos(ang(k)),cy+R*Math.sin(ang(k))];
        for(let k=0;k<4;k++){const [x1b,y1b]=P(k),[x2,y2]=P((k+1)%4);arrow(c,x1b,y1b,x2,y2,{bend:-.25,col:COL.dim});}
        lab.forEach((l,k)=>{const [x,y]=P(k);dot(c,x,y,6,COL.white);txt(c,l,x,y+(k===0?-14:k===2?22:4),{size:12,col:COL.white,align:k===1?'left':k===3?'right':'center'});});
        hand(c,'trust decides what\nit may see next',cx-60,cy+R+46,{size:14});}
      return false;}};
};

/* 10. Predicting bowel resection in paediatric Crohn disease: an individual survival distribution gives each
   patient a whole curve, not one risk score. Illustrative curves only; the error figures are the paper's. */
V.crohns=api=>{const S={pen:false,str:false,peri:false,t:3};
  const lam=()=>12*(S.pen?.45:1)*(S.str?.6:1)*(S.peri?.75:1),surv=(t,l)=>Math.exp(-Math.pow(t/l,1.3));
  const c=api.controls;c.choice('Penetrating disease',[[false,'no'],[true,'yes']],false,v=>{S.pen=v;say();});c.choice('Stricturing disease',[[false,'no'],[true,'yes']],false,v=>{S.str=v;say();});c.choice('Perianal modifier',[[false,'no'],[true,'yes']],false,v=>{S.peri=v;say();});
  const sl=c.slider('Read the curve at year',{min:.5,max:10,step:.5,value:3},v=>{S.t=v;say();});
  c.row();c.button('Start over <span>↺</span>',()=>{Object.assign(S,{pen:false,str:false,peri:false,t:3});sl.set(3);say();});
  function say(){const p=1-surv(S.t,lam());api.say(`For this illustrative patient, the curve gives a ${pct(p)} chance of a first elective bowel resection by year ${S.t}. A single risk score would give one number; an individual survival distribution gives the whole timeline. In the paper (934 children), the models' predicted times were off by 755 days on average from baseline data, and 840 days with week-10 data added.`);}
  return{legend:'<i class="lg line a"></i> this patient: chance of no resection yet <i class="lg line dim"></i> a typical patient',start:say,
    draw(c,w,h,n){const x0=n?40:70,x1=w-(n?16:40),y0=50,y1=h-50,X=t=>x0+(x1-x0)*t/10,Y=v=>y1-(y1-y0)*v;axes(c,x0,y0,x1,y1,{x:'years after diagnosis →',y:'chance of no bowel resection yet'});
      for(let t=0;t<=10;t+=2)mono(c,String(t),X(t),y1+14,{align:'center'});for(let v=0;v<=1;v+=.25)mono(c,pct(v),x0-6,Y(v)+3,{align:'right'});
      const pts=l=>{const o=[];for(let t=0;t<=10;t+=.1)o.push([X(t),Y(surv(t,l))]);return o;};curve(c,pts(12),COL.dim,1.5,.7,[4,4]);curve(c,pts(lam()),COL.A,2.8);
      const yv=surv(S.t,lam());line(c,X(S.t),y1,X(S.t),Y(yv),COL.white,1,.5,[3,4]);dot(c,X(S.t),Y(yv),5,COL.white);txt(c,`${pct(1-yv)} resected by year ${S.t}`,X(S.t)+10,Y(yv)-8,{size:12,col:COL.white});
      if(!n)hand(c,'each patient gets a whole\ncurve, not one number',X(5.5),Y(.88),{size:15});return false;}};
};

/* 11. A post-radiation safety net: flag patients at high risk of early death so they get closer monitoring.
   Simulated scores tuned so the operating point matches the paper's (recall 0.92, precision 0.10, 4% prevalence). */
V.radiation=api=>{const NP=2000,S={thr:.4};const r=rng(4);const pts=[...Array(NP)].map((_,i)=>{const pos=i<80;return{pos,s:pos?1.81+gauss(r):gauss(r),k:r()};}).sort((a,b)=>a.k-b.k);
  const PAPER=(()=>{const ps=pts.filter(p=>p.pos).map(p=>p.s).sort((a,b)=>a-b);return +(ps[6]-.001).toFixed(3);})();S.thr=PAPER;
  const met=()=>{let tp=0,fp=0;for(const p of pts)if(p.s>=S.thr){p.pos?tp++:fp++;}return{rec:tp/80,prec:tp/Math.max(1,tp+fp),flag:tp+fp,tp};};
  const c=api.controls;const sl=c.slider('Flag patients with a risk score above',{min:-1.5,max:3,step:.05,value:PAPER,fmt:v=>v.toFixed(2)},v=>{S.thr=v;say();});
  c.row();c.button('Jump to the paper’s operating point',()=>{S.thr=PAPER;sl.set(PAPER);say();},{primary:true});c.button('Start over <span>↺</span>',()=>{S.thr=PAPER;sl.set(PAPER);say();});
  function say(){const m=met();api.say(`${m.flag} of ${NP} patients flagged. The net catches ${m.tp} of the 80 who are truly at risk (recall ${m.rec.toFixed(2)}); ${pct(m.prec)} of flags are true (precision). For a safety net, missing someone costs more than an extra check. The paper's model on 235,035 SEER patients reached recall 0.92 at precision 0.10.`);}
  return{legend:'<i class="lg dot r"></i> truly high risk <i class="lg dot w"></i> not high risk <i class="lg ring"></i> flagged for monitoring',start:say,
    draw(c,w,h,n){const cols=n?40:50,cell=Math.min((w-(n?30:60))/cols,(h-120)/(NP/cols)),x0=(w-cell*cols)/2,y0=40;
      pts.forEach((p,i)=>{const x=x0+(i%cols+.5)*cell,y=y0+(Math.floor(i/cols)+.5)*cell,f=p.s>=S.thr;dot(c,x,y,cell*.28,p.pos?COL.red:COL.white,p.pos?1:f?.55:.18);if(f)ring(c,x,y,cell*.42,p.pos?COL.green:COL.A,1,.8);});
      const m=met(),by=y0+cell*(NP/cols)+26;txt(c,`recall ${m.rec.toFixed(2)}`,x0,by,{size:15,col:COL.green,font:'serif'});txt(c,`precision ${m.prec.toFixed(2)}`,x0+150,by,{size:15,col:COL.A,font:'serif'});
      mono(c,'paper: recall 0.92 · precision 0.10 · 4% prevalence · C-index 0.80 (Cox model)',x0,by+22);return false;}};
};
})();
