import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  MaterialPreset,
  WallGeometry,
  WaveConfig,
  DualProbeState,
  SimulationState,
  SurfaceTextureProfile,
} from '../types';
import { calculateWaveField, getSurfaceTextureDisplacement } from '../physics/waveEngine';

interface ThreeViewportProps {
  wave: WaveConfig;
  wall: WallGeometry;
  material: MaterialPreset;
  probe: DualProbeState;
  onProbeMove: (probeId: 1 | 2, x: number, z: number) => void;
  simulation: SimulationState;
  onTimeUpdate: (time: number, val1: number, val2: number) => void;
}

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  wave,
  wall,
  material,
  probe,
  onProbeMove,
  simulation,
  onTimeUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);
  const waveMeshRef = useRef<THREE.Mesh | null>(null);
  const wallMeshRef = useRef<THREE.Mesh | null>(null);
  const vectorArrowsRef = useRef<THREE.InstancedMesh | null>(null);

  // Sondes 3D
  const probe1GroupRef = useRef<THREE.Group | null>(null);
  const probe1SphereRef = useRef<THREE.Mesh | null>(null);
  const probe1StemRef = useRef<THREE.Mesh | null>(null);
  const probe1OuterRingRef = useRef<THREE.Mesh | null>(null);

  const probe2GroupRef = useRef<THREE.Group | null>(null);
  const probe2SphereRef = useRef<THREE.Mesh | null>(null);
  const probe2StemRef = useRef<THREE.Mesh | null>(null);
  const probe2OuterRingRef = useRef<THREE.Mesh | null>(null);

  const draggingProbeId = useRef<1 | 2 | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Mutable refs synchronisées pour la boucle d'animation
  const waveRef = useRef(wave);
  waveRef.current = wave;
  const wallRef = useRef(wall);
  wallRef.current = wall;
  const materialRef = useRef(material);
  materialRef.current = material;
  const simRef = useRef(simulation);
  simRef.current = simulation;
  const probeStateRef = useRef(probe);
  probeStateRef.current = probe;

  const timeRef = useRef(0);

  // Initialisation de la scène Three.js
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scène
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.012);
    sceneRef.current = scene;

    // Caméra
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 24, 30);
    cameraRef.current = camera;

    // Moteur de rendu WebGL
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Contrôles orbitaux
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 6;
    controls.maxDistance = 75;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Éclairage studio 3 points
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(12, 28, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const cyanFill = new THREE.PointLight(0x00f5d4, 2.2, 45);
    cyanFill.position.set(-16, 6, 0);
    scene.add(cyanFill);

    const amberRim = new THREE.PointLight(0xf59e0b, 1.8, 45);
    amberRim.position.set(16, 6, 0);
    scene.add(amberRim);

    // Grille de coordonnées cartésiennes de laboratoire
    const grid = new THREE.GridHelper(36, 36, 0x1e293b, 0x0f172a);
    grid.position.y = -0.02;
    scene.add(grid);

    // Nappe 3D de déformation de champ électrique
    const planeGeo = new THREE.PlaneGeometry(32, 22, 140, 90);
    planeGeo.rotateX(-Math.PI / 2);
    const count = planeGeo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    planeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const waveMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.25,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const waveMesh = new THREE.Mesh(planeGeo, waveMat);
    waveMesh.receiveShadow = true;
    scene.add(waveMesh);
    waveMeshRef.current = waveMesh;

    // Flèches vectorielles de Poynting (InstancedMesh)
    const arrowConeGeo = new THREE.ConeGeometry(0.12, 0.45, 8);
    arrowConeGeo.rotateX(Math.PI / 2);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const arrowRows = 14;
    const arrowCols = 20;
    const totalArrows = arrowRows * arrowCols;
    const arrowMesh = new THREE.InstancedMesh(arrowConeGeo, arrowMat, totalArrows);
    arrowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(arrowMesh);
    vectorArrowsRef.current = arrowMesh;

    // Création des deux sondes virtuelles (Sonde 1 en Cyan, Sonde 2 en Ambre)
    const buildProbeGroup = (colorHex: number) => {
      const group = new THREE.Group();

      // Sphère active
      const sphereGeo = new THREE.SphereGeometry(0.38, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.95,
        roughness: 0.2,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.y = 1.0;
      sphere.castShadow = true;
      group.add(sphere);

      // Tige graduée télescopique
      const stemGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.0, 12);
      const stemMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.5;
      group.add(stem);

      // Anneau de positionnement au sol
      const ringGeo = new THREE.RingGeometry(0.38, 0.65, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.02;
      group.add(ring);

      // Anneau extérieur interactif pour feedback de survol/drag
      const outerRingGeo = new THREE.RingGeometry(0.85, 1.15, 32);
      outerRingGeo.rotateX(-Math.PI / 2);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRing.position.y = 0.02;
      group.add(outerRing);

      // Volume de détection invisible pour un clic/drag ultra réactif
      const hitBoxGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.8, 16);
      const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
      hitBox.position.y = 1.4;
      group.add(hitBox);

      return { group, sphere, stem, ring, outerRing };
    };

    const p1 = buildProbeGroup(0x00f5d4);
    scene.add(p1.group);
    probe1GroupRef.current = p1.group;
    probe1SphereRef.current = p1.sphere;
    probe1StemRef.current = p1.stem;
    probe1OuterRingRef.current = p1.outerRing;

    const p2 = buildProbeGroup(0xf59e0b);
    scene.add(p2.group);
    probe2GroupRef.current = p2.group;
    probe2SphereRef.current = p2.sphere;
    probe2StemRef.current = p2.stem;
    probe2OuterRingRef.current = p2.outerRing;

    // Redimensionnement de la fenêtre
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Détection d'intersection géométrique avec les sondes
    const checkProbeHit = (clientX: number, clientY: number): 1 | 2 | null => {
      if (!containerRef.current || !cameraRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, cameraRef.current);

      // Raycast direct sur les objets 3D des sondes
      if (probe1GroupRef.current) {
        const hits1 = raycaster.current.intersectObjects(probe1GroupRef.current.children, true);
        if (hits1.length > 0) return 1;
      }
      if (probe2GroupRef.current) {
        const hits2 = raycaster.current.intersectObjects(probe2GroupRef.current.children, true);
        if (hits2.length > 0) return 2;
      }

      // Raycast de secours sur le plan au sol avec rayon d'attraction
      const intersection = new THREE.Vector3();
      if (raycaster.current.ray.intersectPlane(groundPlane.current, intersection)) {
        const prb = probeStateRef.current;
        const dist1 = Math.hypot(intersection.x - prb.x1, intersection.z - prb.z1);
        const dist2 = Math.hypot(intersection.x - prb.x2, intersection.z - prb.z2);
        if (dist1 < 2.4 && dist1 <= dist2) return 1;
        if (dist2 < 2.4) return 2;
      }
      return null;
    };

    const getGroundPosition = (clientX: number, clientY: number): THREE.Vector3 | null => {
      if (!containerRef.current || !cameraRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, cameraRef.current);
      const intersection = new THREE.Vector3();
      if (raycaster.current.ray.intersectPlane(groundPlane.current, intersection)) {
        return intersection;
      }
      return null;
    };

    const domEl = renderer.domElement;

    const handlePointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const hitId = checkProbeHit(e.clientX, e.clientY);
      if (hitId) {
        draggingProbeId.current = hitId;
        controls.enabled = false;
        domEl.style.cursor = 'grabbing';
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (draggingProbeId.current) {
        domEl.style.cursor = 'grabbing';
        const pt = getGroundPosition(e.clientX, e.clientY);
        if (pt) {
          const clampedX = Math.max(-14.0, Math.min(14.0, pt.x));
          const clampedZ = Math.max(-9.0, Math.min(9.0, pt.z));
          onProbeMove(draggingProbeId.current, clampedX, clampedZ);
        }
      } else {
        // Détection de survol pour feedback visuel immédiat
        const hitId = checkProbeHit(e.clientX, e.clientY);
        if (hitId) {
          domEl.style.cursor = 'grab';
          if (hitId === 1 && probe1OuterRingRef.current) {
            (probe1OuterRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.85;
          }
          if (hitId === 2 && probe2OuterRingRef.current) {
            (probe2OuterRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.85;
          }
        } else {
          domEl.style.cursor = 'default';
          if (probe1OuterRingRef.current) {
            (probe1OuterRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35;
          }
          if (probe2OuterRingRef.current) {
            (probe2OuterRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35;
          }
        }
      }
    };

    const handlePointerUp = () => {
      if (draggingProbeId.current) {
        draggingProbeId.current = null;
        controls.enabled = true;
        domEl.style.cursor = 'default';
        if (probe1OuterRingRef.current) {
          (probe1OuterRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35;
        }
        if (probe2OuterRingRef.current) {
          (probe2OuterRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35;
        }
      }
    };

    domEl.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    // Support tactile réactif pour écrans tactiles et mobiles
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const hitId = checkProbeHit(touch.clientX, touch.clientY);
        if (hitId) {
          draggingProbeId.current = hitId;
          controls.enabled = false;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (draggingProbeId.current && e.touches.length === 1) {
        const touch = e.touches[0];
        const pt = getGroundPosition(touch.clientX, touch.clientY);
        if (pt) {
          const clampedX = Math.max(-14.0, Math.min(14.0, pt.x));
          const clampedZ = Math.max(-9.0, Math.min(9.0, pt.z));
          onProbeMove(draggingProbeId.current, clampedX, clampedZ);
        }
      }
    };

    const handleTouchEnd = () => {
      draggingProbeId.current = null;
      controls.enabled = true;
    };

    domEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // Boucle d'animation WebGL
    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (simRef.current.isPlaying) {
        timeRef.current += dt * simRef.current.speed * 4.0;
      }

      controls.update();

      // Mise à jour de la déformation de surface 3D
      if (waveMeshRef.current) {
        const geo = waveMeshRef.current.geometry;
        const pos = geo.attributes.position;
        const col = geo.attributes.color;
        const count = pos.count;
        const t = timeRef.current;
        const curWave = waveRef.current;
        const curWall = wallRef.current;
        const curMat = materialRef.current;

        const crestColor = new THREE.Color(0x00f5d4); // Cyan
        const troughColor = new THREE.Color(0x6366f1); // Indigo
        const zeroColor = new THREE.Color(0x091124); // Bleu nuit sombre
        const evanescentColor = new THREE.Color(0xf43f5e); // Rose pour coupure

        for (let i = 0; i < count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);

          const field = calculateWaveField(x, z, t, curWave, curWall, curMat);
          const elev = simRef.current.showSurface ? field.amplitude * 1.3 : 0;
          pos.setY(i, elev);

          const normVal = Math.max(
            -1,
            Math.min(1, field.amplitude / Math.max(0.1, curWave.amplitude))
          );
          const vertexColor = new THREE.Color();

          if (field.isEvanescent) {
            vertexColor.lerpColors(zeroColor, evanescentColor, Math.abs(normVal));
          } else if (normVal > 0) {
            vertexColor.lerpColors(zeroColor, crestColor, normVal);
          } else {
            vertexColor.lerpColors(zeroColor, troughColor, -normVal);
          }

          if (field.inObstacle && !field.isEvanescent) {
            vertexColor.multiplyScalar(0.3);
          }

          col.setXYZ(i, vertexColor.r, vertexColor.g, vertexColor.b);
        }

        pos.needsUpdate = true;
        col.needsUpdate = true;
        geo.computeVertexNormals();
      }

      // Mise à jour des flèches vectorielles de flux de Poynting
      if (vectorArrowsRef.current && simRef.current.showVectors) {
        vectorArrowsRef.current.visible = true;
        const dummy = new THREE.Object3D();
        let idx = 0;
        const xStep = 28 / (arrowCols - 1);
        const zStep = 18 / (arrowRows - 1);
        const t = timeRef.current;

        for (let r = 0; r < arrowRows; r++) {
          for (let c = 0; c < arrowCols; c++) {
            const x = -14 + c * xStep;
            const z = -9 + r * zStep;
            const field = calculateWaveField(
              x,
              z,
              t,
              waveRef.current,
              wallRef.current,
              materialRef.current
            );

            dummy.position.set(x, Math.max(0.15, field.amplitude * 1.3 + 0.35), z);
            const angle = Math.atan2(field.fluxX, field.fluxZ);
            dummy.rotation.set(0, angle, 0);

            const arrowScale = Math.min(1.4, Math.max(0.1, Math.abs(field.amplitude) * 0.85));
            dummy.scale.set(arrowScale, arrowScale, arrowScale);
            dummy.updateMatrix();

            vectorArrowsRef.current.setMatrixAt(idx++, dummy.matrix);
          }
        }
        vectorArrowsRef.current.instanceMatrix.needsUpdate = true;
      } else if (vectorArrowsRef.current) {
        vectorArrowsRef.current.visible = false;
      }

      // Échantillonnage aux 2 sondes et synchronisation avec l'oscilloscope
      const prb = probeStateRef.current;
      const field1 = calculateWaveField(
        prb.x1,
        prb.z1,
        timeRef.current,
        waveRef.current,
        wallRef.current,
        materialRef.current
      );
      const field2 = calculateWaveField(
        prb.x2,
        prb.z2,
        timeRef.current,
        waveRef.current,
        wallRef.current,
        materialRef.current
      );

      if (probe1GroupRef.current) {
        probe1GroupRef.current.position.set(prb.x1, 0, prb.z1);
      }
      if (probe2GroupRef.current) {
        probe2GroupRef.current.position.set(prb.x2, 0, prb.z2);
      }

      const sphereY1 = Math.max(0.2, 0.9 + field1.amplitude * 1.3);
      if (probe1SphereRef.current) {
        probe1SphereRef.current.position.y = sphereY1;
      }
      if (probe1StemRef.current) {
        probe1StemRef.current.position.y = sphereY1 / 2;
        probe1StemRef.current.scale.set(1, sphereY1, 1);
      }

      const sphereY2 = Math.max(0.2, 0.9 + field2.amplitude * 1.3);
      if (probe2SphereRef.current) {
        probe2SphereRef.current.position.y = sphereY2;
      }
      if (probe2StemRef.current) {
        probe2StemRef.current.position.y = sphereY2 / 2;
        probe2StemRef.current.scale.set(1, sphereY2, 1);
      }

      onTimeUpdate(timeRef.current, field1.amplitude, field2.amplitude);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domEl.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Génération dynamique de l'obstacle 3D texturé via THREE.Shape et THREE.ExtrudeGeometry
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Supprimer l'ancien maillage de paroi
    if (wallMeshRef.current) {
      scene.remove(wallMeshRef.current);
      if (wallMeshRef.current.geometry) wallMeshRef.current.geometry.dispose();
      wallMeshRef.current = null;
    }

    const halfThickness = wall.thickness / 2;
    const wallHeight = wall.height || 4.0;
    const wallSpanZ = 24.0; // Barrière transversale barrant toute la largeur Z [-12, +12]
    const zSteps = 240;

    // Tracé de la section horizontale fermée (Z, X) avec orientation rigoureuse
    const shape = new THREE.Shape();

    // 1. Face arrière plane à x = +halfThickness, parcourue de z = +12 vers z = -12
    shape.moveTo(wallSpanZ / 2, halfThickness);
    shape.lineTo(-wallSpanZ / 2, halfThickness);

    // 2. Face avant texturée profilée (face à l'onde incidente venant de -X)
    // Parcourue de z = -12 vers z = +12
    for (let i = 0; i <= zSteps; i++) {
      const z = -wallSpanZ / 2 + (i / zSteps) * wallSpanZ;
      const deltaX = getSurfaceTextureDisplacement(
        z,
        wall.textureProfile,
        wall.textureDepth,
        wall.texturePeriod
      );
      const xFront = -halfThickness - deltaX;
      shape.lineTo(z, xFront);
    }

    // Fermeture du polygone vers (wallSpanZ / 2, halfThickness)
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: wallHeight,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Alignement rigoureux :
    // rotateZ(-pi/2) puis rotateX(-pi/2) transforme (z, x, y_local) en (x, y, z) avec det=+1
    geometry.rotateZ(-Math.PI / 2);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(wall.posX, 0, 0);
    geometry.computeVertexNormals();

    const wallColor = new THREE.Color(material.color);
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.35,
      metalness: material.id === 'metal' ? 0.9 : 0.15,
      transparent: true,
      opacity: material.id === 'air' ? 0.35 : 0.88,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, wallMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Arêtes filaires lumineuses pour surligner chaque dent et créneau 3D
    const edges = new THREE.EdgesGeometry(geometry, 20);
    const edgeMat = new THREE.LineBasicMaterial({
      color: material.id === 'metal' ? 0xffffff : 0x00f5d4,
      transparent: true,
      opacity: 0.6,
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMat);
    mesh.add(edgeLines);

    scene.add(mesh);
    wallMeshRef.current = mesh;
  }, [wall, material]);

  // Mode de caméra (Perspective ou Vue du Dessus)
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (simulation.cameraMode === 'top') {
      camera.position.set(0, 36, 0.01);
      controls.target.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 24, 30);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  }, [simulation.cameraMode]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden" ref={containerRef}>
      {/* Télémétrie HUD overlay scientifique */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2.5 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300 shadow-lg">
        <span className="font-mono text-cyan-400 font-semibold">WebGL 60 FPS</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 text-[11px]">
          Faites glisser <span className="text-cyan-300 font-mono">Sonde 1</span> ou{' '}
          <span className="text-amber-300 font-mono">Sonde 2</span>
        </span>
      </div>

      {/* Légende rapide des sondes sur la scène */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-[11px] text-slate-300 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span>Sonde 1 (x₁={probe.x1.toFixed(1)}m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Sonde 2 (x₂={probe.x2.toFixed(1)}m)</span>
        </div>
      </div>
    </div>
  );
};
