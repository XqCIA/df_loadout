import {common} from './rules.mjs';
import {validate} from './engine.mjs';
export function catalog(args,c=common()) {
 const items=JSON.parse(args.items),builds=JSON.parse(args.builds),r=JSON.parse(args.request),rule=JSON.parse(args.rule),seeds=JSON.parse(args.seeds),styles=c.styles;
 const chosen=[];for(const name of new Set(builds.map(b=>b.weapon_name))){const bs=builds.filter(b=>b.weapon_name===name&&!b.bare).sort((a,b)=>a.gun_total-b.gun_total);for(const j of new Set([0,Math.floor(bs.length/2),bs.length-1]))if(bs[j])chosen.push(bs[j]);const bare=builds.find(b=>b.weapon_name===name&&b.bare);if(bare)chosen.push(bare);}
 for(const p of seeds.filter(p=>p.status==='draft'))for(const w of c.weapons(p))if(!chosen.some(b=>b.build_id===w.gun.build_id))chosen.push(w.gun);
 const ammo=items.filter(i=>i.category==='ammo'&&chosen.some(b=>b.caliber===i.subcategory)&&styles.some(s=>c.ammoAllowed(i,s,r)));
 const all=items.filter(i=>['helmet','armor','chest','bag'].includes(i.subcategory)&&styles.some(s=>c.gearAllowed(i,s,r))&&i.unit_price<=r.budget);
 const gear=all; // Keep alternatives with different hearing, visibility, mobility and condition.

 for(const p of seeds.filter(p=>p.status==='draft'))for(const e of p.equipment)if(!gear.some(i=>i.item_id===e.item.item_id))gear.push(e.item);
 const supplies=items.filter(i=>i.medical_role&&styles.some(s=>c.supplyAllowed(i,s,r)));
 const fmt=i=>({id:String(i.item_id),name:i.item_name,p:i.unit_price,g:i.grade,sub:i.subcategory,...(i.capacity_slots?{slots:i.capacity_slots}: {})});
 const data={request:r,applicable_styles:styles.filter(s=>c.styleAvailable(s,r)),rule,mode_budget_cap:c.budgetCap(r),flower_armor_cap:c.flowerArmorCap(r),bargain_armor_cap:c.bargainArmorCap(r),ammo_policy:Object.fromEntries(styles.map(s=>[s,c.ammoPolicy(s,r)])),normal_caps:c.normal(r)?{ammo:3,helmet:4,armor:4}:null,
  builds:chosen.map(b=>({id:String(b.build_id),name:b.weapon_name,p:b.gun_total,caliber:b.caliber,bare:b.bare,styles:styles.filter(s=>c.gunAllowed(b,s,r)),legshot_priority:c.leg.includes(b.weapon_name)})),
  ammo:ammo.map(i=>({...fmt(i),styles:styles.filter(s=>c.ammoAllowed(i,s,r)),legshot_candidate:c.legAmmo(i),legshot_preference:c.legAmmoScore(i)})),gear:gear.map(i=>({...fmt(i),damaged:c.damaged(i),pristine:c.pristine(i),reference:c.gearInfo(i),preference_score:Object.fromEntries(styles.map(s=>[s,c.gearScore(i,s,r)])),styles:styles.filter(s=>c.gearAllowed(i,s,r))})),supplies:supplies.map(i=>({...fmt(i),role:i.medical_role,styles:styles.filter(s=>c.supplyAllowed(i,s,r))})),
  valid_seeds:seeds.filter(p=>p.status==='draft').map(c.choice),unavailable_seeds:seeds.filter(p=>p.status!=='draft'),
  guidance:'机密猛攻也按预算配补给：蓝血包加两根绿针、绿色手术、止血、止痛为基础；紫金血包、DEK/DVE、OE2、金修和增益针均按余款升级，不强制，不挤占合规枪弹；即使达到150万也只强制五级弹，不强制豪华药包。绝密/永夜仍必须战地医疗箱及原必要补给。猛攻代表主动交战而非固定高价：常规允许全新三至四级头甲，优先10万或20万元级真实改装候选；三级弹与基础回血/手术/止血/止痛优先，金修与豪华药包不强制，不因低预算直接判无解。堵桥仅在航天基地地图推荐，其他地图堵桥为不适用，不生成该装备清单。五个独立板块，按styles、ammo_policy、flower_armor_cap和bargain_armor_cap执行。花来只选修脚枪和同口径修脚弹，优先legshot_preference较高者，单独豁免机密/绝密/永夜弹药等级下限。以小博大头甲合计不超过整套预算20%且20万封顶，最高四级。堵桥只用G3/PSG-1/SR-25，高点抢位架枪，单独允许D6/Mask-1头盔。其他完整规则见系统提示词。候选reference和preference_score是参考与权重，不是实时游戏属性；未知不能编造。'};
 return {catalog:JSON.stringify(data),registry:JSON.stringify({builds:chosen,ammo,gear,supplies}),seed_choices:JSON.stringify(data.valid_seeds)};
}
export function checkChoices(args,v=validate,c=common()) {
 const reg=JSON.parse(args.registry),r=JSON.parse(args.request),prev=JSON.parse(args.previous||'[]'),out=[],errors=[];let raw,parseError;
 try{raw=JSON.parse(String(args.proposal||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));if(!Array.isArray(raw.plans))throw Error('plans非数组');}catch(e){raw={plans:[]};parseError=e.message;}
 for(const style of c.styles){
  if(!c.styleAvailable(style,r)){out.push({style,status:'unavailable',reason:'堵桥仅在航天基地地图推荐，本地图不适用；不生成堵桥装备清单。'});continue;}
  const old=prev.find(p=>p.style===style&&p.status==='draft');if(old){out.push(old);continue;}
  try{
   const xs=raw.plans.filter(p=>p.style===style);if(xs.length!==1)throw Error(parseError||'该风格缺失或重复');const q=xs[0];
   if(q.status==='unavailable')throw Error('模型报告无法满足：'+String(q.reason||'预算或候选不足').slice(0,300));
   if(!Array.isArray(q.weapons)||!Array.isArray(q.supplies))throw Error('weapons与supplies必须为数组');
   const weapons=q.weapons.map(x=>{const gun=reg.builds.find(b=>String(b.build_id)===String(x.build_id)),ammo=reg.ammo.find(i=>String(i.item_id)===String(x.ammo_id));if(!gun||!ammo)throw Error('枪或弹ID不在本轮真实候选中');return {gun,ammo,ammoQty:x.ammo_qty};});
   const equipment=[];for(const [k,slot,sub] of [['helmet_id','头盔','helmet'],['armor_id','护甲','armor'],['chest_id','胸挂','chest'],['bag_id','背包','bag']]){if(q[k]===null)continue;const item=reg.gear.find(i=>String(i.item_id)===String(q[k]));if(!item||item.subcategory!==sub)throw Error(slot+'ID无效');equipment.push({slot,item,quantity:1});}
   const supplies=q.supplies.map(x=>{const item=reg.supplies.find(i=>String(i.item_id)===String(x.item_id));if(!item)throw Error('补给ID不在候选中');return {item,quantity:x.quantity};});
   let tactic=c.tactic(style);if(!weapons.length&&style==='鼠鼠')tactic='普通低投入跑刀';
   const p={style,status:'draft',weapons,equipment,supplies,tactic,selection_source:args.repair==='yes'?'llm_repaired':'llm',model_reason:String(q.reason||'').slice(0,350)};Object.assign(p,c.cost(p));
   const checked=JSON.parse(v({plan:JSON.stringify(p),request:args.request,rule:args.rule},c).plan);if(checked.status!=='draft')throw Error(checked.reason);
   if(style==='花来'){const rat=out.find(p=>p.style==='鼠鼠'&&p.status==='draft');if(rat&&c.weapons(rat).some(a=>weapons.some(b=>a.gun.weapon_name===b.gun.weapon_name)))throw Error('花来与鼠鼠主枪重复，请从其他修脚枪型中选择同口径肉伤弹方案');}
   out.push(checked);
  }catch(e){errors.push({style,error:e.message});out.push({style,status:'unavailable',reason:e.message});}
 }
 return {plans:JSON.stringify(out),errors:JSON.stringify(errors),valid:errors.length?0:1};
}
export function finalize(args,c=common()) {
 const pp=JSON.parse(args.plans),seeds=JSON.parse(args.seeds),plans=c.styles.map(style=>{const p=pp.find(p=>p.style===style);if(p?.status==='draft')return p;const seed=seeds.find(p=>p.style===style);return seed?.status==='draft'?{...seed,selection_source:'validated_fallback',fallback_reason:p?.reason}:{style,status:'unavailable',reason:seed?.reason===p?.reason?seed.reason:(seed?.reason||'规则候选无可行组合')+' 模型复验：'+(p?.reason||'无有效结果')};});
 const rat=plans[1],flower=plans[2];if(rat.status==='draft'&&flower.status==='draft'&&c.weapons(rat).some(a=>c.weapons(flower).some(b=>a.gun.weapon_name===b.gun.weapon_name))){
  const alt=seeds.find(p=>p.style==='花来'&&p.status==='draft'&&!c.weapons(rat).some(a=>c.weapons(p).some(b=>a.gun.weapon_name===b.gun.weapon_name)));
  plans[2]=alt?{...alt,selection_source:'validated_fallback',fallback_reason:'更换与鼠鼠重复的主枪'}:{style:'花来',status:'unavailable',reason:'现有通过校验的花来与鼠鼠主枪重复，请更换候选后重试；未输出重复清单。'};
 }
 return {plans:JSON.stringify(plans),ids:c.ids(plans),audit:JSON.stringify(plans.map(p=>({style:p.style,source:p.selection_source,status:p.status,reason:p.fallback_reason})))};
}