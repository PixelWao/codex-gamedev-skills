export interface LevelEvent {id:string;time:number;type:string;room:string;data?:Record<string,unknown>}
export declare class LevelTrace {events:Array<Required<LevelEvent>>;record(event:LevelEvent):Required<LevelEvent>;summary():{count:number;counts:Record<string,number>;uniqueRooms:string[];elapsed:number};toJSONL():string;clear():void}
