/* Both showcases reveal their content only after the card/scene has arrived. */
function addShowcaseEntrance(timeline, scene, at, compact) {
  timeline.fromTo(scene.chars, { yPercent: 112, rotationX: -65 }, { yPercent: 0, rotationX: 0, duration: .43, stagger: { amount: .22 }, ease: 'power3.out', immediateRender: false }, at)
    .fromTo(scene.meta, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .28, ease: 'power2.out', immediateRender: false }, at + .12)
    .fromTo(scene.description, { x: compact ? 20 : 40, opacity: 0 }, { x: 0, opacity: 1, duration: .34, ease: 'power2.out', immediateRender: false }, at + .2)
    .fromTo(scene.links, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .28, ease: 'power2.out', immediateRender: false }, at + .3)
    .fromTo(scene.visual, { autoAlpha: 0, y: 24, scale: .97 }, { autoAlpha: 1, y: 0, scale: 1, duration: .5, ease: 'power2.out', immediateRender: false }, at + .1);
}
/* Arrival is scroll-driven; content runs on its own clock after arrival. */
function createShowcaseEntrances(scenes, compact, { firstVisible = false } = {}) {
  const started = scenes.map(() => false);
  const animations = scenes.map((scene) => {
    const animation = gsap.timeline({ paused: true });
    addShowcaseEntrance(animation, scene, 0, compact);
    return animation;
  });
  if (firstVisible) { animations[0].progress(1).pause(); started[0] = true; }
  return {
    update(time, arrivalForScene) {
      animations.forEach((animation, index) => {
        if (firstVisible && index === 0) return;
        const arrival = arrivalForScene(index);
        if (time >= arrival - .001 && !started[index]) {
          started[index] = true;
          animation.play(0);
        } else if (time < arrival - .02 && started[index]) {
          started[index] = false;
          animation.pause(0);
        }
      });
    },
    destroy() { animations.forEach((animation) => animation.kill()); },
  };
}
/* Capsule and card movement follow scroll; lettering plays automatically on arrival. */
function setupProjectShowcase({ reducedMotion }) {
  const section = document.querySelector('#sec-project');
  const stage = section?.querySelector('.project-stage');
  const cards = Array.from(stage?.children || []);
  if (!cards.length) return { destroy() {}, flowCardIndex() { return null; } };
  const timelines = [];
  let entrances = null;
  const scenes = cards.map((card) => {
    const media = card.querySelector('.project-media');
    media.style.setProperty('--project-ratio', 1.96);
    return { card, media, backdrop: card.querySelector('.project-backdrop'), backdropImage: card.querySelector('.project-backdrop > img'), visual: card.querySelector('.project-visual'), image: card.querySelector('.project-media-inner'), pane: card.querySelector('.project-copy'), title: card.querySelector('.project-card-title'), meta: card.querySelector('.project-meta'), description: card.querySelector('.project-description'), links: card.querySelector('.project-links'), copy: Array.from(card.querySelector('.project-copy').children), inert: card.inert, split: null, chars: [] };
  });
  const intro = 1.15, entrance = .78, read = .68, turn = 1.15, hold = entrance + read, step = hold + turn;
  const total = intro + cards.length * hold + (cards.length - 1) * turn;
  const compact = innerWidth <= 900;
  section.classList.add('is-project-deck');
  const fits = scenes.every(({ card, pane }) => pane.scrollHeight <= pane.clientHeight + 1 && card.scrollHeight <= card.clientHeight + 1);
  const deck = !reducedMotion.matches && innerHeight >= 560 && fits;
  const sticky = !deck && !reducedMotion.matches;
  section.classList.remove('is-project-deck');
  section.classList.add(deck ? 'is-project-deck' : 'is-project-flow');
  section.dataset.projectMode = deck ? 'deck' : 'flow';
  let active = -1, secondary = null, flowIndex = null;
  const viewport = { width: innerWidth, height: innerHeight };
  const headerHeight = () => Math.max(0, ...Array.from(document.querySelectorAll('.top-bar')).map((header) => header.offsetHeight));
  const activate = (index, other = null) => {
    if (active === index && secondary === other) return;
    active = index;
    secondary = other;
    section.dataset.activeProject = String(index + 1);
    scenes.forEach(({ card }, i) => {
      card.inert = deck && i !== index && i !== other;
      card.classList.toggle('is-interactive', !deck || i === index || i === other);
      card.classList.toggle('is-covered', sticky && i < index - 1);
      if (i === index) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    });
  };
  const rememberPosition = () => {
    const rect = section.getBoundingClientRect();
    const top = headerHeight();
    document.documentElement.classList.toggle('is-project-view', rect.top <= top && rect.bottom > top);
    if (deck || innerWidth !== viewport.width) return;
    if (innerHeight !== viewport.height) {
      if (innerWidth > 768 || Math.abs(innerHeight - viewport.height) >= 100) return;
      viewport.height = innerHeight;
    }
    let mostVisible = 0;
    flowIndex = null;
    const rectangles = cards.map((card) => card.getBoundingClientRect());
    cards.forEach((card, index) => {
      const bounds = rectangles[index];
      const bottom = sticky && index < cards.length - 1 ? Math.min(bounds.bottom, rectangles[index + 1].top) : bounds.bottom;
      const pixels = Math.max(0, Math.min(innerHeight, bottom) - Math.max(0, bounds.top));
      if (pixels > mostVisible) { mostVisible = pixels; flowIndex = index; }
    });
    if (flowIndex !== null) activate(flowIndex);
  };
  if (deck) {
    scenes.forEach((scene, index) => {
      scene.split = new SplitText(scene.title, { type: 'chars', charsClass: 'project-title-char', aria: 'auto' });
      scene.chars = scene.split.chars;
      gsap.set(scene.card, { autoAlpha: index ? 0 : 1, scale: 1, y: 0, yPercent: index ? 108 : 0, zIndex: index + 1 });
      gsap.set(scene.chars, { yPercent: 112, rotationX: -65, transformOrigin: '50% 100%' });
      gsap.set([scene.meta, scene.description], { opacity: 0 });
      gsap.set(scene.links, { autoAlpha: 0 });
      gsap.set(scene.visual, { autoAlpha: 0, y: 24, scale: .97 });
    });
    const first = scenes[0];
    const firstClip = compact ? 'inset(38% 6% round 180px)' : `inset(28% 18% round ${Math.round(innerHeight * .3)}px)`;
    gsap.set(first.backdrop, { clipPath: firstClip });
    gsap.set(first.backdropImage, { scale: 1.08 });
    entrances = createShowcaseEntrances(scenes, compact);
    const master = gsap.timeline({
      onUpdate() {
        const time = this.time(), elapsed = time - intro - hold;
        entrances.update(time, (index) => intro + index * step);
        if (elapsed < 0) { activate(0); return; }
        const base = Math.min(cards.length - 1, Math.floor(elapsed / step));
        const phase = elapsed % step;
        if (base < cards.length - 1 && phase < turn) {
          const next = base + 1, dominant = phase >= turn * .6 ? next : base;
          activate(dominant, dominant === base ? next : base);
        } else activate(Math.min(cards.length - 1, base + 1));
      },
      scrollTrigger: {
        id: 'proj-pin', trigger: section, start: 'top top', pin: section, scrub: .45,
        end: () => `+=${Math.round(Math.min(innerHeight * .65, 620) * total)}`,
        refreshPriority: 1, invalidateOnRefresh: true,
      },
    });
    master.to(first.backdrop, { clipPath: 'inset(0% 0% round 24px)', duration: intro, ease: 'power2.inOut' }, 0)
      .to(first.backdropImage, { scale: 1, duration: intro, ease: 'power2.inOut' }, 0)
      .to(section.querySelector('.project-heading'), { autoAlpha: 0, y: -12, duration: .35, ease: 'power2.out' }, .15);
    for (let index = 1; index < cards.length; index++) {
      const start = intro + hold + (index - 1) * step;
      const previous = scenes[index - 1], next = scenes[index];
      master.set(next.card, { autoAlpha: 1 }, start)
        .to(previous.card, { scale: compact ? .965 : .93, y: compact ? -8 : -16, duration: turn, ease: 'none' }, start)
        .to(previous.backdrop, { '--backdrop-dim': .3, duration: turn, ease: 'none' }, start)
        .fromTo(next.card, { yPercent: 108 }, { yPercent: 0, duration: turn, ease: 'none', immediateRender: false }, start)
        .fromTo(next.backdrop, { clipPath: `inset(0% 0% round ${compact ? 64 : 120}px)` }, { clipPath: 'inset(0% 0% round 24px)', duration: turn, ease: 'power1.out', immediateRender: false }, start)
        .fromTo(next.backdropImage, { scale: 1.06 }, { scale: 1, duration: turn, ease: 'power1.out', immediateRender: false }, start)
        .to(previous.card, { autoAlpha: 0, duration: .04, ease: 'none' }, start + turn - .04);
    }
    master.to({}, { duration: hold }, intro + (cards.length - 1) * step);
    timelines.push(master);
  } else if (sticky) {
    cards.forEach((card) => card.style.setProperty('--project-sticky-top', `min(${headerHeight() + 12}px, calc(100svh - ${card.offsetHeight}px - 24px))`));
    section.classList.add('is-project-sticky');
  }
  activate(0);
  rememberPosition();
  window.addEventListener('scroll', rememberPosition, { passive: true });
  return {
    progressForCard(index) { return (intro + Math.max(0, Math.min(cards.length - 1, index)) * step + entrance + read * 0.5) / total; },
    flowCardIndex() { return flowIndex; },
    flowTopForCard(index) {
      if (!sticky) return null;
      let offset = 0;
      for (let i = 0; i < index; i++) offset += cards[i].offsetHeight + parseFloat(getComputedStyle(cards[i]).marginBottom);
      return scrollY + stage.getBoundingClientRect().top + offset;
    },
    destroy() {
      window.removeEventListener('scroll', rememberPosition);
      timelines.forEach((timeline) => { timeline.scrollTrigger?.kill(true); timeline.kill(); });
      entrances?.destroy();
      section.classList.remove('is-project-deck', 'is-project-flow', 'is-project-sticky');
      document.documentElement.classList.remove('is-project-view');
      gsap.set(section.querySelector('.project-heading'), { clearProps: 'transform,opacity,visibility' });
      scenes.forEach((scene) => {
        scene.card.inert = scene.inert;
        scene.card.classList.remove('is-interactive', 'is-covered');
        scene.card.removeAttribute('aria-current');
        scene.card.style.removeProperty('--project-sticky-top');
        scene.media.style.removeProperty('--project-ratio');
        scene.split?.revert();
        gsap.set([scene.card, scene.visual, scene.image, scene.pane, scene.meta, scene.description, scene.links], { clearProps: 'transform,opacity,visibility,zIndex' });
        gsap.set(scene.backdrop, { clearProps: 'clipPath,--backdrop-dim' });
        gsap.set(scene.backdropImage, { clearProps: 'transform' });
      });
      delete section.dataset.projectMode;
      delete section.dataset.activeProject;
    },
  };
}
