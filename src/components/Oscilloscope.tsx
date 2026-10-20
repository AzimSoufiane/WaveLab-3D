import React, { useEffect, useRef } from 'react';
import { ProbeData, WaveConfig, WallGeometry } from '../types';
import { Activity, Radio, Crosshair } from 'lucide-react';

interface OscilloscopeProps {
  probe: ProbeData;
  wave: WaveConfig;
  wall: WallGeometry;
  onProbePreset: (zone: 'incident' | 'inside' | 'transmitted') => void;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  probe,
  wave,
  wall,
  onProbePreset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine current probe zone
  const halfThickness = wall.thickness / 2;
  const isIncident = probe.x < wall.posX - halfThickness;
  const isInside = probe.x >= wall.posX - halfThickness && probe.x <= wall.posX + halfThickness;
  const isTransmitted = probe.x > wall.posX + halfThickness;

  const currentZone = isIncident
    ? 'Incident Field'
    : isInside
    ? 'Inside Obstacle / Cavity'
    : 'Transmitted / Diffracted';

  // Render Oscilloscope Trace on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;

    // Background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    // Oscilloscope Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    // Horizontal divisions
    for (let y = 15; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Vertical divisions
    for (let x = 20; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Center Zero Line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Signal Trace
    const history = probe.history;
    if (history.length > 1) {
      // Trace glow
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 2;

      ctx.beginPath();
      const step = width / (history.length - 1);
      const scale = (height * 0.38) / Math.max(0.1, wave.amplitude);

      for (let i = 0; i < history.length; i++) {
        const x = i * step;
        const y = midY - history[i] * scale;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Current live probe point pulse
      const lastX = width - 1;
      const lastY = midY - history[history.length - 1] * scale;
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(lastX - 2, lastY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [probe.history, wave.amplitude]);

  return (
    <div className="w-full bg-[#0b101c] border-t border-slate-800 p-3 flex flex-col md:flex-row items-center gap-4 text-xs select-none">
      {/* Probe Telemetry Header */}
      <div className="flex flex-col space-y-1.5 min-w-[200px]">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Crosshair className="w-4 h-4 text-orange-500 animate-spin-slow" />
          <span>Virtual Probe Station</span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
            {currentZone}
          </span>
        </div>

        <div className="font-mono text-slate-400 text-[11px] grid grid-cols-2 gap-x-3 gap-y-0.5">
          <div>Coord: <span className="text-cyan-300">({probe.x.toFixed(1)}, {probe.z.toFixed(1)})m</span></div>
          <div>Instant E: <span className="text-cyan-300">{probe.currentValue.toFixed(2)} V/m</span></div>
          <div>Pk-to-Pk: <span className="text-amber-300">{probe.peakToPeak.toFixed(2)} V/m</span></div>
          <div>RMS: <span className="text-emerald-300">{probe.rms.toFixed(2)} V/m</span></div>
        </div>

        {/* Quick Probe Relocation Buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] text-slate-500">Jump:</span>
          <button
            onClick={() => onProbePreset('incident')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
              isIncident ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Incident
          </button>
          <button
            onClick={() => onProbePreset('inside')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
              isInside ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Inside Wall
          </button>
          <button
            onClick={() => onProbePreset('transmitted')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
              isTransmitted ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Transmitted
          </button>
        </div>
      </div>

      {/* Real-time Oscilloscope Canvas */}
      <div className="flex-1 w-full relative h-20 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          className="w-full h-full block"
        />
        {/* Oscilloscope HUD labels */}
        <div className="absolute top-1 left-2 font-mono text-[9px] text-slate-500 flex items-center gap-2 pointer-events-none">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>CH1: E(x_probe, z_probe, t)</span>
          <span>• 500 mV/div</span>
        </div>
        <div className="absolute bottom-1 right-2 font-mono text-[9px] text-cyan-400/70 pointer-events-none">
          REAL-TIME TIME-DOMAIN TRACE
        </div>
      </div>
    </div>
  );
};
