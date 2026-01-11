// 스크롤 트리거 플러그인 활성화
gsap.registerPlugin(ScrollTrigger);

// header 스크롤
function setupAutoHideHeader() {
  const header = document.querySelector(".top-bar");
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;
  const delta = 8; // 민감도(작을수록 바로 반응)

  function update() {
    const y = window.scrollY;
    const diff = y - lastY;

    // 맨 위쪽에서는 항상 보이게
    if (y <= 0) {
      header.classList.remove("is-hide");
      lastY = y;
      ticking = false;
      return;
    }

    if (Math.abs(diff) > delta) {
      if (diff > 0) header.classList.add("is-hide"); // 아래로 -> 숨김
      else header.classList.remove("is-hide"); // 위로 -> 보임
      lastY = y;
    }

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
}

setupAutoHideHeader();
// divider 복사
document.querySelectorAll(".text-gsap-box-top,.text-gsap-box-bottom").forEach((track) => {
  let copy = 3;

  let original = track.innerHTML;
  for (let i = 0; i < copy; i++) {
    track.innerHTML += original;
  }
});

// divider gsap

let topTween, bottomTween;

function dividerMarquee() {
  const top = document.querySelector(".text-gsap-box-top");
  const bottom = document.querySelector(".text-gsap-box-bottom");
  if (!top || !bottom) return;

  if (topTween) topTween.kill();
  if (bottomTween) bottomTween.kill();

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
    }
  );

  ScrollTrigger.refresh();
}

//섹션 3 아코디언
function setupProjectPinAccordion() {
  const section = document.querySelector("#sec-project");
  const items = gsap.utils.toArray("#sec-project .project-list-item");
  if (!section || !items.length) return;

  const firstTitle = items[0].querySelector(".item-title");
  if (!firstTitle) return;

  const bodies = items.map((li) => li.querySelector(".item-body")).filter(Boolean);

  // 기존 트리거/애니메이션 정리
  ScrollTrigger.getAll().forEach((st) => {
    const id = st.vars && st.vars.id;
    if (id && id.startsWith("proj-")) st.kill();
  });
  gsap.killTweensOf(bodies);

  // 초기 상태 세팅(접힐 수 있게)
  bodies.forEach((body) => {
    body.style.overflow = "hidden";
    // 시작은 펼쳐진 상태(기존 CSS 유지). 닫히는건 타임라인에서 처리
  });

  // 타임라인 (스크롤 내리면 순서대로 내용 접힘 -> 끝에는 타이틀만)
  const tl = gsap.timeline({
    scrollTrigger: {
      id: "proj-pin",
      trigger: firstTitle, // ✅ 첫 타이틀 기준
      start: "top top", // ✅ item-title이 top top에 걸릴 때 핀 시작
      endTrigger: section, // 섹션 끝까지 핀 유지
      end: "bottom top",
      pin: section, // 섹션 전체 핀
      scrub: 1,
      invalidateOnRefresh: true,
      // markers: true,
    },
  });

  tl.to(
    bodies,
    {
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      marginBottom: 0,
      stagger: 0.5,
      ease: "none",
    },
    0
  );
}

window.addEventListener("load", () => {
  setupProjectPinAccordion();
  ScrollTrigger.refresh();
});

let _projTimer;
window.addEventListener("resize", () => {
  clearTimeout(_projTimer);
  _projTimer = setTimeout(() => {
    setupProjectPinAccordion();
    ScrollTrigger.refresh();
  }, 150);
});
dividerMarquee();
window.addEventListener("resize", dividerMarquee);
