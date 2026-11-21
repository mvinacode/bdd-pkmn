// Cas d'usage du tiroir : enregistrer des captures ou marquer des formes comme
// vues. Ces fonctions écrivent en base puis tiennent le store à jour ; l'affichage
// (bouton, alertes, rafraîchissement de la carte et de la modale) reste au tiroir.
// Les écritures Supabase sont injectées (`repo`) : testable sans réseau.
import { store } from '../store.js';
import { getOwnerUuid, spriteUrl } from '../utils.js';
import { normalizeVariantUrl } from '../domain/constants.js';
import { getVariantStatus } from '../domain/completion.js';

const isShinyForm = form => form.variant_type?.includes('shiny') || false;
const formLabelOf = form => form.label || (isShinyForm(form) ? 'Shiny' : 'Normale');

/**
 * Sprite enregistré avec une forme : celui de la forme choisie, sinon l'icône
 * normale ou shiny du Pokémon, sinon le sprite PokeAPI.
 * @param {object} pokemon store.drawerPokemon
 * @param {object} form    { variant_type, label, sprite }
 */
export function formSprite(pokemon, form) {
  if (form.sprite) return normalizeVariantUrl(form.sprite);
  const icon = isShinyForm(form) ? pokemon.iconShiny : pokemon.iconNormal;
  return icon ? normalizeVariantUrl(icon) : spriteUrl(pokemon.number, isShinyForm(form));
}

/**
 * @param {object} repo
 * @param {Function} repo.insertCatch
 * @param {Function} repo.addToSeen  (application/catches.js : met aussi le store à jour)
 * @param {Function} repo.fetchVariantMap
 * @param {Function} repo.fetchSpecialFormsForNumbers
 */
export function createCatchRecorder(repo) {
  /**
   * Marque des formes comme vues. Une forme déjà obtenue le reste.
   * Une exception remonte à l'appelant (comme avant).
   */
  async function markFormsSeen(pokemon, forms, { date, game }) {
    for (const form of forms) {
      await repo.addToSeen(pokemon.number, {
        variant_type: form.variant_type || 'normal',
        status:       getVariantStatus(pokemon.number, form.variant_type) === 'owned' ? 'owned' : 'seen',
        form_label:   formLabelOf(form),
        is_shiny:     isShinyForm(form),
        sprite_url:   formSprite(pokemon, form),
        caught_at:    date,
        game,
      });
    }
  }

  /**
   * Enregistre une capture par forme, dans une même session, et marque chaque
   * forme comme obtenue. S'arrête à la première insertion en échec : les captures
   * déjà insérées restent, mais le store n'est pas mis à jour (comme avant).
   * @returns {Promise<{ error: object|null }>}
   */
  async function recordCatches(pokemon, forms, { ball, date, game, notes, sessionId }) {
    if (!forms.length) return { error: null };
    let lastData = null;
    for (const form of forms) {
      const sprite = formSprite(pokemon, form);
      const { data, error } = await repo.insertCatch({
        owner_uuid:      getOwnerUuid(),
        pokemon_number:  pokemon.number,
        pokemon_name_fr: pokemon.name_fr,
        is_shiny:        isShinyForm(form),
        sprite_url:      sprite,
        form_label:      formLabelOf(form),
        ball_name:       ball.name,
        ball_image_url:  ball.imageUrl,
        caught_at:       date,
        game,
        notes,
        session_id:      sessionId,
      });
      if (error) return { error };
      lastData = data;
      await repo.addToSeen(pokemon.number, {
        variant_type: form.variant_type || 'normal',
        status:       'owned',
        form_label:   formLabelOf(form),
        is_shiny:     isShinyForm(form),
        sprite_url:   sprite,
        caught_at:    date,
        game,
      });
    }

    // La carte affiche la capture la plus récente (et la plus récente shiny).
    store.catchByNumber[pokemon.number] = lastData;
    if (lastData?.is_shiny) store.shinyCatchByNumber[pokemon.number] = lastData;
    // Premier contact avec ce Pokémon : charge ses sprites de formes en tâche de fond.
    if (!store.variantMap[pokemon.number])
      repo.fetchVariantMap([pokemon.number]).then(m => Object.assign(store.variantMap, m));
    if (pokemon.isSpecial && pokemon.specialFormKey && !store.specialFormsMap[pokemon.number]?.[pokemon.specialFormKey])
      repo.fetchSpecialFormsForNumbers([pokemon.number]).then(m => Object.assign(store.specialFormsMap, m));
    return { error: null };
  }

  return { markFormsSeen, recordCatches };
}
