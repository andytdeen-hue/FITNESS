import {createClient} from '@supabase/supabase-js';
const response=(code,body)=>({statusCode:code,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)});
const dateOk=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T12:00:00Z'));
const num=(x,max)=>{if(x==null||x==='')return null;const v=Number(x);return Number.isFinite(v)&&v>=0&&v<=max?v:null};
export const handler=async(event)=>{
 if(event.httpMethod!=='POST')return response(405,{error:'POST required'});
 const expected=process.env.HEALTH_SYNC_TOKEN;
 const auth=event.headers.authorization||event.headers.Authorization||'';
 if(!expected||auth!==`Bearer ${expected}`)return response(401,{error:'Unauthorized'});
 if((event.body||'').length>250000)return response(413,{error:'Payload too large'});
 if(!process.env.SUPABASE_SERVICE_ROLE_KEY||!process.env.HEALTH_USER_ID)return response(503,{error:'Server not configured'});
 let payload;try{payload=JSON.parse(event.body||'{}')}catch{return response(400,{error:'Invalid JSON'})}
 // Accept normalized daily summaries only. A Health Auto Export raw payload requires a mapper.
 const rows=Array.isArray(payload.days)?payload.days:Array.isArray(payload)?payload:[payload];
 if(rows.length<1||rows.length>14)return response(400,{error:'Send 1–14 daily summaries'});
 const clean=[];
 for(const row of rows){
  const day=row.day||row.date;
  if(!dateOk(day))return response(400,{error:'Invalid day (YYYY-MM-DD)'});
  const fields={weight_lb:num(row.weight_lb,1500),steps:num(row.steps,150000),active_kcal:num(row.active_kcal,15000),workout_kcal:num(row.workout_kcal,15000)};
  if(Object.values(fields).every(v=>v===null))return response(400,{error:'No recognized activity or weight fields'});
  clean.push({day,...fields});
 }
 const supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
 // Read existing records and merge: missing measurements must not erase nutrition or other data.
 const {data:existing,error:readErr}=await supabase.from('daily_logs').select('*').eq('user_id',process.env.HEALTH_USER_ID).in('day',clean.map(r=>r.day));
 if(readErr)return response(500,{error:'Unable to read daily records'});
 const old=new Map((existing||[]).map(r=>[r.day,r]));
 const merged=clean.map(r=>{const prior=old.get(r.day)||{};const record={user_id:process.env.HEALTH_USER_ID,day:r.day};for(const key of ['weight_lb','steps','active_kcal','workout_kcal'])if(r[key]!==null)record[key]=r[key];else if(prior[key]!=null)record[key]=prior[key];return record});
 const {error}=await supabase.from('daily_logs').upsert(merged,{onConflict:'user_id,day'});
 if(error)return response(500,{error:'Unable to save records'});
 return response(200,{ok:true,days_saved:merged.length,at:new Date().toISOString()});
};
