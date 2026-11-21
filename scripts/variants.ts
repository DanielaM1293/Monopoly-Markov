import { stationary, DEFAULT_RULES } from '../src/engine';
const show=(name:string,r:any)=>{const {probs}=stationary(r);const top=probs.map((p,i)=>[i,p] as const).sort((a,b)=>b[1]-a[1]).slice(0,5);
console.log(name.padEnd(14),top.map(([i,p])=>i+':'+(p*100).toFixed(2)).join(' '),'| min',Math.min(...probs).toFixed(4));};
show('base',DEFAULT_RULES);
show('no jail',{...DEFAULT_RULES,goToJail:false});
show('no cards',{...DEFAULT_RULES,cards:false});
show('pay out',{...DEFAULT_RULES,payOutOfJail:true});
show('no 3dbl',{...DEFAULT_RULES,tripleDoubles:false});
show('nothing',{goToJail:false,cards:false,tripleDoubles:false,payOutOfJail:false});
// colour groups
const {probs}=stationary(DEFAULT_RULES);
const g:Record<string,number[]>={brown:[1,3],lightblue:[6,8,9],pink:[11,13,14],orange:[16,18,19],red:[21,23,24],yellow:[26,27,29],green:[31,32,34],darkblue:[37,39],rail:[5,15,25,35],util:[12,28]};
for(const k in g){console.log(k,(g[k].reduce((a,i)=>a+probs[i],0)/g[k].length*100).toFixed(3))}
