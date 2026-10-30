import test from 'node:test';import assert from 'node:assert/strict';import {snapshotUI} from '../src/browser_probe.mjs';
test('browser probe snapshots CSS rect, ARIA name and viewport',()=>{
 const e={id:'play',hidden:false,disabled:false,tabIndex:0,scrollWidth:80,clientWidth:80,labels:[],textContent:'Play',
  matches:()=>true,hasAttribute:()=>false,getAttribute:()=>null,getBoundingClientRect:()=>({left:12,top:60,width:80,height:50})};
 const doc={documentElement:{clientWidth:390,clientHeight:844},activeElement:null,querySelectorAll:()=>[e],defaultView:{getComputedStyle:()=>({display:'block',visibility:'visible',fontSize:'16px',color:'rgb(255, 255, 255)',backgroundColor:'rgb(0, 0, 0)',outlineStyle:'none',boxShadow:'none',overflowX:'visible'}),visualViewport:{width:390,height:844,scale:1}}};
 const s=snapshotUI({root:doc,insets:{top:44}});assert.equal(s.controls[0].name,'Play');assert.equal(s.controls[0].focusIndicator,undefined);assert.equal(s.viewport.insets.top,44);assert.equal(s.controls[0].rect.width,80);
});
