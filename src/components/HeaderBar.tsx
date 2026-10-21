import React, { useState, useEffect } from 'react';
import {
  SimulationState,
  WallGeometry,
  MaterialPreset,
  WaveConfig,
  DualProbeState,
} from '../types';
import { MATERIAL_PRESETS } from '../physics/waveEngine';
import {
  savePresetToLocalStorage,
  loadPresetsFromLocalStorage,
  exportOscilloscopeDataToCsv,
  serializeStateToUrl,
  SavedPreset,
} from '../utils/exportUtils';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Camera,
  Layers,
  Sparkles,
  Waves,
  Download,
  Share2,
  Bookmark,
  Check,
  FolderOpen,
  Trash2,
  Upload,
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
  wave: WaveConfig;
  wall: WallGeometry;
  material: MaterialPreset;
  probe: DualProbeState;
  onLoadSavedPreset: (preset: SavedPreset) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  simulation,
  onSimulationChange,
  onApplyPreset,
  onToggleSidebar,
  wave,
  wall,
  material,
  probe,
  onLoadSavedPreset,
}) => {
  const speeds = [0.25, 0.5, 1.0, 1.5, 2.0];
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');

  useEffect(() => {
    setSavedPresets(loadPresetsFromLocalStorage());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleExportCsv = () => {
    exportOscilloscopeDataToCsv(probe, wave, wall, material);
    showToast('Données CSV téléchargées avec succès !');
  };

  const handleShareLink = () => {
    const shareableUrl = serializeStateToUrl(wave, wall, material, probe);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareableUrl);
      showToast('Lien copié dans le presse-papier !');
    } else {
      prompt('Copiez ce lien pour partager la simulation :', shareableUrl);
    }
  };

  const handleSaveState = () => {
    const defaultName = `Preset ENSA ${new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const name = saveNameInput.trim() || defaultName;
    const updated = savePresetToLocalStorage(name, wave, wall, material, probe);
    setSavedPresets(updated);
    setSaveNameInput('');
    setShowSavedModal(false);
    showToast(`État « ${name} » enregistré !`);
  };

  const handleDeletePreset = (id: string, name: string) => {
    const updated = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem('wavelab_ensa_m115_saved_presets', JSON.stringify(updated));
    showToast(`Configuration « ${name} » supprimée`);
  };

  const handleExportJson = () => {
    if (savedPresets.length === 0) {
      showToast('Aucune configuration enregistrée à exporter');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedPresets, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `wavelab_presets_${Date.now()}.json`);
    dlAnchorElem.click();
    showToast('Toutes les configurations exportées en JSON !');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            const merged = [...parsed, ...savedPresets].slice(0, 15);
            setSavedPresets(merged);
            localStorage.setItem('wavelab_ensa_m115_saved_presets', JSON.stringify(merged));
            showToast(`${parsed.length} configurations importées !`);
          }
        } catch (err) {
          showToast('Erreur : fichier JSON invalide');
        }
      };
    }
  };

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
            frequency: 0.45,
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

      case 'cavity_slot':
        onApplyPreset(
          'Cavités d\'Air et Fentes Résonnantes (« Col d\'air »)',
          {
            textureProfile: 'fentes_cavites',
            thickness: 2.2,
            textureDepth: 1.0,
            texturePeriod: 2.0,
            posX: 0,
            height: 4,
          },
          MATERIAL_PRESETS[0],
          {
            frequency: 1.2,
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
    <>
      <header className="w-full bg-[#070b14] border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between text-xs select-none relative z-30">
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
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Propagation Libre & Guidée des Ondes Électromagnétiques
              </p>
            </div>
          </div>
        </div>

        {/* Préréglages de scénarios pédagogiques */}
        <div className="hidden xl:flex items-center gap-2 bg-slate-900/95 px-3 py-1.5 rounded-lg border border-slate-700">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-200 font-semibold text-[11px]">Scénario Pédagogique :</span>
          <select
            onChange={(e) => handlePresetSelect(e.target.value)}
            defaultValue="dielectric_barrier"
            className="bg-transparent text-slate-100 font-semibold text-[11px] focus:outline-none cursor-pointer"
          >
            <option value="tem_free" className="bg-slate-900 text-white">
              1. Onde Libre dans le Vide (TEM, n=1)
            </option>
            <option value="dielectric_barrier" className="bg-slate-900 text-white">
              2. Barrière Diélectrique Réfléchissante (Polystyrène εr=2.54)
            </option>
            <option value="te10_propagating" className="bg-slate-900 text-white">
              3. Guide d'Onde TE₁₀ (Propagatif, f &gt; fc)
            </option>
            <option value="cutoff_evanescent" className="bg-slate-900 text-white">
              4. Guide sous Fréquence de Coupure (Onde Évanescente, f &lt; fc)
            </option>
            <option value="cavity_slot" className="bg-slate-900 text-white">
              5. Fentes & Cavités d'air (« Col d'air »)
            </option>
            <option value="bragg_corrugated" className="bg-slate-900 text-white">
              6. Réseau Corrugué de Bragg (Diffraction & Filtrage)
            </option>
          </select>
        </div>

        {/* Boutons d'Action : Save State, Export CSV, Share Link */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Bouton Sauvegarder l'état */}
          <button
            onClick={() => setShowSavedModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-semibold transition-colors shadow-sm"
            title="Sauvegarder la configuration courante"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Sauvegarder</span>
          </button>

          {/* Bouton Exporter CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-semibold transition-colors shadow-sm"
            title="Exporter les données d'échantillonnage de l'oscilloscope en CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          {/* Bouton Partager le lien */}
          <button
            onClick={handleShareLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-semibold transition-colors shadow-sm"
            title="Copier le lien partageable avec l'état exact"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Partager</span>
          </button>

          <span className="w-px h-5 bg-slate-700 mx-0.5 hidden sm:inline-block"></span>

          {/* Lecture / Pause */}
          <button
            onClick={() => onSimulationChange({ ...simulation, isPlaying: !simulation.isPlaying })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              simulation.isPlaying
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400 hover:bg-amber-500/35'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/30'
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
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <StepForward className="w-4 h-4" />
          </button>

          {/* Remise à zéro */}
          <button
            onClick={() => onSimulationChange({ ...simulation, time: 0 })}
            title="Réinitialiser le temps de simulation"
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Sélecteur de vitesse */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-700 font-mono text-[11px]">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSimulationChange({ ...simulation, speed: s })}
                className={`px-1.5 py-0.5 rounded font-bold ${
                  simulation.speed === s
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Bascule Caméra 3D / Vue Dessus */}
          <button
            onClick={() =>
              onSimulationChange({
                ...simulation,
                cameraMode: simulation.cameraMode === 'perspective' ? 'top' : 'perspective',
              })
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
              simulation.cameraMode === 'top'
                ? 'bg-indigo-600/40 border-indigo-400 text-indigo-200'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
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

      {/* Toast de Notification Réactif */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900/95 border border-cyan-500/80 text-cyan-200 rounded-lg shadow-2xl backdrop-blur-md text-xs font-semibold animate-fade-in">
          <Check className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal de Sauvegarde & Gestion des Présélections Utilisateur */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0a0f1d] border border-slate-700 rounded-xl shadow-2xl p-5 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">Gestion des Présélections</h3>
              </div>
              <button
                onClick={() => setShowSavedModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Enregistrer la configuration actuelle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200 block">
                Nommer la configuration courante :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: TP1 Mesure Déphasage TE10"
                  value={saveNameInput}
                  onChange={(e) => setSaveNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveState()}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleSaveState}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Enregistrer
                </button>
              </div>
            </div>

            {/* Présélections sauvegardées */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                  Vos configurations enregistrées ({savedPresets.length}) :
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1">
                    <Upload className="w-3 h-3 text-cyan-400" />
                    Importer
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleExportJson}
                    className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                    title="Exporter tous les presets au format JSON"
                  >
                    <Download className="w-3 h-3 text-indigo-400" />
                    Exporter
                  </button>
                </div>
              </div>

              {savedPresets.length === 0 ? (
                <p className="text-xs text-slate-300 italic py-2 bg-slate-900/50 rounded text-center border border-slate-800">
                  Aucune configuration enregistrée pour l'instant.
                </p>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {savedPresets.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 flex items-center justify-between hover:border-cyan-500/60 transition-all text-xs"
                    >
                      <div className="flex-1 mr-2">
                        <div className="font-bold text-slate-100">{p.name}</div>
                        <div className="text-[10px] text-slate-200 font-mono mt-0.5">
                          f={p.wave.frequency}GHz · {p.wave.guidedMode} · εr={p.materialId}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onLoadSavedPreset(p);
                            setShowSavedModal(false);
                            showToast(`Configuration « ${p.name} » chargée !`);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 font-semibold text-xs border border-slate-700 transition-colors"
                        >
                          Charger
                        </button>
                        <button
                          onClick={() => handleDeletePreset(p.id, p.name)}
                          className="p-1 rounded bg-slate-800 hover:bg-rose-900/80 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                          title="Supprimer cette configuration"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
