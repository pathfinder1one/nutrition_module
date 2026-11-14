import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ExerciseTypeId } from '@/types/wellness';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Play, Pause, RotateCcw, RotateCw, Sparkles, Film, Compass } from 'lucide-react';

export interface KinematicHuman3DProps {
  exerciseType: ExerciseTypeId;
  isActive: boolean;
  className?: string;
}

const EXERCISE_METADATA: Record<
  ExerciseTypeId,
  {
    title: string;
    subtitle: string;
    focusMuscles: string;
    phaseCue: string;
    targetAngle: string;
    breathingCue: string;
    gifUrl: string;
  }
> = {
  squat: {
    title: 'Bodyweight Squat',
    subtitle: 'Hip hinge back first · knees aligned softly over mid-foot',
    focusMuscles: 'Quadriceps · Glutes · Erector Core',
    phaseCue: '2s Controlled Descent → 90° Parallel Hold → Exhale Drive',
    targetAngle: 'Knee Flexion: 90°–100°',
    breathingCue: 'Inhale going down · Exhale pressing up',
    gifUrl: '/previews/squat.gif',
  },
  pushup: {
    title: 'Floor / Incline Push-Up',
    subtitle: 'Straight torso plank · elbows tucked ~45° from ribcage',
    focusMuscles: 'Pectorals · Triceps · Anterior Deltoids · Core',
    phaseCue: '2s Chest Lower → Firm Scapular Brace → Press Cleanly',
    targetAngle: 'Elbow Flexion: 85°–90°',
    breathingCue: 'Inhale on chest descent · Exhale on floor press',
    gifUrl: '/previews/push-up.gif',
  },
  glute_bridge: {
    title: 'Supine Glute Bridge',
    subtitle: 'Ribs softly tucked · drive smoothly through heels',
    focusMuscles: 'Gluteus Maximus · Hamstrings · Lumbar Stabilizers',
    phaseCue: 'Drive Hips Neutral → 1s Top Squeeze → 2s Slow Lower',
    targetAngle: 'Hip Extension: 170°–180°',
    breathingCue: 'Exhale driving hips up · Inhale lowering to mat',
    gifUrl: '/previews/glute-bridge.gif',
  },
  jumping_jack: {
    title: 'Jumping Jack',
    subtitle: 'Light soft landing · overhead arm reach in cadence',
    focusMuscles: 'Calves · Deltoids · Core · Cardiovascular System',
    phaseCue: 'Jump Open Overhead → Soft Ball-of-Foot Return',
    targetAngle: 'Arm Abduction: 170° Overhead',
    breathingCue: 'Rhythmic diaphragmatic breathing',
    gifUrl: '/previews/jumping-jacks.gif',
  },
  lunge: {
    title: 'Forward Lunge',
    subtitle: 'Torso vertical · both front & back knees at 90° angle',
    focusMuscles: 'Quadriceps · Gluteal Complex · Hamstrings',
    phaseCue: 'Step Forward Control → 90° Knee Bend → Drive Back',
    targetAngle: 'Knee Flexion: 90° / 90° Dual Bend',
    breathingCue: 'Inhale stepping down · Exhale pushing back',
    gifUrl: '/previews/lunges.gif',
  },
  bicep_curl: {
    title: 'Standing Bicep Curl',
    subtitle: 'Elbows pinned to ribcage · zero torso swing or momentum',
    focusMuscles: 'Biceps Brachii · Brachialis · Forearms',
    phaseCue: 'Smooth Ascending Curl → 1s Peak Contraction → 2s Negative',
    targetAngle: 'Elbow Curl: 40°–145° Range',
    breathingCue: 'Exhale curling up · Inhale lowering down',
    gifUrl: '/previews/biceps-curl.gif',
  },
  high_knees: {
    title: 'High Knees',
    subtitle: 'Alternate knees driving to waist height with runner arms',
    focusMuscles: 'Iliopsoas · Rectus Abdominis · Calves',
    phaseCue: 'Drive Knee to Hip Level → Light Landing → Rapid Rhythm',
    targetAngle: 'Hip Flexion: 90° at Peak',
    breathingCue: 'Short rhythmic breaths in sync with cadence',
    gifUrl: '/previews/high-knees.gif',
  },
  wall_sit: {
    title: 'Wall Sit',
    subtitle: 'Back flat against wall · thighs parallel to floor',
    focusMuscles: 'Quadriceps · Glutes · Calves',
    phaseCue: 'Hold 90° Knee Angle → Steady Breathing → Push Wall',
    targetAngle: 'Knee & Hip Angle: 90° Isometric',
    breathingCue: 'Slow steady nasal breathing throughout hold',
    gifUrl: '/previews/wall-sit.gif',
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
  const [livePhaseLabel, setLivePhaseLabel] = useState('Animated Demo Loop');
  const [cameraYaw, setCameraYaw] = useState(0.58);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [demoTab, setDemoTab] = useState<'gif' | '3d'>('gif'); // Real Animated GIF by default!

  const meta = EXERCISE_METADATA[exerciseType] || EXERCISE_METADATA.squat;

  useEffect(() => {
    const container = stageRef.current;
    const canvas = canvasRef.current;
    if (!webglReady || !container || !canvas || demoTab !== '3d') return;

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

    const ambient = new THREE.AmbientLight(0xdff5ec, 1.1);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.3);
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 1.6);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const warmFill = new THREE.PointLight(0xe7b76b, 1.3, 12);
    warmFill.position.set(2, 1.4, -2);
    scene.add(warmFill);

    const matGeo = new THREE.CylinderGeometry(1.45, 1.45, 0.025, 48);
    const matMeshMat = new THREE.MeshStandardMaterial({
      color: 0x0d2b22,
      roughness: 0.7,
      metalness: 0.15,
    });
    const studioMat = new THREE.Mesh(matGeo, matMeshMat);
    studioMat.position.y = -0.012;
    scene.add(studioMat);

    const ringGeo = new THREE.RingGeometry(1.45, 1.5, 64);
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
      emissiveIntensity: 0.38,
      roughness: 0.32,
      metalness: 0.22,
    });
    const jointGlowMat = new THREE.MeshStandardMaterial({
      color: 0xe7b76b,
      emissive: 0xd8a252,
      emissiveIntensity: 0.5,
      roughness: 0.24,
      metalness: 0.5,
    });

    const isUpperHighlight =
      exerciseType === 'pushup' ||
      exerciseType === 'bicep_curl' ||
      exerciseType === 'jumping_jack';
    const isLowerHighlight =
      exerciseType === 'squat' ||
      exerciseType === 'glute_bridge' ||
      exerciseType === 'lunge' ||
      exerciseType === 'wall_sit' ||
      exerciseType === 'high_knees';

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

      const forearm = createLimbMesh(
        0.04,
        0.03,
        0.26,
        exerciseType === 'bicep_curl' ? highlightMuscleMat : bodyShellMat
      );
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

      const shin = createLimbMesh(
        0.052,
        0.036,
        0.43,
        isLowerHighlight ? highlightMuscleMat : bodyShellMat
      );
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
      } else if (exerciseType === 'glute_bridge') {
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
      } else if (exerciseType === 'jumping_jack') {
        const bounce = Math.sin(depth01 * Math.PI) * 0.08;
        pelvisGroup.position.set(0, 0.98 + bounce, 0);
        spinePivot.rotation.set(0, 0, 0);

        leftLeg.hipPivot.rotation.set(0, 0, -depth01 * 0.45);
        rightLeg.hipPivot.rotation.set(0, 0, depth01 * 0.45);
        leftLeg.kneePivot.rotation.set(depth01 * 0.15, 0, 0);
        rightLeg.kneePivot.rotation.set(depth01 * 0.15, 0, 0);
        leftLeg.anklePivot.rotation.set(0, 0, -depth01 * 0.15);
        rightLeg.anklePivot.rotation.set(0, 0, depth01 * 0.15);

        leftArm.shoulderPivot.rotation.set(0, 0, -depth01 * 2.5);
        rightArm.shoulderPivot.rotation.set(0, 0, depth01 * 2.5);
        leftArm.elbowPivot.rotation.set(0, 0, -depth01 * 0.25);
        rightArm.elbowPivot.rotation.set(0, 0, depth01 * 0.25);
      } else if (exerciseType === 'lunge') {
        const drop = depth01 * 0.32;
        pelvisGroup.position.set(0, 0.96 - drop, 0);
        spinePivot.rotation.x = depth01 * 0.08;

        leftLeg.hipPivot.rotation.set(-depth01 * 1.35, 0, -0.05);
        leftLeg.kneePivot.rotation.set(depth01 * 1.55, 0, 0);
        leftLeg.anklePivot.rotation.set(-depth01 * 0.25, 0, 0);

        rightLeg.hipPivot.rotation.set(depth01 * 0.5, 0, 0.05);
        rightLeg.kneePivot.rotation.set(depth01 * 1.6, 0, 0);
        rightLeg.anklePivot.rotation.set(-depth01 * 0.85, 0, 0);

        leftArm.shoulderPivot.rotation.set(-0.25 + depth01 * 0.3, 0, -0.18);
        rightArm.shoulderPivot.rotation.set(0.25 - depth01 * 0.3, 0, 0.18);
        leftArm.elbowPivot.rotation.set(-0.5, 0, 0);
        rightArm.elbowPivot.rotation.set(-0.5, 0, 0);
      } else if (exerciseType === 'bicep_curl') {
        pelvisGroup.position.set(0, 0.98, 0);
        spinePivot.rotation.set(0, 0, 0);

        leftLeg.hipPivot.rotation.set(0, 0, -0.06);
        rightLeg.hipPivot.rotation.set(0, 0, 0.06);
        leftLeg.kneePivot.rotation.set(0.04, 0, 0);
        rightLeg.kneePivot.rotation.set(0.04, 0, 0);
        leftLeg.anklePivot.rotation.set(0, 0, 0);
        rightLeg.anklePivot.rotation.set(0, 0, 0);

        leftArm.shoulderPivot.rotation.set(0.04, 0, -0.08);
        rightArm.shoulderPivot.rotation.set(0.04, 0, 0.08);
        const curlAngle = -0.15 - depth01 * 2.15;
        leftArm.elbowPivot.rotation.set(curlAngle, 0, 0);
        rightArm.elbowPivot.rotation.set(curlAngle, 0, 0);
      } else if (exerciseType === 'high_knees') {
        const isLeft = depth01 > 0.5;
        const subPhase = isLeft ? (depth01 - 0.5) * 2 : depth01 * 2;
        const drive = Math.sin(subPhase * Math.PI);
        pelvisGroup.position.set(0, 0.98 + drive * 0.05, 0);
        spinePivot.rotation.x = 0.12;

        if (isLeft) {
          leftLeg.hipPivot.rotation.set(-drive * 1.55, 0, -0.05);
          leftLeg.kneePivot.rotation.set(drive * 1.6, 0, 0);
          leftLeg.anklePivot.rotation.set(-drive * 0.2, 0, 0);

          rightLeg.hipPivot.rotation.set(0.05, 0, 0.05);
          rightLeg.kneePivot.rotation.set(0.08, 0, 0);
          rightLeg.anklePivot.rotation.set(0, 0, 0);

          leftArm.shoulderPivot.rotation.set(drive * 0.7, 0, -0.15);
          rightArm.shoulderPivot.rotation.set(-drive * 0.7, 0, 0.15);
        } else {
          rightLeg.hipPivot.rotation.set(-drive * 1.55, 0, 0.05);
          rightLeg.kneePivot.rotation.set(drive * 1.6, 0, 0);
          rightLeg.anklePivot.rotation.set(-drive * 0.2, 0, 0);

          leftLeg.hipPivot.rotation.set(0.05, 0, -0.05);
          leftLeg.kneePivot.rotation.set(0.08, 0, 0);
          leftLeg.anklePivot.rotation.set(0, 0, 0);

          leftArm.shoulderPivot.rotation.set(-drive * 0.7, 0, -0.15);
          rightArm.shoulderPivot.rotation.set(drive * 0.7, 0, 0.15);
        }
        leftArm.elbowPivot.rotation.set(-1.25, 0, 0);
        rightArm.elbowPivot.rotation.set(-1.25, 0, 0);
      } else if (exerciseType === 'wall_sit') {
        const breath = Math.sin(depth01 * Math.PI * 2) * 0.015;
        pelvisGroup.position.set(0, 0.65 + breath, -0.18);
        spinePivot.rotation.x = 0;

        leftLeg.hipPivot.rotation.set(-1.57, 0, -0.06);
        rightLeg.hipPivot.rotation.set(-1.57, 0, 0.06);
        leftLeg.kneePivot.rotation.set(1.57, 0, 0);
        rightLeg.kneePivot.rotation.set(1.57, 0, 0);
        leftLeg.anklePivot.rotation.set(0, 0, 0);
        rightLeg.anklePivot.rotation.set(0, 0, 0);

        leftArm.shoulderPivot.rotation.set(-0.55, 0, -0.18);
        rightArm.shoulderPivot.rotation.set(-0.55, 0, 0.18);
        leftArm.elbowPivot.rotation.set(-1.15, 0, 0);
        rightArm.elbowPivot.rotation.set(-1.15, 0, 0);
      }
    };

    const clock = new THREE.Clock();
    let rafId = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      let depth01 = 0.5;
      const shouldAnimate = (isPlaying || isActive) && !prefersReduced;

      if (shouldAnimate) {
        let speed = 1.85 * playbackSpeed;
        if (exerciseType === 'high_knees' || exerciseType === 'jumping_jack') {
          speed = 2.85 * playbackSpeed;
        } else if (exerciseType === 'wall_sit') {
          speed = 0.9 * playbackSpeed;
        }

        const raw = Math.sin(elapsed * speed);
        depth01 = (raw + 1) / 2;

        let phase = 'Active Form Tempo';
        if (exerciseType === 'wall_sit') {
          phase = 'Isometric Hold (90° Quads)';
        } else if (exerciseType === 'jumping_jack') {
          phase = depth01 > 0.6 ? 'Star Jump Open' : 'Cadence Return In';
        } else if (exerciseType === 'high_knees') {
          phase = depth01 > 0.5 ? 'Right Knee Drive' : 'Left Knee Drive';
        } else if (exerciseType === 'bicep_curl') {
          phase =
            depth01 > 0.8
              ? 'Peak Bicep Squeeze'
              : Math.cos(elapsed * speed) >= 0
                ? 'Ascending Curl'
                : 'Controlled Negative';
        } else if (exerciseType === 'lunge') {
          phase =
            depth01 > 0.8
              ? '90° Lunge Depth'
              : Math.cos(elapsed * speed) >= 0
                ? 'Controlled Descent'
                : 'Drive Back Up';
        } else {
          phase =
            depth01 > 0.85
              ? 'Peak Hold'
              : Math.cos(elapsed * speed) >= 0
                ? 'Controlled Lower'
                : 'Drive & Exhale';
        }
        setLivePhaseLabel(phase);
      } else {
        setLivePhaseLabel(prefersReduced ? 'Reduced-Motion Pose' : 'Paused Form');
      }

      applyPose(depth01);

      let targetCamRadius = 4.3;
      let camY = 1.45;
      let lookY = 0.65;

      if (exerciseType === 'squat') {
        targetCamRadius = 4.45;
        camY = 1.55;
        lookY = 0.68;
      } else if (exerciseType === 'pushup') {
        targetCamRadius = 3.85;
        camY = 1.25;
        lookY = 0.35;
      } else if (exerciseType === 'glute_bridge') {
        targetCamRadius = 3.9;
        camY = 1.35;
        lookY = 0.38;
      } else if (exerciseType === 'bicep_curl') {
        targetCamRadius = 4.0;
        camY = 1.5;
        lookY = 0.85;
      } else if (exerciseType === 'jumping_jack' || exerciseType === 'high_knees') {
        targetCamRadius = 4.65;
        camY = 1.6;
        lookY = 0.85;
      } else if (exerciseType === 'wall_sit') {
        targetCamRadius = 4.2;
        camY = 1.4;
        lookY = 0.65;
      }

      const angle =
        cameraYaw +
        (shouldAnimate && playbackSpeed === 1 ? Math.sin(elapsed * 0.35) * 0.12 : 0);
      camera.position.set(
        Math.sin(angle) * targetCamRadius,
        camY,
        Math.cos(angle) * targetCamRadius
      );
      camera.lookAt(0, lookY, 0);

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
  }, [
    webglReady,
    exerciseType,
    isActive,
    prefersReduced,
    cameraYaw,
    isPlaying,
    playbackSpeed,
    demoTab,
  ]);

  return (
    <div
      className={`w-full h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-forest/5 via-forest/2 to-forest/10 dark:from-black/40 dark:via-black/20 dark:to-black/50 ${className}`}
    >
      {/* Top Controls Toolbar: Tab Switcher & Playback Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-2.5 z-10 border-b border-forest/10 dark:border-white/10 pb-2">
        {/* Demo Mode Toggle: Real Animated GIF vs 3D Biomechanical */}
        <div className="inline-flex rounded-xl p-0.5 bg-forest/10 dark:bg-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setDemoTab('gif')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              demoTab === 'gif'
                ? 'bg-emerald text-white font-bold shadow-sm'
                : 'text-forest/80 dark:text-ivory/80 hover:text-forest dark:hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-white" />
            <span>Animated Demo GIF</span>
          </button>
          <button
            type="button"
            onClick={() => setDemoTab('3d')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              demoTab === '3d'
                ? 'bg-forest text-white dark:bg-emerald dark:text-forest font-bold shadow-sm'
                : 'text-forest/80 dark:text-ivory/80 hover:text-forest dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>3D Biomechanical</span>
          </button>
        </div>

        {/* Status Badge & 3D Orbit Controls */}
        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full bg-forest/85 dark:bg-black/75 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald/25 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            {demoTab === 'gif' ? 'Official Exercise GIF' : livePhaseLabel}
          </span>

          {demoTab === '3d' && (
            <>
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className={`p-1.5 rounded-lg border transition-all ${
                  isPlaying
                    ? 'bg-emerald text-white border-emerald'
                    : 'bg-white/80 dark:bg-white/10 text-forest dark:text-ivory border-forest/15 dark:border-white/15'
                }`}
                title={isPlaying ? 'Pause 3D Loop' : 'Play 3D Loop'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              <button
                type="button"
                onClick={() => setPlaybackSpeed((s) => (s === 1 ? 0.5 : 1))}
                className="px-2 py-1 rounded-lg bg-white/80 dark:bg-white/10 text-[10px] font-bold text-forest dark:text-ivory border border-forest/15 dark:border-white/15 hover:border-emerald/40"
                title="Toggle Slow Motion (0.5x) vs Normal (1x)"
              >
                {playbackSpeed}x
              </button>

              <button
                type="button"
                onClick={() => setCameraYaw((y) => y - 0.55)}
                className="p-1.5 rounded-lg bg-white/80 dark:bg-white/10 text-forest dark:text-ivory border border-forest/15 dark:border-white/15 hover:bg-emerald hover:text-white transition-colors"
                title="Rotate 3D view left"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCameraYaw((y) => y + 0.55)}
                className="p-1.5 rounded-lg bg-white/80 dark:bg-white/10 text-forest dark:text-ivory border border-forest/15 dark:border-white/15 hover:bg-emerald hover:text-white transition-colors"
                title="Rotate 3D view right"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Visual Arena: Real Animated Exercise GIF OR 3D Three.js Mannequin */}
      {demoTab === 'gif' ? (
        <div className="relative flex-1 min-h-[250px] sm:min-h-[290px] w-full p-3 flex flex-col items-center justify-center">
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl bg-white dark:bg-[#071913] border border-emerald/25 shadow-lg flex items-center justify-center overflow-hidden p-2 group">
            <img
              src={meta.gifUrl}
              alt={`${meta.title} animation`}
              className="w-full h-full object-contain rounded-xl select-none"
            />
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-forest/85 dark:bg-black/85 text-[10px] font-bold text-emerald-300 border border-emerald/30 shadow-sm flex items-center gap-1 backdrop-blur-sm">
              <Film className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>LOOPING GIF</span>
            </div>
            <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-white/15">
              {meta.targetAngle}
            </div>
          </div>
          <div className="mt-2 text-center space-y-0.5">
            <p className="text-xs font-bold text-forest dark:text-white flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald" />
              {meta.phaseCue}
            </p>
            <p className="text-[11px] text-forest/70 dark:text-ivory/70">
              {meta.breathingCue}
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={stageRef}
          className="relative flex-1 min-h-[250px] sm:min-h-[290px] w-full flex items-center justify-center"
        >
          {webglReady ? (
            <canvas
              ref={canvasRef}
              aria-label={`${meta.title} interactive 3D human form visualization`}
              className="w-full h-full block cursor-grab active:cursor-grabbing"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-xs text-forest/75 dark:text-ivory/80">
              <p className="font-bold text-sm">{meta.title}</p>
              <p className="mt-1">{meta.phaseCue}</p>
            </div>
          )}

          <div className="absolute bottom-2 left-3 pointer-events-none flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-emerald-300 border border-emerald/20">
              {meta.targetAngle}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-amber-300 border border-amber/20">
              {meta.breathingCue}
            </span>
          </div>
        </div>
      )}

      {/* Docked Biomechanical Footer */}
      <div className="px-3.5 py-2.5 border-t border-forest/10 dark:border-white/10 bg-forest/5 dark:bg-white/5 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-forest dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald" />
            {meta.title}
          </p>
          <p className="text-forest/70 dark:text-ivory/70 text-[10px] sm:text-[11px]">
            {meta.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald/15 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald/20">
            Focus: {meta.focusMuscles}
          </span>
        </div>
      </div>
    </div>
  );
};
