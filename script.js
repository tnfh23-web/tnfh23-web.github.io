/* =========================================================
   GSAP / ScrollTrigger
========================================================= */
gsap.registerPlugin(ScrollTrigger);

// 스플릿 텍스트
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

  // Lenis 쓰는 경우도 휠 입력 막아두는 게 안정적
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
   로딩
========================================================= */
function endLoading() {
  const loading = document.querySelector(".loading");
  if (!loading) {
    endLoadingUnlock();
    initAOSAfterLoading();
    return;
  }

  loading.classList.add("is-out");

  // 2) split 끝난 뒤 배경 페이드 + AOS 미리 시작
  setTimeout(() => {
    loading.classList.add("is-fade");

    //  로딩이 아직 덮고 있을 때 AOS 시작 (빈 화면 방지)
    initAOSAfterLoading();
  }, 1200);

  // 3) 완전 제거 + 스크롤 해제
  setTimeout(() => {
    loading.remove();
    endLoadingUnlock();

    requestAnimationFrame(() => {
      ScrollTrigger.refresh(true);
      // AOS는 이미 init 했으니 refresh만 한번 더
      if (window.AOS) AOS.refreshHard();
    });
  }, 1800);
}

/* =========================================================
   header
========================================================= */
function setupAutoHideHeader() {
  const header = document.querySelector(".top-bar");
  if (!header) return;

  let lastY = 0;
  const delta = 8;
  const headerH = header.offsetHeight || 0;

  function update(y) {
    if (y <= 0) {
      header.classList.remove("is-hide");
      lastY = y;
      return;
    }

    const diff = y - lastY;
    if (Math.abs(diff) < delta) return;

    if (diff > 0 && y > headerH) header.classList.add("is-hide");
    if (diff < 0) header.classList.remove("is-hide");

    lastY = y;
  }

  // Lenis 사용 시
  if (window.Lenis && lenis) {
    lenis.on("scroll", ({ scroll }) => update(scroll));
  } else {
    window.addEventListener("scroll", () => update(window.scrollY || 0), { passive: true });
  }
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

    const headerH = document.querySelector(".top-bar")?.offsetHeight || 0;

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
   AOS
========================================================= */
function initAOSAfterLoading() {
  if (!window.AOS) return;

  // 혹시 기존 init돼있으면 리프레시
  AOS.init({
    once: true,
    // 로딩 끝난 뒤 첫 화면에서 바로 트리거되게 하고 싶으면 0~200 조절
    offset: 0,
    duration: 0,
  });

  // 레이아웃 완전히 잡힌 다음 트리거 재계산
  AOS.refreshHard();
}

/* =========================================================
   Divider (복사 + ScrollTrigger Marquee)
========================================================= */
document.querySelectorAll(".text-gsap-box-top,.text-gsap-box-bottom").forEach((track) => {
  const copy = 3;
  const original = track.innerHTML;

  for (let i = 0; i < copy; i++) {
    track.innerHTML += original;
  }
});

let topTween, bottomTween;

function dividerMarquee() {
  const top = document.querySelector(".text-gsap-box-top");
  const bottom = document.querySelector(".text-gsap-box-bottom");
  if (!top || !bottom) return;

  topTween?.kill();
  bottomTween?.kill();

  const distTop = top.scrollWidth - window.innerWidth;
  const distBottom = bottom.scrollWidth - window.innerWidth;

  topTween = gsap.to(top, {
    x: -distTop,
    ease: "none",
    scrollTrigger: {
      trigger: ".divider",
      scrub: true,
      invalidateOnRefresh: true,
      end: `+=${distTop}`,
    },
  });

  bottomTween = gsap.fromTo(
    bottom,
    { x: -distBottom },
    {
      x: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".divider",
        scrub: true,
        invalidateOnRefresh: true,
        end: `+=${distBottom}`,
      },
    },
  );
}

/* =========================================================
   Section 3 - Project Pin Accordion
========================================================= */
function setupProjectPinAccordion() {
  const section = document.querySelector("#sec-project");
  const list = document.querySelector("#sec-project .project-list");
  const itemList = document.querySelectorAll("#sec-project .project-list-item");
  const items = gsap.utils.toArray("#sec-project .project-list-item");
  if (!section || !items.length) return;

  const getHeight = () => {
    let totalHeight = 0;
    itemList.forEach((el) => (totalHeight += el.offsetHeight));
    return totalHeight;
  };

  ScrollTrigger.getById("proj-pin")?.kill();
  gsap.killTweensOf(items);

  items.forEach((li) => {
    li.style.overflow = "hidden";
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      id: "proj-pin",
      trigger: list,
      start: "top top",
      end: () => `+=${getHeight()}`,
      pin: section,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const idx = Math.min(items.length - 1, Math.floor(self.progress * items.length));
        items.forEach((li, i) => li.classList.toggle("is-active", i === idx));
      },
      onLeave: () => items.forEach((li) => li.classList.remove("is-active")),
      onLeaveBack: () => items.forEach((li) => li.classList.remove("is-active")),
    },
  });

  tl.to(
    items,
    {
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      marginBottom: 0,
      stagger: 0.5,
      ease: "none",
    },
    0,
  );
}

// // 타이틀 애니메이션

function setupSectionTitleAnimation() {
  document.querySelectorAll(".split-title").forEach((title) => {
    // 이미 split된 경우 방지
    if (title.classList.contains("is-split")) return;
    title.classList.add("is-split");

    const split = new SplitText(title, {
      type: "chars",
    });

    gsap.from(split.chars, {
      x: 150,
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
   Init / Resize
========================================================= */
startLoadingLock();

window.addEventListener("load", () => {
  setupAutoHideHeader();
  dividerMarquee();
  setupProjectPinAccordion();
  setupSectionTitleAnimation();
  ScrollTrigger.refresh();
  endLoading();
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    dividerMarquee();
    setupProjectPinAccordion();
    ScrollTrigger.refresh();
  }, 150);
});
