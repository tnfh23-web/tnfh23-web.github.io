/* One scroll clock owns card folds, image masks and copy; hover owns only the inner img. */
function setupProjectDeck({ reducedMotion }) {
  const section = document.querySelector("#sec-project");
  const list = section?.querySelector(".project-list");
  const cards = Array.from(list?.children || []);
  if (!section || !list || !cards.length) return { destroy() {} };
  const timelines = [];
  const scenes = cards.map((card) => ({
    card, mask: card.querySelector(".left-box"), image: card.querySelector(".left-box a"),
    copy: Array.from(card.querySelectorAll(".item-title, .right-box .text-box > span, .right-box .text-box > h2, .right-box .text-box > p, .right-box .button-box")),
    inert: card.inert,
  }));
  let active = -1;
  const activate = (index) => {
    if (active === index) return;
    active = index;
    section.dataset.activeProject = String(index + 1);
    cards.forEach((card, i) => {
      card.classList.toggle("is-interactive", i === index);
      card.inert = i !== index;
      if (i === index) card.setAttribute("aria-current", "true");
      else card.removeAttribute("aria-current");
    });
  };
  const reveal = (timeline, scene, at, duration = 0.3) => {
    timeline.fromTo(scene.mask, { clipPath: "inset(14% 10% 100% 10%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration, ease: "power2.inOut", immediateRender: false }, at)
      .fromTo(scene.image, { scale: 1.08 }, { scale: 1, duration: duration + 0.08, ease: "power2.out", immediateRender: false }, at)
      .fromTo(scene.copy, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: duration * 0.65, stagger: duration * 0.12, ease: "power2.out", immediateRender: false }, at + duration * 0.25);
  };
  const prepare = (scene) => {
    gsap.set(scene.mask, { clipPath: "inset(14% 10% 100% 10%)" });
    gsap.set(scene.image, { scale: 1.08 });
    gsap.set(scene.copy, { y: 16, opacity: 0 });
  };

  // Measure natural card sizes first, then stack. Small screens keep every link in flow.
  const cardHeight = Math.ceil(Math.max(...cards.map((card) => card.getBoundingClientRect().height)));
  const padding = getComputedStyle(section);
  const heading = section.querySelector(".sec-project-grid > .title-box").getBoundingClientRect().height;
  const fits = cardHeight + heading + parseFloat(padding.paddingTop) <= window.innerHeight + 1;
  const deck = window.innerWidth > 768 && !reducedMotion.matches && fits;
  section.classList.add(deck ? "is-project-deck" : "is-project-flow");
  section.dataset.projectMode = deck ? "deck" : "flow";
  let flowCardIndex = null;
  const flowViewport = { width: innerWidth, height: innerHeight };
  const rememberFlowCard = () => {
    // A resize event arrives after CSS reflow. Keep the last card seen at the old size.
    if (innerWidth !== flowViewport.width) return;
    if (innerHeight !== flowViewport.height) {
      if (innerWidth > 768 || Math.abs(innerHeight - flowViewport.height) >= 100) return;
      flowViewport.height = innerHeight;
    }
    let mostVisible = 0;
    flowCardIndex = null;
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const visible = Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
      if (visible > mostVisible) { mostVisible = visible; flowCardIndex = index; }
    });
  };

  if (deck) {
    list.style.height = `${cardHeight}px`;
    scenes.forEach((scene, index) => {
      gsap.set(scene.card, { autoAlpha: index ? 0 : 1, yPercent: index ? 110 : 0, rotationX: 0, scale: 1, z: 0, zIndex: index + 1, "--project-shade": 0 });
      prepare(scene);
    });
    activate(0);
    const first = gsap.timeline({ scrollTrigger: { id: "project-entry", trigger: section, start: "top 65%", end: "top top", scrub: 0.25, invalidateOnRefresh: true } });
    reveal(first, scenes[0], 0, 0.7);
    timelines.push(first);

    const hold = 0.5;
    const transition = 0.4;
    const segment = hold + transition;
    const master = gsap.timeline({
      onUpdate() {
        const elapsed = Math.max(0, this.time() - hold);
        const index = this.time() < hold ? 0 : Math.floor(elapsed / segment) + (elapsed % segment >= transition * 0.7 ? 1 : 0);
        activate(Math.min(cards.length - 1, index));
      },
      scrollTrigger: {
        id: "proj-pin", trigger: section, start: "top top", pin: section, scrub: 0.4,
        end: () => `+=${Math.round(Math.min(window.innerHeight * 0.9, 760) * (cards.length * hold + (cards.length - 1) * transition))}`,
        refreshPriority: 1, invalidateOnRefresh: true,
      },
    });
    for (let index = 1; index < cards.length; index++) {
      const start = hold + (index - 1) * segment;
      master.to(cards[index - 1], { rotationX: 42, scale: 0.88, z: -180, yPercent: -12, "--project-shade": 0.3, duration: transition, ease: "none" }, start)
        .fromTo(cards[index], { autoAlpha: 1, yPercent: 110, rotationX: -10, scale: 0.96, z: -120 }, { autoAlpha: 1, yPercent: 0, rotationX: 0, scale: 1, z: 0, duration: transition, ease: "power1.inOut", immediateRender: false }, start)
        .set(cards[index - 1], { autoAlpha: 0 }, start + transition);
      reveal(master, scenes[index], start + 0.1, 0.26);
    }
    master.to({}, { duration: hold }, hold + (cards.length - 1) * segment - hold);
    timelines.push(master);
  } else {
    section.dataset.activeProject = "all";
    rememberFlowCard();
    window.addEventListener("scroll", rememberFlowCard, { passive: true });
    if (!reducedMotion.matches) scenes.forEach((scene, index) => {
      prepare(scene);
      const timeline = gsap.timeline({ scrollTrigger: { id: `project-flow-${index}`, trigger: scene.card, start: "top 90%", end: "top 25%", scrub: 0.25, invalidateOnRefresh: true } });
      reveal(timeline, scene, 0, 0.8);
      timelines.push(timeline);
    });
  }
  return {
    flowCardIndex() { return flowCardIndex; },
    progressForCard(index) { return (Math.max(0, Math.min(cards.length - 1, index)) * 0.9 + 0.25) / (cards.length * 0.5 + (cards.length - 1) * 0.4); },
    destroy() {
      window.removeEventListener("scroll", rememberFlowCard);
      timelines.forEach((timeline) => { timeline.scrollTrigger?.kill(true); timeline.kill(); });
      list.style.removeProperty("height");
      section.classList.remove("is-project-deck", "is-project-flow");
      scenes.forEach((scene) => {
        scene.card.inert = scene.inert;
        scene.card.classList.remove("is-interactive");
        scene.card.removeAttribute("aria-current");
        gsap.set(scene.card, { clearProps: "transform,opacity,visibility,zIndex,--project-shade" });
        gsap.set(scene.mask, { clearProps: "clipPath" });
        gsap.set(scene.image, { clearProps: "transform" });
        gsap.set(scene.copy, { clearProps: "transform,opacity" });
      });
      delete section.dataset.projectMode;
      delete section.dataset.activeProject;
    },
  };
}
