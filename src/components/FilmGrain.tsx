import React, { useEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";

interface FilmGrainProps {
  opacity?: number;
}

export const FilmGrain: React.FC<FilmGrainProps> = ({ opacity = 0.1 }) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameRef = useRef(-1);
  const noiseDataRef = useRef<Uint8ClampedArray | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    const generateNoise = (seed: number) => {
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      const random = mulberry32(seed);

      for (let i = 0; i < data.length; i += 4) {
        const noise = (random() - 0.5) * 255 * opacity * 2;
        data[i] = noise;
        data[i + 1] = noise;
        data[i + 2] = noise;
        data[i + 3] = Math.abs(noise) * 0.5;
      }

      noiseDataRef.current = data;
      ctx.putImageData(imageData, 0, 0);
    };

    generateNoise(frame);

    const animate = () => {
      if (frame !== lastFrameRef.current) {
        lastFrameRef.current = frame;
        generateNoise(frame);
      }
      requestAnimationFrame(animate);
    };

    animate();
  }, [frame, opacity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 51,
        mixBlendMode: "overlay",
        opacity: opacity,
        imageRendering: "pixelated",
      }}
    />
  );
};

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}