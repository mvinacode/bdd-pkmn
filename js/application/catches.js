import { store } from '../store.js';
import { getOwnerUuid } from '../utils.js';
import {
  upsertSeen, deleteSeenForm, deleteAllSeenForPokemon,
  fetchCatches, fetchSeen, fetchVariantMap, fetchSpecialFormsForNumbers,
  fetchRegionalBaronNumbers, fetchRegionalForms,
} from '../supabase-client.js';
import { getVariantStatus } from '../domain/completion.js';
import { ALOLA_FORM_VT, GALAR_FORM_VT, HISUI_FORM_VT, SPECIAL_FORM_VT } from '../domain/constants.js';

export function updateCapturedCounter() {
  const el = document.getElementById('captured-count');
  if (el) el.textContent = Object.keys(store.catchByNumber).length;
}

export async function addToSeen(number, data) {
  if (!store.seenMap[number]) store.seenMap[number] = {};
  store.seenMap[number][data.variant_type] = { ...data };
  store.seenSet.add(number);
  const { data: saved, error } = await upsertSeen({
    owner_uuid:     getOwnerUuid(),
    pokemon_number: number,
    variant_type:   data.variant_type,
    status:         data.status || 'seen',
    form_label:     data.form_label  || null,
    is_shiny:       data.is_shiny    || false,
    sprite_url:     data.sprite_url  || null,
    caught_at:      data.caught_at   || null,
    game:           data.game        || null,
  });
  if (error) console.error('[addToSeen]', error);
  if (saved) store.seenMap[number][data.variant_type] = saved;
}

export async function removeFormFromSeen(number, variantType) {
  const row = store.seenMap[number]?.[variantType];
  if (!row) return;
  delete store.seenMap[number][variantType];
  if (!Object.keys(store.seenMap[number]).length) {
    delete store.seenMap[number];
    store.seenSet.delete(number);
  }
  const { error } = row.id
    ? await deleteSeenForm(row.id)
    : await deleteAllSeenForPokemon(getOwnerUuid(), number);
  if (error) console.error('[removeFormFromSeen]', error);
}

export async function removeFromSeen(number) {
  delete store.seenMap[number];
  store.seenSet.delete(number);
  const { error } = await deleteAllSeenForPokemon(getOwnerUuid(), number);
  if (error) console.error('[removeFromSeen]', error);
}

export async function cycleVariantStatus(pokemonNumber, variantType) {
  const current = getVariantStatus(pokemonNumber, variantType);
  const next    = { '': 'seen', 'seen': 'owned', 'owned': '' }[current];
  if (next === '') {
    await removeFormFromSeen(pokemonNumber, variantType);
  } else {
    const existing = store.seenMap[pokemonNumber]?.[variantType];
    await addToSeen(pokemonNumber, {
      variant_type: variantType,
      status:       next,
      form_label:   existing?.form_label || variantType,
      is_shiny:     variantType.includes('shiny'),
      sprite_url:   existing?.sprite_url || null,
      caught_at:    existing?.caught_at  || new Date().toISOString().slice(0, 10),
      game:         existing?.game       || null,
    });
  }
  return next || '';
}

export async function loadCatchesMap() {
  const uuid = getOwnerUuid();
  const [catchRes, seenRes] = await Promise.all([
    fetchCatches(uuid).catch(() => ({ data: [] })),
    fetchSeen(uuid).catch(() => ({ data: [] })),
  ]);
  store.catchByNumber = {};
  store.shinyCatchByNumber = {};
  for (const c of (catchRes.data || [])) {
    if (!store.catchByNumber[c.pokemon_number]) store.catchByNumber[c.pokemon_number] = c;
    if (c.is_shiny) {
      const prev = store.shinyCatchByNumber[c.pokemon_number];
      if (!prev || new Date(c.created_at) > new Date(prev.created_at)) {
        store.shinyCatchByNumber[c.pokemon_number] = c;
      }
    }
  }
  store.seenMap = {};
  for (const s of (seenRes.data || [])) {
    if (!store.seenMap[s.pokemon_number]) store.seenMap[s.pokemon_number] = {};
    store.seenMap[s.pokemon_number][s.variant_type] = s;
  }
  store.seenSet = new Set(Object.keys(store.seenMap).map(Number));
  updateCapturedCounter();

  const allNums = [...new Set([
    ...Object.keys(store.catchByNumber).map(Number),
    ...Object.keys(store.seenMap).map(Number),
  ])];
  if (allNums.length) {
    // Types des formes régionales : chargés en AWAIT (avant le 1er rendu de la
    // grille) pour qu'une carte représentant une forme régionale capturée
    // affiche d'emblée le bon type, sans dépendre d'un refresh asynchrone.
    try {
      const regionalForms = await fetchRegionalForms(allNums);
      store.regionalFormsMap = {};
      for (const f of (regionalForms || [])) {
        if (!store.regionalFormsMap[f.pokemon_number]) store.regionalFormsMap[f.pokemon_number] = [];
        store.regionalFormsMap[f.pokemon_number].push({ region: f.region, types: f.types });
      }
    } catch { /* non bloquant : on retombe sur les types de base */ }

    Promise.all([
      fetchVariantMap(allNums),
      fetchSpecialFormsForNumbers(allNums),
      fetchRegionalBaronNumbers(allNums),
    ]).then(([vMap, sfMap, baronNums]) => {
      store.variantMap      = vMap;
      store.specialFormsMap = sfMap;
      store.regionalBaronMap = Object.fromEntries(baronNums.map(n => [n, true]));
      const numsToRefresh = new Set([
        ...allNums.filter(n =>
          ALOLA_FORM_VT[store.catchByNumber[n]?.form_label] ||
          ALOLA_FORM_VT[store.shinyCatchByNumber[n]?.form_label] ||
          GALAR_FORM_VT[store.catchByNumber[n]?.form_label] ||
          GALAR_FORM_VT[store.shinyCatchByNumber[n]?.form_label] ||
          HISUI_FORM_VT[store.catchByNumber[n]?.form_label] ||
          HISUI_FORM_VT[store.shinyCatchByNumber[n]?.form_label] ||
          SPECIAL_FORM_VT[store.catchByNumber[n]?.form_label] ||
          SPECIAL_FORM_VT[store.shinyCatchByNumber[n]?.form_label]
        ),
        ...baronNums,
      ]);
      numsToRefresh.forEach(n => _cardRefreshCallback?.(n));
    }).catch(() => {});
  }
}

// Callback injecté par app.js pour éviter la dépendance circulaire
let _cardRefreshCallback = null;
export function setCatchesCallbacks({ onCardRefresh }) {
  _cardRefreshCallback = onCardRefresh;
}
