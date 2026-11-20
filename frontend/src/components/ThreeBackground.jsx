import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ThreeBackground
 * 3D Floating Supply Chain & Medical Node Network using Three.js
 * Palette: #2c2e35 (Charcoal), #2a3f3f (Teal), #467750 (Forest),
 *          #89c07e (Mint), #e0e8e2 (Misty White), #f0cd6e (Honey Gold)
 */
export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 24;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent to show gradient backdrop
    container.appendChild(renderer.domElement);

    // Color definitions from user palette
    const PALETTE = {
      charcoal: 0x2c2e35,
      teal: 0x2a3f3f,
      forest: 0x467750,
      mint: 0x89c07e,
      mist: 0xe0e8e2,
      gold: 0xf0cd6e,
    };

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight(PALETTE.gold, 3.5, 60);
    goldLight.position.set(12, 10, 15);
    scene.add(goldLight);

    const mintLight = new THREE.PointLight(PALETTE.mint, 3.0, 60);
    mintLight.position.set(-14, -8, 12);
    scene.add(mintLight);

    const forestLight = new THREE.DirectionalLight(PALETTE.forest, 1.8);
    forestLight.position.set(0, 15, -5);
    scene.add(forestLight);

    // Floating 3D Objects Group
    const floatingGroup = new THREE.Group();
    scene.add(floatingGroup);

    // Array of objects for custom animation
    const floatingObjects = [];

    // Helper: Create dual-mesh floating objects (inner faceted solid + outer delicate wireframe)
    const createFloatingNode = (geometry, colorHex, wireHex, position, scale = 1, rotSpeed = {}) => {
      const nodeGroup = new THREE.Group();

      // Inner semi-transparent material
      const innerMaterial = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.25,
        metalness: 0.65,
        transparent: true,
        opacity: 0.65,
      });
      const innerMesh = new THREE.Mesh(geometry, innerMaterial);
      nodeGroup.add(innerMesh);

      // Outer wireframe halo
      const wireMaterial = new THREE.MeshBasicMaterial({
        color: wireHex,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      });
      const wireMesh = new THREE.Mesh(geometry, wireMaterial);
      wireMesh.scale.set(1.15, 1.15, 1.15);
      nodeGroup.add(wireMesh);

      nodeGroup.position.set(...position);
      nodeGroup.scale.set(scale, scale, scale);
      floatingGroup.add(nodeGroup);

      floatingObjects.push({
        group: nodeGroup,
        baseY: position[1],
        rotSpeedX: rotSpeed.x || (Math.random() * 0.006 + 0.003),
        rotSpeedY: rotSpeed.y || (Math.random() * 0.008 + 0.004),
        floatSpeed: Math.random() * 0.0015 + 0.001,
        floatAmplitude: Math.random() * 0.8 + 0.4,
        phase: Math.random() * Math.PI * 2,
      });

      return nodeGroup;
    };

    // 1. Central Hero Icosahedron Node (Honey Gold & Misty White)
    createFloatingNode(
      new THREE.IcosahedronGeometry(2.4, 0),
      PALETTE.gold,
      PALETTE.mist,
      [10, 3, -2],
      1.2,
      { x: 0.004, y: 0.006 }
    );

    // 2. Supply Hub Octahedron (Mint Green & Forest Emerald)
    createFloatingNode(
      new THREE.OctahedronGeometry(2.0, 0),
      PALETTE.mint,
      PALETTE.forest,
      [-11, 4, -4],
      1.1,
      { x: -0.005, y: 0.005 }
    );

    // 3. Resilience Torus Node (Forest Emerald & Honey Gold)
    const torusGeom = new THREE.TorusGeometry(1.6, 0.45, 16, 32);
    createFloatingNode(
      torusGeom,
      PALETTE.forest,
      PALETTE.gold,
      [-9, -6, -3],
      0.9,
      { x: 0.006, y: -0.004 }
    );

    // 4. Distribution Node Dodecahedron (Deep Teal & Mint)
    createFloatingNode(
      new THREE.DodecahedronGeometry(1.8, 0),
      PALETTE.teal,
      PALETTE.mint,
      [11, -7, -5],
      1.0,
      { x: -0.004, y: 0.005 }
    );

    // 5. Small Background Satellites
    createFloatingNode(
      new THREE.TetrahedronGeometry(1.2, 0),
      PALETTE.gold,
      PALETTE.mist,
      [0, 8, -8],
      0.75,
      { x: 0.007, y: 0.003 }
    );

    createFloatingNode(
      new THREE.IcosahedronGeometry(1.1, 0),
      PALETTE.mint,
      PALETTE.gold,
      [-4, -8, -6],
      0.8,
      { x: -0.005, y: -0.006 }
    );

    // Particle Constellation Network in the background
    const particleCount = 120;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const availableColors = [
      new THREE.Color(PALETTE.gold),
      new THREE.Color(PALETTE.mint),
      new THREE.Color(PALETTE.mist),
      new THREE.Color(PALETTE.forest),
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;

      const c = availableColors[Math.floor(Math.random() * availableColors.length)];
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Mouse Parallax reaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize handling
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse damping
      targetX += (mouseX - targetX) * 0.035;
      targetY += (mouseY - targetY) * 0.035;

      floatingGroup.rotation.y = targetX * 0.15;
      floatingGroup.rotation.x = -targetY * 0.15;

      particles.rotation.y = elapsedTime * 0.015;
      particles.rotation.x = elapsedTime * 0.008;

      // Animate individual 3D objects with rotation + sine wave floating
      floatingObjects.forEach((obj) => {
        obj.group.rotation.x += obj.rotSpeedX;
        obj.group.rotation.y += obj.rotSpeedY;
        obj.group.position.y =
          obj.baseY + Math.sin(elapsedTime * 1.5 + obj.phase) * obj.floatAmplitude;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    />
  );
}

