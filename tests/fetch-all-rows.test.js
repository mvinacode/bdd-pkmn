import { describe, expect, it } from 'vitest';
import { fetchAllRows } from '../js/fetch-all-rows.js';

// Imite le constructeur de requêtes Supabase : .range(from, to) renvoie une
// tranche du tableau, plafonnée comme le fait le serveur.
function fakeQuery(table, { cap = Infinity, failAt = null } = {}) {
  const calls = [];
  const build = () => ({
    range: async (from, to) => {
      calls.push([from, to]);
      if (failAt === from) return { data: null, error: { message: 'boom' } };
      return { data: table.slice(from, Math.min(to + 1, from + cap)), error: null };
    },
  });
  return { build, calls };
}

const rows = n => Array.from({ length: n }, (_, i) => ({ id: i }));

describe('fetchAllRows', () => {
  it('récupère tout au-delà du plafond de 1 000 lignes', async () => {
    const { build, calls } = fakeQuery(rows(2350), { cap: 1000 });
    const { data, error } = await fetchAllRows(build);
    expect(error).toBeNull();
    expect(data).toHaveLength(2350);
    expect(data.at(-1).id).toBe(2349);
    expect(calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });

  it('fait une page supplémentaire vide quand le total tombe pile sur un multiple', async () => {
    const { build, calls } = fakeQuery(rows(2000));
    const { data } = await fetchAllRows(build);
    expect(data).toHaveLength(2000);
    expect(calls).toHaveLength(3);
  });

  it('renvoie un tableau vide sans données', async () => {
    const { build } = fakeQuery([]);
    expect(await fetchAllRows(build)).toEqual({ data: [], error: null });
  });

  it('remonte l’erreur avec les lignes déjà lues', async () => {
    const { build } = fakeQuery(rows(1500), { failAt: 1000 });
    const { data, error } = await fetchAllRows(build);
    expect(error).toEqual({ message: 'boom' });
    expect(data).toHaveLength(1000);
  });

  it('respecte une taille de page personnalisée', async () => {
    const { build, calls } = fakeQuery(rows(5));
    const { data } = await fetchAllRows(build, 2);
    expect(data).toHaveLength(5);
    expect(calls).toEqual([[0, 1], [2, 3], [4, 5]]);
  });
});
