import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, Activity, Cpu, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SatelliteData {
  id: 'nutrition' | 'movement' | 'baseline' | 'guidance';
  title: string;
  metric: string;
  desc: string;
  color: string;
  icon: React.ReactNode;
}

export const WellnessCore3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSatellite, setActiveSatellite] = useState<'nutrition' | 'movement' | 'baseline' | 'guidance' | null>(null);
  const prefersReduced = useReducedMotion();

  const satellites: SatelliteData[] = [
    {
      id: 'nutrition',
      title: 'Kitchen & Nutrition',
      metric: 'Indian Home Kitchen Engine',
      desc: 'Adapts home recipes around what is actually in your kitchen and filters allergens.',
      color: '#187A5B',
      icon: <Utensils className="w-3.5 h-3.5 text-emerald" />,
    },
    {
      id: 'movement',
      title: 'Guided Movement',
      metric: 'Form-First Pacing',
      desc: 'Anatomical human guidance with calm Hindi, Hinglish, or English cues and local camera option.',
      color: '#E7B76B',
      icon: <Activity className="w-3.5 h-3.5 text-[#B87A1E] dark:text-gold" />,
    },
    {
      id: 'baseline',
      title: 'Connected Context',
      metric: 'Shared Memory',
      desc: 'Profile, kitchen availability, workouts, and progress read one personal wellness profile.',
      color: '#22A078',
      icon: <Cpu className="w-3.5 h-3.5 text-emerald-light" />,
    },
    {
      id: 'guidance',
      title: 'Safety Boundaries',
      metric: 'Non-Diagnostic Companion',
      desc: 'Clinical allergy exclusions, safe floors, and clear referral guardrails built into every turn.',
      color: '#D8A252',
      icon: <Sparkles className="w-3.5 h-3.5 text-gold" />,
    },
  ];

  useEffect(() => {
    const container = mountRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || 520;
    let height = container.clientHeight || 520;

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 16);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.4);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    const emeraldPoint = new THREE.PointLight(0x22c55e, 3.5, 25);
    emeraldPoint.position.set(-6, -4, 5);
    scene.add(emeraldPoint);

    const goldPoint = new THREE.PointLight(0xe7b76b, 3.2, 22);
    goldPoint.position.set(5, 5, -3);
    scene.add(goldPoint);

    // Root Group for interactive mouse rotation & parallax
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 3. Central Living Core (Layered Translucent Geometries)
    // A. Outer Glass Sphere
    const outerGeo = new THREE.IcosahedronGeometry(2.3, 3);
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: 0x187a5b,
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.65,
      thickness: 1.2,
      transparent: true,
      opacity: 0.88,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      wireframe: false,
    });
    const outerCoreMesh = new THREE.Mesh(outerGeo, outerMat);
    worldGroup.add(outerCoreMesh);

    // B. Inner Glowing Golden Sphere
    const innerGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xe7b76b,
      emissive: 0xd8a252,
      emissiveIntensity: 0.85,
      roughness: 0.3,
      metalness: 0.2,
    });
    const innerCoreMesh = new THREE.Mesh(innerGeo, innerMat);
    worldGroup.add(innerCoreMesh);

    // C. Core Wireframe Cage
    const cageGeo = new THREE.IcosahedronGeometry(2.5, 2);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    worldGroup.add(cageMesh);

    // 4. Layered 3D Orbital Rings (Torus Geometries)
    const ring1Geo = new THREE.TorusGeometry(3.7, 0.038, 16, 120);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x187a5b,
      emissive: 0x0f4e3a,
      roughness: 0.2,
      metalness: 0.7,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 8;
    worldGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(4.7, 0.035, 16, 120);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xe7b76b,
      emissive: 0x8a6225,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 5;
    worldGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(5.7, 0.032, 16, 120);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0x22a078,
      roughness: 0.25,
      metalness: 0.6,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.x = Math.PI / 6;
    ring3.rotation.z = -Math.PI / 4;
    worldGroup.add(ring3);

    // 5. Four Revolving Satellite Nodes
    const satGroup = new THREE.Group();
    worldGroup.add(satGroup);

    // Node 1: Nutrition (Emerald Dodecahedron)
    const sat1Geo = new THREE.DodecahedronGeometry(0.46);
    const sat1Mat = new THREE.MeshStandardMaterial({
      color: 0x187a5b,
      emissive: 0x22c55e,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.5,
    });
    const sat1 = new THREE.Mesh(sat1Geo, sat1Mat);
    satGroup.add(sat1);

    // Node 2: Movement (Gold Octahedron)
    const sat2Geo = new THREE.OctahedronGeometry(0.44);
    const sat2Mat = new THREE.MeshStandardMaterial({
      color: 0xe7b76b,
      emissive: 0xb87a1e,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.7,
    });
    const sat2 = new THREE.Mesh(sat2Geo, sat2Mat);
    satGroup.add(sat2);

    // Node 3: Baseline (Sage Icosahedron)
    const sat3Geo = new THREE.IcosahedronGeometry(0.42);
    const sat3Mat = new THREE.MeshStandardMaterial({
      color: 0x22a078,
      emissive: 0x123b32,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.6,
    });
    const sat3 = new THREE.Mesh(sat3Geo, sat3Mat);
    satGroup.add(sat3);

    // Node 4: Guidance (Iridescent Sphere)
    const sat4Geo = new THREE.SphereGeometry(0.42, 24, 24);
    const sat4Mat = new THREE.MeshStandardMaterial({
      color: 0xfaf9f5,
      emissive: 0xd8a252,
      emissiveIntensity: 0.4,
      roughness: 0.15,
      metalness: 0.3,
    });
    const sat4 = new THREE.Mesh(sat4Geo, sat4Mat);
    satGroup.add(sat4);

    // 6. Connected 3D Particle Constellation (240 Particles)
    const particleCount = 240;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.5 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      particlePositions[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);
      particleScales[i] = Math.random() * 0.8 + 0.3;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x22c55e,
      size: 0.08,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    worldGroup.add(particleSystem);

    // 7. Dynamic Data Connection Lines (Curve paths to Core)
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.3,
    });

    const createLine = () => {
      const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1)];
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geom, lineMat);
      worldGroup.add(line);
      return line;
    };

    const dataLine1 = createLine();
    const dataLine2 = createLine();
    const dataLine3 = createLine();
    const dataLine4 = createLine();

    // Mouse Parallax Lerping
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.45;
      targetRotX = y * 0.35;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    // Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = entry.contentRect.width || 520;
        height = entry.contentRect.height || 520;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(container);

    // 8. Animation Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const speed = prefersReduced ? 0.2 : 1.0;

      // Core Breathing & Pulse
      const pulse = 1.0 + Math.sin(elapsedTime * 2.2 * speed) * 0.045;
      outerCoreMesh.scale.set(pulse, pulse, pulse);
      innerCoreMesh.scale.set(1.0 + Math.sin(elapsedTime * 3 * speed) * 0.08, 1.0 + Math.sin(elapsedTime * 3 * speed) * 0.08, 1.0 + Math.sin(elapsedTime * 3 * speed) * 0.08);

      outerCoreMesh.rotation.y = elapsedTime * 0.12 * speed;
      outerCoreMesh.rotation.x = elapsedTime * 0.08 * speed;
      cageMesh.rotation.y = -elapsedTime * 0.15 * speed;

      // Orbital Rings Rotation
      ring1.rotation.z = elapsedTime * 0.25 * speed;
      ring2.rotation.z = -elapsedTime * 0.2 * speed;
      ring3.rotation.y = elapsedTime * 0.18 * speed;

      // Satellite Coordinates along 3D orbits
      const r1 = 3.7;
      const t1 = elapsedTime * 0.45 * speed;
      sat1.position.set(r1 * Math.cos(t1), (r1 * Math.sin(t1)) * Math.cos(ring1.rotation.x), (r1 * Math.sin(t1)) * Math.sin(ring1.rotation.x));
      sat1.rotation.y += 0.02 * speed;

      const r2 = 4.7;
      const t2 = -elapsedTime * 0.38 * speed + 1.2;
      sat2.position.set((r2 * Math.cos(t2)) * Math.cos(ring2.rotation.y), r2 * Math.sin(t2), (r2 * Math.cos(t2)) * Math.sin(ring2.rotation.y));
      sat2.rotation.x += 0.025 * speed;

      const r3 = 5.7;
      const t3 = elapsedTime * 0.3 * speed + 2.5;
      sat3.position.set(r3 * Math.cos(t3), (r3 * Math.sin(t3)) * 0.7, r3 * Math.sin(t3) * 0.6);
      sat3.rotation.z += 0.02 * speed;

      const r4 = 4.2;
      const t4 = -elapsedTime * 0.4 * speed + 4.0;
      sat4.position.set((r4 * Math.cos(t4)) * 0.8, -r4 * Math.sin(t4) * 0.8, r4 * Math.sin(t4));

      // Update Dynamic Connected Vector Lines
      const updateLine = (line: THREE.Line, targetPos: THREE.Vector3) => {
        const positions = line.geometry.attributes.position.array as Float32Array;
        positions[0] = 0;
        positions[1] = 0;
        positions[2] = 0;
        positions[3] = targetPos.x;
        positions[4] = targetPos.y;
        positions[5] = targetPos.z;
        line.geometry.attributes.position.needsUpdate = true;
      };

      updateLine(dataLine1, sat1.position);
      updateLine(dataLine2, sat2.position);
      updateLine(dataLine3, sat3.position);
      updateLine(dataLine4, sat4.position);

      // Particle cloud gentle rotation
      particleSystem.rotation.y = elapsedTime * 0.04 * speed;
      particleSystem.rotation.x = Math.sin(elapsedTime * 0.03 * speed) * 0.05;

      // Mouse Parallax Lerping
      currentRotX += (targetRotX - currentRotX) * 0.06;
      currentRotY += (targetRotY - currentRotY) * 0.06;
      worldGroup.rotation.x = currentRotX;
      worldGroup.rotation.y = currentRotY;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      resizeObserver.disconnect();

      // Dispose Geometries & Materials
      [outerGeo, innerGeo, cageGeo, ring1Geo, ring2Geo, ring3Geo, sat1Geo, sat2Geo, sat3Geo, sat4Geo, particleGeo].forEach((g) => g.dispose());
      [outerMat, innerMat, cageMat, ring1Mat, ring2Mat, ring3Mat, sat1Mat, sat2Mat, sat3Mat, sat4Mat, particleMat, lineMat].forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, [prefersReduced]);

  return (
    <div
      ref={mountRef}
      className="relative w-full max-w-[560px] aspect-square flex items-center justify-center select-none"
    >
      {/* Deep Atmospheric Lighting Glows */}
      <div className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-emerald/20 dark:bg-emerald/30 blur-3xl animate-pulse-breath pointer-events-none -z-10" />
      <div
        className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gold/15 dark:bg-gold/25 blur-2xl animate-pulse-breath pointer-events-none -z-10"
        style={{ animationDelay: '-2.5s' }}
      />

      {/* Real Three.js WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing outline-none"
        title="Interactive 3D Wellness Core - Hover to interact"
      />

      {/* Interactive Satellite Docking Pills (HTML Overlays linked to 3D nodes) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Pillar 1: Nutrition (Top) */}
        <div
          onMouseEnter={() => setActiveSatellite('nutrition')}
          onMouseLeave={() => setActiveSatellite(null)}
          className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer"
        >
          <motion.div
            whileHover={{ scale: 1.08, y: -2 }}
            className={`px-3.5 py-1.5 rounded-full backdrop-blur-md border shadow-card transition-transform flex items-center gap-2 ${
              activeSatellite === 'nutrition'
                ? 'bg-emerald text-white border-emerald shadow-glow-emerald ring-2 ring-emerald/40'
                : 'bg-white/90 dark:bg-[#0A1E17]/90 text-forest dark:text-ivory border-forest/10 dark:border-white/15'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-emerald/15 text-emerald flex items-center justify-center">
              <Utensils className="w-3 h-3 text-emerald" />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-bold uppercase tracking-wider block opacity-75">Nutrition</span>
              <span className="text-xs font-heading font-black tabular-nums">Home Kitchen</span>
            </div>
          </motion.div>
        </div>

        {/* Pillar 2: Movement (Right) */}
        <div
          onMouseEnter={() => setActiveSatellite('movement')}
          onMouseLeave={() => setActiveSatellite(null)}
          className="absolute top-1/2 -right-3 -translate-y-1/2 pointer-events-auto cursor-pointer"
        >
          <motion.div
            whileHover={{ scale: 1.08, x: 2 }}
            className={`px-3.5 py-1.5 rounded-full backdrop-blur-md border shadow-card transition-transform flex items-center gap-2 ${
              activeSatellite === 'movement'
                ? 'bg-gold text-forest border-gold shadow-glow-gold ring-2 ring-gold/40'
                : 'bg-white/90 dark:bg-[#0A1E17]/90 text-forest dark:text-ivory border-forest/10 dark:border-white/15'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-gold/20 text-[#B87A1E] flex items-center justify-center">
              <Activity className="w-3 h-3 text-[#B87A1E]" />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-bold uppercase tracking-wider block opacity-75">Movement</span>
              <span className="text-xs font-heading font-black tabular-nums">Guided Form</span>
            </div>
          </motion.div>
        </div>

        {/* Pillar 3: Baseline (Bottom) */}
        <div
          onMouseEnter={() => setActiveSatellite('baseline')}
          onMouseLeave={() => setActiveSatellite(null)}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer"
        >
          <motion.div
            whileHover={{ scale: 1.08, y: 2 }}
            className={`px-3.5 py-1.5 rounded-full backdrop-blur-md border shadow-card transition-transform flex items-center gap-2 ${
              activeSatellite === 'baseline'
                ? 'bg-forest dark:bg-emerald-dark text-ivory border-emerald shadow-glow-emerald ring-2 ring-emerald/40'
                : 'bg-white/90 dark:bg-[#0A1E17]/90 text-forest dark:text-ivory border-forest/10 dark:border-white/15'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-forest/15 dark:bg-white/15 text-forest dark:text-ivory flex items-center justify-center">
              <Cpu className="w-3 h-3" />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-bold uppercase tracking-wider block opacity-75">Context</span>
              <span className="text-xs font-heading font-black tabular-nums">Shared Memory</span>
            </div>
          </motion.div>
        </div>

        {/* Pillar 4: Guidance (Left) */}
        <div
          onMouseEnter={() => setActiveSatellite('guidance')}
          onMouseLeave={() => setActiveSatellite(null)}
          className="absolute top-1/2 -left-3 -translate-y-1/2 pointer-events-auto cursor-pointer"
        >
          <motion.div
            whileHover={{ scale: 1.08, x: -2 }}
            className={`px-3.5 py-1.5 rounded-full backdrop-blur-md border shadow-card transition-transform flex items-center gap-2 ${
              activeSatellite === 'guidance'
                ? 'bg-emerald text-white border-emerald shadow-glow-emerald ring-2 ring-emerald/40'
                : 'bg-white/90 dark:bg-[#0A1E17]/90 text-forest dark:text-ivory border-forest/10 dark:border-white/15'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-emerald/15 text-emerald flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-emerald" />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-bold uppercase tracking-wider block opacity-75">Safety</span>
              <span className="text-xs font-heading font-black tabular-nums">Health Guardrails</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Active Pillar Telemetry Tooltip */}
      <AnimatePresence>
        {activeSatellite && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-84 p-3.5 rounded-2xl bg-forest dark:bg-[#071914] text-ivory border border-emerald/40 shadow-2xl z-30 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold text-gold">
              {satellites.find((s) => s.id === activeSatellite)?.icon}
              <span>{satellites.find((s) => s.id === activeSatellite)?.title}</span>
            </div>
            <span className="text-xs font-bold text-emerald-light block mt-0.5">
              {satellites.find((s) => s.id === activeSatellite)?.metric}
            </span>
            <p className="text-[11px] text-ivory/75 mt-1 leading-snug">
              {satellites.find((s) => s.id === activeSatellite)?.desc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-Time Trust Micro-Badges */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-10 left-4 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md border border-forest/10 dark:border-white/15 shadow-subtle text-[11px] font-semibold text-forest dark:text-ivory flex items-center gap-1.5 z-10 pointer-events-none"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />
        <span>User-Confirmed Logs</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-12 right-4 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md border border-forest/10 dark:border-white/15 shadow-subtle text-[11px] font-semibold text-forest dark:text-ivory flex items-center gap-1.5 z-10 pointer-events-none"
      >
        <Shield className="w-3.5 h-3.5 text-gold" />
        <span>Zero Video Upload</span>
      </motion.div>
    </div>
  );
};
