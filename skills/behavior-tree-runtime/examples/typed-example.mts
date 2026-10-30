import {Tree,Sequence,Condition,Wait,Status} from '../scripts/bt.mjs';
const bb=new Map<string,unknown>([['ready',true]]);
const tree=new Tree(new Sequence([new Condition('ready',({bb})=>bb.get('ready')===true),new Wait(.5)]));
const value:string=tree.tick({bb,time:0,dt:.25});
if(value!==Status.RUNNING)throw Error('expected Running');
