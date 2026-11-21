// Supabase (PostgREST) tronque silencieusement toute réponse à 1 000 lignes,
// sans erreur. Une requête qui peut dépasser ce plafond doit donc être lue par
// pages successives jusqu'à recevoir une page incomplète.
export const SUPABASE_MAX_ROWS = 1000;

/**
 * Lit toutes les lignes d'une requête, page par page.
 * @param {() => object} buildQuery Construit une requête NEUVE à chaque appel,
 *   avec un tri stable et unique (sinon les pages peuvent se chevaucher).
 * @returns {Promise<{ data: object[], error: object|null }>}
 */
export async function fetchAllRows(buildQuery, pageSize = SUPABASE_MAX_ROWS) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
}
