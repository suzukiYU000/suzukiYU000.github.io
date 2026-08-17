(() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection?.saveData);
  const constrainedDevice =
    saveData ||
    (Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 4) ||
    (Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 4);

  const getFluidRenderSize = () => {
    const scale = constrainedDevice ? 0.48 : 0.62;
    const dpr = Math.min(window.devicePixelRatio || 1, 1);
    const maxPixels = constrainedDevice ? 380000 : 820000;
    const viewportWidth = Math.max(1, window.innerWidth);
    const viewportHeight = Math.max(1, window.innerHeight);
    const minRenderSide = constrainedDevice ? 220 : 240;
    const renderScale = Math.max(
      scale * dpr,
      minRenderSide / Math.min(viewportWidth, viewportHeight)
    );
    let renderWidth = Math.max(1, Math.floor(viewportWidth * renderScale));
    let renderHeight = Math.max(1, Math.floor(viewportHeight * renderScale));
    const pixelCount = renderWidth * renderHeight;
    if (pixelCount > maxPixels) {
      const fit = Math.sqrt(maxPixels / pixelCount);
      renderWidth = Math.floor(renderWidth * fit);
      renderHeight = Math.floor(renderHeight * fit);
    }
    return { viewportWidth, viewportHeight, renderWidth, renderHeight };
  };

  const startFluidWorkerEffect = () => {
    const canvas = document.getElementById('fluid-bg');
    const supportsOffscreenWebGL =
      canvas instanceof HTMLCanvasElement &&
      typeof Worker === 'function' &&
      typeof canvas.transferControlToOffscreen === 'function';
    if (!supportsOffscreenWebGL) return false;

    let worker;
    try {
      worker = new Worker('effects-worker.js?v=20260817-2');
    } catch {
      return false;
    }

    let offscreen;
    try {
      offscreen = canvas.transferControlToOffscreen();
    } catch {
      worker.terminate();
      return false;
    }

    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)');
    const isLightTheme = () => {
      const explicitTheme = document.documentElement.dataset.theme;
      return explicitTheme === 'light' || (!explicitTheme && systemThemeQuery.matches);
    };
    let stopped = false;
    let pointerFrame = 0;
    let resizeFrame = 0;
    let pendingPointerX = 0;
    let pendingPointerY = 0;

    const initialSize = getFluidRenderSize();
    canvas.style.width = `${initialSize.viewportWidth}px`;
    canvas.style.height = `${initialSize.viewportHeight}px`;
    worker.postMessage(
      {
        type: 'init',
        canvas: offscreen,
        ...initialSize,
        constrainedDevice,
        lightTheme: isLightTheme(),
        visible: !document.hidden
      },
      [offscreen]
    );

    const onPointerMove = (event) => {
      pendingPointerX = event.clientX;
      pendingPointerY = event.clientY;
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        worker.postMessage({ type: 'pointermove', x: pendingPointerX, y: pendingPointerY });
      });
    };
    const onPointerDown = (event) => {
      worker.postMessage({ type: 'pointerdown', x: event.clientX, y: event.clientY });
    };
    const onResize = () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        const size = getFluidRenderSize();
        canvas.style.width = `${size.viewportWidth}px`;
        canvas.style.height = `${size.viewportHeight}px`;
        worker.postMessage({ type: 'resize', ...size });
      });
    };
    const sendTheme = () => worker.postMessage({ type: 'theme', lightTheme: isLightTheme() });
    const sendVisibility = () => worker.postMessage({ type: 'visibility', visible: !document.hidden });
    const themeObserver = new MutationObserver(sendTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const cleanup = () => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', sendVisibility);
      systemThemeQuery.removeEventListener?.('change', sendTheme);
      themeObserver.disconnect();
    };
    const stop = () => {
      if (stopped) return;
      stopped = true;
      cleanup();
      worker.postMessage({ type: 'stop' });
      worker.terminate();
    };
    const fallbackToMainThread = () => {
      if (stopped) return;
      stopped = true;
      cleanup();
      worker.terminate();
      const replacement = canvas.cloneNode(false);
      canvas.replaceWith(replacement);
      startFluidEffect();
    };

    worker.addEventListener('message', (event) => {
      if (event.data?.type === 'unsupported' || event.data?.type === 'error') fallbackToMainThread();
    });
    worker.addEventListener('error', (event) => {
      event.preventDefault();
      fallbackToMainThread();
    });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', sendVisibility);
    systemThemeQuery.addEventListener?.('change', sendTheme);
    window.addEventListener('pagehide', stop, { once: true });
    return true;
  };
  const compileShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader) || 'Shader compilation failed.');
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const createProgram = (gl, vertexSource, fragmentSource) => {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      return null;
    }
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(program) || 'Shader link failed.');
      gl.deleteProgram(program);
      return null;
    }
    return program;
  };

  const startFluidCanvasFallback = (canvas, ripples, onRequestFrame) => {
    const context = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!context) return () => {};
    const themeQuery = window.matchMedia('(prefers-color-scheme: light)');
    const isLightTheme = () => {
      const explicitTheme = document.documentElement.dataset.theme;
      return explicitTheme === 'light' || (!explicitTheme && themeQuery.matches);
    };
    let rafId = 0;
    let stopped = false;
    let lastFrame = 0;
    const render = (timestamp) => {
      if (stopped) return;
      if (timestamp - lastFrame < 1000 / 30) {
        rafId = requestAnimationFrame(render);
        return;
      }
      lastFrame = timestamp;
      const hasLiveRipple = ripples.some((ripple) => {
        const age = timestamp * 0.001 - ripple.start;
        return age >= 0 && age <= 4.8;
      });
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (!hasLiveRipple) {
        rafId = 0;
        return;
      }
      context.save();
      context.scale(canvas.width, canvas.height);
      const lightTheme = isLightTheme();
      for (const ripple of ripples) {
        const age = timestamp * 0.001 - ripple.start;
        if (age < 0 || age > 4.8) continue;
        const radius = age * 0.11;
        const alpha = Math.exp(-age * 0.46) * ripple.strength * 0.3;
        const inkColor = lightTheme ? '48, 55, 52' : '78, 190, 238';
        context.strokeStyle = `rgba(${inkColor}, ${lightTheme ? alpha * 0.82 : alpha})`;
        context.lineWidth = 1.2 / Math.min(canvas.width, canvas.height);
        const aspect = canvas.width / canvas.height;
        const centerY = 1 - ripple.y;
        const drawRing = (x, y, opacity = 1) => {
          context.beginPath();
          context.ellipse(x, y, radius / aspect, radius, 0, 0, Math.PI * 2);
          if (lightTheme) {
            context.globalAlpha = opacity * 0.24;
            context.lineWidth = 5.2 / Math.min(canvas.width, canvas.height);
            context.stroke();
            context.lineWidth = 1.2 / Math.min(canvas.width, canvas.height);
          }
          context.globalAlpha = opacity;
          context.stroke();
        };
        drawRing(ripple.x, centerY);
        if (radius >= ripple.x * aspect - 0.04) drawRing(-ripple.x, centerY, 0.55);
        if (radius >= (1 - ripple.x) * aspect - 0.04) drawRing(2 - ripple.x, centerY, 0.55);
        if (radius >= centerY - 0.04) drawRing(ripple.x, -centerY, 0.55);
        if (radius >= 1 - centerY - 0.04) drawRing(ripple.x, 2 - centerY, 0.55);
        context.globalAlpha = 1;
      }
      context.restore();
      rafId = requestAnimationFrame(render);
    };
    const requestFrame = () => {
      if (!stopped && !rafId && !document.hidden) rafId = requestAnimationFrame(render);
    };
    onRequestFrame(requestFrame);
    return () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  };

  const startFluidEffect = () => {
    const canvas = document.getElementById('fluid-bg');
    if (!canvas || reducedMotion) return null;
    const maxRipples = 8;
    const ripples = Array.from({ length: maxRipples }, () => ({ x: 0.5, y: 0.5, start: -100, strength: 0 }));
    const rippleUniformData = new Float32Array(maxRipples * 4);
    let rippleCursor = 0;
    let lastPointerRippleAt = 0;
    let lastPointerX = -100;
    let lastPointerY = -100;
    let pendingPointerX = 0;
    let pendingPointerY = 0;
    let pointerSampleRaf = 0;
    let lastPointerActivityAt = 0;
    let stopped = false;
    const interactive = true;
    let requestFluidFrame = () => {};

    const addRipple = (x, y, strength, start = performance.now() * 0.001) => {
      const ripple = ripples[rippleCursor];
      ripple.x = clamp(x, 0, 1);
      ripple.y = clamp(y, 0, 1);
      ripple.start = start;
      ripple.strength = strength;
      rippleCursor = (rippleCursor + 1) % maxRipples;
      requestFluidFrame();
    };

    const resize = () => {
      const { viewportWidth, viewportHeight, renderWidth, renderHeight } = getFluidRenderSize();
      canvas.width = renderWidth;
      canvas.height = renderHeight;
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
    };
    resize();

    const emitPointerRipple = (timestamp) => {
      pointerSampleRaf = 0;
      if (!interactive) return;
      lastPointerActivityAt = timestamp;
      const dx = pendingPointerX - lastPointerX;
      const dy = pendingPointerY - lastPointerY;
      if (timestamp - lastPointerRippleAt < 165 || dx * dx + dy * dy < 18 * 18) return;
      lastPointerRippleAt = timestamp;
      lastPointerX = pendingPointerX;
      lastPointerY = pendingPointerY;
      addRipple(pendingPointerX / window.innerWidth, 1 - pendingPointerY / window.innerHeight, 0.42, timestamp * 0.001);
    };
    const onPointerMove = (event) => {
      if (!interactive) return;
      pendingPointerX = event.clientX;
      pendingPointerY = event.clientY;
      if (!pointerSampleRaf) pointerSampleRaf = requestAnimationFrame(emitPointerRipple);
    };
    const onPointerDown = (event) => {
      if (!interactive) return;
      lastPointerActivityAt = performance.now();
      addRipple(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight, 0.78);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      desynchronized: true,
      powerPreference: 'high-performance'
    });
    if (!gl) {
      const stopFallback = startFluidCanvasFallback(canvas, ripples, (requestFrame) => {
        requestFluidFrame = requestFrame;
      });
      window.addEventListener('resize', resize, { passive: true });
      window.addEventListener('pagehide', stopFallback, { once: true });
      return activate;
    }

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
    const program = createProgram(gl, vertexSource, fragmentSource);
    if (!program) return;
    const vao = gl.createVertexArray();
    const uniforms = {
      resolution: gl.getUniformLocation(program, 'uResolution'),
      time: gl.getUniformLocation(program, 'uTime'),
      lightTheme: gl.getUniformLocation(program, 'uLightTheme'),
      ripples: gl.getUniformLocation(program, 'uRipples[0]')
    };
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    let rafId = 0;
    let lastFrame = 0;
    const themeQuery = window.matchMedia('(prefers-color-scheme: light)');
    const isLightTheme = () => {
      const explicitTheme = document.documentElement.dataset.theme;
      return explicitTheme === 'light' || (!explicitTheme && themeQuery.matches);
    };

    const render = (timestamp) => {
      if (stopped || document.hidden) {
        rafId = 0;
        return;
      }
      const hasLiveRipple = ripples.some((ripple) => {
        const age = timestamp * 0.001 - ripple.start;
        return age >= 0 && age <= 4.8;
      });
      if (!hasLiveRipple) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        rafId = 0;
        return;
      }
      const pointerIsMoving = timestamp - lastPointerActivityAt < 240;
      const targetFps = constrainedDevice ? 28 : pointerIsMoving ? 40 : 32;
      const frameInterval = 1000 / targetFps;
      if (timestamp - lastFrame < frameInterval) {
        rafId = requestAnimationFrame(render);
        return;
      }
      lastFrame = timestamp;
      for (let i = 0; i < maxRipples; i += 1) {
        const ripple = ripples[i];
        const base = i * 4;
        rippleUniformData[base] = ripple.x;
        rippleUniformData[base + 1] = ripple.y;
        rippleUniformData[base + 2] = ripple.start;
        rippleUniformData[base + 3] = ripple.strength;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, timestamp * 0.001);
      gl.uniform1f(uniforms.lightTheme, isLightTheme() ? 1 : 0);
      gl.uniform4fv(uniforms.ripples, rippleUniformData);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      rafId = requestAnimationFrame(render);
    };

    requestFluidFrame = () => {
      if (!stopped && !rafId && !document.hidden) rafId = requestAnimationFrame(render);
    };

    const scheduleResize = () => {
      resize();
      requestFluidFrame();
    };
    const resume = () => {
      requestFluidFrame();
    };
    const stop = () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (pointerSampleRaf) cancelAnimationFrame(pointerSampleRaf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', scheduleResize);
      document.removeEventListener('visibilitychange', resume);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
    window.addEventListener('resize', scheduleResize, { passive: true });
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('pagehide', stop, { once: true });
    return stop;
  };

  if (!reducedMotion && !startFluidWorkerEffect()) startFluidEffect();
})();
