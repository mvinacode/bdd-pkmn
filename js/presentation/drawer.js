import { store } from '../store.js';
import { esc, BALLS, GAMES, ballUrl, spriteUrl, getOwnerUuid } from '../utils.js';
import {
  ICON_MALE_LG, ICON_MALE_SM, ICON_FEMALE_LG, ICON_FEMALE_SM,
  ICON_UNISEX_LG, ICON_UNISEX_SM, ICON_SHINY_SM,
  ICON_BARON_LG, ICON_BARON_XS,
  ICON_MEGA_LG, ICON_MEGA_SM, ICON_GMAX_LG, ICON_GMAX_SM,
  MALE_SVG, FEMALE_SVG,
  SHINY_ICON_URL, BARON_ICON_URL, MEGA_ICON_URL, GIGAMAX_ICON_URL,
  normalizeVariantUrl, padNumber,
} from '../domain/constants.js';
import { getVariantStatus } from '../domain/completion.js';
import { addToSeen } from '../application/catches.js';
import {
  fetchPokemon, fetchPokemonByNumber, fetchVariants, fetchMegaEvolutions,
  fetchCardIcons, fetchAlolanVariantsForNumbers, fetchGalarianVariantsForNumbers,
  fetchHisuianVariantsForNumbers, fetchSpecialFormsForNumbers,
  insertCatch, fetchVariantMap,
} from '../supabase-client.js';

// Callbacks injectés par app.js (évite circulaire drawer ↔ modal)
let _openModal = null;
let _updateCardAfterCatch = null;
export function setDrawerCallbacks({ openModal, updateCardAfterCatch }) {
  _openModal = openModal;
  _updateCardAfterCatch = updateCardAfterCatch;
}

const $ = id => document.getElementById(id);

export function openCatchDrawer(mode = 'caught') {
  const drawerEl = $('catch-drawer');
  if (!drawerEl) return;

  store.drawerPokemon = null;
  store.drawerBall    = null;
  store.drawerGame    = null;
  store.drawerShiny   = false;

  const searchInp  = $('poke-search');
  const selectedEl = $('selected-pokemon');
  const dropdown   = $('poke-dropdown');
  const saveBtnEl  = $('save-catch-btn');

  store.drawerForm  = null;
  store.drawerForms = [];
  if (searchInp)  searchInp.value = '';
  if (selectedEl) { selectedEl.hidden = true; selectedEl.innerHTML = ''; }
  if (dropdown)   dropdown.hidden = true;
  const formField = $('form-selector-field');
  if (formField)  { formField.hidden = true; $('form-grid').innerHTML = ''; }
  $('catch-date').value = new Date().toISOString().slice(0, 10);
  const gameInp  = $('catch-game');  if (gameInp)  gameInp.value  = '';
  const notesInp = $('catch-notes'); if (notesInp) notesInp.value = '';
  saveBtnEl.disabled    = false;
  saveBtnEl.textContent = mode === 'seen' ? 'Marquer comme vu' : 'Sauvegarder';

  if (!store.drawerInitDone) { initDrawerBallGrid(); initDrawerGameGrid(); store.drawerInitDone = true; }
  $('ball-grid')?.querySelectorAll('.ball-opt').forEach(b => b.classList.remove('selected'));
  $('game-grid')?.querySelectorAll('.game-opt').forEach(b => b.classList.remove('selected'));

  store.drawerMode = mode;
  const modeLabel = $('drawer-mode-label');
  if (modeLabel) modeLabel.textContent = mode === 'seen' ? 'Marquer comme vu' : 'Nouvelle capture';
  drawerEl.dataset.mode = mode;
  drawerEl.hidden = false;
  requestAnimationFrame(() => drawerEl.classList.add('open'));
  if (searchInp) searchInp.focus();
}

export function closeCatchDrawer() {
  const drawerEl = $('catch-drawer');
  if (!drawerEl) return;
  drawerEl.classList.remove('open');
  drawerEl.addEventListener('transitionend', () => { drawerEl.hidden = true; }, { once: true });
  store.drawerPokemon = null;
  store.drawerBall    = null;
  store.drawerShiny   = false;
}

function getFormIcon(vt) {
  if (vt.includes('baron'))   return `<img src="${BARON_ICON_URL}"   width="28" height="28" alt="">`;
  if (vt.includes('shiny'))   return `<img src="${SHINY_ICON_URL}"   width="28" height="28" alt="">`;
  if (vt.includes('gigamax')) return `<img src="${GIGAMAX_ICON_URL}" width="28" height="28" alt="">`;
  if (vt.includes('mega'))    return `<img src="${MEGA_ICON_URL}"    width="28" height="28" alt="">`;
  if (vt === 'male')   return MALE_SVG;
  if (vt === 'female') return FEMALE_SVG;
  return '';
}

function _bindFormGrid(grid, entries) {
  grid.querySelectorAll('.form-opt').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      const entry = entries[parseInt(btn.dataset.idx)];
      if (btn.classList.contains('selected')) {
        if (!store.drawerForms.find(f => f.variant_type === entry.variant_type))
          store.drawerForms.push(entry);
        if (store.drawerMode === 'caught') selectDrawerForm(entry);
      } else {
        store.drawerForms = store.drawerForms.filter(f => f.variant_type !== entry.variant_type);
      }
    })
  );
}

export function renderDrawerForms(variants, iconMap, megas = [], preselectedVts = []) {
  const field = $('form-selector-field');
  const grid  = $('form-grid');
  if (!field || !grid) return;

  const maleVariant   = variants.find(v => v.variant_type === 'male');
  const femaleVariant = variants.find(v => v.variant_type === 'female');
  const asexueVariant = variants.find(v => v.variant_type === 'asexue');

  const entries = [
    { label: 'Mâle',          variant_type: 'male',         iconHtml: ICON_MALE_LG,                   sprite: maleVariant?.image_url   || iconMap.normal || null },
    { label: 'Mâle Shiny',    variant_type: 'shiny_male',   iconHtml: ICON_MALE_SM + ICON_SHINY_SM,   sprite: iconMap.shiny  || null },
    { label: 'Femelle',       variant_type: 'female',       iconHtml: ICON_FEMALE_LG,                 sprite: femaleVariant?.image_url || iconMap.normal || null },
    { label: 'Femelle Shiny', variant_type: 'shiny_female', iconHtml: ICON_FEMALE_SM + ICON_SHINY_SM, sprite: iconMap.shiny  || null },
    { label: 'Asexué',       variant_type: asexueVariant ? 'asexue' : 'normal',       iconHtml: ICON_UNISEX_LG,                 sprite: asexueVariant?.image_url || iconMap.normal || null },
    { label: 'Asexué Shiny', variant_type: asexueVariant ? 'asexue_shiny' : 'shiny', iconHtml: ICON_UNISEX_SM + ICON_SHINY_SM, sprite: iconMap.shiny  || null },
    { label: 'Baron',         variant_type: 'baron',        iconHtml: ICON_BARON_LG,                  sprite: iconMap.normal || null },
    { label: 'Baron Shiny',   variant_type: 'shiny_baron',  iconHtml: ICON_BARON_XS + ICON_SHINY_SM,  sprite: iconMap.normal || null },
  ];

  const megasWithImg = megas.filter(m => m.image_url);
  if (megasWithImg.length > 0) {
    for (const m of megasWithImg) {
      const vt      = m.name?.toLowerCase().includes(' x') ? 'mega_x' : m.name?.toLowerCase().includes(' y') ? 'mega_y' : 'mega';
      const vtShiny = vt === 'mega_x' ? 'shiny_mega_x' : vt === 'mega_y' ? 'shiny_mega_y' : 'shiny_mega';
      const label   = vt === 'mega_x' ? 'Méga-Évo. X' : vt === 'mega_y' ? 'Méga-Évo. Y' : 'Méga-Évolution';
      entries.push({ label,                 variant_type: vt,      iconHtml: ICON_MEGA_LG,                  sprite: m.image_url });
      entries.push({ label: label+' Shiny', variant_type: vtShiny, iconHtml: ICON_MEGA_SM + ICON_SHINY_SM, sprite: null });
    }
  } else {
    entries.push({ label: 'Méga-Évolution',       variant_type: 'mega',       iconHtml: ICON_MEGA_LG,                  sprite: null });
    entries.push({ label: 'Méga-Évolution Shiny', variant_type: 'shiny_mega', iconHtml: ICON_MEGA_SM + ICON_SHINY_SM, sprite: null });
  }

  const gmaxV      = variants.find(v => v.variant_type === 'gigamax');
  const gmaxShinyV = variants.find(v => v.variant_type === 'shiny_gigamax');
  entries.push({ label: 'Gigamax',       variant_type: 'gigamax',       iconHtml: ICON_GMAX_LG,                  sprite: gmaxV?.image_url      || null });
  entries.push({ label: 'Gigamax Shiny', variant_type: 'shiny_gigamax', iconHtml: ICON_GMAX_SM + ICON_SHINY_SM, sprite: gmaxShinyV?.image_url || null });

  const isFemaleOnly = !maleVariant && !!femaleVariant;
  if (isFemaleOnly) {
    const excl = new Set(['male', 'shiny_male', 'normal', 'shiny', 'asexue', 'asexue_shiny']);
    entries.splice(0, entries.length, ...entries.filter(e => !excl.has(e.variant_type)));
  }
  const isMaleOnly = !!maleVariant && !femaleVariant;
  if (isMaleOnly) {
    const excl = new Set(['female', 'shiny_female', 'normal', 'shiny', 'asexue', 'asexue_shiny']);
    entries.splice(0, entries.length, ...entries.filter(e => !excl.has(e.variant_type)));
  }

  const usePreselect = preselectedVts.length > 0;
  grid.innerHTML = entries.map((e, i) => {
    const sel = usePreselect && preselectedVts.includes(e.variant_type);
    return `<button class="form-opt${sel ? ' selected' : ''}" data-idx="${i}" data-vt="${esc(e.variant_type)}" title="${esc(e.label)}">
      <div class="form-opt-icon">${e.iconHtml}</div>
      <span>${esc(e.label)}</span>
    </button>`;
  }).join('');

  if (usePreselect) {
    store.drawerForms = entries.filter(e => preselectedVts.includes(e.variant_type));
    if (store.drawerMode === 'caught' && store.drawerForms.length > 0) selectDrawerForm(store.drawerForms[0]);
  } else {
    store.drawerForms = [];
  }

  _bindFormGrid(grid, entries);
  field.hidden = false;
}

export function renderDrawerFormsRegional(variants, sprite, regionId) {
  const field = $('form-selector-field');
  const grid  = $('form-grid');
  if (!field || !grid) return;

  const regionLabel = { alolan: 'Alola', galarian: 'Galar', hisuian: 'Hisui' }[regionId] || regionId;
  const p = regionId;

  const vMale      = variants.find(v => v.variant_type === `${p}_male`);
  const vFemale    = variants.find(v => v.variant_type === `${p}_female`);
  const vShinyMale = variants.find(v => v.variant_type === `${p}_shiny_male`);
  const vShinyFem  = variants.find(v => v.variant_type === `${p}_shiny_female`);
  const vBase      = variants.find(v => v.variant_type === p);
  const vShiny     = variants.find(v => v.variant_type === `${p}_shiny`);

  const base      = vBase?.image_url  || sprite || null;
  const baseShiny = vShiny?.image_url || base;

  const entries = [
    { label: `${regionLabel} Mâle`,          displayLabel: 'Mâle',          variant_type: `${p}_male`,         iconHtml: ICON_MALE_LG,                   sprite: vMale?.image_url      || base      },
    { label: `${regionLabel} Mâle Shiny`,    displayLabel: 'Mâle Shiny',    variant_type: `${p}_shiny_male`,   iconHtml: ICON_MALE_SM + ICON_SHINY_SM,   sprite: vShinyMale?.image_url || baseShiny },
    { label: `${regionLabel} Femelle`,       displayLabel: 'Femelle',       variant_type: `${p}_female`,       iconHtml: ICON_FEMALE_LG,                 sprite: vFemale?.image_url    || base      },
    { label: `${regionLabel} Femelle Shiny`, displayLabel: 'Femelle Shiny', variant_type: `${p}_shiny_female`, iconHtml: ICON_FEMALE_SM + ICON_SHINY_SM, sprite: vShinyFem?.image_url  || baseShiny },
    { label: `${regionLabel} Asexué`,       displayLabel: 'Asexué',       variant_type: p,                   iconHtml: ICON_UNISEX_LG,                 sprite: base      },
    { label: `${regionLabel} Asexué Shiny`, displayLabel: 'Asexué Shiny', variant_type: `${p}_shiny`,        iconHtml: ICON_UNISEX_SM + ICON_SHINY_SM, sprite: baseShiny },
    { label: `${regionLabel} Baron`,         displayLabel: 'Baron',         variant_type: 'baron',             iconHtml: ICON_BARON_LG,                  sprite: base      },
    { label: `${regionLabel} Baron Shiny`,   displayLabel: 'Baron Shiny',   variant_type: 'shiny_baron',       iconHtml: ICON_BARON_XS + ICON_SHINY_SM,  sprite: baseShiny },
  ];

  grid.innerHTML = entries.map((e, i) => `
    <button class="form-opt" data-idx="${i}" data-vt="${esc(e.variant_type)}" title="${esc(e.label)}">
      <div class="form-opt-icon">${e.iconHtml}</div>
      <span>${esc(e.displayLabel || e.label)}</span>
    </button>`).join('');

  store.drawerForms = [];
  _bindFormGrid(grid, entries);
  field.hidden = false;
}

export function renderDrawerFormsAlolan(variants, sprite)   { renderDrawerFormsRegional(variants, sprite, 'alolan'); }
export function renderDrawerFormsGalarian(variants, sprite) { renderDrawerFormsRegional(variants, sprite, 'galarian'); }
export function renderDrawerFormsHisuian(variants, sprite)  { renderDrawerFormsRegional(variants, sprite, 'hisuian'); }

export function renderDrawerFormsSpecial(specialForm) {
  const field = $('form-selector-field');
  const grid  = $('form-grid');
  if (!field || !grid) return;

  const isMale     = specialForm.form_group === 'Pikachu Casquette';
  const isGendered = specialForm.form_group === 'Pikachu Partenaire';
  const ICON    = isMale ? ICON_MALE_LG   : ICON_FEMALE_LG;
  const ICON_SM = isMale ? ICON_MALE_SM   : ICON_FEMALE_SM;
  const genderLabel = isMale ? 'Mâle' : 'Femelle';

  const label   = specialForm.form_label_fr;
  const vt      = specialForm.form_key;
  const vtShiny = specialForm.form_key + '_shiny';

  const entries = isGendered ? [
    { label,            displayLabel: 'Mâle',         variant_type: vt,                  iconHtml: ICON_MALE_LG,                  sprite: specialForm.image_url                               || null },
    { label: label+' Shiny', displayLabel: 'Mâle Shiny',   variant_type: vtShiny,             iconHtml: ICON_MALE_SM + ICON_SHINY_SM,  sprite: specialForm.image_url_shiny || specialForm.image_url || null },
    { label,            displayLabel: 'Femelle',       variant_type: vt      + '_female', iconHtml: ICON_FEMALE_LG,                sprite: specialForm.image_url                               || null },
    { label: label+' Shiny', displayLabel: 'Femelle Shiny', variant_type: vtShiny + '_female', iconHtml: ICON_FEMALE_SM + ICON_SHINY_SM, sprite: specialForm.image_url_shiny || specialForm.image_url || null },
  ] : [
    { label,            displayLabel: genderLabel,            variant_type: vt,      iconHtml: ICON,               sprite: specialForm.image_url                               || null },
    { label: label+' Shiny', displayLabel: genderLabel+' Shiny', variant_type: vtShiny, iconHtml: ICON_SM + ICON_SHINY_SM, sprite: specialForm.image_url_shiny || specialForm.image_url || null },
  ];

  grid.innerHTML = entries.map((e, i) => `
    <button class="form-opt" data-idx="${i}" data-vt="${esc(e.variant_type)}" title="${esc(e.label)}">
      <div class="form-opt-icon">${e.iconHtml}</div>
      <span>${esc(e.displayLabel)}</span>
    </button>`).join('');

  store.drawerForms = [];
  _bindFormGrid(grid, entries);
  field.hidden = false;
}

export function selectDrawerForm(v) {
  store.drawerForm  = v;
  store.drawerShiny = v.variant_type?.includes('shiny') || false;
  const img = $('drawer-poke-img');
  if (img && store.drawerPokemon) {
    let src;
    if (store.drawerPokemon.isAlolan && store.drawerPokemon.alolanSprite)
      src = normalizeVariantUrl(store.drawerPokemon.alolanSprite);
    else if (store.drawerPokemon.isGalarian && store.drawerPokemon.galarianSprite)
      src = normalizeVariantUrl(store.drawerPokemon.galarianSprite);
    else if (store.drawerPokemon.isHisuian && store.drawerPokemon.hisuianSprite)
      src = normalizeVariantUrl(store.drawerPokemon.hisuianSprite);
    else if (store.drawerPokemon.isSpecial && v.sprite)
      src = normalizeVariantUrl(v.sprite);
    else if (store.drawerShiny)
      src = store.drawerPokemon.iconShiny  ? normalizeVariantUrl(store.drawerPokemon.iconShiny)  : spriteUrl(store.drawerPokemon.number, true);
    else
      src = store.drawerPokemon.iconNormal ? normalizeVariantUrl(store.drawerPokemon.iconNormal) : spriteUrl(store.drawerPokemon.number, false);
    img.src = src;
  }
}

export function initDrawerBallGrid() {
  const grid = $('ball-grid');
  if (!grid) return;
  grid.innerHTML = BALLS.map(b => `
    <button class="ball-opt" data-slug="${esc(b.slug)}" title="${esc(b.name)}">
      <img src="${esc(ballUrl(b.slug))}" alt="${esc(b.name)}" width="28" height="28">
      <span>${esc(b.name)}</span>
    </button>`).join('');
  grid.querySelectorAll('.ball-opt').forEach(btn =>
    btn.addEventListener('click', () => {
      store.drawerBall = BALLS.find(b => b.slug === btn.dataset.slug);
      grid.querySelectorAll('.ball-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    })
  );
}

export function initDrawerGameGrid() {
  const grid = $('game-grid');
  if (!grid) return;
  grid.innerHTML = GAMES.map(g => `
    <button class="game-opt" data-slug="${esc(g.slug)}" title="${esc(g.name)}">
      ${g.iconUrl ? `<img src="${esc(g.iconUrl)}" alt="" width="28" height="28">` : ''}
      <span>${esc(g.name)}</span>
    </button>`).join('');
  grid.querySelectorAll('.game-opt').forEach(btn =>
    btn.addEventListener('click', () => {
      const alreadySelected = btn.classList.contains('selected');
      grid.querySelectorAll('.game-opt').forEach(b => b.classList.remove('selected'));
      if (!alreadySelected) {
        btn.classList.add('selected');
        store.drawerGame = GAMES.find(g => g.slug === btn.dataset.slug) || null;
        const inp = $('catch-game'); if (inp) inp.value = '';
      } else {
        store.drawerGame = null;
      }
    })
  );
}

export function bindDrawerEvents() {
  const drawerEl = $('catch-drawer');
  if (!drawerEl) return;

  $('add-catch-fab').addEventListener('click', () => openCatchDrawer('caught'));
  $('add-seen-btn').addEventListener('click',  () => openCatchDrawer('seen'));

  ['filter-seen-btn', 'filter-caught-btn'].forEach(id => {
    const btn = $(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      // dispatch event; app.js handles the filter logic
      btn.dispatchEvent(new CustomEvent('status-filter-click', { bubbles: true, detail: { status: btn.dataset.status } }));
    });
  });

  $('close-drawer-btn').addEventListener('click', closeCatchDrawer);
  $('drawer-overlay').addEventListener('click', closeCatchDrawer);

  const searchInp = $('poke-search');
  const dropdown  = $('poke-dropdown');
  if (searchInp) {
    searchInp.addEventListener('input', e => {
      clearTimeout(store.drawerSearchTmt);
      const q = e.target.value.trim();
      if (!q) { dropdown.hidden = true; return; }
      store.drawerSearchTmt = setTimeout(async () => {
        const { data } = await fetchPokemon({ search: q, from: 0, to: 7 });
        if (!data?.length) { dropdown.hidden = true; return; }

        const nums = data.map(p => p.number);
        const [allIcons, alolanRows, galarianRows, hisuianRows, specialFormsData] = await Promise.all([
          fetchCardIcons(nums).catch(() => []),
          fetchAlolanVariantsForNumbers(nums).catch(() => []),
          fetchGalarianVariantsForNumbers(nums).catch(() => []),
          fetchHisuianVariantsForNumbers(nums).catch(() => []),
          fetchSpecialFormsForNumbers(nums).catch(() => ({})),
        ]);
        const iconMap = {};
        for (const r of allIcons) {
          if (!iconMap[r.pokemon_number]) iconMap[r.pokemon_number] = { normal: null, shiny: null };
          if ((['normal','asexue','male','female'].includes(r.variant_type)) && !iconMap[r.pokemon_number].normal)
            iconMap[r.pokemon_number].normal = r.image_url;
          else if ((['shiny','asexue_shiny','shiny_male','shiny_female'].includes(r.variant_type)) && !iconMap[r.pokemon_number].shiny)
            iconMap[r.pokemon_number].shiny = r.image_url;
        }
        const alolanSpriteMap    = Object.fromEntries(alolanRows.map(r => [r.pokemon_number, r.image_url]));
        const galarianSpriteMap  = Object.fromEntries(galarianRows.map(r => [r.pokemon_number, r.image_url]));
        const hisuianSpriteMap   = Object.fromEntries(hisuianRows.map(r => [r.pokemon_number, r.image_url]));

        const items = [];
        for (const p of data) {
          items.push({ p, isAlola: false, isGalar: false, isHisui: false, specialForm: null });
          if (alolanSpriteMap[p.number])   items.push({ p, isAlola: true,  isGalar: false, isHisui: false, specialForm: null });
          if (galarianSpriteMap[p.number]) items.push({ p, isAlola: false, isGalar: true,  isHisui: false, specialForm: null });
          if (hisuianSpriteMap[p.number])  items.push({ p, isAlola: false, isGalar: false, isHisui: true,  specialForm: null });
          for (const form of Object.values(specialFormsData[p.number] || {}))
            items.push({ p, isAlola: false, isGalar: false, isHisui: false, specialForm: form });
        }

        dropdown.innerHTML = items.map(({ p, isAlola, isGalar, isHisui, specialForm }) => {
          const ico         = iconMap[p.number];
          const alolaSprite = alolanSpriteMap[p.number]  || null;
          const galarSprite = galarianSpriteMap[p.number] || null;
          const hisuiSprite = hisuianSpriteMap[p.number] || null;
          const src = isAlola ? (alolaSprite ? normalizeVariantUrl(alolaSprite) : spriteUrl(p.number, false))
            : isGalar ? (galarSprite ? normalizeVariantUrl(galarSprite) : spriteUrl(p.number, false))
            : isHisui ? (hisuiSprite ? normalizeVariantUrl(hisuiSprite) : spriteUrl(p.number, false))
            : specialForm ? (specialForm.image_url ? normalizeVariantUrl(specialForm.image_url) : spriteUrl(p.number, false))
            : (ico?.normal ? normalizeVariantUrl(ico.normal) : spriteUrl(p.number, false));
          const displayName = isAlola ? `${p.name_fr} · Alola`
            : isGalar ? `${p.name_fr} · Galar`
            : isHisui ? `${p.name_fr} · Hisui`
            : specialForm ? `${p.name_fr} · ${specialForm.form_label_fr}`
            : p.name_fr;
          return `<button class="poke-result"
            data-number="${p.number}"
            data-name="${esc(p.name_fr)}"
            data-is-alola="${isAlola ? '1' : '0'}"
            data-alola-sprite="${esc(alolaSprite || '')}"
            data-is-galar="${isGalar ? '1' : '0'}"
            data-galar-sprite="${esc(galarSprite || '')}"
            data-is-hisui="${isHisui ? '1' : '0'}"
            data-hisui-sprite="${esc(hisuiSprite || '')}"
            data-special-form-key="${esc(specialForm?.form_key || '')}"
            data-special-form-label="${esc(specialForm?.form_label_fr || '')}">
            <img src="${esc(src)}" width="28" height="28" alt="" style="image-rendering:pixelated">
            <span>#${esc(padNumber(p.number))} ${esc(displayName)}</span>
          </button>`;
        }).join('');
        dropdown.hidden = false;

        dropdown.querySelectorAll('.poke-result').forEach(btn =>
          btn.addEventListener('click', async () => {
            const num            = parseInt(btn.dataset.number);
            const name           = btn.dataset.name;
            const isAlola        = btn.dataset.isAlola === '1';
            const alolaSprite    = btn.dataset.alolaSprite || null;
            const isGalar        = btn.dataset.isGalar === '1';
            const galarSprite    = btn.dataset.galarSprite || null;
            const isHisui        = btn.dataset.isHisui === '1';
            const hisuiSprite    = btn.dataset.hisuiSprite || null;
            const specialFormKey = btn.dataset.specialFormKey || null;
            const specialFormLbl = btn.dataset.specialFormLabel || null;
            const ico            = iconMap[num] || {};

            store.drawerPokemon = {
              number: num, name_fr: name,
              iconNormal: ico.normal || null, iconShiny: ico.shiny || null,
              isAlolan: isAlola, alolanSprite: alolaSprite,
              isGalarian: isGalar, galarianSprite: galarSprite,
              isHisuian: isHisui, hisuianSprite: hisuiSprite,
              isSpecial: !!specialFormKey, specialFormKey, specialFormLabel: specialFormLbl,
            };

            const displayName = isAlola ? `${name} · Alola`
              : isGalar ? `${name} · Galar`
              : isHisui ? `${name} · Hisui`
              : specialFormKey ? `${name} · ${specialFormLbl}`
              : name;
            const sfData = specialFormKey ? specialFormsData[num]?.[specialFormKey] : null;
            const src = isAlola ? (alolaSprite ? normalizeVariantUrl(alolaSprite) : spriteUrl(num, false))
              : isGalar ? (galarSprite ? normalizeVariantUrl(galarSprite) : spriteUrl(num, false))
              : isHisui ? (hisuiSprite ? normalizeVariantUrl(hisuiSprite) : spriteUrl(num, false))
              : sfData?.image_url ? normalizeVariantUrl(sfData.image_url)
              : (ico.normal ? normalizeVariantUrl(ico.normal) : spriteUrl(num, false));

            searchInp.value = displayName;
            dropdown.hidden = true;

            const sel = $('selected-pokemon');
            sel.innerHTML = `
              <img id="drawer-poke-img" src="${esc(src)}" width="52" height="52"
                   alt="${esc(displayName)}" style="image-rendering:pixelated">
              <div>
                <div style="font-size:0.65rem;color:var(--text-muted)">#${esc(padNumber(num))}</div>
                <div style="font-weight:700">${esc(displayName)}</div>
              </div>`;
            sel.hidden = false;

            store.drawerForm = null;
            if (isAlola) {
              const variantData = await fetchVariants(num).catch(() => []);
              renderDrawerFormsAlolan(variantData, alolaSprite);
            } else if (isGalar) {
              const variantData = await fetchVariants(num).catch(() => []);
              renderDrawerFormsGalarian(variantData, galarSprite);
            } else if (isHisui) {
              const variantData = await fetchVariants(num).catch(() => []);
              renderDrawerFormsHisuian(variantData, hisuiSprite);
            } else if (specialFormKey && sfData) {
              if (!store.specialFormsMap[num]) store.specialFormsMap[num] = {};
              store.specialFormsMap[num][specialFormKey] = sfData;
              renderDrawerFormsSpecial(sfData);
            } else {
              const [variantData, megaData] = await Promise.all([
                fetchVariants(num).catch(() => []),
                fetchMegaEvolutions([num]).catch(() => []),
              ]);
              renderDrawerForms(variantData, ico, megaData);
            }
          })
        );
      }, 280);
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('#poke-search-wrap')) dropdown.hidden = true;
    });
  }

  const gameInp = $('catch-game');
  if (gameInp) {
    gameInp.addEventListener('input', () => {
      store.drawerGame = null;
      $('game-grid')?.querySelectorAll('.game-opt').forEach(b => b.classList.remove('selected'));
    });
  }

  $('save-catch-btn').addEventListener('click', saveCatchFromMain);
}

export async function saveCatchFromMain() {
  if (!store.drawerPokemon) { alert('Choisis un Pokémon.'); return; }

  if (store.drawerMode === 'seen') {
    const formsToMark = store.drawerForms.length ? store.drawerForms : (store.drawerForm ? [store.drawerForm] : []);
    if (!formsToMark.length) { alert('Choisis un Pokémon.'); return; }
    const saveBtn = $('save-catch-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Sauvegarde…';
    const savedSeenNum = store.drawerPokemon.number;
    const savedSeenVts = formsToMark.map(f => f.variant_type || '');
    const date = $('catch-date').value || new Date().toISOString().slice(0, 10);
    const game = store.drawerGame?.name || $('catch-game')?.value.trim() || null;
    try {
      for (const form of formsToMark) {
        const isShiny = form.variant_type?.includes('shiny') || false;
        const sprite  = form.sprite
          ? normalizeVariantUrl(form.sprite)
          : (isShiny
              ? (store.drawerPokemon.iconShiny  ? normalizeVariantUrl(store.drawerPokemon.iconShiny)  : spriteUrl(store.drawerPokemon.number, true))
              : (store.drawerPokemon.iconNormal ? normalizeVariantUrl(store.drawerPokemon.iconNormal) : spriteUrl(store.drawerPokemon.number, false)));
        await addToSeen(store.drawerPokemon.number, {
          variant_type: form.variant_type || 'normal',
          status:       getVariantStatus(store.drawerPokemon.number, form.variant_type) === 'owned' ? 'owned' : 'seen',
          form_label:   form.label || (isShiny ? 'Shiny' : 'Normale'),
          is_shiny:     isShiny,
          sprite_url:   sprite,
          caught_at:    date,
          game,
        });
      }
      _updateCardAfterCatch?.(store.drawerPokemon.number);
      closeCatchDrawer();
      const modalOverlay = document.getElementById('modal-overlay');
      if (!modalOverlay?.hidden && store.currentModalPokemonNumber === savedSeenNum) {
        if (savedSeenVts.some(vt => vt.includes('mega'))) store.pendingIllusTab = 'Méga-Évolution';
        else if (savedSeenVts.some(vt => vt.startsWith('alolan') || vt.startsWith('galarian') || vt.startsWith('hisuian'))) store.pendingIllusTab = 'Formes régionales';
        else if (savedSeenVts.some(vt => vt.includes('gigamax'))) store.pendingIllusTab = 'Gigamax';
        _openModal?.(savedSeenNum);
      }
    } catch (err) {
      console.error('[saveCatchFromMain seen]', err);
      saveBtn.disabled    = false;
      saveBtn.textContent = 'Marquer comme vu';
      alert('Erreur : ' + (err?.message || JSON.stringify(err)));
    }
    return;
  }

  if (!store.drawerBall) { alert('Choisis une Ball.'); return; }
  const formsToCapture = store.drawerForms.length ? store.drawerForms : (store.drawerForm ? [store.drawerForm] : []);
  if (!formsToCapture.length) return;

  const saveBtn = $('save-catch-btn');
  saveBtn.disabled    = true;
  saveBtn.textContent = 'Sauvegarde…';

  const date      = $('catch-date').value || new Date().toISOString().slice(0, 10);
  const game      = store.drawerGame?.name || $('catch-game')?.value.trim() || null;
  const notes     = $('catch-notes')?.value.trim() || null;
  const sessionId = crypto.randomUUID();

  let lastData  = null;
  let lastError = null;

  for (const form of formsToCapture) {
    const isShiny = form.variant_type?.includes('shiny') || false;
    const sprite  = form.sprite
      ? normalizeVariantUrl(form.sprite)
      : (isShiny
          ? (store.drawerPokemon.iconShiny  ? normalizeVariantUrl(store.drawerPokemon.iconShiny)  : spriteUrl(store.drawerPokemon.number, true))
          : (store.drawerPokemon.iconNormal ? normalizeVariantUrl(store.drawerPokemon.iconNormal) : spriteUrl(store.drawerPokemon.number, false)));
    const { data, error } = await insertCatch({
      owner_uuid:      getOwnerUuid(),
      pokemon_number:  store.drawerPokemon.number,
      pokemon_name_fr: store.drawerPokemon.name_fr,
      is_shiny:        isShiny,
      sprite_url:      sprite,
      form_label:      form.label || (isShiny ? 'Shiny' : 'Normale'),
      ball_name:       store.drawerBall.name,
      ball_image_url:  ballUrl(store.drawerBall.slug),
      caught_at:       date,
      game,
      notes,
      session_id:      sessionId,
    });
    if (error) { lastError = error; break; }
    lastData = data;
    await addToSeen(store.drawerPokemon.number, {
      variant_type: form.variant_type || 'normal',
      status:       'owned',
      form_label:   form.label || (isShiny ? 'Shiny' : 'Normale'),
      is_shiny:     isShiny,
      sprite_url:   sprite,
      caught_at:    date,
      game,
    });
  }

  if (lastError) {
    console.error(lastError);
    saveBtn.disabled    = false;
    saveBtn.textContent = 'Sauvegarder';
    alert('Erreur lors de la sauvegarde.');
    return;
  }

  const savedCatchNum = store.drawerPokemon.number;
  const savedCatchVts = formsToCapture.map(f => f.variant_type || '');
  store.catchByNumber[store.drawerPokemon.number] = lastData;
  if (lastData?.is_shiny) store.shinyCatchByNumber[store.drawerPokemon.number] = lastData;
  if (!store.variantMap[store.drawerPokemon.number])
    fetchVariantMap([store.drawerPokemon.number]).then(m => Object.assign(store.variantMap, m));
  if (store.drawerPokemon.isSpecial && store.drawerPokemon.specialFormKey && !store.specialFormsMap[store.drawerPokemon.number]?.[store.drawerPokemon.specialFormKey])
    fetchSpecialFormsForNumbers([store.drawerPokemon.number]).then(m => Object.assign(store.specialFormsMap, m));

  const capturedCountEl = document.getElementById('captured-count');
  if (capturedCountEl) capturedCountEl.textContent = Object.keys(store.catchByNumber).length;

  _updateCardAfterCatch?.(store.drawerPokemon.number);
  closeCatchDrawer();
  const modalOverlay = document.getElementById('modal-overlay');
  if (!modalOverlay?.hidden && store.currentModalPokemonNumber === savedCatchNum) {
    if (savedCatchVts.some(vt => vt.includes('mega'))) store.pendingIllusTab = 'Méga-Évolution';
    else if (savedCatchVts.some(vt => vt.startsWith('alolan') || vt.startsWith('galarian') || vt.startsWith('hisuian'))) store.pendingIllusTab = 'Formes régionales';
    else if (savedCatchVts.some(vt => vt.includes('gigamax'))) store.pendingIllusTab = 'Gigamax';
    _openModal?.(savedCatchNum);
  }
}

export async function openDrawerWithPokemon(number) {
  const catch_ = store.catchByNumber[number] || null;
  const mode   = catch_ ? 'caught' : 'seen';

  let pokemon = store.pokemon.find(p => p.number === number);
  if (!pokemon) {
    const { data } = await fetchPokemonByNumber(number).catch(() => ({ data: null }));
    if (!data) return;
    pokemon = data;
  }

  const ico = store.iconCache[number] || {};
  openCatchDrawer(mode);

  store.drawerPokemon = {
    number:     pokemon.number,
    name_fr:    pokemon.name_fr,
    iconNormal: ico.normal || null,
    iconShiny:  ico.shiny  || null,
  };

  const src = store.drawerPokemon.iconNormal
    ? normalizeVariantUrl(store.drawerPokemon.iconNormal)
    : spriteUrl(pokemon.number, false);

  const searchInp = $('poke-search');
  const sel       = $('selected-pokemon');
  if (searchInp) searchInp.value = pokemon.name_fr;
  if (sel) {
    sel.innerHTML = `
      <img id="drawer-poke-img" src="${esc(src)}" width="52" height="52"
           alt="${esc(pokemon.name_fr)}" style="image-rendering:pixelated">
      <div>
        <div style="font-size:0.65rem;color:var(--text-muted)">#${esc(padNumber(pokemon.number))}</div>
        <div style="font-weight:700">${esc(pokemon.name_fr)}</div>
      </div>`;
    sel.hidden = false;
  }

  const savedVts = store.seenMap[number] ? Object.keys(store.seenMap[number]) : [];
  const [variantData, megaData] = await Promise.all([
    fetchVariants(pokemon.number).catch(() => []),
    fetchMegaEvolutions([pokemon.number]).catch(() => []),
  ]);
  renderDrawerForms(variantData, ico, megaData, savedVts);

  if (catch_) {
    const ballEntry = BALLS.find(b => b.name === catch_.ball_name);
    if (ballEntry) {
      const ballBtn = $('ball-grid')?.querySelector(`[data-slug="${ballEntry.slug}"]`);
      if (ballBtn) {
        $('ball-grid').querySelectorAll('.ball-opt').forEach(b => b.classList.remove('selected'));
        ballBtn.classList.add('selected');
        store.drawerBall = ballEntry;
      }
    }
    if (catch_.caught_at) $('catch-date').value = catch_.caught_at;
    if (catch_.game) {
      const gameEntry = GAMES.find(g => g.name === catch_.game);
      if (gameEntry) {
        const gameBtn = $('game-grid')?.querySelector(`[data-slug="${gameEntry.slug}"]`);
        if (gameBtn) {
          $('game-grid').querySelectorAll('.game-opt').forEach(b => b.classList.remove('selected'));
          gameBtn.classList.add('selected');
          store.drawerGame = gameEntry;
        }
      } else {
        $('catch-game').value = catch_.game;
      }
    }
    if (catch_.notes) $('catch-notes').value = catch_.notes;
  } else if (savedVts.length > 0) {
    const firstForm = store.seenMap[number][savedVts[0]];
    if (firstForm?.caught_at) $('catch-date').value = firstForm.caught_at;
    if (firstForm?.game) {
      const gameEntry = GAMES.find(g => g.name === firstForm.game);
      if (gameEntry) {
        const gameBtn = $('game-grid')?.querySelector(`[data-slug="${gameEntry.slug}"]`);
        if (gameBtn) {
          $('game-grid').querySelectorAll('.game-opt').forEach(b => b.classList.remove('selected'));
          gameBtn.classList.add('selected');
          store.drawerGame = gameEntry;
        }
      } else {
        $('catch-game').value = firstForm.game;
      }
    }
  }
}
