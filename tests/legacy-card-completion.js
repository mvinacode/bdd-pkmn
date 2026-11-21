/* eslint-disable no-unused-vars -- copie figée, on garde le code tel quel */
// COPIE FIGÉE de l'ancien calcul de complétion de presentation/card.js
// (avant son extraction dans domain/card-completion.js). Sert d'oracle au test
// comparatif : ne pas modifier, sauf pour supprimer ce fichier un jour.
import {
  ALOLA_FORM_VT, GALAR_FORM_VT, HISUI_FORM_VT, SPECIAL_FORM_VT, PALDEA_FORM_VT,
  GENDER_GROUPS, GENDER_VTS_FLAT,
} from '../js/domain/constants.js';

const SPECIAL_FORMS_ICONS = [
  { key: 'shiny',   icon: '', variants: ['shiny','asexue_shiny','shiny_male','shiny_female','alolan_shiny','alolan_shiny_male','alolan_shiny_female','galarian_shiny','galarian_shiny_male','galarian_shiny_female','hisuian_shiny','hisuian_shiny_male','hisuian_shiny_female','paldean_shiny','paldean_shiny_male','paldean_shiny_female'] },
  { key: 'baron',   icon: '', variants: ['baron', 'shiny_baron'] },
  { key: 'mega',    icon: '', variants: ['mega','mega_x','mega_y','shiny_mega','shiny_mega_x','shiny_mega_y'] },
  { key: 'gigamax', icon: '', variants: ['gigamax','shiny_gigamax'] },
];
const esc = s => s;

export function legacyCardCompletion({ canBeBaron, catch_, recentShinyCatch, seenForms, variants, hasRegionalBaron, prefs }) {
  const seenFormsMap = seenForms;
  const formStatuses = SPECIAL_FORMS_ICONS.map(({ key, icon, variants }) => {
    const statuses = variants.map(vt => seenFormsMap[vt]?.status).filter(Boolean);
    let status = statuses.includes('owned') ? 'owned' : statuses.includes('seen') ? 'seen' : null;
    // Détecte aussi les formes spéciales shiny (ex: unown_a_shiny)
    if (key === 'shiny') {
      const hasShinyFormOwned = Object.keys(seenFormsMap).some(vt =>
        vt.includes('_shiny') && seenFormsMap[vt]?.status === 'owned'
      );
      if (catch_?.is_shiny || hasShinyFormOwned) status = 'owned';
    }
    return { key, icon, status };
  });
  const formIconsHtml = formStatuses
    .filter(({ status }) => !!status)
    .map(({ key, icon, status }) => `<img src="${esc(icon)}" alt="${key}" class="poke-form-icon poke-form-icon--${status}" width="18" height="18">`)
    .join('');
  const baronStatus  = formStatuses.find(f => f.key === 'baron')?.status;
  const shinyStatus  = formStatuses.find(f => f.key === 'shiny')?.status;
  const strictOk     = !prefs.strictComplete || (!!catch_ && shinyStatus === 'owned');

  const pokemonVMap  = variants;

  const genderMode = prefs.genderFormsMode || 'none';
  const allSeenOwned = Object.entries(seenFormsMap).every(([vt, f]) =>
    (genderMode === 'any' && GENDER_VTS_FLAT.has(vt)) ? true : f.status === 'owned'
  );

  // Une capture shiny ne couvre la variante 'shiny' de base que si c'est un shiny
  // de la forme normale — un shiny régional/méga/gigamax/baron a sa propre variante
  const isBaseShinyCatch = c => !!c?.is_shiny
    && !ALOLA_FORM_VT[c.form_label] && !GALAR_FORM_VT[c.form_label]
    && !HISUI_FORM_VT[c.form_label] && !PALDEA_FORM_VT[c.form_label] && !SPECIAL_FORM_VT[c.form_label]
    && !/^(Méga|Gigamax|Baron)/.test(c.form_label || '');

  const catchCoveredVts = new Set([
    ALOLA_FORM_VT[catch_?.form_label],
    ALOLA_FORM_VT[recentShinyCatch?.form_label],
    GALAR_FORM_VT[catch_?.form_label],
    GALAR_FORM_VT[recentShinyCatch?.form_label],
    HISUI_FORM_VT[catch_?.form_label],
    HISUI_FORM_VT[recentShinyCatch?.form_label],
    PALDEA_FORM_VT[catch_?.form_label],
    PALDEA_FORM_VT[recentShinyCatch?.form_label],
    SPECIAL_FORM_VT[catch_?.form_label],
    SPECIAL_FORM_VT[recentShinyCatch?.form_label],
    ...(isBaseShinyCatch(catch_) || isBaseShinyCatch(recentShinyCatch) ? ['shiny'] : []),
  ].filter(Boolean));

  const TRACKED_VT = new Set([
    'shiny','asexue','asexue_shiny',
    'alolan','alolan_shiny','alolan_asexue','alolan_asexue_shiny',
    ...(genderMode !== 'any' ? ['alolan_male','alolan_female','alolan_shiny_male','alolan_shiny_female'] : []),
    'galarian','galarian_shiny','galarian_asexue','galarian_asexue_shiny',
    ...(genderMode !== 'any' ? ['galarian_male','galarian_female','galarian_shiny_male','galarian_shiny_female'] : []),
    'hisuian','hisuian_shiny','hisuian_asexue','hisuian_asexue_shiny',
    ...(genderMode !== 'any' ? ['hisuian_male','hisuian_female','hisuian_shiny_male','hisuian_shiny_female'] : []),
    'mega','mega_x','mega_y','shiny_mega','shiny_mega_x','shiny_mega_y',
    'gigamax','shiny_gigamax',
    'troizepy','troizepy_shiny',
    // Formes Paldea (paldean_*) dynamiques par Pokémon. Races de Tauros (normal +
    // shiny) toujours requises ; formes régionales genrées (Axoloto : paldean_male…)
    // exclues en mode 'any' comme Galar/Hisui (couvertes alors par genderGroupsOk).
    ...(pokemonVMap ? Object.keys(pokemonVMap).filter(vt =>
        vt.startsWith('paldean') && (genderMode !== 'any' || !/^paldean_(shiny_)?(male|female)$/.test(vt))) : []),
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
  const hisuiCanBeBaron = hasHisuianForms && !!hasRegionalBaron;
  const requiresBaronForComplete = canBeBaron !== false || hisuiCanBeBaron;
  // La carte premium exige le Baron Shiny en plus du Baron normal : le statut
  // « baron » fusionne baron + shiny_baron, on vérifie donc le shiny séparément.
  const shinyBaronOwned = seenFormsMap['shiny_baron']?.status === 'owned';
  // Garde : au moins une forme réellement possédée (évite la complétion vacuuse sur vide)
  const hasAnyOwnedStatus = !!catch_ || Object.values(seenFormsMap).some(f => f.status === 'owned');
  const isComplete = hasAnyOwnedStatus && strictOk
    && (!requiresBaronForComplete
      ? allSeenOwned && allVariantsOwned && genderGroupsOk
      : baronStatus === 'owned' && shinyBaronOwned && allSeenOwned && (!prefs.requireAllFormsForComplete || (allVariantsOwned && genderGroupsOk)))
    && formStatuses.every(f => !f.status || f.status === 'owned');

  return { formStatuses: formStatuses.map(({ key, status }) => ({ key, status })), isComplete };
}
