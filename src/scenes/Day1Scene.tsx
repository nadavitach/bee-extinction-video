import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolate, Easing } from "remotion";

interface Day1SceneProps {
  style?: React.CSSProperties;
  sceneProgress: number;
  frame: number;
}

export const Day1Scene: React.FC<Day1SceneProps> = ({ style, sceneProgress, frame }) => {
  const flowersRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        camera={{ position: [0, 5, 30], fov: 45 }}
        gl={{ antialias: false, preserveDrawingBuffer: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Day1SceneInner
          flowersRef={flowersRef}
          particlesRef={particlesRef}
          sceneProgress={sceneProgress}
          frame={frame}
        />
      </Canvas>
    </div>
  );
};

const Day1SceneInner: React.FC<{
  flowersRef: React.RefObject<THREE.Group>;
  particlesRef: React.RefObject<THREE.Points>;
  sceneProgress: number;
  frame: number;
}> = ({ flowersRef, particlesRef, sceneProgress, frame }) => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x1a3a2a);
    scene.fog = new THREE.FogExp2(0x1a3a2a, 0.012);

    const ambient = new THREE.AmbientLight(0x446644, 0.6);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffeeaa, 1.2);
    sunLight.position.set(50, 100, 30);
    scene.add(sunLight);

    const hemisphereLight = new THREE.HemisphereLight(0x88aa88, 0x334433, 0.4);
    scene.add(hemisphereLight);

    const groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a2d,
      roughness: 0.9,
      metalness: 0,
      vertexColors: true,
    });
    const groundPositions = groundGeo.attributes.position.array as Float32Array;
    const groundColors = new Float32Array(groundPositions.length);
    for (let i = 0; i < groundPositions.length; i += 3) {
      const noise = Math.sin(groundPositions[i] * 0.1) * Math.cos(groundPositions[i + 2] * 0.1) * 0.1;
      groundColors[i] = 0.18 + noise;
      groundColors[i + 1] = 0.35 + noise * 0.5;
      groundColors[i + 2] = 0.12 + noise * 0.3;
    }
    groundGeo.setAttribute("color", new THREE.BufferAttribute(groundColors, 3));
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    const flowerGroup = new THREE.Group();
    const flowerTypes = [
      { color: 0xff6b6b, height: 3, petals: 5 },
      { color: 0xffd93d, height: 2.5, petals: 6 },
      { color: 0x6bcb77, height: 4, petals: 4 },
      { color: 0x4d96ff, height: 3.5, petals: 5 },
      { color: 0xff9f1c, height: 2, petals: 8 },
    ];

    for (let i = 0; i < 80; i++) {
      const x = (Math.random() - 0.5) * 160;
      const z = (Math.random() - 0.5) * 160;
      const type = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];

      const stemGeo = new THREE.CylinderGeometry(0.08, 0.12, type.height, 6);
      const stemMat = new THREE.MeshStandardMaterial({
        color: 0x1a4a1a,
        roughness: 0.8,
      });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(x, type.height / 2 - 2, z);
      flowerGroup.add(stem);

      for (let p = 0; p < type.petals; p++) {
        const petalGeo = new THREE.PlaneGeometry(0.6, 1.2);
        const petalMat = new THREE.MeshStandardMaterial({
          color: type.color,
          side: THREE.DoubleSide,
          roughness: 0.4,
          transparent: true,
          opacity: 0.9,
        });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        const angle = (p / type.petals) * Math.PI * 2;
        petal.position.set(
          x + Math.cos(angle) * 0.4,
          type.height - 1.5,
          z + Math.sin(angle) * 0.4
        );
        petal.rotation.y = angle;
        petal.rotation.x = -Math.PI / 4;
        petal.userData = { baseY: petal.position.y, angle, type: "petal" };
        flowerGroup.add(petal);
      }

      const centerGeo = new THREE.SphereGeometry(0.25, 8, 6);
      const centerMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.3,
        roughness: 0.2,
      });
      const center = new THREE.Mesh(centerGeo, centerMat);
      center.position.set(x, type.height - 1.3, z);
      center.userData = { type: "center", pulsePhase: Math.random() * Math.PI * 2 };
      flowerGroup.add(center);
    }

    flowersRef.current = flowerGroup;
    scene.add(flowerGroup);

    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 180;
      positions[i * 3 + 1] = Math.random() * 15 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 180;
      sizes[i] = 0.3 + Math.random() * 0.5;
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 2] = 0.3 + Math.random() * 0.2;
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = -0.01 - Math.random() * 0.02;
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
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particlesRef.current = particles;
    scene.add(particles);

    return () => {
      scene.remove(ambient);
      scene.remove(sunLight);
      scene.remove(hemisphereLight);
      scene.remove(ground);
      groundGeo.dispose();
      groundMat.dispose();
      scene.remove(flowerGroup);
      flowerGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
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

    if (flowersRef.current) {
      flowersRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.type === "petal") {
          child.position.y = child.userData.baseY + Math.sin(frame * 0.03 + child.userData.angle * 10) * 0.05;
          child.rotation.z = Math.sin(frame * 0.02 + child.userData.angle * 10) * 0.1;
        }
        if (child instanceof THREE.Mesh && child.userData.type === "center") {
          const scale = 1 + Math.sin(frame * 0.1 + child.userData.pulsePhase) * 0.1;
          child.scale.setScalar(scale);
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissiveIntensity = 0.3 + Math.sin(frame * 0.1 + child.userData.pulsePhase) * 0.2;
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
          positions[i + 1] = 15 + Math.random() * 5;
          positions[i] = (Math.random() - 0.5) * 180;
          positions[i + 2] = (Math.random() - 0.5) * 180;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    const camProgress = sceneProgress;
    camera.position.x = Math.sin(frame * 0.005) * 8 * (1 - camProgress * 0.5);
    camera.position.z = 30 + Math.cos(frame * 0.005) * 5 * (1 - camProgress * 0.5);
    camera.position.y = 5 + camProgress * 3;
    camera.lookAt(0, 2, 0);
  });
};