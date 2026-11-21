import { store } from '../store.js';
import { esc, BALLS, ballUrl, spriteUrl } from '../utils.js';
import {
  SHINY_ICON_URL, BARON_ICON_URL, MEGA_ICON_URL, GIGAMAX_ICON_URL,
  ALOLA_FORM_VT, GALAR_FORM_VT, HISUI_FORM_VT, SPECIAL_FORM_VT, PALDEAN_FORM_VT, PALDEA_FORM_VT,
  padNumber, normalizeVariantUrl, formatCatchDateShort, typeBadge,
} from '../domain/constants.js';
import { computeCardCompletion } from '../domain/card-completion.js';
import { getAlolanSprite, getGalarianSprite, getHisuianSprite, getPaldeanSprite, getSpecialFormSprite } from '../domain/sprites.js';

// Callback injecté par app.js pour éviter dépendance circulaire card ↔ modal
let _openModal = null;
export function setCardCallbacks({ openModal }) { _openModal = openModal; }

const FORM_BADGE_ICONS = {
  shiny: SHINY_ICON_URL, baron: BARON_ICON_URL, mega: MEGA_ICON_URL, gigamax: GIGAMAX_ICON_URL,
};

// Quand la carte représente une forme régionale capturée (Alola/Galar/Hisui),
// renvoie la liste de ses types (depuis store.regionalFormsMap) plutôt que ceux
// de la forme de base. Retourne null si la forme affichée n'est pas régionale.
function regionalTypesFor(pokemonNumber, formLabel) {
  const vt = ALOLA_FORM_VT[formLabel] || GALAR_FORM_VT[formLabel] || HISUI_FORM_VT[formLabel] || PALDEA_FORM_VT[formLabel];
  if (!vt) return null;
  const region = vt.split('_')[0]; // 'alolan' | 'galarian' | 'hisuian' | 'paldean'
  const form = (store.regionalFormsMap?.[pokemonNumber] || []).find(f => f.region === region);
  if (!form?.types) return null;
  const list = form.types.split(',').map(t => t.trim()).filter(Boolean);
  return list.length ? list : null;
}

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
  const catch_  = store.catchByNumber[pokemon.number] || null;
  const isSeen  = store.seenSet.has(pokemon.number);
  const cardState = catch_ ? 'caught' : isSeen ? 'seen' : 'unseen';

  const seenForms    = !catch_ && store.seenMap[pokemon.number] ? Object.values(store.seenMap[pokemon.number]) : [];
  const seenIsShiny  = seenForms.length > 0 && seenForms.every(f => f.is_shiny);
  const recentShinyCatch = store.shinyCatchByNumber[pokemon.number] || null;
  const isShinyDisplay   = recentShinyCatch ? true : (catch_ ? catch_.is_shiny : seenIsShiny);

  // Types & couleur d'accent alignés sur la forme réellement affichée : si c'est
  // une forme régionale capturée, on prend ses types plutôt que ceux de base.
  const displayFormLabel = isShinyDisplay ? recentShinyCatch?.form_label : catch_?.form_label;
  const typeList    = regionalTypesFor(pokemon.number, displayFormLabel) || pokemon.types || [];
  const primaryType = typeList[0] || '';
  const types       = typeList.map(typeBadge).join('');

  let imgSrc;
  if (isShinyDisplay) {
    const alolaVt   = ALOLA_FORM_VT[recentShinyCatch?.form_label];
    const galarVt   = GALAR_FORM_VT[recentShinyCatch?.form_label];
    const hisuiVt   = HISUI_FORM_VT[recentShinyCatch?.form_label];
    const paldeanVt = PALDEAN_FORM_VT[recentShinyCatch?.form_label];
    const paldeaRegVt = PALDEA_FORM_VT[recentShinyCatch?.form_label];
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
    } else if (paldeanVt || paldeaRegVt) {
      const url = getPaldeanSprite(pokemon.number, paldeanVt || paldeaRegVt);
      imgSrc = url ? normalizeVariantUrl(url) : (recentShinyCatch?.sprite_url || catch_?.sprite_url || spriteUrl(pokemon.number, true));
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
    const paldeanVt = PALDEAN_FORM_VT[catch_?.form_label];
    const paldeaRegVt = PALDEA_FORM_VT[catch_?.form_label];
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
    } else if (paldeanVt || paldeaRegVt) {
      // Race de Paldea (Tauros) ou forme régionale Paldea genrée (Axoloto) : on veut
      // le sprite de la forme Paldea, jamais le sprite normal (icons.normal).
      const url = getPaldeanSprite(pokemon.number, paldeanVt || paldeaRegVt);
      imgSrc = url ? normalizeVariantUrl(url) : (catch_?.sprite_url || spriteUrl(pokemon.number, false));
    } else if (specialVt) {
      imgSrc = getSpecialFormSprite(pokemon.number, specialVt) || catch_?.sprite_url || spriteUrl(pokemon.number, false);
    } else {
      imgSrc = icons.normal ? normalizeVariantUrl(icons.normal) : (catch_?.sprite_url || spriteUrl(pokemon.number, false));
    }
  }

  const { formStatuses, isComplete } = computeCardCompletion({
    canBeBaron:       pokemon.can_be_baron,
    latestCatch:      catch_,
    latestShinyCatch: recentShinyCatch,
    seenForms:        store.seenMap[pokemon.number] || {},
    variants:         store.variantMap[pokemon.number],
    hasRegionalBaron: !!store.regionalBaronMap[pokemon.number],
    prefs:            store.prefs,
  });
  const formIconsHtml = formStatuses
    .filter(({ status }) => !!status)
    .map(({ key, status }) => `<img src="${esc(FORM_BADGE_ICONS[key])}" alt="${key}" class="poke-form-icon poke-form-icon--${status}" width="18" height="18">`)
    .join('');

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
