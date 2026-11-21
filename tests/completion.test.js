import { beforeEach, describe, expect, it } from 'vitest';
import { store } from '../js/store.js';
import { getVariantStatus } from '../js/domain/completion.js';

const seen = (number, entries) => {
  store.seenMap[number] = Object.fromEntries(
    Object.entries(entries).map(([vt, status]) => [vt, { status }]),
  );
};

describe('getVariantStatus', () => {
  beforeEach(() => { store.seenMap = {}; });

  it('renvoie une chaîne vide sans variant_type ni données', () => {
    expect(getVariantStatus(25, null)).toBe('');
    expect(getVariantStatus(25, 'normal')).toBe('');
  });

  it('renvoie le statut direct en priorité', () => {
    seen(25, { normal: 'seen', male: 'owned' });
    expect(getVariantStatus(25, 'normal')).toBe('seen');
  });

  it('le neutre reflète le mâle, puis la femelle', () => {
    seen(25, { female: 'owned' });
    expect(getVariantStatus(25, 'normal')).toBe('owned');
    seen(25, { male: 'seen', female: 'owned' });
    expect(getVariantStatus(25, 'normal')).toBe('seen');
  });

  it('chaque sexe reflète le neutre', () => {
    seen(25, { shiny: 'owned' });
    expect(getVariantStatus(25, 'shiny_male')).toBe('owned');
    expect(getVariantStatus(25, 'shiny_female')).toBe('owned');
  });

  it.each(['alolan', 'galarian', 'hisuian', 'paldean'])('applique les paires à la région %s', (region) => {
    seen(194, { [`${region}_shiny_female`]: 'owned' });
    expect(getVariantStatus(194, `${region}_shiny`)).toBe('owned');
    expect(getVariantStatus(194, `${region}_shiny_male`)).toBe('');
  });

  it('ne mélange pas les régions entre elles', () => {
    seen(52, { galarian: 'owned' });
    expect(getVariantStatus(52, 'alolan')).toBe('');
  });

  it('reflète les formes spéciales genrées via le suffixe _female', () => {
    seen(25, { partner_shiny: 'owned' });
    expect(getVariantStatus(25, 'partner_shiny_female')).toBe('owned');
    seen(25, { partner_female: 'seen' });
    expect(getVariantStatus(25, 'partner')).toBe('seen');
  });
});
