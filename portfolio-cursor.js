/* The dot stays under the mouse; only the decorative ring has inertia. */
function setupPortfolioCursor({ motionState, reducedMotion }) {
  const root = document.documentElement;
  const desktopMouse = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 769px)");
  const cursor = document.createElement("div");
  cursor.className = "portfolio-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.dataset.state = "idle";
  cursor.innerHTML = '<span class="portfolio-cursor-dot"></span><span class="portfolio-cursor-ring"><svg class="portfolio-cursor-grip" viewBox="0 0 12 18" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/><circle cx="3" cy="9" r="1.5"/><circle cx="9" cy="9" r="1.5"/><circle cx="3" cy="15" r="1.5"/><circle cx="9" cy="15" r="1.5"/></g></svg><span class="portfolio-cursor-label">VIEW</span></span>';
  document.body.append(cursor);
  const dot = cursor.querySelector(".portfolio-cursor-dot");
  const ring = cursor.querySelector(".portfolio-cursor-ring");
  const projectLink = "#sec-project .left-box a, .project-button, .vibe-slide a";
  const nativeTarget = "iframe, input, textarea, select, [contenteditable]:not([contenteditable='false']), [data-native-cursor]";
  let visible = false;
  let pressed = false;
  let dragging = false;
  let x = 0, y = 0, ringX = 0, ringY = 0;
  let frame = 0, previousTime = 0;
  let scrollFrame = 0;

  const enabled = () => desktopMouse.matches && !reducedMotion.matches;
  const hide = () => {
    visible = pressed = dragging = false;
    root.classList.remove("has-portfolio-cursor");
    cursor.classList.remove("is-visible", "is-pressed");
    cancelAnimationFrame(frame);
    frame = previousTime = 0;
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
  };
  const setContext = (target) => {
    if (!(target instanceof Element)) return;
    if (target.closest(nativeTarget)) { hide(); return; }
    cursor.dataset.state = dragging ? "drag"
      : target.closest(".hero-letter") ? "grab"
      : target.closest(projectLink) ? "view"
      : target.closest("a, button, [role='button'], summary, label") ? "link"
      : "idle";
  };
  const render = (time) => {
    frame = 0;
    if (!visible) return;
    if (!enabled() || document.hidden || !document.hasFocus()) { hide(); return; }
    const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 60;
    previousTime = time;
    const follow = 1 - Math.exp(-dt / (0.065 * motionState.durationScale));
    ringX += (x - ringX) * follow;
    ringY += (y - ringY) * follow;
    const dx = x - ringX, dy = y - ringY;
    const distance = Math.hypot(dx, dy);
    const view = cursor.dataset.state === "view";
    const stretch = view || dragging || pressed ? 0 : Math.min(0.3, distance / 240);
    const angle = view || dragging || pressed ? 0 : Math.atan2(dy, dx) * 180 / Math.PI;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.45})`;
    if (distance > 0.05) frame = requestAnimationFrame(render);
    else previousTime = 0;
  };
  const requestRender = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };
  const move = (event) => {
    if (event.pointerType !== "mouse" || !enabled() || !document.hasFocus() || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || root.classList.contains("is-loading")) { hide(); return; }
    x = event.clientX; y = event.clientY;
    if (event.target instanceof Element && event.target.closest(nativeTarget)) { hide(); return; }
    // Re-enter at the pointer position instead of flying in from a previous window.
    if (!visible) {
      ringX = x; ringY = y;
      previousTime = 0;
      visible = true;
      root.classList.add("has-portfolio-cursor");
      cursor.classList.add("is-visible");
    }
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    setContext(event.target);
    requestRender();
  };
  document.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerover", (event) => {
    if (visible) setContext(event.target);
  }, { passive: true });
  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget || (event.relatedTarget instanceof Element && event.relatedTarget.closest("iframe"))) hide();
  }, { passive: true });
  document.addEventListener("pointerdown", (event) => {
    if (!visible || event.pointerType !== "mouse" || event.button !== 0) return;
    pressed = true;
    dragging = !!event.target.closest(".hero-letter");
    cursor.classList.add("is-pressed");
    setContext(event.target);
    requestRender();
  }, { passive: true, capture: true });
  const release = () => {
    pressed = dragging = false;
    cursor.classList.remove("is-pressed");
    if (!visible) return;
    setContext(document.elementFromPoint(x, y));
    requestRender();
  };
  window.addEventListener("pointerup", release, { passive: true });
  window.addEventListener("pointercancel", hide, { passive: true });
  window.addEventListener("blur", hide);
  window.addEventListener("focus", hide);
  window.addEventListener("resize", hide, { passive: true });
  window.addEventListener("pagehide", hide);
  document.addEventListener("contextmenu", hide);
  document.addEventListener("visibilitychange", () => { if (document.hidden) hide(); });
  // Inspector shortcuts can stop page pointer events before a blur or pointerout arrives.
  // Hand back the native pointer on the first modifier key, without consuming the shortcut.
  window.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || ["Control", "Meta", "Alt", "Shift", "Tab", "Escape", "F12"].includes(event.key)) hide();
  }, { capture: true });
  window.addEventListener("scroll", () => {
    if (!visible || dragging || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (visible) setContext(document.elementFromPoint(x, y));
    });
  }, { passive: true });
  desktopMouse.addEventListener("change", hide);
  reducedMotion.addEventListener("change", hide);
}
