// node sweep_run.js <url> <rootSel> <canvasSel> <w> <h> <mobile> [preEval]
const {spawn}=require('child_process'),fs=require('fs'),os=require('os'),path=require('path');
const [url,rootSel,canvasSel,w,h,mob,pre]=process.argv.slice(2);const W=+w,H=+h,mobile=mob==='1';
const port=9300+Math.floor(Math.random()*300),prof=fs.mkdtempSync(path.join(os.tmpdir(),'sw-'));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu',`--remote-debugging-port=${port}`,`--user-data-dir=${prof}`,`--window-size=${W},${H}`,'--no-first-run','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const cdpErr=[];
(async()=>{let t;for(let k=0;k<100&&!t;k++){await sleep(100);try{t=(await(await fetch(`http://127.0.0.1:${port}/json`)).json()).find(x=>x.type==='page');}catch(e){}}
  const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const wt={};const send=(m,p={})=>new Promise(r=>{const n=++id;wt[n]=r;ws.send(JSON.stringify({id:n,method:m,params:p}));});
  ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&wt[d.id]){wt[d.id](d.result||d.error);delete wt[d.id];return;}if(d.method==='Runtime.exceptionThrown')cdpErr.push((d.params.exceptionDetails.exception&&d.params.exceptionDetails.exception.description||d.params.exceptionDetails.text).split('\n')[0]);
    if(d.method==='Runtime.consoleAPICalled'&&d.params.type==='error')cdpErr.push('console: '+d.params.args.map(a=>a.value||a.description).join(' ').slice(0,200));};
  await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:mobile?2:1,mobile});
  await send('Page.navigate',{url});await sleep(1500);
  if(pre)await send('Runtime.evaluate',{expression:pre,awaitPromise:true});
  await send('Runtime.evaluate',{expression:`document.querySelector(${JSON.stringify(canvasSel)}).scrollIntoView({block:'start'})`});
  const code=fs.readFileSync(path.join(__dirname,'sweep_inpage.js'),'utf8');
  const r=await send('Runtime.evaluate',{expression:`(${code})(${JSON.stringify(rootSel)},${JSON.stringify(canvasSel)})`,awaitPromise:true,returnByValue:true,timeout:240000});
  const res=(r.result&&r.result.value)||[];let bad=0,blank=0,still=0;
  for(const s of res){if(s.err.length){bad++;console.log('  ERROR',s.label,'::',s.err.join(' | ').slice(0,200));}if(s.ink<20){blank++;console.log('  BLANK?',s.label,'ink',s.ink,s.size);}if(!s.changed)still++;}
  console.log(`  ${res.length} actions · ${bad} with errors · ${blank} near-blank · ${still} did not change the canvas`+(cdpErr.length?` · page exceptions: ${[...new Set(cdpErr)].join(' | ').slice(0,300)}`:''));
  if(process.env.VERBOSE)res.filter(s=>!s.changed).forEach(s=>console.log('    unchanged:',s.label));
  ws.close();chrome.kill();await sleep(300);try{fs.rmSync(prof,{recursive:true,force:true});}catch(e){}process.exit(0);
})().catch(e=>{console.error(e);chrome.kill();process.exit(1);});
