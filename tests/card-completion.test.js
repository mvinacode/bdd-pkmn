import { describe, expect, it } from 'vitest';
import { computeCardCompletion } from '../js/domain/card-completion.js';
import { SPECIAL_FORM_VT, PALDEA_FORM_VT } from '../js/domain/constants.js';
import { legacyCardCompletion } from './legacy-card-completion.js';

// Jeux de variantes réels (pokemon_variants), relevés en base le 2026-11-21.
const VARIANT_SETS = {
  tengalice: ['male', 'shiny_male', 'female', 'shiny_female'],
  charmina:  ['male', 'shiny_male', 'female', 'shiny_female', 'mega', 'shiny_mega'],
  axoloto:   ['male', 'shiny_male', 'female', 'shiny_female', 'paldean', 'paldean_shiny'],
  tauros:    ['male', 'shiny_male', 'paldean_combat', 'paldean_combat_shiny', 'paldean_blaze', 'paldean_blaze_shiny', 'paldean_aqua', 'paldean_aqua_shiny'],
  miaouss:   ['normal', 'shiny', 'alolan', 'alolan_shiny', 'galarian', 'galarian_shiny', 'gigamax', 'shiny_gigamax'],
  canarticho:['normal', 'shiny', 'galarian', 'galarian_shiny'],
  zarbi:     ['asexue', 'asexue_shiny'],
  // Formes régionales genrées hypothétiques : exercent les replis mâle/femelle.
  hisuiGenre:['normal', 'shiny', 'hisuian_male', 'hisuian_female', 'hisuian_shiny_male', 'hisuian_shiny_female', 'hisuian', 'hisuian_shiny'],
};
const toVariantMap = list => Object.fromEntries(list.map(vt => [vt, `${vt}.png`]));

const SEEN_KEYS = [...new Set([
  ...Object.values(VARIANT_SETS).flat(),
  'baron', 'shiny_baron', 'alolan_male', 'alolan_female', 'alolan_shiny_male',
  'galarian_male', 'galarian_shiny_female', 'paldean_male', 'asexue_shiny', 'unown_a', 'unown_a_shiny', 'troizepy',
])];
const CATCH_LABELS = [
  'Normale', 'Shiny', 'Mâle', 'Femelle Shiny', 'Alola', 'Alola Shiny', 'Galar Mâle', 'Hisui Femelle Shiny',
  'Paldea', 'Paldea Shiny', 'Méga-Évolution', 'Méga-Évolution Shiny', 'Gigamax Shiny', 'Baron', 'Baron Shiny',
  ...Object.keys(SPECIAL_FORM_VT).slice(0, 4), ...Object.keys(PALDEA_FORM_VT).slice(0, 2),
];

// Générateur pseudo-aléatoire déterministe : le test est reproductible.
function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}
const pick = (rand, list) => list[Math.floor(rand() * list.length)];

function randomCase(rand) {
  // Densité variable d'un cas à l'autre : des collections clairsemées comme
  // des quasi complètes, pour exercer aussi les cartes « complètes ».
  const pPresent = 0.1 + rand() * 0.6;
  const pSeen = rand() < 0.5 ? 0 : 0.1;
  const seenForms = {};
  for (const vt of SEEN_KEYS) {
    if (rand() >= pPresent) continue;
    seenForms[vt] = { status: rand() < pSeen ? 'seen' : 'owned' };
  }
  const randomCatch = shiny => rand() < 0.4 ? null : { is_shiny: shiny ?? rand() < 0.5, form_label: pick(rand, CATCH_LABELS) };
  const setName = pick(rand, [...Object.keys(VARIANT_SETS), null]);
  return {
    canBeBaron: pick(rand, [true, false, null]),
    latestCatch: randomCatch(),
    latestShinyCatch: randomCatch(true),
    seenForms,
    variants: setName ? toVariantMap(VARIANT_SETS[setName]) : undefined,
    hasRegionalBaron: rand() < 0.3,
    prefs: {
      genderFormsMode: pick(rand, ['all', 'any', 'none']),
      strictComplete: rand() < 0.5,
      requireAllFormsForComplete: rand() < 0.5,
    },
  };
}

const legacy = c => legacyCardCompletion({
  canBeBaron: c.canBeBaron, catch_: c.latestCatch, recentShinyCatch: c.latestShinyCatch,
  seenForms: c.seenForms, variants: c.variants, hasRegionalBaron: c.hasRegionalBaron, prefs: c.prefs,
});

describe('computeCardCompletion — équivalence avec l’ancien code de card.js', () => {
  it('donne le même résultat sur 20 000 cas générés', () => {
    const rand = rng(42);
    let completes = 0;
    for (let i = 0; i < 20_000; i++) {
      const c = randomCase(rand);
      const expected = legacy(c);
      expect(computeCardCompletion(c), JSON.stringify(c)).toEqual(expected);
      if (expected.isComplete) completes++;
    }
    // Le générateur doit produire assez de cartes complètes pour que le test ait du sens.
    expect(completes).toBeGreaterThan(200);
  });
});

describe('computeCardCompletion — cas lisibles', () => {
  const ALL = { genderFormsMode: 'all', strictComplete: true, requireAllFormsForComplete: true };
  const owned = (...vts) => Object.fromEntries(vts.map(vt => [vt, { status: 'owned' }]));
  const tengalice = toVariantMap(VARIANT_SETS.tengalice);
  const normalCatch = { is_shiny: false, form_label: 'Mâle' };

  it('une carte sans aucune forme possédée n’est jamais complète', () => {
    expect(computeCardCompletion({ canBeBaron: false, variants: tengalice, prefs: ALL }).isComplete).toBe(false);
  });

  it('Tengalice (sans Baron) : complet avec les 4 formes genrées', () => {
    const r = computeCardCompletion({
      canBeBaron: false, latestCatch: normalCatch,
      seenForms: owned('male', 'female', 'shiny_male', 'shiny_female'), variants: tengalice, prefs: ALL,
    });
    expect(r.isComplete).toBe(true);
    expect(r.formStatuses.find(f => f.key === 'shiny').status).toBe('owned');
  });

  it('Tengalice : une femelle shiny manquante empêche la complétion en mode « all »', () => {
    const r = computeCardCompletion({
      canBeBaron: false, latestCatch: normalCatch,
      seenForms: owned('male', 'female', 'shiny_male'), variants: tengalice, prefs: ALL,
    });
    expect(r.isComplete).toBe(false);
  });

  it('en mode « any », un seul sexe par paire suffit', () => {
    const r = computeCardCompletion({
      canBeBaron: false, latestCatch: normalCatch,
      seenForms: owned('male', 'shiny_male'), variants: tengalice,
      prefs: { genderFormsMode: 'any', strictComplete: true, requireAllFormsForComplete: true },
    });
    expect(r.isComplete).toBe(true);
  });

  it('un Pokémon qui peut être Baron exige Baron ET Baron Shiny', () => {
    const base = {
      canBeBaron: true, latestCatch: { is_shiny: false, form_label: 'Normale' },
      variants: toVariantMap(VARIANT_SETS.canarticho), prefs: ALL,
    };
    const forms = ['shiny', 'galarian', 'galarian_shiny', 'baron'];
    expect(computeCardCompletion({ ...base, seenForms: owned(...forms) }).isComplete).toBe(false);
    expect(computeCardCompletion({ ...base, seenForms: owned(...forms, 'shiny_baron') }).isComplete).toBe(true);
  });

  it('un badge seulement « vu » bloque la complétion', () => {
    const r = computeCardCompletion({
      canBeBaron: false, latestCatch: normalCatch,
      seenForms: { ...owned('male', 'female', 'shiny_male', 'shiny_female'), mega: { status: 'seen' } },
      variants: tengalice, prefs: ALL,
    });
    expect(r.formStatuses.find(f => f.key === 'mega').status).toBe('seen');
    expect(r.isComplete).toBe(false);
  });

  it('une capture régionale shiny ne valide pas le shiny de base', () => {
    const r = computeCardCompletion({
      canBeBaron: false, latestCatch: { is_shiny: true, form_label: 'Alola Shiny' },
      seenForms: owned('normal', 'alolan', 'alolan_shiny', 'galarian', 'galarian_shiny', 'gigamax', 'shiny_gigamax'),
      variants: toVariantMap(VARIANT_SETS.miaouss), prefs: ALL,
    });
    expect(r.isComplete).toBe(false);
  });
});
