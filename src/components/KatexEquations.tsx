import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { WaveConfig, MaterialPreset, DualProbeState } from '../types';
import {
  calculateElectromagneticParameters,
  C_LIGHT_VACUUM,
  ETA_0,
} from '../physics/waveEngine';
import { ChevronDown, ChevronUp, Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface KatexEquationsProps {
  wave: WaveConfig;
  material: MaterialPreset;
  probe: DualProbeState;
}

export const KatexEquations: React.FC<KatexEquationsProps> = ({
  wave,
  material,
  probe,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Calculs électromagnétiques analytiques réactifs
  const params = useMemo(() => {
    return calculateElectromagneticParameters(wave, material);
  }, [wave, material]);

  const deltaX = Math.abs(probe.x2 - probe.x1);
  const kEffective = wave.guidedMode !== 'TEM' && !params.isCutoff ? params.kGuided : params.kMedium;
  const deltaPhiCalcRad = kEffective * deltaX;
  const deltaPhiCalcDeg = (deltaPhiCalcRad * 180) / Math.PI;

  // Formattage KaTeX avec tolérance aux erreurs
  const renderTex = (tex: string, displayMode: boolean = false) => {
    try {
      return {
        __html: katex.renderToString(tex, {
          displayMode,
          throwOnError: false,
        }),
      };
    } catch {
      return { __html: `<code>${tex}</code>` };
    }
  };

  // Formattage des nombres pour affichage scientifique clair
  const formatSci = (val: number, decimals = 3) => {
    if (!isFinite(val)) return '\\infty';
    if (Math.abs(val) >= 1e6 || (Math.abs(val) < 1e-2 && val !== 0)) {
      return val.toExponential(decimals);
    }
    return val.toFixed(decimals);
  };

  return (
    <div className="bg-[#0b101c] rounded-xl border border-slate-800 shadow-xl overflow-hidden transition-all">
      {/* Entête du panneau pliable */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-850 flex items-center justify-between text-left border-b border-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs text-slate-100 tracking-wide uppercase">
            📐 Équations & Formulation Physique (ENSA M115)
          </span>
          {wave.guidedMode !== 'TEM' && (
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                params.isCutoff
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {params.isCutoff ? 'Onde Évanescente (f < fc)' : 'Mode Propagatif (f > fc)'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            {collapsed ? 'Développer' : 'Réduire'}
          </span>
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Corps dynamique des équations */}
      {!collapsed && (
        <div className="p-3.5 space-y-3.5 text-xs text-slate-300">
          {/* Bannière d'alerte spécifique au régime évanescent si TE/TM sous fc */}
          {wave.guidedMode !== 'TEM' && params.isCutoff && (
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-200 text-[11px]">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-300">Coupure de Mode Actuelle : </span>
                La fréquence opérationnelle{' '}
                <span className="font-mono text-white">{wave.frequency.toFixed(2)} GHz</span> est
                inférieure à la fréquence de coupure du mode{' '}
                <span className="font-mono text-white">
                  {wave.guidedMode}_{wave.modeM}{wave.modeN} ({params.fc.toExponential(3)} Hz)
                </span>
                . L'onde ne se propage pas dans le guide et s'atténue exponentiellement selon{' '}
                <span className="font-mono text-rose-300">e^{`{-\\alpha x}`}</span>.
              </div>
            </div>
          )}

          {wave.guidedMode !== 'TEM' && !params.isCutoff && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-emerald-300">Mode Propagatif Guidé : </span>
                <span className="font-mono">f &gt; fc</span>, vitesse de phase supraluminique{' '}
                <span className="font-mono text-white">{formatSci(params.vPhaseGuided)} m/s</span>{' '}
                et longueur d'onde guidée étirée{' '}
                <span className="font-mono text-white">{formatSci(params.lambdaGuided, 4)} m</span>.
              </div>
            </div>
          )}

          {/* Grille des formules analytiques avec valeurs calculées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
            {/* 1. Vitesse de phase */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
              <div className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
                1. Vitesse de Phase en Milieu Diélectrique
              </div>
              <div
                className="overflow-x-auto text-[13px] py-1 text-slate-100"
                dangerouslySetInnerHTML={renderTex(
                  `v_\\phi = \\frac{c}{\\sqrt{\\epsilon_r}} = \\frac{3\\times 10^8}{\\sqrt{${material.epsilonR.toFixed(2)}}} = ${formatSci(params.vPhase)}\\text{ m/s}`
                )}
              />
            </div>

            {/* 2. Vecteur d'onde & Longueur d'onde */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
              <div className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
                2. Vecteur d'Onde & Longueur d'Onde
              </div>
              <div
                className="overflow-x-auto text-[13px] py-1 text-slate-100"
                dangerouslySetInnerHTML={renderTex(
                  `k = \\frac{2\\pi f}{v_\\phi} = ${formatSci(params.kMedium, 2)}\\text{ rad/m}, \\quad \\lambda = \\frac{v_\\phi}{f} = ${formatSci(params.lambdaMedium, 4)}\\text{ m}`
                )}
              />
            </div>

            {/* 3. Déphasage spatial différentiel Sonde 1 & Sonde 2 */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                  3. Déphasage Spatial Différentiel entre Sondes (x₁, x₂)
                </span>
                <span className="text-[10px] text-slate-400">
                  |x₂ - x₁| = {deltaX.toFixed(2)} m
                </span>
              </div>
              <div
                className="overflow-x-auto text-[13px] py-1 text-slate-100"
                dangerouslySetInnerHTML={renderTex(
                  `\\Delta \\varphi = k \\cdot |x_2 - x_1| = ${formatSci(kEffective, 2)} \\times ${deltaX.toFixed(2)} = ${deltaPhiCalcRad.toFixed(3)}\\text{ rad} \\; (${(deltaPhiCalcDeg % 360).toFixed(1)}^\\circ)`
                )}
              />
            </div>

            {/* 4. Impédance Intrinsèque & Flux de Poynting */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
              <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                4. Impédance Intrinsèque d'Onde
              </div>
              <div
                className="overflow-x-auto text-[13px] py-1 text-slate-100"
                dangerouslySetInnerHTML={renderTex(
                  `\\eta = \\frac{\\eta_0}{\\sqrt{\\epsilon_r}} = \\frac{376.73}{\\sqrt{${material.epsilonR.toFixed(2)}}} = ${params.eta.toFixed(1)}\\ \\Omega`
                )}
              />
            </div>

            {/* 5. Vecteur de Poynting Moyen */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
              <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                5. Vecteur de Poynting Moyen ⟨Π⟩
              </div>
              <div
                className="overflow-x-auto text-[13px] py-1 text-slate-100"
                dangerouslySetInnerHTML={renderTex(
                  `\\langle \\Pi \\rangle = \\frac{E_0^2}{2\\eta} = \\frac{${wave.amplitude.toFixed(2)}^2}{2\\times ${params.eta.toFixed(1)}} = ${formatSci(params.poyntingMean, 4)}\\text{ W/m}^2`
                )}
              />
            </div>

            {/* 6. Section Ondes Guidées TE/TM si activé */}
            {wave.guidedMode !== 'TEM' && (
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-cyan-800/60 space-y-2 md:col-span-2">
                <div className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>6. Paramètres de Mode Guidé ({wave.guidedMode}_{wave.modeM}{wave.modeN})</span>
                  <span className="text-[10px] text-slate-400">
                    Guide: a = {wave.guideA.toFixed(3)} m, b = {wave.guideB.toFixed(3)} m
                  </span>
                </div>

                <div
                  className="overflow-x-auto text-[12px] py-1 text-slate-100"
                  dangerouslySetInnerHTML={renderTex(
                    `f_c = \\frac{c}{2\\sqrt{\\epsilon_r}}\\sqrt{\\left(\\frac{m}{a}\\right)^2 + \\left(\\frac{n}{b}\\right)^2} = ${formatSci(params.fc, 3)}\\text{ Hz} \\; (${(params.fc / 1e9).toFixed(3)}\\text{ GHz})`
                  )}
                />

                {!params.isCutoff ? (
                  <div
                    className="overflow-x-auto text-[12px] py-1 text-cyan-300"
                    dangerouslySetInnerHTML={renderTex(
                      `v_{\\phi,g} = \\frac{v_\\phi}{\\sqrt{1-(f_c/f)^2}} = ${formatSci(params.vPhaseGuided)}\\text{ m/s}, \\quad \\lambda_g = \\frac{\\lambda}{\\sqrt{1-(f_c/f)^2}} = ${formatSci(params.lambdaGuided, 4)}\\text{ m}`
                    )}
                  />
                ) : (
                  <div
                    className="overflow-x-auto text-[12px] py-1 text-rose-300"
                    dangerouslySetInnerHTML={renderTex(
                      `\\alpha = \\frac{\\omega}{v_\\phi}\\sqrt{\\left(\\frac{f_c}{f}\\right)^2 - 1} = ${formatSci(params.attenuationAlpha, 2)}\\text{ Np/m} \\quad \\implies E(x) \\propto e^{-\\alpha x}`
                    )}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
