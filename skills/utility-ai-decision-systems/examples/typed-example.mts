import {Evaluator,curves} from '../scripts/utility.mjs';
type Facts={health:number};
const model=new Evaluator<Facts>([{name:'heal',score:f=>curves.smoothstep(1-f.health)}]);
const action:string|null=model.choose({health:.2})?.name??null;
console.log(action);
