'use strict';
(function(){const {COL,clamp,now,rng,gauss,phi,Phi,pct,line,dot,ring,rect,txt,mono,hand,arrow,axes,curve}=PV;const V=window.ProjectVisuals;

/* 12. Synchronous vs asynchronous RL on a real robot: a synchronous agent stops acting while it learns;
   an asynchronous one keeps acting. Simulated reaching task; the findings quoted are the paper's. */
V.robot=api=>{const S={U:150,t:0,run:false,last:0,seed:1};const ACT=40,DUR=20000;
  function reset(){const r=rng(S.seed);S.targets=[...Array(12)].map(()=>[.15+.7*r(),.15+.7*r()]);S.arm={sync:[.5,.5],async:[.5,.5]};S.next={sync:0,async:0};S.err={sync:0,async:0};S.acts={sync:0,async:0};S.t=0;S.blocks={sync:[],async:[]};}
  const tgt=t=>S.targets[Math.floor(t/1700)%S.targets.length];
  function adv(dt){const end=Math.min(DUR,S.t+dt);while(S.t<end){S.t+=10;const T=tgt(S.t);for(const m of['sync','async']){if(S.t>=S.next[m]){const a=S.arm[m];a[0]+=.45*(T[0]-a[0]);a[1]+=.45*(T[1]-a[1]);S.acts[m]++;const cyc=m==='sync'?ACT+S.U:ACT;S.next[m]=S.t+cyc;S.blocks[m].push([S.t,m==='sync'?S.U:0]);}
      const a=S.arm[m];S.err[m]+=Math.hypot(T[0]-a[0],T[1]-a[1])*10;}}}
  function frame(){if(!S.run)return;const n=now(),dt=Math.min(100,(n-S.last))*2;S.last=n;adv(dt);api.request();if(S.t>=DUR){S.run=false;say(true);}else requestAnimationFrame(frame);}
  const c=api.controls;c.button('Run 20 seconds <span>▶</span>',()=>{reset();S.run=true;S.last=now();if(api.paused()){adv(DUR);S.run=false;say(true);}else requestAnimationFrame(frame);},{primary:true});
  c.button('Start over <span>↺</span>',()=>{S.run=false;S.U=150;sl.set(150);reset();say();});
  const sl=c.slider('Time for one learning update (ms)',{min:0,max:400,step:10,value:150},v=>{S.U=v;S.run=false;reset();say();});
  function say(done){if(done){const g=S.err.sync/S.err.async;api.say(`In 20 seconds the asynchronous agent acted ${S.acts.async} times, the synchronous one ${S.acts.sync}. Its average distance from the moving target was ${g>1?g.toFixed(1)+'× smaller':'about the same'}. On the real arm (100 runs, 200 hours), asynchronous learning learned faster and earned more reward, even when it made fewer learning updates.`);}
    else api.say(`A synchronous agent acts, then stops to learn for ${S.U} ms, then acts again: one action every ${ACT+S.U} ms. An asynchronous agent learns in parallel and acts every ${ACT} ms. The target keeps moving either way. Press run.`);}
  reset();
  return{legend:'<i class="lg dot a"></i> moving target <i class="lg dot w"></i> robot hand <i class="lg bar b"></i> acting <i class="lg bar r"></i> paused to learn',start:()=>say(false),
    draw(c,w,h,n){const T=tgt(S.t),boxes=[['sync','synchronous: act, then learn'],['async','asynchronous: learn while acting']];const bw=n?(w-48)/2:Math.min(w*.4,h*.55),by=40;
      boxes.forEach(([m,l],k)=>{const bx=n?16+k*(bw+16):w*.06+k*(bw+w*.08);rect(c,bx,by,bw,bw,COL.faint,.35);mono(c,l,bx,by-8);
        dot(c,bx+T[0]*bw,by+T[1]*bw,7,COL.A);const a=S.arm[m];line(c,bx+bw/2,by+bw,bx+a[0]*bw,by+a[1]*bw,COL.white,3,.6);dot(c,bx+a[0]*bw,by+a[1]*bw,6,COL.white);
        txt(c,`${S.acts[m]} actions`,bx,by+bw+18,{size:12,col:COL.white});
        const ly=by+bw+(n?30:34),lw=bw,t0=Math.max(0,S.t-1200);rect(c,bx,ly,lw,10,COL.faint,.5);for(const [t,u] of S.blocks[m]){if(t<t0)continue;const x=bx+lw*(t-t0)/1200;rect(c,x,ly,Math.max(1,lw*ACT/1200),10,COL.B,.9);if(u)rect(c,x+lw*ACT/1200,ly,lw*u/1200,10,COL.red,.7);}});
      mono(c,`${(S.t/1000).toFixed(1)} s`,w-(n?14:30),h-12,{align:'right'});if(!n&&S.U>0)hand(c,'red: the robot\nstands still to learn',w*.06+bw*.55,by+bw+70,{size:14});return false;}};
};

/* 13. Polyherbal treatments for Alzheimer's disease: a systematic review that connected herbs, their
   flavonoids and the mechanisms they act on. Click a node to follow its connections. */
V.biology=api=>{const N={herbs:['Ginkgo biloba','Camellia sinensis (tea)','Glycyrrhiza uralensis','Cyperus rotundus','Bupleurum falcatum'],comps:['quercetin','kaempferol'],
    mech:['less Aβ plaque formation','less tau hyperphosphorylation','less oxidative stress','less neuroinflammation','BDNF and PI3K/AKT signalling restored'],out:['slower cognitive decline (proposed)']};
  const E=[];N.herbs.forEach((_,i)=>{E.push(['h'+i,'c0']);E.push(['h'+i,'c1']);});[0,1,2,4].forEach(m=>E.push(['c0','m'+m]));[2,3,4].forEach(m=>E.push(['c1','m'+m]));N.mech.forEach((_,m)=>E.push(['m'+m,'o0']));
  const S={sel:'c1'};const c=api.controls;c.button('Follow kaempferol',()=>{S.sel='c1';say();},{primary:true});c.button('Follow quercetin',()=>{S.sel='c0';say();});c.button('Start over <span>↺</span>',()=>{S.sel='c1';say();});
  const name=k=>({h:N.herbs,c:N.comps,m:N.mech,o:N.out})[k[0]][+k.slice(1)];
  function lit(){const on=new Set([S.sel]);const walk=(fwd)=>{const st=[S.sel];while(st.length){const v=st.pop();for(const [a,b] of E){const nx=fwd?(a===v?b:null):(b===v?a:null);if(nx&&!on.has(nx)){on.add(nx);st.push(nx);}}}};walk(true);walk(false);return on;}
  function say(){const k=S.sel;api.say(k==='c1'?'Kaempferol had far less direct evidence than quercetin. Using what is known about quercetin, the review proposed that kaempferol calms neuroinflammation, keeps cells working, and restores signalling that supports neuroplasticity.':k==='c0'?'Quercetin, a flavonoid in all five herbs, acted on several mechanisms at once in pre-clinical studies: plaque formation, tau, oxidative stress and growth-factor signalling.':`${name(k)}: click any node to follow its connections. The review followed PRISMA guidelines and concluded that a kaempferol- and quercetin-rich herbal mix could treat several kinds of Alzheimer's-related damage at once.`);}
  return{legend:'<i class="lg dot g"></i> herb <i class="lg dot a"></i> flavonoid <i class="lg dot b"></i> mechanism <i class="lg dot r"></i> outcome',start:say,
    draw(c,w,h,n){const cols=n?[.08,.34,.6,.92]:[.06,.3,.55,.94],P={};const place=(arr,k,ci)=>arr.forEach((_,i)=>{P[k+i]=[w*cols[ci],50+(h-90)*(i+.5)/arr.length];});
      place(N.herbs,'h',0);place(N.comps,'c',1);place(N.mech,'m',2);place(N.out,'o',3);const on=lit();S.P=P;
      E.forEach(([a,b])=>{const A=P[a],B=P[b],o=on.has(a)&&on.has(b);line(c,A[0],A[1],B[0],B[1],o?COL.A:COL.faint,o?2:1,o?.85:.6);});
      const colr={h:COL.green,c:COL.A,m:COL.B,o:COL.red};Object.keys(P).forEach(k=>{const [x,y]=P[k],o=on.has(k);dot(c,x,y,k===S.sel?9:6,colr[k[0]],o?1:.35);
        if(!n||k[0]!=='m'){if(k[0]==='o')txt(c,name(k),x,y-16,{size:n?10:12,col:o?COL.white:COL.dim,align:'right'});else txt(c,name(k),x+12,y+4,{size:n?10:12,col:o?COL.white:COL.dim});}});
      if(!n)mono(c,'herbs → flavonoids → mechanisms → outcome',w*.06,30);return false;},
    pointer(type,x,y){if(type!=='up'||!S.P)return;let best=null,bd=22;for(const k in S.P){const d=Math.hypot(S.P[k][0]-x,S.P[k][1]-y);if(d<bd){bd=d;best=k;}}if(best){S.sel=best;say();api.request();}}};
};

/* 14. Censor-aware causal experiments (manuscript under review; illustration of the question only).
   Patients whose event is unlikely to be observed carry little information per enrolment, so where a
   trial recruits matters most in the patient groups that can tell the candidate policies apart. */
V.causal=api=>{const S={c1:.2,c2:.8,where:2,seed:1};
  const c=api.controls;c.slider('Censoring in group 1 (events never observed)',{min:0,max:.95,step:.05,value:.2,fmt:pct},v=>{S.c1=v;say();});c.slider('Censoring in group 2',{min:0,max:.95,step:.05,value:.8,fmt:pct},v=>{S.c2=v;say();});
  c.choice('The candidate policies disagree about',[[1,'group 1'],[2,'group 2']],2,v=>{S.where=v;say();});c.row();c.button('Start over <span>↺</span>',()=>{Object.assign(S,{c1:.2,c2:.8,where:2});say();});
  const need=()=>{const w=1-(S.where===1?S.c1:S.c2);return Math.round(60/Math.max(.02,w));};
  function say(){const w=1-(S.where===1?S.c1:S.c2);api.say(`Only ${pct(w)} of patients in group ${S.where} will have their event observed, so each one enrolled there carries about ${w.toFixed(2)} of an answer. Telling the two policies apart needs roughly ${need()} enrolments in that group in this sketch. What matters is the event rate in the group where the policies differ, not the trial's overall censoring rate.`);}
  return{legend:'<i class="lg dot a"></i> event observed: informative <i class="lg ring"></i> censored: “not yet”',start:say,
    draw(c,w,h,n){const r=rng(S.seed);[[1,S.c1],[2,S.c2]].forEach(([g,cs],k)=>{const x0=n?20:50,y0=60+k*(h-100)/2,cw=w-(n?40:100),key=g===S.where;
        txt(c,`group ${g}${key?' · the policies disagree here':''}`,x0,y0-12,{size:12,col:key?COL.A:COL.dim});
        for(let i=0;i<40;i++){const x=x0+(i%20+.5)*cw/20,y=y0+Math.floor(i/20)*22+10,obs=r()>cs;obs?dot(c,x,y,6,key?COL.A:COL.white,key?1:.5):ring(c,x,y,5.5,key?COL.A:COL.dim,1.4,key?.9:.5,COL.bg);}
        mono(c,`${pct(1-cs)} of events observed`,x0+cw,y0+66,{align:'right',col:key?COL.A:COL.dim});});
      mono(c,'illustration of the question · results are under review',w-(n?12:30),h-12,{align:'right'});return false;}};
};

/* 15. Is personalization worth it? (manuscript; illustration only). A learned rule can beat observed
   practice only because one treatment for everyone already would. Split the gain into the two parts. */
V.personalization=api=>{const S={d:4,tau:3,n:2000};
  const parts=()=>{const base=60,prac=base+S.d/2,uni=base+Math.max(S.d,0),z=S.d/S.tau,learn=base+(S.d*Phi(z)+S.tau*phi(z));return{prac,uni,learn,div:uni-prac,inc:learn-uni};};
  const c=api.controls;c.slider('Average benefit of treatment A over B (points)',{min:-6,max:10,step:.5,value:4},v=>{S.d=v;say();});c.slider('How much the benefit varies between patients',{min:.2,max:10,step:.2,value:3},v=>{S.tau=v;say();});
  c.slider('Patients in the evaluation',{min:200,max:20000,step:200,value:2000,fmt:v=>v.toLocaleString()},v=>{S.n=v;say();});c.row();c.button('Start over <span>↺</span>',()=>{Object.assign(S,{d:4,tau:3,n:2000});say();});
  function verdict(){const p=parts(),se=40/Math.sqrt(S.n),lo=p.inc-1.645*se,hi=p.inc+1.645*se;return{p,lo,hi,v:lo>1?'personalize':hi<1?'one rule is enough':'withhold the verdict'};}
  function say(){const {p,lo,hi,v}=verdict();api.say(`Compared with observed practice, the learned rule gains ${(p.learn-p.prac).toFixed(1)} points. But ${p.div.toFixed(1)} of those come from giving everyone the better treatment; personalizing adds only ${p.inc.toFixed(1)} (90% interval ${lo.toFixed(1)} to ${hi.toFixed(1)}). Verdict: ${v}.`);}
  return{legend:'<i class="lg bar w"></i> observed practice <i class="lg bar b"></i> gain from one treatment for everyone <i class="lg bar g"></i> extra gain from personalizing',start:say,
    draw(c,w,h,n){const {p,lo,hi,v}=verdict(),x0=n?30:80,x1=w-(n?20:80),y0=60,y1=h-90,lo2=50,hi2=75,Y=val=>y1-(y1-y0)*(val-lo2)/(hi2-lo2),bw=(x1-x0)/5;
      const bars=[['observed practice',p.prac,COL.white],['one treatment for everyone',p.uni,COL.B],['learned rule',p.learn,COL.green]];
      bars.forEach(([l,val,col],k)=>{const x=x0+(k*1.6+.4)*bw;rect(c,x,Y(val),bw,y1-Y(val),col,.8);txt(c,val.toFixed(1),x+bw/2,Y(val)-8,{size:13,col,align:'center',font:'serif'});mono(c,l,x+bw/2,y1+16,{align:'center',size:n?8:10});});
      const xu=x0+(1.6+.4)*bw,xl=x0+(3.2+.4)*bw;line(c,xu+bw+6,Y(p.prac),xu+bw+6,Y(p.uni),COL.B,2);line(c,xl+bw+6,Y(p.uni),xl+bw+6,Y(p.learn),COL.green,2);
      txt(c,v,x1,y0-20,{size:20,font:'serif',align:'right',col:v==='personalize'?COL.green:v==='withhold the verdict'?COL.red:COL.B});txt(c,`personalizing adds ${p.inc.toFixed(1)} points · 90% interval ${lo.toFixed(1)} to ${hi.toFixed(1)} · ${S.n.toLocaleString()} patients`,x1,y0+2,{size:11,font:'mono',align:'right',col:COL.dim});
      if(!n)hand(c,'the “dividend”: no\npersonalization needed',xu,Y(p.uni)-46,{size:14});mono(c,'simulated · outcome = % of patients with a good outcome',x0,h-14);return false;}};
};

/* 16. Generalization versus memorization (manuscript; illustration only): two hand-built networks that
   both classify parity correctly. One encodes the rule, one memorizes each input. Cost = sum of squared weights. */
V.generalization=api=>{const S={k:2,net:'rule'};
  function nets(k){const pts=[];for(let m=0;m<2**k;m++)pts.push([...Array(k)].map((_,i)=>(m>>i)&1?1:-1));
    const lab=x=>x.filter(v=>v>0).length%2?1:-1;
    const lookup={units:pts.map(p=>({w:p,b:-(k-1),a:lab(p)})),c:0};
    // exact construction: parity is a function of s = sum(x); interpolate it piecewise-linearly with one ReLU per knot
    const rule={units:[...Array(k)].map((_,j)=>({w:Array(k).fill(1),b:k-2*j,a:j===0?1:(j%2?-2:2)})),c:-1};
    const out=(net,x)=>net.units.reduce((s,u)=>s+u.a*Math.max(0,u.w.reduce((q,wi,i)=>q+wi*x[i],0)+u.b),net.c);
    const fit=net=>{const zs=pts.map(p=>out(net,p)*lab(p));const m=Math.min(...zs);const sc=m>0?1/m:1;net.units.forEach(u=>u.a*=sc);net.c*=sc;return pts.every(p=>out(net,p)*lab(p)>0);};
    const cost=net=>net.units.reduce((s,u)=>s+u.w.reduce((q,v)=>q+v*v,0)+u.b*u.b+u.a*u.a,0)+net.c*net.c;
    const okL=fit(lookup),okR=fit(rule);return{pts,lab,lookup,rule,out,costL:cost(lookup),costR:cost(rule),okL,okR};}
  const c=api.controls;c.choice('Show the network that',[['rule','encodes the rule'],['lookup','memorizes each input']],'rule',v=>{S.net=v;say();});
  c.slider('Input bits (parity of k bits)',{min:2,max:8,step:1,value:2},v=>{S.k=v;say();});c.row();c.button('Start over <span>↺</span>',()=>{S.k=2;S.net='rule';say();});
  function say(){const r=nets(S.k);api.say(`Both networks get every one of the ${2**S.k} inputs right. The rule uses ${r.rule.units.length} hidden units at a weight cost of ${r.costR.toFixed(1)}; the lookup table uses ${r.lookup.units.length} units at ${r.costL.toFixed(1)}. Weight decay favours the rule, and more so as inputs grow. Whether training actually finds the cheapest network is a separate question, and the subject of the manuscript.`);}
  return{legend:'<i class="lg dot a"></i><i class="lg dot b"></i> the two classes <i class="lg bar g"></i> weight cost of each network',start:say,
    draw(c,w,h,n){const r=nets(S.k),net=S.net==='rule'?r.rule:r.lookup;
      if(S.k===2){const sz=n?Math.min(w-40,h*.5):Math.min(w*.42,h-80),x0=n?20:40,y0=40,G=40;for(let i=0;i<G;i++)for(let j=0;j<G;j++){const x=[-1.6+3.2*(i+.5)/G,1.6-3.2*(j+.5)/G],v=r.out(net,x);rect(c,x0+i*sz/G,y0+j*sz/G,sz/G+.5,sz/G+.5,v>0?COL.B:COL.A,.16);}
        r.pts.forEach(p=>{const X=x0+(p[0]+1.6)/3.2*sz,Y=y0+(1.6-p[1])/3.2*sz;dot(c,X,Y,9,r.lab(p)>0?COL.B:COL.A);});mono(c,'XOR: the decision regions this network draws',x0,y0-10);}
      else{const k=S.k,x0=n?24:50,pw=n?w-48:w*.42,y0=60,ph=n?h*.42:h-130;
        if(S.net==='rule'){// every input sits at its count of 1-bits; the rule network's output depends only on that count
          const X=m=>x0+pw*m/k,zr=s2=>net.units.reduce((t,u)=>t+u.a*Math.max(0,s2+u.b),net.c),zs=[];for(let i=0;i<=200;i++){const s2=-k+2*k*i/200;zs.push([s2,zr(s2)]);}
          const zmax=Math.max(...zs.map(q=>Math.abs(q[1])))||1,Y=z=>y0+ph/2-(ph/2-10)*z/zmax;line(c,x0,Y(0),x0+pw,Y(0),COL.axis,1,.8);
          const cnt=Array(k+1).fill(0);r.pts.forEach(p=>{const m=p.filter(v=>v>0).length,j=cnt[m]++;const zc=Y(zr(2*m-k));dot(c,X(m)+((j%9)-4)*3.2,(r.lab(p)>0?zc+9+Math.floor(j/9)*6:zc-9-Math.floor(j/9)*6),2.4,r.lab(p)>0?COL.B:COL.A,.9);});
          curve(c,zs.map(([s2,z])=>[X((s2+k)/2),Y(z)]),COL.green,2.4);for(let m=0;m<=k;m++)mono(c,String(m),X(m),y0+ph+16,{align:'center'});
          mono(c,'number of 1-bits in the input →',x0+pw,y0+ph+32,{align:'right'});mono(c,`all ${2**k} inputs, grouped by count · green: network output`,x0,y0-12);
          if(!n)hand(c,'the rule only needs\nthe count: a zigzag',x0+pw*.55,y0+12,{size:14});}
        else{const nu=2**k,cols=Math.ceil(Math.sqrt(nu*1.6)),cs=Math.min(pw/cols,ph/Math.ceil(nu/cols));mono(c,`one hidden unit per input: ${nu} units`,x0,y0-12);
          r.pts.forEach((p,i)=>rect(c,x0+(i%cols)*cs+1,y0+Math.floor(i/cols)*cs+1,cs-2,cs-2,r.lab(p)>0?COL.B:COL.A,.75));
          if(!n)hand(c,'doubles with\nevery extra bit',x0+pw*.6,y0+ph*.75,{size:14});}}
      const bx=n?20:w*.55,by=n?h*.62:80,bw=n?w-40:w*.38,mx=Math.max(r.costL,r.costR);
      [['rule',r.costR,COL.green,r.rule.units.length],['lookup table',r.costL,COL.white,r.lookup.units.length]].forEach(([l,v,col,u],k)=>{rect(c,bx,by+k*44,bw*v/mx,20,col,.85);txt(c,`${l}: cost ${v.toFixed(1)}, ${u} units`,bx,by+k*44+38,{size:12,col});});
      mono(c,'sum of squared weights (what weight decay pays)',bx,by-10);return false;}};
  function wrap(c2,s,x,y,mw,o){PV.wrap(c2,s,x,y,mw,o);}
};
})();
