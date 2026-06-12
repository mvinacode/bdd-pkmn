export const CONFIG = {
  // ── Supabase ───────────────────────────────────────────────
  SUPABASE_URL:      'https://mymkrfqpluimluehorby.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bWtyZnFwbHVpbWx1ZWhvcmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODc5OTMsImV4cCI6MjA5MzY2Mzk5M30.hA5QtNdblMK0sirWdRNKjkhYJ_KtI1I6vY7WQuqlYPE',

  // ── Cloudinary ─────────────────────────────────────────────
  CLOUDINARY_CLOUD:  'dkgfa4apm',

  // ── Paramètres de l'app ─────────────────────────────────────
  PAGE_SIZE: 40,           // nombre de Pokémon chargés par batch
  MAX_POKEMON: 1025,       // total Pokémon (Gen 1–9)
  SEARCH_DEBOUNCE: 250,    // ms avant de lancer la recherche

  // ── Langue ──────────────────────────────────────────────────
  LANG: 'fr',
};

// ── Préférences par utilisateur ──────────────────────────────
// genderFormsMode :
//   'all' → toutes les formes genrées présentes en jeu doivent être obtenues
//   'any' → au moins une forme genrée suffit (mâle OU femelle, normal OU shiny)
//   'none'→ les formes genrées ne sont pas prises en compte
//
// Remplace les UUIDs ci-dessous par les vrais IDs visibles dans
// Supabase Dashboard → Authentication → Users → colonne "UID"
export const USER_PREFS = {
  '2005f2e9-6df1-48b7-9420-2a5457d43e45': { genderFormsMode: 'all', strictComplete: true, requireAllFormsForComplete: true }, // Biche
  'efd681cf-9264-492d-bd59-a624d6f9668e': { genderFormsMode: 'any', allFormsAnim: 'rainbow', strictComplete: true }, // Sœur
};

/**
 * Construit l'URL d'une image Pokémon depuis Cloudinary.
 * Format Cloudinary : /image/upload/{transformations}/pokemon/{number}.png
 * Fallback : artwork officiel PokeAPI (GitHub raw).
 */
export function getPokemonImageUrl(number, { width = 200 } = {}) {
  const source = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${number}.png`;
  if (CONFIG.CLOUDINARY_CLOUD === 'VOTRE_CLOUD_NAME') return source;
  // Mode "fetch" Cloudinary : proxy + optimisation automatique (f_auto, q_auto)
  // Pas besoin d'uploader les images manuellement.
  const transforms = `w_${width},h_${width},c_fit,f_auto,q_auto`;
  return `https://res.cloudinary.com/${CONFIG.CLOUDINARY_CLOUD}/image/fetch/${transforms}/${encodeURIComponent(source)}`;
}

/**
 * Renvoie vrai si Supabase est correctement configuré.
 */
export function isSupabaseConfigured() {
  return (
    CONFIG.SUPABASE_URL !== 'VOTRE_SUPABASE_URL' &&
    CONFIG.SUPABASE_ANON_KEY !== 'VOTRE_SUPABASE_ANON_KEY' &&
    CONFIG.SUPABASE_URL.startsWith('https://')
  );
}
