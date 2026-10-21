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
import { ParamTooltip } from './ParamTooltip';
import {
  Sliders,
  Box,
  Radio,
  Crosshair,
  Maximize2,
  Waves,
} from 'lucide-react';

interface ControlPanelProps {
  wall: WallGeometry;
  onWallChange: (wall: WallGeometry) => void;
  material: MaterialPreset;
  onMaterialChange: (mat: MaterialPreset) => void;
  wave: WaveConfig;
  onWaveChange: (wave: WaveConfig) => void;
  probe: DualProbeState;
  onProbeChange: (probe: DualProbeState) => void;
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
  onProbeChange,
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
    <div className="w-full h-full flex flex-col bg-[#0c1220] border-r border-slate-700/80 text-slate-100 overflow-y-auto p-4 space-y-6 select-none">
      {/* Titre du module ENSA */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold tracking-wider uppercase text-slate-100">
              Paramètres d'Électromagnétisme
            </h2>
            <p className="text-[11px] text-slate-300 font-mono">Module ENSA M115 · Laboratoire Virtuel</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Modes d'Onde & Polarisation (M115) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
          <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <Radio className="w-4 h-4 text-cyan-400" />
            Mode de Propagation & Guidage
            <ParamTooltip
              title="Modes de Propagation (M115)"
              explanation="TEM : champ électrique et magnétique tous deux transverses à la direction de propagation (onde libre sans coupure). TE : composante Ez = 0. TM : composante Hz = 0 (onde guidée avec fréquence de coupure fc)."
              formula="f_c = \frac{c}{2\sqrt{\epsilon_r}}\sqrt{(m/a)^2 + (n/b)^2}"
            />
          </span>
          <span className="font-mono text-cyan-300 font-bold text-xs bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            {wave.guidedMode}
          </span>
        </div>

        {/* Sélecteur de mode principal : TEM, TE, TM */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-700">
          {(['TEM', 'TE', 'TM'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onWaveChange({ ...wave, guidedMode: m })}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                wave.guidedMode === m
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {m}
              <span className="text-[10px] block opacity-90 font-mono">
                {m === 'TEM' ? 'Onde Libre' : m === 'TE' ? 'Ez = 0' : 'Hz = 0'}
              </span>
            </button>
          ))}
        </div>

        {/* Sous-panneau spécifique pour modes guidés TE & TM */}
        {wave.guidedMode !== 'TEM' && (
          <div className="p-3 bg-slate-900/90 rounded-lg border border-cyan-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-200">
                Guide Rectangulaire ({wave.guidedMode}_{wave.modeM}{wave.modeN})
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border font-bold ${
                  isCutoff
                    ? 'bg-rose-500/25 text-rose-200 border-rose-500 animate-pulse'
                    : 'bg-emerald-500/25 text-emerald-200 border-emerald-500'
                }`}
              >
                {isCutoff ? 'Onde Évanescente (f < fc)' : 'Propagatif (f > fc)'}
              </span>
            </div>

            {/* Indices de mode (m, n) */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-slate-100 text-xs font-semibold flex items-center">
                  Indice modal m:
                  <ParamTooltip
                    title="Indice de mode m"
                    explanation="Nombre de demi-ondes stationnaires du champ le long de la dimension a du guide rectangulaire. Pour le mode dominant TE10, m = 1."
                    formula="k_x = \frac{m\pi}{a}"
                  />
                </span>
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3].map((val) => (
                    <button
                      key={val}
                      onClick={() => onWaveChange({ ...wave, modeM: val })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                        wave.modeM === val
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                          : 'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      m={val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-100 text-xs font-semibold flex items-center">
                  Indice modal n:
                  <ParamTooltip
                    title="Indice de mode n"
                    explanation="Nombre de demi-ondes stationnaires du champ le long de la hauteur b du guide rectangulaire. Pour les modes TE10, n = 0."
                    formula="k_y = \frac{n\pi}{b}"
                  />
                </span>
                <div className="flex gap-1 mt-1.5">
                  {[0, 1, 2].map((val) => (
                    <button
                      key={val}
                      onClick={() => onWaveChange({ ...wave, modeN: val })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                        wave.modeN === val
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                          : 'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-700'
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
                <span className="text-slate-100 font-semibold flex items-center">
                  Largeur du guide (a)
                  <ParamTooltip
                    title="Dimension Transversale (a)"
                    explanation="La largeur du guide d'ondes rectangulaire conditionne la demi-onde stationnaire selon X/Z et détermine la fréquence de coupure du mode dominant TE10."
                    formula="f_{c,10} = \frac{c}{2a\sqrt{\epsilon_r}}"
                  />
                </span>
                <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                  {(wave.guideA * 100).toFixed(1)} cm
                </span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.25"
                step="0.005"
                value={wave.guideA}
                onChange={(e) => onWaveChange({ ...wave, guideA: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-300 font-mono">
                <span>4.0 cm</span>
                <span>25.0 cm</span>
              </div>
            </div>

            {/* Dimension b (hauteur) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-100 font-semibold flex items-center">
                  Hauteur du guide (b)
                  <ParamTooltip
                    title="Hauteur du Guide (b)"
                    explanation="La hauteur du guide n'intervient que pour les modes d'ordre n > 0 (comme TE11 ou TM11). Dans les guides standards, on choisit b ≈ a/2 pour maximiser la bande passante monomode."
                  />
                </span>
                <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                  {(wave.guideB * 100).toFixed(1)} cm
                </span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.15"
                step="0.005"
                value={wave.guideB}
                onChange={(e) => onWaveChange({ ...wave, guideB: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-300 font-mono">
                <span>2.0 cm</span>
                <span>15.0 cm</span>
              </div>
            </div>

            {/* Fréquence de coupure calculée en direct */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-700 font-mono text-xs flex justify-between items-center">
              <span className="text-slate-100 font-semibold">Fréquence de Coupure fc:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${isCutoff ? 'text-rose-300 bg-rose-950/80 border border-rose-600' : 'text-emerald-300 bg-emerald-950/80 border border-emerald-600'}`}>
                {fcGHz.toFixed(3)} GHz
              </span>
            </div>
          </div>
        )}

        {/* Polarisation pour mode TEM */}
        {wave.guidedMode === 'TEM' && (
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700 space-y-2">
            <span className="text-slate-200 text-xs font-semibold flex items-center">
              État de Polarisation de l'Onde (TEM) :
              <ParamTooltip
                title="Polarisation de l'OPPH"
                explanation="Rectiligne : le vecteur E oscille selon une direction fixe ey. Circulaire : superposition orthogonale de Ey et Ez avec déphasage temporel de π/2, le vecteur tourne à pulsation ω. Source surfacique : courant js à l'interface émettant des ondes symétriques."
                formula="\vec{E} = E_0 \cos(\omega t - kx)\vec{e}_y + E_0 \sin(\omega t - kx)\vec{e}_z"
              />
            </span>
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
                  className={`w-full text-left p-2 rounded-lg text-xs transition-all ${
                    wave.polarization === pol.id
                      ? 'bg-cyan-500/25 border border-cyan-400 text-white font-semibold shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">{pol.label}</div>
                  <div className="text-[11px] text-slate-300 font-mono">{pol.math}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fréquence f */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-200 font-medium flex items-center">
              Fréquence opérationnelle (f)
              <ParamTooltip
                title="Fréquence Électromagnétique (f)"
                explanation="Fréquence de la source harmonique. En milieu diélectrique ou dans un guide d'onde, la longueur d'onde λ = v_phi / f diminue lorsque la permittivité augmente."
                formula="\lambda = \frac{v_\phi}{f} = \frac{c}{f\sqrt{\epsilon_r}}"
              />
            </span>
            <span className="font-mono text-cyan-300 font-bold">{wave.frequency.toFixed(2)} GHz</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.05"
            value={wave.frequency}
            onChange={(e) => onWaveChange({ ...wave, frequency: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Amplitude E0 */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-200 font-medium flex items-center">
              Amplitude du Champ (E0)
              <ParamTooltip
                title="Amplitude de Crête (E0)"
                explanation="Module de l'amplitude maximale du champ électrique en V/m. Détermine le flux moyen du vecteur de Poynting proportionnel à E0^2."
                formula="\langle \Pi \rangle = \frac{E_0^2}{2\eta}"
              />
            </span>
            <span className="font-mono text-cyan-300 font-bold">{wave.amplitude.toFixed(2)} V/m</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.5"
            step="0.1"
            value={wave.amplitude}
            onChange={(e) => onWaveChange({ ...wave, amplitude: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* SECTION 2: Profil de Texture de Surface ("L'Ajusteur Géométrique") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-100">
          <span className="flex items-center gap-1.5 text-indigo-300 font-bold">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Profil de Texture de Surface (Face Avant)
            <ParamTooltip
              title="Texture de Surface & Réflexion"
              explanation="La modulation géométrique sur la face avant du mur (dents de scie, cavités d'air 'col d'air', créneaux) provoque une diffraction et une diffusion d'onde selon la périodicité spatiale Λ."
            />
          </span>
          <span className="font-mono text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
            x = {wall.posX.toFixed(1)} m
          </span>
        </div>

        {/* Menu Déroulant des Profils de Texture */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-100 font-semibold flex items-center">
            Géométrie de la frontière :
            <ParamTooltip
              title="Profils Géométriques Disponibles"
              explanation="1. Dents de scie : coins anéchoïques réduisant la réflexion spéculaire. 2. Col d'air : cavités transverses facilitant la pénétration. 3. Créneaux : sauts d'impédance discrets. 4. Circulaire : diffraction cylindrique. 5. Sinusoïdal : filtre de Bragg."
            />
          </label>
          <select
            value={wall.textureProfile}
            onChange={(e) =>
              onWallChange({ ...wall, textureProfile: e.target.value as SurfaceTextureProfile })
            }
            className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
          >
            {textureProfiles.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white font-medium">
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-200 font-normal leading-relaxed pt-0.5 bg-slate-950/60 p-2 rounded border border-slate-800">
            {textureProfiles.find((p) => p.id === wall.textureProfile)?.description}
          </p>
        </div>

        {/* Épaisseur de paroi e */}
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-100 font-semibold flex items-center">
              Épaisseur de paroi (e)
              <ParamTooltip
                title="Épaisseur de Paroi (e)"
                explanation="Distance physique entre la face avant et la face arrière de l'obstacle. Détermine le retard de phase optique et l'atténuation dans les matériaux à pertes."
                formula="\Delta \Phi_{transit} = k_{mat} \cdot e = \frac{2\pi f}{c}\sqrt{\epsilon_r} \cdot e"
              />
            </span>
            <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
              {wall.thickness.toFixed(2)} m
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.1"
            value={wall.thickness}
            onChange={(e) => onWallChange({ ...wall, thickness: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-300 font-mono">
            <span>0.5 m</span>
            <span>4.0 m</span>
          </div>
        </div>

        {/* Profondeur de texture h */}
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-100 font-semibold flex items-center">
              Profondeur de texture (h)
              <ParamTooltip
                title="Amplitude de Texture (h)"
                explanation="Hauteur crête-à-creux de la modulation géométrique sur la face avant du mur. Une profondeur plus grande augmente le déphasage local entre les rayons réfléchis aux pointes et aux creux."
              />
            </span>
            <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
              {wall.textureDepth.toFixed(2)} m
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={wall.textureDepth}
            onChange={(e) => onWallChange({ ...wall, textureDepth: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-300 font-mono">
            <span>0.1 m</span>
            <span>2.0 m</span>
          </div>
        </div>

        {/* Période spatiale Λ */}
        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-700 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-100 font-semibold flex items-center">
              Période spatiale (Λ)
              <ParamTooltip
                title="Période de Réseau (Λ)"
                explanation="Pas spatial transversal de la texture le long de l'axe Z. Lorsque Λ est du même ordre de grandeur que la longueur d'onde λ, des ordres de diffraction constructifs (conditions de Bragg) apparaissent."
                formula="\Lambda \sin(\theta_m) = m \cdot \lambda"
              />
            </span>
            <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
              {wall.texturePeriod.toFixed(2)} m
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.1"
            value={wall.texturePeriod}
            onChange={(e) => onWallChange({ ...wall, texturePeriod: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-300 font-mono">
            <span>0.5 m</span>
            <span>5.0 m</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Contrôle Bidirectionnel des Sondes 1 & 2 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-100">
          <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            Positionnement Bidirectionnel des Sondes
            <ParamTooltip
              title="Sondes Différentielles Interactives"
              explanation="Vous pouvez repositionner directement les sondes en les glissant sur le canvas 3D OU en déplaçant ces curseurs numériques précis. Les coordonnées et graphiques se synchronisent instantanément."
              formula="\Delta \varphi = k \cdot |x_2 - x_1|"
            />
          </span>
          <span className="font-mono text-indigo-300 font-bold text-xs bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700">
            Δx = {Math.abs(probe.x2 - probe.x1).toFixed(2)} m
          </span>
        </div>

        {/* Sonde 1 (Cyan) */}
        <div className="p-3 bg-slate-900/90 rounded-lg border border-cyan-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"></span>
              Sonde 1 (Canal A)
              <ParamTooltip
                title="Sonde 1 (Canal A)"
                explanation="Sonde d'échantillonnage locale. Glissez-la directement dans la scène 3D pour explorer la répartition de champ avant, pendant ou après l'obstacle."
              />
            </span>
            <span className="font-mono text-cyan-200 font-bold bg-slate-950 px-2 py-0.5 rounded border border-cyan-900">
              ({probe.x1.toFixed(1)}, {probe.z1.toFixed(1)}) m
            </span>
          </div>
          {/* Slider X1 */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-200 font-medium">
              <span>Position longitudinale (x₁)</span>
              <span className="font-mono text-cyan-300 font-bold">{probe.x1.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="-14.0"
              max="14.0"
              step="0.1"
              value={probe.x1}
              onChange={(e) =>
                onProbeChange({ ...probe, x1: parseFloat(e.target.value), activeProbe: 1 })
              }
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
          {/* Slider Z1 */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-200 font-medium">
              <span>Position transversale (z₁)</span>
              <span className="font-mono text-cyan-300 font-bold">{probe.z1.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="-9.0"
              max="9.0"
              step="0.1"
              value={probe.z1}
              onChange={(e) =>
                onProbeChange({ ...probe, z1: parseFloat(e.target.value), activeProbe: 1 })
              }
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Sonde 2 (Ambre) */}
        <div className="p-3 bg-slate-900/90 rounded-lg border border-amber-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
              Sonde 2 (Canal B)
              <ParamTooltip
                title="Sonde 2 (Canal B)"
                explanation="Seconde sonde pour la mesure différentielle spatiale Δx = |x2 - x1| et du déphasage direct Δφ."
              />
            </span>
            <span className="font-mono text-amber-200 font-bold bg-slate-950 px-2 py-0.5 rounded border border-amber-900">
              ({probe.x2.toFixed(1)}, {probe.z2.toFixed(1)}) m
            </span>
          </div>
          {/* Slider X2 */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-200 font-medium">
              <span>Position longitudinale (x₂)</span>
              <span className="font-mono text-amber-300 font-bold">{probe.x2.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="-14.0"
              max="14.0"
              step="0.1"
              value={probe.x2}
              onChange={(e) =>
                onProbeChange({ ...probe, x2: parseFloat(e.target.value), activeProbe: 2 })
              }
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
          {/* Slider Z2 */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-200 font-medium">
              <span>Position transversale (z₂)</span>
              <span className="font-mono text-amber-300 font-bold">{probe.z2.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="-9.0"
              max="9.0"
              step="0.1"
              value={probe.z2}
              onChange={(e) =>
                onProbeChange({ ...probe, z2: parseFloat(e.target.value), activeProbe: 2 })
              }
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Matériau & Permittivité Diélectrique (εr) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-100">
          <span className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Box className="w-4 h-4 text-amber-400" />
            Matériau & Diélectrique (εr)
            <ParamTooltip
              title="Permittivité Diélectrique (εr)"
              explanation="La permittivité relative εr ralentit la vitesse de phase v_phi = c / sqrt(εr) et comprime la longueur d'onde locale. Elle réduit également l'impédance caractéristique d'onde η."
              formula="\eta = \frac{\eta_0}{\sqrt{\epsilon_r}} = \frac{376.73\,\Omega}{\sqrt{\epsilon_r}}"
            />
          </span>
          <span className="font-mono text-amber-300 font-bold text-xs bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
            εr = {material.epsilonR.toFixed(2)}
          </span>
        </div>

        <div className="space-y-2">
          {MATERIAL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onMaterialChange(preset)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between ${
                material.id === preset.id
                  ? 'border-amber-400 bg-amber-500/25 text-white font-semibold shadow-md shadow-amber-500/10'
                  : 'border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div>
                <div className="font-bold flex items-center gap-2 text-white">
                  <span
                    className="w-3 h-3 rounded-full inline-block shrink-0 shadow-sm ring-1 ring-white/20"
                    style={{ backgroundColor: preset.color }}
                  ></span>
                  {preset.name}
                </div>
                <div className="text-[11px] text-slate-200 line-clamp-1 pt-0.5">{preset.description}</div>
              </div>
              <span className="font-mono text-xs font-bold text-amber-300 ml-2 shrink-0 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                εr={preset.epsilonR}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 5: Panneau d'Équations Dynamiques KaTeX */}
      <KatexEquations wave={wave} material={material} probe={probe} />
    </div>
  );
};
