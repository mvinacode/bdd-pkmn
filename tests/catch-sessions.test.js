import { describe, expect, it } from 'vitest';
import { createCatchSessions, sessionKeyOf } from '../js/application/catch-sessions.js';

// Fausse couche de données : enregistre les appels, peut échouer à la demande.
function fakeRepo({ failUpdate = false, failDeleteIds = [], failInsertLabels = [] } = {}) {
  const calls = [];
  let nextId = 100;
  return {
    calls,
    getOwnerUuid: () => 'owner-1',
    updateCatchesBySession: async (sessionId, updates) => {
      calls.push(['update', sessionId, updates]);
      return { error: failUpdate ? { message: 'update' } : null };
    },
    deleteCatch: async id => {
      calls.push(['deleteCatch', id]);
      return { error: failDeleteIds.includes(id) ? { message: 'delete' } : null };
    },
    insertCatch: async row => {
      calls.push(['insertCatch', row.form_label]);
      if (failInsertLabels.includes(row.form_label)) return { data: null, error: { message: 'insert' } };
      return { data: { ...row, id: nextId++ }, error: null };
    },
    deleteSeenByVariantType: async (owner, number, vt) => {
      calls.push(['deleteSeen', number, vt]);
      return { error: null };
    },
    upsertSeen: async row => {
      calls.push(['upsertSeen', row.pokemon_number, row.variant_type, row.status]);
      return { error: null };
    },
  };
}

const catchRow = (id, form_label, extra = {}) => ({
  id, form_label, session_id: 'S1', pokemon_number: 307, pokemon_name_fr: 'Méditikka',
  is_shiny: form_label.includes('Shiny'), ball_name: 'Poké Ball', ball_image_url: 'poke.png',
  caught_at: '2026-11-01', game: 'Violet', notes: 'note', sprite_url: `${form_label}.png`, ...extra,
});
const defaultSprite = (n, shiny) => `default-${n}-${shiny}.png`;
const editBase = { sessionId: 'S1', date: '2026-11-21', game: 'Écarlate', ball: null, selectedEntries: null, defaultSprite };

describe('sessionKeyOf', () => {
  it('prend le session_id, sinon l’id (anciennes captures)', () => {
    expect(sessionKeyOf({ id: 7, session_id: 'abc' })).toBe('abc');
    expect(sessionKeyOf({ id: 7, session_id: null })).toBe('7');
  });
});

describe('editSession', () => {
  it('met à jour date, jeu et ball de toute la session, sans toucher aux autres', async () => {
    const repo = fakeRepo();
    const other = catchRow(9, 'Mâle', { session_id: 'S2' });
    const { catches, error } = await createCatchSessions(repo).editSession(
      [catchRow(1, 'Mâle'), catchRow(2, 'Femelle'), other],
      { ...editBase, ball: { name: 'Luxe Ball', imageUrl: 'luxe.png' } },
    );
    expect(error).toBeNull();
    expect(repo.calls).toEqual([['update', 'S1', { caught_at: '2026-11-21', game: 'Écarlate', ball_name: 'Luxe Ball', ball_image_url: 'luxe.png' }]]);
    expect(catches.filter(c => c.session_id === 'S1').every(c => c.game === 'Écarlate' && c.ball_name === 'Luxe Ball')).toBe(true);
    expect(catches.find(c => c.id === 9)).toBe(other);
  });

  it('n’écrit pas la ball quand elle est inchangée', async () => {
    const repo = fakeRepo();
    await createCatchSessions(repo).editSession([catchRow(1, 'Mâle')], editBase);
    expect(repo.calls[0][2]).toEqual({ caught_at: '2026-11-21', game: 'Écarlate' });
  });

  it('s’arrête sur une erreur de mise à jour, sans rien modifier', async () => {
    const repo = fakeRepo({ failUpdate: true });
    const before = [catchRow(1, 'Mâle')];
    const { catches, error } = await createCatchSessions(repo).editSession(before, editBase);
    expect(error).toEqual({ message: 'update' });
    expect(catches).toBe(before);
    expect(repo.calls).toHaveLength(1);
  });

  it('retire une forme désélectionnée et libère son statut', async () => {
    const repo = fakeRepo();
    const { catches } = await createCatchSessions(repo).editSession(
      [catchRow(1, 'Mâle'), catchRow(2, 'Femelle')],
      { ...editBase, selectedEntries: [{ label: 'Mâle', variant_type: 'male' }] },
    );
    expect(catches.map(c => c.id)).toEqual([1]);
    expect(repo.calls.slice(1)).toEqual([['deleteCatch', 2], ['deleteSeen', 307, 'female']]);
  });

  it('garde le statut si une autre session conserve la même forme', async () => {
    const repo = fakeRepo();
    await createCatchSessions(repo).editSession(
      [catchRow(1, 'Mâle'), catchRow(2, 'Femelle'), catchRow(3, 'Femelle', { session_id: 'S2' })],
      { ...editBase, selectedEntries: [{ label: 'Mâle', variant_type: 'male' }] },
    );
    expect(repo.calls.some(([op]) => op === 'deleteSeen')).toBe(false);
  });

  it('ajoute une forme avec les infos de la session et la marque obtenue', async () => {
    const repo = fakeRepo();
    const { catches } = await createCatchSessions(repo).editSession(
      [catchRow(1, 'Mâle')],
      { ...editBase, selectedEntries: [
        { label: 'Mâle', variant_type: 'male' },
        { label: 'Femelle Shiny', variant_type: 'shiny_female', sprite: '' },
      ] },
    );
    const added = catches.find(c => c.form_label === 'Femelle Shiny');
    expect(added).toMatchObject({
      pokemon_number: 307, pokemon_name_fr: 'Méditikka', is_shiny: true, session_id: 'S1',
      ball_name: 'Poké Ball', ball_image_url: 'poke.png', notes: 'note', game: 'Écarlate',
      sprite_url: 'default-307-true.png', owner_uuid: 'owner-1',
    });
    expect(repo.calls.slice(1)).toEqual([['insertCatch', 'Femelle Shiny'], ['upsertSeen', 307, 'shiny_female', 'owned']]);
  });

  it('ignore une insertion en échec sans marquer la forme', async () => {
    const repo = fakeRepo({ failInsertLabels: ['Femelle'] });
    const { catches, error } = await createCatchSessions(repo).editSession(
      [catchRow(1, 'Mâle')],
      { ...editBase, selectedEntries: [{ label: 'Mâle', variant_type: 'male' }, { label: 'Femelle', variant_type: 'female' }] },
    );
    expect(error).toBeNull();
    expect(catches).toHaveLength(1);
    expect(repo.calls.some(([op]) => op === 'upsertSeen')).toBe(false);
  });

  it('Tauros : libère bien le statut de la race retirée', async () => {
    const repo = fakeRepo();
    await createCatchSessions(repo).editSession(
      [catchRow(1, 'Race Combative Mâle', { pokemon_number: 128 }), catchRow(2, 'Race Aquatique Mâle', { pokemon_number: 128 })],
      { ...editBase, selectedEntries: [{ label: 'Race Combative Mâle', variant_type: 'paldean_combat' }] },
    );
    expect(repo.calls).toContainEqual(['deleteSeen', 128, 'paldean_aqua']);
  });
});

describe('deleteSession', () => {
  it('supprime toute la session et libère les statuts orphelins', async () => {
    const repo = fakeRepo();
    const { catches, error } = await createCatchSessions(repo).deleteSession(
      [catchRow(1, 'Mâle'), catchRow(2, 'Femelle'), catchRow(3, 'Femelle', { session_id: 'S2' })], 'S1',
    );
    expect(error).toBeNull();
    expect(catches.map(c => c.id)).toEqual([3]);
    expect(repo.calls).toEqual([['deleteCatch', 1], ['deleteCatch', 2], ['deleteSeen', 307, 'male']]);
  });

  it('s’arrête à la première erreur et renvoie la liste d’origine', async () => {
    const repo = fakeRepo({ failDeleteIds: [2] });
    const before = [catchRow(1, 'Mâle'), catchRow(2, 'Femelle'), catchRow(4, 'Mâle Shiny')];
    const { catches, error } = await createCatchSessions(repo).deleteSession(before, 'S1');
    expect(error).toEqual({ message: 'delete' });
    expect(catches).toBe(before);
    expect(repo.calls).toEqual([['deleteCatch', 1], ['deleteCatch', 2]]);
  });

  it('ne fait rien pour une session inconnue', async () => {
    const repo = fakeRepo();
    const before = [catchRow(1, 'Mâle')];
    const { catches } = await createCatchSessions(repo).deleteSession(before, 'nope');
    expect(catches).toEqual(before);
    expect(repo.calls).toEqual([]);
  });
});
