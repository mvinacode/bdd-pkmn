import { beforeEach, describe, expect, it } from 'vitest';
import { store } from '../js/store.js';
import {
  getAlolanSprite, getGalarianSprite, getPaldeanSprite, getSpecialFormSprite,
} from '../js/domain/sprites.js';

describe('sprites régionaux', () => {
  beforeEach(() => { store.variantMap = {}; store.specialFormsMap = {}; });

  it('le shiny genré retombe sur le shiny neutre puis la forme de base', () => {
    store.variantMap[52] = { alolan_shiny: 'a-shiny.png', alolan: 'a.png' };
    expect(getAlolanSprite(52, 'alolan_shiny_female')).toBe('a-shiny.png');
    store.variantMap[52] = { alolan: 'a.png' };
    expect(getAlolanSprite(52, 'alolan_shiny_male')).toBe('a.png');
  });

  it('utilise la forme asexuée quand la région n’a pas de neutre', () => {
    store.variantMap[77] = { galarian_asexue: 'g.png' };
    expect(getGalarianSprite(77, 'galarian')).toBe('g.png');
  });

  it('renvoie null sans aucun sprite', () => {
    expect(getAlolanSprite(1, 'alolan')).toBeNull();
  });

  it('Paldéa : le shiny absent retombe sur la même race non shiny', () => {
    store.variantMap[128] = { paldean_combat: 'combat.png' };
    expect(getPaldeanSprite(128, 'paldean_combat_shiny')).toBe('combat.png');
    expect(getPaldeanSprite(128, 'paldean_blaze_shiny')).toBeNull();
  });

  it('formes spéciales : image shiny avec repli sur l’image normale', () => {
    store.specialFormsMap[201] = { a: { image_url: 'a.png', image_url_shiny: 'a-s.png' }, b: { image_url: 'b.png' } };
    expect(getSpecialFormSprite(201, 'a_shiny')).toBe('a-s.png');
    expect(getSpecialFormSprite(201, 'b_shiny')).toBe('b.png');
    expect(getSpecialFormSprite(201, 'z')).toBeNull();
  });
});
