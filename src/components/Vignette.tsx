import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface VignetteProps {
  intensity?: number;
}

export const Vignette: React.FC<VignetteProps> = ({ intensity = 0.5 }) => {
  const frame = useCurrentFrame();

  const pulseIntensity = interpolate(
    frame,
    [0, 1725, 3450],
    [intensity, intensity * 1.3, intensity],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${pulseIntensity}) 100%)`,
      }}
    />
  );
};