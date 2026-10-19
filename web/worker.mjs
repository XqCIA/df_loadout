import {parentPort,workerData} from 'node:worker_threads';
import {prepare,finish,tables} from '../.agents/skills/delta-loadout/scripts/lib/runtime.mjs';
import {fetchPricing} from '../.agents/skills/delta-loadout/scripts/lib/pricing.mjs';
import {html} from '../.agents/skills/delta-loadout/scripts/lib/report.mjs';
try{
  const pricing=await fetchPricing(tables.df_items,{mode:workerData.prices});
  const result=finish(prepare(workerData.request,pricing));
  parentPort.postMessage({result,report:html(result)});
}catch(e){parentPort.postMessage({error:e.message});}
