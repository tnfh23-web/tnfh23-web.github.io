/* Entrances own inner glyphs; physics and scroll own the outer scene. */
// Keep the requested 1.3x entrance timing; the site slow switch stays independent.
const entranceDurationScale = 0.65;
function setupPageReveals({ reducedMotion }) {
  const hero = document.querySelector("#sec-hero");
  const titles = Array.from(document.querySelectorAll(".split-title"));
  const splits = new Map();
  let heroIntro = null;
  let heroPlayed = false;
  let finishHero = () => {};

  // Words/chars preserve fluid type and the authored FRONT line break.
  if (window.SplitText) {
    gsap.registerPlugin(SplitText);
    titles.forEach((title) => {
      const split = SplitText.create(title, {
        type: "words,chars",
        mask: "chars",
        tag: "span",
        wordsClass: "motion-word",
        charsClass: "motion-char",
        aria: "auto",
      });
      title.setAttribute("aria-label", title.textContent.trim().replace(/\s+/g, " "));
      splits.set(title, split);
    });
  }
  const completeTitle = (title) => {
    const split = splits.get(title);
    gsap.set(split?.chars || title, { clearProps: "transform,opacity" });
    split?.masks.forEach((mask) => {
      mask.style.overflow = "visible";
    });
    title.dataset.revealComplete = "true";
  };
  const titleMotion = (title, timeline, position = 0) => {
    const chars = splits.get(title)?.chars || [title];
    const sectionId = title.closest("#sec-contact") ? "sec-contact" : title.closest("section")?.id;
    const variants = {
      "sec-about": { xPercent: (i) => (i % 2 ? 24 : -24), yPercent: (i) => (i % 2 ? -110 : 110), rotation: (i) => (i % 2 ? 14 : -14), scale: 0.76 },
      "sec-project": { xPercent: (i) => (i % 2 ? 65 : -65), yPercent: 20, rotationY: -78, rotation: -7, scale: 0.78, transformPerspective: 500 },
      "sec-frontend": { xPercent: (i, el) => (el.closest(".motion-word")?.textContent.trim() === "FRONT" ? -65 : 65), yPercent: 65, rotation: (i) => (i % 2 ? 18 : -18), scale: 0.7 },
      "sec-vibe": { xPercent: (i) => (i % 2 ? 35 : -35), yPercent: (i) => (i % 2 ? -85 : 85), rotationX: -80, rotation: (i) => (i % 2 ? 8 : -8), scale: 0.64, transformPerspective: 500 },
      "sec-contact": { xPercent: (i) => (i < chars.length / 2 ? -45 : 45), yPercent: (i) => (i % 2 ? 75 : -75), rotation: (i) => (i % 2 ? -12 : 12), scaleX: 0.55, scaleY: 0.8 },
    };
    title.dataset.motionVariant = sectionId || "title";
    timeline.fromTo(
      chars,
      { ...variants[sectionId], opacity: 0 },
      {
        xPercent: 0,
        yPercent: 0,
        rotation: 0,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        duration: sectionId === "sec-contact" ? 1.5 : 1.35,
        ease: "power2.inOut",
        stagger: { amount: 0.28, from: ["sec-vibe", "sec-contact"].includes(sectionId) ? "center" : "start" },
        onComplete: () => completeTitle(title),
      },
      position,
    );
  };

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    if (heroPlayed) return;
    const letters = Array.from(hero.querySelectorAll(".hero-letter"));
    const slices = [];
    const originalText = letters.map((letter) => letter.textContent);
    hero.dataset.entrance = "assembling";
    letters.forEach((letter, index) => {
      const ink = document.createElement("span");
      ink.className = "hero-letter-ink";
      ink.textContent = originalText[index];
      letter.replaceChildren(ink);
      for (let band = 0; band < 3; band++) {
        const slice = document.createElement("span");
        slice.className = "hero-letter-slice";
        slice.textContent = originalText[index];
        slice.setAttribute("aria-hidden", "true");
        slice.style.clipPath = `inset(${Math.max(0, (band * 100) / 3 - 0.12)}% -25% ${Math.max(0, ((2 - band) * 100) / 3 - 0.12)}% -25%)`;
        letter.append(slice);
        slices.push({ element: slice, band, index, word: letter.closest(".hero-name") ? 0 : 1 });
      }
    });
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      // Restore original text nodes, keeping physics event targets intact.
      letters.forEach((letter, index) => letter.replaceChildren(document.createTextNode(originalText[index])));
      hero.dataset.entrance = "ready";
      gsap.set(hero.querySelectorAll(".text-box > p, .circle-box"), { clearProps: "transform,opacity" });
    };
    heroIntro = gsap
      .timeline({
        paused: true,
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          cleanup();
          finishHero();
        },
      })
      .timeScale(1 / entranceDurationScale);
    slices.forEach(({ element, band, index, word }) => {
      const direction = (index + band) % 2 ? 1 : -1;
      const localIndex = word ? index - 8 : index;
      heroIntro.fromTo(
        element,
        {
          x: `${direction * [0.36, -0.24, 0.3][band]}em`,
          y: `${[-0.11, 0.025, 0.12][band]}em`,
          rotation: direction * [9, -5, 7][band],
          skewX: direction * [12, -9, 7][band],
          scaleX: [0.86, 1.12, 0.92][band],
        },
        { x: 0, y: 0, rotation: 0, skewX: 0, scaleX: 1, duration: 1.42, ease: "power3.out" },
        word * 0.09 + localIndex * 0.02 + band * 0.025,
      );
    });
    heroIntro
      .fromTo(hero.querySelector(".text-box > p"), { opacity: 0 }, { opacity: 1, duration: 1.05 }, 0.7)
      .fromTo(hero.querySelector(".circle-box"), { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2 }, 0.6);
    return () => {
      heroIntro?.kill();
      cleanup();
      if (heroPlayed) finishHero();
    };
  });

  gsap.matchMedia().add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 769px)" }, (context) => {
    if (!context.conditions.motion) return;
    const triggers = [];
    let index = 0;
    const reveal = (trigger, build, targets) => {
      if (!trigger || !targets.length || targets.every((target) => target.dataset.revealComplete)) return;
      if (trigger.getBoundingClientRect().bottom < 0) {
        targets.forEach((target) => {
          target.dataset.revealComplete = "true";
        });
        return;
      }
      const tl = gsap
        .timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: { id: `page-reveal-${index++}`, trigger, start: "top 78%", once: true },
          onComplete: () =>
            targets.forEach((target) => {
              target.dataset.revealComplete = "true";
            }),
        })
        .timeScale(1 / entranceDurationScale);
      build(tl);
      if (tl.scrollTrigger) triggers.push(tl.scrollTrigger);
    };
    titles
      .filter((title) => !title.closest("#sec-contact"))
      .forEach((title) => {
        reveal(title, (tl) => titleMotion(title, tl), [title]);
      });
    return () => triggers.forEach((trigger) => trigger.kill());
  });

  setupContactScene({ reducedMotion, titleMotion, completeTitle });
  return (onComplete, { immediate = false } = {}) => {
    heroPlayed = true;
    let finished = false;
    finishHero = () => {
      if (finished) return;
      finished = true;
      onComplete();
    };
    const deepLink = location.hash && location.hash !== "#sec-hero";
    if (immediate || !heroIntro || reducedMotion.matches || deepLink || window.scrollY > hero.offsetHeight * 0.5) {
      heroIntro?.progress(1).kill();
      finishHero();
    } else heroIntro.play(0);
  };
}

/* A fixed drawer must actually be uncovered before its ordered entrance can play. */
function setupContactScene({ reducedMotion, titleMotion, completeTitle }) {
  const section = document.querySelector("#sec-contact");
  const dock = section?.querySelector(".contact-dock");
  const track = section?.querySelector(".contact-marquee-track");
  if (!section || !dock || !track) return;
  const updateLayout = () => {
    const height = Math.ceil(dock.offsetHeight);
    const fixed = !reducedMotion.matches && height <= window.innerHeight + 1;
    section.classList.toggle("is-fixed", fixed);
    section.style.height = fixed ? `${height}px` : "";
    section.dataset.contactLayout = fixed ? "reveal" : "flow";
  };
  updateLayout();
  window.addEventListener("resize", updateLayout, { passive: true });
  reducedMotion.addEventListener("change", updateLayout);
  ScrollTrigger.addEventListener("refreshInit", updateLayout);
  dock.addEventListener("focusin", () => {
    if (section.classList.contains("is-fixed") && section.getBoundingClientRect().bottom > window.innerHeight + 2) {
      section.scrollIntoView({ block: "end", behavior: "auto" });
    }
  });

  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const heading = dock.querySelector("#contact-heading");
    const eyebrow = dock.querySelectorAll(".contact-eyebrow span");
    const firstAnchor = eyebrow[0] || heading;
    const intro = dock.querySelector(".contact-con");
    const details = dock.querySelector(".title-2");
    const marquee = dock.querySelector(".contact-marquee");
    const steps = [
      { anchor: eyebrow[0], targets: [eyebrow[0]], duration: 0.65 },
      { anchor: eyebrow[1], targets: [eyebrow[1]], duration: 0.75 },
      { anchor: heading, targets: [heading], title: true },
      { anchor: intro, targets: Array.from(intro.querySelectorAll(".contact-lead, .text-box-1")), duration: 1.15, stagger: 0.2 },
      { anchor: details, targets: Array.from(dock.querySelectorAll(".title-2 .contact-title-text, .title-3")), duration: 1.05, stagger: 0.18 },
    ].filter(step => step.anchor);
    const loop = gsap.to(track, { xPercent: -50, duration: 32, repeat: -1, ease: "none", paused: true });
    const wasComplete = section.dataset.contactEntrance === "complete";
    let started = wasComplete;
    let complete = wasComplete;
    const exposed = (element) => {
      const rect = element.getBoundingClientRect();
      const coverEdge = section.classList.contains("is-fixed") ? section.getBoundingClientRect().top : 0;
      return rect.top >= coverEdge - 1 && rect.top + Math.min(60, rect.height * 0.4) < window.innerHeight - 16 && rect.bottom > 0;
    };
    const sequence = gsap
      .timeline({
        paused: true,
        onComplete: () => {
          complete = true;
          section.dataset.contactEntrance = "complete";
          pump();
        },
      })
      .timeScale(1 / entranceDurationScale);
    const pump = () => {
      const rect = section.getBoundingClientRect();
      const onscreen = rect.top < window.innerHeight && rect.bottom > 0;
      const passedFirst = !section.classList.contains("is-fixed") && firstAnchor.getBoundingClientRect().bottom <= 0;
      if (!started && onscreen && (exposed(firstAnchor) || passedFirst)) started = true;
      if (started && !complete) sequence.paused(!onscreen);
      const marqueeRect = marquee.getBoundingClientRect();
      const coverEdge = section.classList.contains("is-fixed") ? rect.top : 0;
      loop.paused(marqueeRect.bottom <= Math.max(0, coverEdge) || marqueeRect.top >= window.innerHeight);
    };
    if (!wasComplete) {
      section.dataset.contactEntrance = "waiting";
      // Ordered starts overlap every 65-78ms instead of waiting for prior tweens to end.
      const starts = [0, 0.1, 0.2, 0.32, 0.44];
      steps.forEach((step, index) => {
        const start = starts[index];
        sequence.call(
          () => {
            section.dataset.contactEntrance = String(index + 1);
          },
          null,
          start,
        );
        if (step.title) {
          titleMotion(heading, sequence, start);
        } else {
          sequence.fromTo(
            step.targets,
            { clipPath: "inset(0% 100% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: step.duration,
              stagger: step.stagger || 0,
              ease: "power2.inOut",
              clearProps: "clipPath",
            },
            start,
          );
        }
      });
    }
    // Keyboard users never wait for a decorative entrance to finish.
    const finishEntrance = () => {
      sequence.progress(1).pause();
      started = complete = true;
      completeTitle(heading);
      section.dataset.contactEntrance = "complete";
      pump();
    };
    dock.addEventListener("focusin", finishEntrance);
    const visibility = ScrollTrigger.create({
      id: "contact-entrance",
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onUpdate: pump,
      onRefresh: pump,
      onToggle: pump,
    });
    const depth = gsap
      .timeline({
        scrollTrigger: {
          id: "contact-depth",
          trigger: section,
          // Reverse the depth: copy rises into place as the compact footer is uncovered.
          start: "top bottom",
          end: "bottom bottom",
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      })
      .fromTo(dock.querySelector(".sec-contact-grid"), { y: () => (section.classList.contains("is-fixed") ? 48 : 0) }, { y: 0, ease: "none" }, 0)
      .fromTo(dock.querySelector(".contact-marquee-drift"), { x: () => (section.classList.contains("is-fixed") ? -Math.min(80, window.innerWidth * 0.08) : 0) }, { x: 0, ease: "none" }, 0);
    pump();
    return () => {
      visibility.kill();
      depth.scrollTrigger?.kill();
      loop.kill();
      sequence.kill();
      dock.removeEventListener("focusin", finishEntrance);
      gsap.set(
        steps.flatMap((step) => step.targets),
        { clearProps: "opacity,clipPath,transform" },
      );
      completeTitle(heading);
      section.dataset.contactEntrance = "complete";
    };
  });
}
