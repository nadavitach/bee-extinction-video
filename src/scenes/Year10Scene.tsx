import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolate, Easing } from "remotion";

interface Year10SceneProps {
  style?: React.CSSProperties;
  sceneProgress: number;
  frame: number;
}

export const Year10Scene: React.FC<Year10SceneProps> = ({ style, sceneProgress, frame }) => {
  const oceanRef = useRef<THREE.Group | null>(null);
  const deadZoneRef = useRef<THREE.Points | null>(null);
  const oxygenDisplayRef = useRef<THREE.Group | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        camera={{ position: [0, 25, 80], fov: 40 }}
        gl={{ antialias: false, preserveDrawingBuffer: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Year10SceneInner
          oceanRef={oceanRef}
          deadZoneRef={deadZoneRef}
          oxygenDisplayRef={oxygenDisplayRef}
          sceneProgress={sceneProgress}
          frame={frame}
        />
      </Canvas>
    </div>
  );
};

const Year10SceneInner: React.FC<{
  oceanRef: React.RefObject<THREE.Group>;
  deadZoneRef: React.RefObject<THREE.Points>;
  oxygenDisplayRef: React.RefObject<THREE.Group>;
  sceneProgress: number;
  frame: number;
}> = ({ oceanRef, deadZoneRef, oxygenDisplayRef, sceneProgress, frame }) => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x0a1525);
    scene.fog = new THREE.FogExp2(0x0a1525, 0.004);

    const ambient = new THREE.AmbientLight(0x223355, 0.25);
    scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x6688cc, 0.5);
    moonLight.position.set(-50, 100, -50);
    scene.add(moonLight);

    const waterGeo = new THREE.PlaneGeometry(1200, 1200, 200, 200);
    const waterPositions = waterGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < waterPositions.length; i += 3) {
      waterPositions[i + 1] = Math.sin(waterPositions[i] * 0.05 + frame * 0.01) * 0.5 +
                             Math.cos(waterPositions[i + 2] * 0.05 + frame * 0.01) * 0.3;
    }
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0a1a3a,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -2;
    scene.add(water);

    const oceanGroup = new THREE.Group();

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 500;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const isCoastal = radius < 200;
      const isDeadZone = radius < 150 && Math.random() < 0.8;

      if (isCoastal) {
        const plantHeight = 3 + Math.random() * 5;
        const plantGeo = new THREE.CylinderGeometry(0.1, 0.05, plantHeight, 4);
        const plantMat = new THREE.MeshStandardMaterial({
          color: isDeadZone ? 0x1a1a2a : 0x1a3a2a,
          roughness: 0.8,
          transparent: true,
          opacity: isDeadZone ? 0.3 : 0.7,
        });
        const plant = new THREE.Mesh(plantGeo, plantMat);
        plant.position.set(x, plantHeight * 0.5 - 2, z);
        plant.userData = {
          type: "coastal_plant",
          isDeadZone,
          baseColor: new THREE.Color(isDeadZone ? 0x1a1a2a : 0x1a3a2a),
          deadColor: new THREE.Color(0x0a0a1a),
          baseOpacity: isDeadZone ? 0.3 : 0.7,
        };
        oceanGroup.add(plant);
      }

      if (!isDeadZone && Math.random() < 0.3) {
        const fishGeo = new THREE.ConeGeometry(0.3, 1.5, 6);
        const fishMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.3, metalness: 0.5 });
        const fish = new THREE.Mesh(fishGeo, fishMat);
        fish.position.set(x, -2 - Math.random() * 20, z);
        fish.rotation.x = -Math.PI / 2;
        fish.userData = {
          type: "fish",
          angle: Math.random() * Math.PI * 2,
          radius: 2 + Math.random() * 5,
          speed: 0.02 + Math.random() * 0.03,
          health: 1,
        };
        oceanGroup.add(fish);
      }
    }

    oceanRef.current = oceanGroup;
    scene.add(oceanGroup);

    const displayGroup = new THREE.Group();
    const stats = [
      { label: "FISH STOCKS", value: 100, unit: "%", color: 0x4488ff, target: 10 },
      { label: "OCEAN OXYGEN", value: 100, unit: "%", color: 0x44ffaa, target: 60 },
      { label: "DEAD ZONES", value: 5, unit: "%", color: 0xff4444, target: 45 },
      { label: "COASTAL LIFE", value: 100, unit: "%", color: 0xffaa44, target: 20 },
    ];

    stats.forEach((stat, i) => {
      const canvas = document.createElement("canvas");
      canvas.width = 280;
      canvas.height = 130;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 280, 130);
      ctx.font = "bold 20px 'Press Start 2P', monospace";
      ctx.fillStyle = "#" + stat.color.toString(16).padStart(6, "0");
      ctx.textAlign = "center";
      ctx.fillText(stat.label, 140, 40);
      ctx.font = "bold 42px 'Press Start 2P', monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${Math.round(stat.value)}${stat.unit}`, 140, 100);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;

      const geo = new THREE.PlaneGeometry(46, 21);
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(-69 + i * 46, 35, -70);
      mesh.userData = { stat, canvas, ctx, texture, target: stat.target };
      displayGroup.add(mesh);
    });

    oxygenDisplayRef.current = displayGroup;
    scene.add(displayGroup);

    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1150;
      positions[i * 3 + 1] = Math.random() * 30 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1150;
      sizes[i] = 0.5 + Math.random() * 1.5;
      const deadness = sceneProgress;
      colors[i * 3] = 0.3 + deadness * 0.3;
      colors[i * 3 + 1] = 0.2 + deadness * 0.2;
      colors[i * 3 + 2] = 0.4 + deadness * 0.2;
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = -0.005 - Math.random() * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
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
      opacity: 0.4,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    deadZoneRef.current = particles;
    scene.add(particles);

    return () => {
      scene.remove(ambient);
      scene.remove(moonLight);
      scene.remove(water);
      waterGeo.dispose();
      waterMat.dispose();
      scene.remove(oceanGroup);
      oceanGroup.children.forEach((child) => {
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

    if (oceanRef.current) {
      const deathProgress = sceneProgress;

      oceanRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.type === "coastal_plant") {
          const plantProgress = interpolate(deathProgress, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeIn });

          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.lerpColors(child.userData.baseColor, child.userData.deadColor, plantProgress);
            child.material.opacity = child.userData.baseOpacity * (1 - plantProgress * 0.8);
          }
          child.scale.y = 1 - plantProgress * 0.8;
        }

        if (child instanceof THREE.Mesh && child.userData.type === "fish") {
          child.userData.health = Math.max(0, 1 - deathProgress * 2);

          if (child.material instanceof THREE.MeshStandardMaterial) {
            const healthyColor = new THREE.Color(0x88aaff);
            const dyingColor = new THREE.Color(0x443366);
            child.material.color.lerpColors(healthyColor, dyingColor, 1 - child.userData.health);
            child.material.opacity = 0.5 + child.userData.health * 0.5;
          }

          if (child.userData.health > 0.1) {
            child.userData.angle += child.userData.speed * dt;
            child.position.x = Math.cos(child.userData.angle) * child.userData.radius;
            child.position.z = Math.sin(child.userData.angle) * child.userData.radius;
          } else {
            child.position.y = -25 + Math.sin(frame * 0.05) * 2;
            child.rotation.z = Math.PI / 2;
          }
        }
      });
    }

    if (oxygenDisplayRef.current) {
      const statProgress = sceneProgress;

      oxygenDisplayRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.stat) {
          const stat = child.userData.stat;
          const target = child.userData.target;

          const currentValue = interpolate(statProgress, [0, 1], [stat.value, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          if (Math.abs(stat.value - currentValue) > 0.5) {
            stat.value = currentValue;

            const canvas = child.userData.canvas;
            const ctx = child.userData.ctx;
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, 280, 130);
            ctx.font = "bold 20px 'Press Start 2P', monospace";
            ctx.fillStyle = "#" + stat.color.toString(16).padStart(6, "0");
            ctx.textAlign = "center";
            ctx.fillText(stat.label, 140, 40);
            ctx.font = "bold 42px 'Press Start 2P', monospace";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(`${Math.round(currentValue)}${stat.unit}`, 140, 100);

            child.userData.texture.needsUpdate = true;
          }
        }
      });
    }

    if (deadZoneRef.current) {
      const positions = deadZoneRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = deadZoneRef.current.geometry.attributes.velocity.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * dt;
        positions[i + 1] += velocities[i + 1] * dt;
        positions[i + 2] += velocities[i + 2] * dt;

        if (positions[i + 1] < 0) {
          positions[i + 1] = 30 + Math.random() * 10;
          positions[i] = (Math.random() - 0.5) * 1150;
          positions[i + 2] = (Math.random() - 0.5) * 1150;
        }
      }
      deadZoneRef.current.geometry.attributes.position.needsUpdate = true;
    }

    camera.position.x = Math.sin(frame * 0.0012) * 40;
    camera.position.z = 80 + Math.cos(frame * 0.0012) * 25;
    camera.position.y = 25 + sceneProgress * 10;
    camera.lookAt(0, -5, 0);
  });
};