export function common() {
 const assault=['AWM狙击步枪','M14射手步枪','M7战斗步枪','MK47突击步枪','AS Val突击步枪','M250通用机枪','SR-25射手步枪','QJB201轻机枪','PKM通用机枪','汤姆逊冲锋枪','MK4冲锋枪','K416突击步枪','SVCH精确射手步枪'];
 const styles=['猛攻','鼠鼠','花来','以小博大','堵桥'];
 const styleAvailable=(s,r)=>s!=='堵桥'||r.map==='航天基地';
 const bridge=['G3战斗步枪','PSG-1射手步枪','SR-25射手步枪'];
 const leg=['UZI冲锋枪','S12K霰弹枪','.357左轮','杠杆式步枪','MK4冲锋枪','Vector冲锋枪','QCQ171冲锋枪','AR57突击步枪','勇士冲锋枪','G18','MP5冲锋枪','SMG-45冲锋枪'];
 const calibers={'UZI冲锋枪':'ammo9x19','S12K霰弹枪':'ammo12','.357左轮':'ammo.357','杠杆式步枪':'ammo.45-70',
 'AWM狙击步枪':'ammo.338','M14射手步枪':'ammo7.62x51','M7战斗步枪':'ammo6.8x51','MK47突击步枪':'ammo7.62x39','AS Val突击步枪':'ammo9x39','M250通用机枪':'ammo6.8x51','SR-25射手步枪':'ammo7.62x51','QJB201轻机枪':'ammo5.8x42','PKM通用机枪':'ammo7.62x54','汤姆逊冲锋枪':'ammo.45','MK4冲锋枪':'ammo4.6x30','K416突击步枪':'ammo5.56x45','SVCH精确射手步枪':'ammo7.62x54',
 '野牛冲锋枪':'ammo9x19','QBZ95-1突击步枪':'ammo5.8x42','CAR-15突击步枪':'ammo5.56x45','腾龙突击步枪':'ammo5.8x42','AUG突击步枪':'ammo5.56x45','勇士冲锋枪':'ammo9x19','G3战斗步枪':'ammo7.62x51','SMG-45冲锋枪':'ammo.45','Vector冲锋枪':'ammo.45','QCQ171冲锋枪':'ammo9x19','AR57突击步枪':'ammo5.7x28','G18':'ammo9x19','MP5冲锋枪':'ammo9x19',
 'KC17突击步枪':'ammo5.45x39','ASh-12战斗步枪':'ammo12.7x55','M4A1突击步枪':'ammo5.56x45','AKM突击步枪':'ammo7.62x39','AK-12突击步枪':'ammo5.45x39','P90冲锋枪':'ammo5.7x28','MP7冲锋枪':'ammo4.6x30','SR-3M紧凑突击步枪':'ammo9x39','M16A4突击步枪':'ammo5.56x45','SVD狙击步枪':'ammo7.62x54','PSG-1射手步枪':'ammo7.62x51','M249轻机枪':'ammo5.56x45','SG552突击步枪':'ammo5.56x45','SCAR-H战斗步枪':'ammo7.62x51','93R':'ammo9x19','SKS射手步枪':'ammo7.62x39','AKS-74U突击步枪':'ammo5.45x39'};
 const hard=r=>['绝密','永夜'].includes(r.difficulty),normal=r=>r.difficulty==='常规';
 const budgetCap=r=>({'普通':1500000,'常规':1500000,'机密':3000000,'绝密':6000000,'永夜':6000000}[r.difficulty]??0);
 const premiumAssault=(s,r)=>s==='猛攻'&&r.difficulty==='机密'&&r.budget>=1500000;
 const bargainArmorCap=r=>Math.min(200000,Math.floor(r.budget*0.20));
 const flowerArmorCap=r=>Math.min(150000,Math.floor(r.budget*0.15));
 const ratOnlyBag=i=>i?.subcategory==='bag'&&(/穿山甲通用战术(?:背)?包/.test(i.item_name)||/HLS[- ]?(?:2[- ]?)?重型背包/i.test(i.item_name));
 const ammoPolicy=(s,r)=>s==='花来'?{min:1,max:normal(r)?3:null,preferred:3,legshot:true}:normal(r)?{min:s==='猛攻'?3:1,max:3,preferred:s==='猛攻'?3:2}:hard(r)||premiumAssault(s,r)?{min:5,max:null,preferred:5}:{min:r.budget>200000?4:3,max:null,preferred:r.budget>200000?4:3};
 const ammoAllowed=(i,s,r)=>{const p=ammoPolicy(s,r);return !!i&&i.category==='ammo'&&Number.isInteger(i.grade)&&i.grade>=p.min&&(s!=='花来'||legAmmo(i))&&(p.max===null||i.grade<=p.max);};
 const ammoRuleText=(s,r)=>s==='花来'?'花来仅修脚路线，豁免机密/绝密/永夜等级下限；常规三级弹上限仍保留，必须匹配口径与修脚弹':premiumAssault(s,r)?'机密预算达到150万的猛攻至少五级弹；先保障枪弹，再调整枪械配件和装备投入':normal(r)?(s==='猛攻'?'普通猛攻默认三级弹':'普通允许一至三级弹'):hard(r)?'绝密/永夜至少五级弹':r.budget>200000?'机密整套预算超过20万，默认四级弹，允许更高级弹，禁止三级及以下':'机密至少三级弹，可用四级及以上';
 const gearProfiles={"户外棒球帽":{"max_durability":12,"hearing_pct":10,"move_pct":0,"aim_delta":0,"noise_reduction":"无","view_obstruction":"未知","note":"听力低投入选项"},"H01战术头盔":{"max_durability":12,"hearing_pct":0,"move_pct":0,"aim_delta":0,"noise_reduction":"无","view_obstruction":"未知","note":"低级应急"},"DAS防弹头盔":{"max_durability":40,"hearing_pct":0,"move_pct":0,"aim_delta":0,"noise_reduction":"无","view_obstruction":"未知","note":"应急"},"H07战术头盔":{"max_durability":20,"hearing_pct":0,"move_pct":0,"aim_delta":0,"noise_reduction":"无","view_obstruction":"未知","note":"低耐久"},"MC201头盔":{"max_durability":34,"hearing_pct":20,"move_pct":-1,"aim_delta":-1,"noise_reduction":"中","view_obstruction":"未知","note":"低投入听力"},"防暴头盔":{"max_durability":28,"hearing_pct":-5,"move_pct":-1,"aim_delta":-3,"noise_reduction":"中","view_obstruction":"未知","note":"听力负收益"},"GT1战术头盔":{"max_durability":48,"hearing_pct":20,"move_pct":-4,"aim_delta":-4,"noise_reduction":"中","view_obstruction":"未知","note":"四级耐久路线"},"MHS战术头盔":{"max_durability":30,"hearing_pct":30,"move_pct":-1,"aim_delta":-3,"noise_reduction":"中","view_obstruction":"未知","note":"四级经济听力"},"DICH训练头盔":{"max_durability":35,"hearing_pct":50,"move_pct":-2,"aim_delta":0,"noise_reduction":"高","view_obstruction":"无","note":"四级听力优先"},"D6战术头盔":{"max_durability":55,"hearing_pct":-10,"move_pct":-4,"aim_delta":-6,"noise_reduction":"高","view_obstruction":"严重","note":"默认排除"},"GN久战重型夜视头盔":{"max_durability":20,"hearing_pct":10,"move_pct":-3,"aim_delta":0,"noise_reduction":"中","view_obstruction":"无","note":"低耐久夜视，非无条件优先"},"Mask-1铁壁头盔":{"max_durability":75,"hearing_pct":-15,"move_pct":-5,"aim_delta":-6,"noise_reduction":"高","view_obstruction":"严重","note":"默认排除"},"GN重型夜视头盔":{"max_durability":42,"hearing_pct":10,"move_pct":-3,"aim_delta":-4,"noise_reduction":"中","view_obstruction":"无","note":"需要夜视且预算允许时考虑"},"DICH-1战术头盔":{"max_durability":40,"hearing_pct":40,"move_pct":-1,"aim_delta":-1,"noise_reduction":"高","view_obstruction":"未知","note":"五级均衡听力优先"},"GN重型头盔":{"max_durability":50,"hearing_pct":10,"move_pct":-3,"aim_delta":-4,"noise_reduction":"中","view_obstruction":"严重","note":"视野代价，降权"},"H09防暴头盔":{"max_durability":45,"hearing_pct":20,"move_pct":-3,"aim_delta":-4,"noise_reduction":"中","view_obstruction":"未知","note":"五级经济备选"},"H70夜视精英头盔":{"max_durability":55,"hearing_pct":10,"move_pct":-3,"aim_delta":-4,"noise_reduction":"中","view_obstruction":"未知","note":"六级夜视按需"},"H70精英头盔":{"max_durability":55,"hearing_pct":10,"move_pct":-3,"aim_delta":-4,"noise_reduction":"中","view_obstruction":"未知","note":"六级备选"},"GT5指挥官头盔":{"max_durability":60,"hearing_pct":20,"move_pct":-3,"aim_delta":-8,"noise_reduction":"中","view_obstruction":"未知","note":"高耐久但瞄准代价大"},"DICH-9重型头盔":{"max_durability":50,"hearing_pct":40,"move_pct":-1,"aim_delta":-3,"noise_reduction":"中","view_obstruction":"未知","note":"授权六级猛攻优先"},"射手战术背心":{"max_durability":85,"move_pct":-2,"aim_delta":-4,"repair_loss":"未知","note":"三级卡战备"},"Hvk快拆防弹衣":{"max_durability":60,"move_pct":-1,"aim_delta":-1,"repair_loss":"未知","note":"低耐久，不优先"},"TG-H防弹衣":{"max_durability":75,"move_pct":-1,"aim_delta":-3,"repair_loss":"未知","note":"三级性价比"},"制式防弹背心":{"max_durability":50,"move_pct":0,"aim_delta":-1,"repair_loss":"未知","note":"低耐久，不优先"},"HMP特勤防弹衣":{"max_durability":80,"move_pct":0,"aim_delta":0,"repair_loss":"未知","note":"不护腹；机动路线"},"MK-2战术背心":{"max_durability":110,"move_pct":-5,"aim_delta":-5,"repair_loss":"未知","note":"四级猛攻优先"},"武士防弹背心":{"max_durability":80,"move_pct":-5,"aim_delta":-5,"repair_loss":"未知","note":"负面较大"},"DT-AVS防弹衣":{"max_durability":100,"move_pct":-3,"aim_delta":-4,"repair_loss":"未知","note":"四级均衡备选"},"突击手防弹背心":{"max_durability":90,"move_pct":-1,"aim_delta":-2,"repair_loss":"未知","note":"四级低负面"},"重型突击背心":{"max_durability":125,"move_pct":null,"aim_delta":-10,"repair_loss":"较好","note":"五级猛攻优先；护肩；移速资料冲突-5%与-10%"},"精英防弹背心":{"max_durability":95,"move_pct":-1,"aim_delta":0,"repair_loss":"较差","note":"机动优先，耐久低且维修损耗高"},"FS复合防弹衣":{"max_durability":105,"move_pct":-3,"aim_delta":-5,"repair_loss":"中等","note":"五级均衡备选，不护肩"},"Hvk-2防弹衣":{"max_durability":115,"move_pct":-7,"aim_delta":-8,"repair_loss":"较差","note":"护肩但负面与维修损耗高，降权"},"HA-2防弹装甲":{"max_durability":115,"move_pct":-3,"aim_delta":-1,"repair_loss":"未知","note":"六级低负面但昂贵"},"金刚防弹衣":{"max_durability":140,"move_pct":-7,"aim_delta":-8,"repair_loss":"未知","note":"六级重型备选"},"泰坦防弹装甲":{"max_durability":150,"move_pct":-8,"aim_delta":-12,"repair_loss":"较差","note":"高耐久、重负面、维修损耗高"},"特里克MAS2.0装甲":{"max_durability":125,"move_pct":-5,"aim_delta":-6,"repair_loss":"未知","note":"授权六级猛攻优先"}};

 const baseName=i=>(i?.item_name||'').replace(/（[^）]*）/g,'').replace(/\s/g,'');
 const gearInfo=i=>gearProfiles[baseName(i)]||null;
 const pristine=i=>/（全新）$/.test(i?.item_name||'');
 // These are product preference weights, not game attributes.
 const gearScore=(i,s,r)=>{if(!i)return 0;const p=gearInfo(i);if(!p)return 0;const n=baseName(i);
  let score=(p.hearing_pct||0)*0.28+(p.move_pct||0)*1.2+(p.aim_delta||0)*0.6+(p.max_durability||0)*0.03;
  if(p.view_obstruction==='严重')score-=22;if(p.repair_loss==='较差')score-=10;
  if(s==='猛攻')score+=({'DICH训练头盔':12,'DICH-1战术头盔':15,'DICH-9重型头盔':18,'GT1战术头盔':8,'MK-2战术背心':18,'DT-AVS防弹衣':8,'重型突击背心':25,'FS复合防弹衣':10,'特里克MAS2.0装甲':24}[n]||0);
  if(/夜视/.test(n)&&r.difficulty!=='永夜')score-=8;
  return score;
 };
 const damaged=i=>/（破损）/.test(i?.item_name||'');
 const special=i=>!!i&&(!!i.special_item||(['helmet','armor','bag'].includes(i.subcategory)&&i.grade===6)||(i.subcategory==='chest'&&i.grade>=5)||/^AWM?/.test(i.item_name));
 const gunAllowed=(b,s,r)=>!!b&&styleAvailable(s,r)&&(r.allow_rare||!/^AWM?/.test(b.weapon_name))&&(s==='猛攻'?assault.includes(b.weapon_name)&&!b.bare:s==='鼠鼠'?!assault.includes(b.weapon_name):s==='花来'?leg.includes(b.weapon_name):s==='堵桥'?bridge.includes(b.weapon_name):s==='以小博大');
 const gearAllowed=(i,s,r)=>{
  if(!styleAvailable(s,r))return false;
  if(!i)return s!=='猛攻';if(ratOnlyBag(i)&&s!=='鼠鼠')return false;if(s==='花来'&&i.subcategory==='bag'&&r.allow_flower_bag!==true)return false;if(!r.allow_rare&&special(i))return false;
  const head=i.subcategory==='helmet',body=i.subcategory==='armor';if(!head&&!body)return true;
  if(head&&['D6战术头盔','Mask-1铁壁头盔'].includes(baseName(i))&&r.allow_penalty_helmet!==true&&s!=='堵桥')return false;
  if(!r.allow_damaged&&!/（全新）/.test(i.item_name))return false;
  if(normal(r)&&i.grade>4)return false;
  if(s==='猛攻'&&r.difficulty==='机密')return i.grade>=(body?4:3)&&(pristine(i)||r.allow_damaged===true);
  if(s==='猛攻')return i.grade>=(normal(r)?3:hard(r)&&body?5:4)&&(pristine(i)||(r.allow_assault_used_armor===true&&r.allow_damaged===true&&!damaged(i)));
  if(s==='花来')return i.grade<=4&&i.unit_price<=flowerArmorCap(r);
  if(s==='以小博大')return i.grade<=4&&i.unit_price<=bargainArmorCap(r);
  if(s==='堵桥')return i.grade>=4;
  if(normal(r))return i.grade<=3||i.grade===4&&damaged(i);
  if(!hard(r))return i.grade<=3||i.grade===4&&damaged(i);
  return i.grade===4||(head&&i.grade===6&&damaged(i))||(body&&i.grade===5&&damaged(i));
 };
 const preferredLegAmmo=['37200000001','37220000001','37190000002','37250000001','37290300001','37260000002','37210000001'];
 const legAmmo=i=>!!i&&(preferredLegAmmo.includes(String(i.item_id))||/RIP|R37\.F|JHP|鹿弹/.test(i.item_name));
 const legAmmoScore=i=>preferredLegAmmo.includes(String(i.item_id))?30:10;
 const tactic=s=>({'猛攻':'按预算搭配枪弹与防护，主动交战','鼠鼠':'低战备避战与搜刮','花来':'修脚：匹配肉伤弹，近距离先手攻击腿部','以小博大':'控制头甲投入，以高效枪弹争取战备收益','堵桥':'抢占高点优势，架枪瞄准中远距离通行路线，持续拦截并保留转移路线'}[s]);
 const supplySpec=(s,r)=>{
  // Secret assault seeds reserve essential medicine only; optional upgrades must not create false infeasibility.
  if(s==='猛攻'&&r.difficulty==='机密')return [['野战急救包',1],['强效注射器',2],['战术快拆手术包',1],['CAT止血带',1],['瓶装抗生素',1]];
  if(s==='猛攻'&&normal(r))return [['野战急救包',1],['强效注射器',2],['战术快拆手术包',1],['CAT止血带',1],['瓶装抗生素',1],...(r.budget>=300000?[['OE2战斗兴奋剂',1]]:[])];
  if(s==='猛攻')return [[hard(r)?'战地医疗箱':'户外医疗箱',1],['DEK野战手术包',1],['CAT止血带',1],['DVE止疼片',1],['OE2战斗兴奋剂',r.budget>=2000000?3:1],...(r.budget>=1500000?[['体能强化剂',1],['感知强化剂',1],['M2肌肉注射剂',1]]:[]),['精密头盔维修包',1],['精密护甲维修包',1]];
  return [['野战急救包',1],['强效注射器',2],['战术快拆手术包',1],['CAT止血带',1],['瓶装抗生素',1],...(r.budget>=300000?[['OE2战斗兴奋剂',1]]:[])];
 };
 const supplyAllowed=(i,s,r)=>{
  if(!styleAvailable(s,r))return false;
  if(!i.medical_role)return false;
  if(s==='猛攻'&&!normal(r)&&['helmet_repair','armor_repair'].includes(i.medical_role)&&i.grade<5)return false;
  if(s==='猛攻'&&hard(r)&&i.medical_role==='heal'&&!['战地医疗箱','强效注射器'].includes(i.item_name))return false;
  if(!normal(r)&&['车载急救包','简易注射器','简易手术包','弹力绷带'].includes(i.item_name))return false;
  if(s!=='猛攻'){
   if(i.medical_role==='heal'&&!['野战急救包','强效注射器'].includes(i.item_name))return false;
   if(i.medical_role==='surgery'&&i.item_name!=='战术快拆手术包')return false;
   if(['stamina_buff','hearing','carry'].includes(i.medical_role))return false;
   if(['helmet_repair','armor_repair'].includes(i.medical_role)&&i.grade>4)return false;
  }
  return true;
 };
 const sum=xs=>xs.reduce((a,b)=>a+b,0);
 const weapons=p=>p.weapons||(p.gun?[{gun:p.gun,ammo:p.ammo,ammoQty:p.ammoQty}]:[]);
 const cost=p=>{const ws=weapons(p),entry=sum(ws.map(w=>w.gun.gun_total))+sum((p.equipment||[]).map(e=>e.item.unit_price*e.quantity)),ammo=sum(ws.map(w=>w.ammo.unit_price*w.ammoQty)),supplies=sum((p.supplies||[]).map(x=>x.item.unit_price*x.quantity));return {entry_value:entry,ammo_cost:ammo,supply_cost:supplies,consumables_cost:ammo+supplies,total:entry+ammo+supplies,subtotal:entry+ammo};};
 const choice=p=>({style:p.style,weapons:weapons(p).map(w=>({build_id:String(w.gun.build_id),ammo_id:String(w.ammo.item_id),ammo_qty:w.ammoQty})),...Object.fromEntries([['helmet','头盔'],['armor','护甲'],['chest','胸挂'],['bag','背包']].map(([k,s])=>[k+'_id',p.equipment.find(e=>e.slot===s)?.item.item_id??null])),supplies:p.supplies.map(x=>({item_id:String(x.item.item_id),quantity:x.quantity})),tactic:p.tactic});
 const ids=plans=>{const ids=[...new Set(plans.filter(p=>p.status==='draft').flatMap(p=>weapons(p).filter(w=>!w.gun.bare).map(w=>String(w.gun.build_id))))];if(ids.some(x=>!/^\d+$/.test(x)))throw new Error('改枪ID非法');return ids.length?ids.map(x=>"'"+x+"'").join(','):"'0'";};
 return {styleAvailable,styles,bridge,bargainArmorCap,preferredLegAmmo,legAmmoScore,tactic,premiumAssault,flowerArmorCap,ratOnlyBag,gearProfiles,baseName,gearInfo,pristine,gearScore,budgetCap,ammoPolicy,ammoAllowed,ammoRuleText,assault,leg,calibers,hard,normal,damaged,special,gunAllowed,gearAllowed,legAmmo,supplySpec,supplyAllowed,sum,weapons,cost,choice,ids};
}
