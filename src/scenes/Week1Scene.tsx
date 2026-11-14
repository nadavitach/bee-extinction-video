import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolate, Easing } from "remotion";

interface Week1SceneProps {
  style?: React.CSSProperties;
  sceneProgress: number;
  frame: number;
}

export const Week1Scene: React.FC<Week1SceneProps> = ({ style, sceneProgress, frame }) => {
  const cropsRef = useRef<THREE.Group | null>(null);
  const dustRef = useRef<THREE.Points | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        camera={{ position: [0, 8, 35], fov: 45 }}
        gl={{ antialias: false, preserveDrawingBuffer: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Week1SceneInner
          cropsRef={cropsRef}
          dustRef={dustRef}
          sceneProgress={sceneProgress}
          frame={frame}
        />
      </Canvas>
    </div>
  );
};

const Week1SceneInner: React.FC<{
  cropsRef: React.RefObject<THREE.Group>;
  dustRef: React.RefObject<THREE.Points>;
  sceneProgress: number;
  frame: number;
}> = ({ cropsRef, dustRef, sceneProgress, frame }) => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x2d251a);
    scene.fog = new THREE.FogExp2(0x2d251a, 0.01);

    const ambient = new THREE.AmbientLight(0x444033, 0.5);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffdd99, 1);
    sunLight.position.set(40, 80, 30);
    scene.add(sunLight);

    const groundGeo = new THREE.PlaneGeometry(300, 300, 60, 60);
    const groundPositions = groundGeo.attributes.position.array as Float32Array;
    const groundColors = new Float32Array(groundPositions.length);
    for (let i = 0; i < groundPositions.length; i += 3) {
      const noise = (Math.sin(groundPositions[i] * 0.05) + Math.cos(groundPositions[i + 2] * 0.05)) * 0.05;
      groundColors[i] = 0.18 + noise;
      groundColors[i + 1] = 0.15 + noise * 0.5;
      groundColors[i + 2] = 0.10 + noise * 0.3;
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

    const cropGroup = new THREE.Group();
    const cropTypes = [
      { name: "almond", color: 0x8b7355, height: 8, fruitColor: 0xd4a574, rows: 12, cols: 12, spacing: 10 },
      { name: "apple", color: 0x5d4037, height: 6, fruitColor: 0xc62828, rows: 10, cols: 10, spacing: 12 },
      { name: "blueberry", color: 0x3e2723, height: 2, fruitColor: 0x311b92, rows: 15, cols: 15, spacing: 5 },
    ];

    let cropIndex = 0;
    cropTypes.forEach((type, typeIdx) => {
      const startX = -120 + typeIdx * 110;
      for (let r = 0; r < type.rows; r++) {
        for (let c = 0; c < type.cols; c++) {
          const x = startX + (c - type.cols / 2) * type.spacing + (Math.random() - 0.5) * 2;
          const z = (r - type.rows / 2) * type.spacing + (Math.random() - 0.5) * 2;

          const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, type.height * 0.4, 6);
          const trunkMat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.9 });
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.set(x, type.height * 0.2 - 2, z);
          cropGroup.add(trunk);

          const canopyGeo = new THREE.SphereGeometry(type.height * 0.4, 8, 6);
          const canopyMat = new THREE.MeshStandardMaterial({
            color: 0x2d4a2d,
            roughness: 0.8,
            transparent: true,
            opacity: 0.9,
          });
          const canopy = new THREE.Mesh(canopyGeo, canopyMat);
          canopy.position.set(x, type.height * 0.6 - 2, z);
          canopy.scale.y = 0.7;
          canopy.userData = { type: "canopy", baseScale: canopy.scale.clone(), cropIndex: cropIndex++ };
          cropGroup.add(canopy);

          if (type.fruitColor) {
            for (let f = 0; f < 8; f++) {
              const fruitGeo = new THREE.SphereGeometry(0.25, 6, 4);
              const fruitMat = new THREE.MeshStandardMaterial({
                color: type.fruitColor,
                roughness: 0.3,
                transparent: true,
                opacity: 0,
              });
              const fruit = new THREE.Mesh(fruitGeo, fruitMat);
              const angle = (f / 8) * Math.PI * 2;
              const radius = type.height * 0.3;
              fruit.position.set(
                x + Math.cos(angle) * radius,
                type.height * 0.5 - 2 + (Math.random() - 0.5) * type.height * 0.3,
                z + Math.sin(angle) * radius
              );
              fruit.userData = { type: "fruit", angle, radius, baseY: fruit.position.y, cropIndex: cropIndex - 1 };
              cropGroup.add(fruit);
            }
          }
        }
      }
    });

    cropsRef.current = cropGroup;
    scene.add(cropGroup);

    const particleCount = 400;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 280;
      positions[i * 3 + 1] = Math.random() * 20 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 280;
      sizes[i] = 0.5 + Math.random() * 1;
      const c = Math.random();
      colors[i * 3] = 0.7 + c * 0.2;
      colors[i * 3 + 1] = 0.6 + c * 0.15;
      colors[i * 3 + 2] = 0.4 + c * 0.1;
      velocities[i * 3] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 1] = -0.005 - Math.random() * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      lifetimes[i] = Math.random() * 100;
    }

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    dustGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    dustGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    dustGeometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));
    dustGeometry.setAttribute("lifetime", new THREE.BufferAttribute(lifetimes, 1));

    const dustMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const dust = new THREE.Points(dustGeometry, dustMaterial);
    dustRef.current = dust;
    scene.add(dust);

    return () => {
      scene.remove(ambient);
      scene.remove(sunLight);
      scene.remove(ground);
      groundGeo.dispose();
      groundMat.dispose();
      scene.remove(cropGroup);
      cropGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      scene.remove(dust);
      dustGeometry.dispose();
      dustMaterial.dispose();
    };
  }, [scene]);

  useFrame((_, delta) => {
    const dt = delta * 60;

    if (cropsRef.current) {
      const wiltProgress = sceneProgress;

      cropsRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.type === "canopy") {
          const wilt = interpolate(wiltProgress, [0, 1], [0, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeIn });
          child.scale.y = child.userData.baseScale.y * (1 - wilt);
          child.scale.x = child.userData.baseScale.x * (1 - wilt * 0.3);
          child.scale.z = child.userData.baseScale.z * (1 - wilt * 0.3);

          if (child.material instanceof THREE.MeshStandardMaterial) {
            const deadColor = new THREE.Color(0x3d2d1a);
            const aliveColor = new THREE.Color(0x2d4a2d);
            child.material.color.lerpColors(aliveColor, deadColor, wilt);
            child.material.opacity = 0.9 - wilt * 0.4;
          }
        }

        if (child instanceof THREE.Mesh && child.userData.type === "fruit") {
          const fruitProgress = interpolate(wiltProgress, [0.3, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          child.scale.setScalar(1 - fruitProgress);
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.opacity = Math.max(0, 1 - fruitProgress * 2);
          }
          child.position.y = child.userData.baseY - fruitProgress * 5;
        }

        if (child instanceof THREE.Mesh && child.userData.type === "trunk") {
          const wilt = interpolate(wiltProgress, [0.5, 1], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          child.rotation.z = Math.sin(child.userData.cropIndex) * wilt * 0.3;
          child.rotation.x = Math.cos(child.userData.cropIndex) * wilt * 0.2;
        }
      });
    }

    if (dustRef.current) {
      const positions = dustRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = dustRef.current.geometry.attributes.velocity.array as Float32Array;
      const lifetimes = dustRef.current.geometry.attributes.lifetime.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * dt;
        positions[i + 1] += velocities[i + 1] * dt;
        positions[i + 2] += velocities[i + 2] * dt;
        lifetimes[i / 3] -= dt * 0.5;

        if (positions[i + 1] < 0 || lifetimes[i / 3] <= 0) {
          positions[i + 1] = 20 + Math.random() * 10;
          positions[i] = (Math.random() - 0.5) * 280;
          positions[i + 2] = (Math.random() - 0.5) * 280;
          lifetimes[i / 3] = 100 + Math.random() * 100;
        }
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;
    }

    camera.position.x = Math.sin(frame * 0.003) * 15 * (1 - sceneProgress * 0.3);
    camera.position.z = 35 + Math.cos(frame * 0.003) * 10 * (1 - sceneProgress * 0.3);
    camera.position.y = 8 + sceneProgress * 4;
    camera.lookAt(0, 2 - sceneProgress * 3, 0);
  });
};