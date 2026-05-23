/**
 * JOURNAL.JS — Page journal des captures
 */

const $ = id => document.getElementById(id);

function padNumber(n) { return String(n).padStart(4, '0'); }

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatMonthYear(dateStr) {
  if (!dateStr) return 'Date inconnue';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

let currentView = 'chrono';
let allCatches  = [];

function renderEntry(c) {
  const ballEntry = BALLS.find(b => b.name === c.ball_name);
  const ballSrc   = ballEntry ? ballUrl(ballEntry.slug) : (c.ball_image_url || '');
  const spriteSrc = c.sprite_url || spriteUrl(c.pokemon_number, c.is_shiny);

  return `
    <div class="je">
      <img class="je-sprite" src="${esc(spriteSrc)}" alt="${esc(c.pokemon_name_fr)}" width="48" height="48">
      <div class="je-main">
        <div class="je-poke-line">
          <span class="je-number">#${esc(padNumber(c.pokemon_number))}</span>
          <span class="je-name">${esc(c.pokemon_name_fr)}</span>
          ${c.is_shiny ? '<span class="je-shiny">✦</span>' : ''}
        </div>
        ${c.form_label ? `<span class="je-form">${esc(c.form_label)}</span>` : ''}
      </div>
      <div class="je-catch-info">
        ${ballSrc ? `<img class="je-ball" src="${esc(ballSrc)}" alt="${esc(c.ball_name || '')}" width="26" height="26">` : ''}
        <span class="je-date">${esc(formatDate(c.caught_at))}</span>
      </div>
      <div class="je-game">${c.game ? esc(c.game) : '<span class="je-game--empty">—</span>'}</div>
    </div>`;
}

function renderSection(title, entries) {
  return `
    <section class="journal-section">
      <div class="journal-section-header">
        <h3>${esc(title)}</h3>
        <span class="journal-section-count">${entries.length} capture${entries.length > 1 ? 's' : ''}</span>
      </div>
      <div class="journal-section-entries">
        ${entries.map(renderEntry).join('')}
      </div>
    </section>`;
}

function renderChrono(catches) {
  const byMonth = {};
  for (const c of catches) {
    const key = c.caught_at ? c.caught_at.slice(0, 7) : 'unknown';
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(c);
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, entries]) => renderSection(
      key === 'unknown' ? 'Date inconnue' : formatMonthYear(key + '-01'),
      entries
    )).join('');
}

function renderByGame(catches) {
  const NO_GAME = '— Jeu non renseigné —';
  const byGame = {};
  for (const c of catches) {
    const key = c.game || NO_GAME;
    if (!byGame[key]) byGame[key] = [];
    byGame[key].push(c);
  }
  // Jeux nommés triés alphabétiquement, "sans jeu" à la fin
  const entries = Object.entries(byGame);
  const named   = entries.filter(([k]) => k !== NO_GAME).sort(([a], [b]) => a.localeCompare(b, 'fr'));
  const unnamed = entries.filter(([k]) => k === NO_GAME);
  return [...named, ...unnamed]
    .map(([game, items]) => renderSection(game, items))
    .join('');
}

function render() {
  const content = $('journal-content');
  const empty   = $('journal-empty');
  const total   = $('journal-total');

  if (!allCatches.length) {
    content.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  total.textContent = `${allCatches.length} capture${allCatches.length > 1 ? 's' : ''}`;

  // En mode "par jeu", masquer la colonne jeu sur chaque entrée (déjà visible en section)
  content.className = currentView === 'game' ? 'journal-content view-game' : 'journal-content';
  content.innerHTML = currentView === 'chrono' ? renderChrono(allCatches) : renderByGame(allCatches);
}

async function init() {
  const loader = $('journal-loader');
  loader.hidden = false;

  try {
    const uuid = getOwnerUuid();
    const { data } = await fetchCatches(uuid);
    allCatches = data || [];

    const capturedCount = $('captured-count');
    if (capturedCount) capturedCount.textContent = allCatches.length;
  } catch (e) {
    console.error('[journal]', e);
  } finally {
    loader.hidden = true;
  }

  render();
}

$('view-chrono').addEventListener('click', () => {
  currentView = 'chrono';
  $('view-chrono').classList.add('active');
  $('view-game').classList.remove('active');
  render();
});

$('view-game').addEventListener('click', () => {
  currentView = 'game';
  $('view-game').classList.add('active');
  $('view-chrono').classList.remove('active');
  render();
});

init();
