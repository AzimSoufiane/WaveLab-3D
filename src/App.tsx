import React, { useState, useCallback, useRef } from 'react';
import { ThreeViewport } from './components/ThreeViewport';
import { ControlPanel } from './components/ControlPanel';
import { Oscilloscope } from './components/Oscilloscope';
import { HeaderBar } from './components/HeaderBar';
import {
  WaveConfig,
  WallGeometry,
  MaterialPreset,
  ProbeData,
  SimulationState,
} from './types';
import { MATERIAL_PRESETS } from './physics/waveEngine';

export const App: React.FC = () => {
  // Wave source configuration
  const [wave, setWave] = useState<WaveConfig>({
    frequency: 0.9,
    amplitude: 1.2,
    sourceType: 'plane',
    waveSpeedC: 4.0,
  });

  // Parametric wall geometry ("The Adjuster")
  const [wall, setWall] = useState<WallGeometry>({
    thickness: 1.8,
    slotSpacing: 1.5,
    cavityDepth: 1.4,
    slotCount: 3,
    posX: 0,
    height: 4.0,
  });

  // Material & texture selection (Default: Polystyrene εr = 2.54)
  const [material, setMaterial] = useState<MaterialPreset>(MATERIAL_PRESETS[0]);

  // Virtual 3D probe state
  const [probe, setProbe] = useState<ProbeData>({
    x: 5.0,
    z: 0.0,
    currentValue: 0.0,
    history: new Array(80).fill(0),
    peakToPeak: 1.8,
    rms: 0.72,
    transmissionCoeff: 0.68,
  });

  // Simulation controls state
  const [simulation, setSimulation] = useState<SimulationState>({
    isPlaying: true,
    speed: 1.0,
    time: 0.0,
    showVectors: true,
    showSurface: true,
    cameraMode: 'perspective',
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Probe history rolling buffer
  const historyRef = useRef<number[]>(new Array(80).fill(0));
  const peakBufferRef = useRef<number[]>([]);

  const handleTimeUpdate = useCallback((_t: number, val: number) => {
    historyRef.current.push(val);
    if (historyRef.current.length > 80) {
      historyRef.current.shift();
    }

    peakBufferRef.current.push(val);
    if (peakBufferRef.current.length > 40) {
      peakBufferRef.current.shift();
    }

    const min = Math.min(...peakBufferRef.current);
    const max = Math.max(...peakBufferRef.current);
    const pkToPk = max - min;
    const rms = Math.sqrt(
      peakBufferRef.current.reduce((acc, v) => acc + v * v, 0) / peakBufferRef.current.length
    );

    setProbe((prev) => ({
      ...prev,
      currentValue: val,
      history: [...historyRef.current],
      peakToPeak: pkToPk,
      rms: rms,
    }));
  }, []);

  const handleProbeMove = useCallback((x: number, z: number) => {
    setProbe((prev) => ({ ...prev, x, z }));
  }, []);

  const handleProbePreset = useCallback(
    (zone: 'incident' | 'inside' | 'transmitted') => {
      const halfE = wall.thickness / 2;
      let targetX = 0;
      if (zone === 'incident') targetX = wall.posX - halfE - 4.0;
      else if (zone === 'inside') targetX = wall.posX;
      else targetX = wall.posX + halfE + 4.5;
      setProbe((prev) => ({ ...prev, x: targetX, z: 0.0 }));
    },
    [wall]
  );

  const handleApplyPreset = (
    _presetName: string,
    newWall: WallGeometry,
    newMaterial: MaterialPreset,
    newWave: WaveConfig
  ) => {
    setWall(newWall);
    setMaterial(newMaterial);
    setWave(newWave);
    // Reset probe to transmitted zone
    setProbe((prev) => ({
      ...prev,
      x: newWall.posX + newWall.thickness / 2 + 4.0,
      z: 0.0,
    }));
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#090D16] text-slate-100 overflow-hidden font-sans">
      {/* Top Header & Presets */}
      <HeaderBar
        simulation={simulation}
        onSimulationChange={setSimulation}
        onApplyPreset={handleApplyPreset}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Body: Sidebar + 3D Viewport */}
      <div className="flex-1 flex flex-row relative overflow-hidden">
        {/* Left Sidebar Control Panel */}
        <div
          className={`transition-all duration-300 ease-in-out z-20 h-full ${
            sidebarOpen ? 'w-full sm:w-80 md:w-96 flex-shrink-0' : 'w-0 overflow-hidden'
          } ${
            sidebarOpen ? 'absolute sm:relative' : ''
          }`}
        >
          <ControlPanel
            wall={wall}
            onWallChange={setWall}
            material={material}
            onMaterialChange={setMaterial}
            wave={wave}
            onWaveChange={setWave}
            simulation={simulation}
            onSimulationChange={setSimulation}
          />
        </div>

        {/* Center / Right 3D Viewport */}
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

      {/* Bottom Live Oscilloscope Strip */}
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
