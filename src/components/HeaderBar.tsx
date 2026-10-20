import React from 'react';
import {
  SimulationState,
  WallGeometry,
  MaterialPreset,
  WaveConfig,
} from '../types';
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
      case 'tem_free':
        onApplyPreset(
          'Onde Libre dans le Vide (TEM)',
          {
            textureProfile: 'triangulaire',
            thickness: 1.5,
            textureDepth: 0.8,
            texturePeriod: 2.0,
            posX: 0,
            height: 4,
          },
          MATERIAL_PRESETS[2], // Vide / Air (epsR = 1)
          {
            frequency: 1.0,
            amplitude: 1.2,
            guidedMode: 'TEM',
            guideA: 0.12,
            guideB: 0.06,
            modeM: 1,
            modeN: 0,
            polarization: 'rectiligne',
            waveSpeedC: 4.0,
          }
        );
        break;

      case 'te10_propagating':
        onApplyPreset(
          'Guide d\'Onde Rectangulaire TE₁₀ (Propagatif, f > fc)',
          {
            textureProfile: 'rectangulaire',
            thickness: 2.2,
            textureDepth: 0.8,
            texturePeriod: 2.0,
            posX: 0,
            height: 4,
          },
          MATERIAL_PRESETS[0], // Polystyrène
          {
            frequency: 1.8,
            amplitude: 1.4,
            guidedMode: 'TE',
            guideA: 0.12,
            guideB: 0.06,
            modeM: 1,
            modeN: 0,
            polarization: 'rectiligne',
            waveSpeedC: 4.0,
          }
        );
        break;

      case 'cutoff_evanescent':
        onApplyPreset(
          'Guide sous Fréquence de Coupure (Onde Évanescente, f < fc)',
          {
            textureProfile: 'rectangulaire',
            thickness: 2.5,
            textureDepth: 0.8,
            texturePeriod: 2.0,
            posX: 0,
            height: 4,
          },
          MATERIAL_PRESETS[0],
          {
            frequency: 0.45, // Inférieure à fc
            amplitude: 1.5,
            guidedMode: 'TE',
            guideA: 0.08,
            guideB: 0.04,
            modeM: 1,
            modeN: 0,
            polarization: 'rectiligne',
            waveSpeedC: 4.0,
          }
        );
        break;

      case 'dielectric_barrier':
        onApplyPreset(
          'Barrière Diélectrique Réfléchissante (Polystyrène εr=2.54)',
          {
            textureProfile: 'circulaire',
            thickness: 2.0,
            textureDepth: 0.6,
            texturePeriod: 2.5,
            posX: 0,
            height: 4,
          },
          MATERIAL_PRESETS[0],
          {
            frequency: 1.0,
            amplitude: 1.3,
            guidedMode: 'TEM',
            guideA: 0.12,
            guideB: 0.06,
            modeM: 1,
            modeN: 0,
            polarization: 'rectiligne',
            waveSpeedC: 4.0,
          }
        );
        break;

      case 'bragg_corrugated':
        onApplyPreset(
          'Réseau Corrugué de Bragg (Diffraction & Filtrage)',
          {
            textureProfile: 'sinusoidale',
            thickness: 2.2,
            textureDepth: 1.2,
            texturePeriod: 1.5,
            posX: 0,
            height: 4,
          },
          MATERIAL_PRESETS[1], // Béton
          {
            frequency: 1.35,
            amplitude: 1.3,
            guidedMode: 'TEM',
            guideA: 0.12,
            guideB: 0.06,
            modeM: 1,
            modeN: 0,
            polarization: 'rectiligne',
            waveSpeedC: 4.0,
          }
        );
        break;
    }
  };

  return (
    <header className="w-full bg-[#070b14] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs select-none">
      {/* Brand & Titre ENSA */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          title="Ouvrir le panneau de contrôle"
        >
          <Layers className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Waves className="w-4.5 h-4.5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-100 tracking-tight">
                WaveLab <span className="text-cyan-400 font-mono text-xs">3D</span>
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                ENSA M115
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Propagation Libre & Guidée des Ondes Électromagnétiques
            </p>
          </div>
        </div>
      </div>

      {/* Préréglages de scénarios pédagogiques */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-slate-400 font-medium text-[11px]">Scénario Pédagogique :</span>
        <select
          onChange={(e) => handlePresetSelect(e.target.value)}
          defaultValue="dielectric_barrier"
          className="bg-transparent text-slate-200 font-medium text-[11px] focus:outline-none cursor-pointer"
        >
          <option value="tem_free" className="bg-slate-900">
            1. Onde Libre dans le Vide (TEM, n=1)
          </option>
          <option value="dielectric_barrier" className="bg-slate-900">
            2. Barrière Diélectrique Réfléchissante (Polystyrène εr=2.54)
          </option>
          <option value="te10_propagating" className="bg-slate-900">
            3. Guide d'Onde TE₁₀ (Propagatif, f &gt; fc)
          </option>
          <option value="cutoff_evanescent" className="bg-slate-900">
            4. Guide sous Fréquence de Coupure (Onde Évanescente, f &lt; fc)
          </option>
          <option value="bragg_corrugated" className="bg-slate-900">
            5. Réseau Corrugué de Bragg (Diffraction & Filtrage)
          </option>
        </select>
      </div>

      {/* Commandes de Simulation Temporelle */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Lecture / Pause */}
        <button
          onClick={() => onSimulationChange({ ...simulation, isPlaying: !simulation.isPlaying })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            simulation.isPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
          }`}
        >
          {simulation.isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{simulation.isPlaying ? 'Pause' : 'Simuler'}</span>
        </button>

        {/* Pas à pas */}
        <button
          onClick={() => {
            onSimulationChange({ ...simulation, isPlaying: false, time: simulation.time + 0.1 });
          }}
          title="Avance pas à pas (+0.1s)"
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <StepForward className="w-4 h-4" />
        </button>

        {/* Remise à zéro */}
        <button
          onClick={() => onSimulationChange({ ...simulation, time: 0 })}
          title="Réinitialiser le temps de simulation"
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Sélecteur de vitesse */}
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

        {/* Bascule de caméra 3D / Dessus */}
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
          title="Basculer vue 3D perspective / Vue cartographique du dessus"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {simulation.cameraMode === 'top' ? 'Vue Dessus' : 'Vue 3D'}
          </span>
        </button>
      </div>
    </header>
  );
};
