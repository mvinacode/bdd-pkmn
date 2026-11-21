// Races de Paldea (Tauros) : formes régionales `paldean_<race>` (Combative,
// Flamboyante, Aquatique), chacune avec ses variantes normal/shiny, son onglet
// et ses localisations propres. La forme régionale simple 'paldean' (Axoloto)
// n'en fait PAS partie : elle se comporte comme Alola/Galar/Hisui.

/** « Forme Paldea Race Combative » d'après le nom « Tauros (Race Combative) ». */
export function paldeanLabel(regional) {
  const race = (regional.name || '').match(/\(([^)]+)\)/)?.[1];
  return race ? `Forme Paldea ${race}` : regional.region;
}

/** Les races de Tauros parmi les formes régionales, dans leur ordre (déjà trié). */
export function paldeanRacesOf(regionals) {
  return (regionals || []).filter(r => (r.region || '').startsWith('paldean_'));
}
