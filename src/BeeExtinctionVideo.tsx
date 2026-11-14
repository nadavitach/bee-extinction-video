import React from "react";
import {
  Composition,
  useVideoConfig,
  interpolate,
  Easing,
  AbsoluteFill,
} from "remotion";
import { Canvas } from "@react-three/fiber";
import { SceneHook } from "./components/SceneHook";
import { HookScene } from "./scenes/HookScene";
import { Day1Scene } from "./scenes/Day1Scene";
import { Week1Scene } from "./scenes/Week1Scene";
import { Month1Scene } from "./scenes/Month1Scene";
import { Year1Scene } from "./scenes/Year1Scene";
import { Year5Scene } from "./scenes/Year5Scene";
import { Year10Scene } from "./scenes/Year10Scene";
import { Year50Scene } from "./scenes/Year50Scene";
import { ConclusionScene } from "./scenes/ConclusionScene";
import { AudioProvider } from "./components/AudioProvider";
import { SubtitleProvider } from "./components/SubtitleProvider";
import { Vignette } from "./components/Vignette";
import { FilmGrain } from "./components/FilmGrain";

export const BeeExtinctionVideo: React.FC = () => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const totalFrames = durationInFrames;

  const scenes = [
    { id: "hook", start: 0, end: 90, component: HookScene }, // 0-3s
    { id: "day1", start: 90, end: 240, component: Day1Scene }, // 3-8s
    { id: "week1", start: 240, end: 420, component: Week1Scene }, // 8-14s
    { id: "month1", start: 420, end: 630, component: Month1Scene }, // 14-21s
    { id: "year1", start: 630, end: 1050, component: Year1Scene }, // 21-35s
    { id: "year5", start: 1050, end: 1500, component: Year5Scene }, // 35-50s
    { id: "year10", start: 1500, end: 1950, component: Year10Scene }, // 50-65s
    { id: "year50", start: 1950, end: 2850, component: Year50Scene }, // 65-95s
    { id: "conclusion", start: 2850, end: 3450, component: ConclusionScene }, // 95-115s
  ];

  return (
    <AbsoluteFill style={{ background: "#0a0a0f" }}>
      <AudioProvider scenes={scenes} />
      <SubtitleProvider scenes={scenes} totalFrames={totalFrames} />
      <SceneHook scenes={scenes} totalFrames={totalFrames} />
      <Vignette intensity={0.6} />
      <FilmGrain opacity={0.08} />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BeeExtinctionVideo"
        component={BeeExtinctionVideo}
        durationInFrames={3450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
    </>
  );
};