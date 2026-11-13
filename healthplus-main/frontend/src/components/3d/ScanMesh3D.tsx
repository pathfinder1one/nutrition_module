import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export const ScanMesh3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const container = mountRef.current;
    if (!container || prefersReduced) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 240;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 1. 3D Scanning Platter (Cylinder Plate)
    const plateGeo = new THREE.CylinderGeometry(2.2, 2.0, 0.15, 32);
    const plateMat = new THREE.MeshPhysicalMaterial({
      color: 0x187a5b,
      metalness: 0.2,
      roughness: 0.2,
      transmission: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    scene.add(plate);

    // 2. Dish Geometric Cluster (Representing Dal, Rice, Veg on Plate)
    const dishGroup = new THREE.Group();

    // Dish 1: Main Lentils (Emerald Polyhedron)
    const dish1Geo = new THREE.DodecahedronGeometry(0.55, 0);
    const dish1Mat = new THREE.MeshStandardMaterial({
      color: 0x187a5b,
      roughness: 0.3,
      metalness: 0.1,
      emissive: 0x0a3828,
    });
    const dish1 = new THREE.Mesh(dish1Geo, dish1Mat);
    dish1.position.set(-0.8, 0.35, -0.4);
    dishGroup.add(dish1);

    // Dish 2: Grain / Rice mound (Warm Ivory Icosahedron)
    const dish2Geo = new THREE.IcosahedronGeometry(0.65, 1);
    const dish2Mat = new THREE.MeshStandardMaterial({
      color: 0xfaf9f5,
      roughness: 0.4,
      metalness: 0.05,
    });
    const dish2 = new THREE.Mesh(dish2Geo, dish2Mat);
    dish2.position.set(0.7, 0.38, 0.3);
    dishGroup.add(dish2);

    // Dish 3: Paneer / Veg cube (Gold Octahedron)
    const dish3Geo = new THREE.OctahedronGeometry(0.48, 0);
    const dish3Mat = new THREE.MeshStandardMaterial({
      color: 0xe7b76b,
      metalness: 0.2,
      roughness: 0.25,
      emissive: 0x473210,
    });
    const dish3 = new THREE.Mesh(dish3Geo, dish3Mat);
    dish3.position.set(-0.3, 0.32, 0.9);
    dishGroup.add(dish3);

    scene.add(dishGroup);

    // 3. Scanning Laser Grid Plane
    const scanRingGeo = new THREE.RingGeometry(0.1, 2.4, 32);
    const scanRingMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    const scanRing = new THREE.Mesh(scanRingGeo, scanRingMat);
    scanRing.rotation.x = Math.PI / 2;
    scanRing.position.y = 0.4;
    scene.add(scanRing);

    // 4. Optical Particle Dust
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = Math.random() * 2.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xe7b76b,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x22c55e, 2.5);
    dirLight.position.set(3, 6, 4);
    scene.add(dirLight);

    const goldLight = new THREE.PointLight(0xe7b76b, 3, 10);
    goldLight.position.set(-3, 2, -2);
    scene.add(goldLight);

    // Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow rotation of dish cluster
      dishGroup.rotation.y = elapsedTime * 0.45;
      plate.rotation.y = elapsedTime * 0.15;

      // Scanning ring moves up and down
      scanRing.position.y = 0.2 + Math.sin(elapsedTime * 2.2) * 0.6;
      scanRing.rotation.z = elapsedTime * 0.8;

      // Floating particles
      particles.rotation.y = elapsedTime * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
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
      cancelAnimationFrame(animationId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      plateGeo.dispose();
      plateMat.dispose();
      dish1Geo.dispose();
      dish1Mat.dispose();
      dish2Geo.dispose();
      dish2Mat.dispose();
      dish3Geo.dispose();
      dish3Mat.dispose();
      scanRingGeo.dispose();
      scanRingMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [prefersReduced]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[260px] flex items-center justify-center pointer-events-none ${className}`}
      aria-label="3D Optical Food Scanner Mesh"
    />
  );
};
