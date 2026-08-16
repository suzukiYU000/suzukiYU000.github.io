const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const introGate = document.getElementById('intro-gate');
const revealElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealElements.forEach((element, index) => {
  element.style.transitionDelay = `${index * 0.08}s`;
  observer.observe(element);
});

const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const activityTimeline = document.getElementById('activity-timeline');
const activityToggle = document.getElementById('activity-toggle');

if (activityTimeline && activityToggle) {
  const activityItems = [...activityTimeline.querySelectorAll('.timeline-item')];
  const configuredVisibleItems = Number.parseInt(activityTimeline.dataset.visibleItems || '', 10);
  const visibleItems = Number.isFinite(configuredVisibleItems) ? configuredVisibleItems : 6;
  const extraItems = activityItems.slice(visibleItems);
  const toggleLabel = activityToggle.querySelector('.timeline-toggle-label');
  const toggleCount = activityToggle.querySelector('.timeline-toggle-count');

  if (extraItems.length > 0 && toggleLabel && toggleCount) {
    extraItems.forEach((item) => item.classList.add('timeline-extra'));
    activityTimeline.classList.add('is-collapsed');
    activityToggle.hidden = false;

    const setActivityExpanded = (isExpanded) => {
      activityTimeline.classList.toggle('is-collapsed', !isExpanded);
      activityTimeline.classList.toggle('is-expanded', isExpanded);
      activityToggle.setAttribute('aria-expanded', String(isExpanded));
      toggleLabel.textContent = isExpanded ? '閉じる' : 'もっと見る';
      toggleCount.textContent = isExpanded ? '' : `+${extraItems.length}`;
      activityToggle.setAttribute(
        'aria-label',
        isExpanded ? '活動実績を閉じる' : `活動実績をさらに${extraItems.length}件表示`
      );
    };

    activityToggle.addEventListener('click', () => {
      setActivityExpanded(activityToggle.getAttribute('aria-expanded') !== 'true');
    });

    setActivityExpanded(false);
  }
}

const siteHeader = document.querySelector('.site-header');
const navToggle = document.getElementById('nav-toggle');
const siteNav = document.getElementById('site-nav');

if (siteHeader && navToggle && siteNav) {
  const setNavOpen = (isOpen) => {
    siteHeader.classList.toggle('nav-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.textContent = isOpen ? 'Close' : 'Menu';
  };

  navToggle.addEventListener('click', () => {
    setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true');
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNavOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || navToggle.getAttribute('aria-expanded') !== 'true') {
      return;
    }
    setNavOpen(false);
    navToggle.focus();
  });

  document.addEventListener('pointerdown', (event) => {
    if (
      navToggle.getAttribute('aria-expanded') === 'true' &&
      event.target instanceof Node &&
      !siteHeader.contains(event.target)
    ) {
      setNavOpen(false);
    }
  });

  const desktopNavigationQuery = window.matchMedia('(min-width: 681px)');
  const closeNavigationOnDesktop = (event) => {
    if (event.matches) {
      setNavOpen(false);
    }
  };

  if (typeof desktopNavigationQuery.addEventListener === 'function') {
    desktopNavigationQuery.addEventListener('change', closeNavigationOnDesktop);
  } else if (typeof desktopNavigationQuery.addListener === 'function') {
    desktopNavigationQuery.addListener(closeNavigationOnDesktop);
  }
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const contactMailAppButton = document.getElementById('contact-mail-app');
  const contactTo = 'yuma.suzuki.work@gmail.com';

  const getContactPayload = () => {
    const name = (document.getElementById('contact-name')?.value || '').trim();
    const email = (document.getElementById('contact-email')?.value || '').trim();
    const subjectInput = (document.getElementById('contact-subject')?.value || '').trim();
    const message = (document.getElementById('contact-message')?.value || '').trim();
    const subject = subjectInput || 'Portfolio Inquiry';
    const body = [
      `Name: ${name || '(not provided)'}`,
      `Email: ${email || '(not provided)'}`,
      '',
      message || '(no message)'
    ].join('\n');
    return { subject, body };
  };

  const openMailApp = () => {
    const { subject, body } = getContactPayload();
    const mailto = `mailto:${contactTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const openMailAppAfterValidation = () => {
    if (!contactForm.reportValidity()) {
      return;
    }
    openMailApp();
  };

  const openGmailCompose = () => {
    const { subject, body } = getContactPayload();
    const gmailUrl = new URL('https://mail.google.com/mail/');
    gmailUrl.searchParams.set('view', 'cm');
    gmailUrl.searchParams.set('fs', '1');
    gmailUrl.searchParams.set('to', contactTo);
    gmailUrl.searchParams.set('su', subject);
    gmailUrl.searchParams.set('body', body);

    const popup = window.open(gmailUrl.toString(), '_blank', 'noopener,noreferrer');
    if (!popup) {
      openMailApp();
    }
  };

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    openGmailCompose();
  });

  if (contactMailAppButton) {
    contactMailAppButton.addEventListener('click', openMailAppAfterValidation);
  }
}

const rootElement = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const THEME_STORAGE_KEY = 'portfolio-theme-mode';
const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

let themeMode = 'system';
let resolvedTheme = systemDarkQuery.matches ? 'dark' : 'light';

const updateThemeToggleLabel = () => {
  if (!themeToggle) {
    return;
  }

  if (themeMode === 'system') {
    themeToggle.textContent = `Theme: Auto (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`;
  } else {
    themeToggle.textContent = `Theme: ${themeMode === 'dark' ? 'Dark' : 'Light'}`;
  }
};

const applyThemeMode = (nextMode) => {
  themeMode = nextMode;

  if (themeMode === 'system') {
    rootElement.removeAttribute('data-theme');
    resolvedTheme = systemDarkQuery.matches ? 'dark' : 'light';
  } else {
    rootElement.setAttribute('data-theme', themeMode);
    resolvedTheme = themeMode;
  }

  updateThemeToggleLabel();
};

try {
  const storedMode = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedMode === 'dark' || storedMode === 'light' || storedMode === 'system') {
    themeMode = storedMode;
  }
} catch {
  themeMode = 'system';
}

applyThemeMode(themeMode);

const handleSystemThemeChange = () => {
  if (themeMode === 'system') {
    applyThemeMode('system');
  }
};

if (typeof systemDarkQuery.addEventListener === 'function') {
  systemDarkQuery.addEventListener('change', handleSystemThemeChange);
} else if (typeof systemDarkQuery.addListener === 'function') {
  systemDarkQuery.addListener(handleSystemThemeChange);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextMode = themeMode === 'system' ? 'dark' : themeMode === 'dark' ? 'light' : 'system';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch {
      // Ignore storage errors.
    }
    applyThemeMode(nextMode);
  });
}

const applyMediaConfig = (mediaConfig) => {
  const videosToReload = new Set();

  document.querySelectorAll('[data-media-key]').forEach((element) => {
    const key = element.dataset.mediaKey;
    const media = mediaConfig[key];
    if (!media) {
      return;
    }

    if (element.tagName === 'IMG') {
      if (media.src && element.getAttribute('src') !== media.src) {
        element.src = media.src;
      }
      if (media.alt) {
        element.alt = media.alt;
      }
    } else if (element.tagName === 'SOURCE') {
      if (media.src && element.getAttribute('src') !== media.src) {
        element.src = media.src;
        const parentVideo = element.closest('video');
        if (parentVideo) videosToReload.add(parentVideo);
      }
    } else if (element.tagName === 'VIDEO') {
      if (media.src) {
        const source = element.querySelector('source');
        if (source && source.getAttribute('src') !== media.src) {
          source.src = media.src;
          videosToReload.add(element);
        }
      }
    }
  });

  document.querySelectorAll('[data-media-poster-key]').forEach((element) => {
    const key = element.dataset.mediaPosterKey;
    const media = mediaConfig[key];
    if (!media || !media.src || element.tagName !== 'VIDEO') {
      return;
    }
    element.poster = media.src;
  });

  document.querySelectorAll('[data-media-caption-key]').forEach((element) => {
    const key = element.dataset.mediaCaptionKey;
    const media = mediaConfig[key];
    if (media && media.caption) {
      element.textContent = media.caption;
    }
  });

  videosToReload.forEach((video) => {
    video.dataset.needsReload = 'true';
  });
};

const loadMediaConfig = async () => {
  try {
    const response = await fetch('assets/media/media.json?v=20260816-14');
    if (!response.ok) {
      return;
    }
    const mediaConfig = await response.json();
    applyMediaConfig(mediaConfig);
    applyVideoThumbnailTime();
  } catch {
    // Keep fallback values in HTML when json is unavailable.
  }
};

const applyVideoThumbnailTime = () => {
  document.querySelectorAll('video[data-thumbnail-time]').forEach((video) => {
    const thumbnailTime = Number(video.dataset.thumbnailTime);
    if (!Number.isFinite(thumbnailTime) || thumbnailTime < 0) {
      return;
    }

    const seekToThumbnailFrame = () => {
      try {
        if (video.currentTime < thumbnailTime) {
          video.currentTime = thumbnailTime;
        }
      } catch {
        // Ignore seeking errors in unsupported states.
      }
    };

    if (video.readyState >= 1) {
      seekToThumbnailFrame();
    } else {
      video.addEventListener('loadedmetadata', seekToThumbnailFrame, { once: true });
    }
  });
};

const protectMediaAssets = () => {
  const mediaSelector = 'img, video';

  document.querySelectorAll('img').forEach((image) => {
    image.draggable = false;
  });

  document.querySelectorAll('video').forEach((video) => {
    video.setAttribute('controlslist', 'nodownload noremoteplayback');
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('disableremoteplayback', '');
  });

  document.addEventListener('contextmenu', (event) => {
    if (event.target instanceof Element && event.target.closest(mediaSelector)) {
      event.preventDefault();
    }
  });

  document.addEventListener('dragstart', (event) => {
    if (event.target instanceof Element && event.target.closest(mediaSelector)) {
      event.preventDefault();
    }
  });
};

const scheduleBackgroundWarmup = (task, delay = 0, timeout = 1200) => {
  window.setTimeout(() => {
    const runTask = () => {
      if (!document.body.classList.contains('intro-lock')) return;
      try {
        Promise.resolve(task()).catch(() => {});
      } catch {
        // Warm-up is an optional optimization; keep the page usable if it fails.
      }
    };

    if (window.scheduler?.postTask) {
      window.scheduler.postTask(runTask, { priority: 'background' }).catch(() => {});
    } else if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(runTask, { timeout });
    } else {
      window.setTimeout(runTask, 0);
    }
  }, delay);
};

const warmPageDuringIntro = (mediaConfigReady) => {
  if (!document.body.classList.contains('intro-lock')) return;

  const profilePhoto = document.getElementById('profile-photo');
  if (profilePhoto instanceof HTMLImageElement) {
    profilePhoto.loading = 'eager';
    profilePhoto.fetchPriority = 'high';
    profilePhoto.decode?.().catch(() => {});
  }

  scheduleBackgroundWarmup(() => {
    if (!document.fonts) return;
    return Promise.allSettled([
      document.fonts.load('700 96px "Oswald"'),
      document.fonts.load('500 32px "Oswald"'),
      document.fonts.load('400 16px "Space Grotesk"'),
      document.fonts.load('500 16px "Space Grotesk"'),
      document.fonts.load('700 16px "Space Grotesk"')
    ]);
  }, 120, 900);

};

const startPostIntroResources = (mediaConfigReady) => {
  const effectsScript = document.createElement('script');
  effectsScript.src = 'effects.js?v=20260816-8';
  effectsScript.async = true;
  document.body.append(effectsScript);

  const initializeVideoLoading = () => {
    const videos = Array.from(document.querySelectorAll('video'));
    const loadMetadata = (video) => {
      video.preload = 'metadata';
      delete video.dataset.needsReload;
      if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) video.load();
    };

    if (!('IntersectionObserver' in window)) {
      videos.forEach(loadMetadata);
      return;
    }

    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadMetadata(entry.target);
          videoObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '160px 0px' }
    );
    videos.forEach((video) => videoObserver.observe(video));
  };

  mediaConfigReady.then(initializeVideoLoading, initializeVideoLoading);
};

const deferUntilIntroEnds = (callback) => {
  if (!introGate?.isConnected) {
    callback();
    return;
  }

  const introObserver = new MutationObserver(() => {
    if (introGate.isConnected) return;
    introObserver.disconnect();
    callback();
  });
  introObserver.observe(document.body, { childList: true });
  window.addEventListener('pagehide', () => introObserver.disconnect(), { once: true });
};

const mediaConfigReady = loadMediaConfig();
applyVideoThumbnailTime();
protectMediaAssets();
warmPageDuringIntro(mediaConfigReady);
deferUntilIntroEnds(() => startPostIntroResources(mediaConfigReady));

const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
if (cursorDot && cursorRing && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.body.style.cursor = 'none';
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let rx = x;
  let ry = y;
  let cursorRafId = 0;
  let lastCursorFrame = 0;
  let dotNeedsUpdate = false;
  let targetScale = 1;
  let renderedScale = 1;

  const moveCursor = (event) => {
    x = event.clientX;
    y = event.clientY;
    dotNeedsUpdate = true;
    startCursorLoop();
  };

  const animateCursor = (timestamp) => {
    const elapsed = lastCursorFrame ? Math.min(34, timestamp - lastCursorFrame) : 1000 / 60;
    lastCursorFrame = timestamp;
    const follow = 1 - Math.pow(0.62, elapsed / (1000 / 60));

    if (dotNeedsUpdate) {
      cursorDot.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
      dotNeedsUpdate = false;
    }

    rx += (x - rx) * follow;
    ry += (y - ry) * follow;
    renderedScale += (targetScale - renderedScale) * follow;
    cursorRing.style.transform = `translate3d(${rx - 17}px, ${ry - 17}px, 0) scale(${renderedScale})`;

    const stillFollowing =
      Math.abs(x - rx) + Math.abs(y - ry) > 0.14 || Math.abs(targetScale - renderedScale) > 0.002;
    if (stillFollowing) {
      cursorRafId = requestAnimationFrame(animateCursor);
    } else {
      cursorRafId = 0;
      lastCursorFrame = 0;
    }
  };

  const stopCursorLoop = () => {
    if (cursorRafId) {
      cancelAnimationFrame(cursorRafId);
      cursorRafId = 0;
    }
  };

  const startCursorLoop = () => {
    if (!cursorRafId) {
      cursorRafId = requestAnimationFrame(animateCursor);
    }
  };

  document.addEventListener('pointermove', moveCursor, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopCursorLoop();
    } else {
      startCursorLoop();
    }
  });

  const hoverTargets = document.querySelectorAll('a, button, video');
  hoverTargets.forEach((target) => {
    target.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-hover');
      targetScale = 1.35;
      startCursorLoop();
    });
    target.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-hover');
      targetScale = 1;
      startCursorLoop();
    });
  });
}









