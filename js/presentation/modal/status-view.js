// Coloration vu / obtenu de la fiche déjà affichée : portraits et pastilles de la
// chaîne d'évolution, illustrations normale et shiny. Les règles sont dans
// domain/modal-status.js ; ce module ne fait que poser les classes CSS.
import { store } from '../../store.js';
import { artworkStatus, evoFormStatus } from '../../domain/modal-status.js';

const formStatus = (num, formType) => evoFormStatus(store.seenMap[num], store.catchByNumber[num], formType);

// Pastille de condition d'évolution associée à chaque portrait de forme : dans
// une branche, celle de la branche ; sinon celle de la flèche qui précède.
function forEachFormPill(root, apply) {
  root.querySelectorAll('.evo-branch-item').forEach(item =>
    apply(item.querySelector('.evo-portrait[data-form-type]'), item.querySelector('.evo-condition-item'))
  );
  root.querySelectorAll('.evo-portrait[data-form-type]').forEach(portrait => {
    if (portrait.closest('.evo-branch-item')) return;
    const prev = portrait.closest('.evo-stage')?.previousElementSibling;
    if (prev?.classList.contains('evo-arrow'))
      apply(portrait, prev.querySelector('.evo-condition-item'));
  });
}

/** Premier affichage : grise ou masque les portraits et colore les pastilles. */
export function paintEvoStatuses(root) {
  root.querySelectorAll('.evo-portrait[data-number]').forEach(portrait => {
    const num      = parseInt(portrait.dataset.number);
    const formType = portrait.dataset.formType || null;
    const img      = portrait.querySelector('.evo-img-wrap img');
    if (!img) return;
    if (formType) {
      const st = formStatus(num, formType);
      portrait.classList.add('evo-portrait--' + st);
      if      (st === 'seen')   img.classList.add('evo-portrait-nb');
      else if (st === 'unseen') img.classList.add('evo-portrait-silhouette');
    } else {
      if      (!store.catchByNumber[num] && store.seenSet.has(num)) img.classList.add('evo-portrait-nb');
      else if (!store.catchByNumber[num])                           img.classList.add('evo-portrait-silhouette');
    }
  });
  forEachFormPill(root, (portrait, pill) => {
    if (!portrait?.dataset.formType || !pill) return;
    pill.classList.add('evo-condition--' + formStatus(parseInt(portrait.dataset.number), portrait.dataset.formType));
  });
}

/** Après un changement de statut : recalcule les portraits de formes et leurs pastilles. */
export function refreshEvoStatuses(root) {
  root.querySelectorAll('.evo-portrait[data-number]').forEach(portrait => {
    const num      = parseInt(portrait.dataset.number);
    const formType = portrait.dataset.formType || null;
    const img      = portrait.querySelector('.evo-img-wrap img');
    if (!img || !formType) return;
    const st = formStatus(num, formType);
    portrait.className = portrait.className.replace(/\bevo-portrait--\S+/g, '').trim();
    portrait.classList.add('evo-portrait--' + st);
    img.classList.remove('evo-portrait-nb', 'evo-portrait-silhouette');
    if      (st === 'seen')   img.classList.add('evo-portrait-nb');
    else if (st === 'unseen') img.classList.add('evo-portrait-silhouette');
  });
  forEachFormPill(root, (portrait, pill) => {
    if (!portrait?.dataset.formType || !pill) return;
    const st = formStatus(parseInt(portrait.dataset.number), portrait.dataset.formType);
    pill.className = pill.className.replace(/\bevo-condition--\S+/g, '').trim();
    pill.classList.add('evo-condition--' + st);
  });
}

// Type de colonne d'illustration (cf. illustrations.js), pour artworkStatus.
function artworkColumnOf(col) {
  if (col?.classList.contains('is-mega'))         return { kind: 'mega' };
  if (col?.classList.contains('is-gigamax'))      return { kind: 'gigamax' };
  if (col?.classList.contains('is-regional'))     return { kind: 'regional', region: col.dataset.region };
  if (col?.classList.contains('is-special-form')) return { kind: 'special', sfKey: col.dataset.sfKey };
  return { kind: 'base' };
}

function applyArtworkClass(img, owned, seen) {
  if (!img) return;
  img.classList.remove('modal-artwork--nb', 'modal-artwork--silhouette');
  if      (!owned && !seen) img.classList.add('modal-artwork--silhouette');
  else if (!owned)          img.classList.add('modal-artwork--nb');
}

/**
 * Colore chaque illustration : en couleur si obtenue, grisée si vue, en
 * silhouette sinon.
 * @param {object|null} latestCatch capture la plus récente au moment de l'ouverture
 */
export function paintArtworks(root, pokemonNumber, latestCatch) {
  const forms = store.seenMap[pokemonNumber] || {};
  root.querySelectorAll('.illus-col-wrapper').forEach(wrapper => {
    const col = wrapper.querySelector('.illus-col');
    const { ownedNormal, seenNormal, ownedShiny, seenShiny } = artworkStatus(forms, latestCatch, artworkColumnOf(col));
    const items = wrapper.querySelectorAll('.illus-artwork-item');
    if (items.length >= 2) {
      applyArtworkClass(items[0].querySelector('.modal-artwork'), ownedNormal, seenNormal);
      applyArtworkClass(items[1].querySelector('.modal-artwork'), ownedShiny,  seenShiny);
    } else {
      applyArtworkClass(wrapper.querySelector('.modal-artwork'), ownedNormal || ownedShiny, seenNormal || seenShiny);
    }
  });
}
