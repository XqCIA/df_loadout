// Public source quotes; missing quotes are never mixed with snapshot prices.
export const PRICE_URL='https://moligod.com/api/armory/prices';
export async function fetchPricing(rows,{mode='auto',fetchImpl=fetch,now=Date.now()}={}){
 if(!['auto','snapshot'].includes(mode))throw Error('--prices 必须为 auto 或 snapshot');
 if(mode==='snapshot')return {rows,price_map:'{}',price_meta:JSON.stringify({mode:'snapshot',source:null,generated_at:null,fetched_at:null,fallback_snapshot:'2026-10-13',reason:'用户选择离线快照',missing_items:0})};
 let response;
 try{
  response=await fetchImpl(PRICE_URL,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});
  const body=await response.text();
  return refreshPrices({rows,status:response.status,body,now});
 }catch{
  const fallback=refreshPrices({rows,status:0,now});
  const meta=JSON.parse(fallback.price_meta);meta.reason='价格请求失败或超过15秒，使用完整离线快照';
  return {...fallback,price_meta:JSON.stringify(meta)};
 }
}
export function refreshPrices(args) {
 const rows=args.rows||[],now=Number(args.now)||Date.now();let payload,reason='',mode='live';
 try {
  if(Number(args.status)!==200)throw Error('价格接口未成功响应');
  payload=typeof args.body==='string'?JSON.parse(args.body):args.body;
  if(!payload||!payload.prices||typeof payload.prices!=='object'||Array.isArray(payload.prices))throw Error('价格响应格式异常');
  const ts=Number(payload.generated_at);
  if(!Number.isFinite(ts)||ts>now+300000||now-ts>1800000)throw Error('价格源时间缺失或超过30分钟');
  const valid=Object.entries(payload.prices).filter(([id,p])=>/^\d+(?:-[123])?$/.test(id)&&typeof p==='number'&&Number.isSafeInteger(p)&&p>0);
  if(valid.length<500)throw Error('有效报价数量异常');
  payload={generated_at:ts,prices:Object.fromEntries(valid)};
  if(rows.filter(i=>payload.prices[String(i.item_id)]>0).length<rows.length*.7)throw Error('报价覆盖不足70%');
 }catch(e){mode='fallback';reason=e.message;payload={prices:{},generated_at:null};}
 const updated=rows.map(i=>mode==='live'?{...i,unit_price:payload.prices[String(i.item_id)]??null,has_price:payload.prices[String(i.item_id)]?1:0,source_updated_at:new Date(payload.generated_at).toISOString(),captured_at:new Date(now).toISOString()}:i);
 const meta={mode,source:'https://moligod.com/api/armory/prices',generated_at:payload.generated_at,fetched_at:now,fallback_snapshot:mode==='fallback'?'2026-10-13':null,reason,missing_items:mode==='live'?updated.filter(i=>!i.has_price).length:0};
 return {rows:updated,price_map:JSON.stringify(payload.prices),price_meta:JSON.stringify(meta)};
}
export function priceParts(args){
 const map=JSON.parse(args.price_map||'{}'),live=JSON.parse(args.price_meta).mode==='live';
 return (args.rows||[]).map(p=>live?{...p,unit_price:map[String(p.item_id)]??null,has_price:map[String(p.item_id)]?1:0}:p);
}
export function priceBuilds(args){
 const parts=args.parts||[],live=JSON.parse(args.price_meta).mode==='live';
 if(!live)return args.rows||[];
 const grouped={};for(const p of parts)(grouped[String(p.build_id)]??=[]).push(p);
 return (args.rows||[]).map(b=>{const ps=grouped[String(b.build_id)]||[],seen=new Set();let missing=0,total=0;
  for(const p of ps){if(seen.has(p.part_row_id)||!Number.isSafeInteger(Number(p.quantity))||Number(p.quantity)<1||Number(p.has_price)!==1||!(Number(p.unit_price)>0))missing++;seen.add(p.part_row_id);total+=Number(p.unit_price)*Number(p.quantity);}
  const base=ps.filter(p=>p.slot_name==='weapon');if(base.length!==1||String(base[0]?.item_id)!==String(b.weapon_id)||ps.length!==Number(b.attachment_count)+1)missing++;
  return {...b,gun_total:missing?null:total,missing_count:missing};
 });
}
