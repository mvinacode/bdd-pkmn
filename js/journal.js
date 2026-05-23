/**
 * JOURNAL.JS — Page journal des captures
 */

const $ = id => document.getElementById(id);

function padNumber(n) { return String(n).padStart(4, '0'); }

// ── Icônes formes ─────────────────────────────────────────────

const _SHINY_URL   = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779139479/shiny_abqivl.png';
const _MEGA_URL    = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779128811/mega_evolution_t9nlsa.svg';
const _GIGAMAX_URL = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779128704/gigantamax_yescyy.png';
const _BARON_URL   = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779139486/baron_jvi4lm.png';

const S = 13;
const _MALE_ICO      = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="${S}" height="${S}"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
const _FEMALE_ICO    = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="${S}" height="${S}"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
const _NEUTRAL_ICO   = `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="${S}" height="${S}"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;
const _SHINY_ICO     = `<img src="${_SHINY_URL}"   width="${S}" height="${S}" alt="Shiny"   style="vertical-align:middle">`;
const _MEGA_ICO      = `<img src="${_MEGA_URL}"    width="${S}" height="${S}" alt="Méga"    style="vertical-align:middle">`;
const _GIGAMAX_ICO   = `<img src="${_GIGAMAX_URL}" width="${S}" height="${S}" alt="Gigamax" style="vertical-align:middle">`;
const _BARON_ICO     = `<img src="${_BARON_URL}"   width="${S}" height="${S}" alt="Baron"   style="vertical-align:middle">`;

function formLabelToIcons(label, isShiny) {
  if (!label || label === 'Normale') return isShiny ? _NEUTRAL_ICO + _SHINY_ICO : _NEUTRAL_ICO;
  if (label === 'Shiny')             return _NEUTRAL_ICO + _SHINY_ICO;
  if (label === 'Mâle')              return _MALE_ICO;
  if (label === 'Femelle')           return _FEMALE_ICO;
  if (label === 'Unisexe')           return _NEUTRAL_ICO;
  if (label === 'Mâle Shiny')        return _MALE_ICO    + _SHINY_ICO;
  if (label === 'Femelle Shiny')     return _FEMALE_ICO  + _SHINY_ICO;
  if (label === 'Unisexe Shiny')     return _NEUTRAL_ICO + _SHINY_ICO;
  if (label === 'Baron')             return _BARON_ICO;
  if (label === 'Baron Shiny')       return _BARON_ICO   + _SHINY_ICO;
  if (label.startsWith('Méga'))      return _MEGA_ICO    + (label.includes('Shiny') ? _SHINY_ICO : '');
  if (label.startsWith('Gigamax'))   return _GIGAMAX_ICO + (label.includes('Shiny') ? _SHINY_ICO : '');
  return `<span style="font-size:0.72rem;color:var(--text-muted)">${esc(label)}</span>`;
}

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

  const formIcons = formLabelToIcons(c.form_label, c.is_shiny);

  return `
    <div class="je">
      <img class="je-sprite" src="${esc(spriteSrc)}" alt="${esc(c.pokemon_name_fr)}" width="48" height="48">
      <div class="je-main">
        <div class="je-poke-line">
          <span class="je-number">#${esc(padNumber(c.pokemon_number))}</span>
          <span class="je-name">${esc(c.pokemon_name_fr)}</span>
        </div>
        <div class="je-form-icons">${formIcons}</div>
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
