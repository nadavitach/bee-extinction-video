# Bee Extinction Timeline - Remotion Video Project

A cinematic 1m55s vertical video (1080×1920, 30fps) exploring what happens when bees disappear, rendered in dramatic Minecraft-inspired voxel/pixel art style.

## Project Structure

```
bee-extinction-video/
├── src/
│   ├── index.ts                      # Entry point
│   ├── BeeExtinctionVideo.tsx        # Main composition (3450 frames)
│   ├── remotion.config.ts            # Remotion configuration
│   ├── webpack-override.ts           # Webpack config for shaders
│   ├── components/
│   │   ├── SceneHook.tsx             # Scene transitions & crossfades
│   │   ├── AudioProvider.tsx         # Procedural audio synthesis
│   │   ├── SubtitleProvider.tsx      # Timed subtitles with animations
│   │   ├── Vignette.tsx              # Vignette effect
│   │   ├── FilmGrain.tsx             # Animated film grain
│   │   ├── PixelCanvas.tsx           # Three.js canvas wrapper
│   │   └── shaders/
│   │       └── PixelShaderMaterial.ts # Custom voxel/pixel shaders
│   └── scenes/
│       ├── HookScene.tsx             # 0-3s: Opening hook
│       ├── Day1Scene.tsx             # 3-8s: Day 1
│       ├── Week1Scene.tsx            # 8-14s: Week 1
│       ├── Month1Scene.tsx           # 14-21s: Month 1
│       ├── Year1Scene.tsx            # 21-35s: Year 1
│       ├── Year5Scene.tsx            # 35-50s: Year 5
│       ├── Year10Scene.tsx           # 50-65s: Year 10
│       ├── Year50Scene.tsx           # 65-95s: Year 50
│       └── ConclusionScene.tsx       # 95-115s: Call to action
├── VIDEO_SCRIPT.md                   # Full narration script & audio cues
├── SCENE_BREAKDOWN.md                # Technical scene specifications
├── package.json
└── tsconfig.json
```

## Scene Timeline

| Scene | Time | Frames | Description |
|-------|------|--------|-------------|
| Hook | 0:00-0:03 | 0-90 | Bee vanishes, "VANISHED" text |
| Day 1 | 0:03-0:08 | 90-240 | Flowers wait unvisited |
| Week 1 | 0:08-0:14 | 240-420 | Crops fail (almonds, apples, blueberries) |
| Month 1 | 0:14-0:21 | 420-630 | Honey gone, herbivores starve |
| Year 1 | 0:21-0:35 | 630-1050 | 70% crops decline, prices 3x |
| Year 5 | 0:35-0:50 | 1050-1500 | Forests→grasslands, carbon collapse |
| Year 10 | 0:50-1:05 | 1500-1950 | Ocean dead zones, oxygen drops |
| Year 50 | 1:05-1:35 | 1950-2850 | Wasteland, domed cities |
| Conclusion | 1:35-1:55 | 2850-3450 | Bee returns, action steps |

**Total: 3,450 frames = 115 seconds at 30fps**

## Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Development studio (live preview)
npm run dev

# Build bundle
npm run build

# Render full quality video (takes 10-30 min)
npm run render

# Render preview (faster, lower quality)
npm run render:preview
```

## Technical Highlights

- **Procedural Audio**: All music/SFX synthesized at runtime (no external files)
- **Custom Shaders**: Pixelation, voxel coloring, noise-based texturing
- **Scene Transitions**: 1s crossfades with scale/position easing
- **Data Visualization**: Live-updating stat panels in later scenes
- **Particle Systems**: 500-4000 particles per scene (pollen, dust, life)
- **Pixel Fonts**: Press Start 2P / VT323 for authentic retro feel

## Scientific Accuracy

All ecological claims sourced from:
- FAO / IPBES 2016 (75% crops depend on pollinators)
- USDA (almonds 100% bee-pollinated)
- Gallai et al. 2009 (economic models)
- IPCC / UNCCD (climate/desertification projections)

## Output

- **Format**: MP4 (H.264 High Profile)
- **Resolution**: 1080 × 1920 (9:16 vertical)
- **Frame Rate**: 30 fps constant
- **Bitrate**: 15-20 Mbps
- **Audio**: AAC 48kHz stereo (procedural)

## Requirements

- Node.js 18+
- Remotion 4.0+
- Chrome/Chromium for rendering