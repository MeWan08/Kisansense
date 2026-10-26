const path=require('node:path');process.chdir(path.resolve(__dirname,'../..'));
const fs=require('node:fs');const crypto=require('node:crypto');const raw=fs.readFileSync('data/raw/Crop_recommendation.csv','utf8');const lines=raw.trim().split(/\r?\n/);const keys=lines.shift().split(',');const rows=lines.map(l=>Object.fromEntries(l.split(',').map((v,i)=>[keys[i],keys[i]==='label'?v:Number(v)])));
const group={cereal:['rice','maize'],pulse:['chickpea','kidneybeans','pigeonpeas','mothbeans','mungbean','blackgram','lentil'],commercial:['cotton','jute','coffee']};
const profiles=[...new Set(rows.map(r=>r.label))].sort().map(id=>{const records=rows.filter(r=>r.label===id);return{id,category:Object.keys(group).find(k=>group[k].includes(id))||'fruit',count:records.length,ranges:Object.fromEntries(keys.filter(k=>k!=='label').map(k=>{const vals=records.map(r=>r[k]).sort((a,b)=>a-b);return[k,[vals[Math.floor((vals.length-1)*.1)],vals[Math.ceil((vals.length-1)*.9)]]]}))};});
fs.writeFileSync('frontend/src/features/crops/profiles.json',JSON.stringify({source:'data/raw/Crop_recommendation.csv',sha256:crypto.createHash('sha256').update(raw).digest('hex'),rows:rows.length,profiles},null,2));

