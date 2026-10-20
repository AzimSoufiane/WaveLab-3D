import {
  MaterialPreset,
  WallGeometry,
  WaveConfig,
  SurfaceTextureProfile,
} from '../types';

export const C_LIGHT_VACUUM = 2.99792458e8; // c dans le vide (m/s)
export const ETA_0 = 376.730313668; // Impédance du vide η0 (Ω)

export const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: 'polystyrene',
    name: 'Polystyrène Expansé',
    epsilonR: 2.54,
    lossTangent: 0.0005,
    color: '#38BDF8',
    description: 'Polymère diélectrique à faibles pertes (εr = 2.54). Retard de phase modéré, forte transmission.',
  },
  {
    id: 'concrete',
    name: 'Béton de Structure',
    epsilonR: 6.0,
    lossTangent: 0.05,
    color: '#94A3B8',
    description: 'Paroi maçonnée dense (εr = 6.0). Forte réflexion, onde stationnaire marquée en amont.',
  },
  {
    id: 'air',
    name: 'Vide / Espace Libre',
    epsilonR: 1.0,
    lossTangent: 0.0,
    color: '#67E8F9',
    description: 'Milieu de référence standard (εr = 1.0). Vitesse de phase maximale v = c.',
  },
  {
    id: 'metal',
    name: 'Conducteur Parfait (PEC)',
    epsilonR: 25.0,
    lossTangent: 0.98,
    color: '#F43F5E',
    description: 'Paroi métallique hautement conductrice. Réflexion totale, pénétration limitée à l\'épaisseur de peau.',
  },
  {
    id: 'brick',
    name: 'Brique Pleine',
    epsilonR: 4.2,
    lossTangent: 0.02,
    color: '#FB923C',
    description: 'Matériau réfractaire standard (εr = 4.2). Réfraction interne nette et déphasage substantiel.',
  },
];

export interface FieldValue {
  amplitude: number; // Amplitude instantanée du champ électrique Ey(x, z, t)
  amplitudeZ: number; // Composante Ez(x, z, t) pour polarisation circulaire
  gradientX: number; // dE/dx
  gradientZ: number; // dE/dz
  fluxX: number; // Composante X du flux moyen de Poynting <Π>
  fluxZ: number; // Composante Z du flux moyen de Poynting <Π>
  inObstacle: boolean; // Position à l'intérieur du profil texturé
  isEvanescent: boolean; // Régime d'onde évanescente (f < fc)
}

/**
 * Calcul de la fréquence de coupure fc pour un guide d'onde rectangulaire TE_mn ou TM_mn :
 * fc = (c / (2 * sqrt(eps_r))) * sqrt((m/a)^2 + (n/b)^2)
 */
export function calculateCutoffFrequency(
  a: number,
  b: number,
  m: number,
  n: number,
  epsilonR: number,
  cSpeed: number = C_LIGHT_VACUUM
): number {
  if (m === 0 && n === 0) return 0;
  const sqrtEps = Math.sqrt(Math.max(1.0, epsilonR));
  const termX = m / Math.max(0.001, a);
  const termY = n / Math.max(0.001, b);
  const fc = (cSpeed / (2 * sqrtEps)) * Math.sqrt(termX * termX + termY * termY);
  return fc;
}

/**
 * Calcul complet des grandeurs électromagnétiques analytiques (M115)
 */
export function calculateElectromagneticParameters(
  wave: WaveConfig,
  material: MaterialPreset
) {
  const epsR = Math.max(1.0, material.epsilonR);
  const nRef = Math.sqrt(epsR);
  const fHz = wave.frequency * 1e9; // GHz -> Hz
  const omega = 2 * Math.PI * fHz;

  // Vitesse de phase en milieu non guidé
  const vPhase = C_LIGHT_VACUUM / nRef;
  const lambda0 = C_LIGHT_VACUUM / fHz;
  const lambdaMedium = vPhase / fHz;
  const k0 = (2 * Math.PI) / lambda0;
  const kMedium = (2 * Math.PI) / lambdaMedium;

  // Impédance d'onde
  const eta = ETA_0 / nRef;

  // Vecteur de Poynting moyen <Π>
  const poyntingMean = (wave.amplitude * wave.amplitude) / (2 * eta);

  // Coefficients de Fresnel pour incidence normale
  const rFresnel = (1 - nRef) / (1 + nRef);
  const tFresnel = (2 * 1) / (1 + nRef);
  const reflectionR = rFresnel * rFresnel;
  const transmissionT = 1 - reflectionR;

  // Paramètres guidés si TE ou TM
  let fc = 0;
  let isCutoff = false;
  let vPhaseGuided = vPhase;
  let lambdaGuided = lambdaMedium;
  let kGuided = kMedium;
  let attenuationAlpha = 0;

  if (wave.guidedMode !== 'TEM') {
    fc = calculateCutoffFrequency(
      wave.guideA,
      wave.guideB,
      wave.modeM,
      wave.modeN,
      epsR,
      C_LIGHT_VACUUM
    );
    const fcRatio = fc / Math.max(1, fHz);

    if (fcRatio >= 1.0) {
      isCutoff = true;
      vPhaseGuided = Infinity;
      lambdaGuided = Infinity;
      kGuided = 0;
      attenuationAlpha = (omega / vPhase) * Math.sqrt(fcRatio * fcRatio - 1.0);
    } else {
      isCutoff = false;
      const betaFactor = Math.sqrt(1.0 - fcRatio * fcRatio);
      vPhaseGuided = vPhase / betaFactor;
      lambdaGuided = lambdaMedium / betaFactor;
      kGuided = kMedium * betaFactor;
      attenuationAlpha = 0;
    }
  }

  return {
    fHz,
    omega,
    vPhase,
    lambda0,
    lambdaMedium,
    k0,
    kMedium,
    eta,
    poyntingMean,
    rFresnel,
    tFresnel,
    reflectionR,
    transmissionT,
    fc,
    fcRatio: fc / Math.max(1, fHz),
    isCutoff,
    vPhaseGuided,
    lambdaGuided,
    kGuided,
    attenuationAlpha,
  };
}

/**
 * Calcule le profil avant x_front(z) selon la texture géométrique sélectionnée :
 * 1. Triangulaire (dents de scie / coins dièdres)
 * 2. Circulaire (demi-cylindres corrugués convexes)
 * 3. Sinusoïdale (modulation continue de surface de Bragg)
 * 4. Rectangulaire (créneaux de guides d'ondes)
 */
export function getSurfaceTextureDisplacement(
  z: number,
  profile: SurfaceTextureProfile,
  depth: number,
  period: number
): number {
  if (depth <= 0.01 || period <= 0.05) return 0;
  const periodNorm = Math.max(0.2, period);
  // Position normalisée au sein de la période [0, periodNorm)
  const u = (((z % periodNorm) + periodNorm) % periodNorm) / periodNorm; // [0, 1)

  switch (profile) {
    case 'triangulaire': {
      // V-groove triangulaire symétrique / dents de scie
      const tri = 1.0 - 2.0 * Math.abs(u - 0.5); // 0 aux bords, 1 au centre
      return depth * tri;
    }
    case 'fentes_cavites': {
      // Fentes & Cavités d'air ("Col d'air") : canal ouvert au centre de chaque période
      const inSlot = Math.abs(u - 0.5) < 0.22;
      return inSlot ? 0 : depth;
    }
    case 'creneaux':
    case 'rectangulaire': {
      // Créneaux rectangulaires (duty cycle 50%)
      return u < 0.5 ? depth : 0;
    }
    case 'circulaire': {
      // Bossages demi-cylindriques convexes
      const centered = (u - 0.5) * 2.0; // [-1, 1]
      if (Math.abs(centered) <= 1.0) {
        return depth * Math.sqrt(Math.max(0, 1.0 - centered * centered));
      }
      return 0;
    }
    case 'sinusoidale': {
      // Modulation harmonique continue de Bragg
      return depth * 0.5 * (1.0 + Math.cos(2.0 * Math.PI * (u - 0.5)));
    }
    default:
      return 0;
  }
}

/**
 * Teste si un point (x, z) se trouve à l'intérieur de l'obstacle texturé 3D
 */
export function evaluateTextureObstacle(
  x: number,
  z: number,
  wall: WallGeometry
): { inside: boolean; depthIntoWall: number } {
  const halfThickness = wall.thickness / 2;
  const xBack = wall.posX + halfThickness;
  const baseFront = wall.posX - halfThickness;
  const deltaX = getSurfaceTextureDisplacement(
    z,
    wall.textureProfile,
    wall.textureDepth,
    wall.texturePeriod
  );
  const xFront = baseFront - deltaX;

  if (x >= xFront && x <= xBack) {
    return {
      inside: true,
      depthIntoWall: x - xFront,
    };
  }

  return { inside: false, depthIntoWall: 0 };
}

/**
 * Calcul précis du champ électromagnétique E(x, z, t) et de la propagation
 * pour les modes TEM, TE, TM avec polarisation et profils de texture.
 */
export function calculateWaveField(
  x: number,
  z: number,
  t: number,
  wave: WaveConfig,
  wall: WallGeometry,
  material: MaterialPreset
): FieldValue {
  const cSim = wave.waveSpeedC; // vitesse de base normalisée (m/s simulée)
  const f = wave.frequency;
  const omega = 2 * Math.PI * f;
  const k0 = omega / cSim;
  const n = Math.sqrt(Math.max(1.0, material.epsilonR));
  const kMat = k0 * n;

  // Calcul de la fréquence de coupure normalisée
  const halfThickness = wall.thickness / 2;
  const baseFront = wall.posX - halfThickness;
  const xBack = wall.posX + halfThickness;

  const textureDelta = getSurfaceTextureDisplacement(
    z,
    wall.textureProfile,
    wall.textureDepth,
    wall.texturePeriod
  );
  const xFront = baseFront - textureDelta;

  const inWall = x >= xFront && x <= xBack;
  const isPastWall = x > xBack;

  // Coefficient de Fresnel
  const rFresnel = (1 - n) / (1 + n);
  const tFresnel = (2 * 1) / (1 + n);

  // Mode guidé TE / TM
  let isCutoff = false;
  let alphaDecay = 0;
  let kProp = k0;

  if (wave.guidedMode !== 'TEM') {
    // Calcul de coupure normalisé pour la taille de scène
    // guideA mappé à l'envergure Z du guide
    const aEff = Math.max(1.0, wave.guideA * 40.0);
    const m = Math.max(1, wave.modeM);
    const fcNorm = (cSim / (2 * n)) * (m / aEff);
    const ratio = fcNorm / Math.max(0.01, f);

    if (ratio >= 1.0) {
      isCutoff = true;
      alphaDecay = kMat * Math.sqrt(ratio * ratio - 1.0);
      kProp = 0;
    } else {
      isCutoff = false;
      kProp = kMat * Math.sqrt(1.0 - ratio * ratio);
      alphaDecay = 0;
    }
  }

  let ampY = 0;
  let ampZ = 0;

  if (wave.polarization === 'source_surfacique') {
    // Source Surfacique de Courant j_s = J0 e^{j omega t} e_x à x = -10
    const sourceX = -10;
    const dist = Math.abs(x - sourceX);
    const sign = x >= sourceX ? 1 : -1;
    const phase = k0 * dist - omega * t;
    ampY = -wave.amplitude * 0.8 * Math.cos(phase);

    if (inWall) {
      if (material.id === 'metal') {
        ampY *= Math.exp(-(x - xFront) * 3.5);
      } else {
        ampY *= tFresnel * Math.cos(kMat * (x - xFront) - omega * t);
      }
    }
  } else {
    // Onde plane incidente depuis la gauche (x = -15)
    const sourceX = -15;

    if (x < xFront) {
      // Région 1 : Onde incidente + Onde réfléchie sur la surface texturée
      const phaseInc = k0 * (x - sourceX) - omega * t;
      const incWave = wave.amplitude * Math.cos(phaseInc);

      // Réflexion tenant compte du relief de texture
      const distRef = (xFront - sourceX) + (xFront - x);
      const refAmp = wave.amplitude * Math.abs(rFresnel) * (material.id === 'metal' ? 0.96 : 0.65);
      const phaseRef = k0 * distRef - omega * t + (rFresnel < 0 ? Math.PI : 0);
      const refWave = refAmp * Math.cos(phaseRef);

      ampY = incWave + refWave;

      if (wave.polarization === 'circulaire') {
        ampZ = wave.amplitude * Math.sin(phaseInc) + refAmp * Math.sin(phaseRef);
      }
    } else if (inWall) {
      // Région 2 : À l'intérieur du matériau
      if (wave.guidedMode !== 'TEM' && isCutoff) {
        // Régime d'onde évanescente sous la fréquence de coupure !
        const penetration = Math.max(0, x - xFront);
        const evanescentDecay = Math.exp(-alphaDecay * penetration * 0.4);
        ampY = wave.amplitude * tFresnel * evanescentDecay * Math.cos(omega * t);
        if (wave.polarization === 'circulaire') {
          ampZ = wave.amplitude * tFresnel * evanescentDecay * Math.sin(omega * t);
        }
      } else if (
        wall.textureProfile === 'fentes_cavites' &&
        Math.abs(((((z % Math.max(0.5, wall.texturePeriod)) + Math.max(0.5, wall.texturePeriod)) % Math.max(0.5, wall.texturePeriod)) / Math.max(0.5, wall.texturePeriod)) - 0.5) < 0.22
      ) {
        // Dans le col d'air / fente ouverte : onde non ralentie se propageant dans l'air avec résonance
        const optPath = x - sourceX;
        const cavityResonance = 1.0 + 0.3 * Math.sin(k0 * wall.textureDepth * 2);
        ampY = wave.amplitude * cavityResonance * Math.cos(k0 * optPath - omega * t);
        if (wave.polarization === 'circulaire') {
          ampZ = wave.amplitude * cavityResonance * Math.sin(k0 * optPath - omega * t);
        }
      } else {
        // Diélectrique propagatif (retard de phase et compression de longueur d'onde)
        const opticalDist = (xFront - sourceX) + (x - xFront) * (wave.guidedMode !== 'TEM' ? (kProp / k0) : n);
        const loss = Math.exp(-(x - xFront) * material.lossTangent * 1.5);
        ampY = wave.amplitude * tFresnel * loss * Math.cos(k0 * opticalDist - omega * t);
        if (wave.polarization === 'circulaire') {
          ampZ = wave.amplitude * tFresnel * loss * Math.sin(k0 * opticalDist - omega * t);
        }
      }

      // Modulation transversale pour modes TE / TM
      if (wave.guidedMode === 'TE') {
        // TE10 : profil sinusoïdal selon la largeur
        const zWidth = 16;
        const modZ = Math.sin((Math.PI * (z + zWidth / 2)) / zWidth);
        ampY *= Math.max(0, modZ);
      } else if (wave.guidedMode === 'TM') {
        const zWidth = 16;
        const modZ = Math.cos((Math.PI * (z + zWidth / 2)) / zWidth);
        ampY *= Math.abs(modZ);
      }
    } else {
      // Région 3 : Milieu transmis (x > xBack)
      if (wave.guidedMode !== 'TEM' && isCutoff) {
        // Évanescent : transmission quasi-nulle
        const totalDecay = Math.exp(-alphaDecay * wall.thickness * 0.4);
        ampY = wave.amplitude * totalDecay * 0.1 * Math.cos(k0 * (x - xBack) - omega * t);
      } else {
        const transLoss = material.id === 'metal' ? 0.02 : Math.exp(-wall.thickness * material.lossTangent * 2.0);
        const totalTransit = (xFront - sourceX) + wall.thickness * n + (x - xBack);
        const tAmp = wave.amplitude * (4 * n / Math.pow(1 + n, 2)) * transLoss;
        ampY = tAmp * Math.cos(k0 * totalTransit - omega * t);
        if (wave.polarization === 'circulaire') {
          ampZ = tAmp * Math.sin(k0 * totalTransit - omega * t);
        }
      }
    }
  }

  // Calcul du gradient local (dE/dx, dE/dz)
  const delta = 0.1;
  const ampX1 = evaluatePoint(x + delta, z, t, wave, wall, material);
  const ampX0 = evaluatePoint(x - delta, z, t, wave, wall, material);
  const ampZ1 = evaluatePoint(x, z + delta, t, wave, wall, material);
  const ampZ0 = evaluatePoint(x, z - delta, t, wave, wall, material);

  const gradX = (ampX1 - ampX0) / (2 * delta);
  const gradZ = (ampZ1 - ampZ0) / (2 * delta);

  // Direction du vecteur de Poynting moyen <Π>
  const fluxMag = Math.sqrt(gradX * gradX + gradZ * gradZ);
  const fluxX = fluxMag > 0.01 ? -gradX / fluxMag : 1;
  const fluxZ = fluxMag > 0.01 ? -gradZ / fluxMag : 0;

  return {
    amplitude: ampY,
    amplitudeZ: ampZ,
    gradientX: gradX,
    gradientZ: gradZ,
    fluxX,
    fluxZ,
    inObstacle: inWall,
    isEvanescent: isCutoff && inWall,
  };
}

function evaluatePoint(
  x: number,
  z: number,
  t: number,
  wave: WaveConfig,
  wall: WallGeometry,
  material: MaterialPreset
): number {
  const c = wave.waveSpeedC;
  const omega = 2 * Math.PI * wave.frequency;
  const k0 = omega / c;
  const n = Math.sqrt(Math.max(1.0, material.epsilonR));
  const halfThickness = wall.thickness / 2;
  const baseFront = wall.posX - halfThickness;
  const xBack = wall.posX + halfThickness;
  const deltaX = getSurfaceTextureDisplacement(
    z,
    wall.textureProfile,
    wall.textureDepth,
    wall.texturePeriod
  );
  const xFront = baseFront - deltaX;

  if (x < xFront) {
    return wave.amplitude * Math.cos(k0 * (x + 15) - omega * t);
  } else if (x <= xBack) {
    return wave.amplitude * 0.7 * Math.cos(k0 * n * (x + 15) - omega * t);
  } else {
    return wave.amplitude * 0.65 * Math.cos(k0 * (x + 15) - omega * t);
  }
}
