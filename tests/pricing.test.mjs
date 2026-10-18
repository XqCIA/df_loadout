import assert from 'node:assert/strict';
import test from 'node:test';
import {tables,prepare,finish} from '../.agents/skills/delta-loadout/scripts/lib/runtime.mjs';
import {fetchPricing,refreshPrices,priceParts,priceBuilds} from '../.agents/skills/delta-loadout/scripts/lib/pricing.mjs';
import {html} from '../.agents/skills/delta-loadout/scripts/lib/report.mjs';
const now=1800000000000;
const prices=Object.fromEntries([...tables.df_items,...tables.df_gun_parts].filter(i=>i.unit_price>0).map(i=>[i.item_id,Math.round(i.unit_price*1.05)]));
const quote=(changes={})=>refreshPrices({rows:tables.df_items,now,status:200,body:{generated_at:now,prices},...changes});
test('latest quotes reprice every gun part, ammo, equipment and medical total',()=>{
 const q=quote();assert.equal(JSON.parse(q.price_meta).mode,'live');
 const state=prepare({map:'航天基地',difficulty:'机密',budget:1500000,allow_rare:false},q);
 const out=finish(state,{plans:JSON.parse(state.seed_choices)});
 assert.deepEqual(out.proposal_errors,[]);assert.equal(out.snapshot,null);
 assert.ok(out.plans.filter(p=>p.status==='draft').length>=4);
 for(const p of out.plans.filter(p=>p.status==='draft')){
  let sum=0;
  for(const w of p.weapons){
   assert.equal(w.gun.gun_total,w.parts.reduce((s,x)=>s+x.unit_price*x.quantity,0));
   for(const x of w.parts)assert.equal(x.unit_price,prices[x.item_id]);
   assert.equal(w.ammo.unit_price,prices[w.ammo.item_id]);
   sum+=w.gun.gun_total+w.ammo.unit_price*w.ammoQty;
  }
  for(const x of [...p.equipment,...p.supplies]){assert.equal(x.item.unit_price,prices[x.item.item_id]);sum+=x.item.unit_price*x.quantity;}
  assert.equal(sum,p.total);assert.ok(p.total<=1500000);assert.ok(p.checks.parts);
 }
 assert.ok(out.plans[0].weapons.every(w=>w.ammo.grade>=5));
 assert.ok(html(out).includes('来源最新报价'));assert.ok(!html(out).includes('价格快照 null'));
});
test('bad, stale, sparse and unavailable sources fall back as a whole',async()=>{
 for(const args of [{status:500},{body:'oops'},{body:{generated_at:now-1800001,prices}},{body:{generated_at:now,prices:{123:100}}}]){
  const q=quote(args);assert.equal(JSON.parse(q.price_meta).mode,'fallback');assert.deepEqual(q.rows,tables.df_items);
 }
 const q=await fetchPricing(tables.df_items,{fetchImpl:async()=>{throw Error('offline');}});
 assert.equal(JSON.parse(q.price_meta).mode,'fallback');
 const offline=await fetchPricing(tables.df_items,{mode:'snapshot',fetchImpl:()=>{throw Error('must not fetch');}});
 assert.equal(JSON.parse(offline.price_meta).mode,'snapshot');
});
test('a missing current part excludes its build instead of mixing old prices',()=>{
 const part=tables.df_gun_parts.find(p=>p.unit_price>0),reduced={...prices};delete reduced[part.item_id];
 const q=quote({body:{generated_at:now,prices:reduced}});assert.equal(JSON.parse(q.price_meta).mode,'live');
 const parts=priceParts({...q,rows:tables.df_gun_parts});
 assert.ok(parts.filter(p=>p.item_id===part.item_id).every(p=>p.has_price===0&&p.unit_price===null));
 const builds=priceBuilds({...q,rows:tables.df_gun_builds,parts});
 assert.ok(builds.filter(b=>String(b.build_id)===String(part.build_id)).every(b=>b.gun_total===null&&b.missing_count>0));
});
