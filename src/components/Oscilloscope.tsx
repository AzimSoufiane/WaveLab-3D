import React, { useEffect, useRef } from 'react';
import { DualProbeState, WaveConfig, WallGeometry } from '../types';
import { Activity, Crosshair, ArrowRightLeft } from 'lucide-react';

interface OscilloscopeProps {
  probe: DualProbeState;
  wave: WaveConfig;
  wall: WallGeometry;
  onProbePreset: (probeId: 1 | 2, zone: 'incident' | 'inside' | 'transmitted') => void;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  probe,
  wave,
  wall,
  onProbePreset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Détermination de la zone pour chaque sonde
  const halfThickness = wall.thickness / 2;
  const getZoneLabel = (x: number) => {
    if (x < wall.posX - halfThickness) return 'Champ Incident (Milieu 1)';
    if (x <= wall.posX + halfThickness) return 'Intérieur Obstacle';
    return 'Champ Transmis (Milieu 2)';
  };

  const zone1 = getZoneLabel(probe.x1);
  const zone2 = getZoneLabel(probe.x2);

  // Rendu de l'écran d'oscilloscope bi-courbe CRT/LCD
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    // Fond obscur type laboratoire
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Graticule / Quadrillage d'oscilloscope
    ctx.strokeStyle = '#151f32';
    ctx.lineWidth = 1;
    // Divisions horizontales
    for (let y = 15; y < height; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Divisions verticales
    for (let x = 20; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Axe central zéro (pointillé)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    const scale = (height * 0.36) / Math.max(0.1, wave.amplitude);

    // Voie 1 : Sonde 1 (Cyan)
    const hist1 = probe.history1;
    if (hist1.length > 1) {
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 5;
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const step = width / (hist1.length - 1);

      for (let i = 0; i < hist1.length; i++) {
        const x = i * step;
        const y = midY - hist1[i] * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Point actif voie 1
      const lastX = width - 2;
      const lastY = midY - hist1[hist1.length - 1] * scale;
      ctx.fillStyle = '#00f5d4';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Voie 2 : Sonde 2 (Ambre)
    const hist2 = probe.history2;
    if (hist2.length > 1) {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 5;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const step = width / (hist2.length - 1);

      for (let i = 0; i < hist2.length; i++) {
        const x = i * step;
        const y = midY - hist2[i] * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Point actif voie 2
      const lastX = width - 2;
      const lastY = midY - hist2[hist2.length - 1] * scale;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [probe.history1, probe.history2, wave.amplitude]);

  return (
    <div className="w-full bg-[#080d18] border-t border-slate-800 p-3 flex flex-col lg:flex-row items-center gap-4 text-xs select-none">
      {/* Télémétrie différentielle Sonde 1 vs Sonde 2 */}
      <div className="flex flex-col space-y-2 min-w-[320px]">
        {/* Entête avec calcul du déphasage direct */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-100 font-semibold">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Oscilloscope Bifaisceau & Déphasage Spatial</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
            <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
            <span>Δφ = {probe.deltaPhiRad.toFixed(2)} rad ({probe.deltaPhiDeg.toFixed(1)}°)</span>
          </div>
        </div>

        {/* Mesures comparatives par canal */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          {/* Canal A (Sonde 1) */}
          <div className="p-2 rounded bg-slate-900/80 border border-cyan-800/60 space-y-0.5">
            <div className="text-cyan-300 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Voie A (Sonde 1) : x₁={probe.x1.toFixed(1)}m
            </div>
            <div className="text-slate-400 text-[10px]">{zone1}</div>
            <div className="text-slate-300 flex justify-between pt-0.5">
              <span>E(x₁): <b className="text-cyan-300">{probe.val1.toFixed(2)} V/m</b></span>
              <span>Veff: <b className="text-slate-200">{probe.rms1.toFixed(2)} V/m</b></span>
            </div>
            {/* Boutons de saut Sonde 1 */}
            <div className="flex gap-1 pt-1">
              <button
                onClick={() => onProbePreset(1, 'incident')}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[9px] rounded text-slate-300"
              >
                Incident
              </button>
              <button
                onClick={() => onProbePreset(1, 'inside')}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[9px] rounded text-slate-300"
              >
                Obstacle
              </button>
              <button
                onClick={() => onProbePreset(1, 'transmitted')}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[9px] rounded text-slate-300"
              >
                Transmis
              </button>
            </div>
          </div>

          {/* Canal B (Sonde 2) */}
          <div className="p-2 rounded bg-slate-900/80 border border-amber-800/60 space-y-0.5">
            <div className="text-amber-300 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Voie B (Sonde 2) : x₂={probe.x2.toFixed(1)}m
            </div>
            <div className="text-slate-400 text-[10px]">{zone2}</div>
            <div className="text-slate-300 flex justify-between pt-0.5">
              <span>E(x₂): <b className="text-amber-300">{probe.val2.toFixed(2)} V/m</b></span>
              <span>Veff: <b className="text-slate-200">{probe.rms2.toFixed(2)} V/m</b></span>
            </div>
            {/* Boutons de saut Sonde 2 */}
            <div className="flex gap-1 pt-1">
              <button
                onClick={() => onProbePreset(2, 'incident')}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[9px] rounded text-slate-300"
              >
                Incident
              </button>
              <button
                onClick={() => onProbePreset(2, 'inside')}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[9px] rounded text-slate-300"
              >
                Obstacle
              </button>
              <button
                onClick={() => onProbePreset(2, 'transmitted')}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[9px] rounded text-slate-300"
              >
                Transmis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Écran d'oscilloscope bi-trace haute fidélité */}
      <div className="flex-1 w-full relative h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
        <canvas ref={canvasRef} width={680} height={96} className="w-full h-full block" />

        {/* HUD de l'oscilloscope */}
        <div className="absolute top-1.5 left-2.5 font-mono text-[10px] flex items-center gap-3 pointer-events-none">
          <span className="text-cyan-400 font-bold">CH1 [Cyan]: Sonde 1 E(x₁,t)</span>
          <span className="text-amber-400 font-bold">CH2 [Ambre]: Sonde 2 E(x₂,t)</span>
          <span className="text-slate-500 hidden sm:inline">• Base de temps: 0.25 ms/div</span>
        </div>

        <div className="absolute bottom-1.5 right-2.5 font-mono text-[10px] text-slate-400 pointer-events-none flex items-center gap-2">
          <span>|x₂ - x₁| = {probe.distanceDeltaX.toFixed(2)} m</span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-400 font-bold">
            Δφ = k·Δx = {probe.deltaPhiRad.toFixed(2)} rad
          </span>
        </div>
      </div>
    </div>
  );
};
