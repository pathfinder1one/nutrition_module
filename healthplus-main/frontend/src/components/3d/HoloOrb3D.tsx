import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Bot } from 'lucide-react';
import type { VoicePhase } from '@/hooks/useVoiceCompanion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface HoloOrb3DProps {
  className?: string;
  reactivePhase?: VoicePhase;
}

function hasWebGLContext(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return Boolean(
      c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

export const HoloOrb3D: React.FC<HoloOrb3DProps> = ({
  className = '',
  reactivePhase = 'idle',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<VoicePhase>(reactivePhase);
  const prefersReduced = useReducedMotion();
  const [webglReady] = useState<boolean>(() => hasWebGLContext());

  useEffect(() => {
    phaseRef.current = reactivePhase;
  }, [reactivePhase]);

  useEffect(() => {
    const container = mountRef.current;
    const canvas = canvasRef.current;
    if (!webglReady || !container || !canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
    } catch {
      return;
    }

    const width = container.clientWidth || 160;
    const height = container.clientHeight || 160;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 5.2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x22c55e, 3.2, 16);
    pointLight1.position.set(2.5, 2.5, 2.5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xe7b76b, 2.8, 16);
    pointLight2.position.set(-2.5, -2.5, 2.5);
    scene.add(pointLight2);

    const coreGeo = new THREE.IcosahedronGeometry(1.12, 3);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x187a5b,
      emissive: 0x10b981,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.65,
      wireframe: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const wireGeo = new THREE.IcosahedronGeometry(1.24, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const wireShell = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireShell);

    const ringGeo = new THREE.TorusGeometry(1.58, 0.032, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xe7b76b,
      emissive: 0xe7b76b,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.85,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.y = Math.PI / 2.5;
    scene.add(ring2);

    // Subtle orbiting intelligence particles
    const pCount = 26;
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / pCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 1.95;
      pPositions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
      pPositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      pPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xa7f3d0,
      size: 0.065,
      transparent: true,
      opacity: 0.78,
    });
    const haloParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(haloParticles);

    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const phase = phaseRef.current;

      const speedMult =
        prefersReduced
          ? 0.08
          : phase === 'thinking'
            ? 2.2
            : phase === 'speaking'
              ? 1.7
              : phase === 'listening'
                ? 1.35
                : 0.65;

      core.rotation.y = t * 0.45 * speedMult;
      core.rotation.x = t * 0.25 * speedMult;

      wireShell.rotation.y = -t * 0.35 * speedMult;
      wireShell.rotation.z = t * 0.2 * speedMult;

      ring1.rotation.y = t * 0.8 * speedMult;
      ring1.rotation.z = t * 0.3 * speedMult;
      ring2.rotation.x = t * 0.75 * speedMult;
      haloParticles.rotation.y = -t * 0.28 * speedMult;

      // Subtle phase-reactive color & breathing amplitude
      if (phase === 'listening') {
        coreMat.emissive.setHex(0x06b6d4);
        wireMat.color.setHex(0x67e8f9);
        const pulse = 1 + Math.sin(t * 6) * (prefersReduced ? 0.01 : 0.07);
        core.scale.set(pulse, pulse, pulse);
      } else if (phase === 'thinking') {
        coreMat.emissive.setHex(0xe7b76b);
        wireMat.color.setHex(0xfde68a);
        const pulse = 1 + Math.sin(t * 7) * (prefersReduced ? 0.01 : 0.06);
        core.scale.set(pulse, pulse, pulse);
      } else if (phase === 'speaking') {
        coreMat.emissive.setHex(0x22c55e);
        wireMat.color.setHex(0x86efac);
        const pulse = 1 + Math.sin(t * 9) * (prefersReduced ? 0.01 : 0.09);
        core.scale.set(pulse, pulse, pulse);
      } else {
        coreMat.emissive.setHex(0x10b981);
        wireMat.color.setHex(0x6ee7b7);
        const pulse = 1 + Math.sin(t * 2) * (prefersReduced ? 0.01 : 0.03);
        core.scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 160;
      const h = container.clientHeight || 160;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [webglReady, prefersReduced]);

  return (
    <div ref={mountRef} className={`relative flex items-center justify-center ${className}`}>
      {webglReady ? (
        <canvas ref={canvasRef} className="w-full h-full block" />
      ) : (
        <div className="w-full h-full rounded-full bg-emerald/15 border border-emerald/35 flex items-center justify-center">
          <Bot className="w-6 h-6 text-emerald dark:text-gold" />
        </div>
      )}
    </div>
  );
};
