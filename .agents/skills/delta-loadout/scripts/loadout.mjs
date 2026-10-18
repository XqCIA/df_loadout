#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {prepare,finish,tables} from './lib/runtime.mjs';
import {fetchPricing} from './lib/pricing.mjs';
import {html} from './lib/report.mjs';
export async function run(argv){
 const [command,...rest]=argv;
 if(!['prepare','generate'].includes(command))throw Error('用法：node scripts/loadout.mjs prepare|generate --request request.json --out output-directory [--proposal proposal.json]');
 const opt={};for(let i=0;i<rest.length;i+=2){if(!['--request','--out','--proposal','--prices'].includes(rest[i])||!rest[i+1])throw Error('未知或缺少参数 '+rest[i]);opt[rest[i]]=rest[i+1];}
 if(!opt['--request']||!opt['--out'])throw Error('必须指定 --request 和 --out');
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
 const input=read(opt['--request']);
 const pricing=await fetchPricing(tables.df_items,{mode:opt['--prices']||'auto'});
 const state=prepare(input,pricing);
 const out=path.resolve(opt['--out']);fs.mkdirSync(out,{recursive:true});
 const save=(name,data)=>{const target=path.join(out,name);fs.writeFileSync(target,typeof data==='string'?data:JSON.stringify(data,null,2));return target;};
 const priceFile=save('prices.json',state.price_meta);
 if(command==='prepare')return {catalog:save('catalog.json',JSON.parse(state.catalog)),proposalTemplate:save('proposal.json',{plans:JSON.parse(state.seed_choices)}),prices:priceFile,price_meta:state.price_meta,note:'真实候选及合规备选；generate会重新取价并校验，价格变化可能导致提案回退。'};
 const result=finish(state,opt['--proposal']?read(opt['--proposal']):undefined);
 const json=save('result.json',result),report=save('report.html',html(result));
 return {report,json,prices:priceFile,price_meta:result.price_meta,selection:result.selection,proposal_errors:result.proposal_errors,plans:result.plans.map(p=>({style:p.style,status:p.status,total:p.total,source:p.selection_source,reason:p.reason}))};
}
try{console.log(JSON.stringify(await run(process.argv.slice(2)),null,2));}catch(e){console.error(JSON.stringify({error:e.message}));process.exitCode=1;}
