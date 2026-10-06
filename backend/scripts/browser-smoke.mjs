import express from 'express';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const app = require('../dist/app.js').default;
const host = express();
host.use('/api', (req,res,next) => { req.url = '/api' + req.url; app(req,res,next); });
host.use(express.static(resolve('frontend-integration/dist')));
host.get('*', (req,res) => res.sendFile(resolve('frontend-integration/dist/index.html')));
const server = host.listen(5199,'127.0.0.1');
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--no-first-run','--no-default-browser-check','--disable-gpu','--remote-debugging-port=9224',`--user-data-dir=${resolve('browser-profile')}`,'about:blank'], { windowsHide:true,stdio:'ignore' });
const sleep = ms => new Promise(r => setTimeout(r,ms));
console.log('Starting headless route smoke checks');
let ws; let serial = 0; const pending = new Map(); const exceptions=[];
try {
 let targets;
 for(let i=0;i<50;i++) { try { targets=await (await fetch('http://127.0.0.1:9224/json', { signal: AbortSignal.timeout(1000) })).json(); break; } catch { await sleep(200); } }
 if(!targets) throw new Error('Headless browser did not start');
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl); await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.onmessage=e=>{ const value=JSON.parse(e.data); if(value.id){const p=pending.get(value.id);if(p){pending.delete(value.id);value.error?p.reject(value.error):p.resolve(value.result);}} else if(value.method==='Runtime.exceptionThrown') exceptions.push(value.params.exceptionDetails.text+' '+(value.params.exceptionDetails.exception?.description || '')); };
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 await send('Page.enable');await send('Runtime.enable');
 const results=[];
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
  await send('Emulation.setDeviceMetricsOverride',{...viewport,deviceScaleFactor:1,mobile:viewport.width<600});
  for(const route of ['/','/shop','/categories','/cart','/checkout','/account','/contact','/admin','/admin/login','/admin/products']) {
   await send('Page.navigate',{url:`http://127.0.0.1:5199${route}`}); await sleep(1000);
   const evaluated=await send('Runtime.evaluate',{expression:'JSON.stringify({path:location.pathname,text:document.body.innerText.slice(0,250),overflow:document.documentElement.scrollWidth>innerWidth})',returnByValue:true});
   const result=JSON.parse(evaluated.result.value); results.push({route,viewport:viewport.width,...result});
   console.log(JSON.stringify({route,viewport:viewport.width,path:result.path,overflow:result.overflow}));
  }
 }
 await writeFile('browser-smoke-results.json',JSON.stringify({results,exceptions},null,2));
 if(exceptions.length) throw new Error(`Browser runtime exceptions: ${exceptions.join('; ')}`);
 console.log('Public and unauthorized-route smoke checks passed; database/provider flows were not exercised.');
} finally { if(ws)ws.close();chrome.kill();await require('../dist/repositories/prisma.js').default.$disconnect(); server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
