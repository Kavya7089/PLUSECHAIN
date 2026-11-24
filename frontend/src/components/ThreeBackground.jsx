import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Enhanced ThreeBackground
 * High-Visibility Interactive 3D Supply Chain Resilience Network.
 * 28+ Multi-echelon logistics nodes, orbiting pharmaceutical capsules,
 * rotating polyhedra, dynamic transport route splines, and animated particle constellation.
 * 
 * Auto-adapts to Dark (#081F20) and Light (#F1ECE2) mode palettes with crisp contrast.
 */
export default function ThreeBackground({ className = '' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect initial theme
    let isLight = document.documentElement.classList.contains('light');

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 28;

    // WebGL Renderer with Alpha & Antialiasing
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Dynamic Palettes
    const getPalette = (light) => {
      if (light) {
        return {
          abyssDark: 0x081f20,      // Deep contrast ink teal
          abyssCard: 0x0f3b3e,      // Saturated deep teal
          abyssElevated: 0x1a4d52,  // Visible elevation teal
          volt: 0xb45309,           // Warm deep amber/volt for light bg
          emerald: 0x047857,        // Deep forest emerald
          sand: 0x78716c,           // Stone/sand neutral
          cyan: 0x0369a1,           // Rich sapphire blue
          lineColor: 0x0f766e,      // Crisp route lines
          lineOpacity: 0.28,
          coreOpacity: 0.72,
          wireOpacity: 0.55,
          particleOpacity: 0.65,
        };
      }
      return {
        abyssDark: 0x081f20,
        abyssCard: 0x0d2c2e,
        abyssElevated: 0x133b3e,
        volt: 0xffd400,            // Glowing Taxi Volt
        emerald: 0x10b981,         // Mint Emerald
        sand: 0xddd3c2,            // Warm Sand
        cyan: 0x06b6d4,            // Electric Cyan
        lineColor: 0xffd400,       // Radiant Volt lines
        lineOpacity: 0.32,
        coreOpacity: 0.60,
        wireOpacity: 0.45,
        particleOpacity: 0.65,
      };
    };

    let currentPalette = getPalette(isLight);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 1.4 : 0.95);
    scene.add(ambientLight);

    const voltLight = new THREE.PointLight(currentPalette.volt, isLight ? 2.5 : 3.8, 80);
    voltLight.position.set(16, 12, 18);
    scene.add(voltLight);

    const emeraldLight = new THREE.PointLight(currentPalette.emerald, isLight ? 2.2 : 3.2, 80);
    emeraldLight.position.set(-18, -10, 16);
    scene.add(emeraldLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isLight ? 1.2 : 0.8);
    dirLight.position.set(0, 20, 15);
    scene.add(dirLight);

    // Groups
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const floatingObjects = [];
    const nodePositions = [];
    const coreMaterials = [];
    const wireMaterials = [];

    // Factory: Create a dual-mesh node (Solid core + geometric wireframe cage)
    const createNode = (geometry, solidColor, wireColor, position, scale = 1, options = {}) => {
      const group = new THREE.Group();

      // Solid core
      const coreMat = new THREE.MeshStandardMaterial({
        color: solidColor,
        roughness: 0.25,
        metalness: 0.55,
        transparent: true,
        opacity: options.opacity || currentPalette.coreOpacity,
      });
      coreMaterials.push(coreMat);

      const coreMesh = new THREE.Mesh(geometry, coreMat);
      group.add(coreMesh);

      // Outer wireframe cage
      const wireMat = new THREE.MeshBasicMaterial({
        color: wireColor,
        wireframe: true,
        transparent: true,
        opacity: options.wireOpacity || currentPalette.wireOpacity,
      });
      wireMaterials.push(wireMat);

      const wireMesh = new THREE.Mesh(geometry, wireMat);
      wireMesh.scale.set(1.24, 1.24, 1.24);
      group.add(wireMesh);

      // Optional orbiting ring for major control hubs
      if (options.hasRing) {
        const ringGeom = new THREE.RingGeometry(1.6, 1.78, 36);
        const ringMat = new THREE.MeshBasicMaterial({
          color: wireColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
        });
        wireMaterials.push(ringMat);
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        group.add(ringMesh);
      }

      group.position.set(...position);
      group.scale.set(scale, scale, scale);
      masterGroup.add(group);

      nodePositions.push(new THREE.Vector3(...position));

      floatingObjects.push({
        group,
        baseY: position[1],
        baseX: position[0],
        rotX: options.rotX || (Math.random() * 0.007 + 0.003),
        rotY: options.rotY || (Math.random() * 0.008 + 0.003),
        rotZ: options.rotZ || 0.002,
        floatSpeed: Math.random() * 0.0018 + 0.001,
        floatAmplitude: Math.random() * 0.8 + 0.35,
        phase: Math.random() * Math.PI * 2,
      });

      return group;
    };

    // Helper: Pharmaceutical Capsule Geometry
    const createCapsuleGeometry = (radius = 0.85, length = 1.8) => {
      return new THREE.CylinderGeometry(radius, radius, length, 16);
    };

    // -------------------------------------------------------------
    // 28+ Rich 3D Supply Chain & Medical Components
    // -------------------------------------------------------------

    // 1. Central Hero Control Tower Node (Taxi Volt + Abyss Gold)
    createNode(new THREE.IcosahedronGeometry(2.8, 0), currentPalette.volt, currentPalette.emerald, [13, 4, -2], 1.25, {
      hasRing: true,
      rotX: 0.004,
      rotY: 0.006,
    });

    // 2. Regional Medical Surplus Hub H005 (Emerald + Volt)
    createNode(new THREE.OctahedronGeometry(2.4, 0), currentPalette.emerald, currentPalette.volt, [-14, 5, -4], 1.2, {
      hasRing: true,
      rotX: -0.005,
      rotY: 0.005,
    });

    // 3. Resilience Torus Node (Sand + Emerald)
    createNode(new THREE.TorusGeometry(2.0, 0.5, 16, 32), currentPalette.abyssCard, currentPalette.emerald, [-11, -8, -3], 1.05, {
      rotX: 0.005,
      rotY: -0.004,
    });

    // 4. Logistics Gateway Dodecahedron (Deep Teal + Volt)
    createNode(new THREE.DodecahedronGeometry(2.2, 0), currentPalette.abyssElevated, currentPalette.volt, [14, -8, -5], 1.15, {
      rotX: -0.004,
      rotY: 0.006,
    });

    // 5. Pharmaceutical Medicine Capsule 1 (Ampicillin / Antibiotic Core)
    createNode(createCapsuleGeometry(1.0, 2.2), currentPalette.volt, currentPalette.emerald, [-6, 10, -7], 1.0, {
      rotX: 0.008,
      rotY: 0.004,
    });

    // 6. Pharmaceutical Medicine Capsule 2 (Insulin Glargine Cold-Chain)
    createNode(createCapsuleGeometry(0.9, 2.0), currentPalette.emerald, currentPalette.volt, [8, -12, -6], 0.95, {
      rotX: -0.006,
      rotY: 0.007,
    });

    // 7. Cold-Chain Biologic Torus Knot Node
    createNode(new THREE.TorusKnotGeometry(1.3, 0.4, 64, 8, 2, 3), currentPalette.cyan, currentPalette.volt, [-16, -2, -8], 0.85, {
      rotX: 0.006,
      rotY: 0.005,
    });

    // 8. Freight Transport Cube A (Warehouse Bay 1)
    createNode(new THREE.BoxGeometry(1.8, 1.8, 1.8), currentPalette.abyssElevated, currentPalette.volt, [6, 11, -9], 0.9, {
      rotX: 0.005,
      rotY: 0.004,
    });

    // 9. Freight Transport Cube B (Bhopal Apex Care Bay 2)
    createNode(new THREE.BoxGeometry(1.7, 1.7, 1.7), currentPalette.abyssElevated, currentPalette.emerald, [-9, 2, -6], 0.9, {
      rotX: -0.004,
      rotY: 0.005,
    });

    // 10. SAP S/4HANA Ledger Icosahedron
    createNode(new THREE.IcosahedronGeometry(1.6, 0), currentPalette.volt, currentPalette.abyssCard, [0, -8, -5], 0.95, {
      rotX: 0.006,
      rotY: 0.006,
    });

    // 11-18. Perimeter Network Satellite Nodes (Tetrahedra & Octahedra)
    const satelliteConfigs = [
      { geom: new THREE.TetrahedronGeometry(1.4, 0), pos: [-19, 10, -11], col: currentPalette.volt },
      { geom: new THREE.TetrahedronGeometry(1.3, 0), pos: [19, 10, -12], col: currentPalette.emerald },
      { geom: new THREE.OctahedronGeometry(1.4, 0), pos: [-17, -12, -10], col: currentPalette.abyssCard },
      { geom: new THREE.OctahedronGeometry(1.5, 0), pos: [18, -12, -11], col: currentPalette.volt },
      { geom: new THREE.DodecahedronGeometry(1.3, 0), pos: [-2, 13, -10], col: currentPalette.emerald },
      { geom: new THREE.IcosahedronGeometry(1.2, 0), pos: [2, -14, -9], col: currentPalette.volt },
      { geom: new THREE.BoxGeometry(1.4, 1.4, 1.4), pos: [12, 14, -11], col: currentPalette.abyssCard },
      { geom: new THREE.TetrahedronGeometry(1.2, 0), pos: [-12, 13, -10], col: currentPalette.volt },
    ];

    satelliteConfigs.forEach((cfg) => {
      createNode(cfg.geom, cfg.col, currentPalette.emerald, cfg.pos, 0.8, {
        opacity: currentPalette.coreOpacity,
        wireOpacity: currentPalette.wireOpacity,
      });
    });

    // 19-28. Background Micro Orbiters
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const r = 22 + Math.random() * 5;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * (r * 0.65);
      const z = -14 - Math.random() * 6;
      createNode(new THREE.TetrahedronGeometry(0.9, 0), currentPalette.volt, currentPalette.emerald, [x, y, z], 0.65, {
        opacity: currentPalette.coreOpacity * 0.8,
        wireOpacity: currentPalette.wireOpacity * 0.8,
      });
    }

    // Interconnecting Network Lines between Key Supply Chain Nodes
    const lineMaterial = new THREE.LineBasicMaterial({
      color: currentPalette.lineColor,
      transparent: true,
      opacity: currentPalette.lineOpacity,
      linewidth: 1.5,
    });
    const lineGeom = new THREE.BufferGeometry();
    const linePositions = [];

    // Connect node pairs to represent live freight logistics routes
    for (let i = 0; i < Math.min(nodePositions.length, 18); i += 2) {
      if (nodePositions[i] && nodePositions[i + 1]) {
        linePositions.push(
          nodePositions[i].x,
          nodePositions[i].y,
          nodePositions[i].z,
          nodePositions[i + 1].x,
          nodePositions[i + 1].y,
          nodePositions[i + 1].z
        );
      }
    }
    // Cross connections for hub interconnectivity
    if (nodePositions[0] && nodePositions[1]) {
      linePositions.push(
        nodePositions[0].x, nodePositions[0].y, nodePositions[0].z,
        nodePositions[1].x, nodePositions[1].y, nodePositions[1].z
      );
    }
    if (nodePositions[1] && nodePositions[2]) {
      linePositions.push(
        nodePositions[1].x, nodePositions[1].y, nodePositions[1].z,
        nodePositions[2].x, nodePositions[2].y, nodePositions[2].z
      );
    }

    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const networkLines = new THREE.LineSegments(lineGeom, lineMaterial);
    masterGroup.add(networkLines);

    // Particle Constellation Network (280+ data points)
    const particleCount = 280;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const updateParticleColors = (pal) => {
      const colors = [
        new THREE.Color(pal.volt),
        new THREE.Color(pal.emerald),
        new THREE.Color(pal.abyssCard),
        new THREE.Color(pal.cyan),
      ];
      for (let i = 0; i < particleCount; i++) {
        const c = colors[Math.floor(Math.random() * colors.length)];
        particleColors[i * 3] = c.r;
        particleColors[i * 3 + 1] = c.g;
        particleColors[i * 3 + 2] = c.b;
      }
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
      particleGeometry.attributes.color.needsUpdate = true;
    };

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 68;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 48;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 6;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    updateParticleColors(currentPalette);

    const particleMaterial = new THREE.PointsMaterial({
      size: isLight ? 0.42 : 0.35,
      vertexColors: true,
      transparent: true,
      opacity: currentPalette.particleOpacity,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Dynamic Theme Observer
    const themeObserver = new MutationObserver(() => {
      const newIsLight = document.documentElement.classList.contains('light');
      if (newIsLight !== isLight) {
        isLight = newIsLight;
        currentPalette = getPalette(isLight);

        // Update lights
        ambientLight.intensity = isLight ? 1.4 : 0.95;
        voltLight.color.setHex(currentPalette.volt);
        emeraldLight.color.setHex(currentPalette.emerald);
        dirLight.intensity = isLight ? 1.2 : 0.8;

        // Update lines
        lineMaterial.color.setHex(currentPalette.lineColor);
        lineMaterial.opacity = currentPalette.lineOpacity;

        // Update particles
        particleMaterial.size = isLight ? 0.42 : 0.35;
        updateParticleColors(currentPalette);

        // Update materials
        coreMaterials.forEach((m) => {
          m.opacity = currentPalette.coreOpacity;
        });
        wireMaterials.forEach((m) => {
          m.opacity = currentPalette.wireOpacity;
        });
      }
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Mouse Parallax Reaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Window Resize Handling
    const handleResize = () => {
      if (!container) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse damping
      targetX += (mouseX - targetX) * 0.035;
      targetY += (mouseY - targetY) * 0.035;

      masterGroup.rotation.y = targetX * 0.14;
      masterGroup.rotation.x = -targetY * 0.14;

      particles.rotation.y = elapsedTime * 0.015;
      particles.rotation.x = elapsedTime * 0.008;

      // Animate individual 3D objects
      floatingObjects.forEach((obj) => {
        obj.group.rotation.x += obj.rotX;
        obj.group.rotation.y += obj.rotY;
        obj.group.rotation.z += obj.rotZ;
        obj.group.position.y =
          obj.baseY + Math.sin(elapsedTime * 1.3 + obj.phase) * obj.floatAmplitude;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      themeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeom.dispose();
      lineMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-90 transition-opacity duration-700 ${className}`}
      aria-hidden="true"
    />
  );
}
