import {analyzeProgression,validateLevel,analyzePacing,type Level} from '../src/progression.mjs';
const level:Level={start:'start',goal:'finish',rooms:{start:{exits:[{to:'finish'}]},finish:{exits:[]}}};
const report=analyzeProgression(level);const status:string=report.status;
const errors=validateLevel(level).errors;const beats=analyzePacing([{type:'rest',intensity:.1}]);
console.log(status,errors.length,beats.beats);
