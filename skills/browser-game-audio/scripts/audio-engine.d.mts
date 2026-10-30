export declare const BUS_NAMES: readonly string[];
export declare function sliderGain(value: number, power?: number): number;
export declare function dbToGain(db: number): number;
export declare function gainToDb(gain: number): number;
export interface AudioVoice { readonly priority: number; readonly startedAt: number; stop(): void }
export interface AudioPlayOptions { bus?: 'music'|'sfx'|'ui'|'ambience'|'voice'; volume?: number; playbackRate?: number; loop?: boolean; position?: [number,number,number] | null; cooldownKey?: string | null; cooldownSeconds?: number; priority?: number; steal?: 'oldest'|'reject' }
export declare class BrowserGameAudio {
  constructor(opts: {context: AudioContext; maxVoices?: number; rng?: ()=>number});
  readonly context: AudioContext;
  readonly voices: Set<AudioVoice>;
  readonly closed: boolean;
  unlock(): Promise<boolean>;
  setMaster(value: number): void;
  setMasterLevel(value: number): void;
  setMute(value: boolean): void;
  setBusLevel(name: AudioPlayOptions['bus'], value: number): void;
  duckMusic(active: boolean, options?: {amountDb?: number; timeConstant?: number}): void;
  loadBuffer(url: string, opts?: {fetcher?: typeof fetch}): Promise<AudioBuffer>;
  play(buffer: AudioBuffer, opts?: AudioPlayOptions): AudioVoice | null;
  playVaried(buffers: AudioBuffer[], opts?: AudioPlayOptions): AudioVoice | null;
  suspend(): Promise<void>; resume(): Promise<void>; dispose(): void;
}
