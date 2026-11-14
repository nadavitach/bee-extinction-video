import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolate, Easing } from "remotion";

interface ConclusionSceneProps {
  style?: React.CSSProperties;
  sceneProgress: number;
  frame: number;
}

export const ConclusionScene: React.FC<ConclusionSceneProps> = ({ style, sceneProgress, frame }) => {
  const beeRef = useRef<THREE.Group | null>(null);
  const flowerRef = useRef<THREE.Group | null>(null);
  const particleRef = useRef<THREE.Points | null>(null);
  const textRef = useRef<THREE.Group | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        camera={{ position: [0, 5, 40], fov: 50 }}
        gl={{ antialias: false, preserveDrawingBuffer: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <ConclusionSceneInner
          beeRef={beeRef}
          flowerRef={flowerRef}
          particleRef={particleRef}
          textRef={textRef}
          sceneProgress={sceneProgress}
          frame={frame}
        />
      </Canvas>
    </div>
  );
};

const ConclusionSceneInner: React.FC<{
  beeRef: React.RefObject<THREE.Group>;
  flowerRef: React.RefObject<THREE.Group>;
  particleRef: React.RefObject<THREE.Points>;
  textRef: React.RefObject<THREE.Group>;
  sceneProgress: number;
  frame: number;
}> = ({ beeRef, flowerRef, particleRef, textRef, sceneProgress, frame }) => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x051005);
    scene.fog = new THREE.FogExp2(0x051005, 0.008);

    const ambient = new THREE.AmbientLight(0x446644, 0.8);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffeeaa, 1.5);
    sunLight.position.set(30, 80, 30);
    scene.add(sunLight);

    const hemisphereLight = new THREE.HemisphereLight(0x88cc88, 0x224422, 0.6);
    scene.add(hemisphereLight);

    const groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
    const groundPositions = groundGeo.attributes.position.array as Float32Array;
    const groundColors = new Float32Array(groundPositions.length);
    for (let i = 0; i < groundPositions.length; i += 3) {
      const noise = Math.sin(groundPositions[i] * 0.1) * Math.cos(groundPositions[i + 2] * 0.1) * 0.1;
      const green = sceneProgress;
      groundColors[i] = 0.1 + green * 0.2 + noise;
      groundColors[i + 1] = 0.15 + green * 0.5 + noise * 0.5;
      groundColors[i + 2] = 0.08 + green * 0.15 + noise * 0.3;
    }
    groundGeo.setAttribute("color", new THREE.BufferAttribute(groundColors, 3));
    const groundMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);

    const flowerGroup = new THREE.Group();
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 60;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const type = Math.floor(Math.random() * 5);
      const colors = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xff9f1c];
      const height = 2 + Math.random() * 3;

      const stemGeo = new THREE.CylinderGeometry(0.06, 0.1, height, 6);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.8 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(x, height * 0.5 - 2, z);
      stem.scale.y = sceneProgress;
      flowerGroup.add(stem);

      for (let p = 0; p < 6; p++) {
        const petalGeo = new THREE.PlaneGeometry(0.5, 1);
        const petalMat = new THREE.MeshStandardMaterial({
          color: colors[type],
          side: THREE.DoubleSide,
          roughness: 0.4,
          transparent: true,
          opacity: sceneProgress,
        });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        const petalAngle = (p / 6) * Math.PI * 2;
        petal.position.set(
          x + Math.cos(petalAngle) * 0.35,
          height - 1.5,
          z + Math.sin(petalAngle) * 0.35
        );
        petal.rotation.y = petalAngle;
        petal.rotation.x = -Math.PI / 4;
        petal.scale.setScalar(sceneProgress);
        flowerGroup.add(petal);
      }
    }

    flowerRef.current = flowerGroup;
    scene.add(flowerGroup);

    const beeGroup = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(1.5, 1.2, 2.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    beeGroup.add(body);

    const stripeGeo = new THREE.BoxGeometry(1.6, 0.25, 2.6);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0xffd700,
      emissiveIntensity: 0.5
    });
    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = -0.25 + i * 0.85;
      beeGroup.add(stripe);
    }

    const wingGeo = new THREE.PlaneGeometry(2.5, 1.5);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.1,
    });
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-1.8, 1.2, 0);
    leftWing.rotation.y = -Math.PI / 4;
    beeGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(1.8, 1.2, 0);
    rightWing.rotation.y = Math.PI / 4;
    beeGroup.add(rightWing);

    beeGroup.position.set(0, 8, -10);
    beeGroup.scale.setScalar(sceneProgress);
    beeRef.current = beeGroup;
    scene.add(beeGroup);

    const textGroup = new THREE.Group();

    const messages = [
      { text: "PLANT NATIVE FLOWERS", y: 30, color: 0x44ff44, delay: 0.1 },
      { text: "BAN NEONICOTINOIDS", y: 22, color: 0xffaa44, delay: 0.2 },
      { text: "SUPPORT BEEKEEPERS", y: 14, color: 0x44aaff, delay: 0.3 },
      { text: "PROTECT HABITATS", y: 6, color: 0xff44aa, delay: 0.4 },
      { text: "ACT NOW", y: -4, color: 0xffd700, delay: 0.6, large: true },
    ];

    messages.forEach((msg) => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 512, 128);
      ctx.font = `bold ${msg.large ? 56 : 32}px 'Press Start 2P', monospace`;
      ctx.fillStyle = "#" + msg.color.toString(16).padStart(6, "0");
      ctx.textAlign = "center";
      ctx.fillText(msg.text, 256, 80);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;

      const geo = new THREE.PlaneGeometry(msg.large ? 80 : 60, msg.large ? 20 : 15);
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthTest: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, msg.y, -30);
      mesh.userData = { delay: msg.delay, baseY: msg.y };
      mesh.renderOrder = 100;
      textGroup.add(mesh);
    });

    textRef.current = textGroup;
    scene.add(textGroup);

    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 180;
      positions[i * 3 + 1] = Math.random() * 30 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 180;
      sizes[i] = 0.3 + Math.random() * 0.8;
      const choice = Math.random();
      if (choice < 0.4) {
        colors[i * 3] = 1; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.2;
      } else if (choice < 0.7) {
        colors[i * 3] = 0.4; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 0.4;
      } else {
        colors[i * 3] = 0.3; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 1;
      }
      velocities[i * 3] = (Math.random() - 0.5) * 0.03;
      velocities[i * 3 + 1] = 0.01 + Math.random() * 0.03;
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
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particleRef.current = particles;
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
      scene.remove(beeGroup);
      bodyGeo.dispose();
      bodyMat.dispose();
      stripeGeo.dispose();
      stripeMat.dispose();
      wingGeo.dispose();
      wingMat.dispose();
      scene.remove(textGroup);
      textGroup.children.forEach((child) => {
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

    if (flowerRef.current) {
      flowerRef.current.children.forEach((child, idx) => {
        if (child instanceof THREE.Mesh && child.geometry.type === "PlaneGeometry") {
          child.scale.setScalar(sceneProgress);
          child.material.opacity = sceneProgress * 0.9;
          child.position.y = -2 + (child.userData?.baseY || 1) * sceneProgress;
          child.rotation.z = Math.sin(frame * 0.02 + idx) * 0.05 * sceneProgress;
        }
        if (child instanceof THREE.Mesh && child.geometry.type === "CylinderGeometry") {
          child.scale.y = sceneProgress;
        }
      });
    }

    if (beeRef.current) {
      beeRef.current.scale.setScalar(sceneProgress);

      if (sceneProgress > 0.3) {
        const flyProgress = (sceneProgress - 0.3) / 0.7;
        beeRef.current.position.x = Math.sin(frame * 0.03) * 10 * flyProgress;
        beeRef.current.position.z = -10 + flyProgress * 20;
        beeRef.current.position.y = 8 + Math.sin(frame * 0.05) * 2 * flyProgress;
        beeRef.current.rotation.y = Math.sin(frame * 0.02) * 0.3;

        beeRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.geometry.type === "PlaneGeometry") {
            child.rotation.z = Math.sin(frame * 0.8) * 0.8;
          }
        });
      }
    }

    if (textRef.current) {
      textRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const delay = child.userData.delay;
          const textProgress = Math.max(0, (sceneProgress - delay) / (1 - delay));
          child.scale.setScalar(textProgress);
          child.material.opacity = textProgress;
          child.position.y = child.userData.baseY + (1 - textProgress) * 10;
        }
      });
    }

    if (particleRef.current) {
      const positions = particleRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = particleRef.current.geometry.attributes.velocity.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * dt;
        positions[i + 1] += velocities[i + 1] * dt;
        positions[i + 2] += velocities[i + 2] * dt;

        if (positions[i + 1] > 35) {
          positions[i + 1] = 2;
          positions[i] = (Math.random() - 0.5) * 180;
          positions[i + 2] = (Math.random() - 0.5) * 180;
        }
      }
      particleRef.current.geometry.attributes.position.needsUpdate = true;
    }

    camera.position.x = Math.sin(frame * 0.005) * 5 * (1 - sceneProgress * 0.5);
    camera.position.z = 40 - sceneProgress * 15;
    camera.position.y = 5 + sceneProgress * 3;
    camera.lookAt(0, 2, 0);
  });
};