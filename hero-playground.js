/* Small, fixed-step letter simulation. Positions use hero-local pixels. */
function advanceHeroBody(body, dt, bounds) {
  body.vy += 1450 * dt;
  body.vx *= Math.exp(-0.28 * dt);
  body.x += body.vx * dt;
  body.y += body.vy * dt;
  body.angle += body.spin * dt;
  body.spin *= Math.exp(-0.8 * dt);
  const { width, height } = body;
  const radians = (body.angle * Math.PI) / 180;
  const halfWidth = (Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * height) / 2;
  const halfHeight = (Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * height) / 2;
  const left = bounds.left + halfWidth - width / 2;
  const right = bounds.right - halfWidth - width / 2;
  const top = bounds.top + halfHeight - height / 2;
  const floor = bounds.bottom - halfHeight - height / 2;
  if (body.x < left || body.x > right) {
    body.vx = body.x < left ? Math.abs(body.vx) * 0.68 : -Math.abs(body.vx) * 0.68;
    body.x = Math.max(left, Math.min(right, body.x));
    body.spin += body.vx * 0.06;
  }
  if (body.y < top) {
    body.y = top;
    body.vy = Math.abs(body.vy) * 0.58;
  }
  if (body.y >= floor) {
    body.y = floor;
    body.vy = Math.abs(body.vy) < 85 ? 0 : -Math.abs(body.vy) * 0.58;
    body.vx *= Math.exp(-5 * dt);
    body.spin *= Math.exp(-7 * dt);
    if (Math.abs(body.vx) < 10 && body.vy === 0 && Math.abs(body.spin) < 5) {
      body.vx = body.vy = body.spin = 0;
      body.mode = "rest";
    }
  }
}

function collideHeroBodies(a, b) {
  if ([a.mode, b.mode].some((mode) => mode === "orbit" || mode === "return")) return;
  if (a.mode === "rest" && b.mode === "rest") return;
  const dx = b.x + b.width / 2 - a.x - a.width / 2;
  const dy = b.y + b.height / 2 - a.y - a.height / 2;
  const distance = Math.hypot(dx, dy);
  const overlap = a.radius + b.radius - distance;
  if (overlap <= 0) return;
  const nx = distance > 0.001 ? dx / distance : 1;
  const ny = distance > 0.001 ? dy / distance : 0;
  const inverseA = a.mode === "drag" ? 0 : 1 / a.mass;
  const inverseB = b.mode === "drag" ? 0 : 1 / b.mass;
  const total = inverseA + inverseB;
  if (!total) return;
  const correction = (Math.max(0, overlap - 0.25) * 0.8) / total;
  a.x -= nx * correction * inverseA;
  a.y -= ny * correction * inverseA;
  b.x += nx * correction * inverseB;
  b.y += ny * correction * inverseB;
  const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (approach < 0) {
    const impulse = (-1.58 * approach) / total;
    a.vx -= impulse * nx * inverseA;
    a.vy -= impulse * ny * inverseA;
    b.vx += impulse * nx * inverseB;
    b.vy += impulse * ny * inverseB;
    if (inverseA) a.spin -= ny * impulse * inverseA * 0.15;
    if (inverseB) b.spin += ny * impulse * inverseB * 0.15;
  }
  if (a.mode === "rest") a.mode = "flight";
  if (b.mode === "rest") b.mode = "flight";
}

function setupHeroPlayground({ motionState, reducedMotion }) {
  const hero = document.querySelector("#sec-hero");
  const circle = hero?.querySelector(".circle-center");
  if (!hero || !circle) return;
  const layer = document.createElement("div");
  layer.className = "hero-physics-layer";
  layer.setAttribute("aria-hidden", "true");
  hero.append(layer);
  const items = [];
  const resetHovers = [];
  const rest = { x: 0, y: 0, rotation: 0, skewX: 0, scaleX: 1, scaleY: 1 };
  const clamp = gsap.utils.clamp;
  let drag = null;
  let visible = true;
  let frontLayer = 1;

  // Reparent only the loose letter; its original slot keeps both headings stable.
  const detach = (item) => {
    const rect = item.letter.getBoundingClientRect();
    const slot = item.slot.getBoundingClientRect();
    const stage = hero.getBoundingClientRect();
    const style = getComputedStyle(item.letter);
    const body = {
      x: rect.left + rect.width / 2 - slot.width / 2 - stage.left,
      y: rect.top + rect.height / 2 - slot.height / 2 - stage.top,
      width: slot.width,
      height: slot.height,
      radius: Math.max(12, Math.min(slot.width * 0.52, slot.height * 0.34)),
      mass: Math.max(1, (slot.width * slot.height) / 10000),
      vx: 0,
      vy: 0,
      angle: Number(gsap.getProperty(item.letter, "rotation")) || 0,
      spin: 0,
      scaleX: Number(gsap.getProperty(item.letter, "scaleX")),
      scaleY: Number(gsap.getProperty(item.letter, "scaleY")),
      mode: "drag",
      captureDelay: 0,
    };
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;
    gsap.killTweensOf(item.letter);
    item.letter.style.font = font;
    item.letter.style.letterSpacing = style.letterSpacing;
    item.slot.style.width = `${slot.width}px`;
    item.slot.style.height = `${slot.height}px`;
    item.letter.classList.add("hero-free-letter");
    item.letter.dataset.detached = "true";
    layer.append(item.letter);
    item.body = body;
    item.draw = gsap.quickSetter(item.letter, "css");
    draw(item);
  };
  const draw = (item) => {
    const b = item.body;
    item.draw({ x: b.x, y: b.y, rotation: b.angle, skewX: 0, scaleX: b.scaleX, scaleY: b.scaleY });
    if (item.letter.dataset.physics !== b.mode) item.letter.dataset.physics = b.mode;
  };
  const attach = (item) => {
    gsap.killTweensOf(item.letter);
    item.slot.append(item.letter);
    item.slot.style.removeProperty("width");
    item.slot.style.removeProperty("height");
    item.letter.classList.remove("hero-free-letter", "is-dragging");
    item.letter.style.removeProperty("font");
    item.letter.style.removeProperty("letter-spacing");
    item.letter.style.removeProperty("z-index");
    item.letter.dataset.detached = "false";
    delete item.letter.dataset.physics;
    gsap.set(item.letter, rest);
    item.body = null;
  };
  const returnLetter = (item, immediate = false) => {
    if (!item.body) return;
    if (immediate || reducedMotion.matches) attach(item);
    else {
      item.body.mode = "return";
      item.body.vx = item.body.vy = 0;
    }
  };
  const anchor = (item, stage) => {
    const slot = item.slot.getBoundingClientRect();
    return { x: slot.left - stage.left, y: slot.top - stage.top };
  };
  const orbit = (b, center) => {
    b.mode = "orbit";
    b.orbitAngle = Math.atan2(b.y + b.height / 2 - center.y, b.x + b.width / 2 - center.x);
    const neighbors = items.filter((item) => item.body && item.body !== b && item.body.mode === "orbit");
    for (let attempt = 0; attempt < neighbors.length; attempt++) {
      if (!neighbors.some((item) => Math.abs(Math.atan2(Math.sin(item.body.orbitAngle - b.orbitAngle), Math.cos(item.body.orbitAngle - b.orbitAngle))) < 0.7)) break;
      b.orbitAngle += 2.4;
    }
    b.orbitRadius = Math.max(center.radius + b.radius + 22, hero.querySelector(".circle-box").clientWidth * 0.4 + b.radius + 20);
  };
  const finishDrag = (cancel = false) => {
    if (!drag) return;
    const ended = drag;
    drag = null;
    const { item, pointerId } = ended;
    item.letter.classList.remove("is-dragging");
    if (hero.hasPointerCapture(pointerId)) hero.releasePointerCapture(pointerId);
    const b = item.body;
    if (b) {
      const stage = hero.getBoundingClientRect();
      const home = anchor(item, stage);
      if (cancel || Math.hypot(b.x - home.x, b.y - home.y) < Math.max(26, b.height * 0.12)) {
        returnLetter(item);
      } else if (reducedMotion.matches) {
        b.mode = "rest";
        b.vx = b.vy = b.spin = 0;
        b.angle = 0;
      } else {
        const fresh = performance.now() - ended.lastTime < 100;
        b.vx = clamp(-1600, 1600, (fresh ? ended.vx * 0.65 : 0) + b.vx * 0.65 + (b.targetX - b.x) * 2);
        b.vy = clamp(-1600, 1600, (fresh ? ended.vy * 0.65 : 0) + b.vy * 0.65 + (b.targetY - b.y) * 2);
        b.spin = clamp(-150, 150, b.vx * 0.12);
        b.mode = "flight";
        const button = circle.getBoundingClientRect();
        const dx = b.x + b.width / 2 - (button.left + button.width / 2 - stage.left);
        const dy = b.y + b.height / 2 - (button.top + button.height / 2 - stage.top);
        b.captureDelay = b.vx * dx + b.vy * dy > 0 && Math.hypot(b.vx, b.vy) > 450 ? 0.65 : 0;
      }
    }
    resetHovers.forEach((reset) => reset());
  };

  hero.querySelectorAll(".hero-title").forEach((title) => {
    const letters = Array.from(title.querySelectorAll(".hero-glyph"), (slot) => ({ slot, letter: slot.querySelector(".hero-letter"), body: null }));
    items.push(...letters);
    let frame = 0;
    const pointer = { x: 0, y: 0 };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      const attached = letters.filter((item) => !item.body && item !== drag?.item).map((item) => item.letter);
      if (attached.length) gsap.to(attached, { ...rest, duration: reducedMotion.matches ? 0 : 1.15, ease: "elastic.out(1, .42)", overwrite: true });
    };
    resetHovers.push(reset);
    const renderHover = () => {
      frame = 0;
      if (drag || reducedMotion.matches || hero.dataset.entrance === "assembling") return;
      const rect = title.getBoundingClientRect();
      const radius = rect.height * 1.15;
      const pullY = clamp(-rect.height * 0.3, rect.height * 0.3, (pointer.y - rect.top - rect.height * 0.7) * 0.6);
      letters.forEach((item) => {
        if (item.body) return;
        const box = item.slot.getBoundingClientRect();
        const distance = pointer.x - (box.left + box.width / 2);
        const influence = Math.pow(Math.max(0, 1 - Math.abs(distance) / radius), 2);
        gsap.to(item.letter, {
          x: distance * influence * 0.12,
          y: pullY * influence,
          rotation: clamp(-9, 9, distance * influence * 0.065),
          skewX: clamp(-12, 12, distance * influence * -0.08),
          scaleY: 1 + ((influence * Math.abs(pullY)) / rect.height) * 0.6,
          duration: 0.5,
          ease: "power3.out",
          overwrite: true,
        });
      });
    };
    title.addEventListener(
      "pointermove",
      (event) => {
        if (drag || reducedMotion.matches || hero.dataset.entrance === "assembling") return;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        if (!frame) frame = requestAnimationFrame(renderHover);
      },
      { passive: true },
    );
    title.addEventListener("pointerleave", reset);
    letters.forEach((item) => {
      item.letter.addEventListener("pointerdown", (event) => {
        if (!event.isPrimary || event.button !== 0 || drag || hero.dataset.entrance === "assembling") return;
        event.preventDefault();
        cancelAnimationFrame(frame);
        frame = 0;
        gsap.killTweensOf(item.letter);
        if (item.body) item.body.mode = "drag";
        const stage = hero.getBoundingClientRect();
        drag = {
          item,
          pointerId: event.pointerId,
          pointerX: event.clientX,
          pointerY: event.clientY,
          lastX: event.clientX,
          lastY: event.clientY,
          lastTime: performance.now(),
          vx: 0,
          vy: 0,
          startX: Number(gsap.getProperty(item.letter, "x")) || 0,
          startY: Number(gsap.getProperty(item.letter, "y")) || 0,
          offsetX: item.body ? event.clientX - stage.left - item.body.x : 0,
          offsetY: item.body ? event.clientY - stage.top - item.body.y : 0,
          slot: item.slot.getBoundingClientRect(),
          moved: false,
        };
        if (item.body) {
          item.body.targetX = item.body.x;
          item.body.targetY = item.body.y;
        }
        item.letter.style.zIndex = String(++frontLayer);
        // Capture on the stable hero, because the letter changes parents during peeling.
        hero.setPointerCapture(event.pointerId);
      });
    });
  });

  window.addEventListener(
    "pointermove",
    (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const now = performance.now();
      const elapsed = Math.max(8, now - drag.lastTime) / 1000;
      drag.vx = drag.vx * 0.45 + ((event.clientX - drag.lastX) / elapsed) * 0.55;
      drag.vy = drag.vy * 0.45 + ((event.clientY - drag.lastY) / elapsed) * 0.55;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.lastTime = now;
      const dx = event.clientX - drag.pointerX;
      const dy = event.clientY - drag.pointerY;
      const distance = Math.hypot(dx, dy);
      if (!drag.moved && distance < 6) return;
      drag.moved = true;
      const peelDistance = clamp(18, 38, drag.slot.height * 0.16);
      const stage = hero.getBoundingClientRect();
      const item = drag.item;
      item.letter.classList.add("is-dragging");
      if (!item.body && distance >= peelDistance) {
        detach(item);
        drag.offsetX = drag.pointerX - drag.slot.left - drag.startX;
        drag.offsetY = drag.pointerY - drag.slot.top - drag.startY;
      }
      if (item.body) {
        const b = item.body;
        b.targetX = clamp(12 + b.radius - b.width / 2, stage.width - 12 - b.radius - b.width / 2, event.clientX - stage.left - drag.offsetX);
        b.targetY = clamp(90 + b.radius - b.height / 2, stage.height - 18 - b.radius - b.height / 2, event.clientY - stage.top - drag.offsetY);
      } else {
        const peel = Math.min(1, distance / peelDistance);
        const resistance = 0.3 + 0.7 * peel * peel * (3 - 2 * peel);
        gsap.to(item.letter, {
          x: drag.startX + dx * resistance,
          y: drag.startY + dy * resistance,
          rotation: reducedMotion.matches ? 0 : clamp(-8, 8, dx * 0.035),
          duration: reducedMotion.matches ? 0 : 0.24,
          ease: "power3.out",
          overwrite: true,
        });
      }
    },
    { passive: true },
  );
  window.addEventListener(
    "pointerup",
    (event) => {
      if (event.pointerId === drag?.pointerId) finishDrag();
    },
    { passive: true },
  );
  window.addEventListener(
    "pointercancel",
    (event) => {
      if (event.pointerId === drag?.pointerId) finishDrag(true);
    },
    { passive: true },
  );
  hero.addEventListener("lostpointercapture", (event) => {
    if (event.pointerId === drag?.pointerId) finishDrag(true);
  });
  window.addEventListener("blur", () => finishDrag(true));
  const restoreAll = (immediate = false) => {
    finishDrag(true);
    items.forEach((item) => returnLetter(item, immediate));
    resetHovers.forEach((reset) => reset());
  };
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") restoreAll();
  });
  reducedMotion.addEventListener("change", () => restoreAll(true));
  const readHeroLayout = () => [window.innerWidth, ...Array.from(hero.querySelectorAll(".hero-title"), (title) => getComputedStyle(title).fontSize)].join("|");
  let heroLayout = readHeroLayout();
  window.addEventListener(
    "resize",
    () => {
      const nextLayout = readHeroLayout();
      if (nextLayout === heroLayout) return;
      heroLayout = nextLayout;
      restoreAll(true);
    },
    { passive: true },
  );
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }).observe(hero);

  const spring = (b, x, y, dt, strength = 125) => {
    const damping = 2 * Math.sqrt(strength);
    b.vx += ((x - b.x) * strength - b.vx * damping) * dt;
    b.vy += ((y - b.y) * strength - b.vy * damping) * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  };
  gsap.ticker.add((time, deltaTime) => {
    const loose = items.filter((item) => item.body);
    if (!loose.length || !visible || document.hidden) return;
    const stage = hero.getBoundingClientRect();
    const button = circle.getBoundingClientRect();
    const center = { x: button.left + button.width / 2 - stage.left, y: button.top + button.height / 2 - stage.top, radius: button.width / 2 };
    const bounds = { left: 12, right: stage.width - 12, top: 90, bottom: stage.height - 18 };
    const dt = Math.min(deltaTime / 1000, 0.04) / motionState.durationScale;
    const steps = Math.max(1, Math.ceil(dt * 120));
    const step = dt / steps;
    for (let i = 0; i < steps; i++) {
      loose.forEach((item) => {
        const b = item.body;
        if (!b) return;
        b.captureDelay = Math.max(0, b.captureDelay - step);
        if (b.mode === "drag") {
          if (reducedMotion.matches) {
            b.x = b.targetX;
            b.y = b.targetY;
          } else spring(b, b.targetX, b.targetY, step);
          const stretch = reducedMotion.matches ? 0 : Math.min(0.08, Math.hypot(b.targetX - b.x, b.targetY - b.y) / 900);
          b.scaleX += (1 + stretch - b.scaleX) * Math.min(1, step * 16);
          b.scaleY += (1 - stretch * 0.4 - b.scaleY) * Math.min(1, step * 16);
          b.angle += (clamp(-9, 9, b.vx * 0.02) - b.angle) * Math.min(1, step * 10);
          return;
        }
        b.scaleX += (1 - b.scaleX) * Math.min(1, step * 12);
        b.scaleY += (1 - b.scaleY) * Math.min(1, step * 12);
        if (b.mode === "return") {
          const home = anchor(item, stage);
          spring(b, home.x, home.y, step, 150);
          b.angle *= Math.exp(-10 * step);
          if (Math.hypot(b.x - home.x, b.y - home.y) < 0.5 && Math.hypot(b.vx, b.vy) < 5) attach(item);
          return;
        }
        if (reducedMotion.matches) return;
        const distance = Math.hypot(b.x + b.width / 2 - center.x, b.y + b.height / 2 - center.y);
        if (b.mode !== "orbit" && !b.captureDelay && distance < center.radius + b.radius + 90) orbit(b, center);
        if (b.mode === "orbit") {
          b.orbitAngle += (0.7 + 0.12 / b.mass) * step;
          const halfWidth = Math.max(b.width / 2, b.width * 0.476 + b.height * 0.155);
          const halfHeight = Math.max(b.height / 2, b.height * 0.476 + b.width * 0.155);
          const rx = Math.max(25, Math.min(b.orbitRadius, center.x - bounds.left - halfWidth, bounds.right - center.x - halfWidth));
          const ry = Math.max(25, Math.min(b.orbitRadius, center.y - bounds.top - halfHeight, bounds.bottom - center.y - halfHeight));
          spring(b, center.x + Math.cos(b.orbitAngle) * rx - b.width / 2, center.y + Math.sin(b.orbitAngle) * ry - b.height / 2, step, 85);
          b.angle += (Math.sin(b.orbitAngle) * 18 - b.angle) * Math.min(1, step * 3);
        } else if (b.mode === "flight") advanceHeroBody(b, step, bounds);
      });
      if (!reducedMotion.matches) {
        const bodies = loose.filter((item) => item.body).map((item) => item.body);
        for (let a = 0; a < bodies.length; a++) for (let b = a + 1; b < bodies.length; b++) collideHeroBodies(bodies[a], bodies[b]);
      }
    }
    loose.forEach((item) => {
      if (item.body) draw(item);
    });
  });

  // Scroll the outer scene so it never competes with each letter's transforms.
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    gsap
      .timeline({
        scrollTrigger: { id: "hero-playground-exit", trigger: hero, start: "top top", end: () => `+=${hero.offsetHeight * 0.85}`, scrub: 0.55, invalidateOnRefresh: true },
        defaults: { ease: "none" },
      })
      .fromTo(
        hero.querySelector(".text-box"),
        { x: 0, y: 0, rotation: 0, opacity: 1 },
        { x: () => (window.innerWidth < 769 ? -10 : -28), y: -110, rotation: -2.5, transformOrigin: "0% 50%", opacity: 0, duration: 1 },
        0,
      )
      .fromTo(
        hero.querySelector(".hero-circle-visual"),
        { x: 0, y: 0, rotation: 0, scale: 1 },
        { x: () => -Math.min(window.innerWidth * 0.06, 80), y: () => Math.min(hero.offsetHeight * 0.3, 290), rotation: 85, scale: 0.82, duration: 1 },
        0,
      )
      .fromTo(hero.querySelectorAll(".hero-motion-caption, .hero-circle-meta"), { y: 0, opacity: 1 }, { y: 32, opacity: 0, duration: 0.22 }, 0.05);
  });
}
