// Conversion d'un libellé de forme enregistré avec une capture (catches.form_label,
// ex. « Galar Femelle Shiny ») vers le variant_type de pokemon_seen / pokemon_variants
// (ex. galarian_shiny_female). Les tables régionales et spéciales viennent de
// constants.js : une seule source pour le tiroir, la carte et le journal.
import {
  ALOLA_FORM_VT, GALAR_FORM_VT, HISUI_FORM_VT, PALDEA_FORM_VT, PALDEAN_FORM_VT, SPECIAL_FORM_VT,
} from './constants.js';

const BASE_FORM_VT = {
  'Normale': 'normal',          'Asexué': 'normal',
  'Shiny':   'shiny',           'Asexué Shiny': 'shiny',
  'Mâle':    'male',            'Mâle Shiny':    'shiny_male',
  'Femelle': 'female',          'Femelle Shiny': 'shiny_female',
  'Baron':   'baron',           'Baron Shiny':   'shiny_baron',
  'Méga-Évolution':       'mega',       'Méga-Évolution Shiny':       'shiny_mega',
  'Méga-Évo. X':          'mega_x',     'Méga-Évo. X Shiny':          'shiny_mega_x',
  'Méga-Évo. Y':          'mega_y',     'Méga-Évo. Y Shiny':          'shiny_mega_y',
  'Gigamax':              'gigamax',    'Gigamax Shiny':              'shiny_gigamax',
};

const LABEL_TO_VT = {
  ...BASE_FORM_VT,
  ...ALOLA_FORM_VT, ...GALAR_FORM_VT, ...HISUI_FORM_VT, ...PALDEA_FORM_VT,
  // Races de Tauros (« Race Combative Mâle Shiny »…)
  ...PALDEAN_FORM_VT,
};

/** @returns {string|null} le variant_type, ou null si le libellé est inconnu */
export function formLabelToVariantType(label) {
  if (Object.hasOwn(LABEL_TO_VT, label ?? '')) return LABEL_TO_VT[label];
  // Barons (« Baron », « Alola Baron », « Forme A Baron Shiny »…) : le variant_type
  // reste générique, seul le libellé porte la forme ou la région.
  if (label?.endsWith(' Baron Shiny')) return 'shiny_baron';
  if (label?.endsWith(' Baron'))       return 'baron';
  // Formes spéciales (« Forme A », « Forme A Shiny ») : leur variant_type dérive de
  // la form_key. Sans ça, éditer ou supprimer une session Zarbi laisse un statut
  // résiduel dans pokemon_seen, car l'appelant ignore les libellés non résolus.
  if (label?.endsWith(' Shiny')) {
    const key = SPECIAL_FORM_VT[label.slice(0, -' Shiny'.length)];
    if (key) return key + '_shiny';
  }
  return SPECIAL_FORM_VT[label] || null;
}
