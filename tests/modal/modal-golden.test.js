// @vitest-environment jsdom
//
// Test de référence (« golden master ») de la fiche Pokémon (openModal).
// Il ouvre de vraies fiches, avec différents états de collection, et compare le
// HTML produit à des fichiers de référence enregistrés AVANT le découpage de
// modal.js : la moindre différence d'affichage fait échouer le test.
//
// Les lectures Supabase sont rejouées depuis fixtures/supabase.json. Pour les
// réenregistrer depuis la vraie base (tables publiques, lecture seule) :
//   RECORD_FIXTURES=1 npx vitest run tests/modal
// Les écritures (upsert/delete) sont TOUJOURS simulées : ce test ne modifie
// jamais la base, même en enregistrement.
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const FIXTURES = path.join(import.meta.dirname, 'fixtures', 'supabase.json');
const RECORD = process.env.RECORD_FIXTURES === '1';
const WRITES = ['upsertSeen', 'deleteSeenForm', 'deleteSeenByVariantType', 'deleteAllSeenForPokemon',
  'insertCatch', 'deleteCatch', 'updateCatchesBySession', 'deleteCatchesBySession'];

vi.mock('../../js/supabase-client.js', async importOriginal => {
  const fsMod = await import('node:fs');
  const actual = await importOriginal();
  const recorded = {};
  const fixtures = !RECORD && fsMod.existsSync(FIXTURES) ? JSON.parse(fsMod.readFileSync(FIXTURES, 'utf8')) : {};
  const mocked = { __recorded: recorded };
  for (const [name, fn] of Object.entries(actual)) {
    if (typeof fn !== 'function') { mocked[name] = fn; continue; }
    if (WRITES.includes(name)) {
      mocked[name] = async row => ({ data: row && typeof row === 'object' ? { ...row, id: 1 } : null, error: null });
      continue;
    }
    mocked[name] = async (...args) => {
      const key = `${name}(${JSON.stringify(args)})`;
      if (RECORD) {
        const result = await fn(...args);
        recorded[key] = result;
        return structuredClone(result);
      }
      if (!(key in fixtures)) throw new Error(`Fixture manquante : ${key} (relancer avec RECORD_FIXTURES=1)`);
      return structuredClone(fixtures[key]);
    };
  }
  return mocked;
});

const { store } = await import('../../js/store.js');
const { openModal } = await import('../../js/presentation/modal.js');
const supabaseMock = await import('../../js/supabase-client.js');

const owned = s => ({ status: s });
const seenMapOf = entries => Object.fromEntries(Object.entries(entries).map(([vt, s]) => [vt, owned(s)]));

// Fiches représentatives × état de collection. `catches` : capture la plus
// récente par numéro (catchByNumber) ; `seen` : formes vues/obtenues par numéro.
const CASES = [
  { id: '307-vide',      number: 307 },
  { id: '307-partiel',   number: 307, catches: { 307: { form_label: 'Mâle', is_shiny: false } },
    seen: { 307: { male: 'owned', female: 'owned', shiny_female: 'seen' } } },
  { id: '308-mega',      number: 308, catches: { 307: { form_label: 'Mâle' }, 308: { form_label: 'Méga-Évolution' } },
    seen: { 307: { male: 'owned' }, 308: { mega: 'owned', male: 'owned', shiny_mega: 'seen' } } },
  { id: '128-tauros',    number: 128, catches: { 128: { form_label: 'Race Combative Mâle' } },
    seen: { 128: { paldean_combat: 'owned', paldean_aqua_shiny: 'seen', male: 'owned' } } },
  { id: '128-onglet-race', number: 128, pendingIllusTab: 'Forme Paldea Race Aquatique',
    seen: { 128: { paldean_aqua: 'owned' } } },
  { id: '201-zarbi',     number: 201, catches: { 201: { form_label: 'Forme A' } },
    seen: { 201: { unown_a: 'owned', unown_b_shiny: 'seen' } } },
  { id: '52-miaouss',    number: 52, catches: { 52: { form_label: 'Alola' } },
    seen: { 52: { alolan: 'owned', gigamax: 'seen', normal: 'owned' }, 53: { galarian: 'seen' } } },
  { id: '144-artikodin', number: 144, catches: { 144: { form_label: 'Galar Asexué Shiny', is_shiny: true } },
    seen: { 144: { galarian_shiny: 'owned', baron: 'owned' } } },
  { id: '25-pikachu',    number: 25, catches: { 25: { form_label: 'Mâle' } },
    seen: { 25: { male: 'owned', shiny_female: 'owned', gigamax: 'seen' }, 26: { male: 'seen' } } },
  { id: '194-axoloto',   number: 194, catches: { 194: { form_label: 'Paldea' } },
    seen: { 194: { paldean: 'owned', female: 'seen' } } },
  { id: '215-farfuret',  number: 215, catches: { 215: { form_label: 'Hisui Mâle' } },
    seen: { 215: { hisuian_male: 'owned', male: 'owned' } } },
  { id: '6-dracaufeu',   number: 6, catches: { 4: { form_label: 'Mâle' }, 6: { form_label: 'Méga-Évo. X Shiny', is_shiny: true } },
    seen: { 4: { male: 'owned' }, 6: { shiny_mega_x: 'owned', mega_y: 'seen', gigamax: 'owned' } } },
];

function setupDom() {
  document.body.innerHTML = `
    <div id="modal-overlay" hidden><div id="modal"><div id="modal-content"></div></div></div>
    <div id="pokemon-grid"></div><span id="captured-count"></span>`;
}

function setupStore({ catches = {}, seen = {}, pendingIllusTab = null }) {
  store.catchByNumber = Object.fromEntries(Object.entries(catches).map(([n, c]) =>
    [n, { id: Number(n), pokemon_number: Number(n), is_shiny: false, created_at: '2026-01-01', ...c }]));
  store.shinyCatchByNumber = Object.fromEntries(Object.entries(store.catchByNumber).filter(([, c]) => c.is_shiny));
  store.seenMap = Object.fromEntries(Object.entries(seen).map(([n, e]) => [n, seenMapOf(e)]));
  store.seenSet = new Set(Object.keys(store.seenMap).map(Number));
  store.pendingIllusTab = pendingIllusTab;
  store.ownerUuid = 'owner-test';
}

const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)); };
const html = () => document.getElementById('modal-content').innerHTML;

beforeAll(() => {
  globalThis.requestAnimationFrame ??= cb => setTimeout(cb, 0);
  globalThis.CSS ??= {};
  globalThis.CSS.escape ??= s => String(s).replace(/["\\]/g, '\\$&');
});

beforeEach(setupDom);

afterAll(() => {
  if (!RECORD) return;
  const all = { ...(fs.existsSync(FIXTURES) ? JSON.parse(fs.readFileSync(FIXTURES, 'utf8')) : {}), ...supabaseMock.__recorded };
  const sorted = Object.fromEntries(Object.keys(all).sort().map(k => [k, all[k]]));
  fs.mkdirSync(path.dirname(FIXTURES), { recursive: true });
  fs.writeFileSync(FIXTURES, JSON.stringify(sorted, null, 1) + '\n');
});

describe('openModal — rendu identique à la référence', () => {
  it.each(CASES)('$id', { timeout: 60_000 }, async c => {
    setupStore(c);
    await openModal(c.number);
    await flush();
    expect(document.getElementById('modal-overlay').hidden).toBe(false);
    expect(html()).not.toContain('color:#ef5350');   // pas d'écran d'erreur
    await expect(html()).toMatchFileSnapshot(`./__golden__/${c.id}.html`);
  });

  it('un clic sur Vu/Obtenu met à jour la carte, les illustrations et la chaîne', { timeout: 60_000 }, async () => {
    setupStore(CASES.find(c => c.id === '307-partiel'));
    await openModal(307);
    await flush();
    const btn = document.querySelector('.variant-status[data-variant="shiny_female"]');
    btn.click();                 // vu → obtenu
    await flush();
    expect(btn.textContent.trim()).toBe('Obtenu');
    await expect(html()).toMatchFileSnapshot('./__golden__/307-apres-clic.html');
  });

  it('les onglets d’illustrations et de formes basculent', { timeout: 60_000 }, async () => {
    setupStore(CASES.find(c => c.id === '128-tauros'));
    await openModal(128);
    await flush();
    document.querySelector('.forms-tabs-nav .illus-tab-btn:last-child').click();
    document.querySelector('.illus-tabs:not(.forms-tabs-nav) .illus-tab-btn:last-child').click();
    await flush();
    await expect(html()).toMatchFileSnapshot('./__golden__/128-apres-onglets.html');
  });
});
