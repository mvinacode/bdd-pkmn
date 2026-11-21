// Règle métier de la carte du Pokédex : statut des badges de formes (shiny,
// baron, méga, gigamax) et carte « complète ». Fonction pure : elle ne lit ni
// le store ni window, tout arrive en paramètre, ce qui la rend testable.
import {
  ALOLA_FORM_VT, GALAR_FORM_VT, HISUI_FORM_VT, PALDEA_FORM_VT, SPECIAL_FORM_VT,
  GENDER_GROUPS, GENDER_VTS_FLAT,
} from './constants.js';

export const FORM_BADGES = [
  { key: 'shiny',   variants: ['shiny','asexue_shiny','shiny_male','shiny_female','alolan_shiny','alolan_shiny_male','alolan_shiny_female','galarian_shiny','galarian_shiny_male','galarian_shiny_female','hisuian_shiny','hisuian_shiny_male','hisuian_shiny_female','paldean_shiny','paldean_shiny_male','paldean_shiny_female'] },
  { key: 'baron',   variants: ['baron', 'shiny_baron'] },
  { key: 'mega',    variants: ['mega','mega_x','mega_y','shiny_mega','shiny_mega_x','shiny_mega_y'] },
  { key: 'gigamax', variants: ['gigamax','shiny_gigamax'] },
];

export const DEFAULT_PREFS = Object.freeze({
  genderFormsMode: 'none',            // 'all' | 'any' | 'none' (cf. config.js)
  strictComplete: false,
  requireAllFormsForComplete: false,
});

const REGIONAL_FORM_TABLES = [ALOLA_FORM_VT, GALAR_FORM_VT, HISUI_FORM_VT, PALDEA_FORM_VT, SPECIAL_FORM_VT];

// Formes neutres qu'une version genrée possédée suffit à valider
// (`<neutre>_male` ou `<neutre>_female`). Paldéa n'y figure pas : sa seule forme
// régionale simple (Axoloto) n'existe qu'en neutre dans pokemon_variants.
const NEUTRALS_COVERED_BY_GENDER = new Set(
  ['', 'alolan', 'galarian', 'hisuian'].flatMap(r => r ? [r, `${r}_shiny`] : ['shiny']),
);

function formBadgeStatuses(seenForms, latestCatch) {
  return FORM_BADGES.map(({ key, variants }) => {
    const statuses = variants.map(vt => seenForms[vt]?.status).filter(Boolean);
    let status = statuses.includes('owned') ? 'owned' : statuses.includes('seen') ? 'seen' : null;
    // Détecte aussi les formes spéciales shiny (ex: unown_a_shiny)
    if (key === 'shiny') {
      const hasShinyFormOwned = Object.keys(seenForms).some(vt =>
        vt.includes('_shiny') && seenForms[vt]?.status === 'owned');
      if (latestCatch?.is_shiny || hasShinyFormOwned) status = 'owned';
    }
    return { key, status };
  });
}

// Une capture shiny ne couvre la variante 'shiny' de base que si c'est un shiny
// de la forme normale — un shiny régional/méga/gigamax/baron a sa propre variante.
function isBaseShinyCatch(c) {
  return !!c?.is_shiny
    && REGIONAL_FORM_TABLES.every(table => !table[c.form_label])
    && !/^(Méga|Gigamax|Baron)/.test(c.form_label || '');
}

function variantsCoveredByCatches(catches) {
  return new Set([
    ...catches.flatMap(c => REGIONAL_FORM_TABLES.map(table => table[c?.form_label])),
    ...(catches.some(isBaseShinyCatch) ? ['shiny'] : []),
  ].filter(Boolean));
}

function trackedVariants(variants, genderMode) {
  const gendered = r => genderMode !== 'any' ? [`${r}_male`, `${r}_female`, `${r}_shiny_male`, `${r}_shiny_female`] : [];
  return new Set([
    'shiny', 'asexue', 'asexue_shiny',
    ...['alolan', 'galarian', 'hisuian'].flatMap(r => [r, `${r}_shiny`, `${r}_asexue`, `${r}_asexue_shiny`, ...gendered(r)]),
    'mega', 'mega_x', 'mega_y', 'shiny_mega', 'shiny_mega_x', 'shiny_mega_y',
    'gigamax', 'shiny_gigamax',
    'troizepy', 'troizepy_shiny',
    // Formes Paldea (paldean_*) dynamiques par Pokémon. Races de Tauros (normal +
    // shiny) toujours requises ; formes régionales genrées (Axoloto : paldean_male…)
    // exclues en mode 'any' comme Galar/Hisui (couvertes alors par genderGroupsOk).
    ...(variants ? Object.keys(variants).filter(vt =>
      vt.startsWith('paldean') && (genderMode !== 'any' || !/^paldean_(shiny_)?(male|female)$/.test(vt))) : []),
    ...(genderMode === 'all'
      ? [...GENDER_VTS_FLAT].filter(vt => !vt.startsWith('alolan') && !vt.startsWith('galarian') && !vt.startsWith('hisuian'))
      : []),
  ]);
}

/**
 * @param {object} input
 * @param {boolean|null} input.canBeBaron    pokemon.can_be_baron (false = jamais Baron)
 * @param {object|null}  input.latestCatch   capture la plus récente
 * @param {object|null}  input.latestShinyCatch capture shiny la plus récente
 * @param {object}       input.seenForms     { [variant_type]: { status } }
 * @param {object|undefined} input.variants  { [variant_type]: image_url } (variantes existantes)
 * @param {boolean}      input.hasRegionalBaron une forme régionale du Pokémon peut être Baron
 * @param {object}       input.prefs         cf. DEFAULT_PREFS
 * @returns {{ formStatuses: {key: string, status: string|null}[], isComplete: boolean }}
 */
export function computeCardCompletion({
  canBeBaron, latestCatch = null, latestShinyCatch = null, seenForms = {},
  variants, hasRegionalBaron = false, prefs = DEFAULT_PREFS,
}) {
  const { genderFormsMode: genderMode, strictComplete, requireAllFormsForComplete } = { ...DEFAULT_PREFS, ...prefs };
  const isOwned = vt => seenForms[vt]?.status === 'owned';

  const formStatuses = formBadgeStatuses(seenForms, latestCatch);
  const badge = key => formStatuses.find(f => f.key === key)?.status;
  const strictOk = !strictComplete || (!!latestCatch && badge('shiny') === 'owned');

  const allSeenOwned = Object.entries(seenForms).every(([vt, f]) =>
    (genderMode === 'any' && GENDER_VTS_FLAT.has(vt)) ? true : f.status === 'owned');

  const covered = variantsCoveredByCatches([latestCatch, latestShinyCatch]);
  const isVtOwned = vt => isOwned(vt) || covered.has(vt);
  const isVtOk = vt => isVtOwned(vt)
    || (NEUTRALS_COVERED_BY_GENDER.has(vt) && (isVtOwned(`${vt}_male`) || isVtOwned(`${vt}_female`)));

  const allVariantsOwned = !variants
    || [...trackedVariants(variants, genderMode)].filter(vt => vt in variants).every(isVtOk);

  const genderGroupsOk = genderMode !== 'any' || GENDER_GROUPS.every(group => {
    const existsInGame = group.some(vt => (variants && vt in variants) || vt in seenForms);
    return !existsInGame || group.some(isOwned);
  });

  const hisuiCanBeBaron = hasRegionalBaron && Object.keys(seenForms).some(vt => vt.startsWith('hisuian'));
  const requiresBaron = canBeBaron !== false || hisuiCanBeBaron;
  // La carte premium exige le Baron Shiny en plus du Baron normal : le badge
  // « baron » fusionne baron + shiny_baron, on vérifie donc le shiny séparément.
  // Garde : au moins une forme réellement possédée (évite la complétion vide).
  const hasAnyOwned = !!latestCatch || Object.values(seenForms).some(f => f.status === 'owned');
  const formsOk = !requiresBaron
    ? allSeenOwned && allVariantsOwned && genderGroupsOk
    : badge('baron') === 'owned' && isOwned('shiny_baron') && allSeenOwned
      && (!requireAllFormsForComplete || (allVariantsOwned && genderGroupsOk));

  const isComplete = hasAnyOwned && strictOk && formsOk
    && formStatuses.every(f => !f.status || f.status === 'owned');

  return { formStatuses, isComplete };
}
