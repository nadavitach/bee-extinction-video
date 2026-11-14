import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolate, Easing } from "remotion";

interface Year5SceneProps {
  style?: React.CSSProperties;
  sceneProgress: number;
  frame: number;
}

export const Year5Scene: React.FC<Year5SceneProps> = ({ style, sceneProgress, frame }) => {
  const landscapeRef = useRef<THREE.Group | null>(null);
  const dustStormRef = useRef<THREE.Points | null>(null);
  const carbonDisplayRef = useRef<THREE.Group | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        camera={{ position: [0, 30, 100], fov: 40 }}
        gl={{ antialias: false, preserveDrawingBuffer: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Year5SceneInner
          landscapeRef={landscapeRef}
          dustStormRef={dustStormRef}
          carbonDisplayRef={carbonDisplayRef}
          sceneProgress={sceneProgress}
          frame={frame}
        />
      </Canvas>
    </div>
  );
};

const Year5SceneInner: React.FC<{
  landscapeRef: React.RefObject<THREE.Group>;
  dustStormRef: React.RefObject<THREE.Points>;
  carbonDisplayRef: React.RefObject<THREE.Group>;
  sceneProgress: number;
  frame: number;
}> = ({ landscapeRef, dustStormRef, carbonDisplayRef, sceneProgress, frame }) => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x2a1a10);
    scene.fog = new THREE.FogExp2(0x2a1a10, 0.005);

    const ambient = new THREE.AmbientLight(0x443322, 0.3);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffaa66, 0.7);
    sunLight.position.set(80, 150, 60);
    scene.add(sunLight);

    const groundGeo = new THREE.PlaneGeometry(1000, 1000, 150, 150);
    const groundPositions = groundGeo.attributes.position.array as Float32Array;
    const groundColors = new Float32Array(groundPositions.length);
    for (let i = 0; i < groundPositions.length; i += 3) {
      const noise = (Math.sin(groundPositions[i] * 0.01) + Math.cos(groundPositions[i + 2] * 0.01)) * 0.015;
      groundColors[i] = 0.2 + noise;
      groundColors[i + 1] = 0.12 + noise * 0.5;
      groundColors[i + 2] = 0.06 + noise * 0.3;
    }
    groundGeo.setAttribute("color", new THREE.BufferAttribute(groundColors, 3));
    const groundMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.98,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    const landscapeGroup = new THREE.Group();

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 400;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const isDeadTree = Math.random() < 0.7;

      if (isDeadTree) {
        const height = 8 + Math.random() * 12;
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.8, height, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1a100a, roughness: 0.95 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, height * 0.5 - 2, z);
        trunk.rotation.z = (Math.random() - 0.5) * 0.3;
        landscapeGroup.add(trunk);

        for (let b = 0; b < 3 + Math.random() * 4; b++) {
          const branchGeo = new THREE.CylinderGeometry(0.05, 0.15, 2 + Math.random() * 3, 4);
          const branch = new THREE.Mesh(branchGeo, trunkMat);
          branch.position.set(
            x + (Math.random() - 0.5) * 1,
            height * 0.3 + b * 1.5,
            z + (Math.random() - 0.5) * 1
          );
          branch.rotation.x = (Math.random() - 0.5) * 1.5;
          branch.rotation.z = (Math.random() - 0.5) * 1.5;
          landscapeGroup.add(branch);
        }
      } else {
        const height = 4 + Math.random() * 6;
        const grassGeo = new THREE.ConeGeometry(1.5, height, 6);
        const grassMat = new THREE.MeshStandardMaterial({
          color: 0x3a4a1a,
          roughness: 0.9,
          transparent: true,
          opacity: 0.8,
        });
        const grass = new THREE.Mesh(grassGeo, grassMat);
        grass.position.set(x, height * 0.5 - 2, z);
        grass.userData = { type: "grass", baseColor: new THREE.Color(0x3a4a1a), deadColor: new THREE.Color(0x2a1a0a) };
        landscapeGroup.add(grass);
      }
    }

    landscapeRef.current = landscapeGroup;
    scene.add(landscapeGroup);

    const displayGroup = new THREE.Group();
    const stats = [
      { label: "FOREST COVER", value: 100, unit: "%", color: 0x44aa44, target: 15 },
      { label: "CARBON STORED", value: 100, unit: "GT", color: 0x88aa88, target: 25 },
      { label: "TEMP RISE", value: 1.1, unit: "°C", color: 0xff6644, target: 2.8 },
      { label: "ARABLE LAND", value: 100, unit: "%", color: 0xaaaaff, target: 40 },
    ];

    stats.forEach((stat, i) => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 140;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 300, 140);
      ctx.font = "bold 22px 'Press Start 2P', monospace";
      ctx.fillStyle = "#" + stat.color.toString(16).padStart(6, "0");
      ctx.textAlign = "center";
      ctx.fillText(stat.label, 150, 45);
      ctx.font = "bold 44px 'Press Start 2P', monospace";
      ctx.fillStyle = "#ffffff";
      const valStr = stat.unit === "°C" ? `${stat.value.toFixed(1)}${stat.unit}` : `${Math.round(stat.value)}${stat.unit}`;
      ctx.fillText(valStr, 150, 110);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;

      const geo = new THREE.PlaneGeometry(50, 23);
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(-75 + i * 50, 40, -70);
      mesh.userData = { stat, canvas, ctx, texture, target: stat.target };
      displayGroup.add(mesh);
    });

    carbonDisplayRef.current = displayGroup;
    scene.add(displayGroup);

    const particleCount = 1500;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 950;
      positions[i * 3 + 1] = Math.random() * 60 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 950;
      sizes[i] = 1 + Math.random() * 3;
      const c = 0.6 + Math.random() * 0.2;
      colors[i * 3] = c;
      colors[i * 3 + 1] = c * 0.8;
      colors[i * 3 + 2] = c * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.1 + Math.random() * 0.2;
      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = -0.02 - Math.random() * 0.05;
      velocities[i * 3 + 2] = Math.sin(angle) * speed;
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
      opacity: 0.7,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    dustStormRef.current = particles;
    scene.add(particles);

    return () => {
      scene.remove(ambient);
      scene.remove(sunLight);
      scene.remove(ground);
      groundGeo.dispose();
      groundMat.dispose();
      scene.remove(landscapeGroup);
      landscapeGroup.children.forEach((child) => {
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

    if (landscapeRef.current) {
      const dieProgress = sceneProgress;

      landscapeRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.type === "grass") {
          const grassProgress = interpolate(dieProgress, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeIn });

          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.lerpColors(child.userData.baseColor, child.userData.deadColor, grassProgress);
            child.material.opacity = 0.8 - grassProgress * 0.5;
          }
          child.scale.y = 1 - grassProgress * 0.7;
        }
      });
    }

    if (carbonDisplayRef.current) {
      const statProgress = sceneProgress;

      carbonDisplayRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.stat) {
          const stat = child.userData.stat;
          const target = child.userData.target;

          let currentValue: number;
          if (stat.unit === "°C") {
            currentValue = interpolate(statProgress, [0, 1], [stat.value, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          } else {
            currentValue = interpolate(statProgress, [0, 1], [stat.value, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          }

          if (Math.abs(stat.value - currentValue) > (stat.unit === "°C" ? 0.05 : 0.5)) {
            stat.value = currentValue;

            const canvas = child.userData.canvas;
            const ctx = child.userData.ctx;
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, 300, 140);
            ctx.font = "bold 22px 'Press Start 2P', monospace";
            ctx.fillStyle = "#" + stat.color.toString(16).padStart(6, "0");
            ctx.textAlign = "center";
            ctx.fillText(stat.label, 150, 45);
            ctx.font = "bold 44px 'Press Start 2P', monospace";
            ctx.fillStyle = "#ffffff";
            const valStr = stat.unit === "°C" ? `${currentValue.toFixed(1)}${stat.unit}` : `${Math.round(currentValue)}${stat.unit}`;
            ctx.fillText(valStr, 150, 110);

            child.userData.texture.needsUpdate = true;
          }
        }
      });
    }

    if (dustStormRef.current) {
      const positions = dustStormRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = dustStormRef.current.geometry.attributes.velocity.array as Float32Array;

      const windStrength = 1 + sceneProgress * 2;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * dt * windStrength;
        positions[i + 1] += velocities[i + 1] * dt;
        positions[i + 2] += velocities[i + 2] * dt * windStrength;

        if (positions[i + 1] < 0 ||
            Math.abs(positions[i]) > 500 ||
            Math.abs(positions[i + 2]) > 500) {
          positions[i + 1] = 60 + Math.random() * 20;
          const angle = Math.random() * Math.PI * 2;
          const radius = 400 + Math.random() * 300;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 2] = Math.sin(angle) * radius;

          const speed = 0.1 + Math.random() * 0.2;
          velocities[i] = Math.cos(angle + Math.PI) * speed * windStrength;
          velocities[i + 2] = Math.sin(angle + Math.PI) * speed * windStrength;
        }
      }
      dustStormRef.current.geometry.attributes.position.needsUpdate = true;
    }

    camera.position.x = Math.sin(frame * 0.001) * 60;
    camera.position.z = 100 + Math.cos(frame * 0.001) * 30;
    camera.position.y = 30 + sceneProgress * 15;
    camera.lookAt(0, -5, 0);
  });
};