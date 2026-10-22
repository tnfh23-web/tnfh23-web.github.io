/* Name -> initials -> monogram -> seam -> split panels; assets gate the final unveil. */
function setupTypographyLoader({ reducedMotion }) {
  const loading = document.querySelector(".loading");
  const stage = loading?.querySelector(".loading-stage");
  const word = stage?.querySelector(".loading-word");
  const mark = stage?.querySelector(".loading-mark");
  const hero = document.querySelector("#sec-hero");
  const skip = loading?.querySelector(".loading-skip");
  const background = loading ? Array.from(document.body.children)
    .filter((node) => node !== loading && !["SCRIPT", "STYLE", "LINK"].includes(node.tagName))
    .map((node) => ({ node, inert: node.inert })) : [];
  background.forEach(({ node }) => { node.inert = true; });
  let intro = null;
  let opening = null;
  let skipSettle = null;
  let resolveIntro;
  let revealed = false;
  let skipRequested = false;
  let finishNow = () => {};
  const introReady = new Promise((resolve) => { resolveIntro = resolve; });
  const requestSkip = () => {
    if (skipRequested) return;
    skipRequested = true;
    if (skip) {
      skip.disabled = true;
      skip.querySelector(".loading-skip-label").textContent = "Opening…";
    }
    if (revealed) return; // The final panel exit is already running.
    if (!intro) { resolveIntro(); return; }
    // Finish the current typographic pose briefly, then use the regular panel exit.
    // This avoids both a hard cut and freezing a half-masked glyph on the panels.
    const time = intro.time();
    const settleAt = time < 1.4 ? 1.08 : time < 2.78 ? 2.6 : Math.max(time, 3.42);
    intro.pause();
    skipSettle = intro.tweenTo(settleAt, { duration: 0.2, ease: "power2.out", onComplete: () => { intro.pause(); resolveIntro(); } });
  };
  const onKeyDown = (event) => {
    if (event.key !== "Enter" || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
    event.preventDefault();
    requestSkip();
  };
  const onPreference = () => {
    if (!reducedMotion.matches) return;
    skipSettle?.kill();
    intro?.pause();
    resolveIntro();
    if (revealed) finishNow();
  };
  skip?.addEventListener("click", requestSkip);
  document.addEventListener("keydown", onKeyDown, true);
  reducedMotion.addEventListener("change", onPreference);

  Promise.resolve(document.fonts?.ready).catch(() => {}).then(() => {
    if (!loading || !word) { resolveIntro(); return; }
    if (skipRequested || reducedMotion.matches) { resolveIntro(); return; }
    const split = window.SplitText ? SplitText.create(word, { type: "chars", mask: "chars", charsClass: "loading-char", aria: "none" }) : null;
    split?.masks.forEach(mask => {
      mask.style.padding = '.18em .13em';
      mask.style.margin = '-.18em -.13em';
    });
    const chars = split?.chars || [word];
    const initial = split?.masks[0] || chars[0];
    const rest = chars.slice(1);
    const notes = Array.from(loading.querySelectorAll(".loading-note span"));
    const glyph = mark.querySelector(".loading-mark-glyph");
    const fontSize = parseFloat(getComputedStyle(word).fontSize);
    const wordWidth = word.getBoundingClientRect().width;
    const initialWidth = initial.getBoundingClientRect().width;
    const markWidth = mark.getBoundingClientRect().width;
    // Percentages stay aligned if the viewport/font size changes during the intro.
    const initialX = (em) => ((wordWidth / 2 - fontSize * em) / initialWidth) * 100;
    const markX = (em) => -50 + (fontSize * em / markWidth) * 100;
    gsap.set(stage, { visibility: "visible" });
    gsap.set(mark, { xPercent: markX(0.95), yPercent: -50 });
    gsap.set(glyph, { yPercent: -115 });
    gsap.set(notes, { visibility: "visible", yPercent: 115, rotationX: -85 });
    gsap.set(initial, { transformOrigin: "0% 0%" });
    loading.dataset.phase = "name";
    intro = gsap.timeline({ onComplete: () => { loading.dataset.phase = "ready"; resolveIntro(); } })
      .fromTo(chars, { yPercent: -115, rotationX: -12 }, { yPercent: 0, rotationX: 0, duration: 0.7, stagger: 0.04, ease: "power3.out" }, 0.06)
      .to(notes, { yPercent: 0, rotationX: 0, duration: 0.55, stagger: 0.14, ease: "back.out(1.1)" }, 0.12)
      .call(() => { loading.dataset.phase = "initials"; }, null, 1.4)
      .to(rest, { yPercent: 115, duration: 0.45, stagger: 0.026, ease: "power3.in" }, 1.4)
      .to(glyph, { yPercent: 0, duration: 0.55, ease: "power3.out" }, 1.65)
      .to(initial, { xPercent: initialX(0.68), duration: 0.6, ease: "power3.inOut" }, 1.95)
      .to(mark, { xPercent: markX(0.36), duration: 0.6, ease: "power3.inOut" }, 1.95)
      .call(() => { loading.dataset.phase = "lockup"; }, null, 2.78)
      .to(initial, { xPercent: initialX(1), yPercent: -40, scale: 0.6, duration: 0.62, ease: "power3.inOut" }, 2.78)
      .to(mark, { xPercent: markX(0.2), scale: 2.45, duration: 0.62, ease: "power3.inOut" }, 2.78)
      .to(notes, { yPercent: -115, rotationX: 85, duration: 0.34, stagger: 0.05, ease: "power2.in" }, 3.05)
      .call(() => { loading.dataset.phase = "seam"; }, null, 3.48)
      .to(loading.querySelector(".loading-seam"), { scaleX: 1, duration: 0.4, ease: "power3.inOut" }, 3.48)
      .to({}, { duration: 0.1 }, 3.88);
  });

  return {
    async reveal(playHero, onComplete) {
      await introReady;
      if (revealed) return;
      revealed = true;
      let heroStarted = false;
      let heroDone = false;
      let panelsDone = false;
      let finished = false;
      const finish = () => {
        if (finished || !heroDone || !panelsDone) return;
        finished = true;
        skipSettle?.kill();
        intro?.kill();
        loading?.remove();
        reducedMotion.removeEventListener("change", onPreference);
        skip?.removeEventListener("click", requestSkip);
        document.removeEventListener("keydown", onKeyDown, true);
        background.forEach(({ node, inert }) => { node.inert = inert; });
        gsap.set(hero, { clearProps: "clipPath" });
        onComplete();
        gsap.set(document.documentElement, { clearProps: "backgroundColor" });
      };
      const startHero = (immediate = false) => {
        if (heroStarted && !immediate) return;
        heroStarted = true;
        if (typeof playHero === "function") playHero(() => { heroDone = true; finish(); }, { immediate });
        else { heroDone = true; finish(); }
      };
      finishNow = () => {
        opening?.kill();
        intro?.kill();
        panelsDone = true;
        loading?.remove();
        gsap.set(hero, { clearProps: "clipPath" });
        startHero(true);
        finish();
      };
      if (!loading || reducedMotion.matches) { finishNow(); return; }

      const top = loading.querySelector(".loading-panel-top");
      const bottom = loading.querySelector(".loading-panel-bottom");
      // Both halves carry the same settled typography, so its ink splits at the seam.
      // Clone only after the typography settles; no duplicate animation clock is needed.
      bottom.append(stage.cloneNode(true));
      top.append(stage);
      loading.dataset.skipped = String(skipRequested);
      loading.dataset.phase = "opening";
      gsap.set(hero, { clipPath: "inset(50% 0%)" });
      opening = gsap.timeline({ onComplete: () => { panelsDone = true; loading.remove(); finish(); } })
        .to(document.documentElement, { backgroundColor: "#ffffff", duration: 1.05, ease: "power3.inOut" }, 0.03)
        .set(loading.querySelector(".loading-seam"), { visibility: "hidden" }, 0.03)
        .to(loading.querySelectorAll(".loading-note span, .loading-skip"), { autoAlpha: 0, duration: 0.22 }, 0.06)
        .to(top, { yPercent: -50.1, duration: 1.05, ease: "power3.inOut" }, 0.03)
        .to(bottom, { yPercent: 50.1, duration: 1.05, ease: "power3.inOut" }, 0.03)
        .to(hero, { clipPath: "inset(0% 0%)", duration: 1.12, ease: "power3.inOut", clearProps: "clipPath" }, 0.03)
        .call(startHero, null, 0.3);
    },
  };
}
