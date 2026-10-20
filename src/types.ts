export interface MaterialPreset {
  id: string;
  name: string;
  epsilonR: number; // Relative permittivity
  lossTangent: number;
  color: string;
  description: string;
}

export interface WallGeometry {
  thickness: number; // e (wall thickness)
  slotSpacing: number; // t (spacing between slots)
  cavityDepth: number; // internal air channel depth ("col d'air")
  slotCount: number; // number of open cavities/slots
  posX: number; // position along propagation axis
  height: number;
}

export type WaveType = 'plane' | 'point';

export interface WaveConfig {
  frequency: number; // f in GHz/kHz scale
  amplitude: number; // E0
  sourceType: WaveType;
  waveSpeedC: number;
}

export interface ProbeData {
  x: number;
  z: number;
  currentValue: number;
  history: number[];
  peakToPeak: number;
  rms: number;
  transmissionCoeff: number;
}

export interface SimulationState {
  isPlaying: boolean;
  speed: number;
  time: number;
  showVectors: boolean;
  showSurface: boolean;
  cameraMode: 'perspective' | 'top';
}
