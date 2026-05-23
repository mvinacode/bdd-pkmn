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
  const content  = $('journal-content');
  const empty    = $('journal-empty');
  const total    = $('journal-total');
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

// ── Modal d'édition ────────────────────────────────────────────

let _editSessionId = null;
let _editBall      = null;

function buildEditModal() {
  const overlay = document.createElement('div');
  overlay.id        = 'journal-edit-overlay';
  overlay.className = 'journal-modal-overlay';

  overlay.innerHTML = `
    <div class="journal-modal" role="dialog" aria-modal="true" aria-labelledby="jm-title">
      <div class="journal-modal-header">
        <img class="journal-modal-sprite" id="jm-sprite" src="" alt="" width="44" height="44">
        <span class="journal-modal-title" id="jm-title"></span>
        <button class="journal-modal-close" id="jm-close" aria-label="Fermer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="journal-modal-body">
        <div class="journal-modal-field">
          <label class="drawer-label">Ball</label>
          <div id="jm-ball-grid" class="ball-grid"></div>
        </div>
        <div class="journal-modal-field">
          <label class="drawer-label">Date</label>
          <input type="date" class="drawer-input" id="jm-date">
        </div>
        <div class="journal-modal-field">
          <label class="drawer-label">Jeu <span class="optional">(optionnel)</span></label>
          <input type="text" class="drawer-input" id="jm-game" placeholder="ex : Pokémon Écarlate">
        </div>
      </div>
      <div class="journal-modal-footer">
        <button class="journal-modal-save" id="jm-save">Sauvegarder</button>
        <button class="journal-modal-cancel" id="jm-cancel">Annuler</button>
        <button class="journal-modal-del" id="jm-del">Supprimer</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // Grille de balls (même rendu que le drawer)
  const ballGrid = $('jm-ball-grid');
  ballGrid.innerHTML = BALLS.map(b => `
    <button class="ball-opt" data-slug="${esc(b.slug)}" title="${esc(b.name)}">
      <img src="${esc(ballUrl(b.slug))}" alt="${esc(b.name)}" width="28" height="28">
      <span>${esc(b.name)}</span>
    </button>`).join('');
  ballGrid.querySelectorAll('.ball-opt').forEach(btn =>
    btn.addEventListener('click', () => {
      _editBall = BALLS.find(b => b.slug === btn.dataset.slug);
      ballGrid.querySelectorAll('.ball-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    })
  );

  const closeModal = () => { overlay.classList.remove('is-open'); _editSessionId = null; };

  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  $('jm-close').addEventListener('click', closeModal);
  $('jm-cancel').addEventListener('click', closeModal);

  $('jm-save').addEventListener('click', async () => {
    if (!_editSessionId) return;
    const ballEntry = _editBall;
    const date      = $('jm-date').value || null;
    const game      = $('jm-game').value.trim() || null;

    const btn = $('jm-save');
    btn.disabled    = true;
    btn.textContent = 'Sauvegarde…';

    const updates = {
      caught_at: date,
      game,
      ...(ballEntry ? { ball_name: ballEntry.name, ball_image_url: ballUrl(ballEntry.slug) } : {}),
    };

    const { error } = await updateCatchesBySession(_editSessionId, updates);
    btn.disabled    = false;
    btn.textContent = 'Sauvegarder';
    if (error) { alert('Erreur lors de la sauvegarde.'); return; }

    allCatches.forEach(c => {
      if ((c.session_id || String(c.id)) === _editSessionId) {
        c.caught_at = date;
        c.game      = game;
        if (ballEntry) { c.ball_name = ballEntry.name; c.ball_image_url = ballUrl(ballEntry.slug); }
      }
    });
    closeModal();
    render();
  });

  $('jm-del').addEventListener('click', async () => {
    if (!_editSessionId) return;
    const je   = document.querySelector(`.je[data-session-id="${_editSessionId}"]`);
    const name = je?.dataset.name || 'ce Pokémon';
    if (!confirm(`Supprimer cette capture de ${name} ?`)) return;

    const { error } = await deleteCatchesBySession(_editSessionId);
    if (error) { alert('Erreur lors de la suppression.'); return; }

    allCatches = allCatches.filter(c => (c.session_id || String(c.id)) !== _editSessionId);
    closeModal();
    render();
  });
}

function openEditModal(session) {
  _editSessionId = session.sessionId;

  const spriteSrc = session.sprite_url || spriteUrl(session.pokemon_number, session.forms.some(f => f.is_shiny));
  $('jm-sprite').src = spriteSrc;
  $('jm-sprite').alt = session.pokemon_name_fr;
  $('jm-title').textContent = `${session.pokemon_name_fr}  #${padNumber(session.pokemon_number)}`;

  _editBall = BALLS.find(b => b.name === session.ball_name) || BALLS[0];
  const ballGrid = $('jm-ball-grid');
  ballGrid.querySelectorAll('.ball-opt').forEach(b => b.classList.remove('selected'));
  if (_editBall) ballGrid.querySelector(`[data-slug="${_editBall.slug}"]`)?.classList.add('selected');

  $('jm-date').value = session.caught_at || '';
  $('jm-game').value = session.game || '';

  $('journal-edit-overlay').classList.add('is-open');
}

// ── Événements (délégation) ────────────────────────────────────

$('journal-content').addEventListener('click', e => {
  const editBtn = e.target.closest('.je-edit-btn');
  if (!editBtn) return;

  const je        = editBtn.closest('.je');
  const sessionId = je.dataset.sessionId;
  const session   = groupBySession(allCatches).find(s => s.sessionId === sessionId);
  if (session) openEditModal(session);
});

// ── Initialisation ─────────────────────────────────────────────

async function init() {
  buildEditModal();

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

initAuth().then(ok => { if (ok) init(); });
