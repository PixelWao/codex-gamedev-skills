import {Tree,ReactiveSelector,Guard,Action,Status} from '../scripts/bt.mjs';
const bb=new Map([['visible',false]]),events=[];
const combat=new Guard('visible',({bb})=>bb.get('visible'),new Action('chase',()=>Status.RUNNING,()=>events.push('chase cancelled')));
const patrol=new Action('patrol',()=>Status.RUNNING,()=>events.push('patrol cancelled'));
const tree=new Tree(new ReactiveSelector([combat,patrol]));
for(let i=0;i<5;i++){if(i===2)bb.set('visible',true);if(i===4)bb.set('visible',false);console.log(i,tree.tick({bb,time:i*.2,dt:.2}));}
tree.abort({bb,time:1,dt:0});console.log(events);
