// Chargement de tout ce qu'affiche la fiche d'un Pokémon : le Pokémon, ses
// variantes, formes spéciales et apparitions, puis sa chaîne d'évolution avec
// les méga, gigamax, formes régionales et icônes de chaque maillon.
import {
  fetchPokemonByNumber, fetchEvolutionChain, fetchVariants, fetchGigamax,
  fetchSpecialFormsByNumber, fetchMegaEvolutions, fetchVariantIcons, fetchGigamaxForChain,
  fetchGigamaxVariantIcons, fetchRegionalForms, fetchAppearances, fetchFormAppearances,
} from '../supabase-client.js';
import { collectTreeNumbers } from '../domain/evolution-tree.js';

// Ordre canonique des races de Paldea (Tauros), appliqué partout — chaîne
// d'évolution incluse : Combative → Flamboyante → Aquatique.
const PALDEAN_REGION_ORDER = ['paldean_combat', 'paldean_blaze', 'paldean_aqua'];
const paldeanRank = region => PALDEAN_REGION_ORDER.indexOf(region) + 1 || 99;

function groupByNumber(rows, map = r => r) {
  const out = {};
  for (const r of rows) (out[r.pokemon_number] ||= []).push(map(r));
  return out;
}

/**
 * @returns {Promise<object|null>} null si le Pokémon n'existe pas. Les requêtes
 *   secondaires en échec donnent des listes vides plutôt que de bloquer la fiche.
 */
export async function loadModalData(number) {
  const [{ data: pokemon }, variants, gigamax, specialForms, appearances, formAppearances] = await Promise.all([
    fetchPokemonByNumber(number),
    fetchVariants(number),
    fetchGigamax(number),
    fetchSpecialFormsByNumber(number).catch(() => []),
    fetchAppearances(number).catch(() => []),
    fetchFormAppearances(number).catch(() => ({})),
  ]);
  if (!pokemon) return null;

  const evoTree = await fetchEvolutionChain(pokemon).catch(() => null);
  const chainNumbers = collectTreeNumbers(evoTree);
  const [megaRows, iconRows, gigamaxChainRows, gigamaxIconRows, regionalRows] = await Promise.all([
    fetchMegaEvolutions(chainNumbers).catch(() => []),
    fetchVariantIcons(chainNumbers).catch(() => []),
    fetchGigamaxForChain(chainNumbers).catch(() => []),
    fetchGigamaxVariantIcons(chainNumbers).catch(() => []),
    fetchRegionalForms(chainNumbers).catch(() => []),
  ]);

  const regionalsByNumber = groupByNumber(regionalRows);
  for (const list of Object.values(regionalsByNumber))
    list.sort((a, b) => paldeanRank(a.region) - paldeanRank(b.region));

  const gigamaxSpriteMap = Object.fromEntries(gigamaxIconRows.map(r => [r.pokemon_number, r.image_url]));

  return {
    pokemon, variants, gigamax, specialForms, appearances, formAppearances, evoTree,
    megasByNumber:   groupByNumber(megaRows),
    regionalsByNumber,
    gigamaxByNumber: groupByNumber(gigamaxChainRows, g => ({ ...g, sprite_url: gigamaxSpriteMap[g.pokemon_number] || null })),
    iconByNumber:    Object.fromEntries(iconRows.map(r => [r.pokemon_number, r.image_url])),
  };
}
