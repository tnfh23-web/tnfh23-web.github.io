// 스크롤 트리거 플러그인 활성화
gsap.registerPlugin(ScrollTrigger);

// 로딩화면

let _lockScrollY = 0;

function lockScroll() {
  _lockScrollY = window.scrollY || 0;

  // ✅ html/body 둘 다 잠금
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  // ✅ 더 확실한 방식(페이지 자체를 고정)
  document.body.style.position = "fixed";
  document.body.style.top = `-${_lockScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockScroll() {
  // 고정 해제
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";

  // 원래 스크롤 위치 복구
  window.scrollTo(0, _lockScrollY);
}

function showLoadingBox() {
  const loadingBox = document.querySelector(".loading-box");
  if (!loadingBox) return;

  lockScroll();
  loadingBox.classList.remove("is-hide"); // 보이기
}

function hideLoadingBox() {
  const loadingBox = document.querySelector(".loading-box");
  if (!loadingBox) return;

  loadingBox.classList.add("is-hide"); // 숨기기

  setTimeout(() => {
    unlockScroll();
    loadingBox.remove();
  }, 650);
}

// 타이핑
function TypingEffect1__init() {
  $(".loading-text").each(function (index, el) {
    const $el = $(el);

    const text = $el.attr("data-text");
    const inter = parseInt($el.attr("data-inter"));
    $el.find("> div").empty();

    const textBits = text.split("");

    $el.data("typing-effect-1__index", 0);
    $el.data("typing-effect-1__inter", inter);
    $el.data("typing-effect-1__$div", $el.find("> div"));

    TypingEffect1__start($el, textBits);
  });
}

function TypingEffect1__start($el, textBits) {
  const index = $el.data("typing-effect-1__index");
  const inter = $el.data("typing-effect-1__inter");
  const $div = $el.data("typing-effect-1__$div");

  setTimeout(function () {
    $div.append(textBits[index]);

    if (index + 1 === textBits.length) {
      setTimeout(hideLoadingBox, 300);
      return;
    }

    $el.data("typing-effect-1__index", index + 1);
    TypingEffect1__start($el, textBits);
  }, inter);
}

// ✅ 실행 순서 중요: 로딩 보이기 → 타이핑 시작
showLoadingBox();
TypingEffect1__init();

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
      if (diff > 0)
        header.classList.add("is-hide"); // 아래로 -> 숨김
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
  const itemList = document.querySelectorAll("#sec-project .project-list-item");
  const items = gsap.utils.toArray("#sec-project .project-list-item");
  if (!section || !items.length) return;

  const firstTitle = items[0].querySelector(".item-title");
  if (!firstTitle) return;

  const bodies = items.map((li) => li.querySelector(".item-body")).filter(Boolean);

  const getHeight = () => {
    let totalHeight = 0;
    itemList.forEach((el) => {
      totalHeight += el.offsetHeight;
    });
    return totalHeight;
  };

  ScrollTrigger.getAll().forEach((st) => {
    const id = st.vars && st.vars.id;
    if (id && id.startsWith("proj-")) st.kill();
  });
  gsap.killTweensOf(bodies);

  bodies.forEach((body) => {
    body.style.overflow = "hidden";
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      id: "proj-pin",
      trigger: firstTitle,
      start: "top top",
      endTrigger: section,
      end: () => `+=${getHeight()} bottom`,
      pin: section,
      scrub: 1,
      invalidateOnRefresh: true,
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

// 스플릿
function splitChars(el) {
  // 중복 방지
  if (el.dataset.splitted === "1") return;

  const text = el.textContent;
  el.textContent = "";

  [...text].forEach((ch) => {
    const span = document.createElement("span");
    span.className = "char";
    // 공백 유지
    span.textContent = ch === " " ? "\u00A0" : ch;
    el.appendChild(span);
  });

  el.dataset.splitted = "1";
}

/* ---------------------------------------
  2) Split + ScrollTrigger 애니메이션 세팅
--------------------------------------- */
function setupSplitTitleScroll() {
  const targets = document.querySelectorAll(".title-box h2");
  if (!targets.length) return;

  targets.forEach((h2) => {
    // 1) 글자 쪼개기
    splitChars(h2);

    const chars = h2.querySelectorAll(".char");
    if (!chars.length) return;

    // 2) 이전 트리거 제거
    ScrollTrigger.getById(`split-${h2.textContent}`)?.kill();

    // 3) 스크롤 들어올 때 위에서 떨어지는 애니메이션
    gsap.from(chars, {
      y: -40,
      opacity: 0,
      stagger: 0.08,
      duration: 0.6,
      ease: "power3.out",
      scrollTrigger: {
        id: `split-${h2.textContent}`,
        trigger: h2,
        start: "top 80%",
        toggleActions: "play none none none", // 한번만
      },
    });
  });

  ScrollTrigger.refresh();
}

window.addEventListener("load", () => {
  setupSplitTitleScroll();
});

let splitTimer;
window.addEventListener("resize", () => {
  clearTimeout(splitTimer);
  splitTimer = setTimeout(() => {
    setupSplitTitleScroll();
  }, 150);
});
//스플릿 끝
dividerMarquee();
window.addEventListener("resize", dividerMarquee);
