import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { interpolate, Easing } from "remotion";
import { BlockShaderMaterial, blockVertexShader, blockFragmentShader } from "../components/shaders/PixelShaderMaterial";

interface HookSceneProps {
  style?: React.CSSProperties;
  sceneProgress: number;
  frame: number;
}

export const HookScene: React.FC<HookSceneProps> = ({ style, sceneProgress, frame }) => {
  const particlesRef = useRef<THREE.Points | null>(null);
  const beeRef = useRef<THREE.Group | null>(null);
  const textRef = useRef<THREE.Mesh | null>(null);

  return (
    <div style={{ width: "100%", height: "100%", ...style }}>
      <Canvas
        camera={{ position: [0, 0, 80], fov: 50 }}
        gl={{ antialias: false, preserveDrawingBuffer: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <HookSceneInner
          particlesRef={particlesRef}
          beeRef={beeRef}
          textRef={textRef}
          sceneProgress={sceneProgress}
          frame={frame}
        />
      </Canvas>
    </div>
  );
};

const HookSceneInner: React.FC<{
  particlesRef: React.RefObject<THREE.Points>;
  beeRef: React.RefObject<THREE.Group>;
  textRef: React.RefObject<THREE.Mesh>;
  sceneProgress: number;
  frame: number;
}> = ({ particlesRef, beeRef, textRef, sceneProgress, frame }) => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x050508);
    scene.fog = new THREE.FogExp2(0x050508, 0.015);

    const ambient = new THREE.AmbientLight(0x222233, 0.8);
    scene.add(ambient);

    const spotLight = new THREE.SpotLight(0xffdd88, 2, 200, Math.PI / 6, 0.5, 1);
    spotLight.position.set(0, 100, 50);
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    const particleCount = 3000;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 40 + Math.random() * 60;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi) - 20;

      sizes[i] = 0.5 + Math.random() * 1.5;

      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        colors[i * 3] = 0.95; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.2;
        alphas[i] = 0.8;
      } else if (colorChoice < 0.7) {
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.3; colors[i * 3 + 2] = 0.3;
        alphas[i] = 0.6;
      } else {
        colors[i * 3] = 0.3; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 0.9;
        alphas[i] = 0.5;
      }
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vAlpha = alpha;
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - 0.5);
          if (dist > 0.5) discard;
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particlesRef.current = particles;
    scene.add(particles);

    const beeGroup = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(2, 1.5, 3);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    beeGroup.add(body);

    const stripeGeo = new THREE.BoxGeometry(2.1, 0.3, 3.1);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0xffd700,
      emissiveIntensity: 0.3
    });
    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = -0.3 + i * 1;
      beeGroup.add(stripe);
    }

    const wingGeo = new THREE.PlaneGeometry(3, 2);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      roughness: 0.1,
      metalness: 0,
    });
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-2, 1.5, 0);
    leftWing.rotation.y = -Math.PI / 4;
    beeGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(2, 1.5, 0);
    rightWing.rotation.y = Math.PI / 4;
    beeGroup.add(rightWing);

    beeGroup.position.set(0, 10, 0);
    beeRef.current = beeGroup;
    scene.add(beeGroup);

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 512, 256);
    ctx.font = "bold 64px 'Press Start 2P', monospace";
    ctx.fillStyle = "#ffd700";
    ctx.textAlign = "center";
    ctx.fillText("VANISHED", 256, 140);
    ctx.font = "32px 'Press Start 2P', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("What if every bee...", 256, 200);

    const textTexture = new THREE.CanvasTexture(canvas);
    textTexture.minFilter = THREE.NearestFilter;
    textTexture.magFilter = THREE.NearestFilter;

    const textGeo = new THREE.PlaneGeometry(60, 30);
    const textMat = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.position.set(0, 25, -30);
    textMesh.renderOrder = 100;
    textRef.current = textMesh;
    scene.add(textMesh);

    return () => {
      scene.remove(ambient);
      scene.remove(spotLight);
      scene.remove(spotLight.target);
      scene.remove(particles);
      particleGeometry.dispose();
      particleMaterial.dispose();
      scene.remove(beeGroup);
      bodyGeo.dispose();
      bodyMat.dispose();
      stripeGeo.dispose();
      stripeMat.dispose();
      wingGeo.dispose();
      wingMat.dispose();
      scene.remove(textMesh);
      textGeo.dispose();
      textMat.dispose();
      textTexture.dispose();
    };
  }, [scene]);

  useFrame((_, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0001 * delta * 60;
      particlesRef.current.rotation.x += 0.00005 * delta * 60;

      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(frame * 0.02 + i * 0.01) * 0.02 * delta * 60;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (beeRef.current) {
      const progress = sceneProgress;

      if (progress < 0.3) {
        beeRef.current.position.y = interpolate(progress, [0, 0.3], [10, 5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        beeRef.current.rotation.y += 0.02 * delta * 60;

        beeRef.current.children.forEach((child, idx) => {
          if (child instanceof THREE.Mesh && child.geometry.type === "PlaneGeometry") {
            child.rotation.z = Math.sin(frame * 0.5 + idx) * 0.8;
          }
        });
      } else if (progress < 0.6) {
        const fadeProgress = interpolate(progress, [0.3, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        beeRef.current.scale.setScalar(1 - fadeProgress * 0.5);
        beeRef.current.rotation.x += 0.05 * delta * 60;
        beeRef.current.rotation.z += 0.03 * delta * 60;
        beeRef.current.position.y = interpolate(fadeProgress, [0, 1], [5, -20], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.ease) });

        beeRef.current.children.forEach((child) => {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.opacity = Math.max(0, 1 - fadeProgress);
            child.material.transparent = true;
          }
        });
      } else {
        beeRef.current.visible = false;
      }
    }

    if (textRef.current) {
      if (sceneProgress > 0.4) {
        textRef.current.visible = true;
        const textProgress = interpolate(sceneProgress, [0.4, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.ease) });
        textRef.current.material.opacity = textProgress;
        textRef.current.position.y = interpolate(textProgress, [0, 1], [35, 25], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.ease) });
        textRef.current.scale.setScalar(0.8 + textProgress * 0.2);
      } else {
        textRef.current.visible = false;
      }
    }

    camera.position.z = interpolate(sceneProgress, [0, 1], [80, 60], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeInOut });
    camera.lookAt(0, 0, 0);
  });
};