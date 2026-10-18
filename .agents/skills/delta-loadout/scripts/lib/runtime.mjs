import fs from 'node:fs';
import * as E from './engine.mjs';
import * as M from './selection.mjs';
import {common} from './rules.mjs';
import {priceParts,priceBuilds} from './pricing.mjs';
export const c=common();
const data=new URL('../../data/',import.meta.url);
export const tables=JSON.parse(fs.readFileSync(new URL('tables.json',data)));
export const images=JSON.parse(fs.readFileSync(new URL('images.json',data)));
export function prepare(input,pricing){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('需求必须是JSON对象');
 for(const key of ['allow_rare','allow_damaged','allow_flower_bag','allow_penalty_helmet','allow_assault_used_armor'])if(key in input&&typeof input[key]!=='boolean')throw Error(key+'必须是布尔值');
 const n=E.normalize({request_json:JSON.stringify(input)});if(!n.valid)throw Error(n.message);
 const m=E.mapCheck({request:n.request,rows:tables.df_map_rules});if(!m.valid)throw Error(m.message);
 const parts=pricing?priceParts({...pricing,rows:tables.df_gun_parts}):tables.df_gun_parts;
 const buildRows=pricing?priceBuilds({...pricing,rows:tables.df_gun_builds,parts}):tables.df_gun_builds;
 const items=E.cleanItems({rows:pricing?.rows??tables.df_items}).items;
 const builds=E.cleanBuilds({request:n.request,items,rows:buildRows}).builds;
 const base={request:n.request,rule:m.rule,items,builds};
 const seedPlans=c.styles.map(style=>{
  const policy=E.policy({...base,style}).policy;
  const pairs=E.pairGunAmmo({...base,policy}).pairs;
  const draft=E.equipment({...base,policy,pairs}).draft;
  const plan=E.supply({draft}).plan;
  return {...JSON.parse(E.validate({...base,plan}).plan),selection_source:'rule_seed'};
 });
 const seeds=E.reconcile({plans:JSON.stringify(seedPlans),rows:parts}).plans;
 const cat=M.catalog({...base,seeds});
 return {...base,seeds,...cat,parts,price_meta:pricing?JSON.parse(pricing.price_meta):{mode:'snapshot',fallback_snapshot:'2026-10-13'}};
}
export function finish(state,proposal){
 let plans=state.seeds,errors=[];
 if(proposal!==undefined){
  const checked=M.checkChoices({...state,proposal:JSON.stringify(proposal)});
  errors=JSON.parse(checked.errors);
  plans=M.finalize({...state,plans:checked.plans}).plans;
 }
 plans=JSON.parse(E.reconcile({plans,rows:state.parts}).plans);
 return {version:2,rules_version:'19',pricing_version:'18',snapshot:state.price_meta.mode==='live'?null:'2026-10-13',price_meta:state.price_meta,request:JSON.parse(state.request),rule:JSON.parse(state.rule),selection:proposal===undefined?'rule_seed':'host_model_with_validated_fallback',proposal_errors:errors,plans};
}
