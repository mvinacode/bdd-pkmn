import { describe, expect, it } from 'vitest';
import { artworkStatus, evoFormStatus } from '../js/domain/modal-status.js';

const seen = entries => Object.fromEntries(Object.entries(entries).map(([vt, status]) => [vt, { status }]));
const NONE = { ownedNormal: false, seenNormal: false, ownedShiny: false, seenShiny: false };

describe('evoFormStatus', () => {
  it('obtenu si une variante de la forme est obtenue, vu si elle est seulement vue', () => {
    expect(evoFormStatus(seen({ shiny_mega: 'owned' }), null, 'mega')).toBe('caught');
    expect(evoFormStatus(seen({ mega_y: 'seen' }), null, 'mega')).toBe('seen');
    expect(evoFormStatus(seen({ male: 'owned' }), null, 'mega')).toBe('unseen');
  });

  it('une capture méga ou gigamax compte même sans statut', () => {
    expect(evoFormStatus(undefined, { form_label: 'Méga-Évo. X Shiny' }, 'mega')).toBe('caught');
    expect(evoFormStatus(undefined, { form_label: 'Gigamax' }, 'gigamax')).toBe('caught');
    expect(evoFormStatus(undefined, { form_label: 'Alola' }, 'alolan')).toBe('unseen');
  });
});

describe('artworkStatus', () => {
  it('colonne de base : capture normale ou shiny de la forme de base', () => {
    expect(artworkStatus({}, { form_label: 'Mâle', is_shiny: false }, { kind: 'base' }))
      .toEqual({ ...NONE, ownedNormal: true });
    expect(artworkStatus({}, { form_label: 'Shiny', is_shiny: true }, { kind: 'base' }))
      .toEqual({ ...NONE, ownedShiny: true });
  });

  it('colonne de base : une capture régionale ne colore pas la base', () => {
    expect(artworkStatus(seen({ alolan: 'owned' }), { form_label: 'Alola' }, { kind: 'base' })).toEqual(NONE);
  });

  it('colonne de base : statuts vus et obtenus, shiny à part', () => {
    expect(artworkStatus(seen({ female: 'owned', shiny_female: 'seen' }), null, { kind: 'base' }))
      .toEqual({ ...NONE, ownedNormal: true, seenShiny: true });
  });

  // Chaque forme compte pour elle-même : l'illustration de base ne reflète que la
  // forme de base (normale, shiny, mâle, femelle, asexuée).
  it.each([
    ['Hisui',          { hisuian_male: 'owned', hisuian_shiny_female: 'seen' }],
    ['Alola',          { alolan: 'owned' }],
    ['race de Tauros', { paldean_combat: 'owned' }],
    ['méga',           { mega: 'owned', shiny_mega_x: 'seen' }],
    ['gigamax',        { gigamax: 'owned' }],
    ['baron',          { baron: 'owned', shiny_baron: 'owned' }],
    ['forme spéciale', { unown_a: 'owned', partner_female: 'seen', troizepy_shiny: 'owned' }],
  ])('colonne de base : une forme %s seule ne colore pas la base', (_name, forms) => {
    expect(artworkStatus(seen(forms), null, { kind: 'base' })).toEqual(NONE);
  });

  it.each([
    ['Hisui Mâle', false], ['Race Combative Mâle', false], ['Méga-Évolution', false],
    ['Gigamax Shiny', true], ['Baron', false], ['Forme A', false], ['Lune Vermeille Shiny', true],
  ])('colonne de base : une capture « %s » ne colore pas la base', (form_label, is_shiny) => {
    expect(artworkStatus({}, { form_label, is_shiny }, { kind: 'base' })).toEqual(NONE);
  });

  it('colonne de base : formes de base genrées et asexuées', () => {
    expect(artworkStatus(seen({ asexue_shiny: 'owned', male: 'seen' }), null, { kind: 'base' }))
      .toEqual({ ...NONE, seenNormal: true, ownedShiny: true });
    expect(artworkStatus({}, { form_label: 'Asexué Shiny', is_shiny: true }, { kind: 'base' }))
      .toEqual({ ...NONE, ownedShiny: true });
  });

  it('Zarbi et Deusolourdo (sans forme de base) : l’illustration principale reflète leurs formes', () => {
    const zarbi = { kind: 'base', pokemonNumber: 201 };
    expect(artworkStatus(seen({ unown_a: 'owned', unown_b_shiny: 'seen' }), null, zarbi))
      .toEqual({ ...NONE, ownedNormal: true, seenShiny: true });
    expect(artworkStatus({}, { form_label: 'Forme ? Shiny', is_shiny: true }, zarbi))
      .toEqual({ ...NONE, ownedShiny: true });
    expect(artworkStatus(seen({ double: 'owned' }), null, { kind: 'base', pokemonNumber: 982 }).ownedNormal).toBe(true);
    expect(artworkStatus({}, null, zarbi)).toEqual(NONE);
  });

  it('colonne régionale : seulement sa région', () => {
    const forms = seen({ paldean_combat: 'owned', paldean_aqua_shiny: 'seen' });
    expect(artworkStatus(forms, null, { kind: 'regional', region: 'paldean_combat' })).toEqual({ ...NONE, ownedNormal: true });
    expect(artworkStatus(forms, null, { kind: 'regional', region: 'paldean_aqua' })).toEqual({ ...NONE, seenShiny: true });
  });

  it('colonnes méga et gigamax', () => {
    const forms = seen({ shiny_mega_x: 'owned', gigamax: 'seen' });
    expect(artworkStatus(forms, null, { kind: 'mega' })).toEqual({ ...NONE, ownedShiny: true });
    expect(artworkStatus(forms, null, { kind: 'gigamax' })).toEqual({ ...NONE, seenNormal: true });
  });

  it('forme spéciale : clé exacte, sans confondre les lettres de Zarbi', () => {
    const forms = seen({ unown_a: 'owned', unown_a_shiny: 'seen', unown_ab: 'owned' });
    expect(artworkStatus(forms, null, { kind: 'special', sfKey: 'unown_a' }))
      .toEqual({ ...NONE, ownedNormal: true, seenShiny: true });
    expect(artworkStatus(forms, null, { kind: 'special', sfKey: 'unown_b' })).toEqual(NONE);
  });
});
