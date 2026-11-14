import React, { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PixelShaderMaterial } from "./shaders/PixelShaderMaterial";

interface PixelCanvasProps {
  style?: React.CSSProperties;
}

export const PixelCanvas: React.FC<PixelCanvasProps> = ({ style }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        ...style,
      }}
    >
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 50], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, antialias: false }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <PixelScene />
      </Canvas>
    </div>
  );
};

const PixelScene: React.FC = () => {
  const { scene, camera } = useThree();
  const frame = useFrame();

  useEffect(() => {
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.008);
  }, [scene]);

  useEffect(() => {
    const ambient = new THREE.AmbientLight(0x444466, 0.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffddaa, 1);
    dirLight.position.set(100, 200, 50);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xaaaaff, 0.3);
    dirLight2.position.set(-100, 100, -50);
    scene.add(dirLight2);

    return () => {
      scene.remove(ambient);
      scene.remove(dirLight);
      scene.remove(dirLight2);
    };
  }, [scene]);

  return null;
};