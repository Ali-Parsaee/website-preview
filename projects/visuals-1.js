'use strict';
(function(){const {COL,clamp,lerp,now,ease,rng,gauss,pct,H,line,dot,ring,rect,txt,mono,hand,arrow,wrap,axes,curve}=PV;const V=window.ProjectVisuals;

/* 1. Budget-constrained active learning: partially de-censoring patients. Each patient has a predicted
   distribution over the year of their event. Following someone for d more years either reveals the event
   (we learn the year) or extends the "event-free until" bound. The learner buys the follow-up with the most
   expected information per year. Simplified: information is about each patient's own event time. */
V.survival=api=>{const NB=8,NP=7,BUD=14;const S={};
  function dist(p,L){const q=p.map((v,k)=>k>=L?v:0),s=q.reduce((a,b)=>a+b,0)||1;return q.map(v=>v/s);}
  function info(pt,d){if(pt.known!=null||pt.L>=NB-1)return 0;const q=dist(pt.p,pt.L),e=q.slice(pt.L,pt.L+d).reduce((a,b)=>a+b,0);return(H(q)-(1-e)*H(dist(pt.p,Math.min(NB-1,pt.L+d))))/d;}
  function cohort(seed){const r=rng(seed);S.seed=seed;S.pts=[];for(let i=0;i<NP;i++){const lam=2.5+r()*5,k=1.3+r()*1.2,Sv=t=>Math.exp(-Math.pow(t/lam,k));const p=[];for(let b=0;b<NB;b++)p.push(b<NB-1?Sv(b)-Sv(b+1):Sv(b));
      const c=1+Math.floor(r()*4);let tb;const q=dist(p,c);let u=r(),acc=0;for(tb=0;tb<NB;tb++){acc+=q[tb];if(u<=acc)break;}S.pts.push({p,L:c,known:null,truth:Math.min(tb,NB-1),flash:0});}
    S.budget=BUD;S.sel=0;S.log=[];S.d=S.d||1;}
  function total(){return S.pts.reduce((a,pt)=>a+(pt.known!=null?0:H(dist(pt.p,pt.L))),0);}
  function probe(i,who){const pt=S.pts[i];if(pt.known!=null){api.say(`Patient ${i+1}'s event year is already known.`);return;}const d=Math.min(S.d,S.budget);if(d<=0){api.say('The follow-up budget is spent.');return;}
    const gain=info(pt,d)*d,before=total();S.budget-=d;S.sel=i;pt.flash=now();
    if(pt.truth<pt.L+d){pt.known=pt.truth;api.say(`${who}Followed patient ${i+1} for ${d} more year${d>1?'s':''}: the event happened in year ${pt.truth+1}. A full answer: ${(before-total()).toFixed(2)} bits of uncertainty gone (expected ${gain.toFixed(2)}).`);}
    else{pt.L=Math.min(NB-1,pt.L+d);api.say(`${who}Followed patient ${i+1} for ${d} more year${d>1?'s':''}: still event-free. Not a full answer, but the event is now known to be after year ${pt.L}. ${(before-total()).toFixed(2)} bits gone (expected ${gain.toFixed(2)}).`);}
    S.log.push(total());}
  const best=()=>{let b=-1,bv=-1;S.pts.forEach((pt,i)=>{const v=info(pt,Math.min(S.d,S.budget));if(v>bv){bv=v;b=i;}});return b;};
  const c=api.controls;
  c.button('Follow the most informative patient <span>→</span>',()=>{const b=best();if(b<0||S.budget<=0){api.say('The follow-up budget is spent.');return;}probe(b,'The learner chose the best information per year. ');},{primary:true});
  c.button('Follow the selected patient',()=>probe(S.sel,''));
  c.button('Start over <span>↺</span>',()=>{cohort(7);api.say('Seven censored patients, 14 years of follow-up to spend. Click a row to select a patient.');});
  c.choice('Each follow-up lasts',[[1,'1 year'],[2,'2 years'],[3,'3 years']],1,v=>{S.d=v;});
  c.row('small');c.button('New patients',()=>{cohort(S.seed+1);api.say('A new cohort.');},{quiet:true});
  cohort(7);const G={};
  return{legend:'<i class="lg line w"></i> known event-free <i class="lg ring"></i> censored: “not yet” <i class="lg dot a"></i> event observed <i class="lg bar g"></i> information per year of follow-up',
    start(){api.say('Each row is a patient whose outcome is censored: we only know they were event-free until the open circle. Following someone longer costs years of follow-up, and may still end in “not yet”. The green bars price each follow-up before you buy it.');},
    draw(c,w,h,n){let anim=false;G.x0=n?40:64;G.x1=n?w*.62:w*.55;G.t=38;G.rh=n?26:30;G.ix=G.x1+(n?18:40);G.iw=w-G.ix-(n?14:30);const X=y=>G.x0+(G.x1-G.x0)*y/NB;
      mono(c,'years →',G.x1,G.t+NP*G.rh+16,{align:'right'});for(let y=0;y<=NB;y+=2)mono(c,String(y),X(y),G.t+NP*G.rh+4,{align:'center'});
      mono(c,n?'info / year':'information per year of follow-up',G.ix,G.t-14);
      const vals=S.pts.map(pt=>info(pt,Math.min(S.d,Math.max(S.budget,1)))),vmax=Math.max(.6,...vals),bi=best();
      S.pts.forEach((pt,i)=>{const y=G.t+i*G.rh+G.rh/2,sel=i===S.sel,end=pt.known!=null?pt.known+.5:pt.L;
        if(sel)rect(c,6,y-G.rh/2+2,w-12,G.rh-4,COL.white,.05);mono(c,'P'+(i+1),G.x0-12,y+4,{align:'right',col:sel?COL.white:COL.dim});
        line(c,X(0),y,X(end),y,COL.white,2.2,.85);if(pt.known==null)line(c,X(end),y,X(NB),y,COL.dim,1,.3,[2,5]);
        if(pt.known!=null)dot(c,X(end),y,5,COL.A);else ring(c,X(end),y,4.6,COL.white,1.6,1,COL.bg);
        const f=(now()-pt.flash)/900;if(f<1){ring(c,X(end),y,6+f*16,COL.A,1.5,1-f);anim=true;}
        const v=vals[i];rect(c,G.ix,y-5,G.iw*Math.sqrt(v/vmax),10,v>0?COL.green:COL.dim,i===bi&&S.budget>0?.95:.45);});
      // the selected patient's predicted distribution, and what a follow-up could do to it
      const pt=S.pts[S.sel],q=pt.known!=null?pt.p.map((_,k)=>k===pt.known?1:0):dist(pt.p,pt.L),by=G.t+NP*G.rh+(n?52:60),bh=h-by-(n?40:46),bx0=G.x0,bw=(G.x1-G.x0)/NB;
      mono(c,`patient ${S.sel+1}: when will the event happen?`,bx0,by-8);
      for(let k=0;k<NB;k++){const hh=bh*q[k],excl=pt.known==null&&k<pt.L,inWin=pt.known==null&&k>=pt.L&&k<pt.L+S.d;
        rect(c,bx0+k*bw+2,by+bh-hh,bw-4,hh,inWin?COL.A:COL.B,excl?.15:.8);if(excl)rect(c,bx0+k*bw+2,by+bh-3,bw-4,3,COL.dim,.4);mono(c,'y'+(k+1),bx0+k*bw+bw/2,by+bh+14,{align:'center'});}
      if(pt.known==null){const e=q.slice(pt.L,pt.L+S.d).reduce((a,b)=>a+b,0),rx=G.ix,ry=by+4;
        txt(c,`If followed ${S.d} more year${S.d>1?'s':''}:`,rx,ry,{size:12,col:COL.white});
        txt(c,`${pct(e)}  the event shows up → year known`,rx,ry+22,{size:12,col:COL.A});txt(c,`${pct(1-e)}  still “not yet” → bound moves to year ${Math.min(NB-1,pt.L+S.d)}`,rx,ry+42,{size:12,col:COL.B});
        txt(c,`uncertainty now ${H(q).toFixed(2)} bits`,rx,ry+70,{size:11,col:COL.dim});}
      txt(c,`budget left: ${S.budget} of ${BUD} years · total uncertainty ${total().toFixed(1)} bits`,w-(n?12:28),h-12,{size:11,col:COL.dim,align:'right'});
      if(!n&&S.budget===BUD)hand(c,'yellow bars: the years a\nfollow-up would cover',G.ix,by+bh-30,{size:14});
      return anim;},
    pointer(type,x,y){if(type!=='up')return;const i=Math.floor((y-G.t)/G.rh);if(i>=0&&i<NP&&x<G.ix+G.iw){S.sel=i;const pt=S.pts[i];api.say(pt.known!=null?`Patient ${i+1}: event in year ${pt.known+1}, already known.`:`Patient ${i+1}: event-free until year ${pt.L}. A ${S.d}-year follow-up is worth ${(info(pt,S.d)*S.d).toFixed(2)} bits.`);api.request();}}};
};

/* 2. Wisdom of the Machines: a crowd of language models estimating a quantity. Temperature sampling from
   one model repeats that model's bias; different models make different mistakes, so their median cancels them.
   Simulated: each model has its own bias; temperature adds noise around it. */
V.crowds=api=>{const NM=12,S={mode:'models',n:7,seed:3,stats:null};const tasks=[['weight of a person in a photo','kg',72],['weight of a small object','g',180],['price of a product','$',45]];
  function obj(seed){const r=rng(seed*31+7);S.seed=seed;S.task=tasks[seed%3];S.T=S.task[2]*(.7+r()*.7);S.bias=Array.from({length:NM},()=>.2*gauss(r));S.z=Array.from({length:NM},()=>gauss(r));S.m0=Math.floor(r()*NM);}
  function guesses(){const out=[];for(let i=0;i<S.n;i++){if(S.mode==='models')out.push({v:S.T*(1+S.bias[i]),m:i});else{const temp=.2+1.0*i/Math.max(1,S.n-1);out.push({v:S.T*(1+S.bias[S.m0]+.07*temp*S.z[i]),m:S.m0,temp});}}return out;}
  const med=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
  function run(){const r=rng(99),res={models:0,temp:0,beat:0,N:300};for(let k=0;k<res.N;k++){const b=Array.from({length:NM},()=>.2*gauss(r)),z=Array.from({length:NM},()=>gauss(r)),m0=Math.floor(r()*NM);
      const gm=b.slice(0,S.n),gt=z.slice(0,S.n).map((zz,i)=>b[m0]+.07*(.2+i/Math.max(1,S.n-1))*zz),em=Math.abs(med(gm)),et=Math.abs(med(gt));res.models+=em;res.temp+=et;res.beat+=gm.filter(g=>Math.abs(g)>em).length/S.n;}
    res.models/=res.N;res.temp/=res.N;res.beat/=res.N;S.stats=res;
    api.say(`Over ${res.N} simulated objects with ${S.n} answers each: the median of different models is off by ${(res.models*100).toFixed(0)}% on average; the median of one model at many temperatures is off by ${(res.temp*100).toFixed(0)}%. The model-crowd median beats ${pct(res.beat)} of individual guesses. In the paper, with real models and photos, it beat 68% on average.`);}
  const c=api.controls,ch=c.choice('The crowd is',[['models','different models, temperature 0'],['temp','one model, many temperatures']],'models',v=>{S.mode=v;S.stats=null;say();});
  c.slider('Answers in the crowd',{min:1,max:NM,step:1,value:7},v=>{S.n=v;S.stats=null;say();});
  c.row();c.button('Run 300 objects <span>→</span>',run,{primary:true});c.button('New object',()=>{obj(S.seed+1);S.stats=null;say();});c.button('Start over <span>↺</span>',()=>{obj(3);S.n=7;S.mode='models';ch.set('models');S.stats=null;say();});
  function say(){const g=guesses().map(x=>x.v),m=med(g),e=Math.abs(m-S.T)/S.T,beat=g.filter(v=>Math.abs(v-S.T)>Math.abs(m-S.T)).length;
    api.say(S.mode==='models'?`${S.n} different models guess the ${S.task[0]}. Their mistakes point different ways, so the median lands ${(e*100).toFixed(0)}% from the truth, closer than ${beat} of the ${S.n} individual guesses.`:`One model asked ${S.n} times at rising temperatures. The answers spread out, but around the model's own bias, so the median stays ${(e*100).toFixed(0)}% off. Extra samples cost more and fix nothing.`);}
  obj(3);
  return{legend:'<i class="lg dot a"></i> one answer <i class="lg ring g"></i> the crowd’s median <i class="lg line w"></i> the true value',start:say,
    draw(c,w,h,n){const x0=n?24:60,x1=w-(n?24:60),ly=h*.42,lo=S.T*.35,hi=S.T*1.65,X=v=>x0+(x1-x0)*clamp((v-lo)/(hi-lo),0,1);
      mono(c,`estimating the ${S.task[0]} (${S.task[1]})`,x0,40);line(c,x0,ly,x1,ly,COL.white,1.2,.7);
      for(let k=0;k<=4;k++){const v=lo+(hi-lo)*k/4;mono(c,Math.round(v)+'',X(v),ly+20,{align:'center'});}
      const g=guesses(),m=med(g.map(x=>x.v));line(c,X(S.T),ly-90,X(S.T),ly+36,COL.white,1.5,.9,[4,4]);mono(c,'truth',X(S.T),ly+50,{align:'center',col:COL.white});
      const pal=[COL.A,COL.B,COL.green,COL.purple,COL.teal,COL.red,COL.gold,'#e07fb0','#9ad1ff','#c7e37a','#ffb38a','#b0a6ff'];
      g.forEach((x,i)=>{const col=pal[x.m%pal.length],yy=ly-24-i*(n?7:9);line(c,X(x.v),yy,X(x.v),ly,col,1,.35);dot(c,X(x.v),yy,4.2,col,S.mode==='temp'?.45+.5*(x.temp||0):1);});
      ring(c,X(m),ly,10,COL.green,2.4,1,COL.bg);mono(c,'median',X(m),ly-104,{align:'center',col:COL.green});line(c,X(m),ly-96,X(m),ly-12,COL.green,1,.5);
      if(!n)hand(c,S.mode==='models'?'different models,\ndifferent mistakes':'same model:\nthe same mistake, repeated',x1-200,90,{size:15});
      if(S.stats){const bx=x0,by=h*.66,bw=(x1-x0)*.5,mx=Math.max(S.stats.models,S.stats.temp)*1.2;mono(c,'typical error of the median, 300 objects',bx,by-10);
        [['different models',S.stats.models,COL.green],['one model, many temperatures',S.stats.temp,COL.white]].forEach(([l,v,col],k)=>{rect(c,bx,by+k*30,bw*v/mx,18,col,.85);txt(c,`${l}: ${(v*100).toFixed(0)}%`,bx+bw*v/mx+8,by+k*30+14,{size:12,col});});}
      return false;}};
};

/* 3. A theory of hierarchical memory: extraction (atoms), coarsening (groups with representatives) and
   traversal under a token budget. Self-sufficient representatives (summaries) let traversal stop high;
   routing-only representatives (keys) force it down to the atoms. */
V.memory=api=>{const T=['A','B','green','purple'],S={rep:'summary',grain:'detail',budget:90,target:5};
  const atoms=[...Array(16)].map((_,i)=>({id:i,topic:Math.floor(i/4)}));const COST={atom:10,g1:15,g2:20,root:25};
  function traverse(){const path=[],t=atoms[S.target].topic;let used=0;const add=(n,c)=>{if(used+c<=S.budget){used+=c;path.push(n);return true;}return false;};
    let ok=add('root',COST.root)&&add('g2-'+(t<2?0:1),COST.g2)&&add('g1-'+t,COST.g1);let answered=false;
    if(ok&&S.grain==='coarse'&&S.rep==='summary')answered=true;
    else if(ok){if(add('a'+S.target,COST.atom))answered=S.grain==='detail'||true;
      if(answered&&S.grain==='coarse'){for(const a of atoms)if(a.topic===t&&a.id!==S.target&&!add('a'+a.id,COST.atom)){answered=false;break;}}}
    return{path,used,answered};}
  const c=api.controls;
  c.choice('The question is',[['detail','one specific fact'],['coarse','what a whole topic is about']],'detail',v=>{S.grain=v;say();});
  c.choice('Group representatives are',[['summary','summaries (self-sufficient)'],['key','keys (routing only)']],'summary',v=>{S.rep=v;say();});
  const sl=c.slider('Token budget',{min:40,max:160,step:5,value:90},v=>{S.budget=v;say();});
  c.row();c.button('Start over <span>↺</span>',()=>{Object.assign(S,{rep:'summary',grain:'detail',budget:90,target:5});sl.set(90);say();});
  function say(){const r=traverse(),tn=['yellow','blue','green','purple'][atoms[S.target].topic];
    api.say(r.answered?`Answered with ${r.used} of ${S.budget} tokens. ${S.grain==='coarse'&&S.rep==='summary'?'The '+tn+' group’s summary already answers a topic-level question, so traversal stops there.':S.grain==='coarse'?'Keys only point the way, so every '+tn+' atom has to be pulled in to describe the topic.':'Traversal follows the representatives down to the one atom that holds the fact.'}`:
      `Not answered: ${S.grain==='coarse'&&S.rep==='key'?'with routing-only keys, a topic-level answer needs all four atoms, and they do not fit in '+S.budget+' tokens.':'the budget runs out before the right atom is reached.'} Click an atom to ask about another fact.`);}
  return{legend:'<i class="lg dot w"></i> atoms (extracted units) <i class="lg ring"></i> group representatives <i class="lg line a"></i> traversal path, under the token budget',start:say,
    draw(c,w,h,n){const top=n?60:70,bot=h-(n?70:80),lv=[top,top+(bot-top)*.33,top+(bot-top)*.66,bot],ax=i=>(n?20:50)+(w-(n?40:100))*(i+.5)/16;
      const pos={root:[w/2,lv[0]]};pos['g2-0']=[(ax(0)+ax(7))/2,lv[1]];pos['g2-1']=[(ax(8)+ax(15))/2,lv[1]];for(let t=0;t<4;t++)pos['g1-'+t]=[(ax(t*4)+ax(t*4+3))/2,lv[2]];atoms.forEach(a=>pos['a'+a.id]=[ax(a.id),lv[3]]);
      const par=k=>k==='root'?null:k.startsWith('g2')?'root':k.startsWith('g1')?'g2-'+(+k.slice(3)<2?0:1):'g1-'+atoms[+k.slice(1)].topic;
      const tc=t=>COL[T[t]]||COL[T[t]];const r=traverse();
      Object.keys(pos).forEach(k=>{const p=par(k);if(p)line(c,pos[p][0],pos[p][1],pos[k][0],pos[k][1],COL.faint,1.2);});
      for(let i=0;i<r.path.length;i++){const k=r.path[i],p=par(k);if(p&&r.path.includes(p))line(c,pos[p][0],pos[p][1],pos[k][0],pos[k][1],COL.A,2.6,.9);}
      Object.keys(pos).forEach(k=>{const [x,y]=pos[k],on=r.path.includes(k);if(k.startsWith('a')){const a=atoms[+k.slice(1)];dot(c,x,y,on?8:6,tc(a.topic),on?1:.55);if(a.id===S.target)ring(c,x,y,12,COL.white,1.5);}
        else{const t=k.startsWith('g1')?+k.slice(3):null;ring(c,x,y,k==='root'?14:12,t!=null?tc(t):COL.white,on?2.4:1.3,on?1:.5,COL.bg);if(S.rep==='key')mono(c,'key',x,y+3,{align:'center',size:9});else mono(c,'Σ',x,y+4,{align:'center',size:11,col:COL.white});}});
      mono(c,'τ  traversal',14,lv[0]+4);mono(c,'C  coarsening',14,lv[1]+4);mono(c,'C',14,lv[2]+4);mono(c,'α  extracted atoms',14,lv[3]-16);
      const bw=w*.4;rect(c,w-bw-24,h-34,bw,8,COL.faint,1);rect(c,w-bw-24,h-34,bw*Math.min(1,r.used/S.budget),8,r.answered?COL.green:COL.red,.9);mono(c,`${r.used} / ${S.budget} tokens`,w-24,h-42,{align:'right'});
      if(!n)hand(c,'click any atom\nto ask about it',ax(0)-6,lv[3]+30,{size:14});return false;},
    pointer(type,x,y){if(type!=='up')return;const n=api.narrow(),i=Math.round(((x-(n?20:50))/((this._w||0)||1)));let best=-1,bd=1e9;
      const cw=document.querySelector('[data-visual="memory"] canvas').getBoundingClientRect().width;for(let k=0;k<16;k++){const ax=(n?20:50)+(cw-(n?40:100))*(k+.5)/16,d=Math.abs(ax-x);if(d<bd){bd=d;best=k;}}
      if(bd<18){S.target=best;say();api.request();}}};
};

/* 4. Spend compute where errors propagate: a mistake at a node corrupts everything that depends on it,
   so a node's error is weighted by its reach. Water-filling gives more samples to nodes with more reach. */
V.compute=api=>{const S={shape:'balanced',B:40,alloc:'reach',hl:null,sim:null},gam=.32,d0=.7;
  function build(shape){const nodes=[];const add=(p,depth)=>{const id=nodes.length;nodes.push({id,p,depth,kids:[]});if(p!=null)nodes[p].kids.push(id);return id;};
    if(shape==='balanced'){const r=add(null,0);for(let i=0;i<3;i++){const a=add(r,1);for(let j=0;j<3;j++)add(a,2);}}
    else if(shape==='deep'){let p=add(null,0);for(let d=1;d<6;d++){add(p,d);p=add(p,d);} }
    else{const r=add(null,0);for(let i=0;i<4;i++){const a=add(r,1);add(a,2);}for(let i=0;i<4;i++)add(r,1);}
    const reach=v=>1+nodes[v].kids.reduce((s,k)=>s+reach(k),0);nodes.forEach(nd=>nd.w=reach(nd.id));return nodes;}
  function allocate(nodes,mode){const n=nodes.length;if(mode==='uniform')return nodes.map(()=>S.B/n);
    let lo=-50,hi=50;for(let it=0;it<80;it++){const mu=(lo+hi)/2,s=nodes.reduce((a,nd)=>a+Math.max(0,(Math.log(gam*nd.w*d0)-mu)/gam),0);if(s>S.B)lo=mu;else hi=mu;}
    const mu=(lo+hi)/2;return nodes.map(nd=>Math.max(0,(Math.log(gam*nd.w*d0)-mu)/gam));}
  const perr=b=>d0*Math.exp(-gam*b),loss=(nodes,b)=>nodes.reduce((a,nd,i)=>a+nd.w*perr(b[i]),0);
  function simulate(){const r=rng(5),N=2000,out={};for(const mode of['uniform','reach']){const b=allocate(S.nodes,mode);let tot=0;
      for(let k=0;k<N;k++){const bad=new Set();const mark=v=>{bad.add(v);S.nodes[v].kids.forEach(mark);};S.nodes.forEach((nd,i)=>{if(r()<perr(b[i]))mark(i);});tot+=bad.size;}out[mode]=tot/N;}
    S.sim=out;api.say(`2,000 simulated runs where a wrong answer really does corrupt everything below it: uniform sampling loses ${out.uniform.toFixed(2)} sub-problems per run on average; spending by reach loses ${out.reach.toFixed(2)}. ${out.uniform>out.reach?(out.uniform/out.reach).toFixed(1)+'× less corrupted work for the same budget.':''}`);}
  function reset(){S.nodes=build(S.shape);S.sim=null;S.hl=null;}
  const c=api.controls;const ch=c.choice('Problem structure',[['balanced','balanced tree'],['deep','long chain'],['wide','wide and shallow']],'balanced',v=>{S.shape=v;reset();say();});
  const al=c.choice('Samples are spent',[['reach','by reach (water-filling)'],['uniform','uniformly']],'reach',v=>{S.alloc=v;say();});
  const sl=c.slider('Total samples',{min:12,max:90,step:2,value:40},v=>{S.B=v;S.sim=null;say();});
  c.row();c.button('Simulate 2,000 runs <span>→</span>',simulate,{primary:true});c.button('Start over <span>↺</span>',()=>{Object.assign(S,{shape:'balanced',B:40,alloc:'reach'});ch.set('balanced');al.set('reach');sl.set(40);reset();say();});
  function say(){const lu=loss(S.nodes,allocate(S.nodes,'uniform')),lr=loss(S.nodes,allocate(S.nodes,'reach'));
    api.say(`Expected corrupted work: ${lu.toFixed(2)} with equal samples per node, ${lr.toFixed(2)} when samples follow reach. Nodes high in the structure get more, because a mistake there invalidates everything built on it. Click a node to see what its mistake would corrupt.`);}
  reset();
  return{legend:'<i class="lg ring"></i> a sub-problem (size: samples it gets) <i class="lg dot r"></i> chance it ends up wrong <i class="lg line a"></i> work a mistake here would corrupt',start:say,
    draw(c,w,h,n){const b=allocate(S.nodes,S.alloc),maxD=Math.max(...S.nodes.map(x=>x.depth)),top=60,bot=h-(n?110:90);const leaves=[];const order=v=>{const nd=S.nodes[v];if(!nd.kids.length)leaves.push(v);nd.kids.forEach(order);};order(0);
      const P={};leaves.forEach((v,i)=>P[v]=[(n?20:50)+(w-(n?40:100))*(i+.5)/leaves.length,top+(bot-top)*S.nodes[v].depth/Math.max(1,maxD)]);
      const place=v=>{const nd=S.nodes[v];if(P[v])return P[v];const ps=nd.kids.map(place);P[v]=[ps.reduce((a,p)=>a+p[0],0)/ps.length,top+(bot-top)*nd.depth/Math.max(1,maxD)];return P[v];};place(0);
      const sub=new Set();if(S.hl!=null){const m=v=>{sub.add(v);S.nodes[v].kids.forEach(m);};m(S.hl);}
      S.nodes.forEach(nd=>nd.kids.forEach(k=>line(c,P[nd.id][0],P[nd.id][1],P[k][0],P[k][1],sub.has(k)?COL.A:COL.faint,sub.has(k)?2.4:1.2)));
      S.nodes.forEach((nd,i)=>{const [x,y]=P[i],r=5+2.2*Math.sqrt(b[i]),pe=perr(b[i]);dot(c,x,y,r,COL.red,.15+.8*pe);ring(c,x,y,r,sub.has(i)?COL.A:COL.white,sub.has(i)?2.2:1.3,.9);mono(c,b[i].toFixed(1),x,y+r+12,{align:'center',size:9});});
      const lu=loss(S.nodes,allocate(S.nodes,'uniform')),lr=loss(S.nodes,allocate(S.nodes,'reach')),bx=n?20:50,by=h-(n?62:48),bw=w*.45,mx=Math.max(lu,lr);
      [['equal samples',lu,COL.white],['by reach',lr,COL.green]].forEach(([l,v,col],k)=>{rect(c,bx,by+k*18,bw*v/mx,10,col,.85);txt(c,n?`${l}: ${v.toFixed(2)}`:`${l}: ${v.toFixed(2)} expected corrupted`,bx+bw*v/mx+8,by+k*18+9,{size:11,col});});
      mono(c,'numbers under nodes: samples',w-(n?14:40),36,{align:'right'});if(!n&&S.hl==null)hand(c,'a mistake at the top\ncorrupts everything below',P[0][0]+30,P[0][1]-14,{size:14});
      S.P=P;return false;},
    pointer(type,x,y){if(type!=='up'||!S.P)return;let best=null,bd=26;for(const k in S.P){const d=Math.hypot(S.P[k][0]-x,S.P[k][1]-y);if(d<bd){bd=d;best=+k;}}S.hl=best===S.hl?null:best;
      if(best!=null){const nd=S.nodes[best];api.say(`A wrong answer here corrupts ${nd.w} sub-problem${nd.w>1?'s':''}: itself and everything that depends on it. That count is its reach, and it sets how many samples it deserves.`);}api.request();}};
};

/* 5. Learning what to grow: Bayesian optimization vs classical designs on a hidden response landscape
   ("Hide-the-Label": the optimizer only sees what it has measured). Simulated landscape; the finding that
   GP-based BO was the most sample-efficient is the paper's. */
V.media=api=>{const NG=18,M=NG*NG,S={view:'bo',noise:false,seed:2};const xs=[];for(let i=0;i<NG;i++)for(let j=0;j<NG;j++)xs.push([(i+.5)/NG,(j+.5)/NG]);
  const ell=.17,sn=.05;const kf=(a,b)=>Math.exp(-((a[0]-b[0])**2+(a[1]-b[1])**2)/(2*ell*ell));
  function land(seed){const r=rng(seed*13+1);const bumps=[...Array(4)].map((_,k)=>({x:r(),y:r(),s:.08+r()*.14,a:k?.3+r()*.5:1}));S.f=xs.map(([x,y])=>bumps.reduce((v,b)=>v+b.a*Math.exp(-((x-b.x)**2+(y-b.y)**2)/(2*b.s*b.s)),0));
    const mx=Math.max(...S.f);S.f=S.f.map(v=>v/mx);S.thr=[...S.f].sort((a,b)=>b-a)[Math.floor(M*.03)];S.seed=seed;S.r=rng(seed*7+3);
    const init=[...Array(5)].map(()=>Math.floor(S.r()*M));S.m={};for(const k of['bo','random','doe'])S.m[k]={obs:init.map(i=>({i,y:meas(i)})),best:[],found:null};S.doeOrder=halton();S.step=0;rec();}
  function meas(i){return S.f[i]+(S.noise?.08*gauss(S.r):0);}
  function halton(){const h=(n,b)=>{let f=1,r=0;while(n>0){f/=b;r+=f*(n%b);n=Math.floor(n/b);}return r;};const o=[];for(let n=1;o.length<M&&n<4*M;n++){const i=Math.min(NG-1,Math.floor(h(n,2)*NG)),j=Math.min(NG-1,Math.floor(h(n,3)*NG)),k=i*NG+j;if(!o.includes(k))o.push(k);}return o;}
  function rec(){for(const k in S.m){const m=S.m[k],bt=Math.max(...m.obs.map(o=>S.f[o.i]));m.best.push(bt);if(m.found==null&&bt>=S.thr)m.found=m.obs.length;}}
  function gpNext(obs){const n=obs.length,K=[];for(let a=0;a<n;a++){K.push([]);for(let b=0;b<n;b++)K[a].push(kf(xs[obs[a].i],xs[obs[b].i])+(a===b?sn*sn+1e-6:0));}
    const L=K.map(r=>r.map(()=>0));for(let i=0;i<n;i++)for(let j=0;j<=i;j++){let s=K[i][j];for(let k=0;k<j;k++)s-=L[i][k]*L[j][k];L[i][j]=i===j?Math.sqrt(Math.max(s,1e-12)):s/L[j][j];}
    const solve=b=>{const y=[];for(let i=0;i<n;i++){let s=b[i];for(let k=0;k<i;k++)s-=L[i][k]*y[k];y.push(s/L[i][i]);}return y;};
    const ym=obs.reduce((a,o)=>a+o.y,0)/n,al=(()=>{const z=solve(obs.map(o=>o.y-ym));const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=z[i];for(let k=i+1;k<n;k++)s-=L[k][i]*x[k];x[i]=s/L[i][i];}return x;})();
    const seen=new Set(obs.map(o=>o.i));let best=-1,bv=-1e9;S.mu=[];S.sd=[];for(let i=0;i<M;i++){const kv=obs.map(o=>kf(xs[i],xs[o.i]));let mu=ym;for(let a=0;a<n;a++)mu+=kv[a]*al[a];const v=solve(kv);const sd=Math.sqrt(Math.max(1e-9,1-v.reduce((s,q)=>s+q*q,0)));S.mu.push(mu);S.sd.push(sd);
      const u=mu+2*sd;if(!seen.has(i)&&u>bv){bv=u;best=i;}}return best;}
  function step(){if(S.step>=40)return false;S.step++;const bo=S.m.bo,ra=S.m.random,dm=S.m.doe;const nb=gpNext(bo.obs);bo.obs.push({i:nb,y:meas(nb)});
    let k;const seen=new Set(ra.obs.map(o=>o.i));do{k=Math.floor(S.r()*M);}while(seen.has(k));ra.obs.push({i:k,y:meas(k)});
    const ds=new Set(dm.obs.map(o=>o.i));const nd=S.doeOrder.find(q=>!ds.has(q));dm.obs.push({i:nd,y:meas(nd)});rec();return true;}
  const say=()=>{const f=k=>S.m[k].found==null?'not yet':`after ${S.m[k].found} measurements`;api.say(`${S.step} measurements each. A formulation in the top 3% was found: Bayesian optimization ${f('bo')}, space-filling design ${f('doe')}, random ${f('random')}.`);};
  const c=api.controls;let timer=0;const stop=()=>{clearInterval(timer);timer=0;};
  c.button('Run 40 measurements <span>▶</span>',b=>{if(timer){stop();return;}timer=setInterval(()=>{if(!step()){stop();}say();api.request();},api.paused()?30:220);},{primary:true});
  c.button('One measurement',()=>{stop();step();say();});c.button('Start over <span>↺</span>',()=>{stop();land(2);say();});
  c.choice('Show the measurements of',[['bo','Bayesian optimization'],['doe','space-filling design'],['random','random']],'bo',v=>{S.view=v;});
  c.choice('Measurement noise',[[false,'none'],[true,'added']],false,v=>{S.noise=v;stop();land(S.seed);say();});
  c.row('small');c.button('New landscape',()=>{stop();land(S.seed+1);say();},{quiet:true});
  land(2);
  return{legend:'<i class="lg bar a"></i> hidden response (titer) <i class="lg dot w"></i> measured formulation <i class="lg line g"></i> Bayesian optimization <i class="lg line b"></i> space-filling design <i class="lg line w"></i> random',
    start(){api.say('Each square is a candidate medium: two ingredient levels. Its brightness is the yield we would measure, hidden from the optimizer until it pays for a measurement. Press run and watch which strategy finds a top formulation first.');},
    draw(c,w,h,n){const sz=n?Math.min(w-40,h*.5):Math.min(w*.46,h-90),x0=n?20:40,y0=n?40:50,cs=sz/NG;
      mono(c,'ingredient 1 →',x0+sz,y0+sz+16,{align:'right'});mono(c,'ingredient 2 ↑',x0,y0-10);
      for(let i=0;i<M;i++){const [gx,gy]=[Math.floor(i/NG),i%NG];rect(c,x0+gx*cs,y0+sz-(gy+1)*cs,cs-1,cs-1,COL.A,.05+.85*Math.pow(S.f[i],1.6));}
      const m=S.m[S.view];m.obs.forEach((o,k)=>{const [gx,gy]=[Math.floor(o.i/NG),o.i%NG],x=x0+(gx+.5)*cs,y=y0+sz-(gy+.5)*cs;dot(c,x,y,k<5?2.5:3.4,COL.white,k===m.obs.length-1?1:.8);if(S.f[o.i]>=S.thr)ring(c,x,y,7,COL.green,1.6);});
      const px=n?x0:x0+sz+50,py=n?y0+sz+50:y0,pw=n?w-40:w-px-30,ph=n?h-py-30:sz;axes(c,px,py,px+pw,py+ph,{x:'measurements →',y:'best yield found'});
      const Xs=k=>px+pw*k/45,Ys=v=>py+ph-ph*v;line(c,px,Ys(S.thr),px+pw,Ys(S.thr),COL.green,1,.6,[4,4]);mono(c,'top 3%',px+pw,Ys(S.thr)-5,{align:'right',col:COL.green});
      [['bo',COL.green],['doe',COL.B],['random',COL.white]].forEach(([k,col])=>{curve(c,S.m[k].best.map((v,i)=>[Xs(i+5),Ys(v)]),col,2.2);});
      return false;}};
};
})();
