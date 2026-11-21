import { describe, expect, it } from 'vitest';
import { findVariantSprite, spriteFallbackChain } from '../js/domain/sprite-chains.js';

const variants = list => Object.fromEntries(list.map(vt => [vt, `${vt}.png`]));

describe('spriteFallbackChain', () => {
  it.each(['alolan', 'galarian', 'hisuian', 'paldean'])('%s : le shiny genré retombe sur le shiny puis la base', r => {
    expect(spriteFallbackChain(`${r}_shiny_female`)).toEqual([`${r}_shiny_female`, `${r}_shiny`, r]);
  });

  it('méga, gigamax et baron prennent le sprite de base', () => {
    expect(spriteFallbackChain('mega_x')).toEqual(['normal', 'asexue', 'male', 'female']);
    expect(spriteFallbackChain('shiny_baron')[0]).toBe('shiny');
  });

  it('une variante inconnue ne cherche qu’elle-même', () => {
    expect(spriteFallbackChain('unown_a')).toEqual(['unown_a']);
    expect(spriteFallbackChain('toString')).toEqual(['toString']);
  });
});

describe('findVariantSprite — cas réels', () => {
  it('Artikodin de Galar (#144) n’existe qu’en asexué', () => {
    const artikodin = variants(['normal', 'shiny', 'galarian_asexue', 'galarian_asexue_shiny']);
    expect(findVariantSprite(artikodin, 'galarian')).toBe('galarian_asexue.png');
    expect(findVariantSprite(artikodin, 'galarian_shiny')).toBe('galarian_asexue_shiny.png');
  });

  it('Farfuret de Hisui (#215) n’existe qu’en genré', () => {
    const farfuret = variants(['hisuian_male', 'hisuian_female', 'hisuian_shiny_male', 'hisuian_shiny_female']);
    expect(findVariantSprite(farfuret, 'hisuian_shiny_female')).toBe('hisuian_shiny_female.png');
  });

  it('Tauros de Paldéa (#128) : race shiny absente => race normale', () => {
    const tauros = variants(['male', 'paldean_combat']);
    expect(findVariantSprite(tauros, 'paldean_combat')).toBe('paldean_combat.png');
    expect(findVariantSprite(tauros, 'paldean_combat_shiny')).toBe('paldean_combat.png');
    expect(findVariantSprite(tauros, 'paldean_aqua')).toBeNull();
  });

  it('Méditikka (#307) : un méga sans sprite neutre prend le mâle', () => {
    expect(findVariantSprite(variants(['male', 'female']), 'mega')).toBe('male.png');
  });

  it('renvoie null sans variantes', () => {
    expect(findVariantSprite(undefined, 'normal')).toBeNull();
  });
});
