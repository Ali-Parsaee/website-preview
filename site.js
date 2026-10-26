'use strict';
document.documentElement.classList.add('js');
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let chapter = 0, paused = reducedMotion;
const rand = n => { const v = Math.sin(n * 127.13 + 31.7) * 43758.5453; return v - Math.floor(v); }; // seeded jitter for the project drawings

// The figure holds five small working models (labs.js), one per chapter. This part only switches between them.
const labs = window.Labs ? window.Labs.mount($('#world-canvas'), {
  say: t => { $('#scene-result').textContent = t; },
  legend: h => { $('#lab-legend').innerHTML = h; },
  title: t => { $('#scene-title').textContent = t; },
  explored: i => { const tab = $$('[data-go]')[i]; if (tab && !tab.classList.contains('explored')) { tab.classList.add('explored'); tab.setAttribute('aria-label', tab.lastChild.textContent.trim() + ', explored'); } },
  paused: () => paused
}) : null;
function goToChapter(index, focus = false) {
  chapter = Math.max(0, Math.min(4, index));
  $$('.chapter').forEach((el, i) => { el.classList.toggle('active', i === chapter); el.setAttribute('aria-hidden', String(i !== chapter)); });
  $$('[data-go]').forEach((el, i) => el.setAttribute('aria-current', i === chapter ? 'step' : 'false'));
  $$('.lab-controls').forEach(el => { el.hidden = +el.dataset.lab !== chapter; });
  $('#previous').disabled = chapter === 0;
  $('#next').innerHTML = chapter === 4 ? 'Back to the beginning <span>↺</span>' : 'Follow the question <span>→</span>';
  if (labs) labs.show(chapter);
  if (innerWidth <= 650) $('#story').scrollIntoView({behavior: paused ? 'instant' : 'smooth'});
  if (focus) $('#chapter-title-' + chapter).focus({preventScroll: true});
}
$$('[data-go]').forEach(button => button.addEventListener('click', () => goToChapter(+button.dataset.go)));
$('#previous').addEventListener('click', () => goToChapter(chapter - 1, true));
$('#next').addEventListener('click', () => goToChapter(chapter === 4 ? 0 : chapter + 1, true));
$('.chapter-tabs').addEventListener('keydown', event => { if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 4 : (chapter + (event.key === 'ArrowRight' ? 1 : 4)) % 5; goToChapter(next); $$('[data-go]')[next].focus(); });
function motionLabel() { document.documentElement.classList.toggle('motion-paused', paused); $('#motion').textContent = paused ? 'Enable transitions' : 'Pause transitions'; $('#motion').setAttribute('aria-pressed', String(paused)); }
$('#motion').addEventListener('click', () => { paused = !paused; motionLabel(); if (labs) labs.redraw(); });
motionLabel();
if (labs) {
  labs.show(0);
  // The first model starts learning on its own once the figure is on screen, unless motion is reduced.
  if (!paused && 'IntersectionObserver' in window) {
    const watch = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      watch.disconnect();
      setTimeout(() => { if (chapter === 0 && !paused) labs.autoplay(0); }, 1400);
    }, {threshold: .45});
    watch.observe($('.world'));
  }
}

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
