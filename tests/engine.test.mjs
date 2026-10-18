import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {prepare,finish} from '../.agents/skills/delta-loadout/scripts/lib/runtime.mjs';
import {html} from '../.agents/skills/delta-loadout/scripts/lib/report.mjs';
const cases=JSON.parse(fs.readFileSync(new URL('fixtures/online-v16.json',import.meta.url)));
const choice=p=>p.x?{style:p.s,status:'unavailable',reason:p.x}:{style:p.s,weapons:p.w.map(([build_id,ammo_id,ammo_qty])=>({build_id,ammo_id,ammo_qty})),...Object.fromEntries([['helmet_id','头盔'],['armor_id','护甲'],['chest_id','胸挂'],['bag_id','背包']].map(([key,slot])=>[key,p.g.find(x=>x[0]===slot)?.[1]??null])),supplies:p.u.map(([item_id,quantity])=>({item_id,quantity}))};
for(const row of cases)test('replay '+row.name,()=>{
 const r=row.data,state=prepare({map:r.m,difficulty:r.d,budget:r.o,allow_rare:false,allow_damaged:true});
 const out=finish(state,{plans:r.p.map(choice)});assert.deepEqual(out.proposal_errors,[]);
 for(const [i,p] of out.plans.entries()){const expected=r.p[i];assert.equal(p.style,expected.s);if(expected.x){assert.equal(p.status,'unavailable');continue;}assert.equal(p.status,'draft');assert.equal(p.total,expected.t);assert.equal(p.entry_value,expected.e);assert.ok(p.checks.parts);}
});
const input={map:'长弓溪谷',difficulty:'机密',budget:400000,allow_rare:false};
test('invalid inputs reject without manufacturing defaults',()=>{
 for(const x of [null,[],{...input,allow_rare:'false'},{...input,allow_damaged:'false'},{...input,budget:-1},{...input,map:'不存在'}])assert.throws(()=>prepare(x));
});
test('invalid model IDs are rejected and explicitly fall back',()=>{
 const state=prepare(input),proposal={plans:JSON.parse(state.seed_choices)};proposal.plans[0].weapons[0].build_id='invented';
 const out=finish(state,proposal);assert.ok(out.proposal_errors.some(e=>e.style==='猛攻'));assert.equal(out.plans[0].selection_source,'validated_fallback');assert.equal(out.plans[0].total,399881);
});
test('five-level boundary and basic medicine cannot be weakened',()=>{
 const state=prepare({...input,map:'航天基地',budget:1500000});const proposal={plans:JSON.parse(state.seed_choices)};
 proposal.plans[0].supplies=[];const out=finish(state,proposal);assert.ok(out.proposal_errors.some(e=>e.style==='猛攻'));assert.ok(out.plans[0].weapons.every(w=>w.ammo.grade>=5));assert.ok(out.plans[0].supplies.length>0);
});
test('hard mode gold medical survives removal attempt',()=>{
 const state=prepare({...input,map:'航天基地',difficulty:'绝密',budget:4000000}),proposal={plans:JSON.parse(state.seed_choices)};
 const gold=JSON.parse(state.registry).supplies.find(i=>i.item_name==='战地医疗箱').item_id;
 proposal.plans[0].supplies=proposal.plans[0].supplies.filter(s=>String(s.item_id)!==String(gold));
 const out=finish(state,proposal);assert.ok(out.proposal_errors.length);assert.ok(out.plans[0].supplies.some(s=>s.item.item_name==='战地医疗箱'));
});
test('self-contained report escapes data and retains all parts and medical images',()=>{
 const out=finish(prepare(input));out.plans[0].tactic='<script>alert(1)</script>';const text=html(out);
 assert.ok(text.includes('&lt;script&gt;'));assert.ok(!text.includes('<script>'));
 assert.ok(text.includes('战术快拆手术包'));assert.ok(text.includes('强效注射器'));assert.ok(text.includes('6L7ULQ409PM2VH1Q6BFJQ'));assert.ok(text.includes('https://'));
 for(const part of out.plans[0].weapons[0].parts)assert.ok(text.includes(part.item_name));
});
