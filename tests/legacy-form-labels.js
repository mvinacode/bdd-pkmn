// COPIE FIGÉE de formLabelToVariantType de journal.js (avant son déplacement
// dans domain/form-labels.js). Oracle du test comparatif : ne pas modifier.
import { SPECIAL_FORM_VT } from '../js/domain/constants.js';

export function legacyFormLabelToVariantType(label) {
  const MAP = {
    'Normale': 'normal',          'Asexué': 'normal',
    'Shiny':   'shiny',           'Asexué Shiny': 'shiny',
    'Mâle':    'male',            'Mâle Shiny':    'shiny_male',
    'Femelle': 'female',          'Femelle Shiny': 'shiny_female',
    'Baron':   'baron',           'Baron Shiny':   'shiny_baron',
    'Alola':              'alolan',            'Alola Shiny':             'alolan_shiny',
    'Alola Asexué':      'alolan',            'Alola Asexué Shiny':    'alolan_shiny',
    'Alola Mâle':         'alolan_male',       'Alola Mâle Shiny':       'alolan_shiny_male',
    'Alola Femelle':      'alolan_female',     'Alola Femelle Shiny':    'alolan_shiny_female',
    'Alola Baron':        'baron',             'Alola Baron Shiny':      'shiny_baron',
    'Galar':              'galarian',          'Galar Shiny':            'galarian_shiny',
    'Galar Asexué':      'galarian',          'Galar Asexué Shiny':    'galarian_shiny',
    'Galar Mâle':         'galarian_male',     'Galar Mâle Shiny':       'galarian_shiny_male',
    'Galar Femelle':      'galarian_female',   'Galar Femelle Shiny':    'galarian_shiny_female',
    'Galar Baron':        'baron',             'Galar Baron Shiny':      'shiny_baron',
    'Hisui':              'hisuian',           'Hisui Shiny':            'hisuian_shiny',
    'Hisui Asexué':      'hisuian',           'Hisui Asexué Shiny':    'hisuian_shiny',
    'Hisui Mâle':         'hisuian_male',      'Hisui Mâle Shiny':       'hisuian_shiny_male',
    'Hisui Femelle':      'hisuian_female',    'Hisui Femelle Shiny':    'hisuian_shiny_female',
    'Hisui Baron':        'baron',             'Hisui Baron Shiny':      'shiny_baron',
    'Paldea':             'paldean',           'Paldea Shiny':           'paldean_shiny',
    'Paldea Asexué':     'paldean',           'Paldea Asexué Shiny':   'paldean_shiny',
    'Paldea Mâle':        'paldean_male',      'Paldea Mâle Shiny':      'paldean_shiny_male',
    'Paldea Femelle':     'paldean_female',    'Paldea Femelle Shiny':   'paldean_shiny_female',
    'Paldea Baron':       'baron',             'Paldea Baron Shiny':     'shiny_baron',
    'Méga-Évolution':       'mega',       'Méga-Évolution Shiny':       'shiny_mega',
    'Méga-Évo. X':          'mega_x',     'Méga-Évo. X Shiny':          'shiny_mega_x',
    'Méga-Évo. Y':          'mega_y',     'Méga-Évo. Y Shiny':          'shiny_mega_y',
    'Gigamax':              'gigamax',    'Gigamax Shiny':              'shiny_gigamax',
    'Pichu Troizépi':       'troizepy',   'Pichu Troizépi Shiny':       'troizepy_shiny',
  };
  if (MAP[label]) return MAP[label];
  // Barons des formes spéciales (« Forme A Baron », « Forme ? Baron Shiny »…) : le
  // variant_type reste générique, seul le libellé porte la forme. Un fallback par
  // suffixe évite d'énumérer les 28 lettres de Zarbi dans la table ci-dessus.
  if (label?.endsWith(' Baron Shiny')) return 'shiny_baron';
  if (label?.endsWith(' Baron'))       return 'baron';
  // Formes spéciales (« Forme A », « Forme A Shiny ») : leur variant_type dérive de la
  // form_key. Sans ça, éditer ou supprimer une session Zarbi laisse un statut résiduel
  // dans pokemon_seen, car l'appelant ignore les libellés non résolus.
  if (label?.endsWith(' Shiny')) {
    const key = SPECIAL_FORM_VT[label.slice(0, -' Shiny'.length)];
    if (key) return key + '_shiny';
  }
  return SPECIAL_FORM_VT[label] || null;
}
