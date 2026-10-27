/* A few seed tiles grow into a full cover; the same grid unveils the real HOME. */
function setupTileGridLoader({ reducedMotion }) {
  const loading = document.querySelector('.loading');
  const grid = loading?.querySelector('.loading-grid');
  const backdrop = loading?.querySelector('.loading-backdrop');
  const skip = loading?.querySelector('.loading-skip');
  const background = loading ? Array.from(document.body.children)
    .filter((node) => node !== loading && !['SCRIPT', 'STYLE', 'LINK'].includes(node.tagName))
    .map((node) => ({ node, inert: node.inert })) : [];
  background.forEach(({ node }) => { node.inert = true; });

  let intro = null;
  let opening = null;
  let skipSettle = null;
  let revealed = false;
  let skipRequested = false;
  let finishNow = () => {};
  let resolveIntro;
  const introReady = new Promise((resolve) => { resolveIntro = resolve; });
  const requestSkip = () => {
    if (skipRequested || revealed) return;
    skipRequested = true;
    if (skip) {
      skip.disabled = true;
      skip.querySelector('.loading-skip-label').textContent = 'Opening…';
    }
    // Settle to an opaque grid first, then run the normal exit. Never hard-cut HOME.
    if (intro) {
      intro.pause();
      skipSettle = intro.tweenTo(intro.duration(), {
        duration: .22, ease: 'power2.out', onComplete: resolveIntro,
      });
    } else resolveIntro();
  };
  const onKeyDown = (event) => {
    if (event.key !== 'Enter' || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
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
  skip?.addEventListener('click', requestSkip);
  document.addEventListener('keydown', onKeyDown, true);
  reducedMotion.addEventListener('change', onPreference);

  const tiles = [];
  let columns = 1, rows = 1;
  if (grid && !reducedMotion.matches) {
    const compact = innerWidth <= 768;
    columns = Math.max(5, Math.ceil(innerWidth / (compact ? 64 : 112)));
    if (columns % 2 === 0) columns++;
    rows = Math.max(3, Math.ceil(innerHeight / (innerWidth / columns)));
    if (rows % 2 === 0) rows++;
    grid.style.setProperty('--loader-columns', columns);
    grid.style.setProperty('--loader-rows', rows);
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < columns * rows; index++) {
      const tile = document.createElement('span');
      tile.className = 'loading-tile';
      fragment.append(tile);
      tiles.push(tile);
    }
    grid.append(fragment);
    const middle = Math.floor(rows / 2);
    const seedColumns = (compact ? [.18, .5, .82] : [.18, .43, .66, .84])
      .map((position) => Math.round(position * (columns - 1)));
    const seeds = seedColumns.map((column) => tiles[middle * columns + column]);
    const delayFor = (index) => {
      const column = index % columns, row = Math.floor(index / columns);
      const distance = Math.min(...seedColumns.map((seed) => Math.abs(seed - column) + Math.abs(middle - row)));
      // A fixed offset makes the wave irregular without changing on every visit.
      return distance * .055 + ((index * 7) % 5) * .015;
    };
    gsap.set(tiles, { opacity: 0, scale: .72, transformOrigin: '50% 50%' });
    loading.dataset.phase = 'seeds';
    intro = gsap.timeline({ onComplete: () => { loading.dataset.phase = 'ready'; resolveIntro(); } })
      .to(seeds, { opacity: 1, scale: 1, duration: .32, stagger: .1, ease: 'power3.out' }, .05)
      .call(() => { loading.dataset.phase = 'filling'; }, null, .5)
      .to(tiles, { opacity: 1, scale: 1, duration: .28, stagger: delayFor, ease: 'power2.out' }, .5)
      .to({}, { duration: .12 });
  } else resolveIntro();

  return {
    // Calling reveal means fonts, project assets and scroll scenes are ready.
    async reveal(playHero, onComplete, onUnveil = () => {}) {
      await introReady;
      if (revealed) return;
      revealed = true;
      let heroStarted = false, heroDone = false, tilesDone = false, finished = false, unveiled = false;
      const unveil = () => {
        if (unveiled) return;
        unveiled = true;
        onUnveil();
      };
      const finish = () => {
        if (finished || !heroDone || !tilesDone) return;
        finished = true;
        skipSettle?.kill(); intro?.kill();
        loading?.remove();
        reducedMotion.removeEventListener('change', onPreference);
        skip?.removeEventListener('click', requestSkip);
        document.removeEventListener('keydown', onKeyDown, true);
        background.forEach(({ node, inert }) => { node.inert = inert; });
        onComplete();
      };
      const startHero = (immediate = false) => {
        if (heroStarted && !immediate) return;
        heroStarted = true;
        if (typeof playHero === 'function') playHero(() => { heroDone = true; finish(); }, { immediate, compact: true });
        else { heroDone = true; finish(); }
      };
      finishNow = () => {
        opening?.kill(); intro?.kill();
        tilesDone = true;
        unveil();
        startHero(true);
        finish();
      };
      if (!loading || reducedMotion.matches) { finishNow(); return; }

      loading.dataset.phase = 'opening';
      loading.dataset.skipped = String(skipRequested);
      gsap.set(backdrop, { autoAlpha: 0 }); // The opaque tiles still cover every pixel.
      opening = gsap.timeline({ onComplete: () => { tilesDone = true; finish(); } })
        .to(skip, { autoAlpha: 0, duration: .15 }, 0)
        .to(tiles, {
          scaleX: 0, duration: .48, ease: 'power3.inOut',
          transformOrigin: (index) => Math.floor(index / columns) % 2 ? '100% 50%' : '0% 50%',
          stagger: (index) => ((index % columns) / Math.max(1, columns - 1) * .2
            + Math.floor(index / columns) / Math.max(1, rows - 1) * .24),
        }, .04)
        // Assemble behind the tiles; expose the settled type instead of a broken pose.
        .call(() => startHero(), null, .28)
        .call(unveil, null, .42);
    },
  };
}
