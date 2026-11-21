import { beforeEach, describe, expect, it } from 'vitest';
import { store } from '../js/store.js';
import { createCatchRecorder, formSprite } from '../js/application/catch-recording.js';

const TRIM = '/upload/e_trim:10/c_pad,w_128,h_128,b_rgb:ffffff00/';
const cld = name => `https://res.cloudinary.com/x/image/upload/${name}.png`;

function fakeRepo({ failInsertAt = null } = {}) {
  const calls = [];
  let n = 0;
  return {
    calls,
    insertCatch: async row => {
      calls.push(['insertCatch', row]);
      if (n++ === failInsertAt) return { data: null, error: { message: 'insert' } };
      return { data: { ...row, id: n, created_at: `t${n}` }, error: null };
    },
    addToSeen: async (number, data) => { calls.push(['addToSeen', number, data]); },
    fetchVariantMap: async nums => { calls.push(['fetchVariantMap', nums]); return { [nums[0]]: { male: 'm.png' } }; },
    fetchSpecialFormsForNumbers: async nums => { calls.push(['fetchSpecialForms', nums]); return {}; },
  };
}

const meditikka = { number: 307, name_fr: 'Méditikka', iconNormal: cld('icon'), iconShiny: null };
const male       = { variant_type: 'male', label: 'Mâle', sprite: cld('male') };
const shinyFemale = { variant_type: 'shiny_female', label: 'Femelle Shiny', sprite: null };
const opts = { ball: { name: 'Luxe Ball', imageUrl: 'luxe.png' }, date: '2026-11-21', game: 'Violet', notes: null, sessionId: 'S1' };

beforeEach(() => {
  store.ownerUuid = 'owner-1';
  store.catchByNumber = {};
  store.shinyCatchByNumber = {};
  store.seenMap = {};
  store.variantMap = {};
  store.specialFormsMap = {};
});

describe('formSprite', () => {
  it('prend le sprite de la forme, recadré par Cloudinary', () => {
    expect(formSprite(meditikka, male)).toBe(cld('male').replace('/upload/', TRIM));
  });
  it('sinon l’icône du Pokémon, sinon le sprite PokeAPI', () => {
    expect(formSprite(meditikka, { variant_type: 'female' })).toBe(cld('icon').replace('/upload/', TRIM));
    expect(formSprite(meditikka, shinyFemale)).toMatch(/sprites\/pokemon\/shiny\/307\.png$/);
  });
});

describe('recordCatches', () => {
  it('insère une capture par forme dans la même session et les marque obtenues', async () => {
    const repo = fakeRepo();
    const { error } = await createCatchRecorder(repo).recordCatches(meditikka, [male, shinyFemale], opts);
    expect(error).toBeNull();
    const inserts = repo.calls.filter(([op]) => op === 'insertCatch').map(([, row]) => row);
    expect(inserts).toHaveLength(2);
    expect(inserts[0]).toMatchObject({
      owner_uuid: 'owner-1', pokemon_number: 307, pokemon_name_fr: 'Méditikka', form_label: 'Mâle',
      is_shiny: false, ball_name: 'Luxe Ball', ball_image_url: 'luxe.png', session_id: 'S1', game: 'Violet',
    });
    expect(inserts[1]).toMatchObject({ form_label: 'Femelle Shiny', is_shiny: true, session_id: 'S1' });
    const seen = repo.calls.filter(([op]) => op === 'addToSeen').map(([, , d]) => [d.variant_type, d.status]);
    expect(seen).toEqual([['male', 'owned'], ['shiny_female', 'owned']]);
  });

  it('met la carte à jour avec la dernière capture et charge les sprites du nouveau Pokémon', async () => {
    const repo = fakeRepo();
    await createCatchRecorder(repo).recordCatches(meditikka, [male, shinyFemale], opts);
    expect(store.catchByNumber[307].form_label).toBe('Femelle Shiny');
    expect(store.shinyCatchByNumber[307].form_label).toBe('Femelle Shiny');
    expect(repo.calls).toContainEqual(['fetchVariantMap', [307]]);
    await Promise.resolve();
    expect(store.variantMap[307]).toEqual({ male: 'm.png' });
  });

  it('ne recharge pas les sprites déjà connus', async () => {
    store.variantMap[307] = { male: 'deja.png' };
    const repo = fakeRepo();
    await createCatchRecorder(repo).recordCatches(meditikka, [male], opts);
    expect(repo.calls.some(([op]) => op === 'fetchVariantMap')).toBe(false);
  });

  it('s’arrête à la première insertion en échec sans toucher au store', async () => {
    const repo = fakeRepo({ failInsertAt: 1 });
    const { error } = await createCatchRecorder(repo).recordCatches(meditikka, [male, shinyFemale], opts);
    expect(error).toEqual({ message: 'insert' });
    expect(store.catchByNumber).toEqual({});
    expect(repo.calls.map(([op]) => op)).toEqual(['insertCatch', 'addToSeen', 'insertCatch']);
  });

  it('ne fait rien sans forme', async () => {
    store.catchByNumber[307] = { id: 1 };
    const repo = fakeRepo();
    expect(await createCatchRecorder(repo).recordCatches(meditikka, [], opts)).toEqual({ error: null });
    expect(store.catchByNumber[307]).toEqual({ id: 1 });
    expect(repo.calls).toEqual([]);
  });

  it('charge la forme spéciale capturée si elle manque', async () => {
    const repo = fakeRepo();
    const zarbi = { number: 201, name_fr: 'Zarbi', isSpecial: true, specialFormKey: 'unown_a' };
    await createCatchRecorder(repo).recordCatches(zarbi, [{ variant_type: 'unown_a', label: 'Forme A' }], opts);
    expect(repo.calls).toContainEqual(['fetchSpecialForms', [201]]);
  });
});

describe('markFormsSeen', () => {
  it('marque « vu », mais garde « obtenu » une forme déjà obtenue', async () => {
    store.seenMap[307] = { male: { status: 'owned' } };
    const repo = fakeRepo();
    await createCatchRecorder(repo).markFormsSeen(meditikka, [male, { variant_type: 'female', label: 'Femelle' }], opts);
    const seen = repo.calls.map(([, , d]) => [d.variant_type, d.status, d.form_label]);
    expect(seen).toEqual([['male', 'owned', 'Mâle'], ['female', 'seen', 'Femelle']]);
    expect(repo.calls.some(([op]) => op === 'insertCatch')).toBe(false);
  });

  it('une forme sans type ni libellé devient « normal » / « Normale »', async () => {
    const repo = fakeRepo();
    await createCatchRecorder(repo).markFormsSeen(meditikka, [{}], opts);
    expect(repo.calls[0][2]).toMatchObject({ variant_type: 'normal', form_label: 'Normale', is_shiny: false });
  });
});
