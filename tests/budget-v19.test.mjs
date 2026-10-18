import test from 'node:test';
import assert from 'node:assert/strict';
import {prepare,finish,c,tables} from '../.agents/skills/delta-loadout/scripts/lib/runtime.mjs';
import {validate,cleanItems} from '../.agents/skills/delta-loadout/scripts/lib/engine.mjs';
const input={map:'航天基地',difficulty:'绝密',budget:1000000,allow_rare:true};
test('absolute-secret low budget retains assault grade 5 and gives an actionable budget gap',()=>{
 const out=finish(prepare(input)),p=out.plans[0];assert.equal(p.status,'unavailable');assert.ok(p.budget_diagnostic.ammo_pressure);assert.equal(p.budget_diagnostic.shortfall,p.budget_diagnostic.total-input.budget);assert.match(p.reason,/请将预算提高/);assert.match(p.reason,/五级/);
 const rat=out.plans[1];assert.equal(rat.status,'draft');assert.equal(rat.ammo.grade,4);assert.ok(rat.total<=input.budget);assert.ok(rat.entry_value>=600000);
 for(const style of ['猛攻','以小博大','堵桥'])assert.equal(c.ammoPolicy(style,input).min,5);
 assert.equal(c.ammoPolicy('鼠鼠',{...input,difficulty:'永夜'}).min,5);
});
test('damaged assault armor follows consent and grade floors, gold medical and repairs are optional',()=>{
 const items=JSON.parse(cleanItems({rows:tables.df_items}).items);
 const helmet=items.find(x=>x.subcategory==='helmet'&&x.grade===4&&c.damaged(x)&&c.gearAllowed(x,'猛攻',{...input,allow_damaged:true}));
 const armor=items.find(x=>x.subcategory==='armor'&&x.grade===5&&c.damaged(x));
 for(const item of [helmet,armor]){assert.ok(c.gearAllowed(item,'猛攻',{...input,allow_damaged:true}));assert.ok(!c.gearAllowed(item,'猛攻',{...input,allow_damaged:false}));}
 const state=prepare({...input,budget:2000000}),p=JSON.parse(state.seeds)[0];assert.equal(p.status,'draft');
 p.equipment=p.equipment.map(e=>e.slot==='头盔'?{...e,item:helmet}:e.slot==='护甲'?{...e,item:armor}:e);
 p.supplies=c.supplySpec('猛攻',input).map(([name,quantity])=>({item:items.find(i=>i.item_name===name),quantity}));
 p.supplies.push({item:items.find(i=>i.item_name==='标准头盔维修包'),quantity:1});
 Object.assign(p,c.cost(p));const check=x=>JSON.parse(validate({plan:JSON.stringify(x),request:state.request,rule:state.rule}).plan);
 assert.equal(check(p).status,'draft');
 p.supplies=p.supplies.filter(x=>x.item.item_name!=='强效注射器');Object.assign(p,c.cost(p));assert.match(check(p).reason,/绿针/);
});
test('comfortable budgets prefer gold medical without exceeding the budget',()=>{
 const p=finish(prepare({...input,budget:4000000})).plans[0];assert.equal(p.status,'draft');assert.ok(p.weapons.every(w=>w.ammo.grade>=5));assert.ok(p.supplies.some(s=>s.item.item_name==='战地医疗箱'));assert.ok(p.total<=4000000);
});
