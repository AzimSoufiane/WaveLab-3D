export type SurfaceTextureProfile =
  | 'triangulaire'
  | 'fentes_cavites'
  | 'creneaux'
  | 'circulaire'
  | 'sinusoidale'
  | 'rectangulaire';

export type GuidedMode = 'TEM' | 'TE' | 'TM';

export type PolarizationMode = 'rectiligne' | 'circulaire' | 'source_surfacique';

export interface MaterialPreset {
  id: string;
  name: string;
  epsilonR: number; // Permittivité relative εr
  lossTangent: number; // Facteur de dissipation tg(δ)
  color: string;
  description: string;
}

export interface WallGeometry {
  textureProfile: SurfaceTextureProfile; // Profil géométrique de texture sur la face avant
  thickness: number; // Épaisseur de paroi e (m)
  textureDepth: number; // Profondeur/amplitude de la texture h (m)
  texturePeriod: number; // Période spatiale Λ de la texture (m)
  posX: number; // Position X sur l'axe de propagation (m)
  height: number; // Hauteur Y (m)
}

export interface WaveConfig {
  frequency: number; // Fréquence f (GHz)
  amplitude: number; // Amplitude de crête E0 (V/m)
  guidedMode: GuidedMode; // Mode TEM, TE ou TM
  guideA: number; // Largeur du guide d'ondes a (m)
  guideB: number; // Hauteur du guide d'ondes b (m)
  modeM: number; // Indice de mode m (ex: 1 pour TE10)
  modeN: number; // Indice de mode n (ex: 0 pour TE10)
  polarization: PolarizationMode; // Polarisation pour onde TEM
  waveSpeedC: number; // Vitesse de référence c normalisée
}

export interface DualProbeState {
  // Sonde 1 (x1, z1) - Voie A (Cyan)
  x1: number;
  z1: number;
  val1: number;
  history1: number[];
  pkToPk1: number;
  rms1: number;

  // Sonde 2 (x2, z2) - Voie B (Ambre)
  x2: number;
  z2: number;
  val2: number;
  history2: number[];
  pkToPk2: number;
  rms2: number;

  // Grandeurs physiques différentielles & guidées
  activeProbe: 1 | 2;
  deltaPhiRad: number; // Δφ = k · |x2 - x1| (rad)
  deltaPhiDeg: number; // Δφ (°)
  distanceDeltaX: number; // |x2 - x1| (m)
  transmissionCoeff: number; // T = (E2_rms / E1_rms)^2
  isCutoff: boolean; // f < fc
  cutoffFreq: number; // fc (GHz)
  vPhaseGuided: number; // v_phi,guided (m/s normalisé)
  lambdaGuided: number; // λg (m)
  attenuationAlpha: number; // α (Np/m)
}

export interface SimulationState {
  isPlaying: boolean;
  speed: number;
  time: number;
  showVectors: boolean;
  showSurface: boolean;
  cameraMode: 'perspective' | 'top';
  showKatexPanel: boolean;
}
