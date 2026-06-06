import { store } from '../store.js';
import { esc, BALLS, ballUrl, spriteUrl } from '../utils.js';
import {
  MEGA_ICON_URL, GIGAMAX_ICON_URL, SHINY_ICON_URL, BARON_ICON_URL,
  VARIANT_STATUS_META, ALOLA_FORM_VT, GALAR_FORM_VT, HISUI_FORM_VT, SPECIAL_FORM_VT,
  padNumber, normalizeVariantUrl, formatCatchDate, getImageUrl, toRoman, typeBadge, debounce,
} from '../domain/constants.js';
import { getVariantStatus } from '../domain/completion.js';
import { cycleVariantStatus, removeFormFromSeen } from '../application/catches.js';
import {
  fetchPokemonByNumber, fetchEvolutionChain, fetchForms, fetchVariants, fetchGigamax,
  fetchSpecialFormsByNumber, fetchMegaEvolutions, fetchVariantIcons, fetchGigamaxForChain,
  fetchGigamaxVariantIcons, fetchRegionalForms, deleteCatch,
} from '../supabase-client.js';
import { buildEvolutionHtml, collectTreeNumbers } from './evolution.js?v=178';

// Callbacks injectés par app.js pour éviter circulaire
let _updateCardAfterCatch = null;
let _openDrawerWithPokemon = null;
export function setModalCallbacks({ updateCardAfterCatch, openDrawerWithPokemon }) {
  _updateCardAfterCatch    = updateCardAfterCatch;
  _openDrawerWithPokemon   = openDrawerWithPokemon;
}

const MODAL_MALE_SVG   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
const MODAL_FEMALE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
const MODAL_ASEXUE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" width="16" height="16" aria-hidden="true"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;

function seenFormIcon(vt, sfMap = {}) {
  const S = 14;
  const male      = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="${S}" height="${S}"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
  const female    = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="${S}" height="${S}"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
  const shiny     = `<img src="${SHINY_ICON_URL}"   width="${S}" height="${S}" alt="Shiny">`;
  const mega      = `<img src="${MEGA_ICON_URL}"    width="${S}" height="${S}" alt="Méga">`;
  const gmax      = `<img src="${GIGAMAX_ICON_URL}" width="${S}" height="${S}" alt="Gigamax">`;
  const baron     = `<img src="${BARON_ICON_URL}"   width="${S}" height="${S}" alt="Baron">`;
  const genderless= `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="${S}" height="${S}"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;
  switch (vt) {
    case 'normal':        return genderless;
    case 'asexue':        return genderless;
    case 'male':          return male;
    case 'female':        return female;
    case 'shiny':         return genderless + shiny;
    case 'asexue_shiny':  return genderless + shiny;
    case 'shiny_male':    return male + shiny;
    case 'shiny_female':  return female + shiny;
    case 'mega': case 'mega_x': case 'mega_y': return mega;
    case 'shiny_mega': case 'shiny_mega_x': case 'shiny_mega_y': return mega + shiny;
    case 'gigamax':       return gmax;
    case 'shiny_gigamax': return gmax + shiny;
    case 'baron':         return baron;
    case 'shiny_baron':   return baron + shiny;
    case 'alolan':              return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">Alola</span>`;
    case 'alolan_shiny':        return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">Alola</span>` + shiny;
    case 'alolan_male':         return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">A</span>` + male;
    case 'alolan_shiny_male':   return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">A</span>` + male + shiny;
    case 'alolan_female':       return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">A</span>` + female;
    case 'alolan_shiny_female': return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">A</span>` + female + shiny;
    case 'galarian':              return `<span style="font-size:0.7rem;font-weight:600;color:#ce93d8">Galar</span>`;
    case 'galarian_shiny':        return `<span style="font-size:0.7rem;font-weight:600;color:#ce93d8">Galar</span>` + shiny;
    case 'galarian_male':         return `<span style="font-size:0.7rem;font-weight:600;color:#ce93d8">G</span>` + male;
    case 'galarian_shiny_male':   return `<span style="font-size:0.7rem;font-weight:600;color:#ce93d8">G</span>` + male + shiny;
    case 'galarian_female':       return `<span style="font-size:0.7rem;font-weight:600;color:#ce93d8">G</span>` + female;
    case 'galarian_shiny_female': return `<span style="font-size:0.7rem;font-weight:600;color:#ce93d8">G</span>` + female + shiny;
    case 'hisuian':              return `<span style="font-size:0.7rem;font-weight:600;color:#c4934c">Hisui</span>`;
    case 'hisuian_shiny':        return `<span style="font-size:0.7rem;font-weight:600;color:#c4934c">Hisui</span>` + shiny;
    case 'hisuian_male':         return `<span style="font-size:0.7rem;font-weight:600;color:#c4934c">H</span>` + male;
    case 'hisuian_shiny_male':   return `<span style="font-size:0.7rem;font-weight:600;color:#c4934c">H</span>` + male + shiny;
    case 'hisuian_female':       return `<span style="font-size:0.7rem;font-weight:600;color:#c4934c">H</span>` + female;
    case 'hisuian_shiny_female': return `<span style="font-size:0.7rem;font-weight:600;color:#c4934c">H</span>` + female + shiny;
    case 'troizepy':       return female + `<span style="font-size:0.7rem;font-weight:600;color:#c4a747">T</span>`;
    case 'troizepy_shiny': return female + `<span style="font-size:0.7rem;font-weight:600;color:#c4a747">T</span>` + shiny;
    default: {
      const sfEntry = Object.values(sfMap).flatMap(m => Object.values(m)).find(f => f.form_key === vt || (f.form_key + '_shiny') === vt);
      const sfLabel = sfEntry ? sfEntry.form_label_fr + (vt.endsWith('_shiny') ? ' Shiny' : '') : vt;
      return `<span style="font-size:0.7rem;font-weight:600;color:var(--text-muted)">${esc(sfLabel)}</span>`;
    }
  }
}

export async function openModal(number) {
  const modalOverlay = document.getElementById('modal-overlay');
  const modal        = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modalOverlay || !modal || !modalContent) return;

  store.currentModalPokemonNumber = number;
  modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  modalContent.innerHTML = '<div class="modal-loading"><div class="pokeball-loader"><div class="pb-top"></div><div class="pb-middle"><div class="pb-btn"></div></div><div class="pb-bottom"></div></div></div>';

  try {
    const [{ data: p }, , forms, variants, gigamax, specialFormsList] = await Promise.all([
      fetchPokemonByNumber(number),
      fetchEvolutionChain({ number, evolves_from_number: null }).catch(() => null),
      fetchForms(number),
      fetchVariants(number),
      fetchGigamax(number),
      fetchSpecialFormsByNumber(number).catch(() => []),
    ]);

    if (!p) { closeModal(); return; }

    const realEvoTree = await fetchEvolutionChain(p).catch(() => null);
    const treeNumbers = collectTreeNumbers(realEvoTree);
    const [megaRows, iconRows, gigamaxChainRows, gigamaxIconRows, regionalRows] = await Promise.all([
      fetchMegaEvolutions(treeNumbers).catch(() => []),
      fetchVariantIcons(treeNumbers).catch(() => []),
      fetchGigamaxForChain(treeNumbers).catch(() => []),
      fetchGigamaxVariantIcons(treeNumbers).catch(() => []),
      fetchRegionalForms(treeNumbers).catch(() => []),
    ]);
    const megasByNumber = {};
    for (const m of megaRows) {
      if (!megasByNumber[m.pokemon_number]) megasByNumber[m.pokemon_number] = [];
      megasByNumber[m.pokemon_number].push(m);
    }
    const regionalsByNumber = {};
    for (const r of regionalRows) {
      if (!regionalsByNumber[r.pokemon_number]) regionalsByNumber[r.pokemon_number] = [];
      regionalsByNumber[r.pokemon_number].push(r);
    }
    const gigamaxSpriteMap = Object.fromEntries(gigamaxIconRows.map(r => [r.pokemon_number, r.image_url]));
    const gigamaxByNumber  = {};
    for (const g of gigamaxChainRows) {
      if (!gigamaxByNumber[g.pokemon_number]) gigamaxByNumber[g.pokemon_number] = [];
      gigamaxByNumber[g.pokemon_number].push({ ...g, sprite_url: gigamaxSpriteMap[g.pokemon_number] || null });
    }
    const iconByNumber = Object.fromEntries(iconRows.map(r => [r.pokemon_number, r.image_url]));

    const captured  = !!store.catchByNumber[p.number];
    const catch_    = store.catchByNumber[p.number] || null;
    const ballEntry = catch_ ? BALLS.find(b => b.name === catch_.ball_name) : null;
    const ballSrc   = ballEntry ? ballUrl(ballEntry.slug) : (catch_?.ball_image_url || '');
    const seenForms = store.seenMap[p.number] ? Object.values(store.seenMap[p.number]) : [];

    const sfMap = store.specialFormsMap;

    const seenStatusHtml = seenForms.length ? `
      <div class="collect-banner collect-banner--seen">
        <div class="collect-banner__seen-inner">
          <div class="collect-banner__seen-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="13" height="13"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
            Vus dans ta collection
          </div>
          <div class="collect-banner__seen-chips">
            ${seenForms.map(s => `
              <div class="seen-pill-v2${s.is_shiny ? ' seen-pill-v2--shiny' : ''}">
                <span class="seen-pill-v2__icon">${seenFormIcon(s.variant_type, sfMap)}</span>
                ${s.caught_at ? `<span class="seen-pill-v2__date">${esc(formatCatchDate(s.caught_at))}</span>` : ''}
                ${s.game ? `<span class="seen-pill-v2__game">${esc(s.game)}</span>` : ''}
                <button class="seen-pill-v2__del modal-unsee-btn" data-pokemon-number="${p.number}" data-variant-type="${esc(s.variant_type)}" aria-label="Retirer des vus">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="9" height="9"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>`).join('')}
          </div>
        </div>
      </div>` : '';

    const ownedForms = store.seenMap[p.number]
      ? Object.values(store.seenMap[p.number]).filter(f => f.status === 'owned')
      : [];
    const captureIcons = ownedForms.length
      ? ownedForms.map(f => seenFormIcon(f.variant_type, sfMap)).join('')
      : (() => {
          if (catch_?.is_shiny) return seenFormIcon('shiny', sfMap);
          const fl = (catch_?.form_label || '').toLowerCase();
          if (fl.includes('mâle') || fl.includes('male'))     return seenFormIcon('male', sfMap);
          if (fl.includes('femelle') || fl.includes('female')) return seenFormIcon('female', sfMap);
          return seenFormIcon('normal', sfMap);
        })();

    const capturePills = (ownedForms.length ? ownedForms : [{
      variant_type: catch_?.is_shiny ? 'shiny' : 'normal',
      is_shiny:     catch_?.is_shiny || false,
      caught_at:    catch_?.caught_at || null,
      game:         catch_?.game     || null,
    }]).map(f => `
      <div class="seen-pill-v2${f.is_shiny ? ' seen-pill-v2--shiny' : ''}">
        <span class="seen-pill-v2__icon">${seenFormIcon(f.variant_type, sfMap)}</span>
        ${f.caught_at ? `<span class="seen-pill-v2__date">${esc(formatCatchDate(f.caught_at))}</span>` : ''}
        ${f.game ? `<span class="seen-pill-v2__game">${esc(f.game)}</span>` : ''}
        <button class="seen-pill-v2__del modal-capture-del" data-pokemon-number="${p.number}" data-variant-type="${esc(f.variant_type)}" data-catch-id="${esc(catch_?.id ?? '')}" aria-label="Retirer cette capture">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="9" height="9"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>`).join('');

    const collectStatusHtml = catch_ ? `
      <div class="collect-banner">
        <div class="collect-banner__ball">
          <img src="${esc(ballSrc)}" width="42" height="42" alt="${esc(catch_.ball_name)}">
        </div>
        <div class="collect-banner__seen-inner">
          <div class="collect-banner__seen-label">${esc(catch_.ball_name)}</div>
          <div class="collect-banner__seen-chips">${capturePills}</div>
        </div>
      </div>` : seenStatusHtml;

    const imgSrc  = p.image_url || getImageUrl(p.number);
    const types   = (p.types || []).map(typeBadge).join('');
    const evoHtml = buildEvolutionHtml(realEvoTree, p.number, megasByNumber, iconByNumber, gigamaxByNumber, regionalsByNumber);

    function variantCard(v) {
      const status  = getVariantStatus(p.number, v.variant_type);
      const meta    = VARIANT_STATUS_META[status];
      const isShiny = ['shiny','shiny_male','shiny_female','shiny_mega','shiny_mega_x','shiny_mega_y','shiny_gigamax','alolan_shiny','alolan_shiny_male','alolan_shiny_female','galarian_shiny','galarian_shiny_male','galarian_shiny_female','hisuian_shiny','hisuian_shiny_male','hisuian_shiny_female','troizepy_shiny'].includes(v.variant_type);
      const sparkles = isShiny ? `
        <span class="sparkle" style="top:-8px;left:18px;--sparkle-delay:0s;--sparkle-size:0.9rem;--sparkle-dur:2.2s">✦</span>
        <span class="sparkle" style="top:6px;right:-8px;--sparkle-delay:0.55s;--sparkle-size:0.65rem;--sparkle-dur:1.9s">✦</span>
        <span class="sparkle" style="top:50%;right:-9px;--sparkle-delay:1.1s;--sparkle-size:0.8rem;--sparkle-dur:2.5s">✦</span>
        <span class="sparkle" style="bottom:18px;left:-9px;--sparkle-delay:0.8s;--sparkle-size:0.7rem;--sparkle-dur:2s">✦</span>
        <span class="sparkle" style="bottom:-7px;left:38px;--sparkle-delay:1.5s;--sparkle-size:0.85rem;--sparkle-dur:2.3s">✦</span>` : '';
      return `
        <div class="variant-card" data-type="${esc(v.variant_type)}" data-status="${status}">
          ${sparkles}
          <div class="variant-img-wrap">
            <img src="${esc(normalizeVariantUrl(v.image_url))}" alt="${esc(v.label)}" loading="lazy">
          </div>
          <span class="variant-label">${esc(v.label)}</span>
          <button class="variant-status ${meta.cls}" data-pkmn="${p.number}" data-variant="${esc(v.variant_type)}">
            ${esc(meta.label)}
          </button>
        </div>`;
    }

    function sfVariantCard(sf, isShiny) {
      const vt     = isShiny ? sf.form_key + '_shiny' : sf.form_key;
      const label  = isShiny ? 'Shiny' : sf.form_label_fr;
      const iSrc   = isShiny
        ? (sf.image_url_shiny ? normalizeVariantUrl(sf.image_url_shiny) : spriteUrl(p.number, true))
        : (sf.image_url       ? normalizeVariantUrl(sf.image_url)       : spriteUrl(p.number, false));
      const status = getVariantStatus(p.number, vt);
      const meta   = VARIANT_STATUS_META[status];
      const sparkles = isShiny ? `
        <span class="sparkle" style="top:-8px;left:18px;--sparkle-delay:0s;--sparkle-size:0.9rem;--sparkle-dur:2.2s">✦</span>
        <span class="sparkle" style="top:6px;right:-8px;--sparkle-delay:0.55s;--sparkle-size:0.65rem;--sparkle-dur:1.9s">✦</span>
        <span class="sparkle" style="top:50%;right:-9px;--sparkle-delay:1.1s;--sparkle-size:0.8rem;--sparkle-dur:2.5s">✦</span>
        <span class="sparkle" style="bottom:18px;left:-9px;--sparkle-delay:0.8s;--sparkle-size:0.7rem;--sparkle-dur:2s">✦</span>
        <span class="sparkle" style="bottom:-7px;left:38px;--sparkle-delay:1.5s;--sparkle-size:0.85rem;--sparkle-dur:2.3s">✦</span>` : '';
      return `
        <div class="variant-card${isShiny ? ' variant-card--shiny' : ''}" data-type="${esc(vt)}" data-status="${status}">
          ${sparkles}
          <div class="variant-img-wrap"><img src="${esc(iSrc)}" alt="${esc(label)}" loading="lazy"></div>
          <span class="variant-label">${esc(label)}</span>
          <button class="variant-status ${meta.cls}" data-pkmn="${p.number}" data-variant="${esc(vt)}">${esc(meta.label)}</button>
        </div>`;
    }

    function variantRow(badge, subset) {
      if (!subset.length) return '';
      return `<div class="variants-row">
        <div class="variants-gender-col">${badge}</div>
        <div class="variants-grid">${subset.map(variantCard).join('')}</div>
      </div>`;
    }

    function regionalVariantRows(prefix, allVariants) {
      const neutral = allVariants.filter(v => [prefix, `${prefix}_shiny`].includes(v.variant_type));
      const male    = allVariants.filter(v => [`${prefix}_male`, `${prefix}_shiny_male`].includes(v.variant_type));
      const female  = allVariants.filter(v => [`${prefix}_female`, `${prefix}_shiny_female`].includes(v.variant_type));
      return [
        variantRow(neutralBadge, neutral),
        variantRow(maleBadge,    male),
        variantRow(femaleBadge,  female),
      ].join('');
    }

    const neutralVariants  = variants.filter(v => ['normal', 'shiny'].includes(v.variant_type));
    const asexueVariants   = variants.filter(v => ['asexue', 'asexue_shiny'].includes(v.variant_type));
    const maleVariants     = variants.filter(v => ['male', 'shiny_male'].includes(v.variant_type));
    const femaleVariants   = variants.filter(v => ['female', 'shiny_female'].includes(v.variant_type));
    const megaVariants     = variants.filter(v => ['mega', 'shiny_mega', 'mega_x', 'shiny_mega_x'].includes(v.variant_type));
    const megaYVariants    = variants.filter(v => ['mega_y', 'shiny_mega_y'].includes(v.variant_type));
    const gigamaxVariants  = variants.filter(v => ['gigamax', 'shiny_gigamax'].includes(v.variant_type));
    const alolanVariants   = variants.filter(v => ['alolan', 'alolan_shiny', 'alolan_male', 'alolan_shiny_male', 'alolan_female', 'alolan_shiny_female'].includes(v.variant_type));
    const galarianVariants = variants.filter(v => ['galarian', 'galarian_shiny', 'galarian_male', 'galarian_shiny_male', 'galarian_female', 'galarian_shiny_female'].includes(v.variant_type));
    const hisuianVariants  = variants.filter(v => ['hisuian', 'hisuian_shiny', 'hisuian_male', 'hisuian_shiny_male', 'hisuian_female', 'hisuian_shiny_female'].includes(v.variant_type));
    const troizepyVariants = variants.filter(v => ['troizepy', 'troizepy_shiny'].includes(v.variant_type));

    const neutralBadge = `<span class="gender-badge male">${MODAL_MALE_SVG}</span><span class="gender-badge female">${MODAL_FEMALE_SVG}</span>`;
    const maleBadge    = `<span class="gender-badge male">${MODAL_MALE_SVG}</span>`;
    const femaleBadge  = `<span class="gender-badge female">${MODAL_FEMALE_SVG}</span>`;
    const asexueBadge  = `<span class="gender-badge asexue">${MODAL_ASEXUE_SVG}</span>`;

    const SF_GROUP_ORDER = ['Pikachu Cosplayeur', 'Pikachu Casquette', 'Pikachu Partenaire', 'Spéciales'];
    const sfByGroup = {};
    for (const sf of specialFormsList) {
      const grp = sf.form_group || 'Formes spéciales';
      if (!sfByGroup[grp]) sfByGroup[grp] = [];
      sfByGroup[grp].push(sf);
    }
    const sfSortedGroups = [
      ...SF_GROUP_ORDER.filter(g => sfByGroup[g]),
      ...Object.keys(sfByGroup).filter(g => SF_GROUP_ORDER.indexOf(g) === -1).sort((a, b) => a.localeCompare(b, 'fr')),
    ];

    const baseFormsContent = [
      variantRow(neutralBadge, neutralVariants),
      variantRow(asexueBadge,  asexueVariants),
      variantRow(maleBadge,    maleVariants),
      variantRow(femaleBadge,  femaleVariants),
    ].join('');

    const megaFormsContent = megaVariants.length ? (() => {
      const isXType   = megaVariants.some(v => v.variant_type === 'mega_x' || v.variant_type === 'shiny_mega_x');
      const hasY      = megaYVariants.length > 0;
      const showBadge = isXType || hasY;
      const rowX      = showBadge
        ? variantRow(`<span class="gender-badge mega-x">X</span>`, megaVariants)
        : `<div class="variants-grid">${megaVariants.map(variantCard).join('')}</div>`;
      const rowY = hasY ? variantRow(`<span class="gender-badge mega-y">Y</span>`, megaYVariants) : '';
      return rowX + rowY;
    })() : '';

    const formTabList = [
      { id: 'base', label: 'Base', html: `<div class="variants-rows-wrapper">${baseFormsContent}</div>`, show: !!(neutralVariants.length || asexueVariants.length || maleVariants.length || femaleVariants.length) },
      ...sfSortedGroups.map(grp => ({
        id: grp, label: grp,
        html: `<div class="variants-grid variants-grid--2col">${sfByGroup[grp].flatMap(sf => [sfVariantCard(sf, false), sfVariantCard(sf, true)]).join('')}</div>`,
        show: true,
      })),
      { id: 'mega',     label: 'Méga-Évolution',   html: `<div class="variants-rows-wrapper">${megaFormsContent}</div>`, show: !!megaVariants.length },
      { id: 'alola',    label: "Forme d'Alola",     html: `<div class="variants-rows-wrapper">${regionalVariantRows('alolan',   alolanVariants)}</div>`,   show: !!alolanVariants.length },
      { id: 'galar',    label: 'Forme de Galar',    html: `<div class="variants-rows-wrapper">${regionalVariantRows('galarian', galarianVariants)}</div>`, show: !!galarianVariants.length },
      { id: 'hisui',    label: "Forme d'Hisui",     html: `<div class="variants-rows-wrapper">${regionalVariantRows('hisuian',  hisuianVariants)}</div>`,  show: !!hisuianVariants.length },
      { id: 'troizepy', label: 'Pichu Troizépi',    html: `<div class="variants-rows-wrapper">${variantRow(femaleBadge, troizepyVariants)}</div>`, show: !!troizepyVariants.length },
      { id: 'gigamax',  label: 'Gigamax',            html: `<div class="variants-rows-wrapper"><div class="variants-grid">${gigamaxVariants.map(variantCard).join('')}</div></div>`, show: !!gigamaxVariants.length },
    ].filter(t => t.show);

    const useFormsTabs = formTabList.length > 1;
    const variantsInnerHtml = useFormsTabs
      ? `<div class="illus-tabs forms-tabs-nav">
           ${formTabList.map((t, i) => `<button class="illus-tab-btn${i === 0 ? ' active' : ''}" data-forms-tab="${esc(t.id)}" aria-selected="${i === 0}">${esc(t.label)}</button>`).join('')}
         </div>
         ${formTabList.map((t, i) => `<div class="forms-tab-panel${i === 0 ? ' active' : ''}" data-forms-panel="${esc(t.id)}">${t.html}</div>`).join('')}`
      : (formTabList[0]?.html || '');

    const variantsHtml = variants.length || specialFormsList.length
      ? `<div class="variants-section"><h4>Formes</h4>${variantsInnerHtml}</div>` : '';

    const megas      = megasByNumber[p.number] || [];
    const regionals  = regionalsByNumber[p.number] || [];
    const specialForms = [
      ...megas.map(m => ({ name: m.name, artwork_url: m.artwork_url, shiny_artwork_url: m.shiny_artwork_url || '', description_fr: m.description_fr, types: m.types || '', isMega: true,  isRegional: false, isSpecialForm: false, formKey: null, formIcon: MEGA_ICON_URL })),
      ...regionals.map(r => ({ name: r.name, artwork_url: r.artwork_url, shiny_artwork_url: r.shiny_artwork_url || '', description_fr: r.description_fr, types: r.types || '', isMega: false, isRegional: true,  isSpecialForm: false, formKey: null, formIcon: '' })),
      ...specialFormsList.map(sf => ({ name: sf.form_label_fr, artwork_url: sf.artwork_url || '', shiny_artwork_url: sf.artwork_url_shiny || '', description_fr: sf.description_fr || null, types: (p.types || []).join(','), isMega: false, isRegional: false, isSpecialForm: true, formKey: sf.form_key, formIcon: '', formGroup: sf.form_group || null })),
      ...gigamax.map(g => ({ name: g.name, artwork_url: g.artwork_url, shiny_artwork_url: g.shiny_artwork_url || '', description_fr: g.description_fr, types: (p.types || []).join(','), isMega: false, isRegional: false, isSpecialForm: false, formKey: null, formIcon: GIGAMAX_ICON_URL })),
    ];

    function illustrationCol(name, artworkUrl, descriptionFr, extraClass = '', formTypes = '', shinyUrl = '', formIcon = '', extraAttrs = '') {
      const typeList    = formTypes ? formTypes.split(',').map(t => t.trim()).filter(Boolean) : [];
      const typeBadges  = typeList.map(t => typeBadge(t)).join('');
      const artImg      = artworkUrl ? `<img class="modal-artwork" src="${esc(artworkUrl)}" alt="${esc(name)}" width="200" height="200" loading="lazy">` : `<div class="modal-artwork modal-artwork--pending"></div>`;
      const shinImg     = shinyUrl   ? `<img class="modal-artwork" src="${esc(shinyUrl)}"  alt="Shiny"  width="200" height="200" loading="lazy">` : `<div class="modal-artwork modal-artwork--pending"></div>`;
      const artworkHtml = shinyUrl || (!artworkUrl && !shinyUrl)
        ? `<div class="illus-artworks">
             <div class="illus-artwork-item">${artImg}<span class="illus-artwork-label">${esc(name)}</span></div>
             <div class="illus-artwork-item">${shinImg}<span class="illus-artwork-label" style="color:var(--yellow)">Shiny</span></div>
           </div>`
        : `${artImg}<span class="illus-col-name${extraClass.includes('is-mega') ? ' mega-label' : ''}">${esc(name)}</span>`;
      return `
        <div class="illus-col-wrapper">
          ${typeBadges ? `<div class="illus-col-types">${typeBadges}</div>` : '<div class="illus-col-types"></div>'}
          <div class="illus-col${extraClass ? ' ' + extraClass : ''}"${extraAttrs ? ' ' + extraAttrs : ''}>
            ${artworkHtml}
            ${descriptionFr ? `<p class="modal-description">"${esc(descriptionFr)}"</p>` : ''}
            ${formIcon ? `<img src="${esc(formIcon)}" alt="" class="illus-form-icon" loading="lazy">` : ''}
          </div>
        </div>`;
    }

    function getFormCategory(f) {
      if (f.isMega)        return 'Méga-Évolution';
      if (f.isRegional)    return 'Formes régionales';
      if (f.isSpecialForm) return f.formGroup || 'Formes spéciales';
      return 'Gigamax';
    }
    const formsByCategory = {};
    for (const f of specialForms) {
      const cat = getFormCategory(f);
      if (!formsByCategory[cat]) formsByCategory[cat] = [];
      formsByCategory[cat].push(f);
    }
    const CATEGORY_ORDER = ['Pikachu Cosplayeur', 'Pikachu Casquette', 'Pikachu Partenaire', 'Spéciales', 'Méga-Évolution', 'Formes régionales', 'Gigamax'];
    const illusCategories = [
      ...CATEGORY_ORDER.filter(c => formsByCategory[c]),
      ...Object.keys(formsByCategory).filter(c => CATEGORY_ORDER.indexOf(c) === -1).sort((a, b) => a.localeCompare(b, 'fr')),
    ];
    const useTabs = illusCategories.length > 1 || specialForms.length >= 4;

    function renderFormIllusCol(f) {
      return illustrationCol(
        f.name, f.artwork_url || '', f.description_fr,
        f.isRegional ? 'is-regional' : f.isMega ? 'is-mega' : f.isSpecialForm ? 'is-special-form' : 'is-gigamax',
        f.types || '', f.shiny_artwork_url || '', f.formIcon || '',
        f.isSpecialForm && f.formKey ? `data-sf-key="${esc(f.formKey)}"` : ''
      );
    }

    const baseIllusHtml    = illustrationCol(p.name_fr, imgSrc, p.description_fr, '', (p.types || []).join(','), p.shiny_artwork_url || '');
    const illustrationsHtml = useTabs ? `
      <div class="illus-tabs">
        <div class="illus-tab-btns" role="tablist">
          <button class="illus-tab-btn active" data-tab="base" role="tab" aria-selected="true">Base</button>
          ${illusCategories.map(cat => `<button class="illus-tab-btn" data-tab="${esc(cat)}" role="tab" aria-selected="false">${esc(cat)}</button>`).join('')}
        </div>
        <div class="illus-tab-panel active" data-panel="base"><div class="illus-row">${baseIllusHtml}</div></div>
        ${illusCategories.map(cat => `
          <div class="illus-tab-panel" data-panel="${esc(cat)}">
            <div class="illus-row">${formsByCategory[cat].map(renderFormIllusCol).join('')}</div>
          </div>`).join('')}
      </div>` : `
      <div class="illus-row">
        ${baseIllusHtml}
        ${specialForms.map(renderFormIllusCol).join('')}
      </div>`;

    const existingBanner = modal.querySelector('.collect-banner');
    if (existingBanner) existingBanner.remove();
    if (collectStatusHtml) {
      const bannerEl = document.createElement('div');
      bannerEl.innerHTML = collectStatusHtml;
      modal.insertBefore(bannerEl.firstElementChild, modalContent);
    }

    modalContent.innerHTML = `
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-number">#${esc(padNumber(p.number))}</div>
          <h2 class="modal-name" id="modal-poke-name">${esc(p.name_fr)}</h2>
        </div>
        <div class="modal-header-actions">
          <span class="gen-badge">Gén. ${esc(toRoman(p.generation))}</span>
          <button class="modal-add-btn" id="modal-edit-btn" title="Modifier la collection">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            Modifier
          </button>
        </div>
      </div>
      ${illustrationsHtml}
      ${evoHtml}
      ${variantsHtml}
    `;

    // Onglets illustrations
    modalContent.querySelectorAll('.illus-tabs:not(.forms-tabs-nav) .illus-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        modalContent.querySelectorAll('.illus-tabs:not(.forms-tabs-nav) .illus-tab-btn').forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        modalContent.querySelectorAll('.illus-tab-panel').forEach(panel =>
          panel.classList.toggle('active', panel.dataset.panel === tab)
        );
      });
    });

    if (store.pendingIllusTab) {
      const targetBtn = modalContent.querySelector(`.illus-tab-btn[data-tab="${CSS.escape(store.pendingIllusTab)}"]`);
      if (targetBtn) targetBtn.click();
      store.pendingIllusTab = null;
    }

    // Onglets formes
    modalContent.querySelectorAll('.forms-tabs-nav .illus-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.formsTab;
        modalContent.querySelectorAll('.forms-tabs-nav .illus-tab-btn').forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        modalContent.querySelectorAll('.forms-tab-panel').forEach(panel =>
          panel.classList.toggle('active', panel.dataset.formsPanel === tab)
        );
      });
    });

    const modalImg = modalContent.querySelector('.illus-col:first-child .modal-artwork');
    if (modalImg) modalImg.addEventListener('error', () => { modalImg.src = getImageUrl(p.number); });

    modal.querySelectorAll('.modal-unsee-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Retirer cette forme des vus ?')) return;
        const num = parseInt(btn.dataset.pokemonNumber);
        const vt  = btn.dataset.variantType;
        removeFormFromSeen(num, vt);
        _updateCardAfterCatch?.(num);
        closeModal();
      });
    });

    modal.querySelectorAll('.modal-capture-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Retirer cette capture ?')) return;
        const num     = parseInt(btn.dataset.pokemonNumber);
        const vt      = btn.dataset.variantType;
        const catchId = btn.dataset.catchId;
        await removeFormFromSeen(num, vt);
        const stillOwned = store.seenMap[num] && Object.values(store.seenMap[num]).some(f => f.status === 'owned');
        if (!stillOwned && catchId) {
          const { error } = await deleteCatch(catchId);
          if (error) { alert('Erreur lors de la suppression.'); return; }
          delete store.catchByNumber[num];
          delete store.shinyCatchByNumber[num];
          const capturedCountEl = document.getElementById('captured-count');
          if (capturedCountEl) capturedCountEl.textContent = Object.keys(store.catchByNumber).length;
        } else if (!stillOwned) {
          delete store.catchByNumber[num];
          delete store.shinyCatchByNumber[num];
          const capturedCountEl = document.getElementById('captured-count');
          if (capturedCountEl) capturedCountEl.textContent = Object.keys(store.catchByNumber).length;
        }
        _updateCardAfterCatch?.(num);
        closeModal();
      });
    });

    document.getElementById('modal-edit-btn')?.addEventListener('click', () => {
      closeModal();
      _openDrawerWithPokemon?.(p.number);
    });

    function formStatus(num, formType) {
      const seenVariants = store.seenMap[num];
      if (seenVariants) {
        if (Object.entries(seenVariants).some(([vt, d]) => vt.includes(formType) && d.status === 'owned')) return 'caught';
        if (Object.keys(seenVariants).some(vt => vt.includes(formType))) return 'seen';
      }
      const c = store.catchByNumber[num];
      if (c && (c.variant_type?.includes(formType) || c.form_label?.toLowerCase().includes(formType === 'mega' ? 'méga' : 'gigamax'))) return 'caught';
      return 'unseen';
    }

    modalContent.querySelectorAll('.evo-portrait[data-number]').forEach(portrait => {
      const num      = parseInt(portrait.dataset.number);
      const formType = portrait.dataset.formType || null;
      const img      = portrait.querySelector('.evo-img-wrap img');
      if (!img) return;
      if (formType) {
        const st = formStatus(num, formType);
        portrait.classList.add('evo-portrait--' + st);
        if      (st === 'seen')   img.classList.add('evo-portrait-nb');
        else if (st === 'unseen') img.classList.add('evo-portrait-silhouette');
      } else {
        if      (!store.catchByNumber[num] && store.seenSet.has(num)) img.classList.add('evo-portrait-nb');
        else if (!store.catchByNumber[num])                           img.classList.add('evo-portrait-silhouette');
      }
    });

    const applyPillStatus = (portrait, pill) => {
      if (!portrait?.dataset.formType || !pill) return;
      const st = formStatus(parseInt(portrait.dataset.number), portrait.dataset.formType);
      pill.classList.add('evo-condition--' + st);
    };
    modalContent.querySelectorAll('.evo-branch-item').forEach(item =>
      applyPillStatus(item.querySelector('.evo-portrait[data-form-type]'), item.querySelector('.evo-condition-item'))
    );
    modalContent.querySelectorAll('.evo-portrait[data-form-type]').forEach(portrait => {
      if (portrait.closest('.evo-branch-item')) return;
      const prev = portrait.closest('.evo-stage')?.previousElementSibling;
      if (prev?.classList.contains('evo-arrow'))
        applyPillStatus(portrait, prev.querySelector('.evo-condition-item'));
    });

    function refreshArtworks() {
      const forms   = store.seenMap[p.number] || {};
      const entries = Object.entries(forms);
      const isBaseCatch  = catch_ && !ALOLA_FORM_VT[catch_.form_label] && !GALAR_FORM_VT[catch_.form_label] && !SPECIAL_FORM_VT[catch_.form_label] && !/^(Méga|Gigamax|Baron)/.test(catch_.form_label || '');
      const captNormal = (isBaseCatch && !catch_.is_shiny) || entries.some(([vt, d]) => !vt.includes('shiny') && !vt.startsWith('alolan') && !vt.startsWith('galarian') && d.status === 'owned');
      const captShiny  = (isBaseCatch &&  catch_.is_shiny) || entries.some(([vt, d]) =>  vt.includes('shiny') && !vt.startsWith('alolan') && !vt.startsWith('galarian') && d.status === 'owned');
      const seenNormal = entries.some(([vt, d]) => !vt.includes('shiny') && !vt.startsWith('alolan') && !vt.startsWith('galarian') && d.status === 'seen');
      const seenShiny  = entries.some(([vt, d]) =>  vt.includes('shiny') && !vt.startsWith('alolan') && !vt.startsWith('galarian') && d.status === 'seen');

      function applyImg(img, owned, seen) {
        if (!img) return;
        img.classList.remove('modal-artwork--nb', 'modal-artwork--silhouette');
        if      (!owned && !seen) img.classList.add('modal-artwork--silhouette');
        else if (!owned)          img.classList.add('modal-artwork--nb');
      }

      modalContent.querySelectorAll('.illus-col-wrapper').forEach(wrapper => {
        const col       = wrapper.querySelector('.illus-col');
        const isMega    = col?.classList.contains('is-mega');
        const isGigamax = col?.classList.contains('is-gigamax');
        const isRegional= col?.classList.contains('is-regional');
        const items     = wrapper.querySelectorAll('.illus-artwork-item');
        let ownedNorm, seenNorm, ownedShiny, seenShinyF;
        if (isMega) {
          ownedNorm  = entries.some(([vt, d]) => vt.includes('mega') && !vt.includes('shiny') && d.status === 'owned');
          seenNorm   = entries.some(([vt, d]) => vt.includes('mega') && !vt.includes('shiny') && d.status === 'seen');
          ownedShiny = entries.some(([vt, d]) => vt.includes('mega') &&  vt.includes('shiny') && d.status === 'owned');
          seenShinyF = entries.some(([vt, d]) => vt.includes('mega') &&  vt.includes('shiny') && d.status === 'seen');
        } else if (isGigamax) {
          ownedNorm  = entries.some(([vt, d]) => vt.includes('gigamax') && !vt.includes('shiny') && d.status === 'owned');
          seenNorm   = entries.some(([vt, d]) => vt.includes('gigamax') && !vt.includes('shiny') && d.status === 'seen');
          ownedShiny = entries.some(([vt, d]) => vt.includes('gigamax') &&  vt.includes('shiny') && d.status === 'owned');
          seenShinyF = entries.some(([vt, d]) => vt.includes('gigamax') &&  vt.includes('shiny') && d.status === 'seen');
        } else if (isRegional) {
          ownedNorm  = entries.some(([vt, d]) => (vt.startsWith('alolan') || vt.startsWith('galarian') || vt.startsWith('hisuian')) && !vt.includes('shiny') && d.status === 'owned');
          seenNorm   = entries.some(([vt, d]) => (vt.startsWith('alolan') || vt.startsWith('galarian') || vt.startsWith('hisuian')) && !vt.includes('shiny') && d.status === 'seen');
          ownedShiny = entries.some(([vt, d]) => (vt.startsWith('alolan') || vt.startsWith('galarian') || vt.startsWith('hisuian')) &&  vt.includes('shiny') && d.status === 'owned');
          seenShinyF = entries.some(([vt, d]) => (vt.startsWith('alolan') || vt.startsWith('galarian') || vt.startsWith('hisuian')) &&  vt.includes('shiny') && d.status === 'seen');
        } else if (col?.classList.contains('is-special-form')) {
          const sfKey = col.dataset.sfKey;
          if (sfKey) {
            ownedNorm  = entries.some(([vt, d]) => vt === sfKey            && d.status === 'owned');
            seenNorm   = entries.some(([vt, d]) => vt === sfKey            && d.status === 'seen');
            ownedShiny = entries.some(([vt, d]) => vt === sfKey + '_shiny' && d.status === 'owned');
            seenShinyF = entries.some(([vt, d]) => vt === sfKey + '_shiny' && d.status === 'seen');
          } else {
            ownedNorm = captNormal; seenNorm = seenNormal; ownedShiny = captShiny; seenShinyF = seenShiny;
          }
        } else {
          ownedNorm = captNormal; seenNorm = seenNormal; ownedShiny = captShiny; seenShinyF = seenShiny;
        }
        if (items.length >= 2) {
          applyImg(items[0].querySelector('.modal-artwork'), ownedNorm,  seenNorm);
          applyImg(items[1].querySelector('.modal-artwork'), ownedShiny, seenShinyF);
        } else {
          applyImg(wrapper.querySelector('.modal-artwork'), ownedNorm || ownedShiny, seenNorm || seenShinyF);
        }
      });
    }
    refreshArtworks();

    function refreshEvoPortraits() {
      modalContent.querySelectorAll('.evo-portrait[data-number]').forEach(portrait => {
        const num      = parseInt(portrait.dataset.number);
        const formType = portrait.dataset.formType || null;
        const img      = portrait.querySelector('.evo-img-wrap img');
        if (!img || !formType) return;
        const st = formStatus(num, formType);
        portrait.className = portrait.className.replace(/\bevo-portrait--\S+/g, '').trim();
        portrait.classList.add('evo-portrait--' + st);
        img.classList.remove('evo-portrait-nb', 'evo-portrait-silhouette');
        if      (st === 'seen')   img.classList.add('evo-portrait-nb');
        else if (st === 'unseen') img.classList.add('evo-portrait-silhouette');
      });
      const refreshPill = (portrait, pill) => {
        if (!portrait?.dataset.formType || !pill) return;
        const st = formStatus(parseInt(portrait.dataset.number), portrait.dataset.formType);
        pill.className = pill.className.replace(/\bevo-condition--\S+/g, '').trim();
        pill.classList.add('evo-condition--' + st);
      };
      modalContent.querySelectorAll('.evo-branch-item').forEach(item =>
        refreshPill(item.querySelector('.evo-portrait[data-form-type]'), item.querySelector('.evo-condition-item'))
      );
      modalContent.querySelectorAll('.evo-portrait[data-form-type]').forEach(portrait => {
        if (portrait.closest('.evo-branch-item')) return;
        const prev = portrait.closest('.evo-stage')?.previousElementSibling;
        if (prev?.classList.contains('evo-arrow'))
          refreshPill(portrait, prev.querySelector('.evo-condition-item'));
      });
    }

    modalContent.querySelectorAll('.variant-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pokemonNumber = parseInt(btn.dataset.pkmn);
        const variantType   = btn.dataset.variant;
        const newStatus     = await cycleVariantStatus(pokemonNumber, variantType);
        const meta          = VARIANT_STATUS_META[newStatus];
        btn.className       = `variant-status ${meta.cls}`;
        btn.textContent     = meta.label;
        const card = btn.closest('.variant-card');
        if (card) card.dataset.status = newStatus;
        refreshArtworks();
        refreshEvoPortraits();
      });
    });

    modalContent.querySelectorAll('.evo-portrait:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => openModal(parseInt(btn.dataset.number)));
    });

    requestAnimationFrame(() => {
      modalContent.querySelectorAll('.stat-bar-fill').forEach(bar => {
        const w = bar.style.width;
        bar.style.width = '0';
        requestAnimationFrame(() => { bar.style.width = w; });
      });
    });

  } catch (err) {
    const modalContent2 = document.getElementById('modal-content');
    if (modalContent2) modalContent2.innerHTML = `<div style="padding:40px;color:#ef5350;font-family:monospace;font-size:0.85rem;white-space:pre-wrap">${esc(String(err))}</div>`;
  }
}

export function closeModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  const modal        = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  store.currentModalPokemonNumber = null;
  if (modalOverlay) modalOverlay.hidden = true;
  document.body.style.overflow = '';
  if (modalContent) modalContent.innerHTML = '';
  const banner = modal?.querySelector('.collect-banner');
  if (banner) banner.remove();
}
