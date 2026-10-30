export declare function secondsPerBeat(bpm: number): number;
export declare function smoothIntensity(current:number,target:number,deltaSeconds:number,timeConstant?:number):number;
export declare function hysteresisLevel(value:number,previous:0|1,params?:{low?:number;high?:number}):0|1;
export declare class MusicalClock {
  constructor(config?:{bpm?:number;beatsPerBar?:number;origin?:number});
  readonly bpm:number; readonly beatSeconds:number; readonly beatsPerBar:number; origin:number;
  boundaryAtOrAfter(time:number, params?:{bars?:number;epsilon?:number}):number;
  beatAtOrAfter(time:number, params?:{epsilon?:number}):number;
}
export declare class AdaptiveMusicDirector {
  constructor(options:{context:AudioContext;output:AudioNode;bpm?:number;beatsPerBar?:number;lookaheadSeconds?:number});
  startStems(buffers:Record<string,AudioBuffer>,options?:{base?:string;at?:number}):number;
  setStem(name:string,audible:boolean,params?:{at?:number;fadeSeconds?:number}):void;
  requestSection(buffer:AudioBuffer,params?:{at?:number;quantizeBars?:number;crossfade?:number;loop?:boolean}):number;
  stop(params?:{at?:number}):void;
  dispose():void;
}
