'use strict';

const RIPPLE_COUNT = 8;
const TILE_SIZE = 32;
const RIPPLE_LIFETIME = 4.8;
const ripples = Array.from(
  { length: RIPPLE_COUNT },
  () => ({ x: 0.5, y: 0.5, start: -100, strength: 0 })
);
const rippleUniformData = new Float32Array(RIPPLE_COUNT * 4);
const usesWorkerAnimationFrame = typeof self.requestAnimationFrame === 'function';
const scheduleFrame = usesWorkerAnimationFrame
  ? (callback) => self.requestAnimationFrame(callback)
  : (callback) => self.setTimeout(() => callback(performance.now()), 16);
const cancelFrame = usesWorkerAnimationFrame
  ? (id) => self.cancelAnimationFrame(id)
  : (id) => self.clearTimeout(id);

let canvas = null;
let gl = null;
let program = null;
let vao = null;
let uniforms = null;
let rippleCursor = 0;
let lastPointerRippleAt = 0;
let lastPointerX = -100;
let lastPointerY = -100;
let lastPointerActivityAt = 0;
let viewportWidth = 1;
let viewportHeight = 1;
let constrainedDevice = false;
let lightTheme = false;
let visible = true;
let stopped = false;
let rafId = 0;
let lastFrame = 0;
let tileColumns = 0;
let tileRows = 0;
let dirtyTiles = new Uint8Array(0);

const compileShader = (context, type, source) => {
  const shader = context.createShader(type);
  if (!shader) return null;
  context.shaderSource(shader, source);
  context.compileShader(shader);
  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    context.deleteShader(shader);
    return null;
  }
  return shader;
};

const createProgram = (context, vertexSource, fragmentSource) => {
  const vertexShader = compileShader(context, context.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(context, context.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    if (vertexShader) context.deleteShader(vertexShader);
    if (fragmentShader) context.deleteShader(fragmentShader);
    return null;
  }
  const nextProgram = context.createProgram();
  if (!nextProgram) return null;
  context.attachShader(nextProgram, vertexShader);
  context.attachShader(nextProgram, fragmentShader);
  context.linkProgram(nextProgram);
  context.deleteShader(vertexShader);
  context.deleteShader(fragmentShader);
  if (!context.getProgramParameter(nextProgram, context.LINK_STATUS)) {
    context.deleteProgram(nextProgram);
    return null;
  }
  return nextProgram;
};

const vertexSource = `#version 300 es
  precision highp float;
  out vec2 vUv;
  void main() {
    vec2 position = gl_VertexID == 0 ? vec2(-1.0, -1.0) :
                    gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0);
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentSource = `#version 300 es
  precision highp float;
  #define RIPPLE_COUNT 8
  in vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uLightTheme;
  uniform vec4 uRipples[RIPPLE_COUNT];
  out vec4 outColor;

  float hash21(vec2 point) {
    vec3 p = fract(vec3(point.xyx) * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float paperNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    float a = hash21(cell);
    float b = hash21(cell + vec2(1.0, 0.0));
    float c = hash21(cell + vec2(0.0, 1.0));
    float d = hash21(cell + vec2(1.0, 1.0));
    return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
  }

  void accumulateWave(
    vec2 uv,
    vec2 waveSource,
    float waveRadius,
    float baseAmplitude,
    float aspect,
    inout float totalHeight,
    inout float totalEnergy,
    inout float totalFoam,
    inout vec2 totalSlope
  ) {
    vec2 delta = uv - waveSource;
    delta.x *= aspect;
    float distanceToSource = max(length(delta), 0.001);
    float distanceFromFront = distanceToSource - waveRadius;
    if (abs(distanceFromFront) > 0.14) return;
    vec2 direction = delta / distanceToSource;
    float normalizedFront = distanceFromFront / 0.04;
    float localBand = exp(-(normalizedFront * normalizedFront));
    float amplitude = baseAmplitude * localBand;
    float phase = distanceFromFront * 130.0;
    float primary = sin(phase);
    float detail = sin(phase * 1.72 + waveRadius * 28.0) * 0.14;
    float wave = (primary + detail) * amplitude;
    totalHeight += wave;
    totalEnergy += abs(wave);
    totalFoam += pow(max(0.0, primary), 12.0) * amplitude;
    float derivative = (cos(phase) * 130.0 + cos(phase * 1.72 + waveRadius * 28.0) * 31.3) * amplitude;
    totalSlope += direction * derivative;
  }

  void main() {
    float aspect = uResolution.x / max(1.0, uResolution.y);
    float height = 0.0;
    float energy = 0.0;
    float foam = 0.0;
    float inkWash = 0.0;
    vec2 slope = vec2(0.0);
    float paperGrain = 0.5;
    float fiberGrain = 0.5;
    if (uLightTheme > 0.5) {
      paperGrain = paperNoise(vUv * vec2(42.0, 31.0));
      fiberGrain = hash21(floor(vUv * uResolution * 0.22));
    }

    for (int i = 0; i < RIPPLE_COUNT; i++) {
      vec4 source = uRipples[i];
      float age = uTime - source.z;
      if (age < 0.0 || age > 4.8 || source.w <= 0.0) continue;
      float attack = smoothstep(0.0, 0.1, age);
      float waveRadius = age * 0.11;
      float decay = exp(-age * 0.46);
      float amplitude = source.w * attack * decay;
      accumulateWave(vUv, source.xy, waveRadius, amplitude, aspect, height, energy, foam, slope);

      if (uLightTheme > 0.5) {
        vec2 inkDelta = vUv - source.xy;
        inkDelta.x *= aspect;
        float inkDistance = max(length(inkDelta), 0.001);
        float approximateFront = inkDistance - waveRadius;
        if (abs(approximateFront) < 0.17) {
          float inkAngle = atan(inkDelta.y, inkDelta.x);
          float edgeWarp = (paperGrain - 0.5) * 0.036
            + sin(inkAngle * 7.0 + source.x * 19.0 + source.y * 13.0) * 0.006;
          float frontDistance = approximateFront + edgeWarp;
          float normalizedInkFront = frontDistance / 0.078;
          float featheredFront = exp(-(normalizedInkFront * normalizedInkFront));
          float diffusion = smoothstep(0.04, 0.36, age) * exp(-age * 0.34);
          inkWash += featheredFront * source.w * diffusion * (0.42 + paperGrain * 0.58);
        }
      }

      float edgeWidth = 0.045;
      float leftCollision = smoothstep(source.x * aspect - edgeWidth, source.x * aspect + edgeWidth, waveRadius);
      float rightDistance = (1.0 - source.x) * aspect;
      float rightCollision = smoothstep(rightDistance - edgeWidth, rightDistance + edgeWidth, waveRadius);
      float bottomCollision = smoothstep(source.y - edgeWidth, source.y + edgeWidth, waveRadius);
      float topDistance = 1.0 - source.y;
      float topCollision = smoothstep(topDistance - edgeWidth, topDistance + edgeWidth, waveRadius);
      float reflection = 0.58;

      if (leftCollision > 0.0) {
        accumulateWave(vUv, vec2(-source.x, source.y), waveRadius, amplitude * reflection * leftCollision, aspect, height, energy, foam, slope);
      }
      if (rightCollision > 0.0) {
        accumulateWave(vUv, vec2(2.0 - source.x, source.y), waveRadius, amplitude * reflection * rightCollision, aspect, height, energy, foam, slope);
      }
      if (bottomCollision > 0.0) {
        accumulateWave(vUv, vec2(source.x, -source.y), waveRadius, amplitude * reflection * bottomCollision, aspect, height, energy, foam, slope);
      }
      if (topCollision > 0.0) {
        accumulateWave(vUv, vec2(source.x, 2.0 - source.y), waveRadius, amplitude * reflection * topCollision, aspect, height, energy, foam, slope);
      }
    }

    if (energy < 0.0001 && inkWash < 0.0001) {
      outColor = vec4(0.0);
      return;
    }

    slope.x *= aspect;
    vec3 normal = normalize(vec3(-slope * 0.045, 1.0));
    vec3 lightDirection = normalize(vec3(-0.42, 0.52, 0.74));
    vec3 viewDirection = vec3(0.0, 0.0, 1.0);
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), 42.0);
    float rim = pow(1.0 - max(normal.z, 0.0), 2.2);
    float crest = smoothstep(0.02, 0.34, height);
    float trough = smoothstep(0.02, 0.34, -height);

    vec3 darkColor = vec3(0.025, 0.12, 0.2);
    vec3 darkCrest = vec3(0.14, 0.72, 0.95);
    vec3 lightColor = vec3(0.09, 0.105, 0.1);
    vec3 lightCrest = vec3(0.24, 0.28, 0.27);
    vec3 base = mix(darkColor, lightColor, uLightTheme);
    vec3 highlight = mix(darkCrest, lightCrest, uLightTheme);
    vec3 troughColor = mix(vec3(0.04, 0.1, 0.18), vec3(0.105, 0.115, 0.11), uLightTheme);
    vec3 color = base * (0.28 + diffuse * 0.72);
    color += highlight * (crest * 0.72 + foam * 0.62 + specular * 1.2 + rim * 0.18);
    color += troughColor * trough * mix(1.0, 0.72, uLightTheme);
    float pigment = inkWash * (0.48 + fiberGrain * 0.52) * uLightTheme;
    color = mix(color, vec3(0.035, 0.041, 0.038), clamp(pigment * 0.42, 0.0, 0.3));
    float alpha = energy * 0.7 + foam * 0.38 + specular * 0.52 + rim * 0.06;
    alpha += clamp(pigment * 0.34, 0.0, 0.15);
    alpha = clamp(alpha, 0.0, mix(0.48, 0.32, uLightTheme));
    outColor = vec4(color, alpha);
  }
`;

const ensureTileBuffer = () => {
  const nextColumns = Math.ceil(canvas.width / TILE_SIZE);
  const nextRows = Math.ceil(canvas.height / TILE_SIZE);
  if (nextColumns === tileColumns && nextRows === tileRows) return;
  tileColumns = nextColumns;
  tileRows = nextRows;
  dirtyTiles = new Uint8Array(tileColumns * tileRows);
};

const markWaveTiles = (sourceX, sourceY, waveRadius, band, aspect) => {
  const outerRadius = waveRadius + band;
  const innerRadius = Math.max(0, waveRadius - band);
  const firstColumn = Math.max(0, Math.floor(((sourceX - outerRadius / aspect) * canvas.width) / TILE_SIZE));
  const lastColumn = Math.min(
    tileColumns - 1,
    Math.floor(((sourceX + outerRadius / aspect) * canvas.width) / TILE_SIZE)
  );
  const firstRow = Math.max(0, Math.floor(((sourceY - outerRadius) * canvas.height) / TILE_SIZE));
  const lastRow = Math.min(
    tileRows - 1,
    Math.floor(((sourceY + outerRadius) * canvas.height) / TILE_SIZE)
  );
  if (firstColumn > lastColumn || firstRow > lastRow) return;

  for (let row = firstRow; row <= lastRow; row += 1) {
    const minY = (row * TILE_SIZE) / canvas.height;
    const maxY = Math.min(1, ((row + 1) * TILE_SIZE) / canvas.height);
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const minX = (column * TILE_SIZE) / canvas.width;
      const maxX = Math.min(1, ((column + 1) * TILE_SIZE) / canvas.width);
      const nearX = sourceX < minX ? minX - sourceX : sourceX > maxX ? sourceX - maxX : 0;
      const nearY = sourceY < minY ? minY - sourceY : sourceY > maxY ? sourceY - maxY : 0;
      const minDistance = Math.hypot(nearX * aspect, nearY);
      if (minDistance > outerRadius) continue;
      const farX = Math.max(Math.abs(minX - sourceX), Math.abs(maxX - sourceX)) * aspect;
      const farY = Math.max(Math.abs(minY - sourceY), Math.abs(maxY - sourceY));
      const maxDistance = Math.hypot(farX, farY);
      if (innerRadius > 0 && maxDistance < innerRadius) continue;
      dirtyTiles[row * tileColumns + column] = 1;
    }
  }
};

const prepareDirtyTiles = (timestamp) => {
  ensureTileBuffer();
  dirtyTiles.fill(0);
  const aspect = canvas.width / Math.max(1, canvas.height);

  for (const ripple of ripples) {
    const age = timestamp * 0.001 - ripple.start;
    if (age < 0 || age > RIPPLE_LIFETIME || ripple.strength <= 0) continue;
    const waveRadius = age * 0.11;
    markWaveTiles(ripple.x, ripple.y, waveRadius, lightTheme ? 0.18 : 0.15, aspect);
    const edgeWidth = 0.045;
    if (waveRadius > ripple.x * aspect - edgeWidth) {
      markWaveTiles(-ripple.x, ripple.y, waveRadius, 0.15, aspect);
    }
    if (waveRadius > (1 - ripple.x) * aspect - edgeWidth) {
      markWaveTiles(2 - ripple.x, ripple.y, waveRadius, 0.15, aspect);
    }
    if (waveRadius > ripple.y - edgeWidth) {
      markWaveTiles(ripple.x, -ripple.y, waveRadius, 0.15, aspect);
    }
    if (waveRadius > 1 - ripple.y - edgeWidth) {
      markWaveTiles(ripple.x, 2 - ripple.y, waveRadius, 0.15, aspect);
    }
  }
};

const drawDirtyRegions = () => {
  let dirtyCount = 0;
  for (let i = 0; i < dirtyTiles.length; i += 1) dirtyCount += dirtyTiles[i];
  if (!dirtyCount) return;

  const coverage = dirtyCount / dirtyTiles.length;
  if (coverage > 0.9) {
    gl.disable(gl.SCISSOR_TEST);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return;
  }

  gl.enable(gl.SCISSOR_TEST);
  for (let row = 0; row < tileRows; row += 1) {
    let column = 0;
    while (column < tileColumns) {
      while (column < tileColumns && !dirtyTiles[row * tileColumns + column]) column += 1;
      if (column >= tileColumns) break;
      const startColumn = column;
      while (column < tileColumns && dirtyTiles[row * tileColumns + column]) column += 1;
      const x = startColumn * TILE_SIZE;
      const y = row * TILE_SIZE;
      const width = Math.min(canvas.width - x, (column - startColumn) * TILE_SIZE);
      const height = Math.min(canvas.height - y, TILE_SIZE);
      gl.scissor(x, y, width, height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }
  gl.disable(gl.SCISSOR_TEST);
};

const requestFluidFrame = () => {
  if (!stopped && visible && !rafId) rafId = scheduleFrame(render);
};

const addRipple = (x, y, strength, start = performance.now() * 0.001) => {
  const ripple = ripples[rippleCursor];
  ripple.x = Math.max(0, Math.min(1, x));
  ripple.y = Math.max(0, Math.min(1, y));
  ripple.start = start;
  ripple.strength = strength;
  rippleCursor = (rippleCursor + 1) % RIPPLE_COUNT;
  requestFluidFrame();
};

const render = (timestamp) => {
  rafId = 0;
  if (stopped || !visible || !gl) return;
  const hasLiveRipple = ripples.some((ripple) => {
    const age = timestamp * 0.001 - ripple.start;
    return age >= 0 && age <= RIPPLE_LIFETIME;
  });

  if (!hasLiveRipple) {
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return;
  }

  const pointerIsMoving = timestamp - lastPointerActivityAt < 240;
  const targetFps = constrainedDevice ? 28 : pointerIsMoving ? 40 : 32;
  const frameInterval = 1000 / targetFps;
  if (timestamp - lastFrame < frameInterval) {
    requestFluidFrame();
    return;
  }
  lastFrame = timestamp;

  for (let i = 0; i < RIPPLE_COUNT; i += 1) {
    const ripple = ripples[i];
    const base = i * 4;
    rippleUniformData[base] = ripple.x;
    rippleUniformData[base + 1] = ripple.y;
    rippleUniformData[base + 2] = ripple.start;
    rippleUniformData[base + 3] = ripple.strength;
  }

  prepareDirtyTiles(timestamp);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.disable(gl.SCISSOR_TEST);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
  gl.uniform1f(uniforms.time, timestamp * 0.001);
  gl.uniform1f(uniforms.lightTheme, lightTheme ? 1 : 0);
  gl.uniform4fv(uniforms.ripples, rippleUniformData);
  gl.bindVertexArray(vao);
  drawDirtyRegions();
  gl.bindVertexArray(null);
  requestFluidFrame();
};

const initialize = (data) => {
  canvas = data.canvas;
  viewportWidth = Math.max(1, data.viewportWidth);
  viewportHeight = Math.max(1, data.viewportHeight);
  canvas.width = Math.max(1, data.renderWidth);
  canvas.height = Math.max(1, data.renderHeight);
  constrainedDevice = Boolean(data.constrainedDevice);
  lightTheme = Boolean(data.lightTheme);
  visible = Boolean(data.visible);
  gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    desynchronized: true,
    powerPreference: 'high-performance'
  });
  if (!gl) {
    self.postMessage({ type: 'unsupported' });
    return;
  }

  program = createProgram(gl, vertexSource, fragmentSource);
  if (!program) {
    self.postMessage({ type: 'unsupported' });
    return;
  }
  vao = gl.createVertexArray();
  uniforms = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    time: gl.getUniformLocation(program, 'uTime'),
    lightTheme: gl.getUniformLocation(program, 'uLightTheme'),
    ripples: gl.getUniformLocation(program, 'uRipples[0]')
  };
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  ensureTileBuffer();
  self.postMessage({ type: 'ready' });
};

const dispose = () => {
  stopped = true;
  if (rafId) cancelFrame(rafId);
  rafId = 0;
  if (gl) {
    if (vao) gl.deleteVertexArray(vao);
    if (program) gl.deleteProgram(program);
  }
  self.close();
};

self.addEventListener('message', (event) => {
  const data = event.data;
  try {
    if (data.type === 'init') {
      initialize(data);
      return;
    }
    if (data.type === 'stop') {
      dispose();
      return;
    }
    if (!gl || stopped) return;

    if (data.type === 'pointermove') {
      const now = performance.now();
      lastPointerActivityAt = now;
      const dx = data.x - lastPointerX;
      const dy = data.y - lastPointerY;
      if (now - lastPointerRippleAt < 165 || dx * dx + dy * dy < 18 * 18) return;
      lastPointerRippleAt = now;
      lastPointerX = data.x;
      lastPointerY = data.y;
      addRipple(data.x / viewportWidth, 1 - data.y / viewportHeight, 0.42, now * 0.001);
      return;
    }
    if (data.type === 'pointerdown') {
      const now = performance.now();
      lastPointerActivityAt = now;
      addRipple(data.x / viewportWidth, 1 - data.y / viewportHeight, 0.78, now * 0.001);
      return;
    }
    if (data.type === 'resize') {
      viewportWidth = Math.max(1, data.viewportWidth);
      viewportHeight = Math.max(1, data.viewportHeight);
      canvas.width = Math.max(1, data.renderWidth);
      canvas.height = Math.max(1, data.renderHeight);
      ensureTileBuffer();
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      requestFluidFrame();
      return;
    }
    if (data.type === 'theme') {
      lightTheme = Boolean(data.lightTheme);
      requestFluidFrame();
      return;
    }
    if (data.type === 'visibility') {
      visible = Boolean(data.visible);
      if (!visible && rafId) {
        cancelFrame(rafId);
        rafId = 0;
      } else if (visible) {
        lastFrame = 0;
        requestFluidFrame();
      }
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
});
