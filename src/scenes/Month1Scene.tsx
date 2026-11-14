import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolate, Easing } from "remotion";

interface Month1SceneProps {
  style?: React.CSSProperties;
  sceneProgress: number;
  frame: number;
}

export const Month1Scene: React.FC<Month1SceneProps> = ({ style, sceneProgress, frame }) => {
  const forestRef = useRef<THREE.Group | null>(null);
  const herbivoresRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        camera={{ position: [0, 12, 50], fov: 45 }}
        gl={{ antialias: false, preserveDrawingBuffer: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Month1SceneInner
          forestRef={forestRef}
          herbivoresRef={herbivoresRef}
          particlesRef={particlesRef}
          sceneProgress={sceneProgress}
          frame={frame}
        />
      </Canvas>
    </div>
  );
};

const Month1SceneInner: React.FC<{
  forestRef: React.RefObject<THREE.Group>;
  herbivoresRef: React.RefObject<THREE.Group>;
  particlesRef: React.RefObject<THREE.Points>;
  sceneProgress: number;
  frame: number;
}> = ({ forestRef, herbivoresRef, particlesRef, sceneProgress, frame }) => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x1a1a2a);
    scene.fog = new THREE.FogExp2(0x1a1a2a, 0.008);

    const ambient = new THREE.AmbientLight(0x333355, 0.4);
    scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x88aaff, 0.6);
    moonLight.position.set(-30, 60, -40);
    scene.add(moonLight);

    const groundGeo = new THREE.PlaneGeometry(400, 400, 80, 80);
    const groundPositions = groundGeo.attributes.position.array as Float32Array;
    const groundColors = new Float32Array(groundPositions.length);
    for (let i = 0; i < groundPositions.length; i += 3) {
      const noise = (Math.sin(groundPositions[i] * 0.03) + Math.cos(groundPositions[i + 2] * 0.03)) * 0.03;
      groundColors[i] = 0.08 + noise;
      groundColors[i + 1] = 0.06 + noise * 0.5;
      groundColors[i + 2] = 0.12 + noise * 0.3;
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

    const forestGroup = new THREE.Group();

    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * 150;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const height = 15 + Math.random() * 25;
      const trunkGeo = new THREE.CylinderGeometry(0.8, 1.5, height * 0.5, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2d1a1a, roughness: 0.95 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, height * 0.25 - 2, z);
      forestGroup.add(trunk);

      const canopyGeo = new THREE.ConeGeometry(height * 0.4, height * 0.6, 8);
      const canopyMat = new THREE.MeshStandardMaterial({
        color: 0x1a3a1a,
        roughness: 0.8,
        transparent: true,
        opacity: 0.9,
      });
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(x, height * 0.7 - 2, z);
      canopy.userData = { type: "tree", baseColor: new THREE.Color(0x1a3a1a), deadColor: new THREE.Color(0x2a1a1a) };
      forestGroup.add(canopy);
    }

    forestRef.current = forestGroup;
    scene.add(forestGroup);

    const herbivoreGroup = new THREE.Group();
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 120;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const bodyGeo = new THREE.BoxGeometry(3, 1.5, 5);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(x, 1.5, z);
      body.userData = {
        angle,
        radius,
        speed: 0.01 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        health: 1,
      };
      herbivoreGroup.add(body);

      const headGeo = new THREE.BoxGeometry(1.5, 1.5, 2);
      const head = new THREE.Mesh(headGeo, bodyMat);
      head.position.set(x + 3.5, 2, z);
      herbivoreGroup.add(head);

      for (let l = 0; l < 4; l++) {
        const legGeo = new THREE.CylinderGeometry(0.2, 0.15, 2, 4);
        const leg = new THREE.Mesh(legGeo, bodyMat);
        const lx = l < 2 ? -1 : 2;
        const lz = l % 2 === 0 ? -1.5 : 1.5;
        leg.position.set(x + lx, 0.5, z + lz);
        herbivoreGroup.add(leg);
      }
    }

    herbivoresRef.current = herbivoreGroup;
    scene.add(herbivoreGroup);

    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 380;
      positions[i * 3 + 1] = Math.random() * 30 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 380;
      sizes[i] = 0.4 + Math.random() * 0.8;
      colors[i * 3] = 0.4 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.3 + Math.random() * 0.15;
      colors[i * 3 + 2] = 0.2 + Math.random() * 0.1;
      velocities[i * 3] = (Math.random() - 0.5) * 0.03;
      velocities[i * 3 + 1] = -0.01 - Math.random() * 0.015;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
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
      opacity: 0.5,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particlesRef.current = particles;
    scene.add(particles);

    return () => {
      scene.remove(ambient);
      scene.remove(moonLight);
      scene.remove(ground);
      groundGeo.dispose();
      groundMat.dispose();
      scene.remove(forestGroup);
      forestGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      scene.remove(herbivoreGroup);
      herbivoreGroup.children.forEach((child) => {
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

    if (forestRef.current) {
      const dieProgress = sceneProgress;

      forestRef.current.children.forEach((child, idx) => {
        if (child instanceof THREE.Mesh && child.userData.type === "tree") {
          const treeProgress = interpolate(dieProgress, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeIn });
          const delay = (idx % 10) * 0.05;
          const actualProgress = Math.max(0, treeProgress - delay);

          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.lerpColors(child.userData.baseColor, child.userData.deadColor, actualProgress);
            child.material.opacity = 0.9 - actualProgress * 0.5;
          }
          child.scale.y = 1 - actualProgress * 0.4;
        }
      });
    }

    if (herbivoresRef.current) {
      const starveProgress = sceneProgress;

      herbivoresRef.current.children.forEach((child, idx) => {
        if (child instanceof THREE.Mesh && child.userData.health !== undefined) {
          child.userData.health = Math.max(0, 1 - starveProgress * 1.5);

          if (child.userData.health < 0.5) {
            child.position.y = Math.max(-0.5, 1.5 - (1 - child.userData.health) * 3);
            child.rotation.z = (1 - child.userData.health) * 0.5;
          }

          if (child.material instanceof THREE.MeshStandardMaterial) {
            const healthyColor = new THREE.Color(0x8b7355);
            const starvingColor = new THREE.Color(0x4a3a2a);
            child.material.color.lerpColors(healthyColor, starvingColor, 1 - child.userData.health);
          }

          if (child.userData.health > 0.1) {
            child.userData.phase += child.userData.speed * dt;
            child.position.x = Math.cos(child.userData.angle + child.userData.phase) * child.userData.radius;
            child.position.z = Math.sin(child.userData.angle + child.userData.phase) * child.userData.radius;
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
          positions[i + 1] = 30 + Math.random() * 10;
          positions[i] = (Math.random() - 0.5) * 380;
          positions[i + 2] = (Math.random() - 0.5) * 380;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    camera.position.x = Math.sin(frame * 0.002) * 25;
    camera.position.z = 50 + Math.cos(frame * 0.002) * 15;
    camera.position.y = 12 + sceneProgress * 5;
    camera.lookAt(0, 5 - sceneProgress * 5, 0);
  });
};