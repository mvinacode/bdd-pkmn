import { store } from '../store.js';
import { esc, BALLS, ballUrl, spriteUrl } from '../utils.js';
import {
  SHINY_ICON_URL, BARON_ICON_URL, MEGA_ICON_URL, GIGAMAX_ICON_URL,
  ALOLA_FORM_VT, GALAR_FORM_VT, HISUI_FORM_VT, SPECIAL_FORM_VT,
  GENDER_GROUPS, GENDER_VTS_FLAT,
  padNumber, normalizeVariantUrl, formatCatchDateShort, typeBadge,
} from '../domain/constants.js';
import { getAlolanSprite, getGalarianSprite, getHisuianSprite, getSpecialFormSprite } from '../domain/sprites.js';

// Callback injecté par app.js pour éviter dépendance circulaire card ↔ modal
let _openModal = null;
export function setCardCallbacks({ openModal }) { _openModal = openModal; }

const SPECIAL_FORMS_ICONS = [
  { key: 'shiny',   icon: SHINY_ICON_URL,   variants: ['shiny','asexue_shiny','shiny_male','shiny_female','alolan_shiny','alolan_shiny_male','alolan_shiny_female','galarian_shiny','galarian_shiny_male','galarian_shiny_female','hisuian_shiny','hisuian_shiny_male','hisuian_shiny_female'] },
  { key: 'baron',   icon: BARON_ICON_URL,   variants: ['baron', 'shiny_baron'] },
  { key: 'mega',    icon: MEGA_ICON_URL,    variants: ['mega','mega_x','mega_y','shiny_mega','shiny_mega_x','shiny_mega_y'] },
  { key: 'gigamax', icon: GIGAMAX_ICON_URL, variants: ['gigamax','shiny_gigamax'] },
];

export function updateCardAfterCatch(pokemonNumber) {
  const grid = document.getElementById('pokemon-grid');
  if (!grid) return;
  const oldCard = grid.querySelector(`[data-number="${pokemonNumber}"]`);
  if (!oldCard) return;
  const pokemon = store.pokemon.find(p => p.number === pokemonNumber);
  if (!pokemon) return;
  oldCard.replaceWith(renderCard(pokemon, store.iconCache[pokemonNumber] || {}));
}

export function renderCard(pokemon, icons = {}) {
  const primaryType = pokemon.types?.[0] || '';
  const catch_  = store.catchByNumber[pokemon.number] || null;
  const isSeen  = store.seenSet.has(pokemon.number);
  const types   = (pokemon.types || []).map(typeBadge).join('');
  const cardState = catch_ ? 'caught' : isSeen ? 'seen' : 'unseen';

  const seenForms    = !catch_ && store.seenMap[pokemon.number] ? Object.values(store.seenMap[pokemon.number]) : [];
  const seenIsShiny  = seenForms.length > 0 && seenForms.every(f => f.is_shiny);
  const recentShinyCatch = store.shinyCatchByNumber[pokemon.number] || null;
  const isShinyDisplay   = recentShinyCatch ? true : (catch_ ? catch_.is_shiny : seenIsShiny);

  let imgSrc;
  if (isShinyDisplay) {
    const alolaVt   = ALOLA_FORM_VT[recentShinyCatch?.form_label];
    const galarVt   = GALAR_FORM_VT[recentShinyCatch?.form_label];
    const hisuiVt   = HISUI_FORM_VT[recentShinyCatch?.form_label];
    const specialVt = SPECIAL_FORM_VT[recentShinyCatch?.form_label];
    if (alolaVt) {
      const url = getAlolanSprite(pokemon.number, alolaVt);
      imgSrc = url ? normalizeVariantUrl(url) : spriteUrl(pokemon.number, true);
    } else if (galarVt) {
      const url = getGalarianSprite(pokemon.number, galarVt);
      imgSrc = url ? normalizeVariantUrl(url) : spriteUrl(pokemon.number, true);
    } else if (hisuiVt) {
      const url = getHisuianSprite(pokemon.number, hisuiVt);
      imgSrc = url ? normalizeVariantUrl(url) : spriteUrl(pokemon.number, true);
    } else if (specialVt) {
      imgSrc = getSpecialFormSprite(pokemon.number, specialVt) || spriteUrl(pokemon.number, true);
    } else {
      imgSrc = icons.shiny
        ? normalizeVariantUrl(icons.shiny)
        : (recentShinyCatch?.sprite_url || catch_?.sprite_url || seenForms[0]?.sprite_url || spriteUrl(pokemon.number, true));
    }
  } else {
    const alolaVt   = ALOLA_FORM_VT[catch_?.form_label];
    const galarVt   = GALAR_FORM_VT[catch_?.form_label];
    const hisuiVt   = HISUI_FORM_VT[catch_?.form_label];
    const specialVt = SPECIAL_FORM_VT[catch_?.form_label];
    if (alolaVt) {
      const url = getAlolanSprite(pokemon.number, alolaVt);
      imgSrc = url ? normalizeVariantUrl(url) : (icons.normal ? normalizeVariantUrl(icons.normal) : (catch_?.sprite_url || spriteUrl(pokemon.number, false)));
    } else if (galarVt) {
      const url = getGalarianSprite(pokemon.number, galarVt);
      imgSrc = url ? normalizeVariantUrl(url) : (icons.normal ? normalizeVariantUrl(icons.normal) : (catch_?.sprite_url || spriteUrl(pokemon.number, false)));
    } else if (hisuiVt) {
      const url = getHisuianSprite(pokemon.number, hisuiVt);
      imgSrc = url ? normalizeVariantUrl(url) : (icons.normal ? normalizeVariantUrl(icons.normal) : (catch_?.sprite_url || spriteUrl(pokemon.number, false)));
    } else if (specialVt) {
      imgSrc = getSpecialFormSprite(pokemon.number, specialVt) || catch_?.sprite_url || spriteUrl(pokemon.number, false);
    } else {
      imgSrc = icons.normal ? normalizeVariantUrl(icons.normal) : (catch_?.sprite_url || spriteUrl(pokemon.number, false));
    }
  }

  const seenFormsMap = store.seenMap[pokemon.number] || {};
  const formStatuses = SPECIAL_FORMS_ICONS.map(({ key, icon, variants }) => {
    const statuses = variants.map(vt => seenFormsMap[vt]?.status).filter(Boolean);
    let status = statuses.includes('owned') ? 'owned' : statuses.includes('seen') ? 'seen' : null;
    if (key === 'shiny' && catch_?.is_shiny) status = 'owned';
    return { key, icon, status };
  });
  const formIconsHtml = formStatuses
    .filter(({ status }) => !!status)
    .map(({ key, icon, status }) => `<img src="${esc(icon)}" alt="${key}" class="poke-form-icon poke-form-icon--${status}" width="18" height="18">`)
    .join('');
  const baronStatus  = formStatuses.find(f => f.key === 'baron')?.status;
  const shinyStatus  = formStatuses.find(f => f.key === 'shiny')?.status;
  const strictOk     = !window._strictComplete || (!!catch_ && shinyStatus === 'owned');

  const pokemonVMap  = store.variantMap[pokemon.number];

  const genderMode = window._genderFormsMode || 'none';
  const allSeenOwned = Object.entries(seenFormsMap).every(([vt, f]) =>
    (genderMode === 'any' && GENDER_VTS_FLAT.has(vt)) ? true : f.status === 'owned'
  );

  // Une capture shiny ne couvre la variante 'shiny' de base que si c'est un shiny
  // de la forme normale — un shiny régional/méga/gigamax/baron a sa propre variante
  const isBaseShinyCatch = c => !!c?.is_shiny
    && !ALOLA_FORM_VT[c.form_label] && !GALAR_FORM_VT[c.form_label]
    && !HISUI_FORM_VT[c.form_label] && !SPECIAL_FORM_VT[c.form_label]
    && !/^(Méga|Gigamax|Baron)/.test(c.form_label || '');

  const catchCoveredVts = new Set([
    ALOLA_FORM_VT[catch_?.form_label],
    ALOLA_FORM_VT[recentShinyCatch?.form_label],
    GALAR_FORM_VT[catch_?.form_label],
    GALAR_FORM_VT[recentShinyCatch?.form_label],
    HISUI_FORM_VT[catch_?.form_label],
    HISUI_FORM_VT[recentShinyCatch?.form_label],
    SPECIAL_FORM_VT[catch_?.form_label],
    SPECIAL_FORM_VT[recentShinyCatch?.form_label],
    ...(isBaseShinyCatch(catch_) || isBaseShinyCatch(recentShinyCatch) ? ['shiny'] : []),
  ].filter(Boolean));

  const TRACKED_VT = new Set([
    'shiny','asexue','asexue_shiny',
    'alolan','alolan_shiny',
    ...(genderMode !== 'any' ? ['alolan_male','alolan_female','alolan_shiny_male','alolan_shiny_female'] : []),
    'galarian','galarian_shiny',
    ...(genderMode !== 'any' ? ['galarian_male','galarian_female','galarian_shiny_male','galarian_shiny_female'] : []),
    'hisuian','hisuian_shiny',
    ...(genderMode !== 'any' ? ['hisuian_male','hisuian_female','hisuian_shiny_male','hisuian_shiny_female'] : []),
    'mega','mega_x','mega_y','shiny_mega','shiny_mega_x','shiny_mega_y',
    'gigamax','shiny_gigamax',
    'troizepy','troizepy_shiny',
    ...(genderMode === 'all' ? [...GENDER_VTS_FLAT].filter(vt => !vt.startsWith('alolan') && !vt.startsWith('galarian') && !vt.startsWith('hisuian')) : []),
  ]);

  const isVtOk = (vt) => {
    if (seenFormsMap[vt]?.status === 'owned' || catchCoveredVts.has(vt)) return true;
    if (vt === 'shiny')
      return seenFormsMap['shiny_male']?.status === 'owned' || catchCoveredVts.has('shiny_male')
          || seenFormsMap['shiny_female']?.status === 'owned' || catchCoveredVts.has('shiny_female');
    if (vt === 'alolan')
      return seenFormsMap['alolan_male']?.status === 'owned' || catchCoveredVts.has('alolan_male')
          || seenFormsMap['alolan_female']?.status === 'owned' || catchCoveredVts.has('alolan_female');
    if (vt === 'alolan_shiny')
      return seenFormsMap['alolan_shiny_male']?.status === 'owned' || catchCoveredVts.has('alolan_shiny_male')
          || seenFormsMap['alolan_shiny_female']?.status === 'owned' || catchCoveredVts.has('alolan_shiny_female');
    if (vt === 'galarian')
      return seenFormsMap['galarian_male']?.status === 'owned' || catchCoveredVts.has('galarian_male')
          || seenFormsMap['galarian_female']?.status === 'owned' || catchCoveredVts.has('galarian_female');
    if (vt === 'galarian_shiny')
      return seenFormsMap['galarian_shiny_male']?.status === 'owned' || catchCoveredVts.has('galarian_shiny_male')
          || seenFormsMap['galarian_shiny_female']?.status === 'owned' || catchCoveredVts.has('galarian_shiny_female');
    if (vt === 'hisuian')
      return seenFormsMap['hisuian_male']?.status === 'owned' || catchCoveredVts.has('hisuian_male')
          || seenFormsMap['hisuian_female']?.status === 'owned' || catchCoveredVts.has('hisuian_female');
    if (vt === 'hisuian_shiny')
      return seenFormsMap['hisuian_shiny_male']?.status === 'owned' || catchCoveredVts.has('hisuian_shiny_male')
          || seenFormsMap['hisuian_shiny_female']?.status === 'owned' || catchCoveredVts.has('hisuian_shiny_female');
    return false;
  };
  const allVariantsOwned = !pokemonVMap
    ? true
    : [...TRACKED_VT].filter(vt => vt in pokemonVMap).every(isVtOk);

  const genderGroupsOk = genderMode !== 'any' || GENDER_GROUPS.every(group => {
    const existsInGame = group.some(vt => (pokemonVMap && vt in pokemonVMap) || vt in seenFormsMap);
    if (!existsInGame) return true;
    return group.some(vt => seenFormsMap[vt]?.status === 'owned');
  });

  const hasHisuianForms = Object.keys(seenFormsMap).some(vt => vt.startsWith('hisuian'));
  const hisuiCanBeBaron = hasHisuianForms && !!store.regionalBaronMap[pokemon.number];
  const requiresBaronForComplete = pokemon.can_be_baron !== false || hisuiCanBeBaron;
  // Garde : au moins une forme réellement possédée (évite la complétion vacuuse sur vide)
  const hasAnyOwnedStatus = !!catch_ || Object.values(seenFormsMap).some(f => f.status === 'owned');
  const isComplete = hasAnyOwnedStatus && strictOk
    && (!requiresBaronForComplete
      ? allSeenOwned && allVariantsOwned && genderGroupsOk
      : baronStatus === 'owned' && allSeenOwned && (!window._requireAllFormsForComplete || (allVariantsOwned && genderGroupsOk)))
    && formStatuses.every(f => !f.status || f.status === 'owned');

  const card = document.createElement('article');
  card.className = 'poke-card poke-card--' + cardState
    + (isComplete ? ' poke-card--complete' : '');
  card.role = 'listitem';
  card.tabIndex = 0;
  card.dataset.number = pokemon.number;
  if (primaryType) card.dataset.primaryType = primaryType;
  if (pokemon.can_be_baron === false) card.dataset.canBeBaron = 'false';

  const catchBadgeHtml = catch_ ? (() => {
    const displayCatch = (isShinyDisplay && store.shinyCatchByNumber[pokemon.number]) ? store.shinyCatchByNumber[pokemon.number] : catch_;
    const ballEntry = BALLS.find(b => b.name === displayCatch.ball_name);
    const ballSrc   = ballEntry ? ballUrl(ballEntry.slug) : (displayCatch.ball_image_url || '');
    return `<div class="poke-catch-badge">
      <img class="poke-catch-ball-img" src="${esc(ballSrc)}" alt="${esc(displayCatch.ball_name)}" title="${esc(displayCatch.ball_name)}" width="22" height="22" loading="lazy">
      <span class="poke-catch-date-label">${esc(formatCatchDateShort(displayCatch.caught_at))}</span>
    </div>`;
  })() : '';

  const completionSparkles = isComplete ? `
    <span class="sparkle" style="top:3px;left:14px;color:#ff5050;--sparkle-delay:0s;--sparkle-size:0.85rem;--sparkle-dur:2.1s">✦</span>
    <span class="sparkle" style="top:2px;right:12px;color:#ffcc00;--sparkle-delay:0.7s;--sparkle-size:0.65rem;--sparkle-dur:1.8s">✦</span>
    <span class="sparkle" style="top:38%;right:2px;color:#44dd66;--sparkle-delay:1.4s;--sparkle-size:0.75rem;--sparkle-dur:2.4s">✦</span>
    <span class="sparkle" style="bottom:20px;left:4px;color:#4488ff;--sparkle-delay:0.4s;--sparkle-size:0.7rem;--sparkle-dur:2s">✦</span>
    <span class="sparkle" style="bottom:6px;right:14px;color:#cc44ff;--sparkle-delay:1.1s;--sparkle-size:0.8rem;--sparkle-dur:2.3s">✦</span>
    <span class="sparkle" style="top:28%;left:6px;color:#ff8800;--sparkle-delay:1.8s;--sparkle-size:0.6rem;--sparkle-dur:1.9s">✦</span>` : '';

  card.innerHTML = `
    ${completionSparkles}
    ${catchBadgeHtml}
    <div class="poke-number">#${esc(padNumber(pokemon.number))}</div>
    <div class="poke-image-wrapper">
      <img class="poke-image loading" src="${esc(imgSrc)}" alt="${esc(pokemon.name_fr)}" loading="lazy" decoding="async" width="60" height="60">
    </div>
    <div class="poke-name">${esc(pokemon.name_fr)}</div>
    <div class="poke-types">${types}</div>
    ${formIconsHtml ? `<div class="poke-form-icons">${formIconsHtml}</div>` : ''}
  `;

  const img = card.querySelector('.poke-image');
  img.addEventListener('load',  () => img.classList.replace('loading', 'loaded'));
  img.addEventListener('error', () => img.classList.replace('loading', 'loaded'));

  if (catch_ || isSeen) {
    card.addEventListener('click',   () => _openModal?.(pokemon.number));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') _openModal?.(pokemon.number); });
  }

  return card;
}

export function renderGrid(pokemons, append = false, iconMap = {}) {
  const grid       = document.getElementById('pokemon-grid');
  const emptyState = document.getElementById('empty-state');
  if (!append) grid.innerHTML = '';
  if (pokemons.length === 0 && !append) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  const frag = document.createDocumentFragment();
  pokemons.forEach(p => frag.appendChild(renderCard(p, iconMap[p.number] || {})));
  grid.appendChild(frag);
}
