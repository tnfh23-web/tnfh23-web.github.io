/* The type intro and real content readiness meet before the panels open. */
function setupTypographyLoader({ reducedMotion }) {
  const loading = document.querySelector(".loading");
  const word = loading?.querySelector(".loading-word");
  let intro = null;
  let opening = null;
  let resolveIntro;
  let revealed = false;
  let finishNow = () => {};
  const introReady = new Promise((resolve) => { resolveIntro = resolve; });
  const onPreference = () => {
    if (!reducedMotion.matches) return;
    intro?.progress(1).kill();
    resolveIntro();
    if (revealed) finishNow();
  };
  reducedMotion.addEventListener("change", onPreference);

  Promise.resolve(document.fonts?.ready).catch(() => {}).then(() => {
    if (!loading || !word) { resolveIntro(); return; }
    loading.dataset.phase = "type";
    gsap.set(word, { visibility: "visible" });
    if (reducedMotion.matches) { resolveIntro(); return; }
    const split = window.SplitText ? SplitText.create(word, { type: "chars", mask: "chars", charsClass: "loading-char", aria: "none" }) : null;
    const chars = split?.chars || [word];
    intro = gsap.timeline({ onComplete: () => { loading.dataset.phase = "ready"; resolveIntro(); } })
      .fromTo(chars, { yPercent: (i) => i % 2 ? -115 : 115, xPercent: (i) => i % 2 ? 15 : -15, rotationX: (i) => i % 2 ? 50 : -50, scale: 0.8, opacity: 0 },
        { yPercent: 0, xPercent: 0, rotationX: 0, scale: 1, opacity: 1, duration: 0.62, stagger: 0.035, ease: "power3.out" })
      .to({}, { duration: 0.16 });
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
        loading?.remove();
        reducedMotion.removeEventListener("change", onPreference);
        onComplete();
        gsap.set(document.documentElement, { clearProps: "backgroundColor" });
      };
      const startHero = () => {
        if (heroStarted) return;
        heroStarted = true;
        if (typeof playHero === "function") playHero(() => { heroDone = true; finish(); });
        else { heroDone = true; finish(); }
      };
      finishNow = () => {
        opening?.kill();
        intro?.kill();
        panelsDone = true;
        loading?.remove();
        startHero();
        // The hero's reduced-motion handler also finishes any in-progress slices.
        if (reducedMotion.matches) heroDone = true;
        finish();
      };
      if (!loading || reducedMotion.matches) { finishNow(); return; }
      loading.dataset.phase = "opening";
      opening = gsap.timeline({ onComplete: () => { panelsDone = true; loading.remove(); finish(); } })
        .to(document.documentElement, { backgroundColor: "#ffffff", duration: 0.82, ease: "power3.inOut" }, 0.08)
        .to(word, { yPercent: -12, opacity: 0, duration: 0.2, ease: "power2.in" }, 0)
        .to(loading.querySelector(".loading-panel-top"), { yPercent: -100, duration: 0.82, ease: "power3.inOut" }, 0.08)
        .to(loading.querySelector(".loading-panel-bottom"), { yPercent: 100, duration: 0.82, ease: "power3.inOut" }, 0.08)
        .call(startHero, null, 0.2);
    },
  };
}
