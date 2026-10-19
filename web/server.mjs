import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {Worker} from 'node:worker_threads';
import {normalize,mapCheck} from '../.agents/skills/delta-loadout/scripts/lib/engine.mjs';
import {tables,c} from '../.agents/skills/delta-loadout/scripts/lib/runtime.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_STORE=path.resolve(here,'../outputs/web');
const UUID='[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const reportPattern=new RegExp(`^/reports/(${UUID})/(report\\.html|result\\.json|meta\\.json)$`);
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'};
const appCsp="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; frame-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'";
const reportCsp="default-src 'none'; style-src 'unsafe-inline'; img-src https:; base-uri 'none'; frame-ancestors 'self'; form-action 'none'";
function reply(res,status,body,type='application/json; charset=utf-8',extra={}){
  res.writeHead(status,{...headers,'Content-Type':type,...extra});
  res.end(type.startsWith('application/json')?JSON.stringify(body):body);
}
export function validateRequest(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('请求必须是对象');
  for(const key of ['allow_rare','allow_damaged'])if(key in input&&typeof input[key]!=='boolean')throw Error('物品选项必须为布尔值');
  if(typeof input.budget!=='number'||!Number.isSafeInteger(input.budget)||input.budget<=0)throw Error('预算须为正整数哈夫币');
  if(!['auto','snapshot'].includes(input.prices??'auto'))throw Error('报价模式无效');
  const request={map:input.map,difficulty:input.difficulty,budget:input.budget,allow_rare:input.allow_rare??false,allow_damaged:input.allow_damaged??true};
  const n=normalize({request_json:JSON.stringify(request)});
  if(!n.valid)throw Error(n.message);
  const m=mapCheck({request:n.request,rows:tables.df_map_rules});
  if(!m.valid)throw Error(m.message);
  return {request,prices:input.prices??'auto'};
}
async function readBody(req){
  let body='',length=0;
  for await(const chunk of req){length+=chunk.length;if(length>8192)throw Error('请求内容过长');body+=chunk;}
  try{return JSON.parse(body);}catch{throw Error('请求不是有效 JSON');}
}
export function compute(input){
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./worker.mjs',import.meta.url),{workerData:input});
    let settled=false;
    const done=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);void worker.terminate();error?reject(error):resolve(value);};
    const timer=setTimeout(()=>done(Error('生成超时，请调整条件后重试')),180000);
    worker.once('message',m=>m.error?done(Error(m.error)):done(null,m));
    worker.once('error',e=>done(e));
    worker.once('exit',code=>{if(!settled)done(Error(`配装计算提前结束（${code}）`));});
  });
}
export function createApp({store=DEFAULT_STORE,generate=compute}={}){
  let busy=false;
  return http.createServer(async(req,res)=>{
    try{
      const authority=`127.0.0.1:${res.socket.localPort}`;
      if(req.headers.host!==authority || (req.headers.origin&&req.headers.origin!==`http://${authority}`))return reply(res,403,{error:'仅允许从本机页面访问'});
      const url=new URL(req.url,`http://${authority}`);
      if(req.method==='GET'&&url.pathname==='/api/config'){
        const maps={};for(const r of tables.df_map_rules)(maps[r.map_name]??=[]).push(r.difficulty);
        return reply(res,200,{maps,caps:Object.fromEntries(['常规','机密','绝密','永夜'].map(d=>[d,c.budgetCap({difficulty:d})])),busy});
      }
      if(req.method==='POST'&&url.pathname==='/api/generate'){
        if(req.headers['content-type']?.split(';')[0].trim()!=='application/json')return reply(res,415,{error:'需要 JSON 请求'});
        let input;try{input=validateRequest(await readBody(req));}catch(e){return reply(res,400,{error:e.message});}
        if(busy)return reply(res,429,{error:'已有配装正在生成，请稍后重试'});
        busy=true;
        try{
          const {result,report}=await generate(input);
          const id=randomUUID(),folder=path.join(store,id);
          const meta={id,created_at:new Date().toISOString(),request:result.request,price_meta:result.price_meta,
            plans:result.plans.map(p=>({style:p.style,status:p.status,total:p.total,reason:p.reason})),
            report_url:`/reports/${id}/report.html`,json_url:`/reports/${id}/result.json`};
          await fs.mkdir(folder,{recursive:true});
          await Promise.all([fs.writeFile(path.join(folder,'report.html'),report),fs.writeFile(path.join(folder,'result.json'),JSON.stringify(result,null,2)),fs.writeFile(path.join(folder,'meta.json'),JSON.stringify(meta))]);
          return reply(res,200,meta);
        }catch(e){return reply(res,500,{error:`生成失败：${e.message}`});}finally{busy=false;}
      }
      const match=reportPattern.exec(url.pathname);
      if(req.method==='GET'&&match){
        try{
          const data=await fs.readFile(path.join(store,match[1],match[2]));
          return reply(res,200,data,match[2].endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream',{
            'Content-Security-Policy':reportCsp,
            ...(url.searchParams.has('download')?{'Content-Disposition':`attachment; filename="delta-loadout-${match[1]}.${match[2].endsWith('.html')?'html':'json'}"`}:{})});
        }catch(e){if(e.code==='ENOENT')return reply(res,404,{error:'本地报告文件不存在，请重新生成'});throw e;}
      }
      const files={'/':'index.html','/app.mjs':'app.mjs','/style.css':'style.css'};
      if(req.method==='GET'&&files[url.pathname])return reply(res,200,await fs.readFile(path.join(here,files[url.pathname])),url.pathname.endsWith('.mjs')?'text/javascript; charset=utf-8':url.pathname.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8',{'Content-Security-Policy':appCsp});
      return reply(res,404,{error:'路径不存在'});
    }catch{if(!res.headersSent)reply(res,500,{error:'本地服务遇到错误，请重试'});else res.end();}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||8787);
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT 必须为 1–65535');
  const server=createApp();
  server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'端口已占用，请关闭旧服务或设置其他 PORT。':e.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`三角洲配装作战台 http://127.0.0.1:${port}\n报告保存至 ${DEFAULT_STORE}\n按 Ctrl+C 关闭服务`));
}
