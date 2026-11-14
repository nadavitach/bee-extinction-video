import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolate, Easing } from "remotion";

interface Year1SceneProps {
  style?: React.CSSProperties;
  sceneProgress: number;
  frame: number;
}

export const Year1Scene: React.FC<Year1SceneProps> = ({ style, sceneProgress, frame }) => {
  const worldRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const dataDisplayRef = useRef<THREE.Group | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        camera={{ position: [0, 20, 80], fov: 40 }}
        gl={{ antialias: false, preserveDrawingBuffer: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Year1SceneInner
          worldRef={worldRef}
          particlesRef={particlesRef}
          dataDisplayRef={dataDisplayRef}
          sceneProgress={sceneProgress}
          frame={frame}
        />
      </Canvas>
    </div>
  );
};

const Year1SceneInner: React.FC<{
  worldRef: React.RefObject<THREE.Group>;
  particlesRef: React.RefObject<THREE.Points>;
  dataDisplayRef: React.RefObject<THREE.Group>;
  sceneProgress: number;
  frame: number;
}> = ({ worldRef, particlesRef, dataDisplayRef, sceneProgress, frame }) => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x151020);
    scene.fog = new THREE.FogExp2(0x151020, 0.006);

    const ambient = new THREE.AmbientLight(0x332244, 0.3);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffcc88, 0.8);
    sunLight.position.set(60, 120, 40);
    scene.add(sunLight);

    const groundGeo = new THREE.PlaneGeometry(600, 600, 100, 100);
    const groundPositions = groundGeo.attributes.position.array as Float32Array;
    const groundColors = new Float32Array(groundPositions.length);
    for (let i = 0; i < groundPositions.length; i += 3) {
      const noise = (Math.sin(groundPositions[i] * 0.02) + Math.cos(groundPositions[i + 2] * 0.02)) * 0.02;
      const dryness = sceneProgress * 0.7;
      groundColors[i] = 0.15 - dryness * 0.05 + noise;
      groundColors[i + 1] = 0.10 - dryness * 0.04 + noise * 0.5;
      groundColors[i + 2] = 0.08 - dryness * 0.03 + noise * 0.3;
    }
    groundGeo.setAttribute("color", new THREE.BufferAttribute(groundColors, 3));
    const groundMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    const worldGroup = new THREE.Group();

    const biomes = [
      { name: "forest", x: -200, z: 0, color: 0x1a3a1a, deadColor: 0x2a1a1a, density: 60 },
      { name: "grassland", x: 0, z: 0, color: 0x3a5a2a, deadColor: 0x4a3a1a, density: 100 },
      { name: "farmland", x: 200, z: 0, color: 0x2a4a2a, deadColor: 0x3a2a1a, density: 80 },
    ];

    biomes.forEach((biome) => {
      for (let i = 0; i < biome.density; i++) {
        const x = biome.x + (Math.random() - 0.5) * 150;
        const z = biome.z + (Math.random() - 0.5) * 150;
        const height = biome.name === "forest" ? 15 + Math.random() * 20 : 2 + Math.random() * 3;

        if (biome.name === "forest") {
          const trunkGeo = new THREE.CylinderGeometry(0.6, 1.2, height * 0.5, 6);
          const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2d1a1a, roughness: 0.95 });
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.set(x, height * 0.25 - 2, z);
          worldGroup.add(trunk);

          const canopyGeo = new THREE.ConeGeometry(height * 0.35, height * 0.5, 6);
          const canopyMat = new THREE.MeshStandardMaterial({
            color: biome.color,
            roughness: 0.8,
            transparent: true,
            opacity: 0.9,
          });
          const canopy = new THREE.Mesh(canopyGeo, canopyMat);
          canopy.position.set(x, height * 0.65 - 2, z);
          canopy.userData = { biome: biome.name, baseColor: new THREE.Color(biome.color), deadColor: new THREE.Color(biome.deadColor) };
          worldGroup.add(canopy);
        } else {
          const bladeCount = biome.name === "grassland" ? 20 : 10;
          for (let b = 0; b < bladeCount; b++) {
            const bladeGeo = new THREE.PlaneGeometry(0.1, height * 0.5);
            const bladeMat = new THREE.MeshStandardMaterial({
              color: biome.color,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.8,
            });
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            const bx = x + (Math.random() - 0.5) * 3;
            const bz = z + (Math.random() - 0.5) * 3;
            blade.position.set(bx, height * 0.25 - 2, bz);
            blade.rotation.y = Math.random() * Math.PI * 2;
            blade.userData = { biome: biome.name, baseColor: new THREE.Color(biome.color), deadColor: new THREE.Color(biome.deadColor) };
            worldGroup.add(blade);
          }
        }
      }
    });

    worldRef.current = worldGroup;
    scene.add(worldGroup);

    const displayGroup = new THREE.Group();
    const stats = [
      { label: "CROP YIELD", value: 100, unit: "%", color: 0x44ff44 },
      { label: "FOOD PRICES", value: 100, unit: "%", color: 0xffaa44 },
      { label: "SPECIES LOST", value: 0, unit: "", color: 0xff4444 },
      { label: "POLLEN COUNT", value: 100, unit: "%", color: 0xaaaaff },
    ];

    stats.forEach((stat, i) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 256, 128);
      ctx.font = "bold 24px 'Press Start 2P', monospace";
      ctx.fillStyle = "#" + stat.color.toString(16).padStart(6, "0");
      ctx.textAlign = "center";
      ctx.fillText(stat.label, 128, 40);
      ctx.font = "bold 48px 'Press Start 2P', monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${stat.value}${stat.unit}`, 128, 100);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;

      const geo = new THREE.PlaneGeometry(40, 20);
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(-60 + i * 40, 30, -50);
      mesh.userData = { stat, canvas, ctx, texture };
      displayGroup.add(mesh);
    });

    dataDisplayRef.current = displayGroup;
    scene.add(displayGroup);

    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 580;
      positions[i * 3 + 1] = Math.random() * 40 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 580;
      sizes[i] = 0.5 + Math.random() * 1.5;
      colors[i * 3] = 0.5 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0.3 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.2 + Math.random() * 0.15;
      velocities[i * 3] = (Math.random() - 0.5) * 0.08;
      velocities[i * 3 + 1] = -0.02 - Math.random() * 0.03;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particlesRef.current = particles;
    scene.add(particles);

    return () => {
      scene.remove(ambient);
      scene.remove(sunLight);
      scene.remove(ground);
      groundGeo.dispose();
      groundMat.dispose();
      scene.remove(worldGroup);
      worldGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      scene.remove(displayGroup);
      displayGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.MeshBasicMaterial) {
            child.material.map?.dispose();
            child.material.dispose();
          }
        }
      });
      scene.remove(particles);
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [scene]);

  useFrame((_, delta) => {
    const dt = delta * 60;

    if (worldRef.current) {
      const dieProgress = sceneProgress;

      worldRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.biome) {
          const biomeProgress = interpolate(dieProgress, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeInOut });

          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.lerpColors(child.userData.baseColor, child.userData.deadColor, biomeProgress);
            child.material.opacity = 0.9 - biomeProgress * 0.6;
          }
          child.scale.y = 1 - biomeProgress * 0.5;
        }
      });
    }

    if (dataDisplayRef.current) {
      const statProgress = sceneProgress;

      dataDisplayRef.current.children.forEach((child, idx) => {
        if (child instanceof THREE.Mesh && child.userData.stat) {
          const stat = child.userData.stat;
          let targetValue: number;

          switch (idx) {
            case 0: targetValue = interpolate(statProgress, [0, 1], [100, 30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); break;
            case 1: targetValue = interpolate(statProgress, [0, 1], [100, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); break;
            case 2: targetValue = interpolate(statProgress, [0, 1], [0, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); break;
            case 3: targetValue = interpolate(statProgress, [0, 1], [100, 15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); break;
            default: targetValue = stat.value;
          }

          if (Math.abs(stat.value - targetValue) > 0.5) {
            stat.value = targetValue;

            const canvas = child.userData.canvas;
            const ctx = child.userData.ctx;
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, 256, 128);
            ctx.font = "bold 24px 'Press Start 2P', monospace";
            ctx.fillStyle = "#" + stat.color.toString(16).padStart(6, "0");
            ctx.textAlign = "center";
            ctx.fillText(stat.label, 128, 40);
            ctx.font = "bold 48px 'Press Start 2P', monospace";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(`${Math.round(targetValue)}${stat.unit}`, 128, 100);

            child.userData.texture.needsUpdate = true;
          }
        }
      });
    }

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * dt;
        positions[i + 1] += velocities[i + 1] * dt;
        positions[i + 2] += velocities[i + 2] * dt;

        if (positions[i + 1] < 0) {
          positions[i + 1] = 40 + Math.random() * 20;
          positions[i] = (Math.random() - 0.5) * 580;
          positions[i + 2] = (Math.random() - 0.5) * 580;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    camera.position.x = Math.sin(frame * 0.0015) * 40;
    camera.position.z = 80 + Math.cos(frame * 0.0015) * 20;
    camera.position.y = 20 + sceneProgress * 10;
    camera.lookAt(0, 0, 0);
  });
};