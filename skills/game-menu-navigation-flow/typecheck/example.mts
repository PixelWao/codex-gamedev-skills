import {ScreenStack,createInputRouter,bindPointerActions,domScreen,createModalController,type UIScreen,type UIAction} from '../src/menu.mjs';
const s=new ScreenStack();const x:UIScreen={activate(){},deactivate(){}};s.push(x);s.pop();
const router=createInputRouter({onAction:(action:UIAction)=>{void action;}});router.poll();router.dispose();
const btn=document.createElement('button');const binder=bindPointerActions(btn,{onStart:(id:number)=>{void id;}});binder.dispose();
const view=domScreen(btn);void view;
const dialog=document.createElement('dialog');const ctrl=createModalController(dialog);ctrl.dispose();
