const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'../src/styles/index.css'),'utf8');
function rgb(h,s,l){h/=360;s/=100;l/=100;const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h*12)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};return[f(0),f(8),f(4)];}
function lum(value){const linear=rgb(...value.split(/\s+/).map(parseFloat)).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;}
const themes={light:{},dark:{}};
for(const block of css.matchAll(/:root(\.dark)?\s*\{([^}]+)\}/g)){const target=block[1]?themes.dark:themes.light;for(const token of block[2].matchAll(/--([\w-]+):\s*([\d.]+\s+[\d.]+%\s+[\d.]+%)/g))target[token[1]]=token[2];}
themes.dark={...themes.light,...themes.dark};
let failed=false;
for(const [name,tokens] of Object.entries(themes))for(const [fg,bg,min] of [['ink','canvas',4.5],['muted','canvas',4.5],['muted','surface',4.5],['accent-ink','accent',4.5],['success-ink','success-bg',4.5],['warning-ink','warning-bg',4.5],['danger-ink','danger-bg',4.5],['accent','surface',3],['control','surface',3]]){const a=lum(tokens[fg]),b=lum(tokens[bg]);const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);console.log(`${name}: ${fg}/${bg} ${ratio.toFixed(2)}:1 ${ratio>=min?'PASS':'FAIL'}`);if(ratio<min)failed=true;}
if(failed)process.exitCode=1;
