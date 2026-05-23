/**
 * JOURNAL.JS — Page journal des captures (une entrée par session de sauvegarde)
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
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

// ── Icônes formes ─────────────────────────────────────────────

const _SHINY_URL   = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779139479/shiny_abqivl.png';
const _MEGA_URL    = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779128811/mega_evolution_t9nlsa.svg';
const _GIGAMAX_URL = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779128704/gigantamax_yescyy.png';
const _BARON_URL   = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779139486/baron_jvi4lm.png';

const S = 13;
const _MALE_ICO    = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="${S}" height="${S}"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
const _FEMALE_ICO  = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="${S}" height="${S}"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
const _NEUTRAL_ICO = `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="${S}" height="${S}"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;
const _SHINY_ICO   = `<img src="${_SHINY_URL}"   width="${S}" height="${S}" alt="Shiny"   style="vertical-align:middle">`;
const _MEGA_ICO    = `<img src="${_MEGA_URL}"    width="${S}" height="${S}" alt="Méga"    style="vertical-align:middle">`;
const _GIGAMAX_ICO = `<img src="${_GIGAMAX_URL}" width="${S}" height="${S}" alt="Gigamax" style="vertical-align:middle">`;
const _BARON_ICO   = `<img src="${_BARON_URL}"   width="${S}" height="${S}" alt="Baron"   style="vertical-align:middle">`;

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

// ── Groupement par session ─────────────────────────────────────

function groupBySession(catches) {
  const map = {};
  const order = [];
  for (const c of catches) {
    const key = c.session_id || String(c.id);
    if (!map[key]) {
      map[key] = {
        sessionId:       key,
        pokemon_number:  c.pokemon_number,
        pokemon_name_fr: c.pokemon_name_fr,
        sprite_url:      c.sprite_url,
        ball_name:       c.ball_name,
        ball_image_url:  c.ball_image_url,
        caught_at:       c.caught_at,
        game:            c.game,
        notes:           c.notes,
        forms:           [],
      };
      order.push(key);
    }
    map[key].forms.push({ form_label: c.form_label, is_shiny: c.is_shiny });
  }
  return order.map(k => map[k]);
}

// ── Rendu ─────────────────────────────────────────────────────

let currentView = 'chrono';
let allCatches  = [];

function renderSession(session) {
  const ballEntry = BALLS.find(b => b.name === session.ball_name);
  const ballSrc   = ballEntry ? ballUrl(ballEntry.slug) : (session.ball_image_url || '');
  const spriteSrc = session.sprite_url || spriteUrl(session.pokemon_number, session.forms.some(f => f.is_shiny));

  const formIcons = session.forms
    .map(f => `<span class="je-form-icon-group">${formLabelToIcons(f.form_label, f.is_shiny)}</span>`)
    .join('');

  const ballOptions = BALLS.map(b =>
    `<option value="${esc(b.slug)}"${b.name === session.ball_name ? ' selected' : ''}>${esc(b.name)}</option>`
  ).join('');

  return `
    <div class="je" data-session-id="${esc(session.sessionId)}" data-name="${esc(session.pokemon_name_fr)}">
      <div class="je-main-row">
        <img class="je-sprite" src="${esc(spriteSrc)}" alt="${esc(session.pokemon_name_fr)}" width="48" height="48">
        <div class="je-info">
          <div class="je-poke-line">
            <span class="je-number">#${esc(padNumber(session.pokemon_number))}</span>
            <span class="je-name">${esc(session.pokemon_name_fr)}</span>
          </div>
          <div class="je-form-icons">${formIcons}</div>
        </div>
        <div class="je-catch-info">
          ${ballSrc ? `<img class="je-ball" src="${esc(ballSrc)}" alt="${esc(session.ball_name || '')}" width="26" height="26">` : ''}
          <span class="je-date">${esc(formatDate(session.caught_at))}</span>
        </div>
        <div class="je-game">${session.game ? esc(session.game) : '<span class="je-game--empty">—</span>'}</div>
        <button class="je-edit-btn" title="Modifier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
      </div>
      <div class="je-edit-panel" hidden>
        <div class="je-edit-row">
          <select class="je-edit-ball drawer-input">${ballOptions}</select>
          <input type="date" class="je-edit-date drawer-input" value="${esc(session.caught_at || '')}">
          <input type="text" class="je-edit-game drawer-input" value="${esc(session.game || '')}" placeholder="Jeu (optionnel)">
        </div>
        <div class="je-edit-actions">
          <button class="je-save-btn btn-primary">Sauvegarder</button>
          <button class="je-cancel-btn">Annuler</button>
          <button class="je-del-btn">Supprimer</button>
        </div>
      </div>
    </div>`;
}

function renderSection(title, sessions) {
  return `
    <section class="journal-section">
      <div class="journal-section-header">
        <h3>${esc(title)}</h3>
        <span class="journal-section-count">${sessions.length} capture${sessions.length > 1 ? 's' : ''}</span>
      </div>
      <div class="journal-section-entries">
        ${sessions.map(renderSession).join('')}
      </div>
    </section>`;
}

function renderChrono(sessions) {
  const byMonth = {};
  for (const s of sessions) {
    const key = s.caught_at ? s.caught_at.slice(0, 7) : 'unknown';
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(s);
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => renderSection(
      key === 'unknown' ? 'Date inconnue' : formatMonthYear(key + '-01'),
      items
    )).join('');
}

function renderByGame(sessions) {
  const NO_GAME = '— Jeu non renseigné —';
  const byGame  = {};
  for (const s of sessions) {
    const key = s.game || NO_GAME;
    if (!byGame[key]) byGame[key] = [];
    byGame[key].push(s);
  }
  const named   = Object.entries(byGame).filter(([k]) => k !== NO_GAME).sort(([a], [b]) => a.localeCompare(b, 'fr'));
  const unnamed = Object.entries(byGame).filter(([k]) => k === NO_GAME);
  return [...named, ...unnamed]
    .map(([game, items]) => renderSection(game, items))
    .join('');
}

function render() {
  const content = $('journal-content');
  const empty   = $('journal-empty');
  const total   = $('journal-total');
  const sessions = groupBySession(allCatches);

  if (!sessions.length) {
    content.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  total.textContent = `${sessions.length} capture${sessions.length > 1 ? 's' : ''}`;
  content.className = currentView === 'game' ? 'journal-content view-game' : 'journal-content';
  content.innerHTML = currentView === 'chrono' ? renderChrono(sessions) : renderByGame(sessions);
}

// ── Événements (délégation) ────────────────────────────────────

$('journal-content').addEventListener('click', async e => {
  const editBtn   = e.target.closest('.je-edit-btn');
  const cancelBtn = e.target.closest('.je-cancel-btn');
  const saveBtn   = e.target.closest('.je-save-btn');
  const delBtn    = e.target.closest('.je-del-btn');

  if (editBtn) {
    const je    = editBtn.closest('.je');
    const panel = je.querySelector('.je-edit-panel');
    panel.hidden = !panel.hidden;
    return;
  }

  if (cancelBtn) {
    cancelBtn.closest('.je').querySelector('.je-edit-panel').hidden = true;
    return;
  }

  if (saveBtn) {
    const je        = saveBtn.closest('.je');
    const sessionId = je.dataset.sessionId;
    const ballSlug  = je.querySelector('.je-edit-ball').value;
    const ballEntry = BALLS.find(b => b.slug === ballSlug);
    const date      = je.querySelector('.je-edit-date').value  || null;
    const game      = je.querySelector('.je-edit-game').value.trim() || null;

    saveBtn.disabled    = true;
    saveBtn.textContent = 'Sauvegarde…';

    const updates = {
      caught_at:       date,
      game,
      ...(ballEntry ? { ball_name: ballEntry.name, ball_image_url: ballUrl(ballEntry.slug) } : {}),
    };

    const { error } = await updateCatchesBySession(sessionId, updates);
    if (error) {
      alert('Erreur lors de la sauvegarde.');
      saveBtn.disabled    = false;
      saveBtn.textContent = 'Sauvegarder';
      return;
    }

    allCatches.forEach(c => {
      if ((c.session_id || String(c.id)) === sessionId) {
        c.caught_at       = date;
        c.game            = game;
        if (ballEntry) { c.ball_name = ballEntry.name; c.ball_image_url = ballUrl(ballEntry.slug); }
      }
    });
    render();
    return;
  }

  if (delBtn) {
    const je        = delBtn.closest('.je');
    const sessionId = je.dataset.sessionId;
    const name      = je.dataset.name;
    if (!confirm(`Supprimer cette capture de ${name} ?`)) return;

    const { error } = await deleteCatchesBySession(sessionId);
    if (error) { alert('Erreur lors de la suppression.'); return; }

    allCatches = allCatches.filter(c => (c.session_id || String(c.id)) !== sessionId);
    render();
  }
});

// ── Initialisation ─────────────────────────────────────────────

async function init() {
  const loader = $('journal-loader');
  loader.hidden = false;
  try {
    const { data } = await fetchCatches(getOwnerUuid());
    allCatches = data || [];
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
