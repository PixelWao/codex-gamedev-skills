import test from'node:test';import assert from'node:assert/strict';
import {configureDirectionalShadows,invalidateShadow,enableRendererShadows} from '../examples/configure-shadows.mjs';
import {shadowBudget}from'../scripts/shadow_budget.mjs';
function makeLight(){let updates=0;const camera={isOrthographicCamera:true,updateProjectionMatrix(){updates++;}};const size={set(x,y){this.x=x;this.y=y;}};return {light:{shadow:{camera,mapSize:size,autoUpdate:true,needsUpdate:false},castShadow:false},get updates(){return updates;}};}
test('updates shadow projection after configuration',()=>{const o=makeLight();configureDirectionalShadows(o.light,{mapSize:2048});assert.equal(o.updates,1);assert.equal(o.light.shadow.mapSize.x,2048);assert.equal(o.light.castShadow,true);});
test('validates frustum',()=>{const o=makeLight();assert.throws(()=>configureDirectionalShadows(o.light,{bounds:{left:1,right:-1,bottom:-1,top:1}}),/frustum/);assert.equal(o.updates,0);});
test('rejects bad power of two',()=>assert.throws(()=>configureDirectionalShadows(makeLight().light,{mapSize:1500}),/power of two/));
test('rejects nonfinite near',()=>assert.throws(()=>configureDirectionalShadows(makeLight().light,{near:NaN}),/non-finite/));
test('rejects invalid light',()=>assert.throws(()=>configureDirectionalShadows({shadow:{}}),/DirectionalLight/));
test('static updates deliberately',()=>{const o=makeLight();configureDirectionalShadows(o.light,{staticShadow:true});assert.equal(o.light.shadow.autoUpdate,false);o.light.shadow.needsUpdate=false;invalidateShadow(o.light);assert.equal(o.light.shadow.needsUpdate,true);});
test('renderer enabled explicitly',()=>{const r={shadowMap:{enabled:false}};enableRendererShadows(r);assert.equal(r.shadowMap.enabled,true);});
test('one directional shadow face',()=>{const r=shadowBudget({lights:[{type:'DirectionalLight',castShadow:true,mapSize:[1024,1024]}]});assert.equal(r.totalFaces,1);assert.equal(r.estimatedMiB,4);});
test('one point light six faces',()=>{const r=shadowBudget({lights:[{type:'PointLight',castShadow:true,mapSize:[512,512]}]});assert.equal(r.totalFaces,6);assert.equal(r.estimatedMiB,6);});
test('unlit light not counted',()=>assert.equal(shadowBudget({lights:[{type:'PointLight',castShadow:false}]}).totalFaces,0));
test('oversized map rejected',()=>assert.equal(shadowBudget({lights:[{type:'PointLight',castShadow:true,mapSize:[99999,512]}]}).ok,false));
test('declared budget gate',()=>assert.equal(shadowBudget({maxEstimatedMB:1,lights:[{type:'PointLight',castShadow:true,mapSize:[512,512]}]}).ok,false));
