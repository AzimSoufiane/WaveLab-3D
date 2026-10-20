# 3D WaveLab: Interactive Wave Propagation & Obstacle Simulation

A production-grade, interactive 3D electromagnetic and acoustic wave propagation simulation web application built with **React**, **Vite**, **Tailwind CSS**, **Lucide React**, and **Three.js**. Fully self-contained, optimized for 60 FPS performance, and ready for immediate one-click deployment on **Vercel**.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed and updated the architectural specifications:

- **Confirmed Decision 1 (Container & Target)**: Pure React + Vite + Tailwind CSS web application container with a responsive split-screen engineering layout, pre-configured with `vercel.json` and zero-config deployment.
- **Confirmed Decision 2 (Visualization Style)**: Hybrid 3D displacement surface paired with 3D Poynting / gradient vector arrow indicators to clearly show wave amplitude, phase wavefronts, and propagation direction.
- **Confirmed Decision 3 (Default Scenario)**: Slotted wall barrier with internal air cavities ("col d'air"), parameterizing thickness ($e$), slot spacing ($t$), cavity depth, and obstacle count.
- **Confirmed Decision 4 (Signal Instrumentation)**: Draggable 3D virtual probe with real-time time-domain oscilloscope graph showing instantaneous amplitude $E(t)$, phase velocity, and transmission coefficient.

---

## 1. Overview & Core Concept

- **What It Does**: Simulates continuous-wave scalar Helmholtz and wave-equation dynamics through inhomogeneous media. Users configure incident plane waves or point sources radiating towards structured dielectric and conducting obstacles. The engine computes wave phase velocity $v = c / \sqrt{\epsilon_r}$, wavelength compression $\lambda = \lambda_0 / \sqrt{\epsilon_r}$, boundary reflections, refraction, diffraction through periodic slots, and internal cavity resonance ("col d'air").
- **Target Audience & Persona**: Students, researchers, and RF/acoustic engineers studying wave mechanics, metamaterials, electromagnetic shielding, and acoustic room acoustics.
- **Key Value**: Provides intuitive, instant visual feedback on wave-matter interactions that are normally abstract or computationally prohibitive in heavy desktop FEA software.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Scene Navigation & Inspection**: Orbit, pan, and zoom around a 3D computational domain using Three.js OrbitControls. Toggle between 3D perspective and top-down (2D orthogonal) wavefield projection.
2. **Parametric Wall Adjustment ("The Adjuster")**: Slide wall thickness ($e$), slot spacing ($t$), cavity depth, and slot count. Watch the 3D wall mesh and wave boundary conditions morph in real time.
3. **Material & Permittivity Modulation**: Select from physical presets (Air $\epsilon_r=1.0$, Polystyrene $\epsilon_r=2.54$, Concrete $\epsilon_r=6.0$, Metal/Absorber) or enter custom relative permittivity $\epsilon_r$ to observe phase compression and boundary reflections.
4. **Interactive Virtual Probing**: Drag or tap anywhere in the 3D field to position the virtual oscilloscope probe. The live oscilloscope strip at the bottom graphs the probe's amplitude history $E(t)$, measuring local peak-to-peak amplitude and phase.
5. **Simulation Playback Controls**: Play, pause, single-step forward, reset phase, or adjust simulation speed ($0.25\times$ to $2.0\times$) and frequency/amplitude sliders.

### Visual Identity & Theme
- **Aesthetic Direction**: High-precision scientific laboratory aesthetic inspired by COMSOL Multiphysics and Keysight ADS, utilizing clean technical lines and high contrast.
- **Color Palette & Tokens**:
  - Deep Navy/Zinc Canvas: `#090D16` (background)
  - Surface Panel / Cards: `#111827` with crisp `#1F2937` borders
  - Wave Crest / Positive Amplitude: `#00F5D4` (electric cyan/aquamarine)
  - Wave Trough / Negative Amplitude: `#7928CA` to `#4338CA` (deep ultraviolet/indigo)
  - Wall Obstacle: Solid architectural slate `#374151` with illuminated cavity guides
  - Vector Flow Arrows: Translucent amber `#F59E0B` showing Poynting vector direction
  - Active Probe Marker: High-visibility orange `#FF5722` with targeting crosshair
- **Typography & Hierarchy**:
  - Monospace telemetry font for metrics ($\epsilon_r$, $\lambda$, frequency, $v_p$, probe values).
  - Modern sans-serif headings and clean compact control sliders with numeric readouts.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: React + Vite + Tailwind CSS Web Container (Vercel-Ready)**
  - *Chosen Approach*: Single-page responsive React web application with dedicated Three.js viewport canvas component, modular control panels, and standalone static build output.
  - *Why*: Direct zero-config Vercel deployment with fast HMR and universal browser support.
- **Decision 2: Hybrid Surface + Vector Arrow Physics Engine**
  - *Chosen Approach*: Dynamic GL mesh with vertex elevation proportional to real wave amplitude $u(x,y,t)$ paired with an instanced array of 3D vector arrows oriented along the local wave gradient $\nabla u$.
  - *Why*: Gives both spatial height intuition (like water ripples) and directional flux visualization (like vector Poynting fields).
- **Decision 3: Closed-Form Inhomogeneous Wavefield Propagation Engine**
  - *Chosen Approach*: Real-time superposition with local optical path length calculation, boundary attenuation, and diffraction slot secondary wavelet integration (Huygens-Fresnel principle adapted for real-time WebGL).
  - *Why*: Delivers guaranteed 60 FPS performance without numerical dispersion or grid instability common to unconstrained raw FDTD meshes on mobile chipsets, while faithfully modeling reflection, refraction ($n = \sqrt{\epsilon_r}$), transmission, and slot diffraction.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   React + Vite + Tailwind Web Application               │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ Header & Preset Bar   │  │ Playback Bar (Play, Pause, Step, Reset)│ │
│  └───────────┬───────────┘  └───────────────────┬────────────────────┘ │
│              │                                  │                      │
│              ▼                                  ▼                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                   Three.js WebGL 3D Viewport                      │ │
│  │  ┌─────────────────────────────────────────────────────────────┐  │ │
│  │  │ Scene, Camera, OrbitControls (Orbit, Pan, Zoom)             │  │ │
│  │  ├─────────────────────────────────────────────────────────────┤  │ │
│  │  │ Dynamic Wave Surface Mesh (Elevation & Phase Color Shader)  │  │ │
│  │  ├─────────────────────────────────────────────────────────────┤  │ │
│  │  │ Instanced 3D Vector Arrows (Local Poynting Flux / Gradient) │  │ │
│  │  ├─────────────────────────────────────────────────────────────┤  │ │
│  │  │ Parametric Wall Meshes (Thickness e, Slots t, Air Cavity)   │  │ │
│  │  ├─────────────────────────────────────────────────────────────┤  │ │
│  │  │ Draggable 3D Raycasting Probe Marker                        │  │ │
│  │  └─────────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────┬────────────────────────────────┘ │
│                                     │                                  │
│              ┌──────────────────────┴──────────────────────┐           │
│              ▼                                             ▼           │
│  ┌───────────────────────────────┐         ┌─────────────────────────┐ │
│  │ Sidebar Control Panels        │         │ Real-Time Oscilloscope  │ │
│  │ • Geometry Adjuster (e, t, d) │         │ • Time-domain E(t) trace│ │
│  │ • Material Selector (εr)      │         │ • Peak / RMS / Phase vp │ │
│  │ • Wave Source (f, A, type)    │         │ • Canvas 60 FPS graph   │ │
│  └───────────────────────────────┘         └─────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **WaveConfig**: `frequency: number`, `amplitude: number`, `sourceType: 'plane' | 'point'`, `speed: number`.
- **WallGeometry**: `thickness: number` ($e$), `slotSpacing: number` ($t$), `cavityDepth: number`, `slotCount: number`, `posX: number`.
- **MaterialSpec**: `id: string`, `name: string`, `epsilonR: number`, `lossTangent: number`, `color: string`.
- **ProbeState**: `x: number`, `z: number`, `currentValue: number`, `history: number[]`.
- **SimulationState**: `isPlaying: boolean`, `speedMultiplier: number`, `time: number`.

### Project Structure & Deployment Artifacts
- `index.html`: Entry point with meta tags, title, and fonts.
- `package.json`: React 18/19, Three.js, Lucide-React, Tailwind CSS, Vite.
- `vite.config.ts` & `tailwind.config.js`: Production bundling and utility classes.
- `vercel.json`: Zero-config single-page application routing for instant Vercel deployment.
- Embedded local bundle bridge ensuring seamless immediate loading within both browser/Vercel and Android container.

### Verification Plan
- Build and verify the React/Vite web application and asset packaging.
- Ensure 60 FPS animation loop, OrbitControls interaction, dynamic mesh deformation, and responsive real-time oscilloscope.
- Verify Android build via `compile_applet`.
