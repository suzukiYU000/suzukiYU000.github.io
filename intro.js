(() => {
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const introGate = document.getElementById('intro-gate');
if (introGate) {
  const INTRO_DURATION_MS = 5300;
  const FORM_PHASE_MS = 2600;
  const DISSOLVE_PHASE_MS = INTRO_DURATION_MS - FORM_PHASE_MS;
  const INTRO_FPS = 45;
  const INTRO_EXIT_MS = 220;
  const introParticleCanvas = document.getElementById('intro-particle-canvas');

  const startIntroParticles = (canvas, durationMs, formPhaseMs, dissolvePhaseMs, fps, gateElement, onComplete) => {
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
    const COMPLETE_PROGRESS = 0.975;
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
    const width = Math.max(300, bounds.width);
    const height = Math.max(70, bounds.height);
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
    const labelFont = '"Oswald", "Space Grotesk", sans-serif';
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
    fontSize = clamp(fontSize * clamp(fitScale, 0.68, 1.18), 72, 420);
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
      const frontSettleStart = Math.max(formPhaseMs * 0.68, breakupStartMs - 520);
      const frontSettle = easeOutCubic(
        clamp((elapsed - frontSettleStart) / Math.max(1, breakupStartMs - frontSettleStart), 0, 1)
      );
      const orbitScale = (1 - frontSettle) * (0.14 + settle * 0.52);
      const breakupLean = dissolveNow * 0.04;
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
      tone[i] = randomUnit() > 0.48 ? 0 : 1;
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

    const bgColor = parseCssColor(getComputedStyle(document.documentElement).getPropertyValue('--bg'), [12, 14, 18]);
    const totalFrameCount = Math.max(2, Math.ceil((durationMs / 1000) * fps) + 1);
    const totalStride = particleCount * 4;
    const timelinePos = new Float32Array(totalFrameCount * totalStride);
    const frameAlpha = new Float32Array(totalFrameCount);
    const frameSizeScale = new Float32Array(totalFrameCount);
    const frameGateOpacity = new Float32Array(totalFrameCount);
    const brightR = new Uint8Array(totalFrameCount);
    const brightG = new Uint8Array(totalFrameCount);
    const brightB = new Uint8Array(totalFrameCount);
    const softR = new Uint8Array(totalFrameCount);
    const softG = new Uint8Array(totalFrameCount);
    const softB = new Uint8Array(totalFrameCount);

    const MAX_RIPPLES_PER_FRAME = 24;
    const ringData = new Float32Array(totalFrameCount * MAX_RIPPLES_PER_FRAME * 5);
    const ringCount = new Uint8Array(totalFrameCount);
    const waveEventCount = 10;
    const impactTargets = shuffleInPlace(targets.slice()).slice(0, waveEventCount);
    const waveEvents = impactTargets.map((target, index) => {
      const startMs =
        formPhaseMs + 320 + index * 118 + random(-22, 26);
      return {
        x: clamp(target.x + random(-sampleStep * 5, sampleStep * 5), width * 0.16, width * 0.84),
        y: clamp(target.y + random(-sampleStep * 6, sampleStep * 6), height * 0.22, height * 0.84),
        startMs,
        speed: random(0.22, 0.3),
        band: random(18, 30),
        amp: random(10.5, 16.5),
        decay: random(0.0012, 0.0022),
        phaseSpeed: random(0.024, 0.034),
        maxRadius: Math.max(width, height) * 1.12,
        freq: random(0.17, 0.23),
        scatterDuration: random(520, 900),
        scatterRadius: random(60, 122),
        scatterForce: random(24, 38),
        driftY: random(0.08, 0.3),
        depthPush: random(0.9, 1.6),
        ellipse: random(0.9, 1.06),
        phase: random(0, Math.PI * 2)
      };
    });
    const breakupStartMs = waveEvents.length > 0 ? waveEvents[0].startMs : formPhaseMs;
    const breakupPosX = new Float32Array(particleCount);
    const breakupPosY = new Float32Array(particleCount);
    const breakupPosZ = new Float32Array(particleCount);
    const breakupVelX = new Float32Array(particleCount);
    const breakupVelY = new Float32Array(particleCount);
    const breakupVelZ = new Float32Array(particleCount);
    let breakupInitialized = false;

    // Precompute full timeline: wave-driven breakup offsets + color + opacity.
    for (let frame = 0; frame < totalFrameCount; frame += 1) {
      const tMs = (frame / (totalFrameCount - 1)) * durationMs;
      const formProgress = clamp(tMs / formPhaseMs, 0, 1);
      const breakupProgress = clamp((tMs - breakupStartMs) / Math.max(1, durationMs - breakupStartMs), 0, 1);
      const breakupEase = easeOutCubic(breakupProgress);
      const blendToBg = Math.pow(breakupProgress, 0.84);
      const alphaFade = clamp((breakupProgress - 0.84) / 0.16, 0, 1);

      frameAlpha[frame] = (0.52 + (1 - breakupEase) * 0.4) * (1 - alphaFade * 0.16);
      frameSizeScale[frame] = 1.16 - breakupProgress * 0.02;
      frameGateOpacity[frame] = 1 - Math.pow(alphaFade, 1.1);

      brightR[frame] = Math.round(255 + (bgColor[0] - 255) * blendToBg);
      brightG[frame] = Math.round(255 + (bgColor[1] - 255) * blendToBg);
      brightB[frame] = Math.round(255 + (bgColor[2] - 255) * blendToBg);
      softR[frame] = Math.round(222 + (bgColor[0] - 222) * blendToBg);
      softG[frame] = Math.round(222 + (bgColor[1] - 222) * blendToBg);
      softB[frame] = Math.round(222 + (bgColor[2] - 222) * blendToBg);

      let activeRingCount = 0;
      for (let r = 0; r < waveEvents.length; r += 1) {
        const event = waveEvents[r];
        const age = tMs - event.startMs;
        if (age < 0) {
          continue;
        }

        const radius = age * event.speed;
        const ringAlpha = Math.exp(-age * event.decay) * (0.5 + (1 - breakupEase) * 0.38);
        if (ringAlpha < 0.03 || radius > event.maxRadius) {
          continue;
        }

        if (activeRingCount >= MAX_RIPPLES_PER_FRAME) {
          break;
        }

        const ringBase = frame * MAX_RIPPLES_PER_FRAME * 5 + activeRingCount * 5;
        ringData[ringBase] = event.x;
        ringData[ringBase + 1] = event.y;
        ringData[ringBase + 2] = radius;
        ringData[ringBase + 3] = ringAlpha;
        ringData[ringBase + 4] = event.ellipse;
        activeRingCount += 1;
      }
      ringCount[frame] = activeRingCount;

      const formFramePos = formProgress * (formFrameCount - 1);
      const formA = Math.floor(formFramePos);
      const formB = Math.min(formFrameCount - 1, formA + 1);
      const formBlend = formFramePos - formA;
      const formBaseA = formA * formStride;
      const formBaseB = formB * formStride;

      const breakupDriftY = breakupEase * breakupEase * (height * 0.006);
      const breakupSeedFrame = breakupProgress > 0 && !breakupInitialized;

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
          if (breakupSeedFrame) {
            breakupPosX[i] = x;
            breakupPosY[i] = y;
            breakupPosZ[i] = z;
            breakupVelX[i] = Math.sin(seed[i] * 1.9) * 0.16;
            breakupVelY[i] = Math.cos(seed[i] * 1.6) * 0.16;
            breakupVelZ[i] = Math.sin(seed[i] * 2.3) * 0.3;
          }

          let flowX = breakupPosX[i];
          let flowY = breakupPosY[i];
          let flowZ = breakupPosZ[i];
          let flowVX = breakupVelX[i];
          let flowVY = breakupVelY[i];
          let flowVZ = breakupVelZ[i];
          const anchor = Math.max(0, 1 - breakupProgress * 1.7) * 0.04;

          flowVX += (x - flowX) * anchor + Math.sin(seed[i] + tMs * 0.0033) * breakupEase * 0.018;
          flowVY +=
            (y - flowY) * anchor +
            breakupDriftY * 0.06 +
            Math.cos(seed[i] * 1.27 + tMs * 0.0029) * breakupEase * 0.009;
          flowVZ += (z - flowZ) * anchor * 0.16 + Math.sin(seed[i] * 1.4 + tMs * 0.0031) * breakupEase * 0.2;

          for (let r = 0; r < waveEvents.length; r += 1) {
            const event = waveEvents[r];
            const age = tMs - event.startMs;
            if (age < 0) {
              continue;
            }

            const dx = flowX - event.x;
            const dy = flowY - event.y;
            const dist = Math.hypot(dx, dy) || 1;
            const ndx = dx / dist;
            const ndy = dy / dist;
            const tangentialX = -ndy;
            const tangentialY = ndx;
            const radius = age * event.speed;
            if (radius <= event.maxRadius) {
              const diff = dist - radius;
              const absDiff = Math.abs(diff);
              const carrierBand = event.band * 2.1;
              if (absDiff <= carrierBand) {
                const envelope = 1 - absDiff / carrierBand;
                const wave = Math.sin(diff * event.freq - age * event.phaseSpeed + seed[i]);
                const surge = envelope * (0.74 + wave * 0.42) * event.amp;
                flowVX += ndx * surge * 0.23 + tangentialX * surge * 0.09 * orbitDir[i];
                flowVY += ndy * surge * 0.26 + tangentialY * surge * 0.12 * orbitDir[i];
                flowVZ += surge * 0.06 * Math.cos(seed[i] + event.phase);
              }
            }

            if (age <= event.scatterDuration) {
              const scatterProgress = 1 - age / event.scatterDuration;
              const scatterEnvelope = Math.exp(-(dist * dist) / (event.scatterRadius * event.scatterRadius));
              const shock = scatterEnvelope * scatterProgress * event.scatterForce;
              flowVX += ndx * shock * 0.25;
              flowVY += ndy * shock * 0.29 + scatterProgress * event.driftY * 0.42;
              flowVZ += shock * event.depthPush * 0.09 * Math.sin(seed[i] * 1.18 + event.phase);
            }
          }

          const drag = 0.95 - breakupProgress * 0.035;
          flowVX *= drag;
          flowVY *= drag;
          flowVZ *= 0.955;
          flowX += flowVX;
          flowY += flowVY;
          flowZ += flowVZ;

          breakupPosX[i] = flowX;
          breakupPosY[i] = flowY;
          breakupPosZ[i] = flowZ;
          breakupVelX[i] = flowVX;
          breakupVelY[i] = flowVY;
          breakupVelZ[i] = flowVZ;

          x = flowX;
          y = flowY;
          z = flowZ;
        }

        const base = frame * totalStride + pIndex;
        timelinePos[base] = x;
        timelinePos[base + 1] = y;
        timelinePos[base + 2] = clamp(z, -depthRange * 2.0, depthRange * 2.0);
        timelinePos[base + 3] = 0;
      }

      if (breakupSeedFrame) {
        breakupInitialized = true;
      }
    }

    const drawWaveRingsToContext = (ctx, frameIndex, breakupNow) => {
      const activeRingCount = ringCount[frameIndex];
      if (activeRingCount <= 0) {
        return;
      }

      const fadeToBg = Math.pow(clamp(breakupNow * 0.88, 0, 1), 0.92);
      const ringR = Math.round(84 + (bgColor[0] - 84) * fadeToBg);
      const ringG = Math.round(168 + (bgColor[1] - 168) * fadeToBg);
      const ringB = Math.round(228 + (bgColor[2] - 228) * fadeToBg);
      const glowR = Math.round(138 + (bgColor[0] - 138) * fadeToBg);
      const glowG = Math.round(214 + (bgColor[1] - 214) * fadeToBg);
      const glowB = Math.round(255 + (bgColor[2] - 255) * fadeToBg);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < activeRingCount; i += 1) {
        const rb = frameIndex * MAX_RIPPLES_PER_FRAME * 5 + i * 5;
        const x = ringData[rb];
        const y = ringData[rb + 1];
        const radius = ringData[rb + 2];
        const alpha = ringData[rb + 3];
        const ellipse = ringData[rb + 4];
        const haloAlpha = Math.min(0.58, alpha * 0.84);
        const crestAlpha = Math.min(0.96, alpha * 1.34);
        const trailAlpha = Math.min(0.72, alpha * 0.92);

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, ellipse);

        ctx.lineCap = 'round';
        ctx.strokeStyle = `rgba(${ringR}, ${ringG}, ${ringB}, ${haloAlpha * 0.34})`;
        ctx.lineWidth = 7.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(${ringR}, ${ringG}, ${ringB}, ${trailAlpha})`;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(1, radius - 18), 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(${glowR}, ${glowG}, ${glowB}, ${crestAlpha})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(${ringR}, ${ringG}, ${ringB}, ${haloAlpha})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 18, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }
      ctx.restore();
    };

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
          const diameter = radius * 1.18;
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
        drawWaveRingsToContext(ctx, frameA, breakupNow);

        if (gateElement && !gateElement.classList.contains('is-exiting')) {
          const gateOpacity = frameGateOpacity[frameA] + (frameGateOpacity[frameB] - frameGateOpacity[frameA]) * blend;
          gateElement.style.opacity = `${gateOpacity}`;
        }

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

    const startWaveOverlayRenderer = (ctx, startAt = performance.now()) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let rafId = 0;
      let stopped = false;

      const render = (timestamp) => {
        if (stopped) {
          return;
        }

        const elapsed = timestamp - startAt;
        const progress = clamp(elapsed / durationMs, 0, 1);
        const framePos = progress * (totalFrameCount - 1);
        const frameA = Math.floor(framePos);
        const breakupNow = clamp((elapsed - breakupStartMs) / Math.max(1, durationMs - breakupStartMs), 0, 1);

        ctx.clearRect(0, 0, width, height);
        drawWaveRingsToContext(ctx, frameA, breakupNow);
        rafId = requestAnimationFrame(render);
      };

      rafId = requestAnimationFrame(render);
      return () => {
        stopped = true;
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        ctx.clearRect(0, 0, width, height);
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
        gl_PointSize = max(1.35, aSize * uSizeScale * uDpr * perspective * (1.1 + perspective * 0.18));
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

        if (gateElement && !gateElement.classList.contains('is-exiting')) {
          const gateOpacity = frameGateOpacity[frameA] + (frameGateOpacity[frameB] - frameGateOpacity[frameA]) * blend;
          gateElement.style.opacity = `${gateOpacity}`;
        }

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
        canvas.classList.add('is-wave-overlay');
        const waveCtx = canvas.getContext('2d', { alpha: true, desynchronized: true });
        const stopWaves = waveCtx ? startWaveOverlayRenderer(waveCtx, sharedStartAt) : () => {};
        return () => {
          stopWaves();
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

  document.body.classList.add('intro-lock');

  requestAnimationFrame(() => {
    introGate.classList.add('is-visible');
  });

  let stopIntroParticles = () => {};
  let introFinished = false;
  let introCleanupTimer = 0;
  const finishIntro = () => {
    if (introFinished) {
      return;
    }
    introFinished = true;
    introGate.style.removeProperty('opacity');
    introGate.style.removeProperty('visibility');
    introGate.classList.remove('is-visible');
    introGate.classList.add('is-exiting');

    const cleanupIntro = () => {
      stopIntroParticles();
      stopIntroParticles = () => {};
      if (introGate.isConnected) {
        introGate.remove();
      }
      document.body.classList.remove('intro-lock');
    };

    if (introCleanupTimer) {
      window.clearTimeout(introCleanupTimer);
    }
    introCleanupTimer = window.setTimeout(cleanupIntro, INTRO_EXIT_MS + 40);
  };
  if (introParticleCanvas) {
    stopIntroParticles = startIntroParticles(
      introParticleCanvas,
      INTRO_DURATION_MS,
      FORM_PHASE_MS,
      DISSOLVE_PHASE_MS,
      INTRO_FPS,
      introGate,
      finishIntro
    );
  }

  window.setTimeout(finishIntro, INTRO_DURATION_MS + 160);
}
})();
