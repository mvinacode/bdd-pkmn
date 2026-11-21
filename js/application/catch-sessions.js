// Cas d'usage du journal : modifier ou supprimer une session de capture (toutes
// les lignes de `catches` qui partagent un session_id), en gardant pokemon_seen
// cohérent. L'accès aux données est injecté (`repo`) : testable sans Supabase.
import { formLabelToVariantType } from '../domain/form-labels.js';

/** Clé de session d'une capture : son session_id, ou son id pour les anciennes lignes. */
export const sessionKeyOf = c => c.session_id || String(c.id);

const inSession = sessionId => c => c && sessionKeyOf(c) === sessionId;

/**
 * @param {object} repo
 * @param {Function} repo.insertCatch
 * @param {Function} repo.deleteCatch
 * @param {Function} repo.updateCatchesBySession
 * @param {Function} repo.deleteSeenByVariantType
 * @param {Function} repo.upsertSeen
 * @param {Function} repo.getOwnerUuid
 */
export function createCatchSessions(repo) {
  // Retire le statut de pokemon_seen d'une forme qu'aucune capture restante ne
  // conserve (sinon la carte garderait un statut « obtenu » fantôme).
  async function releaseSeenIfOrphan(catches, pokemonNumber, formLabel) {
    const vt = formLabelToVariantType(formLabel);
    if (!vt) return;
    const stillHas = catches.some(c => c && c.pokemon_number === pokemonNumber && c.form_label === formLabel);
    if (!stillHas) await repo.deleteSeenByVariantType(repo.getOwnerUuid(), pokemonNumber, vt);
  }

  /**
   * Met à jour ball / date / jeu de toute la session, puis ajoute ou retire des formes.
   * @param {object[]} catches toutes les captures connues (non modifié)
   * @param {object} edit
   * @param {string} edit.sessionId
   * @param {string|null} edit.date
   * @param {string|null} edit.game
   * @param {{name: string, imageUrl: string}|null} edit.ball null = ball inchangée
   * @param {string[]|null} edit.keptLabels libellés de forme conservés ; null = formes inchangées
   * @param {{label: string, variant_type: string, sprite: string}[]} edit.selectedEntries
   * @param {(number, boolean) => string} edit.defaultSprite sprite de repli d'une nouvelle forme
   * @returns {Promise<{ catches: object[], error: object|null }>}
   */
  async function editSession(catches, { sessionId, date, game, ball, selectedEntries, defaultSprite }) {
    const updates = {
      caught_at: date,
      game,
      ...(ball ? { ball_name: ball.name, ball_image_url: ball.imageUrl } : {}),
    };
    const { error } = await repo.updateCatchesBySession(sessionId, updates);
    if (error) return { catches, error };

    let next = catches.map(c => inSession(sessionId)(c)
      ? { ...c, caught_at: date, game, ...(ball ? { ball_name: ball.name, ball_image_url: ball.imageUrl } : {}) }
      : c);
    if (!selectedEntries) return { catches: next, error: null };

    const sessionForms = next.filter(inSession(sessionId));
    const origLabels   = new Set(sessionForms.map(c => c.form_label));
    const selLabels    = new Set(selectedEntries.map(e => e.label));
    // Référence prise avant les suppressions : elle porte espèce, notes et ball d'origine.
    const base = sessionForms[0];

    for (const rec of sessionForms) {
      if (selLabels.has(rec.form_label)) continue;
      const { error: deleteError } = await repo.deleteCatch(rec.id);
      if (deleteError) continue;
      next = next.filter(c => c && c.id !== rec.id);
      await releaseSeenIfOrphan(next, rec.pokemon_number, rec.form_label);
    }

    if (base) {
      for (const entry of selectedEntries) {
        if (origLabels.has(entry.label)) continue;
        const isShiny = entry.variant_type.includes('shiny');
        const { data: newRec, error: insertError } = await repo.insertCatch({
          owner_uuid:      repo.getOwnerUuid(),
          pokemon_number:  base.pokemon_number,
          pokemon_name_fr: base.pokemon_name_fr,
          is_shiny:        isShiny,
          sprite_url:      entry.sprite || defaultSprite(base.pokemon_number, isShiny),
          ball_name:       ball ? ball.name : base.ball_name,
          ball_image_url:  ball ? ball.imageUrl : base.ball_image_url,
          caught_at:       date,
          game,
          notes:           base.notes,
          form_label:      entry.label,
          session_id:      sessionId,
        });
        if (insertError || !newRec) continue;
        next = [...next, newRec];
        const vt = formLabelToVariantType(entry.label);
        if (vt) {
          await repo.upsertSeen({
            owner_uuid:     repo.getOwnerUuid(),
            pokemon_number: newRec.pokemon_number,
            variant_type:   vt,
            status:         'owned',
            form_label:     newRec.form_label,
            is_shiny:       newRec.is_shiny,
            sprite_url:     newRec.sprite_url,
            caught_at:      newRec.caught_at,
            game:           newRec.game,
          });
        }
      }
    }
    return { catches: next, error: null };
  }

  /**
   * Supprime toutes les captures de la session, puis les statuts devenus orphelins.
   * En cas d'erreur, s'arrête et renvoie la liste d'origine (comme avant).
   * @returns {Promise<{ catches: object[], error: object|null }>}
   */
  async function deleteSession(catches, sessionId) {
    const sessionCatches = catches.filter(inSession(sessionId));
    for (const c of sessionCatches) {
      const { error } = await repo.deleteCatch(c.id);
      if (error) return { catches, error };
    }
    const next = catches.filter(c => c && sessionKeyOf(c) !== sessionId);
    const pokemonNumber = sessionCatches[0]?.pokemon_number;
    if (pokemonNumber) {
      for (const c of sessionCatches) await releaseSeenIfOrphan(next, pokemonNumber, c.form_label);
    }
    return { catches: next, error: null };
  }

  return { editSession, deleteSession };
}
