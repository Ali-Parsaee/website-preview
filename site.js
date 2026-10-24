'use strict';
document.documentElement.classList.add('js');
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let chapter = 0, paused = reducedMotion, revealCount = 0, budget = 6, longer = 0, elsewhere = 0, structured = false, shared = false, correlated = false, support = 'weak', lastObservation = 'wait';
const sceneNames = ['A partial view of the possible','Time is part of the price','The same evidence, a different representation','Partial views, shared understanding','The evidence comes back to a decision'];
const sceneNotes = ['many possible worlds<br>fit what we have seen','an unfinished observation<br>still tells us something','keep the distinctions<br>the task needs','different views can help;<br>repeated mistakes cannot','a decision needs evidence,<br>not just a prediction'];
const canvas = $('#world-canvas'), ctx = canvas.getContext('2d');
const W = 900, H = 700, N = 96;
const palette = {white:'#d5e1e5',gold:'#e4b576',blue:'#83a9ca',gray:'#6f8596',faint:'#2b3f50'};
const rand = n => {const v = Math.sin(n*127.13+31.7)*43758.5453;return v-Math.floor(v);};
const lerp = (a,b,t) => a+(b-a)*t;
const base = Array.from({length:N},(_,i)=>({r:rand(i+1),s:rand(i+301),t:rand(i+701),group:i%4}));
function positions(){
 return base.map((p,i)=>{
  let x,y;
  if(chapter===0){
   x=100+p.r*700;const t=(x-100)/700;
   y=400-Math.sin(t*Math.PI)*(100+p.s*160)+Math.sin(t*9+p.s)*22;
   if(revealCount){x=lerp(x,170+p.r*550,.12*revealCount);y+=p.group%2 ? revealCount*10:-revealCount*10;}
  }else if(chapter===1){
   const row=i%8, pos=Math.floor(i/8)/11;
   x=105+pos*(245+longer*40+(row===elsewhere%8?elsewhere*12:0));y=160+row*42+(p.s-.5)*8;
  }else if(chapter===2){
   if(structured){const centers=[[265,215],[620,215],[265,395],[620,395]];x=centers[p.group][0]+Math.cos(p.r*Math.PI*2)*(25+p.s*62);y=centers[p.group][1]+Math.sin(p.r*Math.PI*2)*(25+p.s*62);}
   else {x=110+p.r*680;y=145+p.s*330;}
  }else if(chapter===3){
   const centers=[[220,210],[680,210],[220,420],[680,420]], g=p.group;
   const angle=correlated?(Math.floor(i/4)*.85):p.r*Math.PI*2;
   let rad=25+(correlated?rand(Math.floor(i/4)+500):p.s)*55;
   x=centers[g][0]+Math.cos(angle)*rad;y=centers[g][1]+Math.sin(angle)*rad;
   if(shared&&i%3===0){x=450+(p.r-.5)*95;y=305+(p.s-.5)*95;}
  }else {
   const group=i%2;const mu=support==='clear'?(group?290:610):(group?510:390);
   const sd=support==='clear'?60:105;
   const z=(p.r+p.s+p.t-1.5)*1.8;
   x=mu+z*sd;y=450-Math.exp(-z*z*.5)*205+(p.s-.5)*40;
  }
  return {x,y};
 });
}
let current=positions(), from=current.map(p=>({...p})), target=current.map(p=>({...p})), animationStart=0, frame=0, animationProgress=1;
function resize(){const r=canvas.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));draw(animationProgress);}
function setStroke(color,width=1,alpha=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.globalAlpha=alpha;ctx.setLineDash([]);}
function path(points,color,width=1,alpha=1,dash=[]){setStroke(color,width,alpha);ctx.setLineDash(dash);ctx.beginPath();points(ctx);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
function circle(x,y,r,color,fill=true,alpha=1){ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=1;fill?ctx.fill():ctx.stroke();ctx.globalAlpha=1;}
function text(x,y,t,color=palette.gray,size=11,align='left'){ctx.globalAlpha=1;ctx.fillStyle=color;ctx.font=`${size}px ui-monospace,monospace`;ctx.textAlign=align;ctx.fillText(t,x,y);}
function curveBell(mu,sd,baseY,height,color,fill=false){
 ctx.beginPath();ctx.moveTo(70,baseY);for(let x=70;x<=830;x+=4){ctx.lineTo(x,baseY-height*Math.exp(-.5*((x-mu)/sd)**2));}
 if(fill){ctx.lineTo(830,baseY);ctx.closePath();ctx.fillStyle=color;ctx.globalAlpha=.07;ctx.fill();ctx.globalAlpha=1;}else{ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();}
}
function background(stage,opacity){
 ctx.save();ctx.globalAlpha=opacity;
 // Quiet reference lines locate observations and the two possible actions.
 path(c=>{c.moveTo(65,485);c.lineTo(835,485);},palette.gray,1,.18);
 [260,640].forEach((x,i)=>{circle(x,530,25,i?palette.blue:palette.gold,false,.5);circle(x,530,3,i?palette.blue:palette.gold,true,.9);});
 if(stage===0){
  for(let k=0;k<30;k++){
   const f=k/29;
   path(c=>{for(let j=0;j<=90;j++){const t=j/90,x=100+t*700,y=400-Math.sin(t*Math.PI)*(100+f*160)+Math.sin(t*9+f)*22;(j?c.lineTo(x,y):c.moveTo(x,y));}},k<15?palette.blue:palette.gold,revealCount&&k>=15?1.3:.9,revealCount&&k<15?.045:.15+f*.25);
  }
  path(c=>{c.moveTo(260,505);c.bezierCurveTo(240,430,150,430,170,340);},palette.gold,1,.5,[4,6]);
  path(c=>{c.moveTo(640,505);c.bezierCurveTo(680,430,780,420,745,355);},palette.blue,1,.5,[4,6]);
  if(revealCount){const p=current[17];circle(p.x,p.y,18,palette.gold,false,.65);path(c=>{c.moveTo(p.x,p.y+20);c.bezierCurveTo(p.x-35,410,260,440,260,505);},palette.gold,2,.7);text(p.x+25,p.y-6,'new evidence',palette.gold,12);circle(260,530,34,palette.gold,false,.9);}

 }else if(stage===1){
  const cap=350+longer*40;
  for(let row=0;row<8;row++){
   const y=160+row*42, finish=390+rand(row+100)*330, end=Math.min(cap,finish);
   path(c=>{c.moveTo(100,y);c.lineTo(end,y);},row===elsewhere%8?palette.gold:palette.blue,1.5,.65);
   if(cap<finish){path(c=>{c.moveTo(end,y);c.lineTo(790,y);},palette.gray,1,.4,[3,8]);path(c=>{c.moveTo(end,y-6);c.lineTo(end,y+6);},palette.gold,2,.9);}else circle(end,y,5,palette.gold);
   text(73,y+4,String(row+1).padStart(2,'0'),palette.gray,10);
  }
  path(c=>{c.moveTo(cap,125);c.lineTo(cap,475);},palette.gold,1,.6,[3,6]);text(cap,112,'observed so far',palette.gold,11,'center');text(790,475,'follow-up time →',palette.gray,10,'right');
  path(c=>{c.moveTo(350,485);c.bezierCurveTo(350,520,300,500,260,505);},palette.gold,1,.4);
  path(c=>{c.moveTo(600,485);c.lineTo(640,505);},palette.blue,1,.4);
 }else if(stage===2){
  if(structured){
   [[265,215],[620,215],[265,395],[620,395]].forEach(([x,y],i)=>{for(let r=75;r<=105;r+=10)circle(x,y,r,i%2?palette.blue:palette.gold,false,.1+(105-r)*.004);text(x+112,y+4,['feature α','feature β','feature γ','feature δ'][i],palette.gray,11,'left');path(c=>{c.moveTo(x,y+80);c.bezierCurveTo(x,485,x<450?260:640,475,x<450?260:640,505);},i%2?palette.blue:palette.gold,1,.3);});

  }else{
   for(let i=0;i<N;i+=5){const a=current[i],b=current[(i+13)%N];path(c=>{c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);},palette.gray,.6,.18);}

  }
 }else if(stage===3){
  const centers=[[220,210],[680,210],[220,420],[680,420]];
  centers.forEach(([x,y],i)=>{circle(x,y,100,palette.gray,false,.25);text(x-110,y+3,'agent '+(i+1),palette.gray,11,'right');if(shared){path(c=>{c.moveTo(x,y);c.quadraticCurveTo(x,305,450,305);},correlated?palette.gold:palette.blue,1.3,.6,[4,5]);}});
  if(shared){circle(450,305,63,palette.gold,false,.5);path(c=>{c.moveTo(450,370);c.bezierCurveTo(450,450,260,445,260,505);},palette.gold,1.4,.5);path(c=>{c.moveTo(450,370);c.bezierCurveTo(450,450,640,445,640,505);},palette.blue,1.4,.5);text(450,410,correlated?'shared blind spot':'combined view',correlated?palette.gold:palette.white,11,'center');}
 }else{
  const clear=support==='clear';
  for(let k=0;k<12;k++){
   const sd=(clear?62:105)+k*3.5, a=clear?610:390,b=clear?290:510;
   ctx.globalAlpha=.12+k*.025;curveBell(a,sd,450,220-k*3,palette.gold);curveBell(b,sd,450,220-k*3,palette.blue);
  }
  ctx.globalAlpha=1;curveBell(clear?610:390,clear?62:105,450,220,palette.gold,true);curveBell(clear?290:510,clear?62:105,450,220,palette.blue,true);

  text(815,472,'greater illustrative value →',palette.gray,10,'right');if(clear)circle(260,530,34,palette.gold,false,.8);
  path(c=>{c.moveTo(700,545);c.bezierCurveTo(840,540,855,230,810,135);},palette.gray,1,.4,[3,7]);
 }
 ctx.restore();
}
function draw(t){
 animationProgress=t;
 if(!canvas.width||!ctx)return;
 const sx=canvas.width/W,sy=canvas.height/H;ctx.setTransform(sx,0,0,sy,0,0);ctx.clearRect(0,0,W,H);
 background(chapter,1);
 current=from.map((p,i)=>({x:lerp(p.x,target[i].x,t),y:lerp(p.y,target[i].y,t)}));
 current.forEach((p,i)=>{
  const relevant=(chapter===0&&revealCount&&i%17===0)||(chapter===1&&i%8===elsewhere%8)||(chapter===2&&structured&&i%6===0)||(chapter===3&&shared&&i%3===0)||(chapter===4&&support==='clear'&&i%2===1);
  const observed=i%4===0||relevant;
  const color=relevant?palette.gold:observed?palette.white:palette.gray;
  circle(p.x,p.y,relevant?3.4:observed?2.5:2,color,observed,observed?.95:.55);
 });
 ctx.setTransform(1,0,0,1,0,0);
}
function animate(){
 cancelAnimationFrame(frame);from=current.map(p=>({...p}));target=positions();animationStart=performance.now();
 if(paused){draw(1);return;}
 function tick(now){const progress=Math.min(1,(now-animationStart)/850);const t=1-Math.pow(1-progress,3);draw(t);if(progress<1)frame=requestAnimationFrame(tick);}
 frame=requestAnimationFrame(tick);
}
function status(){
 let message;
 if(chapter===0)message=revealCount?'This observation rules out possibilities that favored B. In this illustration, A now has stronger support.':'A useful observation can change which action looks best.';
 if(chapter===1)message=budget===0?'The budget is spent. Some outcomes are still unresolved.':longer+elsewhere===0?'You can wait for an answer, or spend that effort somewhere else.':`${6-budget} of 6 observation units spent. ${longer>=3?'Some outcomes have now been observed.':lastObservation==='elsewhere'?'A different observation is selected. Its outcome is still unresolved.':'Longer follow-up can still leave an outcome censored.'}`;
 if(chapter===2)message=structured?'The same observations now share a structure. What to preserve depends on what you need to answer.':'A collection of observations is not yet a useful representation.';
 if(chapter===3)message=correlated?'Repeating the same blind spot does not supply the missing evidence.':shared?'Different partial views can complement one another. How to combine them is part of the problem.':'Each agent has a partial view. Information must be exchanged before it can be combined.';
 if(chapter===4)message=support==='clear'?'Here the illustrative evidence separates the choices. In a real study, assumptions and evaluation still matter.':'The evidence does not yet distinguish the choices. Withholding a conclusion can be the right outcome.';
 $('#scene-result').textContent=message;
 $('#scene-title').textContent=sceneNames[chapter];$('#margin-note').innerHTML=sceneNotes[chapter];
 canvas.setAttribute('aria-label',sceneNames[chapter]+'. '+message+' Conceptual illustration, not measured research results.');
}
function goToChapter(index,focus=false){
 chapter=Math.max(0,Math.min(4,index));
 $$('.chapter').forEach((el,i)=>{el.classList.toggle('active',i===chapter);el.setAttribute('aria-hidden',String(i!==chapter));});
 $$('[data-go]').forEach((el,i)=>el.setAttribute('aria-current',i===chapter?'step':'false'));
 $('#previous').disabled=chapter===0;$('#next').innerHTML=chapter===4?'Back to the beginning <span>↺</span>':'Follow the question <span>→</span>';
 status();animate();if(innerWidth<=650)$('#story').scrollIntoView({behavior:paused?'instant':'smooth'});if(focus)$('#chapter-title-'+chapter).focus({preventScroll:true});
}
$$('[data-go]').forEach(button=>button.addEventListener('click',()=>goToChapter(+button.dataset.go)));
$('#previous').addEventListener('click',()=>goToChapter(chapter-1,true));
$('#next').addEventListener('click',()=>goToChapter(chapter===4?0:chapter+1,true));
$('.chapter-tabs').addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();let next=event.key==='Home'?0:event.key==='End'?4:(chapter+(event.key==='ArrowRight'?1:4))%5;goToChapter(next);$$('[data-go]')[next].focus();});
$('#reveal').addEventListener('click',()=>{revealCount=revealCount?0:1;$('#reveal').innerHTML=revealCount?'Hide the observation <span>↶</span>':'Reveal an observation <span>↗</span>';status();animate();});
function updateBudget(){ $('#budget-dots').textContent=Array.from({length:6},(_,i)=>i<budget?'●':'○').join(' ');$('#budget-count').textContent=budget+' remaining';$('#wait').disabled=!budget;$('#elsewhere').disabled=!budget;status();animate();}
$('#wait').addEventListener('click',()=>{if(budget){budget--;longer++;lastObservation='wait';updateBudget();}});
$('#elsewhere').addEventListener('click',()=>{if(budget){budget--;elsewhere++;lastObservation='elsewhere';updateBudget();}});
$$('.reset-scene').forEach(b=>b.addEventListener('click',()=>{budget=6;longer=0;elsewhere=0;revealCount=0;$('#reveal').innerHTML='Reveal an observation <span>↗</span>';updateBudget();}));
$('#structure').addEventListener('click',()=>{structured=!structured;$('#structure').innerHTML=structured?'Return to separate observations <span>↶</span>':'Find a shared structure <span>↗</span>';status();animate();});
$('#share').addEventListener('click',()=>{shared=!shared;$('#share').innerHTML=shared?'Separate their views <span>↶</span>':'Let the agents share <span>↗</span>';status();animate();});
$('#correlated').addEventListener('change',event=>{correlated=event.target.checked;status();animate();});
$$('[data-support]').forEach(b=>b.addEventListener('click',()=>{support=b.dataset.support;$$('[data-support]').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));status();animate();}));
function motionLabel(){ document.documentElement.classList.toggle('motion-paused',paused);$('#motion').textContent=paused?'Enable transitions':'Pause transitions';$('#motion').setAttribute('aria-pressed',String(paused)); }
$('#motion').addEventListener('click',()=>{paused=!paused;motionLabel();if(paused){cancelAnimationFrame(frame);target=positions();draw(1);}});motionLabel();
new ResizeObserver(resize).observe(canvas.parentElement);

// Each project gets a subject-specific illustration. All are conceptual drawings.
const C={gold:'#e3b57b',blue:'#8aaec7',white:'#ccd9df',dim:'#6b8493'};
function artFor(kind){
 let out='';
 const l=(x,y,x2,y2,color=C.dim,w=1,dash='')=>`<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${w}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
 const p=(d,color=C.dim,w=1,fill='none')=>`<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${w}"/>`;
 const c=(x,y,r,color=C.white,fill=true)=>`<circle cx="${x}" cy="${y}" r="${r}" stroke="${color}" fill="${fill?color:'none'}" stroke-width="1"/>`;
 const rect=(x,y,w,h,color=C.dim,fill=false)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${color}" fill="${fill?color:'none'}"/>`;
 const t=(x,y,s,color=C.dim)=>`<text x="${x}" y="${y}" fill="${color}" font-family="monospace" font-size="9">${s}</text>`;
 const points=(cx,cy,n,r,color,seed=1)=>Array.from({length:n},(_,i)=>c(cx+(rand(i+seed)-.5)*r,cy+(rand(i+seed+400)-.5)*r,1.7,color)).join('');
 if(['survival','configuration'].includes(kind)){
  for(let i=0;i<6;i++){let y=55+i*23,x=130+rand(i+8)*180;out+=l(45,y,x,y,C.blue,1.5)+l(x,y,350,y,C.dim,1,'3 5')+(i%2?l(x,y-5,x,y+5,C.gold,2):c(x,y,4,C.gold));}out+=t(270,201,kind==='survival'?'follow-up →':'compute time →');
 }else if(kind==='causal'){
  [68,120,172].forEach((y,i)=>{out+=c(75,y,8,C.white,false)+l(85,y,165,y)+p(`M165 ${y}Q205 ${y} 230 ${y-15}`,C.gold)+p(`M165 ${y}Q205 ${y} 230 ${y+15}`,C.blue)+c(243,y-15,5,C.gold)+c(243,y+15,5,C.blue)+l(253,y-15,335,y-15,C.gold,1,'2 4')+l(253,y+15,335,y+15,C.blue,1,'2 4');});out+=t(42,202,'groups')+t(205,202,'treatments → outcomes');
 }else if(kind==='generalization'){
  for(let i=0;i<9;i++)for(let j=0;j<6;j++)out+=rect(67+i*22,55+j*22,11,11,(i+j)%2?C.blue:C.gold,(i+j)%3===0);
  out+=p('M52 180C95 60 190 200 300 57',C.white,1.5)+t(285,188,'f(x)');
 }else if(kind==='crowds'||kind==='cooperative'){
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,x=200+Math.cos(a)*125,y=120+Math.sin(a)*72;out+=l(x,y,200,120,C.dim,.7)+c(x,y,3+i%3,i%3?C.blue:C.gold);}out+=c(200,120,24,C.gold,false)+c(200,120,6,C.white);if(kind==='cooperative')out+=p('M60 185Q200 60 340 185',C.gold,1.5);
 }else if(kind==='memory'){
  for(let row=0;row<5;row++){const n=16>>Math.min(row,3),size=5+row*3;for(let i=0;i<n;i++){const x=200+(i-(n-1)/2)*(size+9),y=185-row*31;out+=rect(x-size/2,y-size/2,size,size,row%2?C.blue:C.gold,row===4);if(row<4)out+=l(x,y-5,200+(Math.floor(i/2)-(Math.ceil(n/2)-1)/2)*(size+12),y-25,C.dim,.65);}}
 }else if(kind==='compute'||kind==='hierarchy'){
  const nodes=[[200,50,12],[110,100,10],[290,100,6],[65,160,4],[150,160,7],[250,160,4],[335,160,3]];
  [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]].forEach(([a,b])=>out+=l(nodes[a][0],nodes[a][1],nodes[b][0],nodes[b][1],C.dim));
  nodes.forEach(([x,y,r],i)=>out+=kind==='compute'?c(x,y,r,i<2?C.gold:C.blue,false):rect(x-15,y-10,30,20,i<2?C.gold:C.blue));out+=t(245,197,kind==='compute'?'where errors propagate':'task-specific views');
 }else if(kind==='personalization'){
  out+=l(45,175,350,175)+l(45,175,45,55);out+=p('M50 150C120 160 180 145 225 95S300 45 350 75',C.gold,2)+p('M50 90C140 70 185 110 245 125S310 115 350 110',C.blue,2);out+=l(212,55,212,175,C.dim,1,'3 4')+t(65,197,'one rule?')+t(240,197,'a personal rule?');
 }else if(kind==='media'){
  for(let i=0;i<12;i++){const x=80+(i%4)*80,y=65+Math.floor(i/4)*55;out+=c(x,y,20,i===6?C.gold:C.dim,false)+points(x,y,4+i%5,23,i===6?C.gold:C.blue,i*30+1);}out+=p('M230 62L249 62M240 52L240 72',C.gold);
 }else if(kind==='swarm'){
  for(let i=0;i<72;i++){const a=i*.53,r=15+i*1.35,x=200+Math.cos(a)*r*1.3,y=120+Math.sin(a)*r*.65;out+=p(`M${x-2} ${y+4}l3 -8l3 7`,i%4?C.blue:C.gold,.8);}out+=p('M92 175Q205 220 310 120',C.white,.8);
 }else if(kind==='transfer'){
  out+=points(105,125,38,100,C.blue)+points(295,125,28,100,C.gold,80);for(let i=0;i<4;i++)out+=p(`M145 ${90+i*18}Q200 ${55+i*15} 255 ${90+i*18}`,C.dim,.8);out+=t(65,194,'source')+t(269,194,'target');
 }else if(kind==='pathology'){
  for(let i=0;i<46;i++){let x=65+rand(i+1)*270,y=50+rand(i+700)*130;out+=p(`M${x} ${y}l8 -4l9 6l-2 10l-13 2Z`,i%3?C.dim:C.gold,.8,i%5?'none':'#425461');}out+=l(40,192,115,192,C.white,2)+t(270,194,'image → signal');
 }else if(kind==='signals'){
  for(let row=0;row<4;row++){let d='';for(let i=0;i<30;i++){let x=50+i*10,y=65+row*35+Math.sin(i*(.5+row*.2))*12;d+=(i?'L':'M')+x+' '+y;}out+=p(d,row%2?C.blue:C.gold,1.2);}out+=t(270,208,'interaction');
 }else if(kind==='communication'){
  out+=c(105,120,45,C.blue,false)+c(295,120,45,C.gold,false)+p('M105 75A45 45 0 1 1 62 105',C.blue,3)+p('M150 105Q200 55 250 105',C.white,1.4)+p('M250 135Q200 185 150 135',C.white,1.4);for(let i=0;i<6;i++)out+=rect(87+(i%2)*15,99+Math.floor(i/2)*15,7,7,C.blue);out+=t(76,189,'remember')+t(277,189,'signal');
 }else if(kind==='frontier'){
  out+=l(65,180,345,180)+l(65,180,65,45);out+=p('M85 60C95 115 165 165 330 170',C.gold,2);[.15,.45,.8].forEach(q=>{let x=85+q*245,y=60+110*Math.sqrt(q);out+=c(x,y,4,C.white);});out+=t(80,202,'learning')+t(80,48,'reliable inference');
 }else if(kind==='oracle'){
  out+=c(100,125,22,C.blue,false)+c(295,125,43,C.gold,false)+p('M125 105Q200 45 257 100',C.dim,1.5)+p('M255 150Q185 190 125 145',C.white,1.5)+t(187,80,'?')+t(78,182,'learner')+t(277,191,'oracle');
 }else if(kind==='clinical'||kind==='radiation'){
  out+=l(55,180,350,180)+l(55,180,55,45);out+=p('M55 60H90V72H140V90H190V112H230V135H280V151H350',C.gold,2)+p('M55 65H110V87H150V115H210V145H270V164H350',C.blue,2);for(let i=0;i<7;i++)out+=l(88+i*35,72+i*14,88+i*35,82+i*14,C.white);out+=t(267,200,'time →');
 }else if(kind==='robot'){
  out+=p('M100 185H210M155 185V143L210 95L276 125L296 96',C.white,7)+c(155,143,9,C.blue)+c(210,95,10,C.gold)+c(276,125,7,C.blue)+p('M290 90L303 101M295 85L308 96',C.gold,2)+p('M280 82Q340 55 347 145',C.dim,1);out+=rect(325,145,20,20,C.gold);
 }else if(kind==='privacy'){
  out+=rect(55,65,90,115,C.dim)+l(70,85,130,85)+l(70,105,130,105)+l(70,125,130,125)+p('M150 105H250M250 140H150',C.blue,1.5)+rect(265,100,65,58,C.gold)+p('M278 100V82A20 20 0 0 1 318 82V100',C.gold,2)+c(297,125,4,C.gold)+l(297,129,297,141,C.gold,2);
 }else if(kind==='biology'){
  out+=p('M195 190Q200 120 210 50',C.white,2);for(let i=0;i<5;i++){let y=78+i*23;out+=p(`M203 ${y+22}Q${120-i*3} ${y-30} ${150-i*2} ${y+10}Q175 ${y+40} 203 ${y+22}`,C.blue,1)+p(`M202 ${y+10}Q280 ${y-30} 260 ${y+6}Q235 ${y+32} 202 ${y+10}`,C.gold,1);}
 }else if(kind==='organizm'){
  const a=[[110,80],[260,60],[310,160],[180,180],[70,155]];a.forEach(([x,y],i)=>{out+=l(x,y,200,120,C.dim)+rect(x-18,y-12,36,24,i%2?C.blue:C.gold);});out+=c(200,120,19,C.white,false)+l(195,113,205,113,C.white)+l(195,120,205,120,C.white)+l(195,127,205,127,C.white);
 }
 return `<svg viewBox="0 0 400 240" aria-hidden="true"><g>${out}</g></svg>`;
}
$$('.project-art').forEach(el=>el.insertAdjacentHTML('afterbegin',artFor(el.dataset.art)));
const dialog=$('#project-dialog');let returnFocus=null;
function openProject(id,trigger){const project=$('#project-'+id);if(!project)return;if(!dialog.showModal){project.open=true;project.scrollIntoView();return;}returnFocus=trigger;$('#dialog-content').innerHTML=project.querySelector('.project-art').outerHTML+project.querySelector('.project-heading').outerHTML+project.querySelector('.project-detail').outerHTML;$('#dialog-content h3').id='dialog-title';dialog.showModal();$('.dialog-close').focus();}
$$('[data-project]').forEach(el=>el.addEventListener('click',event=>{event.preventDefault();openProject(el.dataset.project,el);}));
$$('[data-open]').forEach(el=>el.addEventListener('click',event=>{event.preventDefault();openProject(el.dataset.open,el);}));
$('.dialog-close').addEventListener('click',()=>{dialog.close();if(returnFocus)returnFocus.focus({preventScroll:true});});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{if(returnFocus)returnFocus.focus({preventScroll:true});});
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.filter;let n=0;$$('.project').forEach(el=>{el.hidden=key!=='all'&&el.dataset.family!==key;if(!el.hidden)n++;});$$('[data-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));$('#filter-status').textContent=n+' projects'+(key==='all'?'':' · '+button.textContent);}));
status();resize();
