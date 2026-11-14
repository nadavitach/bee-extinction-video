import React, { useEffect, useRef, useState } from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface Scene {
  id: string;
  start: number;
  end: number;
}

interface SubtitleLine {
  text: string;
  startFrame: number;
  endFrame: number;
  emphasis?: boolean;
}

const SUBTITLES: Record<string, SubtitleLine[]> = {
  hook: [
    { text: "What if every bee on Earth...", startFrame: 0, endFrame: 45, emphasis: true },
    { text: "vanished... right now?", startFrame: 45, endFrame: 90, emphasis: true },
  ],
  day1: [
    { text: "Day 1: The silence begins.", startFrame: 90, endFrame: 150 },
    { text: "No buzzing. No pollination.", startFrame: 150, endFrame: 210 },
    { text: "Flowers wait... unvisited.", startFrame: 210, endFrame: 240, emphasis: true },
  ],
  week1: [
    { text: "Week 1: Crops fail to set fruit.", startFrame: 240, endFrame: 300 },
    { text: "Almonds, apples, blueberries —", startFrame: 300, endFrame: 360 },
    { text: "gone from the shelves.", startFrame: 360, endFrame: 420, emphasis: true },
  ],
  month1: [
    { text: "Month 1: Honey disappears.", startFrame: 420, endFrame: 480 },
    { text: "Beekeepers lose livelihoods.", startFrame: 480, endFrame: 540 },
    { text: "Wild plants stop reproducing.", startFrame: 540, endFrame: 600 },
    { text: "Herbivores starve.", startFrame: 600, endFrame: 630, emphasis: true },
  ],
  year1: [
    { text: "Year 1: 70% of crops decline.", startFrame: 630, endFrame: 720 },
    { text: "Food prices triple globally.", startFrame: 720, endFrame: 810 },
    { text: "Coffee, chocolate, cotton —", startFrame: 810, endFrame: 900 },
    { text: "luxury becomes impossible.", startFrame: 900, endFrame: 990 },
    { text: "Ecosystems unravel.", startFrame: 990, endFrame: 1050, emphasis: true },
  ],
  year5: [
    { text: "Year 5: Forests turn to grasslands.", startFrame: 1050, endFrame: 1140 },
    { text: "No tree regeneration.", startFrame: 1140, endFrame: 1200 },
    { text: "Carbon storage collapses.", startFrame: 1200, endFrame: 1290 },
    { text: "Climate accelerates.", startFrame: 1290, endFrame: 1380, emphasis: true },
    { text: "Famine spreads.", startFrame: 1380, endFrame: 1500 },
  ],
  year10: [
    { text: "Year 10: Marine life suffers.", startFrame: 1500, endFrame: 1590 },
    { text: "No coastal plants = no nurseries.", startFrame: 1590, endFrame: 1680 },
    { text: "Fish stocks crash.", startFrame: 1680, endFrame: 1770 },
    { text: "Oxygen production drops.", startFrame: 1770, endFrame: 1860 },
    { text: "The air grows thinner.", startFrame: 1860, endFrame: 1950, emphasis: true },
  ],
  year50: [
    { text: "Year 50: A world unrecognizable.", startFrame: 1950, endFrame: 2070 },
    { text: "Deserts where forests stood.", startFrame: 2070, endFrame: 2160 },
    { text: "Humanity survives... barely.", startFrame: 2160, endFrame: 2280 },
    { text: "On synthetic food.", startFrame: 2280, endFrame: 2370 },
    { text: "In domed cities.", startFrame: 2370, endFrame: 2490 },
    { text: "Remembering the buzz.", startFrame: 2490, endFrame: 2610, emphasis: true },
    { text: "That we ignored.", startFrame: 2610, endFrame: 2850, emphasis: true },
  ],
  conclusion: [
    { text: "But this future isn't written.", startFrame: 2850, endFrame: 2940, emphasis: true },
    { text: "Bees are declining — not gone.", startFrame: 2940, endFrame: 3030 },
    { text: "Plant native flowers.", startFrame: 3030, endFrame: 3120 },
    { text: "Ban neonicotinoids.", startFrame: 3120, endFrame: 3210 },
    { text: "Support local beekeepers.", startFrame: 3210, endFrame: 3300 },
    { text: "Act now.", startFrame: 3300, endFrame: 3390, emphasis: true },
    { text: "Before the silence is permanent.", startFrame: 3390, endFrame: 3450, emphasis: true },
  ],
};

export const SubtitleProvider: React.FC<{ scenes: Scene[]; totalFrames: number }> = ({ scenes, totalFrames }) => {
  const frame = useCurrentFrame();
  const [visibleLines, setVisibleLines] = useState<SubtitleLine[]>([]);

  useEffect(() => {
    let currentLines: SubtitleLine[] = [];

    scenes.forEach((scene) => {
      const lines = SUBTITLES[scene.id] || [];
      lines.forEach((line) => {
        const globalStart = scene.start + line.startFrame;
        const globalEnd = scene.start + line.endFrame;
        if (frame >= globalStart && frame < globalEnd) {
          currentLines.push({ ...line, startFrame: globalStart, endFrame: globalEnd });
        }
      });
    });

    setVisibleLines(currentLines);
  }, [frame, scenes]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "120px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "900px",
        pointerEvents: "none",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {visibleLines.map((line, idx) => {
        const duration = line.endFrame - line.startFrame;
        const fadeFrames = Math.min(15, Math.floor(duration / 3));

        const progress = duration > fadeFrames * 2
          ? interpolate(
              frame,
              [line.startFrame, line.startFrame + fadeFrames, line.endFrame - fadeFrames, line.endFrame],
              [0, 1, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.ease) }
            )
          : interpolate(
              frame,
              [line.startFrame, line.endFrame],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

        const yOffset = interpolate(
          progress,
          [0, 1],
          [30, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.ease) }
        );

        return (
          <div
            key={`${line.startFrame}-${idx}`}
            style={{
              opacity: progress,
              transform: `translateY(${yOffset}px)`,
              textAlign: "center",
              textShadow: "0 4px 24px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
            }}
          >
            <span
              style={{
                fontFamily: "'Press Start 2P', 'VT323', monospace",
                fontSize: line.emphasis ? "28px" : "22px",
                fontWeight: line.emphasis ? "700" : "400",
                color: line.emphasis ? "#ffd700" : "#ffffff",
                lineHeight: 1.4,
                letterSpacing: "0.5px",
                display: "inline-block",
                padding: "8px 20px",
                background: "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(20,20,30,0.5) 100%)",
                borderRadius: "8px",
                border: line.emphasis ? "2px solid #ffd700" : "1px solid rgba(255,215,0,0.3)",
                backdropFilter: "blur(4px)",
                animation: line.emphasis ? "pulse 2s ease-in-out infinite" : "none",
              }}
            >
              {line.text}
            </span>
          </div>
        );
      })}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.4); }
          50% { box-shadow: 0 0 20px 4px rgba(255,215,0,0.2); }
        }
      `}</style>
    </div>
  );
};