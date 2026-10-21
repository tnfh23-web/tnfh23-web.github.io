/* =========================================================
   GSAP / ScrollTrigger
========================================================= */
gsap.registerPlugin(ScrollTrigger);
// Resize is handled once below, after both pinned sections have been rebuilt.
ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" });

/* One clock for the portfolio's GSAP animations and CSS motion. */
const motionState = { isSlow: false, durationScale: 1 };
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setSiteSlowMotion(isSlow) {
  motionState.isSlow = isSlow;
  motionState.durationScale = isSlow ? 2.5 : 1;
  document.documentElement.style.setProperty("--motion-duration-scale", motionState.durationScale);
  document.documentElement.dataset.motion = isSlow ? "slow" : "normal";
  gsap.globalTimeline.timeScale(1 / motionState.durationScale);

  const button = document.querySelector(".circle-center");
  button?.setAttribute("aria-pressed", String(isSlow));
  button?.setAttribute("aria-label", isSlow ? "사이트 슬로모션 끄기" : "사이트 슬로모션 켜기");
  if (button) button.textContent = isSlow ? "slow" : "click";
  document.querySelector(".circle-box")?.classList.toggle("is-speed-locked", isSlow);
  const status = document.querySelector(".hero-motion-status");
  if (status) status.textContent = isSlow ? "SLOW MOTION ON · 0.4×" : "NORMAL SPEED · 1×";
  const description = document.querySelector("#motion-description");
  if (description) description.textContent = isSlow ? "슬로모션 ON · 다시 클릭하면 원래 속도" : "클릭하면 사이트의 움직임이 느려져요";
}

/* =========================================================
   Lenis (Smooth Scroll)
========================================================= */
let lenis = null;

if (window.Lenis) {
  lenis = new Lenis({
    lerp: 0.06,
    wheelMultiplier: 1.2,
    smoothWheel: true,
    smoothTouch: false,
  });

  // Lenis <-> ScrollTrigger sync
  lenis.on("scroll", ScrollTrigger.update);

  // GSAP ticker에 Lenis 연결
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // refresh 시 Lenis 사이즈 재계산
  ScrollTrigger.addEventListener("refresh", () => lenis.resize());
}

/* =========================================================
   Loading Scroll Lock (로딩 중 스크롤만 막기)
========================================================= */
let _lockScroll = false;

function _preventScroll(e) {
  if (!_lockScroll) return;
  e.preventDefault();
}

function startLoadingLock() {
  _lockScroll = true;
  document.documentElement.classList.add("is-loading");
  document.body.classList.add("is-loading");

  if (lenis) lenis.stop();
}

function endLoadingUnlock() {
  _lockScroll = false;
  document.documentElement.classList.remove("is-loading");
  document.body.classList.remove("is-loading");

  if (lenis) lenis.start();
}

window.addEventListener("wheel", _preventScroll, { passive: false, capture: true });
window.addEventListener("touchmove", _preventScroll, { passive: false, capture: true });

/* =========================================================
   header (PC 자동 숨김)
========================================================= */
function setupAutoHideHeader() {
  const headers = document.querySelectorAll(".pc-top-bar");
  if (!headers.length) return;

  let lastY = 0;
  const delta = 8;
  const headerH = headers[0].offsetHeight || 0;

  function update(y) {
    headers.forEach((header) => {
      if (y <= 0) {
        header.classList.remove("is-hide");
        return;
      }

      const diff = y - lastY;
      if (Math.abs(diff) < delta) return;

      if (diff > 0 && y > headerH) header.classList.add("is-hide");
      if (diff < 0) header.classList.remove("is-hide");
    });

    lastY = y;
  }

  if (window.Lenis && lenis) {
    //  Lenis 스크롤 이벤트로 제어
    lenis.on("scroll", ({ scroll }) => update(scroll));
  } else {
    window.addEventListener("scroll", () => update(window.scrollY || 0), { passive: true });
  }
}

/* =========================================================
   Header show
========================================================= */
function showHeader() {
  document.querySelectorAll(".top-bar").forEach((header) => {
    header.classList.add("is-show");
  });

  setupAutoHideHeader();
}

/* =========================================================
   Anchor Click (Header 메뉴 클릭 시 Lenis로 이동)
========================================================= */
let sectionNavigationUntil = 0;
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    if (_lockScroll) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    sectionNavigationUntil = performance.now() + (2 * motionState.durationScale + 0.2) * 1000;
    window.dispatchEvent(new Event("portfolio:section-navigation"));

    const header = document.querySelector(".top-bar.is-show");
    const headerH = header ? header.offsetHeight : 0;
    const projectPin = href === "#sec-project" ? ScrollTrigger.getById("proj-pin") : null;

    if (lenis) {
      lenis.start();
      lenis.scrollTo(projectPin ? projectPin.start : target, {
        offset: href === "#sec-contact" ? 0 : -headerH,
        duration: 2 * motionState.durationScale,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        onComplete: () => {
          sectionNavigationUntil = 0;
        },
      });
    } else {
      if (projectPin) window.scrollTo({ top: projectPin.start - headerH, behavior: "smooth" });
      else target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

/* =========================================================
   Mobile Menu
========================================================= */
function setupMobileMenu() {
  const header = document.querySelector(".mo-top-bar");
  if (!header) return;

  const btn = header.querySelector(".sidebar-menu-box");
  const menu = header.querySelector(".mo-menu");
  if (!btn || !menu) return;

  const links = menu.querySelectorAll('a[href^="#"]');

  if (!btn.hasAttribute("aria-expanded")) btn.setAttribute("aria-expanded", "false");
  if (!btn.hasAttribute("aria-label")) btn.setAttribute("aria-label", "메뉴 열기");

  function setExpanded(v) {
    btn.setAttribute("aria-expanded", String(v));
    btn.setAttribute("aria-label", v ? "메뉴 닫기" : "메뉴 열기");
  }

  function openMenu() {
    header.classList.add("is-menu-open");
    setExpanded(true);
  }

  function closeMenu() {
    header.classList.remove("is-menu-open");
    setExpanded(false);
  }

  function toggleMenu() {
    header.classList.contains("is-menu-open") ? closeMenu() : openMenu();
  }

  btn.addEventListener("click", (e) => {
    if (_lockScroll) return;
    e.preventDefault();
    toggleMenu();
  });

  links.forEach((a) => a.addEventListener("click", () => closeMenu()));

  document.addEventListener("click", (e) => {
    if (!header.classList.contains("is-menu-open")) return;
    if (header.contains(e.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (header.classList.contains("is-menu-open")) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && header.classList.contains("is-menu-open")) closeMenu();
  });
}

/* =========================================================
   Divider (복사 + ScrollTrigger Marquee)
========================================================= */
let _dividerCopied = false;
let topTween, bottomTween;

function copyDividerTextOnce() {
  if (_dividerCopied) return;
  _dividerCopied = true;

  document.querySelectorAll(".text-gsap-box-top,.text-gsap-box-bottom").forEach((track) => {
    const copy = 3;
    const original = track.innerHTML;
    for (let i = 0; i < copy; i++) track.innerHTML += original;
  });
}

function dividerMarquee() {
  const top = document.querySelector(".text-gsap-box-top");
  const bottom = document.querySelector(".text-gsap-box-bottom");
  const triggerEl = document.querySelector(".divider");
  if (!top || !bottom || !triggerEl) return;

  // 기존꺼 정리
  topTween?.kill();
  bottomTween?.kill();
  ScrollTrigger.getById("divider-top")?.kill();
  ScrollTrigger.getById("divider-bottom")?.kill();

  // transform 초기화
  gsap.set([top, bottom], { clearProps: "transform" });

  const distTop = Math.max(0, top.scrollWidth - window.innerWidth);
  const distBottom = Math.max(0, bottom.scrollWidth - window.innerWidth);

  if (distTop === 0 && distBottom === 0) return;

  if (distTop > 0) {
    topTween = gsap.to(top, {
      x: -distTop,
      ease: "none",
      scrollTrigger: {
        id: "divider-top",
        trigger: triggerEl,
        scrub: 0.2,
        invalidateOnRefresh: true,
        end: `+=${distTop}`,
      },
    });
  }

  if (distBottom > 0) {
    bottomTween = gsap.fromTo(
      bottom,
      { x: -distBottom },
      {
        x: 0,
        ease: "none",
        scrollTrigger: {
          id: "divider-bottom",
          trigger: triggerEl,
          scrub: 0.2,
          invalidateOnRefresh: true,
          end: `+=${distBottom}`,
        },
      },
    );
  }
}

async function waitProjectAssets() {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {}
  }

  const imgs = Array.from(document.querySelectorAll("#sec-project img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((res) => {
        img.addEventListener("load", res, { once: true });
        img.addEventListener("error", res, { once: true });
      });
    }),
  );

  await Promise.all(imgs.map((img) => img.decode?.().catch(() => {}) ?? Promise.resolve()));
}

/* One scene owns the project deck, including its entry masks and cleanup. */
let projectScene = null;
function setupProjectScene() {
  projectScene?.destroy();
  projectScene = setupProjectDeck({ reducedMotion });
}

function endLoading(playHeroEntrance) {
  loadingScene.reveal(playHeroEntrance, () => {
    endLoadingUnlock();
    document.body.setAttribute("aria-busy", "false");
    showHeader();
    ScrollTrigger.refresh();
  });
}

/* =========================================================
   Resize (✅ 하나로 통합 / 디바운스)
========================================================= */
let resizeTimer;
let lastW = window.innerWidth;
let lastH = window.innerHeight;
let resizeRevision = 0;
let resizeAnchor = null;
let pageMotionReady = false;

function captureResizeAnchor() {
  const y = window.scrollY;
  if (y < 2) return { type: "top" };
  for (const [selector, cardSelector, type] of [["#sec-vibe.is-static", ".vibe-slide", "vibe-slide"], ["#sec-project.is-project-flow", ".project-list-item", "project-card"]]) {
    const flow = document.querySelector(selector);
    if (!flow) continue;
    const projectCardIndex = type === "project-card" ? projectScene?.flowCardIndex() : null;
    if (projectCardIndex != null) return { type, index: projectCardIndex };
    const cards = Array.from(flow.querySelectorAll(cardSelector));
    const visible = cards
      .map((card, index) => {
        const rect = card.getBoundingClientRect();
        return { index, pixels: Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top)) };
      })
      .sort((a, b) => b.pixels - a.pixels)[0];
    if (visible?.pixels > 0) return { type, index: visible.index };
  }
  for (const id of ["vibe-pin", "proj-pin"]) {
    const pin = ScrollTrigger.getById(id);
    if (pin && y >= pin.start - 1 && y <= pin.end + 1) {
      // Responsive reflow can move the browser's scroll anchor before this event.
      // Preserve the visible fold rather than that already-shifted scroll position.
      const progress = id === "proj-pin" ? pin.animation.totalProgress() : (y - pin.start) / (pin.end - pin.start);
      return { type: "pin", id, progress: gsap.utils.clamp(0, 1, progress), cardIndex: id === "proj-pin" ? Math.max(0, Number(document.querySelector("#sec-project").dataset.activeProject) - 1) : null };
    }
  }
  if (Math.abs(y - ScrollTrigger.maxScroll(window)) < 3) return { type: "end" };
  const sections = Array.from(document.querySelectorAll("main > section, #sec-contact"));
  const section = sections.find((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top <= window.innerHeight * 0.2 && rect.bottom > window.innerHeight * 0.2;
  });
  if (!section) return { type: "absolute", y };
  const rect = section.getBoundingClientRect();
  return { type: "section", section, progress: gsap.utils.clamp(0, 1, -rect.top / rect.height) };
}

function restoreResizeAnchor(anchor) {
  let y = 0;
  const headerHeight = Math.max(0, ...Array.from(document.querySelectorAll(".top-bar")).map((header) => header.offsetHeight));
  if (anchor?.type === "project-card") {
    const pin = ScrollTrigger.getById("proj-pin");
    if (pin) y = pin.start + projectScene.progressForCard(anchor.index) * (pin.end - pin.start);
    else y = window.scrollY + document.querySelectorAll("#sec-project .project-list-item")[anchor.index].getBoundingClientRect().top - headerHeight;
  } else if (anchor?.type === "vibe-slide") {
    const pin = ScrollTrigger.getById("vibe-pin");
    const cards = document.querySelectorAll(".vibe-slide");
    if (pin) y = pin.start + (anchor.index / (cards.length - 1)) * (pin.end - pin.start);
    else y = window.scrollY + cards[anchor.index].getBoundingClientRect().top - headerHeight;
  } else if (anchor?.type === "pin") {
    const pin = ScrollTrigger.getById(anchor.id);
    if (pin) y = pin.start + anchor.progress * (pin.end - pin.start);
    else {
      const section = document.querySelector(anchor.id === "vibe-pin" ? "#sec-vibe" : "#sec-project");
      const cards = section.querySelectorAll(anchor.id === "vibe-pin" ? ".vibe-slide" : ".project-list-item");
      const card = cards[anchor.cardIndex ?? Math.round(anchor.progress * (cards.length - 1))] || section;
      y = window.scrollY + card.getBoundingClientRect().top - headerHeight;
    }
  } else if (anchor?.type === "section") {
    const rect = anchor.section.getBoundingClientRect();
    y = window.scrollY + rect.top + rect.height * anchor.progress;
  } else if (anchor?.type === "end") y = ScrollTrigger.maxScroll(window);
  else if (anchor?.type === "absolute") y = anchor.y;
  y = gsap.utils.clamp(0, ScrollTrigger.maxScroll(window), y);
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(y, { immediate: true, force: true });
  } else window.scrollTo({ top: y, behavior: "auto" });
  ScrollTrigger.update();
  for (const id of ["hero-playground-exit", "proj-pin", "vibe-pin"]) {
    const pin = ScrollTrigger.getById(id);
    pin?.animation?.totalProgress(pin.progress, false);
  }
}

function handleResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w === lastW && h === lastH) return;
  const smallMobileChromeChange = w === lastW && w <= 768 && Math.abs(h - lastH) < 100;
  lastW = w;
  lastH = h;
  if (!pageMotionReady || smallMobileChromeChange) return;
  resizeAnchor ||= captureResizeAnchor();
  clearTimeout(resizeTimer);
  const revision = ++resizeRevision;
  resizeTimer = setTimeout(async () => {
    await waitProjectAssets();
    if (revision !== resizeRevision) return;
    const anchor = resizeAnchor;
    window.dispatchEvent(new Event("portfolio:section-navigation"));
    dividerMarquee();
    setupProjectScene();
    setupFrontendProjectAnimation();
    setupVibeAccordion();
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    restoreResizeAnchor(anchor);
    resizeAnchor = null;
  }, 160);
}

window.addEventListener("resize", handleResize, { passive: true });
reducedMotion.addEventListener("change", () => {
  if (!pageMotionReady) return;
  const anchor = captureResizeAnchor();
  setupProjectScene();
  setupVibeAccordion();
  ScrollTrigger.refresh();
  restoreResizeAnchor(anchor);
});

/* =========================================================
   Hero Circle Text
========================================================= */
function setupCircleTextRotation() {
  const circleBox = document.querySelector(".circle-box");
  const circleText = circleBox?.querySelector(".circle-text");
  const circleCenter = circleBox?.querySelector(".circle-center");

  if (!circleBox || !circleText || !circleCenter) return;

  const rotationTween = gsap.to(circleText, {
    rotation: 360,
    duration: 10,
    ease: "none",
    repeat: -1,
    transformOrigin: "50% 50%",
  });
  const syncReducedMotion = () => rotationTween.paused(reducedMotion.matches);
  syncReducedMotion();
  reducedMotion.addEventListener("change", syncReducedMotion);

  circleCenter.addEventListener("click", () => {
    setSiteSlowMotion(!motionState.isSlow);
  });
}

/* =========================================================
   Frontend Project Reveal
========================================================= */
function setupFrontendProjectAnimation() {
  const section = document.querySelector("#sec-frontend");
  const projectItems = gsap.utils.toArray("#sec-frontend .front-project-item");
  if (!section) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.set(section.querySelectorAll(".front-project-visual, .front-project-info, .front-project-watermark"), { clearProps: "all" });
    return;
  }

  ScrollTrigger.getAll().forEach((trigger) => {
    if (trigger.vars.id?.startsWith("frontend-")) trigger.kill();
  });

  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

  projectItems.forEach((item, index) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        id: `frontend-item-${index}`,
        trigger: item,
        start: "top 78%",
        end: "top 28%",
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.fromTo(item.querySelector(".front-project-visual"), { y: 12 * rem, rotation: -2.5, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, ease: "power2.out" }).fromTo(
      item.querySelector(".front-project-info"),
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, ease: "power2.out" },
      "<0.15",
    );
  });

  gsap.fromTo(
    section.querySelector(".front-project-watermark"),
    { x: 140 },
    {
      x: -80,
      ease: "none",
      scrollTrigger: {
        id: "frontend-watermark",
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        invalidateOnRefresh: true,
      },
    },
  );
}

/* =========================================================
   Frontend Preview - Parent Scroll Isolation
========================================================= */
function setupFrontendPreviewScrollIsolation() {
  const previews = document.querySelectorAll("#sec-frontend iframe");

  previews.forEach((preview) => {
    let isPreviewActive = false;
    let lockedScrollY = 0;
    let isRestoring = false;

    const restoreParentScroll = () => {
      if (!isPreviewActive || isRestoring) return;
      if (performance.now() < sectionNavigationUntil) return;
      if (Math.abs(window.scrollY - lockedScrollY) < 1) return;

      isRestoring = true;

      if (lenis) {
        lenis.scrollTo(lockedScrollY, { immediate: true, force: true });
      } else {
        window.scrollTo({ top: lockedScrollY, behavior: "auto" });
      }

      requestAnimationFrame(() => {
        isRestoring = false;
      });
    };

    const lockParentScroll = () => {
      if (isPreviewActive) return;
      // Moving a section underneath a stationary pointer must not interrupt menu navigation.
      if (performance.now() < sectionNavigationUntil) return;
      lockedScrollY = window.scrollY;
      isPreviewActive = true;
      if (lenis) lenis.stop();
    };

    const unlockParentScroll = () => {
      if (!isPreviewActive) return;
      restoreParentScroll();
      isPreviewActive = false;
      if (lenis) lenis.start();
      ScrollTrigger.update();
    };

    preview.addEventListener("pointerenter", lockParentScroll);
    preview.addEventListener("pointerleave", unlockParentScroll);
    preview.addEventListener("focus", lockParentScroll);
    preview.addEventListener("blur", unlockParentScroll);
    window.addEventListener("portfolio:section-navigation", unlockParentScroll);
    window.addEventListener("scroll", restoreParentScroll, { passive: true });
  });
}

/* =========================================================
   Vibe Project - Pinned Section Transition
========================================================= */
let vibeTimeline = null;
function setupVibeAccordion() {
  const section = document.querySelector("#sec-vibe");
  const stage = section?.querySelector(".vibe-stage");
  const slides = gsap.utils.toArray("#sec-vibe .vibe-slide");
  if (!section || !stage || slides.length < 2) return;
  if (vibeTimeline) {
    vibeTimeline.scrollTrigger?.kill(true);
    vibeTimeline.kill();
    vibeTimeline = null;
  } else ScrollTrigger.getById("vibe-pin")?.kill(true);
  gsap.set(stage, { clearProps: "all" });
  gsap.set(slides, { clearProps: "all" });
  gsap.set(section.querySelectorAll(".vibe-outer, .vibe-inner, .vibe-background, .vibe-content"), { clearProps: "all" });
  section.classList.remove("is-static");

  // Pin only when every project's image, copy and actions fit the available height.
  const stacked = window.innerWidth <= 768;
  const needsFlow = slides.some((slide) => {
    const content = slide.querySelector(".vibe-content");
    const main = slide.querySelector(".vibe-main");
    const padding = getComputedStyle(content);
    const available = stage.clientHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom);
    const copyHeight = slide.querySelector(".vibe-copy").offsetHeight;
    const imageHeight = slide.querySelector(".vibe-preview").offsetHeight;
    const needed = stacked ? copyHeight + imageHeight + parseFloat(getComputedStyle(main).rowGap) : Math.max(copyHeight, imageHeight);
    return needed > available + 1;
  });
  if (reducedMotion.matches || needsFlow) {
    section.classList.add("is-static");
    slides.forEach((slide) => slide.classList.add("is-active", "is-interactive"));
    return;
  }

  const transitionCount = slides.length - 1;
  slides.forEach((slide, index) => {
    gsap.set(slide, { autoAlpha: 1, zIndex: index + 1 });
    slide.classList.toggle("is-active", index === 0);
    slide.classList.toggle("is-interactive", index === 0);
    gsap.set(slide.querySelector(".vibe-outer"), { yPercent: index ? 100 : 0 });
    gsap.set(slide.querySelector(".vibe-inner"), { yPercent: index ? -100 : 0 });
    gsap.set(slide.querySelector(".vibe-background"), { yPercent: index ? 15 : 0 });
    gsap.set(slide.querySelector(".vibe-content"), { autoAlpha: index ? 0 : 1, y: index ? 80 : 0 });
  });
  vibeTimeline = gsap.timeline({
    onUpdate() {
      const activeIndex = Math.min(transitionCount, Math.floor(this.progress() * transitionCount + 0.5));
      slides.forEach((slide, index) => {
        slide.classList.toggle("is-active", index === activeIndex);
        slide.classList.toggle("is-interactive", index === activeIndex);
      });
    },
    scrollTrigger: {
      id: "vibe-pin",
      trigger: stage,
      start: "top top",
      end: () => `+=${stage.clientHeight * 1.2 * transitionCount}`,
      pin: stage,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
  slides.slice(1).forEach((next, index) => {
    const start = index * 0.75;
    vibeTimeline
      .fromTo(slides[index].querySelector(".vibe-background"), { yPercent: 0 }, { yPercent: -15, duration: 0.5, ease: "none", immediateRender: false }, start)
      .fromTo(next.querySelector(".vibe-outer"), { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: "power1.inOut", immediateRender: false }, start)
      .fromTo(next.querySelector(".vibe-inner"), { yPercent: -100 }, { yPercent: 0, duration: 0.5, ease: "power1.inOut", immediateRender: false }, start)
      .fromTo(next.querySelector(".vibe-background"), { yPercent: 15 }, { yPercent: 0, duration: 0.5, ease: "power1.inOut", immediateRender: false }, start)
      .fromTo(next.querySelector(".vibe-content"), { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, start + 0.25);
  });
}

/* =========================================================
   Init
========================================================= */
startLoadingLock();
document.body.setAttribute("aria-busy", "true");
const loadingScene = setupTypographyLoader({ reducedMotion });

document.addEventListener("DOMContentLoaded", async () => {
  copyDividerTextOnce();
  dividerMarquee();
  setupMobileMenu();
  setupCircleTextRotation();
  setupHeroPlayground({ motionState, reducedMotion });
  if (typeof setupPortfolioCursor === "function") setupPortfolioCursor({ motionState, reducedMotion });
  setupFrontendPreviewScrollIsolation();

  await waitProjectAssets();
  setupProjectScene();
  setupFrontendProjectAnimation();
  setupVibeAccordion();
  pageMotionReady = true;

  requestAnimationFrame(() => ScrollTrigger.refresh(true));

  const playHeroEntrance = setupPageReveals({ reducedMotion });
  endLoading(playHeroEntrance);
});
