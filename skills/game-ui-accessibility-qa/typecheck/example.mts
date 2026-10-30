import {snapshotUI,type UISnapshot} from '../src/browser_probe.mjs';
const sample:UISnapshot=snapshotUI({root:document,insets:{top:44}});
const firstName:string|undefined=sample.controls[0]?.name;void firstName;
