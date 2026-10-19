import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createApp} from './server.mjs';

async function running(t,generate){
 const store=await fs.mkdtemp(path.join(os.tmpdir(),'df-web-test-'));
 const server=createApp({store,...(generate?{generate}:{})});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));await fs.rm(store,{recursive:true,force:true});});
 return {base,store,server};
}
const request={map:'长弓溪谷',difficulty:'常规',budget:500000,allow_rare:false,allow_damaged:true,prices:'snapshot'};
const post=(base,data,headers={})=>fetch(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});

test('local API validates inputs, origin and paths before invoking engine',async t=>{
 let calls=0;const {base}=await running(t,()=>{calls++;throw Error('unexpected');});
 assert.equal((await fetch(base+'/')).status,200);
 assert.equal((await fetch(base+'/api/config')).status,200);
 for(const body of [{...request,budget:0},{...request,budget:'50万'},{...request,map:'长弓溪谷',difficulty:'绝密'},{...request,allow_rare:'true'},{...request,prices:'unknown'}])assert.equal((await post(base,body)).status,400);
 assert.equal((await post(base,request,{Origin:'https://example.com'})).status,403);
 const badHostStatus=await new Promise((resolve,reject)=>http.get(base+'/api/config',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject));
 assert.equal(badHostStatus,403);
 assert.equal((await fetch(base+'/.agents/skills/delta-loadout/data/tables.json')).status,404);
 assert.equal((await fetch(base+'/reports/not-a-uuid/report.html')).status,404);
 assert.equal(calls,0);
});

test('busy requests are rejected and failures allow retry',async t=>{
 let fail;const {base}=await running(t,()=>new Promise((_,reject)=>{fail=reject;}));
 const first=post(base,request);while(!fail)await new Promise(r=>setTimeout(r,10));
 assert.equal((await post(base,request)).status,429);fail(Error('test failure'));assert.equal((await first).status,500);
 assert.equal((await (await fetch(base+'/api/config')).json()).busy,false);
});

test('real engine persists complete HTML and JSON; three budgets retain rules',{timeout:180000},async t=>{
 const {base,store}=await running(t);
 let savedReport;
 for(const input of [request,{...request,map:'航天基地',difficulty:'绝密',budget:1000000,allow_rare:true},{...request,map:'航天基地',difficulty:'绝密',budget:1200000,allow_rare:true}]){
  const response=await post(base,input);assert.equal(response.status,200);const meta=await response.json();
  const result=await (await fetch(base+meta.json_url)).json();
  assert.equal(result.rules_version,'19');assert.equal(result.plans.length,5);
  for(const p of result.plans.filter(p=>p.status==='draft')){assert.ok(p.total<=result.request.budget);assert.ok(p.entry_value>=result.rule.min_entry_value);}
  if(input.difficulty==='绝密'){
   const assault=result.plans.find(p=>p.style==='猛攻');
   if(assault.status==='draft')assert.ok(assault.weapons.every(w=>w.ammo.grade>=5));else assert.match(assault.reason,/预算|支出|候选/);
   const rat=result.plans.find(p=>p.style==='鼠鼠');assert.equal(rat.status,'draft');assert.ok(rat.weapons.every(w=>w.ammo.grade>=4));
  }
  const htmlResponse=await fetch(base+meta.report_url);const html=await htmlResponse.text();assert.match(html,/完整枪械与配件明细/);assert.match(html,/<img src="https:/);assert.match(html,/补给/);assert.ok(!html.includes('agent.nuwax.com'));assert.ok(!html.includes('chatgpt.site'));
  assert.equal(await fs.readFile(path.join(store,meta.id,'report.html'),'utf8'),html);
  assert.match((await fetch(base+meta.report_url+'?download=1')).headers.get('content-disposition'),/^attachment/);
  assert.equal((await (await fetch(base+`/reports/${meta.id}/meta.json`)).json()).id,meta.id);
  savedReport=meta.report_url;
  console.log(input.map,input.difficulty,input.budget,meta.plans.map(p=>`${p.style}:${p.total??'无方案'}`).join(' '));
 }
 const restarted=createApp({store});await new Promise(resolve=>restarted.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>restarted.close(resolve)));
 assert.match(await (await fetch(`http://127.0.0.1:${restarted.address().port}${savedReport}`)).text(),/完整枪械与配件明细/);
});
