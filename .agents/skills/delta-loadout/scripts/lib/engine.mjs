import {common} from './rules.mjs';
export function normalize(args,c=common()) {
  let x; try {x=JSON.parse(args.request_json||'{}');} catch {return {valid:0,request:'{}',message:'请输入有效 JSON：map、difficulty、budget、allow_rare。'};}
  const aliases={'大坝':'零号大坝','长弓':'长弓溪谷','航天':'航天基地','监狱':'潮汐监狱','az3':'AZ3'};
  x.map=aliases[x.map]||x.map; x.difficulty=x.difficulty==='普通'?'常规':x.difficulty;
  const s=String(x.budget??'').replace(/[,，\s]/g,''); x.budget=/^\d+(\.\d+)?[wW万]$/.test(s)?Number(s.slice(0,-1))*10000:Number(s);
  const issues=[];
  if(!['零号大坝','长弓溪谷','巴克什','航天基地','潮汐监狱','AZ3'].includes(x.map))issues.push('地图（零号大坝/长弓溪谷/巴克什/航天基地/潮汐监狱/AZ3）');
  if(!['常规','机密','绝密','永夜'].includes(x.difficulty))issues.push('难度（常规/机密/绝密/永夜）');
  if(!Number.isFinite(x.budget)||x.budget<=0||x.budget>100000000)issues.push('有效总预算（大于0，不超过1亿）');
  if(typeof x.allow_rare!=='boolean')issues.push('是否允许六级头甲、AW、红色背包、金色及以上胸挂等特殊物品（allow_rare=true/false）');
  if(!issues.length){x.requested_budget=x.budget;x.mode_budget_cap=c.budgetCap(x);x.budget=Math.min(x.requested_budget,x.mode_budget_cap);x.budget_capped=x.requested_budget>x.mode_budget_cap;}
  for(const key of ['allow_flower_bag','allow_penalty_helmet','allow_assault_used_armor'])x[key]=x[key]===true;
  x.allow_damaged=x.allow_damaged!==false;
  return {valid:issues.length?0:1,request:JSON.stringify(x),message:issues.length?'请补充：'+issues.join('；'):'参数完整'};
}
export function mapCheck(args) {
  const x=JSON.parse(args.request), rows=args.rows||[];
  const r=rows.find(r=>r.map_name===x.map&&r.difficulty===x.difficulty);
  const valid=!!r&&r.min_entry_value!==null&&r.min_entry_value!==''&&Number.isFinite(Number(r.min_entry_value))&&Number(r.min_entry_value)>=0;
  return {valid:valid?1:0,rule:JSON.stringify(valid?{...r,min_entry_value:Number(r.min_entry_value)}:{}),message:valid?'':'没有该地图难度的有效入场门槛，请调整输入或补充规则。'};
}
export function cleanItems(args) {
  const good=[],rejected=[];const seen=new Set();
  for(const r of args.rows||[]){const p=r.unit_price===null||r.unit_price===''||r.unit_price===undefined?null:Number(r.unit_price);if(!r.item_id||seen.has(r.item_id))continue;seen.add(r.item_id);if(Number(r.has_price)!==1||!Number.isFinite(p)||p<=0){rejected.push(r.item_id);continue;}good.push({...r,unit_price:p,grade:Number(r.grade)});}
  const bagSource='https://news.17173.com/content/10082025/214510396.shtml',rigSource='https://3g.ali213.net/gl/html/1739563.html';
  const capacities={'DG运动背包':[12,'4×3'],'轻型户外背包':[12,'3×4'],'战术快拆背包':[15,null],'突袭战术背包':[15,null],'露营背包':[15,null],'大型登山包':[16,null],'DASH战术背包':[20,null],'GA野战背包':[20,'5×4'],'3H战术背包':[18,'3×6'],'雨林猎手背包':[21,'3×7'],'D2战术登山包':[24,'4×6'],'GT1户外登山包':[25,'5×5'],'D3战术登山包':[28,null],'GT5野战背包':[30,'5×6'],'G01战术弹挂':[13,'5个1×2+1个1×3'],'DRC先进侦察胸挂':[17,'2个2×2+3个1×3']};
  for(const i of good){const c=capacities[i.item_name];if(c&&['chest','bag'].includes(i.subcategory)){i.capacity_slots=c[0];i.capacity_layout=c[1];i.capacity_source=i.subcategory==='chest'?rigSource:bagSource;i.capacity_status='社区攻略参考，非实时游戏核验';}}
  const medical={
    '简易注射器':['heal','基础回血，常规低投入'], '强效注射器':['heal','快速补充少量生命；可与医疗箱组合'],
    '车载急救包':['heal','基础回血，仅常规低投入候选'], '野战急救包':['heal','经济持续回血，使用时机需留余量'],
    '户外医疗箱':['heal','机密及主动交战优先候选'], '战地医疗箱':['heal','高投入持续作战回血候选'],
    '简易手术包':['surgery','基础损伤处理，仅常规候选'], '战术快拆手术包':['surgery','预算型损伤处理'], 'DEK野战手术包':['surgery','持续交战损伤处理优先候选'],
    '弹力绷带':['bleed','基础止血，仅常规候选'], 'CAT止血带':['bleed','止血，与回血功能分开'],
    '缓释止痛片':['pain','经济止痛'], '瓶装抗生素':['pain','预算型止痛用途'], 'DVE止疼片':['pain','持续交战止痛候选'],
    'OE2战斗兴奋剂':['stamina_recovery','短时恢复体力，交战与撤离应急'], '体能激活针':['stamina_buff','体能增益经济档'], '体能强化剂':['stamina_buff','体能增益高投入档'],
    '感知激活针':['hearing','感知/听力增益经济档'], '感知强化剂':['hearing','感知/听力增益高投入档'],
    'M1肌肉强化针':['carry','负重用途经济档'], 'M2肌肉注射剂':['carry','负重用途高投入档'], '去甲肾上腺素':['stamina_buff','体能容量用途，非默认优先'],
    '自制头盔维修包':['helmet_repair','头盔维修'], '标准头盔维修包':['helmet_repair','头盔维修'], '精密头盔维修包':['helmet_repair','头盔维修'], '高级头盔维修组合':['helmet_repair','头盔维修'],
    '自制护甲维修包':['armor_repair','护甲维修'], '标准护甲维修包':['armor_repair','护甲维修'], '精密护甲维修包':['armor_repair','护甲维修'], '高级护甲维修组合':['armor_repair','护甲维修']
  };
  for(const i of good){i.special_item=(['helmet','armor','bag'].includes(i.subcategory)&&i.grade===6)||(i.subcategory==='chest'&&i.grade>=5)||/^AWM?/.test(i.item_name);i.special_reason=i.special_item?(i.subcategory==='chest'?'金色及以上胸挂':i.subcategory==='bag'?'红色背包':'六级防具或AW系列'):null;const m=medical[i.item_name];if(m){i.medical_role=m[0];i.medical_note=m[1];i.medical_source='用户提供补给用途截图，2026-10-14；无现版本治疗量/时长数值核验';}}
  return {items:JSON.stringify(good),audit:JSON.stringify({input:(args.rows||[]).length,priced:good.length,missing_price:rejected.length,rejected})};
}
export function cleanBuilds(args,c=common()) {
 const req=JSON.parse(args.request),items=JSON.parse(args.items),byId=Object.fromEntries(items.map(i=>[i.item_id,i]));
 const builds=(args.rows||[]).filter(b=>b.game_mode==='operations'&&Number(b.missing_count)===0&&Number(b.gun_total)>0&&Number(b.gun_total)<req.budget&&c.calibers[b.weapon_name]&&byId[b.weapon_id]&&(req.allow_rare||!/^AWM?/.test(b.weapon_name))).map(b=>({...b,gun_total:Number(b.gun_total),caliber:c.calibers[b.weapon_name],category:byId[b.weapon_id].subcategory,bare:false}));
 // Bare alternatives use an existing priced weapon row. No invented modification code or attachments.
 for(const i of items)if(c.calibers[i.item_name]&&i.unit_price<req.budget&&(req.allow_rare||!c.special(i)))builds.push({build_id:'bare:'+i.item_id,weapon_name:i.item_name,weapon_id:i.item_id,gun_total:i.unit_price,caliber:c.calibers[i.item_name],category:i.subcategory,bare:true,share_code:null,captured_at:i.captured_at,base_item:i});
 return {builds:JSON.stringify(builds),audit:JSON.stringify({input:(args.rows||[]).length,eligible:builds.length,weapon_count:new Set(builds.map(b=>b.weapon_name)).size,caliber_coverage:c.calibers,note:'裸枪明确标记，无改枪码；映射依据游戏数据库与用户截图。'})};
}
export function policy(args,c=common()) {
 const request=JSON.parse(args.request),rule=JSON.parse(args.rule);if(!Number.isFinite(rule.min_entry_value)||rule.min_entry_value<0)throw new Error('地图门槛缺失');
 return {policy:JSON.stringify({style:args.style,request,minEntry:rule.min_entry_value,spendLimit:request.budget,supplySpec:c.supplySpec(args.style,request),version:16})};
}
export function pairGunAmmo(args,c=common()) {
 const p=JSON.parse(args.policy),r=p.request,items=JSON.parse(args.items),bs=JSON.parse(args.builds),pairs=[];
 // Preserve multiple base weapons, prices and ammunition routes. These are backup choices; the LLM sees the full catalog.
 for(const b of bs.filter(b=>c.gunAllowed(b,p.style,r))){
  const eligible=items.filter(i=>i.subcategory===b.caliber&&c.ammoAllowed(i,p.style,r));
  for(const a of eligible){for(const qty of b.category==='gunSniper'?[30]:p.style==='猛攻'?[180,90]:p.style==='花来'?(b.category==='gunShotgun'||b.category==='gunPistol'||b.weapon_name==='杠杆式步枪'?[60,90]:[180,90]):p.style==='堵桥'?[90,120]:[90]){
   const price=b.gun_total+a.unit_price*qty;if(price>=r.budget)continue;
   const tactic=c.tactic(p.style);
   pairs.push({gun:b,ammo:a,ammoQty:qty,weapons:[{gun:b,ammo:a,ammoQty:qty}],tactic,cost:price});
  }}
 }
 if(p.style==='鼠鼠'&&c.normal(r))pairs.push({gun:null,ammo:null,ammoQty:0,weapons:[],tactic:'普通裸装跑刀',cost:0});
 return {pairs:JSON.stringify(pairs),count:pairs.length};
}
export function equipment(args,c=common()) {
 const p=JSON.parse(args.policy),r=p.request,items=JSON.parse(args.items),pairs=JSON.parse(args.pairs),meds=p.supplySpec.map(([name,quantity])=>({item:items.find(i=>i.item_name===name),quantity}));
 const fail=reason=>({draft:JSON.stringify({style:p.style,status:'unavailable',reason}),ok:0});
 if(!c.styleAvailable(p.style,r))return fail('堵桥仅在航天基地地图推荐，本地图不适用；不生成堵桥装备清单。');
 if(meds.some(x=>!x.item))return fail('本风格必要补给缺少有价数据');
 const medCost=c.sum(meds.map(x=>x.item.unit_price*x.quantity));
 const pick=sub=>{const all=items.filter(i=>i.subcategory===sub&&c.gearAllowed(i,p.style,r)).sort((a,b)=>a.unit_price-b.unit_price);if(['helmet','armor'].includes(sub))return all.filter(x=>{const group=all.filter(y=>y.grade===x.grade&&c.damaged(y)===c.damaged(x));return group.slice(0,2).includes(x)||[...group].sort((a,b)=>c.gearScore(b,p.style,r)-c.gearScore(a,p.style,r)).slice(0,2).includes(x);});return all.filter(i=>i.capacity_slots).slice(0,20);};
 const h=pick('helmet'),a=pick('armor'),ch=pick('chest'),ba=pick('bag');
 if(p.style!=='猛攻'&&(!c.hard(r)||['花来','以小博大'].includes(p.style))){h.unshift(null);a.unshift(null);}ch.unshift(null);ba.unshift(null);
 let best=-Infinity,chosen=null,minFound=Infinity;
 const gear=[];for(const helmet of h)for(const armor of a)for(const chest of ch)for(const bag of ba){
  if(p.style==='猛攻'&&(!chest||!bag))continue;
  if(p.style==='堵桥'&&(!helmet||!armor||!chest))continue;
  const eq=[['头盔',helmet],['护甲',armor],['胸挂',chest],['背包',bag]].filter(x=>x[1]).map(([slot,item])=>({slot,item,quantity:1}));
  const price=c.sum(eq.map(x=>x.item.unit_price));
  if(p.style==='花来'&&c.sum(eq.filter(x=>['头盔','护甲'].includes(x.slot)).map(x=>x.item.unit_price))>c.flowerArmorCap(r))continue;
  if(p.style==='以小博大'&&c.sum(eq.filter(x=>['头盔','护甲'].includes(x.slot)).map(x=>x.item.unit_price))>c.bargainArmorCap(r))continue;
  const slots=(chest?.capacity_slots||0)+(bag?.capacity_slots||0),grade=(helmet?.grade||0)+(armor?.grade||0);
  const score=p.style==='鼠鼠'?Math.min(slots,50)*0.9-price/r.budget*65:['猛攻','堵桥'].includes(p.style)?grade*3+slots*0.15-price/r.budget*10:slots*0.15-price/r.budget*35;
  // Red repairs needed for grade 6, otherwise gold is allowed. Recompute before budget search.
  const supplies=meds.map(x=>{if(p.style==='猛攻'&&((x.item.medical_role==='helmet_repair'&&helmet?.grade===6)||(x.item.medical_role==='armor_repair'&&armor?.grade===6))){return {quantity:1,item:items.find(i=>i.item_name===(x.item.medical_role==='helmet_repair'?'高级头盔维修组合':'高级护甲维修组合'))};}return x;});
  if(supplies.some(x=>!x.item))continue;gear.push({equipment:eq,price,score:score+c.sum(eq.map(e=>c.gearScore(e.item,p.style,r))),supplies,medCost:c.sum(supplies.map(x=>x.item.unit_price*x.quantity))});
 }
 for(const pair of pairs){
  // Ordinary naked play is a valid option, explicitly without purchase cost.
  if(!pair.weapons.length){const d={style:p.style,status:'draft',...pair,equipment:[],supplies:[],total:0,entry_value:0};if(!chosen)chosen=d;continue;}
   const gunTarget=p.style==='猛攻'?r.budget*0.35:p.style==='鼠鼠'?Math.min(r.budget*0.18,180000):r.budget*0.5;
   const fit=1-Math.abs(pair.gun.gun_total-gunTarget)/Math.max(gunTarget,1);
   const legBonus=p.style==='花来'?c.legAmmoScore(pair.ammo):0;
   const pairScore=fit*30+legBonus-Math.abs(pair.ammo.grade-c.ammoPolicy(p.style,r).preferred)*8;
  for(const g of gear){const entry=(pair.gun?.gun_total||0)+g.price,total=g.price+pair.cost+g.medCost;if(entry<p.minEntry)continue;minFound=Math.min(minFound,total);if(total>r.budget)continue;
   const score=g.score+pairScore-(p.style==='鼠鼠'?total/r.budget*30:0);
   if(score>best){best=score;chosen={style:p.style,status:'draft',...pair,equipment:g.equipment,supplies:g.supplies,entry_value:entry,total};}
  }
 }
 if(chosen)return {draft:JSON.stringify(chosen),ok:1};
 return fail('现有候选未找到满足本风格装备、补给、入场和总预算的组合。'+(Number.isFinite(minFound)?'当前已枚举单枪备选中最低完整支出为 '+minFound+' 哈夫币。':'请增加预算或补充有价候选。'));
}
export function supply(args,c=common()) {const d=JSON.parse(args.draft);if(d.status==='unavailable')return {plan:JSON.stringify(d)};Object.assign(d,c.cost(d));return {plan:JSON.stringify(d)};}
export function validate(args,c=common()) {
 const p=JSON.parse(args.plan),r=JSON.parse(args.request),rule=JSON.parse(args.rule);if(p.status==='unavailable')return {plan:JSON.stringify(p),eligible:0};
 const fail=[],ws=c.weapons(p),eq=p.equipment||[],ss=p.supplies||[],amount=c.cost(p),min=rule.min_entry_value;
 const add=(condition,msg)=>{if(!condition)fail.push(msg);};
 const naked=p.style==='鼠鼠'&&c.normal(r)&&ws.length===0&&eq.length===0&&ss.length===0;
 add(c.styles.includes(p.style),'未知风格');add(c.styleAvailable(p.style,r),'堵桥仅在航天基地地图推荐，本地图不适用');add(ws.length<=(p.style==='猛攻'?2:1)&&(ws.length>=1||p.style==='鼠鼠'&&c.normal(r)),'武器数量不符合风格');
 add(new Set(ws.map(w=>w.gun.build_id)).size===ws.length,'双枪不得重复同一方案');
 for(const w of ws){add(c.gunAllowed(w.gun,p.style,r),'枪械不符合'+p.style+'枪池或特殊物品授权');add(w.ammo.subcategory===w.gun.caliber,'枪弹口径不匹配');add(Number.isInteger(w.ammoQty)&&w.ammoQty>0&&w.ammoQty<=600,'弹药数量须为1至600整数');add(c.ammoAllowed(w.ammo,p.style,r),'弹药等级不符：'+c.ammoRuleText(p.style,r));}
 const slots={头盔:'helmet',护甲:'armor',胸挂:'chest',背包:'bag'};
 add(new Set(eq.map(x=>x.slot)).size===eq.length,'装备槽位重复');
 for(const e of eq){add(slots[e.slot]===e.item.subcategory&&e.quantity===1,'装备槽位或数量错误');add(c.gearAllowed(e.item,p.style,r),'防具/容器不符合风格、普通上限、破损或特殊授权规则：'+e.item.item_name);}
 if(p.style==='花来')add(c.sum(eq.filter(e=>['头盔','护甲'].includes(e.slot)).map(e=>e.item.unit_price*e.quantity))<=c.flowerArmorCap(r),'花来头甲合计超过预算15%或15万上限');
 if(p.style==='以小博大')add(c.sum(eq.filter(e=>['头盔','护甲'].includes(e.slot)).map(e=>e.item.unit_price*e.quantity))<=c.bargainArmorCap(r),'以小博大头甲合计超过整套预算20%或20万上限');
 const head=eq.find(x=>x.slot==='头盔')?.item,armor=eq.find(x=>x.slot==='护甲')?.item;
 if(p.style==='猛攻'){add(!!head&&!!armor,'猛攻必须穿戴对应难度的头甲');add(eq.some(e=>e.slot==='胸挂'),'猛攻需要胸挂');}
 if(p.style==='堵桥'){add(!!head&&!!armor,'堵桥需头甲保障高点架枪');add(eq.some(e=>e.slot==='胸挂'),'堵桥需要胸挂携带弹药补给');}
 if(p.style==='鼠鼠'&&c.hard(r))add(!!head&&!!armor,'绝密鼠鼠需要四套或规定的破损搭配');
 add(new Set(ss.map(x=>x.item.item_id)).size===ss.length,'补给重复行');
 for(const x of ss){add(Number.isInteger(x.quantity)&&x.quantity>=1&&x.quantity<=10,'补给数量须为1至10整数');add(c.supplyAllowed(x.item,p.style,r),'补给不符合风格与难度：'+x.item.item_name);}
 const has=n=>ss.some(x=>x.item.item_name===n),role=n=>ss.some(x=>x.item.medical_role===n),qty=n=>ss.find(x=>x.item.item_name===n)?.quantity||0;
 if(!naked){for(const k of ['heal','surgery','bleed','pain'])add(role(k),'缺少医疗功能：'+k);}
 if(p.style==='猛攻'&&c.hard(r)){
  add(c.hard(r)?has('战地医疗箱'):(has('户外医疗箱')||has('战地医疗箱')),c.hard(r)?'绝密/永夜猛攻必须携带金色战地医疗箱':'猛攻需紫/金血药');add(has('DEK野战手术包')&&has('DVE止疼片'),'猛攻需DEK和DVE');
  for(const name of ['体能强化剂','感知强化剂','M2肌肉注射剂']){if(qty(name))add(qty(name)<=3,'猛攻'+name+'选用时为1至3根');if(r.budget>=1500000)add(qty(name)>=1,'充足预算猛攻至少配置一根'+name);}add(qty('OE2战斗兴奋剂')>=1,'猛攻需OE2应急体力');
  for(const [item,k] of [[head,'helmet_repair'],[armor,'armor_repair']])if(item){const repairs=ss.filter(x=>x.item.medical_role===k);add(repairs.length===1,'猛攻每种维修用途只选一种匹配品质的维修品，不叠加低档同用途维修包');add(repairs.length>0&&repairs.every(x=>x.item.grade>=(item.grade<=5?5:6)),'猛攻缺少匹配品质的头修/甲修');}
 }else if(p.style==='猛攻'){
  add(has('野战急救包')||has('户外医疗箱')||has('战地医疗箱'),'常规/机密猛攻需要至少蓝色血包');
  if(!has('户外医疗箱')&&!has('战地医疗箱'))add(qty('强效注射器')>=2,'常规/机密猛攻仅带蓝色血包时至少两根绿针');
  add(has('战术快拆手术包')||has('DEK野战手术包'),'常规/机密猛攻需要绿色或DEK手术包');
  for(const k of ['helmet_repair','armor_repair'])add(ss.filter(x=>x.item.medical_role===k).length<=1,'常规/机密猛攻维修可选，每种用途最多一种，不堆叠');
  for(const name of ['体能强化剂','感知强化剂','M2肌肉注射剂'])if(qty(name))add(qty(name)<=3,'可选增益针每类最多三根');
  if(r.difficulty==='机密')for(const [item,k] of [[head,'helmet_repair'],[armor,'armor_repair']])if(item){const repairs=ss.filter(x=>x.item.medical_role===k);add(repairs.every(x=>x.item.grade>=(item.grade<=5?5:6)),'可选维修品品质须匹配头甲');}
 }else if(!naked){
  add(has('战术快拆手术包'),'非猛攻方案使用绿色战术快拆手术包');
  add(has('野战急救包'),'非猛攻方案需蓝色野战急救包');
  add(qty('强效注射器')>=2,'非猛攻方案至少两支绿色强效注射器补充回血');
 }
 add(!role('helmet_repair')||!!head,'未穿头盔不得配头修');add(!role('armor_repair')||!!armor,'未穿护甲不得配甲修');
 add(Number.isFinite(min)&&min>=0,'地图门槛缺失');add(amount.entry_value>=min,'入场装备不足：'+amount.entry_value+' < '+min+'，药弹不计入');add(amount.total<=c.budgetCap(r),'整套超过行动总价上限：'+amount.total+' > '+c.budgetCap(r));add(amount.total<=r.budget,'整套超预算：'+amount.total+' > '+r.budget);add(p.total===amount.total,'总支出对账不一致');
 Object.assign(p,amount,{weapons:ws,gun:ws[0]?.gun??null,ammo:ws[0]?.ammo??null,ammoQty:ws[0]?.ammoQty??0,min_entry_value:min,remaining:r.budget-amount.total,omitted_slots:Object.keys(slots).filter(s=>!eq.some(e=>e.slot===s)),capacity:{rig:eq.find(e=>e.slot==='胸挂')?.item.capacity_slots??null,bag:eq.find(e=>e.slot==='背包')?.item.capacity_slots??null},checks:{assault_new_armor:p.style!=='猛攻'||r.difficulty==='机密'||eq.filter(e=>['头盔','护甲'].includes(e.slot)).every(e=>c.pristine(e.item)||r.allow_assault_used_armor===true),flower_no_bag:p.style!=='花来'||r.allow_flower_bag===true||!eq.some(e=>e.slot==='背包'),mode_budget_cap:amount.total<=c.budgetCap(r),entry_qualified:amount.entry_value>=min,budget:amount.total<=r.budget,ammo_policy:ws.every(w=>c.ammoAllowed(w.ammo,p.style,r)),caliber:ws.every(w=>w.ammo.subcategory===w.gun.caliber),medical:!fail.some(x=>/医疗|补给|血药|手术|针|修|DVE|OE2/.test(x)),style:fail.length===0,normal_caps:!c.normal(r)||(ws.every(w=>w.ammo.grade<=3)&&eq.filter(e=>['头盔','护甲'].includes(e.slot)).every(e=>e.item.grade<=4))},notes:['数据为价格快照；入场只计枪械含配件、头甲和容器。','破损品按该成色真实报价；具体剩余耐久、维修损耗须购买前核验。','子弹为总携带量，不重复计算弹匣和安全箱；格型负重仍需游戏内核验。']});
 if(fail.length){p.status='unavailable';p.reason=fail.join('；');}return {plan:JSON.stringify(p),eligible:fail.length?0:1};
}
export function reconcile(args,c=common()) {
 const plans=JSON.parse(args.plans),rows=args.rows||[];
 for(const p of plans){if(p.status!=='draft')continue;let problem='';p.parts=[];
  for(const w of c.weapons(p)){
   const b=w.gun,parts=b.bare?[{build_id:b.build_id,part_row_id:b.build_id,item_id:b.weapon_id,item_name:b.weapon_name,slot_name:'weapon',unit_price:b.base_item.unit_price,quantity:1,has_price:1}]:rows.filter(x=>String(x.build_id)===String(b.build_id));
   const seen=new Set();let total=0;for(const x of parts){if(seen.has(x.part_row_id)||Number(x.has_price)!==1||!(Number(x.unit_price)>0)||!(Number(x.quantity)>0))problem='配件缺价、重复或数量错误';seen.add(x.part_row_id);total+=Number(x.unit_price)*Number(x.quantity);}
   const g=parts.filter(x=>x.slot_name==='weapon');if(g.length!==1||g[0].item_id!==b.weapon_id||Math.abs(total-b.gun_total)>1)problem='枪械配件逐行加总不一致';
   w.parts=parts;p.parts.push(...parts);
  }
  p.checks.parts=!problem;if(problem){p.status='unavailable';p.reason=problem;}
 }return {plans:JSON.stringify(plans)};
}