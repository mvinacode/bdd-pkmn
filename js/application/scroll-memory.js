import { store } from '../store.js';
import { debounce } from '../domain/constants.js';

// Mémorise la position dans la grille via une « carte ancre » (numéro de Pokémon)
// plutôt qu'une position en pixels : avec le scroll infini et le chargement
// différé des images, les pixels ne sont pas fiables.

const storageKey = () => `pkmn-scroll-anchor:${window._ownerUuid || 'anon'}`;

// Désactivé tant que la restauration n'est pas finie, pour que le passage
// programmatique en haut de page n'écrase pas l'ancre sauvegardée.
let saveEnabled = false;

export function saveAnchor(number) {
  if (!number) return;
  try { localStorage.setItem(storageKey(), String(number)); } catch { /* stockage indisponible */ }
}

export function readAnchor() {
  try {
    const n = parseInt(localStorage.getItem(storageKey()), 10);
    return Number.isFinite(n) ? n : null;
  } catch { return null; }
}

function topVisibleCardNumber() {
  const cards = document.querySelectorAll('#pokemon-grid .poke-card');
  for (const card of cards) {
    if (card.getBoundingClientRect().bottom > 0) return card.dataset.number;
  }
  return null;
}

export function initScrollMemory() {
  window.addEventListener('scroll', debounce(() => {
    if (!saveEnabled) return;
    saveAnchor(topVisibleCardNumber());
  }, 250), { passive: true });
}

const isDefaultFilterState = () =>
  store.search === '' && store.gen === 'all' && store.type === 'all' && store.statusFilter === 'all';

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Charge des batchs supplémentaires jusqu'à ce que la carte ancre soit dans la
 * grille, puis scrolle dessus. Sans ancre (ou ancre introuvable), reste en haut.
 * @param {() => Promise<void>} loadMore — charge le batch suivant (append)
 */
export async function restoreScrollPosition(loadMore) {
  const anchor = readAnchor();
  const findCard = () => document.querySelector(`#pokemon-grid [data-number="${anchor}"]`);

  if (anchor) {
    let guard = 0;
    while (!findCard() && !store.allLoaded && isDefaultFilterState() && guard++ < 100) {
      if (store.loading) await sleep(50);
      else await loadMore();
    }
    findCard()?.scrollIntoView({ block: 'center' });
  }
  saveEnabled = true;
}
