import { MaterialPreset, WallGeometry, WaveConfig } from '../types';

export const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: 'polystyrene',
    name: 'Polystyrene (Expanded)',
    epsilonR: 2.54,
    lossTangent: 0.0005,
    color: '#38BDF8', // light blue
    description: 'Low loss polymer with εr = 2.54. Moderate phase delay, high transmission.',
  },
  {
    id: 'concrete',
    name: 'Concrete Barrier',
    epsilonR: 6.0,
    lossTangent: 0.05,
    color: '#94A3B8', // slate
    description: 'Dense structural masonry with εr = 6.0. High reflection, shortened wavelength.',
  },
  {
    id: 'air',
    name: 'Air / Vacuum Gap',
    epsilonR: 1.0,
    lossTangent: 0.0,
    color: '#67E8F9', // translucent cyan
    description: 'Reference medium with εr = 1.0. Baseline phase velocity v = c.',
  },
  {
    id: 'metal',
    name: 'Conductor / Absorber',
    epsilonR: 15.0,
    lossTangent: 0.95,
    color: '#F43F5E', // metallic rose
    description: 'Conductive boundary with heavy skin-depth attenuation and reflection.',
  },
  {
    id: 'brick',
    name: 'Solid Brick',
    epsilonR: 4.2,
    lossTangent: 0.02,
    color: '#FB923C', // terracotta
    description: 'Common building material with εr = 4.2. Noticeable internal refraction.',
  },
];

export interface FieldValue {
  amplitude: number; // instantaneous displacement E(x,z,t)
  gradientX: number; // dE/dx
  gradientZ: number; // dE/dz
  fluxX: number; // Poynting flux direction X
  fluxZ: number; // Poynting flux direction Z
  inObstacle: boolean;
}

/**
 * Checks if a given coordinate (x, z) falls inside solid obstacle material,
 * considering thickness (e), slot spacing (t), air gap cavity ("col d'air"), and slot count.
 */
export function evaluateObstacleGeometry(
  x: number,
  z: number,
  wall: WallGeometry
): { insideSolid: boolean; insideCavity: boolean; slotIndex: number } {
  const halfThickness = wall.thickness / 2;
  const xMin = wall.posX - halfThickness;
  const xMax = wall.posX + halfThickness;

  if (x < xMin || x > xMax) {
    return { insideSolid: false, insideCavity: false, slotIndex: -1 };
  }

  // Obstacle spans from z = -12 to z = 12
  const wallSpan = 24;
  const count = Math.max(1, wall.slotCount);
  const slotWidth = Math.max(0.6, wall.slotSpacing * 0.45);
  const totalPeriod = wallSpan / count;

  // Check each slot center along Z
  for (let i = 0; i < count; i++) {
    const slotCenterZ = -wallSpan / 2 + totalPeriod * (i + 0.5);
    const distZ = Math.abs(z - slotCenterZ);

    if (distZ < slotWidth / 2) {
      // In the slot corridor!
      // Check if inside internal cavity ("col d'air")
      const cavityDepthRatio = Math.min(1.0, wall.cavityDepth / Math.max(0.1, wall.thickness));
      const cavityHalfX = halfThickness * cavityDepthRatio;
      const isCavity = Math.abs(x - wall.posX) <= cavityHalfX;
      return { insideSolid: false, insideCavity: isCavity, slotIndex: i };
    }
  }

  return { insideSolid: true, insideCavity: false, slotIndex: -1 };
}

/**
 * Computes instantaneous wave amplitude and gradient at (x, z) at time t.
 * Models incident wavefront, dielectric phase slowdown (k = k0 * sqrt(eps_r)),
 * Fresnel boundary reflection/transmission, and Huygens diffraction through slots.
 */
export function calculateWaveField(
  x: number,
  z: number,
  t: number,
  wave: WaveConfig,
  wall: WallGeometry,
  material: MaterialPreset
): FieldValue {
  const c = wave.waveSpeedC;
  const f = wave.frequency;
  const omega = 2 * Math.PI * f;
  const k0 = omega / c;
  const n = Math.sqrt(Math.max(1.0, material.epsilonR));
  const kMat = k0 * n;

  const halfThickness = wall.thickness / 2;
  const xFront = wall.posX - halfThickness;
  const xBack = wall.posX + halfThickness;

  // Fresnel reflection and transmission coefficients for normal incidence
  const rCoeff = (1 - n) / (1 + n);
  const tCoeff = (2 * 1) / (1 + n);

  let amp = 0;
  const geom = evaluateObstacleGeometry(x, z, wall);

  if (wave.sourceType === 'plane') {
    // Plane wave propagating along +X from x = -15
    const sourceX = -15;

    if (x < xFront) {
      // Incident region: Incident wave + reflected wave from wall face
      const dist = x - sourceX;
      const phaseInc = k0 * dist - omega * t;
      const incWave = wave.amplitude * Math.cos(phaseInc);

      // Reflected wave propagating backwards (-X)
      const distRef = (xFront - sourceX) + (xFront - x);
      const refAmp = wave.amplitude * Math.abs(rCoeff) * (material.id === 'metal' ? 0.95 : 0.6);
      const phaseRef = k0 * distRef - omega * t + (rCoeff < 0 ? Math.PI : 0);
      const refWave = refAmp * Math.cos(phaseRef);

      amp = incWave + refWave;
    } else if (x <= xBack) {
      // Inside wall slab
      if (geom.insideSolid) {
        if (material.id === 'metal') {
          // Rapid skin depth decay
          const depth = x - xFront;
          const decay = Math.exp(-depth * 4.0);
          amp = wave.amplitude * tCoeff * decay * Math.cos(kMat * (x - sourceX) - omega * t);
        } else {
          // Dielectric phase compression
          const opticalPath = (xFront - sourceX) + (x - xFront) * n;
          const loss = Math.exp(-(x - xFront) * material.lossTangent * 2.0);
          amp = wave.amplitude * tCoeff * loss * Math.cos(k0 * opticalPath - omega * t);
        }
      } else {
        // Inside air slot / cavity ("col d'air")
        const optPath = (x - sourceX);
        const cavityResonance = 1.0 + (geom.insideCavity ? 0.35 * Math.sin(k0 * wall.cavityDepth * 2) : 0);
        amp = wave.amplitude * cavityResonance * Math.cos(k0 * optPath - omega * t);
      }
    } else {
      // Transmitted region (x > xBack)
      // Superposition of:
      // 1. Coherent slab transmission
      const slabTransitPath = (xFront - sourceX) + wall.thickness * n + (x - xBack);
      const slabLoss = material.id === 'metal' ? 0.05 : Math.exp(-wall.thickness * material.lossTangent * 2.0);
      const slabAmp = wave.amplitude * (4 * n / Math.pow(1 + n, 2)) * slabLoss;
      const slabWave = slabAmp * Math.cos(k0 * slabTransitPath - omega * t);

      // 2. Diffracted wavelets from each slot aperture (Huygens-Fresnel secondary radiators)
      let diffractedWave = 0;
      const count = Math.max(1, wall.slotCount);
      const wallSpan = 24;
      const totalPeriod = wallSpan / count;

      for (let i = 0; i < count; i++) {
        const slotZ = -wallSpan / 2 + totalPeriod * (i + 0.5);
        const dx = x - xBack;
        const dz = z - slotZ;
        const rSlot = Math.sqrt(dx * dx + dz * dz);
        const slotAperture = Math.max(0.6, wall.slotSpacing * 0.45);
        // Angular obliquity factor (1 + cos theta) / 2
        const cosTheta = dx / Math.max(0.001, rSlot);
        const obliquity = 0.5 * (1 + cosTheta);
        const slotPhase = k0 * (xBack - sourceX + rSlot) - omega * t;
        const apertureGain = Math.min(1.4, slotAperture * 0.8) / Math.sqrt(Math.max(1.0, rSlot * 0.4));
        diffractedWave += wave.amplitude * 0.7 * obliquity * apertureGain * Math.cos(slotPhase);
      }

      amp = slabWave + diffractedWave;
    }
  } else {
    // Point source radiating from (-12, 0)
    const srcX = -12;
    const srcZ = 0;
    const r = Math.sqrt(Math.pow(x - srcX, 2) + Math.pow(z - srcZ, 2));
    const invR = 1.0 / Math.sqrt(Math.max(1.0, r));

    if (x < xFront) {
      const phase = k0 * r - omega * t;
      // Reflected spherical wavelet from wall
      const rRef = Math.sqrt(Math.pow(2 * xFront - x - srcX, 2) + Math.pow(z - srcZ, 2));
      const phaseRef = k0 * rRef - omega * t;
      amp = wave.amplitude * invR * Math.cos(phase) +
            wave.amplitude * Math.abs(rCoeff) * (1 / Math.sqrt(Math.max(1.0, rRef))) * Math.cos(phaseRef);
    } else if (x <= xBack) {
      if (geom.insideSolid) {
        const decay = material.id === 'metal' ? Math.exp(-(x - xFront) * 3) : 1;
        amp = wave.amplitude * invR * tCoeff * decay * Math.cos(kMat * r - omega * t);
      } else {
        amp = wave.amplitude * invR * Math.cos(k0 * r - omega * t);
      }
    } else {
      // Diffraction past slots
      let diffSum = 0;
      const count = Math.max(1, wall.slotCount);
      const wallSpan = 24;
      const totalPeriod = wallSpan / count;
      for (let i = 0; i < count; i++) {
        const slotZ = -wallSpan / 2 + totalPeriod * (i + 0.5);
        const rToSlot = Math.sqrt(Math.pow(xBack - srcX, 2) + Math.pow(slotZ - srcZ, 2));
        const rFromSlot = Math.sqrt(Math.pow(x - xBack, 2) + Math.pow(z - slotZ, 2));
        const totalDist = rToSlot + rFromSlot;
        diffSum += (wave.amplitude / Math.sqrt(Math.max(1.0, totalDist))) * 0.6 * Math.cos(k0 * totalDist - omega * t);
      }
      amp = diffSum;
    }
  }

  // Calculate local gradient via central differences
  const delta = 0.08;
  const ampX1 = evaluatePoint(x + delta, z, t, wave, wall, material);
  const ampX0 = evaluatePoint(x - delta, z, t, wave, wall, material);
  const ampZ1 = evaluatePoint(x, z + delta, t, wave, wall, material);
  const ampZ0 = evaluatePoint(x, z - delta, t, wave, wall, material);

  const gradX = (ampX1 - ampX0) / (2 * delta);
  const gradZ = (ampZ1 - ampZ0) / (2 * delta);

  // Poynting flux points forward along propagation direction
  const fluxMag = Math.sqrt(gradX * gradX + gradZ * gradZ);
  const fluxX = fluxMag > 0.01 ? -gradX / fluxMag : 1;
  const fluxZ = fluxMag > 0.01 ? -gradZ / fluxMag : 0;

  return {
    amplitude: amp,
    gradientX: gradX,
    gradientZ: gradZ,
    fluxX,
    fluxZ,
    inObstacle: geom.insideSolid,
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
  const xFront = wall.posX - halfThickness;
  const xBack = wall.posX + halfThickness;
  const geom = evaluateObstacleGeometry(x, z, wall);

  if (x < xFront) {
    return wave.amplitude * Math.cos(k0 * (x + 15) - omega * t);
  } else if (x <= xBack) {
    if (geom.insideSolid) {
      return wave.amplitude * 0.8 * Math.cos(k0 * n * (x + 15) - omega * t);
    } else {
      return wave.amplitude * Math.cos(k0 * (x + 15) - omega * t);
    }
  } else {
    return wave.amplitude * 0.7 * Math.cos(k0 * (x + 15) - omega * t);
  }
}
