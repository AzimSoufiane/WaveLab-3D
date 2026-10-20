import React from 'react';
import { SimulationState, WallGeometry, MaterialPreset, WaveConfig } from '../types';
import { MATERIAL_PRESETS } from '../physics/waveEngine';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Camera,
  Layers,
  Sparkles,
  Waves,
} from 'lucide-react';

interface HeaderBarProps {
  simulation: SimulationState;
  onSimulationChange: (sim: SimulationState) => void;
  onApplyPreset: (
    presetName: string,
    wall: WallGeometry,
    material: MaterialPreset,
    wave: WaveConfig
  ) => void;
  onToggleSidebar: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  simulation,
  onSimulationChange,
  onApplyPreset,
  onToggleSidebar,
}) => {
  const speeds = [0.25, 0.5, 1.0, 1.5, 2.0];

  const handlePresetSelect = (presetKey: string) => {
    switch (presetKey) {
      case 'slotted':
        onApplyPreset(
          'Slotted Wall with Cavities',
          { thickness: 1.8, slotSpacing: 1.5, cavityDepth: 1.4, slotCount: 3, posX: 0, height: 4 },
          MATERIAL_PRESETS[0], // Polystyrene
          { frequency: 0.9, amplitude: 1.2, sourceType: 'plane', waveSpeedC: 4.0 }
        );
        break;
      case 'concrete':
        onApplyPreset(
          'Concrete Barrier (High Reflection)',
          { thickness: 2.5, slotSpacing: 2.0, cavityDepth: 0.5, slotCount: 2, posX: 0, height: 4 },
          MATERIAL_PRESETS[1], // Concrete
          { frequency: 1.2, amplitude: 1.4, sourceType: 'plane', waveSpeedC: 4.0 }
        );
        break;
      case 'doubleslit':
        onApplyPreset(
          'Double-Slit Diffraction',
          { thickness: 0.8, slotSpacing: 1.2, cavityDepth: 0.8, slotCount: 2, posX: 0, height: 4 },
          MATERIAL_PRESETS[3], // Conductor / Metal
          { frequency: 1.4, amplitude: 1.5, sourceType: 'plane', waveSpeedC: 4.0 }
        );
        break;
      case 'pointsource':
        onApplyPreset(
          'Point Source Dipole Radiation',
          { thickness: 1.5, slotSpacing: 1.8, cavityDepth: 1.2, slotCount: 3, posX: 0, height: 4 },
          MATERIAL_PRESETS[0],
          { frequency: 0.8, amplitude: 1.3, sourceType: 'point', waveSpeedC: 4.0 }
        );
        break;
    }
  };

  return (
    <header className="w-full bg-[#0b101c] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          <Layers className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Waves className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              WaveLab <span className="text-cyan-400 font-mono text-xs">3D</span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Electromagnetic & Obstacle Simulation
            </p>
          </div>
        </div>
      </div>

      {/* Preset Scenarios Dropdown */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-slate-400 font-medium">Scenario:</span>
        <select
          onChange={(e) => handlePresetSelect(e.target.value)}
          defaultValue="slotted"
          className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
        >
          <option value="slotted" className="bg-slate-900">Slotted Wall with Air Cavities (Default)</option>
          <option value="concrete" className="bg-slate-900">Concrete Slab (High Reflection)</option>
          <option value="doubleslit" className="bg-slate-900">Double-Slit Diffraction Barrier</option>
          <option value="pointsource" className="bg-slate-900">Point Source Dipole Radiation</option>
        </select>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Play/Pause */}
        <button
          onClick={() => onSimulationChange({ ...simulation, isPlaying: !simulation.isPlaying })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            simulation.isPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
          }`}
        >
          {simulation.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{simulation.isPlaying ? 'Pause' : 'Simulate'}</span>
        </button>

        {/* Step Forward */}
        <button
          onClick={() => {
            onSimulationChange({ ...simulation, isPlaying: false, time: simulation.time + 0.1 });
          }}
          title="Single Step (+0.1s)"
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <StepForward className="w-4 h-4" />
        </button>

        {/* Reset Phase */}
        <button
          onClick={() => onSimulationChange({ ...simulation, time: 0 })}
          title="Reset Simulation Time"
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Speed Selector */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-800 font-mono text-[11px]">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSimulationChange({ ...simulation, speed: s })}
              className={`px-1.5 py-0.5 rounded ${
                simulation.speed === s
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Camera Mode Toggle */}
        <button
          onClick={() =>
            onSimulationChange({
              ...simulation,
              cameraMode: simulation.cameraMode === 'perspective' ? 'top' : 'perspective',
            })
          }
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
            simulation.cameraMode === 'top'
              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title="Toggle 3D Perspective / Top-Down View"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{simulation.cameraMode === 'top' ? 'Top View' : '3D View'}</span>
        </button>
      </div>
    </header>
  );
};
