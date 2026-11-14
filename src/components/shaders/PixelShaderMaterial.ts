import * as THREE from "three";

export const pixelVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const pixelFragmentShader = `
  uniform float uTime;
  uniform float uPixelSize;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uNoiseScale;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 pixelUv = floor(vUv * uPixelSize) / uPixelSize;
    float n = fbm(pixelUv * uNoiseScale + uTime * 0.02);

    vec3 color = mix(uColorA, uColorB, n);

    float lighting = dot(vNormal, normalize(vec3(0.5, 1.0, 0.3))) * 0.5 + 0.5;
    color *= lighting;

    float vignette = 1.0 - length(vUv - 0.5) * 0.8;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export class PixelShaderMaterial extends THREE.ShaderMaterial {
  constructor(params: {
    colorA?: THREE.Color;
    colorB?: THREE.Color;
    pixelSize?: number;
    noiseScale?: number;
  } = {}) {
    super({
      vertexShader: pixelVertexShader,
      fragmentShader: pixelFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelSize: { value: params.pixelSize || 120 },
        uColorA: { value: params.colorA || new THREE.Color(0x2d5a2d) },
        uColorB: { value: params.colorB || new THREE.Color(0x1a3a1a) },
        uNoiseScale: { value: params.noiseScale || 3.0 },
      },
    });
  }

  updateTime(time: number) {
    this.uniforms.uTime.value = time;
  }
}

export const blockVertexShader = `
  attribute float aBlockId;
  attribute vec3 aOffset;
  varying float vBlockId;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vBlockId = aBlockId;
    vWorldPos = (modelMatrix * vec4(position + aOffset, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + aOffset, 1.0);
  }
`;

export const blockFragmentShader = `
  uniform float uTime;
  uniform sampler2D uTexture;
  uniform float uPixelSize;
  varying float vBlockId;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  vec3 palette(float id) {
    vec3 colors[16];
    colors[0] = vec3(0.10, 0.35, 0.10);  // dark grass
    colors[1] = vec3(0.20, 0.55, 0.15);  // grass
    colors[2] = vec3(0.35, 0.70, 0.20);  // bright grass
    colors[3] = vec3(0.55, 0.35, 0.15);  // dirt
    colors[4] = vec3(0.40, 0.25, 0.12);  // dark dirt
    colors[5] = vec3(0.60, 0.60, 0.60);  // stone
    colors[6] = vec3(0.45, 0.45, 0.45);  // dark stone
    colors[7] = vec3(0.95, 0.85, 0.30);  // flower yellow
    colors[8] = vec3(0.90, 0.30, 0.30);  // flower red
    colors[9] = vec3(0.30, 0.60, 0.90);  // flower blue
    colors[10] = vec3(0.15, 0.15, 0.25); // dead grass
    colors[11] = vec3(0.25, 0.20, 0.15); // sand
    colors[12] = vec3(0.80, 0.30, 0.10); // fire orange
    colors[13] = vec3(0.05, 0.05, 0.10); // void
    colors[14] = vec3(0.60, 0.40, 0.20); // wood
    colors[15] = vec3(0.30, 0.20, 0.10); // dark wood

    int idx = int(mod(id, 16.0));
    return colors[idx];
  }

  float hash(float n) {
    return fract(sin(n) * 43758.5453);
  }

  float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 baseColor = palette(vBlockId);

    vec2 pixelUv = floor(vUv * uPixelSize) / uPixelSize;
    float noise = hash2(pixelUv * 5.0 + uTime * 0.01);

    vec3 color = baseColor * (0.8 + 0.4 * noise);

    float ao = 1.0 - hash(vBlockId) * 0.3;
    color *= ao;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export class BlockShaderMaterial extends THREE.ShaderMaterial {
  constructor(params: { pixelSize?: number } = {}) {
    super({
      vertexShader: blockVertexShader,
      fragmentShader: blockFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelSize: { value: params.pixelSize || 120 },
      },
    });
  }

  updateTime(time: number) {
    this.uniforms.uTime.value = time;
  }
}