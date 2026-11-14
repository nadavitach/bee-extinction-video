import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface Scene {
  id: string;
  start: number;
  end: number;
  component: React.ComponentType<any>;
}

interface SceneHookProps {
  scenes: Scene[];
  totalFrames: number;
}

export const SceneHook: React.FC<SceneHookProps> = ({ scenes, totalFrames }) => {
  const frame = useCurrentFrame();

  const activeScene = scenes.find(
    (s) => frame >= s.start && frame < s.end
  ) || scenes[scenes.length - 1];

  const prevScene = scenes.find(
    (s) => frame >= s.end && frame < s.end + 30
  );

  const nextScene = scenes.find(
    (s) => frame >= s.start - 30 && frame < s.start
  );

  const sceneProgress = activeScene
    ? interpolate(
        frame,
        [activeScene.start, activeScene.end],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  const transitionProgress = nextScene
    ? interpolate(
        frame,
        [nextScene.start - 30, nextScene.start],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
      )
    : prevScene
    ? 1 - interpolate(
        frame,
        [prevScene.end, prevScene.end + 30],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
      )
    : 1;

  return (
    <>
      {scenes.map((scene) => {
        const isActive = scene.id === activeScene.id;
        const isTransitioning = scene.id === nextScene?.id || scene.id === prevScene?.id;

        if (!isActive && !isTransitioning) return null;

        const opacity = scene.id === activeScene.id
          ? 1
          : scene.id === nextScene?.id
          ? transitionProgress
          : 1 - transitionProgress;

        const scale = scene.id === nextScene?.id
          ? interpolate(transitionProgress, [0, 1], [1.1, 1], { easing: Easing.out(Easing.ease) })
          : scene.id === prevScene?.id
          ? interpolate(transitionProgress, [0, 1], [1, 0.9], { easing: Easing.in(Easing.ease) })
          : 1;

        const yOffset = scene.id === nextScene?.id
          ? interpolate(transitionProgress, [0, 1], [100, 0], { easing: Easing.out(Easing.ease) })
          : scene.id === prevScene?.id
          ? interpolate(transitionProgress, [0, 1], [0, -100], { easing: Easing.in(Easing.ease) })
          : 0;

        return (
          <React.Fragment key={scene.id}>
            <scene.component
              style={{
                opacity,
                transform: `translateY(${yOffset}px) scale(${scale})`,
                pointerEvents: isActive ? "auto" : "none",
              }}
              sceneProgress={sceneProgress}
              frame={frame - scene.start}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};