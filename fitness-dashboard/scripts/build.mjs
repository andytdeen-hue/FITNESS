import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
let html=await readFile('dist/index.html','utf8');
const url=process.env.SUPABASE_URL||'';const key=process.env.SUPABASE_ANON_KEY||'';
html=html.replace('__SUPABASE_URL__',url).replace('__SUPABASE_ANON_KEY__',key);
await writeFile('dist/index.html',html);
