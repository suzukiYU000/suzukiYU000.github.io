/* The original cloud-to-name choreography, with the editorial preview's warm palette,
   a readable pause, and a quieter release. Production intro.js is unchanged. */
(() => {
  'use strict';
  window.startEditorialIntroParticles = (canvas, durationMs, formPhaseMs, dissolvePhaseMs, fps, gateElement, onComplete, onReveal) => {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    let randomState = 0x6d2b79f5;
    const randomUnit = () => {
      randomState += 0x6d2b79f5;
      let value = randomState;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    const random = (min, max) => min + randomUnit() * (max - min);
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const COMPLETE_PROGRESS = 1;
    let revealStarted = false;
    const advanceReveal = elapsed => {
      if (!revealStarted && elapsed >= durationMs - 1050) {
        revealStarted = true;
        // A delayed frame must still leave time for a visible, continuous handoff.
        onReveal?.(Math.max(800, durationMs - elapsed));
      }
    };
    const parseCssColor = (value, fallback) => {
      const raw = (value || '').trim().toLowerCase();
      if (!raw) {
        return fallback;
      }
      if (raw.startsWith('#')) {
        let hex = raw.slice(1);
        if (hex.length === 3) {
          hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
        }
        if (/^[0-9a-f]{6}$/i.test(hex)) {
          return [
            Number.parseInt(hex.slice(0, 2), 16),
            Number.parseInt(hex.slice(2, 4), 16),
            Number.parseInt(hex.slice(4, 6), 16)
          ];
        }
      }
      const rgbMatch = raw.match(/rgba?\(([^)]+)\)/);
      if (rgbMatch) {
        const parts = rgbMatch[1]
          .split(',')
          .map((part) => Number.parseFloat(part.trim()))
          .filter((part) => Number.isFinite(part));
        if (parts.length >= 3) {
          return [
            Math.max(0, Math.min(255, Math.round(parts[0]))),
            Math.max(0, Math.min(255, Math.round(parts[1]))),
            Math.max(0, Math.min(255, Math.round(parts[2])))
          ];
        }
      }
      return fallback;
    };
    const shuffleInPlace = (list) => {
      for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(randomUnit() * (i + 1));
        const tmp = list[i];
        list[i] = list[j];
        list[j] = tmp;
      }
      return list;
    };

    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(240, Math.floor(bounds.width));
    const height = Math.max(70, Math.floor(bounds.height));
    const nativeDpr = Math.min(window.devicePixelRatio || 1, 2);
    const memoryConstrained = Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 4;
    const canvasPixelBudget = memoryConstrained ? 4000000 : 6000000;
    const budgetedDpr = Math.sqrt(canvasPixelBudget / Math.max(1, width * height));
    const dpr = Math.max(1, Math.min(nativeDpr, budgetedDpr));

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const offscreen = document.createElement('canvas');
    offscreen.width = Math.floor(width);
    offscreen.height = Math.floor(height);
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!offCtx) {
      return () => {};
    }

    const label = 'SUZUKI YUMA';
    const labelFont = '"Oswald", "Manrope", sans-serif';
    const labelY = height * 0.53;
    const measureLabel = (fontPx) => {
      offCtx.font = `700 ${fontPx}px ${labelFont}`;
      const metrics = offCtx.measureText(label);
      const ascent = metrics.actualBoundingBoxAscent || fontPx * 0.76;
      const descent = metrics.actualBoundingBoxDescent || fontPx * 0.2;
      return {
        width: metrics.width,
        height: ascent + descent
      };
    };
    const maxLabelWidth = width * (width < 720 ? 0.92 : 0.84);
    const maxLabelHeight = height * (width < 720 ? 0.15 : 0.2);
    let fontSize = clamp(Math.min(width * 0.18, height * 0.24), 84, 420);
    let labelMetrics = measureLabel(fontSize);
    const fitScale = Math.min(maxLabelWidth / labelMetrics.width, maxLabelHeight / labelMetrics.height);
    fontSize = clamp(fontSize * fitScale, 24, 420);
    labelMetrics = measureLabel(fontSize);
    offCtx.clearRect(0, 0, width, height);
    offCtx.font = `700 ${fontSize}px ${labelFont}`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillStyle = '#ffffff';
    offCtx.fillText(label, width * 0.5, labelY);

    const image = offCtx.getImageData(0, 0, width, height).data;
    const sampleStep = Math.max(2, Math.floor(width / 480));
    const targets = [];
    for (let y = 0; y < height; y += sampleStep) {
      const row = y * width;
      for (let x = 0; x < width; x += sampleStep) {
        const alpha = image[(row + x) * 4 + 3];
        if (alpha > 150 && randomUnit() > 0.03) {
          targets.push({ x, y });
        }
      }
    }

    if (targets.length < 40) {
      return () => {};
    }

    const centerX = width * 0.5;
    const centerY = labelY;
    const depthRange = Math.max(280, Math.min(880, Math.max(width, height) * 0.88));
    const cameraBaseDepth = Math.max(width, height) * 0.58 + depthRange * 0.74;
    // Orbit the camera slightly so the particle swarm reads as a 3D volume before settling into the title.
    const getCameraOrbit = (elapsed, progress, dissolveNow) => {
      const settle = 1 - Math.pow(progress, 1.18);
      const frontSettleEnd = formPhaseMs - 60;
      const frontSettleStart = formPhaseMs * 0.72;
      const frontSettle = easeOutCubic(
        clamp((elapsed - frontSettleStart) / Math.max(1, frontSettleEnd - frontSettleStart), 0, 1)
      );
      const orbitScale = (1 - frontSettle) * (0.14 + settle * 0.52);
      const breakupLean = dissolveNow * 0.012;
      const dollyEnvelope = 1 - frontSettle * 0.92;
      const dolly =
        Math.sin(elapsed * 0.00112 + 0.8) * (depthRange * (0.08 + settle * 0.18) * dollyEnvelope) -
        settle * depthRange * 0.075 * dollyEnvelope -
        frontSettle * depthRange * 0.04;
      return {
        yaw: Math.sin(elapsed * 0.00112) * orbitScale + Math.sin(elapsed * 0.0023 + 0.4) * breakupLean,
        pitch:
          Math.cos(elapsed * 0.00086 + 0.6) * (0.1 + settle * 0.26) * (1 - frontSettle) +
          Math.sin(elapsed * 0.0017 + 1.2) * breakupLean * 0.34,
        depth: Math.max(Math.max(width, height) * 0.4, cameraBaseDepth + dolly)
      };
    };
    const spawnFromStormRing = () => {
      const angle = random(0, Math.PI * 2);
      const maxR = Math.max(width, height) * 0.92;
      const minR = Math.max(width, height) * 0.38;
      const radius = random(minR, maxR);
      const spiral = random(-1, 1);
      const lift = Math.sin(angle * 1.7 + spiral * 2.4) * height * 0.18;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius * 0.72 + lift,
        z: Math.cos(angle * 1.13 + spiral) * radius * 1.06 + random(-depthRange * 0.9, depthRange * 0.9)
      };
    };

    const shuffledTargets = shuffleInPlace(targets.slice());
    const particleCount = Math.min(3200, Math.max(1600, Math.floor(targets.length * 1.08)));

    const posX = new Float32Array(particleCount);
    const posY = new Float32Array(particleCount);
    const posZ = new Float32Array(particleCount);
    const velX = new Float32Array(particleCount);
    const velY = new Float32Array(particleCount);
    const velZ = new Float32Array(particleCount);
    const targetX = new Float32Array(particleCount);
    const targetY = new Float32Array(particleCount);
    const targetZ = new Float32Array(particleCount);
    const size = new Float32Array(particleCount);
    const seed = new Float32Array(particleCount);
    const depthDrift = new Float32Array(particleCount);
    const tone = new Uint8Array(particleCount);
    const orbitDir = new Int8Array(particleCount);

    for (let i = 0; i < particleCount; i += 1) {
      const start = spawnFromStormRing();
      const targetIndex = Math.floor((i / particleCount) * shuffledTargets.length);
      const target = shuffledTargets[targetIndex];
      posX[i] = start.x;
      posY[i] = start.y;
      posZ[i] = start.z;
      velX[i] = random(-1.2, 1.2);
      velY[i] = random(-1.2, 1.2);
      velZ[i] = random(-2.4, 2.4);
      targetX[i] = target.x;
      targetY[i] = target.y;
      targetZ[i] = random(-18, 18);
      size[i] = random(0.58, 1.42);
      seed[i] = random(0, Math.PI * 2);
      depthDrift[i] = random(0.62, 1.36);
      tone[i] = randomUnit() > 0.16 ? 0 : 1;
      orbitDir[i] = randomUnit() > 0.5 ? 1 : -1;
    }

    const STORM_PHASE_RATIO = 0.88;
    const formFrameCount = Math.max(2, Math.ceil((formPhaseMs / 1000) * fps) + 1);
    const formStride = particleCount * 4;
    const formTrajectory = new Float32Array(formFrameCount * formStride);

    // Precompute text-forming particle motion.
    for (let frame = 0; frame < formFrameCount; frame += 1) {
      const progress = frame / (formFrameCount - 1);
      const stormProgress = clamp(progress / STORM_PHASE_RATIO, 0, 1);
      const gather = easeOutCubic(clamp((stormProgress - 0.34) / 0.66, 0, 1));
      const storm = Math.pow(1 - stormProgress, 1.08);
      const simTime = progress * formPhaseMs;

      if (frame > 0) {
        for (let i = 0; i < particleCount; i += 1) {
          const px = posX[i];
          const py = posY[i];
          const pz = posZ[i];
          const pcx = px - centerX;
          const pcy = py - centerY;
          const distC = Math.hypot(pcx, pcy) || 1;
          const nx = pcx / distC;
          const ny = pcy / distC;
          const tx = -ny * orbitDir[i];
          const ty = nx * orbitDir[i];
          const radialNudge = Math.sin(simTime * 0.0036 + seed[i]) * (10 + storm * 24);
          const swirlLift = Math.sin(simTime * 0.0031 + seed[i] * 1.18) * (10 + storm * 34);
          const depthWave =
            Math.sin(simTime * 0.0042 + seed[i] * 1.8) * (30 + storm * depthRange * 0.92) * depthDrift[i];
          const dxToTarget = targetX[i] + radialNudge * nx - px;
          const dyToTarget = targetY[i] + radialNudge * ny + swirlLift * 0.06 - py;
          const dzToTarget = targetZ[i] + depthWave - pz;

          const tangentialForce =
            (0.32 + storm * 1.55) * (0.34 + clamp(distC / (Math.max(width, height) * 0.62), 0, 1));
          const centerPull = 0.008 + storm * 0.08;
          const targetPull = 0.006 + gather * 0.42;
          const depthPull = 0.004 + gather * 0.24;
          let vx = velX[i] + tx * tangentialForce - nx * centerPull + dxToTarget * targetPull * 0.06;
          let vy = velY[i] + ty * tangentialForce - ny * centerPull + dyToTarget * targetPull * 0.06;
          let vz =
            velZ[i] + dzToTarget * depthPull * 0.09 + orbitDir[i] * storm * 0.18 * Math.sin(seed[i] + simTime * 0.0018);

          const damping = 0.915 - gather * 0.17;
          vx *= damping;
          vy *= damping;
          vz *= 0.91 - gather * 0.14;

          let nextX = px + vx;
          let nextY = py + vy;
          let nextZ = pz + vz;

          if (stormProgress > 0.82) {
            const snap = (stormProgress - 0.82) / 0.18;
            const snapStrength = 0.15 + snap * 0.52;
            nextX += (targetX[i] - nextX) * snapStrength;
            nextY += (targetY[i] - nextY) * snapStrength;
            nextZ += (targetZ[i] - nextZ) * snapStrength * 0.94;
          }
          nextZ = clamp(nextZ, -depthRange * 1.8, depthRange * 1.8);

          posX[i] = nextX;
          posY[i] = nextY;
          posZ[i] = nextZ;
          velX[i] = vx;
          velY[i] = vy;
          velZ[i] = vz;
        }
      }

      const base = frame * formStride;
      for (let i = 0; i < particleCount; i += 1) {
        const p = base + i * 4;
        formTrajectory[p] = posX[i];
        formTrajectory[p + 1] = posY[i];
        formTrajectory[p + 2] = posZ[i];
        formTrajectory[p + 3] = 0;
      }
    }

    const introStyle = getComputedStyle(gateElement);
    const bgColor = parseCssColor(introStyle.getPropertyValue('--intro-bg'), [28, 30, 28]);
    const brightColor = parseCssColor(introStyle.getPropertyValue('--intro-ink'), [239, 238, 230]);
    const softColor = parseCssColor(introStyle.getPropertyValue('--intro-accent'), [241, 167, 142]);
    const totalFrameCount = Math.max(2, Math.ceil((durationMs / 1000) * fps) + 1);
    const totalStride = particleCount * 4;
    const timelinePos = new Float32Array(totalFrameCount * totalStride);
    const frameAlpha = new Float32Array(totalFrameCount);
    const frameSizeScale = new Float32Array(totalFrameCount);
    const brightR = new Uint8Array(totalFrameCount);
    const brightG = new Uint8Array(totalFrameCount);
    const brightB = new Uint8Array(totalFrameCount);
    const softR = new Uint8Array(totalFrameCount);
    const softG = new Uint8Array(totalFrameCount);
    const softB = new Uint8Array(totalFrameCount);

    const breakupStartMs = formPhaseMs + 700;
    const labelLeft = centerX - labelMetrics.width * 0.5;

    // Keep the original formation; release the title gently from left to right.
    for (let frame = 0; frame < totalFrameCount; frame += 1) {
      const tMs = (frame / (totalFrameCount - 1)) * durationMs;
      const formProgress = clamp(tMs / formPhaseMs, 0, 1);
      const breakupProgress = clamp((tMs - breakupStartMs) / Math.max(1, durationMs - breakupStartMs), 0, 1);
      const breakupEase = easeOutCubic(breakupProgress);
      const blendToBg = Math.pow(breakupProgress, 1.15);
      const alphaFade = clamp((breakupProgress - 0.62) / 0.38, 0, 1);

      frameAlpha[frame] = (0.62 + (1 - breakupEase) * 0.34) * (1 - alphaFade * 0.32);
      frameSizeScale[frame] = 1.16 - breakupProgress * 0.02;

      brightR[frame] = Math.round(brightColor[0] + (bgColor[0] - brightColor[0]) * blendToBg);
      brightG[frame] = Math.round(brightColor[1] + (bgColor[1] - brightColor[1]) * blendToBg);
      brightB[frame] = Math.round(brightColor[2] + (bgColor[2] - brightColor[2]) * blendToBg);
      softR[frame] = Math.round(softColor[0] + (bgColor[0] - softColor[0]) * blendToBg);
      softG[frame] = Math.round(softColor[1] + (bgColor[1] - softColor[1]) * blendToBg);
      softB[frame] = Math.round(softColor[2] + (bgColor[2] - softColor[2]) * blendToBg);

      const formFramePos = formProgress * (formFrameCount - 1);
      const formA = Math.floor(formFramePos);
      const formB = Math.min(formFrameCount - 1, formA + 1);
      const formBlend = formFramePos - formA;
      const formBaseA = formA * formStride;
      const formBaseB = formB * formStride;

      for (let i = 0; i < particleCount; i += 1) {
        const pIndex = i * 4;
        const ax = formTrajectory[formBaseA + pIndex];
        const ay = formTrajectory[formBaseA + pIndex + 1];
        const az = formTrajectory[formBaseA + pIndex + 2];
        const bx = formTrajectory[formBaseB + pIndex];
        const by = formTrajectory[formBaseB + pIndex + 1];
        const bz = formTrajectory[formBaseB + pIndex + 2];

        let x = ax + (bx - ax) * formBlend;
        let y = ay + (by - ay) * formBlend;
        let z = az + (bz - az) * formBlend;

        if (breakupProgress > 0) {
          const across = clamp((targetX[i] - labelLeft) / labelMetrics.width, 0, 1);
          const delay = across * 0.24;
          const release = clamp((breakupProgress - delay) / (1 - delay), 0, 1);
          const drift = release * release;
          // A small, ordered upward drift leaves the name recognizable as it fades.
          x += drift * width * (0.1 + Math.sin(seed[i] * 1.3) * 0.035);
          y -= drift * height * (0.09 + Math.cos(seed[i] * 1.7) * 0.045);
          z += drift * (65 + Math.sin(seed[i]) * 35);
        }

        const base = frame * totalStride + pIndex;
        timelinePos[base] = x;
        timelinePos[base + 1] = y;
        timelinePos[base + 2] = clamp(z, -depthRange * 2.0, depthRange * 2.0);
        timelinePos[base + 3] = 0;
      }
    }

    const startCanvas2DRenderer = (ctx, startAt = performance.now()) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let rafId = 0;
      let stopped = false;
      let completed = false;
      const spriteSize = 24;
      const brightSprite = document.createElement('canvas');
      const softSprite = document.createElement('canvas');
      brightSprite.width = spriteSize;
      brightSprite.height = spriteSize;
      softSprite.width = spriteSize;
      softSprite.height = spriteSize;
      const brightSpriteCtx = brightSprite.getContext('2d');
      const softSpriteCtx = softSprite.getContext('2d');
      let spriteColorKey = '';
      const paintSprite = (spriteCtx, red, green, blue) => {
        if (!spriteCtx) return;
        spriteCtx.clearRect(0, 0, spriteSize, spriteSize);
        const half = spriteSize * 0.5;
        const gradient = spriteCtx.createRadialGradient(half, half, 0, half, half, half);
        gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 1)`);
        gradient.addColorStop(0.42, `rgba(${red}, ${green}, ${blue}, 0.96)`);
        gradient.addColorStop(0.72, `rgba(${red}, ${green}, ${blue}, 0.2)`);
        gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
        spriteCtx.fillStyle = gradient;
        spriteCtx.fillRect(0, 0, spriteSize, spriteSize);
      };
      const updateSprites = (bR, bG, bB, sR, sG, sB) => {
        const nextKey = `${bR},${bG},${bB}:${sR},${sG},${sB}`;
        if (nextKey === spriteColorKey) return;
        spriteColorKey = nextKey;
        paintSprite(brightSpriteCtx, bR, bG, bB);
        paintSprite(softSpriteCtx, sR, sG, sB);
      };
      const drawProjectedParticles = (
        toneMatch,
        sprite,
        alpha,
        baseA,
        baseB,
        blend,
        sizeScale,
        cameraYaw,
        cameraPitch,
        cameraDepthValue
      ) => {
        const yawCos = Math.cos(cameraYaw);
        const yawSin = Math.sin(cameraYaw);
        const pitchCos = Math.cos(cameraPitch);
        const pitchSin = Math.sin(cameraPitch);

        for (let i = 0; i < particleCount; i += 1) {
          if (tone[i] !== toneMatch) {
            continue;
          }

          const p = i * 4;
          const ax = timelinePos[baseA + p];
          const ay = timelinePos[baseA + p + 1];
          const az = timelinePos[baseA + p + 2];
          const bx = timelinePos[baseB + p];
          const by = timelinePos[baseB + p + 1];
          const bz = timelinePos[baseB + p + 2];

          const worldX = ax + (bx - ax) * blend - centerX;
          const worldY = ay + (by - ay) * blend - centerY;
          const worldZ = az + (bz - az) * blend;

          const rotatedX = worldX * yawCos + worldZ * yawSin;
          const rotatedZ = worldZ * yawCos - worldX * yawSin;
          const rotatedY = worldY * pitchCos - rotatedZ * pitchSin;
          const finalZ = worldY * pitchSin + rotatedZ * pitchCos;

          const depth = cameraDepthValue - finalZ;
          if (depth <= cameraDepthValue * 0.14) {
            continue;
          }

          const perspective = clamp(cameraDepthValue / depth, 0.2, 4.8);
          const screenX = centerX + rotatedX * perspective;
          const screenY = centerY + rotatedY * perspective;
          const radius = Math.max(0.52, size[i] * sizeScale * perspective * (1.02 + perspective * 0.1));
          if (screenX < -radius || screenX > width + radius || screenY < -radius || screenY > height + radius) {
            continue;
          }

          ctx.globalAlpha = clamp(
            alpha * clamp(0.24 + Math.pow(perspective, 1.08) * 0.58, 0.22, 2.1) * 1.32,
            0,
            1
          );
          const diameter = radius * 1.6;
          ctx.drawImage(sprite, screenX - diameter * 0.5, screenY - diameter * 0.5, diameter, diameter);
        }
        ctx.globalAlpha = 1;
      };

      const render = (timestamp) => {
        if (stopped) {
          return;
        }

        const elapsed = timestamp - startAt;
        const progress = clamp(elapsed / durationMs, 0, 1);
        const framePos = progress * (totalFrameCount - 1);
        const frameA = Math.floor(framePos);
        const frameB = Math.min(totalFrameCount - 1, frameA + 1);
        const blend = framePos - frameA;
        const baseA = frameA * totalStride;
        const baseB = frameB * totalStride;

        ctx.clearRect(0, 0, width, height);

        const breakupNow = clamp((elapsed - breakupStartMs) / Math.max(1, durationMs - breakupStartMs), 0, 1);
        const alpha = frameAlpha[frameA] + (frameAlpha[frameB] - frameAlpha[frameA]) * blend;
        const sizeScale = frameSizeScale[frameA] + (frameSizeScale[frameB] - frameSizeScale[frameA]) * blend;
        const cameraOrbit = getCameraOrbit(elapsed, progress, breakupNow);

        const bR = Math.round(brightR[frameA] + (brightR[frameB] - brightR[frameA]) * blend);
        const bG = Math.round(brightG[frameA] + (brightG[frameB] - brightG[frameA]) * blend);
        const bB = Math.round(brightB[frameA] + (brightB[frameB] - brightB[frameA]) * blend);
        const sR = Math.round(softR[frameA] + (softR[frameB] - softR[frameA]) * blend);
        const sG = Math.round(softG[frameA] + (softG[frameB] - softG[frameA]) * blend);
        const sB = Math.round(softB[frameA] + (softB[frameB] - softB[frameA]) * blend);
        updateSprites(bR, bG, bB, sR, sG, sB);

        ctx.globalCompositeOperation = 'lighter';
        drawProjectedParticles(
          0,
          brightSprite,
          alpha,
          baseA,
          baseB,
          blend,
          sizeScale,
          cameraOrbit.yaw,
          cameraOrbit.pitch,
          cameraOrbit.depth
        );
        drawProjectedParticles(
          1,
          softSprite,
          alpha,
          baseA,
          baseB,
          blend,
          sizeScale,
          cameraOrbit.yaw,
          cameraOrbit.pitch,
          cameraOrbit.depth
        );
        ctx.globalCompositeOperation = 'source-over';

        advanceReveal(elapsed);

        if (!completed && progress >= COMPLETE_PROGRESS) {
          completed = true;
          if (typeof onComplete === 'function') {
            onComplete();
          }
        }

        rafId = requestAnimationFrame(render);
      };

      rafId = requestAnimationFrame(render);
      return () => {
        stopped = true;
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      };
    };

    const startWebGL2Renderer = (gl, startAt = performance.now()) => {
      const compileShader = (type, source) => {
        const shader = gl.createShader(type);
        if (!shader) {
          return null;
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const linkProgram = (vertexSource, fragmentSource) => {
        const vs = compileShader(gl.VERTEX_SHADER, vertexSource);
        const fs = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
        if (!vs || !fs) {
          if (vs) {
            gl.deleteShader(vs);
          }
          if (fs) {
            gl.deleteShader(fs);
          }
          return null;
        }

        const program = gl.createProgram();
        if (!program) {
          gl.deleteShader(vs);
          gl.deleteShader(fs);
          return null;
        }

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          gl.deleteProgram(program);
          return null;
        }

        return program;
      };

      const vertexSource = `#version 300 es
      precision highp float;

      layout(location = 0) in vec3 aPositionA;
      layout(location = 1) in vec3 aPositionB;
      layout(location = 2) in float aSize;
      layout(location = 3) in float aTone;

      uniform float uBlend;
      uniform vec2 uResolution;
      uniform float uSizeScale;
      uniform float uDpr;
      uniform float uCameraYaw;
      uniform float uCameraPitch;
      uniform float uCameraDepth;

      out float vTone;
      out float vPerspective;

      void main() {
        vec3 pos = mix(aPositionA, aPositionB, uBlend);

        vec3 local = vec3(pos.xy - uResolution * 0.5, pos.z);

        float cosYaw = cos(uCameraYaw);
        float sinYaw = sin(uCameraYaw);
        float cosPitch = cos(uCameraPitch);
        float sinPitch = sin(uCameraPitch);

        vec3 rotated;
        rotated.x = local.x * cosYaw + local.z * sinYaw;
        float yawZ = local.z * cosYaw - local.x * sinYaw;
        rotated.y = local.y * cosPitch - yawZ * sinPitch;
        rotated.z = local.y * sinPitch + yawZ * cosPitch;

        float depth = max(uCameraDepth * 0.14, uCameraDepth - rotated.z);
        float perspective = clamp(uCameraDepth / depth, 0.18, 4.8);
        vec2 projected = rotated.xy * perspective + uResolution * 0.5;
        vec2 clip = vec2(
          (projected.x / uResolution.x) * 2.0 - 1.0,
          1.0 - (projected.y / uResolution.y) * 2.0
        );

        gl_Position = vec4(clip, clamp(rotated.z / uCameraDepth, -1.0, 1.0), 1.0);
        gl_PointSize = max(1.6, aSize * uSizeScale * uDpr * perspective * (1.35 + perspective * 0.22));
        vTone = aTone;
        vPerspective = perspective;
      }
      `;

      const fragmentSource = `#version 300 es
      precision highp float;

      in float vTone;
      in float vPerspective;
      uniform vec4 uBrightColor;
      uniform vec4 uSoftColor;

      out vec4 outColor;

      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float falloff = exp(-dot(p, p) * 2.9);
        vec4 baseColor = (vTone < 0.5) ? uBrightColor : uSoftColor;
        float depthAlpha = clamp(0.2 + pow(vPerspective, 1.1) * 0.54, 0.18, 2.0);
        outColor = vec4(baseColor.rgb, baseColor.a * falloff * depthAlpha);
      }
      `;

      const program = linkProgram(vertexSource, fragmentSource);
      if (!program) {
        return null;
      }

      const vao = gl.createVertexArray();
      const positionBufferA = gl.createBuffer();
      const positionBufferB = gl.createBuffer();
      const sizeBuffer = gl.createBuffer();
      const toneBuffer = gl.createBuffer();
      if (!vao || !positionBufferA || !positionBufferB || !sizeBuffer || !toneBuffer) {
        if (vao) {
          gl.deleteVertexArray(vao);
        }
        if (positionBufferA) {
          gl.deleteBuffer(positionBufferA);
        }
        if (positionBufferB) {
          gl.deleteBuffer(positionBufferB);
        }
        if (sizeBuffer) {
          gl.deleteBuffer(sizeBuffer);
        }
        if (toneBuffer) {
          gl.deleteBuffer(toneBuffer);
        }
        gl.deleteProgram(program);
        return null;
      }

      const particleSizes = new Float32Array(particleCount);
      const particleTones = new Float32Array(particleCount);
      for (let i = 0; i < particleCount; i += 1) {
        particleSizes[i] = size[i];
        particleTones[i] = tone[i];
      }

      gl.bindVertexArray(vao);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferA);
      gl.bufferData(gl.ARRAY_BUFFER, totalStride * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferB);
      gl.bufferData(gl.ARRAY_BUFFER, totalStride * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, particleSizes, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, toneBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, particleTones, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindVertexArray(null);

      if (gl.getError() !== gl.NO_ERROR) {
        gl.deleteBuffer(positionBufferA);
        gl.deleteBuffer(positionBufferB);
        gl.deleteBuffer(sizeBuffer);
        gl.deleteBuffer(toneBuffer);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(program);
        return null;
      }

      const uBlend = gl.getUniformLocation(program, 'uBlend');
      const uResolution = gl.getUniformLocation(program, 'uResolution');
      const uSizeScale = gl.getUniformLocation(program, 'uSizeScale');
      const uDpr = gl.getUniformLocation(program, 'uDpr');
      const uCameraYaw = gl.getUniformLocation(program, 'uCameraYaw');
      const uCameraPitch = gl.getUniformLocation(program, 'uCameraPitch');
      const uCameraDepth = gl.getUniformLocation(program, 'uCameraDepth');
      const uBrightColor = gl.getUniformLocation(program, 'uBrightColor');
      const uSoftColor = gl.getUniformLocation(program, 'uSoftColor');

      gl.useProgram(program);
      gl.uniform2f(uResolution, width, height);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uCameraDepth, cameraBaseDepth);

      gl.clearColor(0, 0, 0, 0);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      let rafId = 0;
      let stopped = false;
      let completed = false;
      let uploadedFrameA = -1;
      let uploadedFrameB = -1;

      const render = (timestamp) => {
        if (stopped) {
          return;
        }

        const elapsed = timestamp - startAt;
        const progress = clamp(elapsed / durationMs, 0, 1);
        const framePos = progress * (totalFrameCount - 1);
        const frameA = Math.floor(framePos);
        const frameB = Math.min(totalFrameCount - 1, frameA + 1);
        const blend = framePos - frameA;
        const baseA = frameA * totalStride;
        const baseB = frameB * totalStride;
        const dissolveNow = clamp((elapsed - formPhaseMs) / dissolvePhaseMs, 0, 1);

        const alpha = frameAlpha[frameA] + (frameAlpha[frameB] - frameAlpha[frameA]) * blend;
        const sizeScale = frameSizeScale[frameA] + (frameSizeScale[frameB] - frameSizeScale[frameA]) * blend;
        const cameraOrbit = getCameraOrbit(elapsed, progress, dissolveNow);

        const bR = (brightR[frameA] + (brightR[frameB] - brightR[frameA]) * blend) / 255;
        const bG = (brightG[frameA] + (brightG[frameB] - brightG[frameA]) * blend) / 255;
        const bB = (brightB[frameA] + (brightB[frameB] - brightB[frameA]) * blend) / 255;
        const sR = (softR[frameA] + (softR[frameB] - softR[frameA]) * blend) / 255;
        const sG = (softG[frameA] + (softG[frameB] - softG[frameA]) * blend) / 255;
        const sB = (softB[frameA] + (softB[frameB] - softB[frameA]) * blend) / 255;

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (uploadedFrameA !== frameA) {
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferA);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, timelinePos.subarray(baseA, baseA + totalStride));
          uploadedFrameA = frameA;
        }
        if (uploadedFrameB !== frameB) {
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferB);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, timelinePos.subarray(baseB, baseB + totalStride));
          uploadedFrameB = frameB;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.useProgram(program);
        gl.uniform1f(uBlend, blend);
        gl.uniform1f(uSizeScale, sizeScale);
        gl.uniform1f(uCameraYaw, cameraOrbit.yaw);
        gl.uniform1f(uCameraPitch, cameraOrbit.pitch);
        gl.uniform1f(uCameraDepth, cameraOrbit.depth);
        gl.uniform4f(uBrightColor, bR, bG, bB, alpha);
        gl.uniform4f(uSoftColor, sR, sG, sB, alpha);

        gl.bindVertexArray(vao);
        gl.drawArrays(gl.POINTS, 0, particleCount);
        gl.bindVertexArray(null);

        advanceReveal(elapsed);

        if (!completed && progress >= COMPLETE_PROGRESS) {
          completed = true;
          if (typeof onComplete === 'function') {
            onComplete();
          }
          return;
        }

        rafId = requestAnimationFrame(render);
      };

      rafId = requestAnimationFrame(render);
      return () => {
        stopped = true;
        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        const dispose = () => {
          gl.deleteBuffer(positionBufferA);
          gl.deleteBuffer(positionBufferB);
          gl.deleteBuffer(sizeBuffer);
          gl.deleteBuffer(toneBuffer);
          gl.deleteVertexArray(vao);
          gl.deleteProgram(program);
        };

        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(dispose, { timeout: 1000 });
        } else {
          window.setTimeout(dispose, 0);
        }
      };
    };

    const sharedStartAt = performance.now();
    const glCanvas = gateElement ? document.createElement('canvas') : null;
    if (glCanvas) {
      glCanvas.className = 'intro-gl-canvas';
      glCanvas.setAttribute('aria-hidden', 'true');
      glCanvas.width = canvas.width;
      glCanvas.height = canvas.height;
      glCanvas.style.width = `${width}px`;
      glCanvas.style.height = `${height}px`;
      gateElement.insertBefore(glCanvas, canvas);
    }

    // Use the Canvas renderer by default for consistent output across Chrome GPU/ANGLE configurations.
    // The WebGL buffer renderer remains available for isolated testing via ?intro-renderer=webgl.
    const useWebGLRenderer = new URLSearchParams(window.location.search).get('intro-renderer') === 'webgl';
    const gl = glCanvas && useWebGLRenderer
      ? glCanvas.getContext('webgl2', {
          alpha: true,
          antialias: false,
          depth: false,
          stencil: false,
          desynchronized: true,
          premultipliedAlpha: true,
          powerPreference: 'high-performance'
        })
      : null;

    if (gl && glCanvas) {
      const stopWebGL = startWebGL2Renderer(gl, sharedStartAt);
      if (stopWebGL) {
        gateElement?.setAttribute('data-intro-renderer', 'webgl2');
        return () => {
          stopWebGL();
          if (glCanvas.isConnected) {
            glCanvas.remove();
          }
        };
      }
      if (glCanvas.isConnected) {
        glCanvas.remove();
      }
    }

    if (glCanvas?.isConnected) {
      glCanvas.remove();
    }

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) {
      return () => {};
    }

    canvas.classList.add('is-canvas-renderer');
    gateElement?.setAttribute('data-intro-renderer', 'canvas2d');
    return startCanvas2DRenderer(ctx, sharedStartAt);
  };

})();
