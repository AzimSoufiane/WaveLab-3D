import React, { useState, useCallback, useRef, useMemo } from 'react';
import { ThreeViewport } from './components/ThreeViewport';
import { ControlPanel } from './components/ControlPanel';
import { Oscilloscope } from './components/Oscilloscope';
import { HeaderBar } from './components/HeaderBar';
import {
  WaveConfig,
  WallGeometry,
  MaterialPreset,
  DualProbeState,
  SimulationState,
} from './types';
import {
  MATERIAL_PRESETS,
  calculateElectromagneticParameters,
} from './physics/waveEngine';

export const App: React.FC = () => {
  // Configuration de l'onde (M115)
  const [wave, setWave] = useState<WaveConfig>({
    frequency: 1.0, // 1.0 GHz
    amplitude: 1.2,
    guidedMode: 'TEM',
    guideA: 0.12, // 12 cm
    guideB: 0.06, // 6 cm
    modeM: 1,
    modeN: 0,
    polarization: 'rectiligne',
    waveSpeedC: 4.0,
  });

  // Géométrie de paroi texturée ("L'Ajusteur Géométrique")
  const [wall, setWall] = useState<WallGeometry>({
    textureProfile: 'triangulaire',
    thickness: 1.8,
    textureDepth: 0.8,
    texturePeriod: 2.0,
    posX: 0,
    height: 4.0,
  });

  // Matériau diélectrique (Défaut : Polystyrène expansé εr = 2.54)
  const [material, setMaterial] = useState<MaterialPreset>(MATERIAL_PRESETS[0]);

  // Système de sondes différentielles virtuelles (Sonde 1 & Sonde 2)
  const [probe, setProbe] = useState<DualProbeState>({
    x1: -6.0,
    z1: 0.0,
    val1: 0.0,
    history1: new Array(80).fill(0),
    pkToPk1: 1.8,
    rms1: 0.72,

    x2: 5.5,
    z2: 0.0,
    val2: 0.0,
    history2: new Array(80).fill(0),
    pkToPk2: 1.2,
    rms2: 0.48,

    activeProbe: 1,
    deltaPhiRad: 0.0,
    deltaPhiDeg: 0.0,
    distanceDeltaX: 11.5,
    transmissionCoeff: 0.65,
    isCutoff: false,
    cutoffFreq: 0.0,
    vPhaseGuided: 3e8,
    lambdaGuided: 0.3,
    attenuationAlpha: 0.0,
  });

  // État global de simulation
  const [simulation, setSimulation] = useState<SimulationState>({
    isPlaying: true,
    speed: 1.0,
    time: 0.0,
    showVectors: true,
    showSurface: true,
    cameraMode: 'perspective',
    showKatexPanel: true,
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Buffers glissants d'historique pour l'oscilloscope bi-trace
  const history1Ref = useRef<number[]>(new Array(80).fill(0));
  const history2Ref = useRef<number[]>(new Array(80).fill(0));
  const peakBuffer1Ref = useRef<number[]>([]);
  const peakBuffer2Ref = useRef<number[]>([]);

  // Paramètres analytiques réactifs
  const params = useMemo(() => {
    return calculateElectromagneticParameters(wave, material);
  }, [wave, material]);

  // Synchronisation temporelle haute fréquence (60 FPS) depuis Three.js
  const handleTimeUpdate = useCallback(
    (_t: number, val1: number, val2: number) => {
      // Voie 1
      history1Ref.current.push(val1);
      if (history1Ref.current.length > 80) history1Ref.current.shift();
      peakBuffer1Ref.current.push(val1);
      if (peakBuffer1Ref.current.length > 40) peakBuffer1Ref.current.shift();

      // Voie 2
      history2Ref.current.push(val2);
      if (history2Ref.current.length > 80) history2Ref.current.shift();
      peakBuffer2Ref.current.push(val2);
      if (peakBuffer2Ref.current.length > 40) peakBuffer2Ref.current.shift();

      const min1 = Math.min(...peakBuffer1Ref.current);
      const max1 = Math.max(...peakBuffer1Ref.current);
      const pkToPk1 = max1 - min1;
      const rms1 = Math.sqrt(
        peakBuffer1Ref.current.reduce((acc, v) => acc + v * v, 0) /
          Math.max(1, peakBuffer1Ref.current.length)
      );

      const min2 = Math.min(...peakBuffer2Ref.current);
      const max2 = Math.max(...peakBuffer2Ref.current);
      const pkToPk2 = max2 - min2;
      const rms2 = Math.sqrt(
        peakBuffer2Ref.current.reduce((acc, v) => acc + v * v, 0) /
          Math.max(1, peakBuffer2Ref.current.length)
      );

      setProbe((prev) => {
        const deltaX = Math.abs(prev.x2 - prev.x1);
        const kEff =
          wave.guidedMode !== 'TEM' && !params.isCutoff ? params.kGuided : params.kMedium;
        const deltaPhiRad = kEff * deltaX;
        const deltaPhiDeg = (deltaPhiRad * 180) / Math.PI;
        const tCoeff = rms1 > 0.01 ? Math.min(1.0, Math.pow(rms2 / rms1, 2)) : 0;

        return {
          ...prev,
          val1,
          val2,
          history1: [...history1Ref.current],
          history2: [...history2Ref.current],
          pkToPk1,
          rms1,
          pkToPk2,
          rms2,
          distanceDeltaX: deltaX,
          deltaPhiRad,
          deltaPhiDeg: deltaPhiDeg % 360,
          transmissionCoeff: tCoeff,
          isCutoff: params.isCutoff,
          cutoffFreq: params.fc / 1e9,
          vPhaseGuided: params.vPhaseGuided,
          lambdaGuided: params.lambdaGuided,
          attenuationAlpha: params.attenuationAlpha,
        };
      });
    },
    [wave.guidedMode, params]
  );

  // Déplacement au pointeur des sondes
  const handleProbeMove = useCallback((probeId: 1 | 2, x: number, z: number) => {
    setProbe((prev) => {
      if (probeId === 1) {
        return { ...prev, x1: x, z1: z, activeProbe: 1 };
      } else {
        return { ...prev, x2: x, z2: z, activeProbe: 2 };
      }
    });
  }, []);

  // Déplacement rapide vers les zones académiques prédéfinies
  const handleProbePreset = useCallback(
    (probeId: 1 | 2, zone: 'incident' | 'inside' | 'transmitted') => {
      const halfE = wall.thickness / 2;
      let targetX = 0;
      if (zone === 'incident') targetX = wall.posX - halfE - 4.5;
      else if (zone === 'inside') targetX = wall.posX;
      else targetX = wall.posX + halfE + 5.0;

      setProbe((prev) => {
        if (probeId === 1) {
          return { ...prev, x1: targetX, z1: 0.0, activeProbe: 1 };
        } else {
          return { ...prev, x2: targetX, z2: 0.0, activeProbe: 2 };
        }
      });
    },
    [wall]
  );

  // Application des scénarios pédagogiques
  const handleApplyPreset = (
    _presetName: string,
    newWall: WallGeometry,
    newMaterial: MaterialPreset,
    newWave: WaveConfig
  ) => {
    setWall(newWall);
    setMaterial(newMaterial);
    setWave(newWave);
    // Repositionner Sonde 1 en amont et Sonde 2 en aval
    setProbe((prev) => ({
      ...prev,
      x1: newWall.posX - newWall.thickness / 2 - 5.0,
      z1: 0.0,
      x2: newWall.posX + newWall.thickness / 2 + 5.0,
      z2: 0.0,
    }));
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#070b14] text-slate-100 overflow-hidden font-sans">
      {/* Barre d'entête ENSA & Scénarios */}
      <HeaderBar
        simulation={simulation}
        onSimulationChange={setSimulation}
        onApplyPreset={handleApplyPreset}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Corps Principal : Console de contrôle + Scène WebGL 3D */}
      <div className="flex-1 flex flex-row relative overflow-hidden">
        {/* Panneau latéral de contrôle gauche */}
        <div
          className={`transition-all duration-300 ease-in-out z-20 h-full ${
            sidebarOpen ? 'w-full sm:w-85 md:w-96 flex-shrink-0' : 'w-0 overflow-hidden'
          } ${sidebarOpen ? 'absolute sm:relative' : ''}`}
        >
          <ControlPanel
            wall={wall}
            onWallChange={setWall}
            material={material}
            onMaterialChange={setMaterial}
            wave={wave}
            onWaveChange={setWave}
            probe={probe}
            simulation={simulation}
            onSimulationChange={setSimulation}
          />
        </div>

        {/* Scène 3D Interactive WebGL */}
        <div className="flex-1 h-full relative">
          <ThreeViewport
            wave={wave}
            wall={wall}
            material={material}
            probe={probe}
            onProbeMove={handleProbeMove}
            simulation={simulation}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
      </div>

      {/* Oscilloscope Bi-Courbe & Mesure de Déphasage Direct Δφ */}
      <Oscilloscope
        probe={probe}
        wave={wave}
        wall={wall}
        onProbePreset={handleProbePreset}
      />
    </div>
  );
};

export default App;
