import React, { useEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

const SCENE_AUDIO_CUES = {
  hook: { start: 0, end: 90, sfx: "wind_howl", music: "drone_low" },
  day1: { start: 90, end: 240, sfx: "buzzing_fade", music: "tension_1" },
  week1: { start: 240, end: 420, sfx: "silence", music: "tension_2" },
  month1: { start: 420, end: 630, sfx: "wind_plants", music: "melancholy" },
  year1: { start: 630, end: 1050, sfx: "dust_storm", music: "dark_ambient" },
  year5: { start: 1050, end: 1500, sfx: "desert_wind", music: "desolate" },
  year10: { start: 1500, end: 1950, sfx: "dead_silence", music: "void" },
  year50: { start: 1950, end: 2850, sfx: "ancient_wind", music: "ancient" },
  conclusion: { start: 2850, end: 3450, sfx: "heartbeat", music: "hopeful_resolve" },
} as const;

type SceneId = keyof typeof SCENE_AUDIO_CUES;

interface AudioProviderProps {
  scenes: { id: SceneId; start: number; end: number }[];
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const activeSceneRef = useRef<SceneId>("hook");
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    Object.values(SCENE_AUDIO_CUES).forEach((cue) => {
      if (!audioRefs.current[cue.music]) {
        audioRefs.current[cue.music] = new Audio();
        audioRefs.current[cue.music].loop = true;
        audioRefs.current[cue.music].src = generateTone(cue.music);
      }
      if (!audioRefs.current[cue.sfx]) {
        audioRefs.current[cue.sfx] = new Audio();
        audioRefs.current[cue.sfx].loop = true;
        audioRefs.current[cue.sfx].src = generateSFX(cue.sfx);
      }
    });

    const handleClick = () => {
      audioContext.resume();
      Object.values(audioRefs.current).forEach((audio) => {
        audio.play().catch(() => {});
      });
    };

    document.body.addEventListener("click", handleClick, { once: true });

    return () => {
      document.body.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const activeScene = scenes.find((s) => frame >= s.start && frame < s.end)?.id || "hook";

    if (activeScene !== activeSceneRef.current) {
      activeSceneRef.current = activeScene;
      const cue = SCENE_AUDIO_CUES[activeScene];

      Object.entries(audioRefs.current).forEach(([key, audio]) => {
        const shouldPlay = key === cue.music || key === cue.sfx;
        if (shouldPlay && audio.paused) {
          audio.currentTime = 0;
          audio.volume = key === cue.music ? 0.4 : 0.6;
          audio.play().catch(() => {});
        } else if (!shouldPlay && !audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    }

    const cue = SCENE_AUDIO_CUES[activeScene];
    const music = audioRefs.current[cue.music];

    if (music) {
      const fadeFrames = 30;
      const sceneStart = scenes.find((s) => s.id === activeScene)?.start || 0;
      const sceneEnd = scenes.find((s) => s.id === activeScene)?.end || 0;
      const progress = (frame - sceneStart) / (sceneEnd - sceneStart);

      if (progress < fadeFrames / (sceneEnd - sceneStart)) {
        music.volume = 0.4 * (progress * (sceneEnd - sceneStart) / fadeFrames);
      } else if (progress > 1 - fadeFrames / (sceneEnd - sceneStart)) {
        music.volume = 0.4 * (1 - (progress - (1 - fadeFrames / (sceneEnd - sceneStart))) * (sceneEnd - sceneStart) / fadeFrames);
      } else {
        music.volume = 0.4;
      }
    }
  }, [frame, scenes, fps]);

  return null;
};

function generateTone(type: string): string {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = ctx.sampleRate;
  const duration = 10;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  const frequencies: Record<string, number[]> = {
    drone_low: [55, 82.5, 110],
    tension_1: [73.4, 110, 146.8],
    tension_2: [65.4, 98, 130.8],
    melancholy: [87.3, 130.8, 174.6],
    dark_ambient: [41.2, 61.7, 82.4],
    desolate: [36.7, 55, 73.4],
    void: [27.5, 41.2, 55],
    ancient: [49, 73.4, 98],
    hopeful_resolve: [110, 164.8, 220],
  };

  const freq = frequencies[type] || [110];

  for (let i = 0; i < buffer.length; i++) {
    let sample = 0;
    freq.forEach((f, idx) => {
      sample += Math.sin(2 * Math.PI * f * i / sampleRate) * (0.3 / (idx + 1));
    });
    const envelope = Math.min(1, i / (sampleRate * 0.5)) * Math.min(1, (buffer.length - i) / (sampleRate * 2));
    data[i] = sample * envelope * 0.15;
  }

  return bufferToWav(buffer);
}

function generateSFX(type: string): string {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = ctx.sampleRate;
  const duration = 5;
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    let sample = 0;
    const t = i / sampleRate;

    switch (type) {
      case "wind_howl":
        sample = (Math.random() * 2 - 1) * Math.exp(-t * 0.3) * 0.1;
        break;
      case "buzzing_fade":
        sample = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 0.5) * 0.05;
        break;
      case "silence":
        sample = 0;
        break;
      case "wind_plants":
        sample = (Math.random() * 2 - 1) * 0.03 * (0.5 + 0.5 * Math.sin(t * 0.7));
        break;
      case "dust_storm":
        sample = (Math.random() * 2 - 1) * 0.08 * (0.3 + 0.7 * Math.sin(t * 0.3));
        break;
      case "desert_wind":
        sample = (Math.random() * 2 - 1) * 0.06 * Math.exp(-t * 0.1);
        break;
      case "dead_silence":
        sample = (Math.random() * 2 - 1) * 0.005;
        break;
      case "ancient_wind":
        sample = (Math.random() * 2 - 1) * 0.04 * Math.sin(t * 0.1);
        break;
      case "heartbeat":
        sample = Math.sin(2 * Math.PI * 1.2 * t) * Math.exp(-(t % 0.83) * 10) * 0.1;
        break;
    }
    data[i] = sample;
  }

  return bufferToWav(buffer);
}

function bufferToWav(buffer: AudioBuffer): string {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize - 8;

  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return URL.createObjectURL(new Blob([arrayBuffer], { type: "audio/wav" }));
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}