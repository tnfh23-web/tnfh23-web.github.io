/* =========================================================
   GSAP / ScrollTrigger
========================================================= */
gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(SplitText);

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
   AOS
========================================================= */
function initAOSAfterLoading() {
  if (!window.AOS) return;

  AOS.init({
    once: true,
    offset: 0,
    duration: 0,
  });

  AOS.refreshHard();
}

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
function showHeaderAfterHeroAOS() {
  document.querySelectorAll(".top-bar").forEach((header) => {
    header.classList.add("is-show");
  });

  setupAutoHideHeader();
}

/* =========================================================
   Anchor Click (Header 메뉴 클릭 시 Lenis로 이동)
========================================================= */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    if (_lockScroll) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    const header = document.querySelector(".top-bar.is-show");
    const headerH = header ? header.offsetHeight : 0;

    if (lenis) {
      lenis.scrollTo(target, {
        offset: -headerH,
        duration: 2,
        easing: (t) => 1 - Math.pow(1 - t, 3),
      });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
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
        scrub: true,
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
          scrub: true,
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

/* =========================================================
   Section 3 - Project Pin Accordion
========================================================= */
function setupProjectPinAccordion() {
  const section = document.querySelector("#sec-project");
  const allItems = gsap.utils.toArray("#sec-project .project-list-item");
  if (!section || !allItems.length) return;

  ScrollTrigger.getById("proj-pin")?.kill(true);
  gsap.killTweensOf(allItems);

  allItems.forEach((el) => {
    el.style.height = "";
    el.style.overflow = "";
  });

  if (window.matchMedia("(max-width: 768px)").matches) {
    section.style.height = "auto";
    return;
  }

  section.style.height = "";

  const itemList = document.querySelectorAll("#sec-project .project-list-item");
  const items = gsap.utils.toArray("#sec-project .project-list-item");

  //  마지막 아이템 제외(네 로직 유지)
  items.splice(items.length - 1, 1);

  const getHeight = () => {
    let totalHeight = 0;
    itemList.forEach((el) => (totalHeight += el.offsetHeight));
    return totalHeight;
  };

  items.forEach((li) => (li.style.overflow = "hidden"));

  const tl = gsap.timeline({
    scrollTrigger: {
      id: "proj-pin",
      trigger: section,
      start: "top top",
      end: () => `+=${getHeight()}`,
      pin: section,
      scrub: 1,
      refreshPriority: 1,
      invalidateOnRefresh: true,
    },
  });

  const masterStagger = 0.5;

  tl.to(items, {
    height: 0,
    stagger: masterStagger,
    ease: "none",
  });

  tl.to(
    "#sec-project .project-list-item .item-body",
    {
      backgroundColor: "#f7f6f5",
      stagger: masterStagger,
      duration: 0.1,
    },
    "<",
  );
}

/* =========================================================
   Title Split Animation
========================================================= */
function setupSectionTitleAnimation() {
  document.querySelectorAll(".split-title").forEach((title) => {
    if (title.classList.contains("is-split")) return;
    title.classList.add("is-split");

    const split = new SplitText(title, { type: "chars" });

    gsap.from(split.chars, {
      x: -150,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.05,
      scrollTrigger: {
        trigger: title,
        start: "top 80%",
        once: true,
      },
    });
  });
}

/* =========================================================
   Loading End (단일 함수로 정리)
========================================================= */
function endLoading() {
  const loading = document.querySelector(".loading");

  // 로딩 DOM이 없으면 그냥 풀고 AOS + 헤더 처리
  if (!loading) {
    endLoadingUnlock();
    initAOSAfterLoading();
    showHeaderAfterHeroAOS();
    return;
  }

  // split 끝난 뒤 배경 페이드 + AOS 시작
  setTimeout(() => {
    loading.classList.add("is-fade");
    initAOSAfterLoading();
  }, 1000);

  // 완전 제거 + 스크롤 해제
  setTimeout(() => {
    loading.remove();
    endLoadingUnlock();

    requestAnimationFrame(() => {
      ScrollTrigger.refresh(true);
      if (window.AOS) AOS.refreshHard();
    });

    showHeaderAfterHeroAOS();
  }, 2000);
}

/* =========================================================
   Resize (✅ 하나로 통합 / 디바운스)
========================================================= */
let resizeTimer;
let lastW = window.innerWidth;

function handleResize() {
  // devtools/모바일 주소창 등으로 height만 흔들릴 때는 무시(렉 방지)
  const w = window.innerWidth;
  if (w === lastW) return;
  lastW = w;

  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    requestAnimationFrame(async () => {
      dividerMarquee();
      await waitProjectAssets();
      setupProjectPinAccordion();
      ScrollTrigger.refresh(true);
    });
  }, 200);
}

window.addEventListener("resize", handleResize, { passive: true });

/* =========================================================
   Hero Circle Text
========================================================= */
function setupCircleTextRotation() {
  const circleBox = document.querySelector(".circle-box");
  const circleText = circleBox?.querySelector(".circle-text");
  const circleCenter = circleBox?.querySelector(".circle-center");

  if (!circleBox || !circleText || !circleCenter || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let isSpeedLocked = false;

  const rotationTween = gsap.to(circleText, {
    rotation: 360,
    duration: 10,
    ease: "none",
    repeat: -1,
    transformOrigin: "50% 50%",
  });

  const changeSpeed = (timeScale) => {
    gsap.to(rotationTween, {
      timeScale,
      duration: 0.9,
      ease: "power2.out",
      overwrite: true,
    });
  };

  circleCenter.addEventListener("mouseenter", () => {
    if (!isSpeedLocked) changeSpeed(0.4);
  });

  circleCenter.addEventListener("mouseleave", () => {
    if (!isSpeedLocked) changeSpeed(1);
  });

  circleCenter.addEventListener("click", () => {
    isSpeedLocked = !isSpeedLocked;
    circleBox.classList.toggle("is-speed-locked", isSpeedLocked);
    circleCenter.setAttribute("aria-pressed", String(isSpeedLocked));
    circleCenter.setAttribute("aria-label", isSpeedLocked ? "원형 텍스트 기본 속도로 전환" : "원형 텍스트 느린 속도로 고정");
    circleCenter.textContent = isSpeedLocked ? "slow" : "click";
    changeSpeed(isSpeedLocked ? 0.4 : 1);
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

    tl.fromTo(
      item.querySelector(".front-project-visual"),
      { y: 12 * rem, rotation: -2.5, opacity: 0 },
      { y: 0, rotation: 0, opacity: 1, ease: "power2.out" },
    ).fromTo(item.querySelector(".front-project-info"), { x: 100, opacity: 0 }, { x: 0, opacity: 1, ease: "power2.out" }, "<0.15");
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
    window.addEventListener("scroll", restoreParentScroll, { passive: true });
  });
}

/* =========================================================
   Init
========================================================= */
startLoadingLock();

window.addEventListener("load", async () => {
  copyDividerTextOnce();
  dividerMarquee();
  setupSectionTitleAnimation();
  setupMobileMenu();
  setupCircleTextRotation();
  setupFrontendPreviewScrollIsolation();

  await waitProjectAssets();
  setupProjectPinAccordion();
  setupFrontendProjectAnimation();

  requestAnimationFrame(() => ScrollTrigger.refresh(true));

  endLoading();
});
