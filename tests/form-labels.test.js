import { describe, expect, it } from 'vitest';
import { formLabelToVariantType } from '../js/domain/form-labels.js';
import {
  ALOLA_FORM_VT, GALAR_FORM_VT, HISUI_FORM_VT, PALDEA_FORM_VT, SPECIAL_FORM_VT,
} from '../js/domain/constants.js';
import { legacyFormLabelToVariantType } from './legacy-form-labels.js';

const REGIONS = ['', 'Alola ', 'Galar ', 'Hisui ', 'Paldea '];
const FORMS = ['Normale', 'Asexué', 'Shiny', 'Mâle', 'Femelle', 'Baron', 'Méga-Évolution',
  'Méga-Évo. X', 'Méga-Évo. Y', 'Gigamax', 'Pichu Troizépi'];
const ALL_LABELS = [...new Set([
  ...REGIONS.flatMap(r => FORMS.flatMap(f => [`${r}${f}`, `${r}${f} Shiny`])),
  ...REGIONS.flatMap(r => ['Asexué Shiny', 'Mâle Shiny', 'Femelle Shiny'].map(f => `${r}${f}`)),
  'Alola', 'Galar', 'Hisui', 'Paldea',
  ...[ALOLA_FORM_VT, GALAR_FORM_VT, HISUI_FORM_VT, PALDEA_FORM_VT, SPECIAL_FORM_VT].flatMap(Object.keys),
  ...Object.keys(SPECIAL_FORM_VT).flatMap(l => [`${l} Shiny`, `${l} Baron`, `${l} Baron Shiny`]),
  'Race Combative Mâle', 'Race Aquatique Mâle Shiny', '', 'Inconnu', 'Shiny Shiny',
])];

describe('formLabelToVariantType', () => {
  it(`équivaut à l’ancienne version du journal sur ${ALL_LABELS.length} libellés`, () => {
    for (const label of [...ALL_LABELS, null, undefined]) {
      expect(formLabelToVariantType(label), String(label)).toBe(legacyFormLabelToVariantType(label));
    }
  });

  it.each([
    ['Galar Femelle Shiny', 'galarian_shiny_female'],
    ['Alola Asexué', 'alolan'],
    ['Hisui Baron Shiny', 'shiny_baron'],
    ['Forme ? Shiny', 'unown_question_shiny'],
    ['Lune Vermeille Shiny', 'scarlet_moon_shiny'],
    ['Méga-Évo. Y Shiny', 'shiny_mega_y'],
    ['Inconnu', null],
  ])('%s → %s', (label, vt) => {
    expect(formLabelToVariantType(label)).toBe(vt);
  });
});
