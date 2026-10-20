import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MaterialPreset, WallGeometry, WaveConfig, ProbeData, SimulationState } from '../types';
import { calculateWaveField } from '../physics/waveEngine';

interface ThreeViewportProps {
  wave: WaveConfig;
  wall: WallGeometry;
  material: MaterialPreset;
  probe: ProbeData;
  onProbeMove: (x: number, z: number) => void;
  simulation: SimulationState;
  onTimeUpdate: (time: number, signalValue: number) => void;
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
  const wallGroupRef = useRef<THREE.Group | null>(null);
  const vectorArrowsRef = useRef<THREE.InstancedMesh | null>(null);
  const probeMeshRef = useRef<THREE.Group | null>(null);

  const isDraggingProbe = useRef(false);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Current refs for animation loop
  const waveRef = useRef(wave);
  waveRef.current = wave;
  const wallRef = useRef(wall);
  wallRef.current = wall;
  const materialRef = useRef(material);
  materialRef.current = material;
  const simRef = useRef(simulation);
  simRef.current = simulation;
  const probePosRef = useRef({ x: probe.x, z: probe.z });
  probePosRef.current = { x: probe.x, z: probe.z };

  const timeRef = useRef(0);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 22, 28);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 70;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x00f5d4, 2.0, 40);
    blueLight.position.set(-14, 5, 0);
    scene.add(blueLight);

    // Coordinate Grid & Platform
    const grid = new THREE.GridHelper(36, 36, 0x1f2937, 0x111827);
    grid.position.y = -0.05;
    scene.add(grid);

    // Dynamic Wave Surface Mesh
    const planeGeo = new THREE.PlaneGeometry(32, 24, 120, 80);
    planeGeo.rotateX(-Math.PI / 2);
    // Add vertex colors attribute
    const count = planeGeo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    planeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const waveMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.3,
      metalness: 0.2,
      wireframe: false,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
    });
    const waveMesh = new THREE.Mesh(planeGeo, waveMat);
    waveMesh.receiveShadow = true;
    scene.add(waveMesh);
    waveMeshRef.current = waveMesh;

    // Instanced Vector Arrows (Local Poynting Flux / Gradient)
    const arrowConeGeo = new THREE.ConeGeometry(0.12, 0.45, 8);
    arrowConeGeo.rotateX(Math.PI / 2); // point along +Z
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const arrowRows = 16;
    const arrowCols = 20;
    const totalArrows = arrowRows * arrowCols;
    const arrowMesh = new THREE.InstancedMesh(arrowConeGeo, arrowMat, totalArrows);
    arrowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(arrowMesh);
    vectorArrowsRef.current = arrowMesh;

    // Parametric Wall Group
    const wallGroup = new THREE.Group();
    scene.add(wallGroup);
    wallGroupRef.current = wallGroup;

    // Draggable Probe Marker
    const probeGroup = new THREE.Group();
    // Sphere
    const probeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xff5722, emissive: 0xff5722, emissiveIntensity: 0.8 })
    );
    probeSphere.position.y = 1.0;
    probeGroup.add(probeSphere);
    // Vertical stem
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8);
    const stem = new THREE.Mesh(stemGeo, new THREE.MeshBasicMaterial({ color: 0xff7043 }));
    stem.position.y = 0.5;
    probeGroup.add(stem);
    // Ground target ring
    const ringGeo = new THREE.RingGeometry(0.4, 0.55, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xff5722, side: THREE.DoubleSide }));
    ring.position.y = 0.02;
    probeGroup.add(ring);
    scene.add(probeGroup);
    probeMeshRef.current = probeGroup;

    // Handle Window Resize
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pointer Events for Draggable Probe
    const getIntersectionPoint = (e: MouseEvent | Touch): THREE.Vector3 | null => {
      if (!containerRef.current || !cameraRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, cameraRef.current);
      const intersection = new THREE.Vector3();
      if (raycaster.current.ray.intersectPlane(groundPlane.current, intersection)) {
        return intersection;
      }
      return null;
    };

    const handlePointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Left click only
      const pt = getIntersectionPoint(e);
      if (pt) {
        const dist = Math.hypot(pt.x - probePosRef.current.x, pt.z - probePosRef.current.z);
        if (dist < 1.6) {
          isDraggingProbe.current = true;
          controls.enabled = false;
        }
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (!isDraggingProbe.current) return;
      const pt = getIntersectionPoint(e);
      if (pt) {
        const clampedX = Math.max(-14, Math.min(14, pt.x));
        const clampedZ = Math.max(-10, Math.min(10, pt.z));
        onProbeMove(clampedX, clampedZ);
      }
    };

    const handlePointerUp = () => {
      isDraggingProbe.current = false;
      controls.enabled = true;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const pt = getIntersectionPoint(e.touches[0]);
        if (pt) {
          const dist = Math.hypot(pt.x - probePosRef.current.x, pt.z - probePosRef.current.z);
          if (dist < 2.0) {
            isDraggingProbe.current = true;
            controls.enabled = false;
          }
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingProbe.current && e.touches.length === 1) {
        const pt = getIntersectionPoint(e.touches[0]);
        if (pt) {
          const clampedX = Math.max(-14, Math.min(14, pt.x));
          const clampedZ = Math.max(-10, Math.min(10, pt.z));
          onProbeMove(clampedX, clampedZ);
        }
      }
    };

    const handleTouchEnd = () => {
      isDraggingProbe.current = false;
      controls.enabled = true;
    };

    domEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // Animation Render Loop
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

      // Update Wave Surface Mesh Vertices
      if (waveMeshRef.current) {
        const geo = waveMeshRef.current.geometry;
        const pos = geo.attributes.position;
        const col = geo.attributes.color;
        const count = pos.count;
        const t = timeRef.current;
        const curWave = waveRef.current;
        const curWall = wallRef.current;
        const curMat = materialRef.current;

        const crestColor = new THREE.Color(0x00f5d4); // cyan
        const troughColor = new THREE.Color(0x7928ca); // purple
        const zeroColor = new THREE.Color(0x091426); // dark navy

        for (let i = 0; i < count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);

          const field = calculateWaveField(x, z, t, curWave, curWall, curMat);
          const elev = simRef.current.showSurface ? field.amplitude * 1.3 : 0;
          pos.setY(i, elev);

          // Color calculation
          const normVal = Math.max(-1, Math.min(1, field.amplitude / Math.max(0.1, curWave.amplitude)));
          const vertexColor = new THREE.Color();
          if (normVal > 0) {
            vertexColor.lerpColors(zeroColor, crestColor, normVal);
          } else {
            vertexColor.lerpColors(zeroColor, troughColor, -normVal);
          }

          if (field.inObstacle) {
            vertexColor.multiplyScalar(0.25);
          }

          col.setXYZ(i, vertexColor.r, vertexColor.g, vertexColor.b);
        }

        pos.needsUpdate = true;
        col.needsUpdate = true;
        geo.computeVertexNormals();
      }

      // Update Vector Arrows
      if (vectorArrowsRef.current && simRef.current.showVectors) {
        vectorArrowsRef.current.visible = true;
        const dummy = new THREE.Object3D();
        let idx = 0;
        const xStep = 28 / (arrowCols - 1);
        const zStep = 20 / (arrowRows - 1);
        const t = timeRef.current;

        for (let r = 0; r < arrowRows; r++) {
          for (let c = 0; c < arrowCols; c++) {
            const x = -14 + c * xStep;
            const z = -10 + r * zStep;
            const field = calculateWaveField(x, z, t, waveRef.current, wallRef.current, materialRef.current);

            dummy.position.set(x, Math.max(0.2, field.amplitude * 1.3 + 0.3), z);
            const angle = Math.atan2(field.fluxX, field.fluxZ);
            dummy.rotation.set(0, angle, 0);

            const arrowScale = Math.min(1.4, Math.max(0.1, Math.abs(field.amplitude) * 0.9));
            dummy.scale.set(arrowScale, arrowScale, arrowScale);
            dummy.updateMatrix();

            vectorArrowsRef.current.setMatrixAt(idx++, dummy.matrix);
          }
        }
        vectorArrowsRef.current.instanceMatrix.needsUpdate = true;
      } else if (vectorArrowsRef.current) {
        vectorArrowsRef.current.visible = false;
      }

      // Update Probe Position & Sample Value
      if (probeMeshRef.current) {
        const px = probePosRef.current.x;
        const pz = probePosRef.current.z;
        const fieldAtProbe = calculateWaveField(px, pz, timeRef.current, waveRef.current, wallRef.current, materialRef.current);
        probeMeshRef.current.position.set(px, fieldAtProbe.amplitude * 1.3, pz);
        onTimeUpdate(timeRef.current, fieldAtProbe.amplitude);
      }

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

  // Update Wall Meshes when wall geometry or material changes
  useEffect(() => {
    if (!wallGroupRef.current || !sceneRef.current) return;
    const group = wallGroupRef.current;
    // Clear old meshes
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    const wallSpan = 24;
    const count = Math.max(1, wall.slotCount);
    const slotWidth = Math.max(0.6, wall.slotSpacing * 0.45);
    const period = wallSpan / count;
    const halfSpan = wallSpan / 2;

    const wallColor = new THREE.Color(material.color);
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.4,
      metalness: material.id === 'metal' ? 0.8 : 0.1,
      transparent: true,
      opacity: material.id === 'air' ? 0.3 : 0.85,
    });

    // Build solid blocks between slots
    let curZ = -halfSpan;
    for (let i = 0; i < count; i++) {
      const slotCenterZ = -halfSpan + period * (i + 0.5);
      const slotStart = slotCenterZ - slotWidth / 2;
      const slotEnd = slotCenterZ + slotWidth / 2;

      // Solid block prior to slot
      if (slotStart > curZ) {
        const blockLen = slotStart - curZ;
        const blockCenterZ = curZ + blockLen / 2;
        const blockGeo = new THREE.BoxGeometry(wall.thickness, wall.height, blockLen);
        const mesh = new THREE.Mesh(blockGeo, wallMat);
        mesh.position.set(wall.posX, wall.height / 2, blockCenterZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }

      // Air cavity guide lines ("col d'air")
      if (wall.cavityDepth > 0.1) {
        const cavityGeo = new THREE.BoxGeometry(
          Math.min(wall.thickness, wall.cavityDepth),
          wall.height * 0.9,
          slotWidth
        );
        const cavityEdges = new THREE.EdgesGeometry(cavityGeo);
        const line = new THREE.LineSegments(
          cavityEdges,
          new THREE.LineBasicMaterial({ color: 0x00f5d4, transparent: true, opacity: 0.6 })
        );
        line.position.set(wall.posX, wall.height / 2, slotCenterZ);
        group.add(line);
      }

      curZ = slotEnd;
    }

    // Final solid block
    if (curZ < halfSpan) {
      const blockLen = halfSpan - curZ;
      const blockCenterZ = curZ + blockLen / 2;
      const blockGeo = new THREE.BoxGeometry(wall.thickness, wall.height, blockLen);
      const mesh = new THREE.Mesh(blockGeo, wallMat);
      mesh.position.set(wall.posX, wall.height / 2, blockCenterZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }, [wall, material]);

  // Handle Camera Mode change (Perspective vs Top-Down)
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (simulation.cameraMode === 'top') {
      camera.position.set(0, 34, 0.01);
      controls.target.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 22, 28);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  }, [simulation.cameraMode]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden" ref={containerRef}>
      {/* 3D Viewport Controls HUD overlay */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span className="font-mono">60 FPS WebGL</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">Drag to Orbit • Tap field to move Probe</span>
      </div>
    </div>
  );
};
