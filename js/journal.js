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
    if (!c) continue;
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

// ── Entrées de formes (même logique que renderDrawerForms dans app.js) ────────

function buildFormEntries(variants, megas, iconMap) {
  const M26 = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
  const F26 = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
  const U26 = `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="26" height="26"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;
  const M20 = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
  const F20 = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
  const U20 = `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="20" height="20"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;
  const SH20   = `<img src="${_SHINY_URL}"   width="20" height="20" alt="">`;
  const BAR28  = `<img src="${_BARON_URL}"   width="28" height="28" alt="">`;
  const BAR22  = `<img src="${_BARON_URL}"   width="22" height="22" alt="">`;
  const MEGA28 = `<img src="${_MEGA_URL}"    width="28" height="28" alt="">`;
  const MEGA22 = `<img src="${_MEGA_URL}"    width="22" height="22" alt="">`;
  const GMAX28 = `<img src="${_GIGAMAX_URL}" width="28" height="28" alt="">`;
  const GMAX22 = `<img src="${_GIGAMAX_URL}" width="22" height="22" alt="">`;

  const maleV      = variants.find(v => v.variant_type === 'male');
  const femaleV    = variants.find(v => v.variant_type === 'female');
  const gmaxV      = variants.find(v => v.variant_type === 'gigamax');
  const gmaxShinyV = variants.find(v => v.variant_type === 'shiny_gigamax');

  const entries = [
    { label: 'Mâle',          variant_type: 'male',         iconHtml: M26,            sprite: maleV?.image_url   || iconMap.normal || null },
    { label: 'Mâle Shiny',    variant_type: 'shiny_male',   iconHtml: M20 + SH20,     sprite: iconMap.shiny  || null },
    { label: 'Femelle',       variant_type: 'female',       iconHtml: F26,            sprite: femaleV?.image_url || iconMap.normal || null },
    { label: 'Femelle Shiny', variant_type: 'shiny_female', iconHtml: F20 + SH20,     sprite: iconMap.shiny  || null },
    { label: 'Unisexe',       variant_type: 'normal',       iconHtml: U26,            sprite: iconMap.normal || null },
    { label: 'Unisexe Shiny', variant_type: 'shiny',        iconHtml: U20 + SH20,     sprite: iconMap.shiny  || null },
    { label: 'Baron',         variant_type: 'baron',        iconHtml: BAR28,          sprite: iconMap.normal || null },
    { label: 'Baron Shiny',   variant_type: 'shiny_baron',  iconHtml: BAR22 + SH20,   sprite: iconMap.normal || null },
  ];

  const megasWithImg = megas.filter(m => m.image_url);
  if (megasWithImg.length > 0) {
    for (const m of megasWithImg) {
      const vt      = m.name?.toLowerCase().includes(' x') ? 'mega_x'
                    : m.name?.toLowerCase().includes(' y') ? 'mega_y' : 'mega';
      const vtShiny = vt === 'mega_x' ? 'shiny_mega_x' : vt === 'mega_y' ? 'shiny_mega_y' : 'shiny_mega';
      const label   = vt === 'mega_x' ? 'Méga-Évo. X' : vt === 'mega_y' ? 'Méga-Évo. Y' : 'Méga-Évolution';
      entries.push({ label,                 variant_type: vt,      iconHtml: MEGA28,           sprite: m.image_url });
      entries.push({ label: label+' Shiny', variant_type: vtShiny, iconHtml: MEGA22 + SH20,    sprite: null });
    }
  } else {
    entries.push({ label: 'Méga-Évolution',       variant_type: 'mega',       iconHtml: MEGA28,        sprite: null });
    entries.push({ label: 'Méga-Évolution Shiny', variant_type: 'shiny_mega', iconHtml: MEGA22 + SH20, sprite: null });
  }

  entries.push({ label: 'Gigamax',       variant_type: 'gigamax',       iconHtml: GMAX28,        sprite: gmaxV?.image_url      || null });
  entries.push({ label: 'Gigamax Shiny', variant_type: 'shiny_gigamax', iconHtml: GMAX22 + SH20, sprite: gmaxShinyV?.image_url || null });

  return entries;
}

// ── Modal d'édition ────────────────────────────────────────────

let _editSessionId   = null;
let _editBall        = null;
let _formEntries     = [];
let _editSessionForms = [];

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
          <label class="drawer-label">Forme(s)</label>
          <div id="jm-form-grid" class="form-grid"></div>
        </div>
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

  // Grille de balls
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

    const formGrid      = $('jm-form-grid');
    const selectedBtns  = [...formGrid.querySelectorAll('.form-opt.selected')];
    if (_formEntries.length > 0 && selectedBtns.length === 0) {
      alert('Sélectionne au moins une forme.');
      return;
    }

    const ballEntry = _editBall;
    const date      = $('jm-date').value || null;
    const game      = $('jm-game').value.trim() || null;

    const btn = $('jm-save');
    btn.disabled    = true;
    btn.textContent = 'Sauvegarde…';

    // 1. Mettre à jour ball / date / jeu sur tous les records de la session
    const updates = {
      caught_at: date,
      game,
      ...(ballEntry ? { ball_name: ballEntry.name, ball_image_url: ballUrl(ballEntry.slug) } : {}),
    };
    const { error } = await updateCatchesBySession(_editSessionId, updates);
    if (error) {
      alert('Erreur lors de la sauvegarde.');
      btn.disabled    = false;
      btn.textContent = 'Sauvegarder';
      return;
    }
    allCatches.forEach(c => {
      if (c && (c.session_id || String(c.id)) === _editSessionId) {
        c.caught_at = date;
        c.game      = game;
        if (ballEntry) { c.ball_name = ballEntry.name; c.ball_image_url = ballUrl(ballEntry.slug); }
      }
    });

    // 2. Synchroniser les formes (diff ajout / suppression)
    if (_formEntries.length > 0) {
      const selectedEntries = selectedBtns.map(b => _formEntries[parseInt(b.dataset.idx)]);
      const origLabels      = new Set(_editSessionForms.map(f => f.form_label));
      const selLabels       = new Set(selectedEntries.map(e => e.label));

      // Supprimer les formes désélectionnées
      for (const form of _editSessionForms) {
        if (selLabels.has(form.form_label)) continue;
        const rec = allCatches.find(c =>
          c && (c.session_id || String(c.id)) === _editSessionId && c.form_label === form.form_label
        );
        if (rec) {
          const { error: de } = await deleteCatch(rec.id);
          if (!de) allCatches = allCatches.filter(c => c && c.id !== rec.id);
        }
      }

      // Insérer les nouvelles formes sélectionnées
      const base = allCatches.find(c => c && (c.session_id || String(c.id)) === _editSessionId);
      if (base) {
        for (const entry of selectedEntries) {
          if (origLabels.has(entry.label)) continue;
          const isShiny = entry.variant_type.includes('shiny');
          const { data: newRec, error: ie } = await insertCatch({
            owner_uuid:      getOwnerUuid(),
            pokemon_number:  base.pokemon_number,
            pokemon_name_fr: base.pokemon_name_fr,
            is_shiny:        isShiny,
            sprite_url:      entry.sprite || spriteUrl(base.pokemon_number, isShiny),
            ball_name:       (ballEntry ?? { name: base.ball_name }).name,
            ball_image_url:  ballEntry ? ballUrl(ballEntry.slug) : base.ball_image_url,
            caught_at:       date,
            game,
            notes:           base.notes,
            form_label:      entry.label,
            session_id:      _editSessionId,
          });
          if (!ie && newRec) allCatches.push(newRec);
        }
      }
    }

    btn.disabled    = false;
    btn.textContent = 'Sauvegarder';
    closeModal();
    render();
  });

  $('jm-del').addEventListener('click', async () => {
    if (!_editSessionId) return;
    const je   = document.querySelector(`.je[data-session-id="${_editSessionId}"]`);
    const name = je?.dataset.name || 'ce Pokémon';
    if (!confirm(`Supprimer cette capture de ${name} ?`)) return;

    // Récupère le numéro avant suppression
    const sessionCatches = allCatches.filter(c => c && (c.session_id || String(c.id)) === _editSessionId);
    const pokemonNumber  = sessionCatches[0]?.pokemon_number;

    let deleteError = null;
    for (const c of sessionCatches) {
      const { error: de } = await deleteCatch(c.id);
      if (de) { deleteError = de; break; }
    }
    if (deleteError) { alert('Erreur lors de la suppression.'); return; }

    allCatches = allCatches.filter(c => c && (c.session_id || String(c.id)) !== _editSessionId);

    // Si c'était la dernière session pour ce Pokémon, nettoyer pokemon_seen
    // (évite l'icône NB résiduelle sur la page principale)
    if (pokemonNumber) {
      const stillHasCatch = allCatches.some(c => c && c.pokemon_number === pokemonNumber);
      if (!stillHasCatch) {
        await deleteAllSeenForPokemon(getOwnerUuid(), pokemonNumber);
      }
    }

    closeModal();
    render();
  });
}

async function loadModalFormGrid(session) {
  const formGrid = $('jm-form-grid');
  formGrid.innerHTML = '<span style="font-size:0.75rem;color:var(--text-muted);padding:4px 0">Chargement…</span>';

  const [variantData, megaData] = await Promise.all([
    fetchVariants(session.pokemon_number).catch(() => []),
    fetchMegaEvolutions([session.pokemon_number]).catch(() => []),
  ]);

  const iconMap = {
    normal: session.sprite_url || spriteUrl(session.pokemon_number, false),
    shiny:  spriteUrl(session.pokemon_number, true),
  };

  _formEntries      = buildFormEntries(variantData, megaData, iconMap);
  _editSessionForms = [...session.forms];

  const selectedLabels = new Set(session.forms.map(f => f.form_label));

  formGrid.innerHTML = _formEntries.map((e, i) => `
    <button class="form-opt${selectedLabels.has(e.label) ? ' selected' : ''}" data-idx="${i}" title="${esc(e.label)}">
      <div class="form-opt-icon">${e.iconHtml}</div>
      <span>${esc(e.label)}</span>
    </button>`).join('');

  formGrid.querySelectorAll('.form-opt').forEach(btn =>
    btn.addEventListener('click', () => btn.classList.toggle('selected'))
  );
}

function openEditModal(session) {
  _editSessionId   = session.sessionId;
  _formEntries     = [];
  _editSessionForms = [];

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
  loadModalFormGrid(session);
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
