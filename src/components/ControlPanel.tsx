import React from 'react';
import { MaterialPreset, WallGeometry, WaveConfig, SimulationState } from '../types';
import { MATERIAL_PRESETS } from '../physics/waveEngine';
import { Sliders, Box, Layers, Activity, Eye, Compass } from 'lucide-react';

interface ControlPanelProps {
  wall: WallGeometry;
  onWallChange: (wall: WallGeometry) => void;
  material: MaterialPreset;
  onMaterialChange: (mat: MaterialPreset) => void;
  wave: WaveConfig;
  onWaveChange: (wave: WaveConfig) => void;
  simulation: SimulationState;
  onSimulationChange: (sim: SimulationState) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  wall,
  onWallChange,
  material,
  onMaterialChange,
  wave,
  onWaveChange,
  simulation,
  onSimulationChange,
}) => {
  // Computed physics values
  const n = Math.sqrt(Math.max(1, material.epsilonR));
  const vPhase = (wave.waveSpeedC / n).toFixed(2);
  const lambda0 = (wave.waveSpeedC / wave.frequency).toFixed(2);
  const lambdaMat = (parseFloat(lambda0) / n).toFixed(2);
  const rFresnel = ((1 - n) / (1 + n)).toFixed(3);
  const tFresnel = ((2 * 1) / (1 + n)).toFixed(3);

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1322] border-r border-slate-800/80 text-slate-200 overflow-y-auto p-4 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h2 className="text-sm font-bold tracking-wider uppercase text-slate-100">Physics Controls</h2>
      </div>

      {/* SECTION 1: Wall Geometry ("The Adjuster") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Sliders className="w-3.5 h-3.5" />
            Wall Geometry ("The Adjuster")
          </span>
          <span className="font-mono text-slate-400">x={wall.posX.toFixed(1)}m</span>
        </div>

        {/* Thickness e */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Thickness (e)</span>
            <span className="font-mono text-cyan-300">{wall.thickness.toFixed(2)} m</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="4.0"
            step="0.1"
            value={wall.thickness}
            onChange={(e) => onWallChange({ ...wall, thickness: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Slot Spacing t */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Slot Spacing (t)</span>
            <span className="font-mono text-cyan-300">{wall.slotSpacing.toFixed(2)} m</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="4.0"
            step="0.1"
            value={wall.slotSpacing}
            onChange={(e) => onWallChange({ ...wall, slotSpacing: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Air Gap / Internal Channel Depth ("col d'air") */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Air Cavity Depth ("col d'air")</span>
            <span className="font-mono text-cyan-300">{wall.cavityDepth.toFixed(2)} m</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.5"
            step="0.1"
            value={wall.cavityDepth}
            onChange={(e) => onWallChange({ ...wall, cavityDepth: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Slot / Cavity Count */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Obstacle Cavity Count</span>
            <span className="font-mono text-cyan-300">{wall.slotCount}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[1, 2, 3, 4, 5].map((cnt) => (
              <button
                key={cnt}
                onClick={() => onWallChange({ ...wall, slotCount: cnt })}
                className={`py-1 text-xs font-mono rounded ${
                  wall.slotCount === cnt
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: Material & Texture Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-amber-400">
            <Box className="w-3.5 h-3.5" />
            Material & Dielectric (εr)
          </span>
          <span className="font-mono text-amber-300">εr = {material.epsilonR.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          {MATERIAL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onMaterialChange(preset)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between ${
                material.id === preset.id
                  ? 'border-amber-500/80 bg-amber-500/10 text-slate-100 shadow-sm shadow-amber-500/10'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div>
                <div className="font-medium flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: preset.color }}
                  ></span>
                  {preset.name}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-1">{preset.description}</div>
              </div>
              <span className="font-mono text-[11px] font-bold text-amber-300/90 ml-2">
                εr={preset.epsilonR}
              </span>
            </button>
          ))}
        </div>

        {/* Real-time Material Physics Metrics Card */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-300">
          <div className="flex justify-between text-slate-400">
            <span>Refractive Index n:</span>
            <span className="text-cyan-300 font-bold">{n.toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Phase Velocity vp:</span>
            <span className="text-cyan-300">{vPhase} m/s</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Wavelength in Wall:</span>
            <span className="text-cyan-300">{lambdaMat} m (air: {lambda0}m)</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Fresnel Reflect R:</span>
            <span className="text-amber-300">{rFresnel}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Fresnel Transmit T:</span>
            <span className="text-emerald-400">{tFresnel}</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Wave Source Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-indigo-400">
            <Compass className="w-3.5 h-3.5" />
            Wave Source
          </span>
          <span className="font-mono text-indigo-300">{wave.sourceType.toUpperCase()}</span>
        </div>

        {/* Source Type Selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onWaveChange({ ...wave, sourceType: 'plane' })}
            className={`py-1.5 text-xs font-medium rounded-lg border ${
              wave.sourceType === 'plane'
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Plane Wave (Incident)
          </button>
          <button
            onClick={() => onWaveChange({ ...wave, sourceType: 'point' })}
            className={`py-1.5 text-xs font-medium rounded-lg border ${
              wave.sourceType === 'point'
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Point Source (Dipole)
          </button>
        </div>

        {/* Frequency Slider */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Frequency (f)</span>
            <span className="font-mono text-cyan-300">{wave.frequency.toFixed(2)} GHz</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="2.5"
            step="0.05"
            value={wave.frequency}
            onChange={(e) => onWaveChange({ ...wave, frequency: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
        </div>

        {/* Amplitude Slider */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Amplitude (E₀)</span>
            <span className="font-mono text-cyan-300">{wave.amplitude.toFixed(2)} V/m</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={wave.amplitude}
            onChange={(e) => onWaveChange({ ...wave, amplitude: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
        </div>
      </div>

      {/* SECTION 4: View Layers */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          Visualization Layers
        </span>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSimulationChange({ ...simulation, showSurface: !simulation.showSurface })}
            className={`py-1.5 px-2 text-xs rounded-lg border flex items-center justify-center gap-1.5 ${
              simulation.showSurface
                ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
          >
            <Eye className="w-3 h-3" />
            3D Mesh Surface
          </button>
          <button
            onClick={() => onSimulationChange({ ...simulation, showVectors: !simulation.showVectors })}
            className={`py-1.5 px-2 text-xs rounded-lg border flex items-center justify-center gap-1.5 ${
              simulation.showVectors
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
          >
            <Compass className="w-3 h-3" />
            Poynting Vectors
          </button>
        </div>
      </div>
    </div>
  );
};
