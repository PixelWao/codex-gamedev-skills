import {safeRect,layoutForViewport,healthFraction,makeHudStore,bindHud,projectThreeToCss} from '../src/hud.mjs';
const a:number=safeRect({width:100,height:100},{left:10}).width;
const b:number=layoutForViewport({width:100,height:100,dpr:2}).backingWidth;
const hp:number=healthFraction(2,4);
const store=makeHudStore({hp:80});
const unsub=bindHud({store,select:x=>x.hp,render:(x:number)=>{void x;}});
store.patch({hp:40});unsub();
const sum=a+b+hp;void sum;
