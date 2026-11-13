import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export const KinematicStage3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const container = mountRef.current;
    if (!container || prefersReduced) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 4.5);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 1. Perspective Motion Grid Plane
    const grid = new THREE.GridHelper(6, 12, 0x187a5b, 0x113b2e);
    grid.position.y = -0.6;
    scene.add(grid);

    // 2. Center Biomechanical Focus Stage (Concentric Glow Rings)
    const ringGeo = new THREE.RingGeometry(0.8, 1.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.58;
    scene.add(ring);

    // 3. Angular Joint Reference Gizmo (3D Gyro Indicator)
    const gyroGroup = new THREE.Group();
    gyroGroup.position.set(1.4, 1.2, -0.5);

    const gyroRingGeo = new THREE.TorusGeometry(0.35, 0.015, 12, 32);
    const gyroRingMatX = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const gyroRingMatY = new THREE.MeshBasicMaterial({ color: 0xe7b76b });
    const gyroRingMatZ = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const gX = new THREE.Mesh(gyroRingGeo, gyroRingMatX);
    const gY = new THREE.Mesh(gyroRingGeo, gyroRingMatY);
    gY.rotation.x = Math.PI / 2;
    const gZ = new THREE.Mesh(gyroRingGeo, gyroRingMatZ);
    gZ.rotation.y = Math.PI / 2;

    gyroGroup.add(gX);
    gyroGroup.add(gY);
    gyroGroup.add(gZ);
    scene.add(gyroGroup);

    // 4. Ambient light
    const amb = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(amb);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow rotation of stage elements
      ring.rotation.z = t * 0.2;
      gyroGroup.rotation.x = t * 0.4;
      gyroGroup.rotation.y = t * 0.6;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      grid.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      gyroRingGeo.dispose();
      gyroRingMatX.dispose();
      gyroRingMatY.dispose();
      gyroRingMatZ.dispose();
    };
  }, [prefersReduced]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[160px] pointer-events-none ${className}`}
      aria-label="3D Kinematic Pose Stage"
    />
  );
};
