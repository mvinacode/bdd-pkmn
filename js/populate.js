/**
 * POPULATE.JS — Script de peuplement de la base Supabase depuis PokeAPI.
 *
 * À lancer UNE SEULE FOIS depuis la console du navigateur (F12) sur la page index.html,
 * ou via Node.js si tu ajoutes les imports nécessaires.
 *
 * Usage console navigateur :
 *   1. Ouvre index.html avec ta config Supabase remplie
 *   2. Ouvre F12 > Console
 *   3. Copie-colle ce fichier dans la console, ou inclus-le temporairement dans index.html
 *   4. Appelle : await populateDatabase(1, 151)  ← Gen 1 uniquement pour tester
 *      ou       : await populateDatabase()        ← Tous les 1025 Pokémon
 *
 * Note : PokeAPI a un rate-limit. Le script fait des pauses entre les requêtes.
 */

// Ranges par génération
const GEN_RANGES = [
  { gen: 1, start: 1,   end: 151  },
  { gen: 2, start: 152, end: 251  },
  { gen: 3, start: 252, end: 386  },
  { gen: 4, start: 387, end: 493  },
  { gen: 5, start: 494, end: 649  },
  { gen: 6, start: 650, end: 721  },
  { gen: 7, start: 722, end: 809  },
  { gen: 8, start: 810, end: 905  },
  { gen: 9, start: 906, end: 1025 },
];

function getGeneration(number) {
  for (const r of GEN_RANGES) {
    if (number >= r.start && number <= r.end) return r.gen;
  }
  return 9;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i < retries - 1) {
        console.warn(`[PokeAPI] Retry ${i+1} pour ${url}`);
        await sleep(delay * (i + 1));
      } else {
        throw err;
      }
    }
  }
}

async function fetchPokemonData(number) {
  const [poke, species] = await Promise.all([
    fetchWithRetry(`https://pokeapi.co/api/v2/pokemon/${number}`),
    fetchWithRetry(`https://pokeapi.co/api/v2/pokemon-species/${number}`).catch(() => null),
  ]);

  // Nom français
  let nameFr = poke.name;
  let descFr  = null;

  if (species) {
    const frName = species.names?.find(n => n.language.name === 'fr');
    if (frName) nameFr = frName.name;

    // Description (flavor text) en français — on prend la plus récente
    const frFlavors = species.flavor_text_entries?.filter(e => e.language.name === 'fr') || [];
    if (frFlavors.length) {
      descFr = frFlavors[frFlavors.length - 1].flavor_text
        .replace(/\f|\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  const stats = {};
  poke.stats.forEach(s => {
    stats[s.stat.name.replace('-', '_')] = s.base_stat;
  });

  const types = poke.types.map(t => ({
    type_name: t.type.name,
    slot:      t.slot,
  }));

  // Image Cloudinary si configuré, sinon artwork officiel
  const imageUrl = getPokemonImageUrl(number);

  return {
    pokemon: {
      number:       poke.id,
      name_fr:      nameFr,
      name_en:      poke.name,
      generation:   getGeneration(poke.id),
      hp:           stats.hp           || null,
      attack:       stats.attack       || null,
      defense:      stats.defense      || null,
      sp_attack:    stats.special_attack  || null,
      sp_defense:   stats.special_defense || null,
      speed:        stats.speed        || null,
      height:       poke.height        || null,  // en décimètres × 10 = cm
      weight:       poke.weight        || null,  // en hectogrammes × 10 = g
      image_url:    imageUrl,
      description_fr: descFr,
      total: (stats.hp||0)+(stats.attack||0)+(stats.defense||0)+
             (stats.special_attack||0)+(stats.special_defense||0)+(stats.speed||0),
    },
    types,
  };
}

/**
 * Peuple la base Supabase pour les numéros de start à end inclus.
 * @param {number} start - numéro Pokémon de départ (défaut: 1)
 * @param {number} end   - numéro Pokémon de fin    (défaut: 1025)
 * @param {number} batchSize - taille des batches d'insertion (défaut: 20)
 */
async function populateDatabase(start = 1, end = 1025, batchSize = 20) {
  if (!isSupabaseConfigured()) {
    console.error('[Populate] Supabase non configuré. Remplis js/config.js d\'abord.');
    return;
  }
  // Vide le cache pour que les nouvelles données s'affichent immédiatement
  if (typeof cacheClear === 'function') cacheClear();

  const client = getSupabaseClient();
  let success = 0;
  let errors  = 0;

  console.log(`[Populate] Début : Pokémon #${start} → #${end}`);
  console.time('populate');

  const pokeBuffer  = [];
  const typesBuffer = [];

  for (let num = start; num <= end; num++) {
    try {
      const { pokemon, types } = await fetchPokemonData(num);
      pokeBuffer.push(pokemon);
      types.forEach(t => typesBuffer.push({ ...t, _number: num }));

      // Flush par batch ou à la fin
      if (pokeBuffer.length >= batchSize || num === end) {
        // Upsert pokemon
        const { data: inserted, error: pkErr } = await client
          .from('pokemon')
          .upsert(pokeBuffer, { onConflict: 'number' })
          .select('id, number');

        if (pkErr) {
          console.error(`[Populate] Erreur upsert batch:`, pkErr.message);
          errors += pokeBuffer.length;
        } else {
          // Map number → id pour les types
          const idByNumber = {};
          inserted.forEach(r => { idByNumber[r.number] = r.id; });

          const typesToInsert = typesBuffer
            .filter(t => idByNumber[t._number])
            .map(({ type_name, slot, _number }) => ({
              pokemon_id: idByNumber[_number],
              type_name,
              slot,
            }));

          if (typesToInsert.length) {
            const { error: typeErr } = await client
              .from('pokemon_types')
              .upsert(typesToInsert, { onConflict: 'pokemon_id,slot' });

            if (typeErr) console.warn('[Populate] Erreur types:', typeErr.message);
          }

          success += pokeBuffer.length;
          console.log(`[Populate] ✓ Batch #${num - pokeBuffer.length + 1}–#${num} inséré (${success} total)`);
        }

        pokeBuffer.length  = 0;
        typesBuffer.length = 0;
      }

      // Pause légère pour respecter le rate-limit PokeAPI
      if (num % 10 === 0) await sleep(200);

    } catch (err) {
      console.error(`[Populate] Erreur Pokémon #${num}:`, err.message);
      errors++;
    }
  }

  console.timeEnd('populate');
  console.log(`[Populate] Terminé — ✓ ${success} succès, ✗ ${errors} erreurs`);
  return { success, errors };
}

// Expose globalement pour usage depuis la console
window.populateDatabase = populateDatabase;
console.info('[Populate] Script chargé. Lance : await populateDatabase(1, 151) pour la Gen 1.');
