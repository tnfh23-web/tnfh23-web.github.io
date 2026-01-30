/* =========================================================
   GSAP / ScrollTrigger
========================================================= */
gsap.registerPlugin(ScrollTrigger);

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
   Anchor Click (Header 메뉴 클릭 시 Lenis로 이동)
========================================================= */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
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
AOS.init({ once: true });

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
  const itemList = document.querySelectorAll("#sec-project .project-list-item");
  const items = gsap.utils.toArray("#sec-project .project-list-item");
  if (!section || !items.length) return;

  const getHeight = () => {
    let totalHeight = 0;
    itemList.forEach((el) => (totalHeight += el.offsetHeight));
    return totalHeight;
  };

  // 이전 트리거/트윈 정리
  ScrollTrigger.getById("proj-pin")?.kill();
  gsap.killTweensOf(items);

  // ✅ li 자체를 접을거라 overflow hidden
  items.forEach((li) => {
    li.style.overflow = "hidden";
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      id: "proj-pin",
      trigger: section, // ✅ section 기준으로
      start: "top top",
      end: () => `+=${getHeight()}`,
      pin: section,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // progress(0~1)를 items 인덱스로 변환
        const idx = Math.min(items.length - 1, Math.floor(self.progress * items.length));

        items.forEach((li, i) => {
          li.classList.toggle("is-active", i === idx);
        });
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

/* =========================================================
   Init / Resize
========================================================= */
window.addEventListener("load", () => {
  dividerMarquee();
  setupProjectPinAccordion();
  ScrollTrigger.refresh();
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
