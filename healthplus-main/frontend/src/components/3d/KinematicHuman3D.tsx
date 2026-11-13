import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ExerciseTypeId } from '@/types/wellness';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface KinematicHuman3DProps {
  exerciseType: ExerciseTypeId;
  isActive: boolean;
  className?: string;
}

const EXERCISE_METADATA: Record<
  ExerciseTypeId,
  { title: string; subtitle: string; focusMuscles: string; phaseCue: string }
> = {
  squat: {
    title: 'Bodyweight Squat (3D Biomechanical Tempo)',
    subtitle: 'Hip hinge back first · knees aligned softly over mid-foot',
    focusMuscles: 'Quadriceps · Glutes · Erector Core',
    phaseCue: '2s Controlled Descent → Brief Parallel Hold → Exhale Up',
  },
  pushup: {
    title: 'Incline / Floor Push-Up (3D Biomechanical Tempo)',
    subtitle: 'Straight torso plank · elbows tucked ~45° from ribcage',
    focusMuscles: 'Pectorals · Triceps · Anterior Deltoid · Core',
    phaseCue: '2s Chest Lower → Firm Scapula Brace → Press Cleanly',
  },
  glute_bridge: {
    title: 'Supine Glute Bridge (3D Biomechanical Tempo)',
    subtitle: 'Ribs softly tucked · drive smoothly through heels',
    focusMuscles: 'Gluteus Maximus · Hamstrings · Lumbar Stabilizers',
    phaseCue: 'Drive Hips Neutral → 1s Top Hold → 2s Slow Lower',
  },
};

function createLimbMesh(
  topR: number,
  bottomR: number,
  length: number,
  material: THREE.Material
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(topR, bottomR, length, 20);
  geo.translate(0, -length / 2, 0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function checkWebglSupport(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const testCanvas = document.createElement('canvas');
    return Boolean(
      testCanvas.getContext('webgl2') ||
        testCanvas.getContext('webgl') ||
        testCanvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

export const KinematicHuman3D: React.FC<KinematicHuman3DProps> = ({
  exerciseType,
  isActive,
  className = '',
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReduced = useReducedMotion();

  const [webglReady] = useState<boolean>(() => checkWebglSupport());
  const [livePhaseLabel, setLivePhaseLabel] = useState('Ready Pose');
  const [cameraYaw, setCameraYaw] = useState(0.58);

  const meta = EXERCISE_METADATA[exerciseType];

  useEffect(() => {
    const container = stageRef.current;
    const canvas = canvasRef.current;
    if (!webglReady || !container || !canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 280;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);

    // Three-point studio lighting
    const ambient = new THREE.AmbientLight(0xdff5ec, 0.95);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.2);
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 1.5);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const warmFill = new THREE.PointLight(0xe7b76b, 1.25, 12);
    warmFill.position.set(2, 1.4, -2);
    scene.add(warmFill);

    // Studio floor platform & emerald cadence ring
    const matGeo = new THREE.CylinderGeometry(1.42, 1.42, 0.025, 48);
    const matMeshMat = new THREE.MeshStandardMaterial({
      color: 0x0d2b22,
      roughness: 0.7,
      metalness: 0.15,
    });
    const studioMat = new THREE.Mesh(matGeo, matMeshMat);
    studioMat.position.y = -0.012;
    scene.add(studioMat);

    const ringGeo = new THREE.RingGeometry(1.43, 1.48, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const studioRing = new THREE.Mesh(ringGeo, ringMat);
    studioRing.rotation.x = -Math.PI / 2;
    studioRing.position.y = 0.004;
    scene.add(studioRing);

    const bodyShellMat = new THREE.MeshStandardMaterial({
      color: 0x16382f,
      roughness: 0.36,
      metalness: 0.28,
    });
    const highlightMuscleMat = new THREE.MeshStandardMaterial({
      color: 0x1e8f6b,
      emissive: 0x10b981,
      emissiveIntensity: 0.34,
      roughness: 0.32,
      metalness: 0.22,
    });
    const jointGlowMat = new THREE.MeshStandardMaterial({
      color: 0xe7b76b,
      emissive: 0xd8a252,
      emissiveIntensity: 0.45,
      roughness: 0.24,
      metalness: 0.5,
    });

    const isUpperHighlight = exerciseType === 'pushup';
    const isLowerHighlight = exerciseType === 'squat' || exerciseType === 'glute_bridge';

    const skeletonRoot = new THREE.Group();
    scene.add(skeletonRoot);

    const pelvisGroup = new THREE.Group();
    pelvisGroup.position.set(0, 0.98, 0);
    skeletonRoot.add(pelvisGroup);

    const pelvisMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.145, 0.12, 10, 20),
      isLowerHighlight ? highlightMuscleMat : bodyShellMat
    );
    pelvisMesh.rotation.z = Math.PI / 2;
    pelvisGroup.add(pelvisMesh);

    const spinePivot = new THREE.Group();
    spinePivot.position.set(0, 0.08, 0);
    pelvisGroup.add(spinePivot);

    const abdomenMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.125, 0.28, 20),
      bodyShellMat
    );
    abdomenMesh.position.y = 0.14;
    spinePivot.add(abdomenMesh);

    const chestGroup = new THREE.Group();
    chestGroup.position.set(0, 0.31, 0);
    spinePivot.add(chestGroup);

    const torsoMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.175, 0.16, 12, 22),
      isUpperHighlight ? highlightMuscleMat : bodyShellMat
    );
    torsoMesh.scale.set(1.12, 1, 0.72);
    torsoMesh.position.y = 0.11;
    chestGroup.add(torsoMesh);

    const neckMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.06, 0.1, 16),
      bodyShellMat
    );
    neckMesh.position.set(0, 0.28, 0);
    chestGroup.add(neckMesh);

    const headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.112, 24, 24),
      bodyShellMat
    );
    headMesh.scale.set(0.92, 1.08, 0.98);
    headMesh.position.set(0, 0.42, 0.01);
    chestGroup.add(headMesh);

    const buildArm = (side: -1 | 1) => {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(side * 0.22, 0.2, 0);
      chestGroup.add(shoulderPivot);

      const shoulderCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.058, 16, 16),
        jointGlowMat
      );
      shoulderPivot.add(shoulderCap);

      const upperArm = createLimbMesh(
        0.048,
        0.04,
        0.29,
        isUpperHighlight ? highlightMuscleMat : bodyShellMat
      );
      shoulderPivot.add(upperArm);

      const elbowPivot = new THREE.Group();
      elbowPivot.position.set(0, -0.29, 0);
      shoulderPivot.add(elbowPivot);

      const elbowCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 14, 14),
        jointGlowMat
      );
      elbowPivot.add(elbowCap);

      const forearm = createLimbMesh(0.04, 0.03, 0.26, bodyShellMat);
      elbowPivot.add(forearm);

      const handMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.036, 12, 12),
        bodyShellMat
      );
      handMesh.position.set(0, -0.27, 0);
      elbowPivot.add(handMesh);

      return { shoulderPivot, elbowPivot };
    };

    const leftArm = buildArm(-1);
    const rightArm = buildArm(1);

    const buildLeg = (side: -1 | 1) => {
      const hipPivot = new THREE.Group();
      hipPivot.position.set(side * 0.115, -0.02, 0);
      pelvisGroup.add(hipPivot);

      const hipCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.056, 14, 14),
        jointGlowMat
      );
      hipPivot.add(hipCap);

      const thigh = createLimbMesh(
        0.072,
        0.054,
        0.44,
        isLowerHighlight ? highlightMuscleMat : bodyShellMat
      );
      hipPivot.add(thigh);

      const kneePivot = new THREE.Group();
      kneePivot.position.set(0, -0.44, 0);
      hipPivot.add(kneePivot);

      const kneeCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 14, 14),
        jointGlowMat
      );
      kneePivot.add(kneeCap);

      const shin = createLimbMesh(0.052, 0.036, 0.43, bodyShellMat);
      kneePivot.add(shin);

      const anklePivot = new THREE.Group();
      anklePivot.position.set(0, -0.43, 0);
      kneePivot.add(anklePivot);

      const footMesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.036, 0.11, 8, 14),
        bodyShellMat
      );
      footMesh.rotation.x = Math.PI / 2;
      footMesh.position.set(0, -0.025, 0.055);
      anklePivot.add(footMesh);

      return { hipPivot, kneePivot, anklePivot };
    };

    const leftLeg = buildLeg(-1);
    const rightLeg = buildLeg(1);

    const applyPose = (depth01: number) => {
      skeletonRoot.rotation.set(0, 0, 0);
      skeletonRoot.position.set(0, 0, 0);
      spinePivot.rotation.set(0, 0, 0);

      if (exerciseType === 'squat') {
        const drop = depth01 * 0.34;
        pelvisGroup.position.set(0, 0.96 - drop, -depth01 * 0.14);
        spinePivot.rotation.x = depth01 * 0.34;

        const hipFlex = -depth01 * 1.25;
        const kneeBend = depth01 * 1.65;
        const ankleBend = -depth01 * 0.4;

        leftLeg.hipPivot.rotation.set(hipFlex, 0.08, -0.04);
        rightLeg.hipPivot.rotation.set(hipFlex, -0.08, 0.04);
        leftLeg.kneePivot.rotation.set(kneeBend, 0, 0);
        rightLeg.kneePivot.rotation.set(kneeBend, 0, 0);
        leftLeg.anklePivot.rotation.set(ankleBend, 0, 0);
        rightLeg.anklePivot.rotation.set(ankleBend, 0, 0);

        leftArm.shoulderPivot.rotation.set(-depth01 * 1.35 - 0.15, 0, -0.1);
        rightArm.shoulderPivot.rotation.set(-depth01 * 1.35 - 0.15, 0, 0.1);
        leftArm.elbowPivot.rotation.set(-0.22, 0, 0);
        rightArm.elbowPivot.rotation.set(-0.22, 0, 0);
      } else if (exerciseType === 'pushup') {
        const plankTilt = 1.48 - depth01 * 0.24;
        skeletonRoot.position.set(0, 0.22 - depth01 * 0.15, 0.15);
        skeletonRoot.rotation.x = plankTilt;
        pelvisGroup.position.set(0, 0.65, 0);
        spinePivot.rotation.x = 0.03;

        leftLeg.hipPivot.rotation.set(0.05, 0, -0.03);
        rightLeg.hipPivot.rotation.set(0.05, 0, 0.03);
        leftLeg.kneePivot.rotation.set(0.06, 0, 0);
        rightLeg.kneePivot.rotation.set(0.06, 0, 0);
        leftLeg.anklePivot.rotation.set(-1.3, 0, 0);
        rightLeg.anklePivot.rotation.set(-1.3, 0, 0);

        leftArm.shoulderPivot.rotation.set(-1.45 - depth01 * 0.45, -0.3, -0.35);
        rightArm.shoulderPivot.rotation.set(-1.45 - depth01 * 0.45, 0.3, 0.35);
        leftArm.elbowPivot.rotation.set(-0.15 - depth01 * 1.35, 0, 0);
        rightArm.elbowPivot.rotation.set(-0.15 - depth01 * 1.35, 0, 0);
      } else {
        skeletonRoot.position.set(0, 0.16, -0.15);
        skeletonRoot.rotation.x = -1.52;
        pelvisGroup.position.set(0, 0.65, depth01 * 0.26);
        spinePivot.rotation.x = depth01 * 0.26;

        leftLeg.hipPivot.rotation.set(0.75 + depth01 * 0.55, 0.05, -0.04);
        rightLeg.hipPivot.rotation.set(0.75 + depth01 * 0.55, -0.05, 0.04);
        leftLeg.kneePivot.rotation.set(1.52 - depth01 * 0.18, 0, 0);
        rightLeg.kneePivot.rotation.set(1.52 - depth01 * 0.18, 0, 0);
        leftLeg.anklePivot.rotation.set(0.1, 0, 0);
        rightLeg.anklePivot.rotation.set(0.1, 0, 0);

        leftArm.shoulderPivot.rotation.set(0.08, 0, -0.18);
        rightArm.shoulderPivot.rotation.set(0.08, 0, 0.18);
        leftArm.elbowPivot.rotation.set(-0.1, 0, 0);
        rightArm.elbowPivot.rotation.set(-0.1, 0, 0);
      }
    };

    const clock = new THREE.Clock();
    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      let depth01 = 0.72;
      if (isActive && !prefersReduced) {
        const raw = Math.sin(elapsed * 1.95);
        depth01 = (raw + 1) / 2;
        const phase =
          depth01 > 0.85
            ? 'Peak Hold'
            : Math.cos(elapsed * 1.95) >= 0
              ? 'Slow Lowering'
              : 'Drive & Exhale';
        setLivePhaseLabel(phase);
      } else {
        setLivePhaseLabel(prefersReduced ? 'Reduced-Motion Pose' : 'Paused');
      }

      applyPose(depth01);

      const targetCamRadius = exerciseType === 'squat' ? 4.45 : 3.85;
      const angle = cameraYaw + (isActive && !prefersReduced ? Math.sin(elapsed * 0.35) * 0.14 : 0);
      camera.position.set(
        Math.sin(angle) * targetCamRadius,
        exerciseType === 'squat' ? 1.55 : 1.35,
        Math.cos(angle) * targetCamRadius
      );
      camera.lookAt(0, exerciseType === 'squat' ? 0.68 : 0.38, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 440;
      const h = container.clientHeight || 280;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      matGeo.dispose();
      ringGeo.dispose();
      bodyShellMat.dispose();
      highlightMuscleMat.dispose();
      jointGlowMat.dispose();
    };
  }, [webglReady, exerciseType, isActive, prefersReduced, cameraYaw]);

  return (
    <div className={`w-full h-full flex flex-col justify-between overflow-hidden rounded-2xl ${className}`}>
      {/* Right-aligned controls cleanly separated below card header badge */}
      <div className="flex items-center justify-end gap-2 px-1.5 pt-1 z-10">
        <span className="px-2.5 py-0.5 rounded-full bg-forest/85 dark:bg-black/45 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald/25">
          {livePhaseLabel}
        </span>
        <button
          type="button"
          onClick={() => setCameraYaw((y) => y - 0.55)}
          className="px-2 py-0.5 rounded-lg bg-forest/75 dark:bg-white/10 text-[10px] font-semibold text-white hover:bg-emerald transition-colors"
          title="Rotate 3D view left"
        >
          ⟲
        </button>
        <button
          type="button"
          onClick={() => setCameraYaw((y) => y + 0.55)}
          className="px-2 py-0.5 rounded-lg bg-forest/75 dark:bg-white/10 text-[10px] font-semibold text-white hover:bg-emerald transition-colors"
          title="Rotate 3D view right"
        >
          ⟳
        </button>
      </div>

      {/* Dedicated 3D Stage Box (never overlapped by footer text or blurry panels) */}
      <div ref={stageRef} className="relative flex-1 min-h-[240px] sm:min-h-[270px] w-full">
        {webglReady ? (
          <canvas
            ref={canvasRef}
            aria-label={`${meta.title} interactive 3D human form visualization`}
            className="w-full h-full block pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-xs text-forest/75 dark:text-ivory/80">
            <p className="font-bold text-sm">{meta.title}</p>
            <p className="mt-1">{meta.phaseCue}</p>
          </div>
        )}
      </div>

      {/* Clean Docked Biomechanical Footer Below 3D Stage */}
      <div className="px-3.5 py-2.5 border-t border-forest/10 dark:border-white/10 bg-forest/4 dark:bg-white/5 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-forest dark:text-white">{meta.title}</p>
          <p className="text-forest/70 dark:text-ivory/75">{meta.subtitle}</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald/15 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]">
          Focus: {meta.focusMuscles}
        </span>
      </div>
    </div>
  );
};
