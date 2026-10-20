# WaveLab 3D: Electromagnetic & Acoustic Wave Propagation Simulator

A 3D computational physics wave simulation web application built with **React**, **Three.js**, **Tailwind CSS**, and **Lucide React**, ready for immediate zero-config deployment on **Vercel** and embedded for Android execution.

---

## 🚀 Instant Vercel Deployment

This project is pre-configured with `vercel.json` for seamless static single-page web deployment.

### Deploy with Vercel CLI
```bash
npm install -g vercel
vercel
```

### Manual Build & Run
```bash
# Install dependencies
npm install

# Start local dev server (with hot reload)
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 🔬 Computational Physics & Mathematical Foundations

### 1. Inhomogeneous Helmholtz Wave Dynamics
The simulation models continuous-wave spatial propagation through inhomogeneous dielectric and conducting obstacles:
$$\nabla^2 u + k^2(\mathbf{r}) u = 0$$
where the wave number inside a medium of relative permittivity $\epsilon_r$ is:
$$k = \frac{\omega}{v_p} = k_0 \sqrt{\epsilon_r}, \quad v_p = \frac{c}{\sqrt{\epsilon_r}}$$
- Inside **Polystyrene** ($\epsilon_r = 2.54$), phase velocity drops to $v_p = 0.628\,c$ and wavelength compresses by $\lambda = \lambda_0 / 1.59$.
- Inside **Concrete** ($\epsilon_r = 6.0$), phase velocity drops to $v_p = 0.408\,c$.
- In **Air / Cavity Gaps** ($\epsilon_r = 1.0$), phase velocity is baseline $c$.

### 2. Boundary Reflections & Fresnel Equations
At normal incidence between free space and dielectric barrier:
$$R = \frac{1 - \sqrt{\epsilon_r}}{1 + \sqrt{\epsilon_r}}, \quad T = \frac{2}{1 + \sqrt{\epsilon_r}}$$
The incident region demonstrates standing wave interference resulting from superposition of incident and reflected wavefronts.

### 3. Slotted Barrier & Cavity Resonances ("Col d'Air")
- **Thickness ($e$)**: Governs slab attenuation and internal transit delay.
- **Slot Spacing ($t$)**: Adjusts the aperture period along the transverse axis.
- **Internal Air Cavity ("Col d'Air")**: Models internal waveguide channels where waves propagate at $v = c$ through dielectric bulk, forming diffraction wavelets via the Huygens-Fresnel principle.

### 4. Hybrid 3D Surface & Poynting Vector Field
- **Surface Elevation**: Real-time vertex displacement proportional to instantaneous amplitude $E(x, z, t)$.
- **Dynamic 3D Vector Arrows**: Instanced cones oriented along the local energy flux / gradient $\vec{S} \propto -\nabla u$, visualizing direction of wave propagation and diffraction bending.

### 5. Virtual Oscilloscope Station
- Click or drag the probe marker anywhere in the 3D computational tank.
- The bottom oscilloscope plots real-time time-domain traces $E(t)$ with peak-to-peak amplitude $V_{pp}$, RMS amplitude, and transmission metrics.

---

## 🛠 Tech Stack
- **Frontend Framework**: React 18, TypeScript, Vite 5
- **3D Graphics Engine**: Three.js (WebGL, OrbitControls, InstancedMesh, Dynamic Heightfield Shaders)
- **Styling**: Tailwind CSS (Scientific dark laboratory theme)
- **Icons**: Lucide React
- **Hosting**: Vercel ready (`vercel.json`) + Android WebView hardware-accelerated container
