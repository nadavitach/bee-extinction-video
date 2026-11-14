import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolate, Easing } from "remotion";

interface Year50SceneProps {
  style?: React.CSSProperties;
  sceneProgress: number;
  frame: number;
}

export const Year50Scene: React.FC<Year50SceneProps> = ({ style, sceneProgress, frame }) => {
  const wastelandRef = useRef<THREE.Group | null>(null);
  const domeRef = useRef<THREE.Group | null>(null);
  const dustRef = useRef<THREE.Points | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        camera={{ position: [0, 40, 120], fov: 35 }}
        gl={{ antialias: false, preserveDrawingBuffer: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Year50SceneInner
          wastelandRef={wastelandRef}
          domeRef={domeRef}
          dustRef={dustRef}
          sceneProgress={sceneProgress}
          frame={frame}
        />
      </Canvas>
    </div>
  );
};

const Year50SceneInner: React.FC<{
  wastelandRef: React.RefObject<THREE.Group>;
  domeRef: React.RefObject<THREE.Group>;
  dustRef: React.RefObject<THREE.Points>;
  sceneProgress: number;
  frame: number;
}> = ({ wastelandRef, domeRef, dustRef, sceneProgress, frame }) => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x150a0a);
    scene.fog = new THREE.FogExp2(0x150a0a, 0.003);

    const ambient = new THREE.AmbientLight(0x331111, 0.2);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xff8844, 0.6);
    sunLight.position.set(100, 200, 80);
    scene.add(sunLight);

    const groundGeo = new THREE.PlaneGeometry(2000, 2000, 200, 200);
    const groundPositions = groundGeo.attributes.position.array as Float32Array;
    const groundColors = new Float32Array(groundPositions.length);
    for (let i = 0; i < groundPositions.length; i += 3) {
      const noise = (Math.sin(groundPositions[i] * 0.005) + Math.cos(groundPositions[i + 2] * 0.005)) * 0.02;
      const dune = Math.sin(groundPositions[i] * 0.008) * Math.cos(groundPositions[i + 2] * 0.008) * 5;
      groundPositions[i + 1] = dune - 2;
      groundColors[i] = 0.25 + noise;
      groundColors[i + 1] = 0.15 + noise * 0.5;
      groundColors[i + 2] = 0.08 + noise * 0.3;
    }
    groundGeo.setAttribute("color", new THREE.BufferAttribute(groundColors, 3));
    groundGeo.computeVertexNormals();
    const groundMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.99,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const wastelandGroup = new THREE.Group();

    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 200 + Math.random() * 800;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const isRuins = Math.random() < 0.3;

      if (isRuins) {
        const height = 5 + Math.random() * 15;
        const baseGeo = new THREE.BoxGeometry(8, height, 8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x2a1a1a, roughness: 0.95 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(x, height * 0.5 - 2, z);
        base.rotation.y = Math.random() * Math.PI / 4;
        wastelandGroup.add(base);

        for (let f = 1; f < 3 + Math.random() * 3; f++) {
          const floorGeo = new THREE.BoxGeometry(7 - f * 0.5, 0.3, 7 - f * 0.5);
          const floor = new THREE.Mesh(floorGeo, baseMat);
          floor.position.set(x, height * 0.5 + f * 3 - 2, z);
          wastelandGroup.add(floor);
        }
      } else {
        const rockGeo = new THREE.DodecahedronGeometry(1 + Math.random() * 3, 0);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x2a201a, roughness: 0.98 });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(x, 1, z);
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        wastelandGroup.add(rock);
      }
    }

    wastelandRef.current = wastelandGroup;
    scene.add(wastelandGroup);

    const domeGroup = new THREE.Group();

    const domeGeo = new THREE.SphereGeometry(35, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      roughness: 0.1,
      metalness: 0.8,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 35, 0);
    domeGroup.add(dome);

    const domeFrameGeo = new THREE.SphereGeometry(35.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeFrameMat = new THREE.MeshStandardMaterial({
      color: 0x88aaff,
      transparent: true,
      opacity: 0.3,
      wireframe: true,
      roughness: 0.2,
    });
    const domeFrame = new THREE.Mesh(domeFrameGeo, domeFrameMat);
    domeFrame.position.set(0, 35, 0);
    domeGroup.add(domeFrame);

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 35;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const towerGeo = new THREE.CylinderGeometry(1, 2, 15, 6);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x446688, roughness: 0.7, metalness: 0.5 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(x, 7.5, z);
      domeGroup.add(tower);

      const lightGeo = new THREE.SphereGeometry(0.8, 8, 6);
      const lightMat = new THREE.MeshStandardMaterial({
        color: 0xffee88,
        emissive: 0xffee88,
        emissiveIntensity: 2,
        roughness: 0.1,
      });
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(x, 15.5, z);
      light.userData = { type: "dome_light", phase: i * 0.3 };
      domeGroup.add(light);
    }

    const farmGeo = new THREE.PlaneGeometry(60, 60, 20, 20);
    const farmPositions = farmGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < farmPositions.length; i += 3) {
      farmPositions[i + 1] = Math.sin(farmPositions[i] * 0.2) * Math.cos(farmPositions[i + 2] * 0.2) * 0.5;
    }
    const farmMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a1a,
      roughness: 0.9,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const farm = new THREE.Mesh(farmGeo, farmMat);
    farm.rotation.x = -Math.PI / 2;
    farm.position.set(0, 0.5, 0);
    farm.userData = { type: "hydroponic_farm" };
    domeGroup.add(farm);

    domeRef.current = domeGroup;
    scene.add(domeGroup);

    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1900;
      positions[i * 3 + 1] = Math.random() * 100 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1900;
      sizes[i] = 1 + Math.random() * 4;
      const c = 0.5 + Math.random() * 0.2;
      colors[i * 3] = c;
      colors[i * 3 + 1] = c * 0.7;
      colors[i * 3 + 2] = c * 0.4;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.05 + Math.random() * 0.15;
      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = -0.01 - Math.random() * 0.02;
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
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    dustRef.current = particles;
    scene.add(particles);

    return () => {
      scene.remove(ambient);
      scene.remove(sunLight);
      scene.remove(ground);
      groundGeo.dispose();
      groundMat.dispose();
      scene.remove(wastelandGroup);
      wastelandGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      scene.remove(domeGroup);
      domeGroup.children.forEach((child) => {
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

    if (domeRef.current) {
      domeRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.type === "dome_light") {
          const intensity = 1 + Math.sin(frame * 0.05 + child.userData.phase) * 0.5;
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissiveIntensity = intensity * 2;
          }
        }
        if (child instanceof THREE.Mesh && child.userData.type === "hydroponic_farm") {
          child.rotation.z = Math.sin(frame * 0.002) * 0.02;
          if (child.material instanceof THREE.MeshStandardMaterial) {
            const green = 0.18 + Math.sin(frame * 0.01) * 0.05;
            child.material.color.setRGB(green, 0.3 + green * 0.5, 0.1);
          }
        }
      });

      domeRef.current.rotation.y += 0.0001 * dt;
    }

    if (dustRef.current) {
      const positions = dustRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = dustRef.current.geometry.attributes.velocity.array as Float32Array;

      const windStrength = 1.5 + sceneProgress * 1.5;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * dt * windStrength;
        positions[i + 1] += velocities[i + 1] * dt;
        positions[i + 2] += velocities[i + 2] * dt * windStrength;

        if (positions[i + 1] < 0 ||
            Math.abs(positions[i]) > 1000 ||
            Math.abs(positions[i + 2]) > 1000) {
          positions[i + 1] = 100 + Math.random() * 50;
          const angle = Math.random() * Math.PI * 2;
          const radius = 800 + Math.random() * 800;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 2] = Math.sin(angle) * radius;

          const speed = 0.05 + Math.random() * 0.15;
          velocities[i] = Math.cos(angle + Math.PI) * speed * windStrength;
          velocities[i + 2] = Math.sin(angle + Math.PI) * speed * windStrength;
        }
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;
    }

    camera.position.x = Math.sin(frame * 0.0008) * 80;
    camera.position.z = 120 + Math.cos(frame * 0.0008) * 40;
    camera.position.y = 40 + sceneProgress * 20;
    camera.lookAt(0, 10, 0);
  });
};