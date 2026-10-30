import {analyzeProgression,analyzePacing} from '../src/progression.mjs';
import {readFileSync} from 'node:fs';
const file=new URL('./solvable-level.json',import.meta.url);
const level=JSON.parse(readFileSync(file,'utf8'));
console.log('Progression:',JSON.stringify(analyzeProgression(level),null,2));
console.log('Pacing:',analyzePacing(level.beats));
