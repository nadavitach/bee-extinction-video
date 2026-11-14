# Scene Breakdown - Technical Specifications

## Global Settings
- **Resolution:** 1080 × 1920 (vertical 9:16)
- **Frame Rate:** 30 fps
- **Total Duration:** 115 seconds = 3,450 frames
- **Pixel Density:** 120px per voxel unit (configurable in shaders)

---

## Scene Timing Table

| Scene | ID | Start Frame | End Frame | Duration (frames) | Duration (seconds) |
|-------|-----|-------------|-----------|-------------------|-------------------|
| Hook | `hook` | 0 | 90 | 90 | 3.0 |
| Day 1 | `day1` | 90 | 240 | 150 | 5.0 |
| Week 1 | `week1` | 240 | 420 | 180 | 6.0 |
| Month 1 | `month1` | 420 | 630 | 210 | 7.0 |
| Year 1 | `year1` | 630 | 1050 | 420 | 14.0 |
| Year 5 | `year5` | 1050 | 1500 | 450 | 15.0 |
| Year 10 | `year10` | 1500 | 1950 | 450 | 15.0 |
| Year 50 | `year50` | 1950 | 2850 | 900 | 30.0 |
| Conclusion | `conclusion` | 2850 | 3450 | 600 | 20.0 |
| **TOTAL** | | **0** | **3450** | **3450** | **115.0** |

---

## Transition Specifications

- **Transition Duration:** 30 frames (1 second)
- **Easing:** `Easing.easeInOut` (cubic)
- **Crossfade:** Opacity + Scale (1.1 → 1.0 entering, 1.0 → 0.9 exiting)
- **Vertical Offset:** ±100px slide during transition

---

## Scene Details

### 1. Hook Scene (`HookScene.tsx`)
**Frames 0–90**
- **Camera:** Start Z=80, dolly to Z=60
- **Key Elements:**
  - 3000 particle swarm (gold/red/blue)
  - Single bee model (box + stripes + wings)
  - "VANISHED" text plane (appears at frame 36)
- **Animation:**
  - Particles: Slow rotation + vertical sine wave
  - Bee: Hover → fall apart (frames 27–54) → disappear
  - Text: Fade in + scale up (frames 36–63)
- **Colors:** Dark bg (#050508), warm particles

### 2. Day 1 Scene (`Day1Scene.tsx`)
**Frames 90–240**
- **Camera:** Orbital radius 8, height 5→8
- **Key Elements:**
  - 150 procedural flowers (5 types)
  - 500 pollen particles (gold, rising)
  - Grass ground plane (vertex colors)
- **Animation:**
  - Flowers: Gentle sway + petal breathing
  - Pollen: Upward drift, respawn at top
  - Camera: Slow orbit around meadow

### 3. Week 1 Scene (`Week1Scene.tsx`)
**Frames 240–420**
- **Camera:** Higher (Y=8→12), wider orbit
- **Key Elements:**
  - 3 crop zones: Almond (144), Apple (100), Blueberry (225)
  - Each tree: trunk + canopy + 8 fruits
  - 800 dust particles
- **Animation:**
  - Canopies: Wilt (scale Y 1.0→0.4)
  - Fruits: Shrink + fall (opacity 1→0)
  - Trunks: Lean/rotate as dying
  - Dust: Constant drift

### 4. Month 1 Scene (`Month1Scene.tsx`)
**Frames 420–630**
- **Camera:** Night lighting, Y=12→17
- **Key Elements:**
  - 200 trees (trunk + cone canopy)
  - 30 herbivores (box bodies + legs)
  - 1000 dust particles
- **Animation:**
  - Trees: Color lerp green→brown, scale Y down
  - Herbivores: Health 1→0, collapse when <0.5
  - Camera: Slow orbit, moon lighting

### 5. Year 1 Scene (`Year1Scene.tsx`)
**Frames 630–1050**
- **Camera:** Wide (Z=80), data displays
- **Key Elements:**
  - 3 biomes: Forest, Grassland, Farmland
  - 4 data panels (live updating)
  - 1500 dust/sand particles
- **Animation:**
  - Biomes: Progressive die-off
  - Data panels: Real-time number interpolation
  - Camera: Slow wide orbit

### 6. Year 5 Scene (`Year5Scene.tsx`)
**Frames 1050–1500**
- **Camera:** Higher (Y=30→45), desert
- **Key Elements:**
  - 50 dead trees / grass tufts
  - 4 data panels (climate metrics)
  - 3000 dust storm particles (directional wind)
- **Animation:**
  - Grass: Final die-off
  - Dust: Strong horizontal wind
  - Data: Forest 15%, Carbon 25GT, Temp +2.8°C

### 7. Year 10 Scene (`Year10Scene.tsx`)
**Frames 1500–1950**
- **Camera:** Ocean level, blue fog
- **Key Elements:**
  - Water plane (vertex displacement)
  - 80 coastal plants + fish
  - 4 data panels (ocean metrics)
  - 2000 suspended particles
- **Animation:**
  - Water: Shader wave displacement
  - Plants: Die off near shore
  - Fish: Health decline, float belly-up
  - Data: Fish 10%, Oxygen 60%, Dead zones 45%

### 8. Year 50 Scene (`Year50Scene.tsx`)
**Frames 1950–2850**
- **Camera:** High (Y=40→60), vast wasteland
- **Key Elements:**
  - 100 ruins/rocks on dunes
  - Domed city (sphere + towers + farm)
  - 4000 massive dust storm
- **Animation:**
  - Dome: Slow rotation, pulsing lights
  - Farm: Subtle growth animation
  - Dust: Extreme horizontal wind
  - Camera: Very slow majestic orbit

### 9. Conclusion Scene (`ConclusionScene.tsx`)
**Frames 2850–3450**
- **Camera:** Intimate (Z=40→25), warm lighting
- **Key Elements:**
  - 100 blooming flowers (scale 0→1)
  - Single bee (returns, flies)
  - 5 action text panels (staggered)
  - 1000 life particles (rising gold/green/blue)
- **Animation:**
  - Flowers: Staggered bloom
  - Bee: Enters, flies around
  - Text: Staggered fade-in (0.1s delays)
  - Particles: Upward drift (life returning)
  - Camera: Dolly in, warm golden hour

---

## Shader Uniforms (Shared)

| Uniform | Type | Default | Purpose |
|---------|------|---------|---------|
| `uTime` | float | 0 | Animation time |
| `uPixelSize` | float | 120 | Pixelation resolution |
| `uNoiseScale` | float | 3.0 | Noise frequency |

---

## Performance Targets

- **Target FPS:** 30 (render), 60 (studio preview)
- **Triangle Budget:** ~50k per scene
- **Draw Calls:** <100 per scene (instancing where possible)
- **Texture Memory:** <50MB (procedural + small canvases)
- **Particle Count:** 500–4000 per scene

---

## Render Commands

```bash
# Development preview
npm run dev

# Full render (may take 10-30 min)
npm run render

# Quick preview (lower quality)
npm run render:preview
```

---

## Output Specifications

- **Format:** MP4 (H.264 High Profile)
- **Resolution:** 1080 × 1920
- **Frame Rate:** 30 fps constant
- **Bitrate:** 15-20 Mbps (high quality)
- **Audio:** AAC 48kHz stereo (generated procedurally)
- **Color Space:** sRGB