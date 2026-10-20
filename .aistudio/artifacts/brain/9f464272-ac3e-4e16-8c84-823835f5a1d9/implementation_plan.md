# WaveLab ENSA M115 - Propagation Libre & Guidée des Ondes Électromagnétiques

Reconstruction complète du laboratoire virtuel 3D de propagation d'ondes électromagnétiques conforme aux standards académiques des écoles d'ingénieurs ENSA (Module M115). L'application propose un banc d'essai numérique interactif avec équations physiques dynamiques en KaTeX, modes d'ondes guidées (TEM, TE, TM) avec fréquence de coupure et ondes évanescentes, profils géométriques d'obstacles extrudés en 3D (dents de scie, demi-cylindres, créneaux, sinusoïdes), sonde différentielle double ($x_1, x_2$) pour la mesure directe du déphasage spatial $\Delta \varphi$, et modes de polarisation d'onde plane progressive harmonique (OPPH).

## User Review & Critical Decisions

> [!IMPORTANT]
> Les choix de conception suivants ont été intégrés et confirmés :
> - **Modes de Propagation Guidée (M115)** : Sélecteur de mode dans le panneau de contrôle de l'onde :
>   1. **TEM (Transverse Électromagnétique)** : Onde plane libre dans le vide ou le milieu sans coupure ($f_c = 0$, $v_\phi = \frac{c}{\sqrt{\epsilon_r}}$).
>   2. **TE (Transverse Électrique - $E_z = 0$)** : Mode guidé transverse électrique (ex: $\text{TE}_{10}$ ou $\text{TE}_{mn}$) avec dimensions de guide $a$ (largeur) et $b$ (hauteur).
>   3. **TM (Transverse Magnétique - $H_z = 0$)** : Mode guidé transverse magnétique ($\text{TM}_{11}$ ou $\text{TM}_{mn}$).
> - **Fréquence de Coupure & Régime Évanescent** : Calcul dynamique de $f_c = \frac{c}{2\sqrt{\epsilon_r}} \sqrt{\left(\frac{m}{a}\right)^2 + \left(\frac{n}{b}\right)^2}$.
>   - Si $f > f_c$ : Propagation guidée avec vitesse de phase supraluminique $v_{\phi,g} = \frac{v_\phi}{\sqrt{1 - (f_c/f)^2}}$ et longueur d'onde guidée $\lambda_g = \frac{\lambda}{\sqrt{1 - (f_c/f)^2}} > \lambda$.
>   - Si $f < f_c$ : Coupure de mode avec badge d'avertissement académique "Onde Évanescente / Coupure de Mode ($\alpha = \frac{\omega}{v_\phi}\sqrt{(f_c/f)^2 - 1}$)" et atténuation exponentielle spatiale $e^{-\alpha x}$ dans le profil d'obstacle.
> - **Système de Sondes Différentielles** : Deux sondes virtuelles indépendantes (Sonde 1 en cyan cobalt et Sonde 2 en ambre télémétrique) positionnables en continu dans l'espace 3D pour la mesure directe du déphasage spatial $\Delta \varphi = k \cdot |x_2 - x_1|$ et l'affichage comparatif sur oscilloscope bi-courbe.
> - **Moteur d'Équations Physiques** : Rendu typographique KaTeX avec mise à jour continue des valeurs numériques en temps réel (fréquence $f$, permittivité relative $\epsilon_r$, vitesse de phase $v_\phi$, $f_c$, $v_{\phi,g}$, $\lambda_g$, pulsation $\omega$, vecteur d'onde $k$, longueur d'onde $\lambda$, impédance intrinsèque $\eta$, flux moyen de Poynting $\langle \Pi \rangle$).
> - **Esthétique Visuelle** : Console sombre haute précision inspirée de COMSOL Multiphysics et MATLAB Scientific Workspace (fond `#090D16`, panneaux ardoise `#111827`, frontières 1px `#1E293B`, typographie `JetBrains Mono` et `Plus Jakarta Sans`, sans bannières superflues).

---

## 1. Vue d'Ensemble & Objectifs Pédagogiques

### Capacité du Système
- **Visualisation 3D en temps réel** : Propagation d'ondes électromagnétiques libres (TEM) et guidées (TE, TM), réflexion/transmission à travers des milieux diélectriques et métalliques, et diffraction par corrugations périodiques de surface.
- **Formulation mathématique synchronisée** : Panneau rétractable d'équations en notation KaTeX académique française affichant le lien analytique exact entre les paramètres ajustés ($f$, $\epsilon_r$, $a$, $b$, $m$, $n$) et les grandeurs physiques dérivées ($v_\phi$, $f_c$, $v_{\phi,g}$, $\lambda_g$, $k$, $\lambda$, $\Delta \varphi$, $\langle \Pi \rangle$).
- **Sondage différentiel & Oscilloscope bifaisceau** : Inspection simultanée du champ électrique en deux points $x_1$ et $x_2$ avec mesure de déphasage et de coefficient de transmission $T$.
- **Profils de rugosité et texture de surface** : Remplacement des fentes arbitraires par 4 profils académiques modélisés via `THREE.Shape` et `THREE.ExtrudeGeometry` :
  1. *Triangulaire / Dents de scie* (réflexion anéchoïque / coins dièdres)
  2. *Circulaire / Demi-cylindrique* (corrugations convexes diffractantes)
  3. *Sinusoïdale* (modulation continue de surface de Bragg)
  4. *Rectangulaire / Créneaux* (guides d'ondes à encoches / fentes rectangulaires)

---

## 2. Expérience Utilisateur & Design Visuel

### A. Disposition de l'Espace de Travail (Console Scientifique Asymétrique)
1. **Ruban Supérieur (Barre d'Entête ENSA)** :
   - Titre académique : `WaveLab 3D · ENSA M115`
   - Sélecteur de préréglages pédagogiques :
     - *Onde Libre dans le Vide ($n=1$, TEM)*
     - *Guide d'Onde Rectangulaire TE₁₀ (Mode Propagatif)*
     - *Guide d'Onde sous Fréquence de Coupure (Onde Évanescente)*
     - *Diélectrique Demi-Espace (Polystyrène $\epsilon_r = 2.54$)*
     - *Surface Corruguée Diffractante (Bragg)*
   - Commandes globales : Lecture/Pause, Vitesse temporelle, Réinitialisation de phase, Bascule filaire/vecteurs $\vec{E}$.
2. **Panneau Latéral de Contrôle (Gauche, 360px)** :
   - *Modes d'Onde & Polarisation* :
     - Mode de guidage : **TEM** (Onde libre), **TE** ($E_z = 0$), **TM** ($H_z = 0$).
     - Si TE ou TM activé : curseurs de dimensions de guide $a$ (largeur en cm/m) et $b$ (hauteur en cm/m), sélecteur d'indices de mode $(m, n)$ (ex: $\text{TE}_{10}$, $\text{TE}_{20}$, $\text{TM}_{11}$).
     - Polarisation (si TEM) : OPPH Rectiligne ($\vec{E}\parallel\vec{e}_y$), OPPH Circulaire ($\vec{E}_y + j\vec{E}_z$), Source Surfacique de Courant ($\vec{j}_s = J_0 e^{j\omega t} \vec{e}_x$).
     - Indicateur d'état dynamique : Badge "Propagatif ($f > f_c$)" ou "Évanescent / Coupure ($f < f_c$)".
   - *Matériau & Milieu de Propagation* : Milieu 1 (Vide), Milieu 2 (Permittivité relative $\epsilon_r$, Conductivité $\sigma$).
   - *Profil de Texture de Surface* : Sélecteur de profil (Triangulaire, Demi-cylindrique, Sinusoïdale, Rectangulaire), Épaisseur de paroi $e$, Profondeur de texture $h$, Période spatiale $\Lambda$.
3. **Zone Centrale : Scène 3D Interactive WebGL (Three.js)** :
   - Surface ondulatoire hybride (nappe de déformation continue + flèches vectorielles de champ électrique $\vec{E}$ et vecteur de Poynting $\vec{\Pi}$).
   - Si mode TE/TM : modulation spatiale transversale selon $\sin(m\pi y / a)$ et $\cos(n\pi z / b)$, et décroissance exponentielle $e^{-\alpha x}$ si $f < f_c$.
   - Obstacle diélectrique ou conducteur extrudé selon le profil choisi avec parois de guidage.
   - Deux sondes 3D interactives déplaçables ($S_1$ en cyan cobalt, $S_2$ en ambre) avec repères orthonormés $(\vec{e}_x, \vec{e}_y, \vec{e}_z)$.
4. **Volet Rétractable d'Équations Physiques (KaTeX)** :
   - Cartouche d'ingénierie déroulant avec décomposition dynamique étape par étape :
     $$\begin{aligned}
     v_\phi &= \frac{c}{\sqrt{\epsilon_r}} \\
     f_c &= \frac{c}{2\sqrt{\epsilon_r}} \sqrt{\left(\frac{m}{a}\right)^2 + \left(\frac{n}{b}\right)^2} \\
     v_{\phi,g} &= \frac{v_\phi}{\sqrt{1 - (f_c/f)^2}} \quad (f > f_c) \\
     \lambda_g &= \frac{\lambda}{\sqrt{1 - (f_c/f)^2}} \\
     \alpha &= \frac{2\pi f}{v_\phi}\sqrt{(f_c/f)^2 - 1} \quad (f < f_c) \\
     \Delta \varphi &= k \cdot |x_2 - x_1| \\
     \langle \vec{\Pi} \rangle &= \frac{E_0^2}{2 \eta} \vec{e}_x \quad \text{avec } \eta = \frac{\eta_0}{\sqrt{\epsilon_r}}
     \end{aligned}$$
5. **Plateau Inférieur : Oscilloscope Bifaisceau & Télémétrie** :
   - Écran CRT/LCD virtuel avec deux voies : Canal A (Sonde 1, Cyan) et Canal B (Sonde 2, Ambre).
   - Indicateurs numériques haute précision en police monospace : $V_{\text{pk-pk}}$, $V_{\text{eff}}$ (RMS), $\Delta \varphi$ en radians et degrés, Atténuation en dB si évanescent.

---

## 3. Architecture Technique & Modélisation Mathématique

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App.tsx (Root Workspace)                        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │       HeaderBar.tsx (Norme ENSA M115, Presets, Simulation)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌───────────────────────┬──────────────────────────────────────────┐  │
│  │   ControlPanel.tsx    │           ThreeViewport.tsx              │  │
│  │                       │                                          │  │
│  │ - Modes TEM / TE / TM │ - Scene WebGL Three.js                   │  │
│  │ - Dim. guide (a, b)   │ - Obstacle profilé extrudé (ExtrudeGeo)  │  │
│  │ - Profil de surface   │ - Surface d'onde TE/TM & Onde évanescente│  │
│  │ - Matériau (εr, σ)    │ - Vecteurs E, Π et flèches de champ      │  │
│  │                       │ - Sondes mobiles Sonde 1 (x1) & 2 (x2)   │  │
│  │ ┌───────────────────┐ │                                          │  │
│  │ │ KatexEquations.tsx│ ├──────────────────────────────────────────┤  │
│  │ │ fc, vφg, λg, α... │ │          Oscilloscope.tsx                │  │
│  │ └───────────────────┘ │ - Double trace (Canal A / Canal B)       │  │
│  │                       │ - Déphasage Δφ, Vpk-pk, Atténuation dB   │  │
│  └───────────────────────┴──────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Plan de Réalisation & Étapes d'Exécution

1. **Installation du paquet KaTeX** :
   - Installer `katex` et `@types/katex` pour le rendu net et sans latence des formules mathématiques.
2. **Moteur Physique & Types Académiques (`src/types.ts` & `src/physics/waveEngine.ts`)** :
   - Ajout des types pour les modes d'onde guidée : `guidedMode: 'TEM' | 'TE' | 'TM'`, `guideA: number`, `guideB: number`, `modeM: number`, `modeN: number`.
   - Fonctions de calcul physique complètes : `calculateCutoffFrequency(a, b, m, n, epsR)`, `calculateGuidedParameters(f, fc, vPhase, lambda)`, `calculateWaveField(x, y, z, t, config)`.
3. **Composant des Équations KaTeX (`src/components/KatexEquations.tsx`)** :
   - Rendu KaTeX réactif affichant la formule et le calcul numérique pas à pas pour $v_\phi$, $f_c$, $v_{\phi,g}$, $\lambda_g$, $\alpha$, $\Delta \varphi$ et $\langle \Pi \rangle$.
4. **Générateur 3D de Profils de Surface Extrudés & Visualisation TE/TM (`src/components/ThreeViewport.tsx`)** :
   - Extrusion 3D géométrique des 4 profils de surface (Triangulaire, Demi-cylindrique, Sinusoïdale, Rectangulaire) via `THREE.ExtrudeGeometry`.
   - Modélisation du profil de champ guidé pour TE et TM : composante stationnaire transversale $\sin(m\pi y / a)$ et atténuation exponentielle $\exp(-\alpha x)$ lorsque $f < f_c$.
   - Deux sondes 3D interactives distinctes (Sonde 1 en Cyan et Sonde 2 en Ambre) déplaçables au curseur.
5. **Panneau de Commande et Oscilloscope Bi-Canal (`ControlPanel.tsx`, `Oscilloscope.tsx`, `HeaderBar.tsx`)** :
   - Interface en français académique pour le cours ENSA M115.
   - Commandes pour dimensions de guide $a, b$, indices $m, n$, fréquence, matériau, profils.
   - Double trace temps réel sur l'oscilloscope avec calcul direct du déphasage $\Delta \varphi$.
6. **Vérification & Compilation** :
   - Validation via `lint_applet` (`tsc --noEmit`) et `compile_applet`.
