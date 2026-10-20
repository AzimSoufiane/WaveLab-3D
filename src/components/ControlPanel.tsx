import React from 'react';
import {
  MaterialPreset,
  WallGeometry,
  WaveConfig,
  SimulationState,
  SurfaceTextureProfile,
  DualProbeState,
} from '../types';
import { MATERIAL_PRESETS, calculateCutoffFrequency, C_LIGHT_VACUUM } from '../physics/waveEngine';
import { KatexEquations } from './KatexEquations';
import {
  Sliders,
  Box,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Sparkles,
} from 'lucide-react';

interface ControlPanelProps {
  wall: WallGeometry;
  onWallChange: (wall: WallGeometry) => void;
  material: MaterialPreset;
  onMaterialChange: (mat: MaterialPreset) => void;
  wave: WaveConfig;
  onWaveChange: (wave: WaveConfig) => void;
  probe: DualProbeState;
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
  probe,
  simulation,
  onSimulationChange,
}) => {
  // Calcul de la fréquence de coupure fc pour le mode guidé sélectionné
  const fc = calculateCutoffFrequency(
    wave.guideA,
    wave.guideB,
    wave.modeM,
    wave.modeN,
    material.epsilonR,
    C_LIGHT_VACUUM
  );
  const fcGHz = fc / 1e9;
  const isCutoff = wave.guidedMode !== 'TEM' && wave.frequency < fcGHz;

  const textureProfiles: { id: SurfaceTextureProfile; name: string; description: string }[] = [
    {
      id: 'triangulaire',
      name: 'Triangulaire / Dents de scie',
      description: 'Coins dièdres anéchoïques & rainures en V pour diffusion angulaire',
    },
    {
      id: 'fentes_cavites',
      name: 'Fentes & Cavités d\'air (« Col d\'air »)',
      description: 'Canaux résonnants ouverts dans l\'épaisseur de paroi pour pénétration d\'onde',
    },
    {
      id: 'rectangulaire',
      name: 'Rectangulaire / Créneaux',
      description: 'Encoches périodiques à fronts raides et guides d\'ondes à fentes',
    },
    {
      id: 'circulaire',
      name: 'Circulaire / Demi-cylindrique',
      description: 'Bossages convexes lisses provoquant une diffraction cylindrique',
    },
    {
      id: 'sinusoidale',
      name: 'Sinusoïdale (Modulation continue)',
      description: 'Réseau de Bragg harmonique continu pour filtrage sélectif',
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1322] border-r border-slate-800/80 text-slate-200 overflow-y-auto p-4 space-y-6 select-none">
      {/* Titre du module ENSA */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-100">
              Paramètres d'Électromagnétisme
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">Module ENSA M115 · Propagation Libre & Guidée</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Modes d'Onde & Polarisation (M115) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Radio className="w-3.5 h-3.5" />
            Mode de Propagation & Guidage
          </span>
          <span className="font-mono text-cyan-300 text-[11px]">{wave.guidedMode}</span>
        </div>

        {/* Sélecteur de mode principal : TEM, TE, TM */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {(['TEM', 'TE', 'TM'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onWaveChange({ ...wave, guidedMode: m })}
              className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                wave.guidedMode === m
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {m}
              <span className="text-[9px] block opacity-80">
                {m === 'TEM' ? 'Onde Libre' : m === 'TE' ? 'Ez = 0' : 'Hz = 0'}
              </span>
            </button>
          ))}
        </div>

        {/* Sous-panneau spécifique pour modes guidés TE & TM */}
        {wave.guidedMode !== 'TEM' && (
          <div className="p-3 bg-slate-900/80 rounded-lg border border-cyan-800/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300">
                Guide Rectangulaire ({wave.guidedMode}_{wave.modeM}{wave.modeN})
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isCutoff
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse font-bold'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isCutoff ? 'Onde Évanescente (f < fc)' : 'Propagatif (f > fc)'}
              </span>
            </div>

            {/* Indices de mode (m, n) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px]">Indice modal m:</span>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3].map((val) => (
                    <button
                      key={val}
                      onClick={() => onWaveChange({ ...wave, modeM: val })}
                      className={`flex-1 py-1 rounded text-xs font-mono ${
                        wave.modeM === val
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      m={val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px]">Indice modal n:</span>
                <div className="flex gap-1 mt-1">
                  {[0, 1, 2].map((val) => (
                    <button
                      key={val}
                      onClick={() => onWaveChange({ ...wave, modeN: val })}
                      className={`flex-1 py-1 rounded text-xs font-mono ${
                        wave.modeN === val
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      n={val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dimension a (largeur) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Largeur du guide (a)</span>
                <span className="font-mono text-cyan-300">{(wave.guideA * 100).toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.25"
                step="0.005"
                value={wave.guideA}
                onChange={(e) => onWaveChange({ ...wave, guideA: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Dimension b (hauteur) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Hauteur du guide (b)</span>
                <span className="font-mono text-cyan-300">{(wave.guideB * 100).toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.15"
                step="0.005"
                value={wave.guideB}
                onChange={(e) => onWaveChange({ ...wave, guideB: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Fréquence de coupure calculée en direct */}
            <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] flex justify-between items-center">
              <span className="text-slate-400">Fréquence de Coupure fc:</span>
              <span className={`font-bold ${isCutoff ? 'text-rose-400' : 'text-emerald-400'}`}>
                {fcGHz.toFixed(3)} GHz
              </span>
            </div>
          </div>
        )}

        {/* Polarisation pour mode TEM */}
        {wave.guidedMode === 'TEM' && (
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
            <span className="text-slate-400 text-xs">État de Polarisation :</span>
            <div className="space-y-1">
              {[
                { id: 'rectiligne', label: 'OPPH Rectiligne', math: 'E = E0 cos(ωt - kx) ey' },
                { id: 'circulaire', label: 'OPPH Circulaire', math: 'Ey + j Ez (déphasage π/2)' },
                { id: 'source_surfacique', label: 'Source Surfacique de Courant', math: 'js = J0 exp(jωt) ex' },
              ].map((pol) => (
                <button
                  key={pol.id}
                  onClick={() =>
                    onWaveChange({ ...wave, polarization: pol.id as any })
                  }
                  className={`w-full text-left p-2 rounded text-xs transition-all ${
                    wave.polarization === pol.id
                      ? 'bg-cyan-500/20 border border-cyan-500/80 text-cyan-200 font-medium'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold">{pol.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{pol.math}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fréquence f */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Fréquence opérationnelle (f)</span>
            <span className="font-mono text-cyan-300">{wave.frequency.toFixed(2)} GHz</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.05"
            value={wave.frequency}
            onChange={(e) => onWaveChange({ ...wave, frequency: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Amplitude E0 */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Amplitude du Champ (E0)</span>
            <span className="font-mono text-cyan-300">{wave.amplitude.toFixed(2)} V/m</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.5"
            step="0.1"
            value={wave.amplitude}
            onChange={(e) => onWaveChange({ ...wave, amplitude: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* SECTION 2: Profil de Texture de Surface ("L'Ajusteur Géométrique") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-indigo-400">
            <Sliders className="w-3.5 h-3.5" />
            Profil de Texture de Surface
          </span>
          <span className="font-mono text-slate-400">x={wall.posX.toFixed(1)}m</span>
        </div>

        {/* Menu Déroulant des Profils de Texture */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400 font-medium">Géométrie de la frontière :</label>
          <select
            value={wall.textureProfile}
            onChange={(e) =>
              onWallChange({ ...wall, textureProfile: e.target.value as SurfaceTextureProfile })
            }
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {textureProfiles.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 italic">
            {textureProfiles.find((p) => p.id === wall.textureProfile)?.description}
          </p>
        </div>

        {/* Épaisseur de paroi e */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Épaisseur de paroi (e)</span>
            <span className="font-mono text-cyan-300">{wall.thickness.toFixed(2)} m</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.1"
            value={wall.thickness}
            onChange={(e) => onWallChange({ ...wall, thickness: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Profondeur de texture h */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Profondeur de texture (h)</span>
            <span className="font-mono text-cyan-300">{wall.textureDepth.toFixed(2)} m</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={wall.textureDepth}
            onChange={(e) => onWallChange({ ...wall, textureDepth: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Période spatiale Λ */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Période spatiale (Λ)</span>
            <span className="font-mono text-cyan-300">{wall.texturePeriod.toFixed(2)} m</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.1"
            value={wall.texturePeriod}
            onChange={(e) => onWallChange({ ...wall, texturePeriod: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* SECTION 3: Matériau & Permittivité Diélectrique (εr) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5 text-amber-400">
            <Box className="w-3.5 h-3.5" />
            Matériau & Diélectrique (εr)
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
              <span className="font-mono text-[11px] font-bold text-amber-300/90 ml-2 shrink-0">
                εr={preset.epsilonR}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4: Panneau d'Équations Dynamiques KaTeX */}
      <KatexEquations wave={wave} material={material} probe={probe} />
    </div>
  );
};
