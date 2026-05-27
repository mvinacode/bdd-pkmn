/**
 * SUPABASE CLIENT
 * Wrapper autour du SDK Supabase — toutes les requêtes DB passent ici.
 * La RLS (Row Level Security) est activée côté Supabase : lecture seule pour les anonymes.
 */

let _supabase = null;

function getSupabaseClient() {
  if (!_supabase) {
    if (!isSupabaseConfigured()) return null;
    try {
      _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        auth: { persistSession: true },
      });
    } catch (e) {
      console.error('[Supabase] SDK non disponible :', e);
      return null;
    }
  }
  return _supabase;
}

function normalizePokemon(p) {
  return {
    ...p,
    types: [...(p.pokemon_types || [])].sort((a, b) => a.slot - b.slot).map(t => t.type_name),
  };
}

/**
 * Récupère une page de Pokémon avec filtres.
 */
async function fetchPokemon({ from = 0, to = 39, search = '', gen = null, type = null, sortBy = 'number', capturedOnly = false, capturedNumbers = [] } = {}) {
  const client = getSupabaseClient();
  if (!client) return { data: [], count: 0, error: { message: 'Supabase non configuré' } };

  let query = client
    .from('pokemon')
    .select(`
      id, number, name_fr, name_en, generation,
      image_url, description_fr,
      evolves_from_number,
      pokemon_types ( type_name, slot )
    `, { count: 'exact' });

  if (search.trim()) {
    const term = search.trim().toLowerCase();
    query = query.or(`name_fr.ilike.%${term}%,name_en.ilike.%${term}%`);
  }

  if (gen && gen !== 'all') {
    query = query.eq('generation', parseInt(gen, 10));
  }

  if (type && type !== 'all') {
    const { data: typeRows } = await client
      .from('pokemon_types')
      .select('pokemon_id')
      .eq('type_name', type);
    const ids = (typeRows || []).map(r => r.pokemon_id);
    if (ids.length === 0) return { data: [], count: 0, error: null };
    query = query.in('id', ids);
  }

  if (capturedOnly) {
    if (capturedNumbers.length === 0) return { data: [], count: 0, error: null };
    query = query.in('number', capturedNumbers);
  }

  const validSorts = ['number', 'name_fr'];
  const col = validSorts.includes(sortBy) ? sortBy : 'number';
  query = query.order(col, { ascending: true });
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Supabase] Erreur fetchPokemon:', error.message);
    return { data: [], count: 0, error };
  }

  return { data: (data || []).map(normalizePokemon), count: count ?? 0, error: null };
}

/**
 * Récupère un seul Pokémon par son numéro national.
 */
async function fetchPokemonByNumber(number) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: 'Supabase non configuré' } };

  const { data, error } = await client
    .from('pokemon')
    .select(`
      id, number, name_fr, name_en, generation,
      image_url, shiny_artwork_url, description_fr, evolves_from_number,
      pokemon_types ( type_name, slot )
    `)
    .eq('number', number)
    .single();

  if (error) {
    console.error('[Supabase] Erreur fetchPokemonByNumber:', error.message);
    return { data: null, error };
  }

  return { data: normalizePokemon(data), error: null };
}

/**
 * Récupère la chaîne d'évolution complète autour d'un Pokémon.
 * Retourne : { root, chain[] } où chain est un tableau de tableaux (pour les branches).
 */
async function fetchEvolutionChain(pokemon) {
  const client = getSupabaseClient();
  if (!client) return null;

  const FIELDS = 'number, name_fr, image_url, evolves_from_number, evolution_condition, evolution_item_image_url, pokemon_types(type_name, slot)';

  // Remonte jusqu'à la racine
  let root = pokemon;
  const visited = new Set([pokemon.number]);
  while (root.evolves_from_number) {
    if (visited.has(root.evolves_from_number)) break;
    visited.add(root.evolves_from_number);
    const { data } = await client.from('pokemon').select(FIELDS).eq('number', root.evolves_from_number).single();
    if (!data) break;
    root = normalizePokemon(data);
  }

  // Descend et construit l'arbre depuis la racine
  async function getChildren(number) {
    const { data } = await client.from('pokemon').select(FIELDS).eq('evolves_from_number', number).order('number');
    return (data || []).map(normalizePokemon);
  }

  async function buildTree(node, depth = 0) {
    if (depth > 4) return { node, children: [] };
    const children = await getChildren(node.number);
    const childTrees = await Promise.all(children.map(c => buildTree(c, depth + 1)));
    return { node, children: childTrees };
  }

  return buildTree(root);
}

/**
 * Récupère les icônes normale + shiny pour les cartes de la grille principale.
 */
async function fetchCardIcons(pokemonNumbers) {
  const client = getSupabaseClient();
  if (!client || !pokemonNumbers.length) return [];
  const { data } = await client
    .from('pokemon_variants')
    .select('pokemon_number, variant_type, image_url')
    .in('variant_type', ['normal', 'male', 'female', 'shiny', 'shiny_male', 'shiny_female'])
    .in('pokemon_number', pokemonNumbers);
  return data || [];
}

/**
 * Récupère l'icône normale (variant_type='normal') pour une liste de numéros.
 */
async function fetchVariantIcons(pokemonNumbers) {
  const client = getSupabaseClient();
  if (!client || !pokemonNumbers.length) return [];
  const { data } = await client
    .from('pokemon_variants')
    .select('pokemon_number, variant_type, image_url')
    .in('variant_type', ['normal', 'male'])
    .in('pokemon_number', pokemonNumbers);
  if (!data) return [];
  // Préférer 'normal' sur 'male' si les deux existent
  const map = {};
  for (const row of data) {
    if (!map[row.pokemon_number] || row.variant_type === 'normal') {
      map[row.pokemon_number] = row.image_url;
    }
  }
  return Object.entries(map).map(([pokemon_number, image_url]) => ({ pokemon_number: parseInt(pokemon_number), image_url }));
}

/**
 * Récupère les variantes Alola (type 'alolan') pour une liste de numéros — utilisé dans la recherche drawer.
 */
async function fetchAlolanVariantsForNumbers(pokemonNumbers) {
  const client = getSupabaseClient();
  if (!client || !pokemonNumbers.length) return [];
  const { data } = await client
    .from('pokemon_variants')
    .select('pokemon_number, variant_type, image_url')
    .eq('variant_type', 'alolan')
    .in('pokemon_number', pokemonNumbers);
  return data || [];
}

/**
 * Récupère les formes régionales (Alola, Galar…) pour une liste de numéros.
 */
async function fetchRegionalForms(pokemonNumbers) {
  const client = getSupabaseClient();
  if (!client || !pokemonNumbers.length) return [];
  const { data } = await client
    .from('pokemon_regional_forms')
    .select('pokemon_number, name, region, artwork_url, shiny_artwork_url, description_fr, types, image_url, evolution_condition, evolution_item_image_url')
    .in('pokemon_number', pokemonNumbers);
  return data || [];
}

/**
 * Récupère les méga-évolutions pour une liste de numéros de Pokémon.
 */
async function fetchMegaEvolutions(pokemonNumbers) {
  const client = getSupabaseClient();
  if (!client || !pokemonNumbers.length) return [];
  const { data } = await client
    .from('pokemon_mega_evolutions')
    .select('pokemon_number, name, condition_label, image_url, item_image_url, artwork_url, shiny_artwork_url, description_fr, types')
    .in('pokemon_number', pokemonNumbers);
  return data || [];
}

/**
 * Récupère les formes Gigamax d'un Pokémon (modal).
 */
async function fetchGigamax(pokemonNumber) {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data } = await client
    .from('pokemon_gigamax')
    .select('name, description_fr, artwork_url, shiny_artwork_url, item_image_url')
    .eq('pokemon_number', pokemonNumber)
    .order('sort_order');
  return data || [];
}

/**
 * Récupère l'icône sprite gigamax (variant_type='gigamax') pour une liste de numéros.
 */
async function fetchGigamaxVariantIcons(pokemonNumbers) {
  const client = getSupabaseClient();
  if (!client || !pokemonNumbers.length) return [];
  const { data } = await client
    .from('pokemon_variants')
    .select('pokemon_number, image_url')
    .eq('variant_type', 'gigamax')
    .in('pokemon_number', pokemonNumbers);
  return data || [];
}

/**
 * Récupère les formes Gigamax pour une liste de numéros (chaîne d'évolution).
 */
async function fetchGigamaxForChain(pokemonNumbers) {
  const client = getSupabaseClient();
  if (!client || !pokemonNumbers.length) return [];
  const { data } = await client
    .from('pokemon_gigamax')
    .select('pokemon_number, name, condition_label, item_image_url')
    .in('pokemon_number', pokemonNumbers);
  return data || [];
}

/**
 * Récupère tous les variants pour une liste de numéros — utilisé par le journal.
 * Retourne { [pokemon_number]: { [variant_type]: image_url } }
 */
async function fetchVariantMap(pokemonNumbers) {
  const client = getSupabaseClient();
  if (!client || !pokemonNumbers.length) return {};
  const { data } = await client
    .from('pokemon_variants')
    .select('pokemon_number, variant_type, image_url')
    .in('pokemon_number', pokemonNumbers);
  const map = {};
  for (const r of data || []) {
    if (!map[r.pokemon_number]) map[r.pokemon_number] = {};
    map[r.pokemon_number][r.variant_type] = r.image_url;
  }
  return map;
}

/**
 * Récupère les variantes visuelles d'un Pokémon (mâle/femelle, shiny, custom…).
 */
async function fetchVariants(pokemonNumber) {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data } = await client
    .from('pokemon_variants')
    .select('variant_type, label, image_url')
    .eq('pokemon_number', pokemonNumber)
    .order('sort_order');
  return data || [];
}

/**
 * Récupère les formes spéciales d'un Pokémon.
 */
async function fetchForms(pokemonNumber) {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data } = await client
    .from('pokemon_forms')
    .select('form_name')
    .eq('pokemon_number', pokemonNumber)
    .order('form_name');
  return (data || []).map(r => r.form_name);
}

/**
 * Récupère toutes les captures d'un propriétaire.
 */
async function fetchCatches(ownerUuid) {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: { message: 'Supabase non configuré' } };
  const { data, error } = await client
    .from('catches')
    .select('*')
    .eq('owner_uuid', ownerUuid)
    .order('caught_at', { ascending: false })
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

/**
 * Récupère toutes les formes vues/obtenues pour un utilisateur.
 */
async function fetchSeen(ownerUuid) {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: null };
  const { data, error } = await client.from('pokemon_seen').select('*').eq('owner_uuid', ownerUuid);
  if (error) console.error('[Supabase] Erreur fetchSeen:', error.message);
  return { data: data || [], error };
}

/**
 * Insère ou met à jour une forme vue/obtenue (upsert sur owner+number+variant).
 */
async function upsertSeen(seenData) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: 'Supabase non configuré' } };
  const { data, error } = await client
    .from('pokemon_seen')
    .upsert(seenData, { onConflict: 'owner_uuid,pokemon_number,variant_type' })
    .select()
    .single();
  return { data, error };
}

/**
 * Supprime une forme vue par son id.
 */
async function deleteSeenForm(id) {
  const client = getSupabaseClient();
  if (!client) return { error: { message: 'Supabase non configuré' } };
  const { error } = await client.from('pokemon_seen').delete().eq('id', id);
  return { error };
}

/**
 * Supprime une forme vue par son variant_type pour un utilisateur et un Pokémon.
 */
async function deleteSeenByVariantType(ownerUuid, pokemonNumber, variantType) {
  const client = getSupabaseClient();
  if (!client) return { error: { message: 'Supabase non configuré' } };
  const { error } = await client.from('pokemon_seen').delete()
    .eq('owner_uuid', ownerUuid)
    .eq('pokemon_number', pokemonNumber)
    .eq('variant_type', variantType);
  return { error };
}

/**
 * Supprime toutes les formes vues d'un Pokémon pour un utilisateur.
 */
async function deleteAllSeenForPokemon(ownerUuid, pokemonNumber) {
  const client = getSupabaseClient();
  if (!client) return { error: { message: 'Supabase non configuré' } };
  const { error } = await client.from('pokemon_seen').delete()
    .eq('owner_uuid', ownerUuid)
    .eq('pokemon_number', pokemonNumber);
  return { error };
}

/**
 * Insère une nouvelle capture.
 */
async function insertCatch(catchData) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: { message: 'Supabase non configuré' } };
  const { data, error } = await client.from('catches').insert(catchData).select().single();
  return { data, error };
}

/**
 * Supprime une capture par son id.
 */
async function deleteCatch(id) {
  const client = getSupabaseClient();
  if (!client) return { error: { message: 'Supabase non configuré' } };
  const { error } = await client.from('catches').delete().eq('id', id);
  return { error };
}

/**
 * Met à jour toutes les captures d'une session (même session_id).
 */
async function updateCatchesBySession(sessionId, updates) {
  const client = getSupabaseClient();
  if (!client) return { error: { message: 'Supabase non configuré' } };
  const { error } = await client.from('catches').update(updates).eq('session_id', sessionId);
  return { error };
}

/**
 * Supprime toutes les captures d'une session (même session_id).
 */
async function deleteCatchesBySession(sessionId) {
  const client = getSupabaseClient();
  if (!client) return { error: { message: 'Supabase non configuré' } };
  const { error } = await client.from('catches').delete().eq('session_id', sessionId);
  return { error };
}

/**
 * Récupère les formes spéciales (pokemon_special_forms) pour une liste de numéros.
 * Retourne { [pokemon_number]: { [form_key]: { form_key, form_label_fr, image_url, image_url_shiny, artwork_url, artwork_url_shiny } } }
 */
async function fetchSpecialFormsForNumbers(pokemonNumbers) {
  const client = getSupabaseClient();
  if (!client || !pokemonNumbers.length) return {};
  const { data } = await client
    .from('pokemon_special_forms')
    .select('pokemon_number, form_key, form_label_fr, image_url, image_url_shiny, artwork_url, artwork_url_shiny, form_group, sort_order, description_fr')
    .in('pokemon_number', pokemonNumbers)
    .order('sort_order', { ascending: true });
  const map = {};
  for (const r of data || []) {
    if (!map[r.pokemon_number]) map[r.pokemon_number] = {};
    map[r.pokemon_number][r.form_key] = r;
  }
  return map;
}

/**
 * Récupère les formes spéciales d'un seul Pokémon.
 */
async function fetchSpecialFormsByNumber(pokemonNumber) {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data } = await client
    .from('pokemon_special_forms')
    .select('form_key, form_label_fr, image_url, image_url_shiny, artwork_url, artwork_url_shiny, form_group, sort_order, description_fr')
    .eq('pokemon_number', pokemonNumber)
    .order('sort_order', { ascending: true });
  return data || [];
}

/**
 * Récupère la liste des types distincts présents en base.
 */
async function fetchTypes() {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('pokemon_types').select('type_name').order('type_name');
  if (error) return [];
  return [...new Set((data || []).map(r => r.type_name))];
}
