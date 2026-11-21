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
