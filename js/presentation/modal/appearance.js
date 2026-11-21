// Bloc « Apparition » de la fiche : icônes des jeux où le Pokémon apparaît et
// popover du mode d'obtention (texte au mini-formatage sécurisé).
import { esc, GAMES } from '../../utils.js';

// Mini-formatage (type BBCode) du mode d'obtention. On échappe d'abord tout le
// texte (anti-injection), puis on ne génère que nos propres balises sûres :
// [b] gras, [i] italique, [u] souligné, [color=...] couleur, et des images.
// La couleur est validée (hex ou nom CSS alphabétique) et les images doivent
// être des liens https vers un hôte autorisé pointant un vrai fichier image ;
// sinon la balise est ignorée et seul le texte reste.
const _CSS_COLOR_RE = /^(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|[a-z]+)$/i;
const _IMG_URL_RE   = /^https:\/\/(res\.cloudinary\.com|raw\.githubusercontent\.com)\/[\w\-./%,]+\.(?:png|jpe?g|gif|webp|svg)$/i;

// `style` : déclarations CSS inline optionnelles, posées au cas par cas via les
// variantes de balises (ex. [img native], [icon sharp]) pour surcharger le style
// commun de la classe sans impacter les autres images/icônes.
function _imgTag(url, cls = 'method-img', style = '') {
  const u = url.trim();
  if (!_IMG_URL_RE.test(u)) return null;
  const styleAttr = style ? ` style="${style}"` : '';
  return `<img class="${cls}" src="${u}"${styleAttr} alt="" loading="lazy">`;
}

export function formatMethod(text) {
  // Normalise les fins de ligne (CRLF/CR → LF) en amont : sinon un `\r` résiduel
  // casse les regex multi-lignes ci-dessous (ex. le centrage des lignes d'images,
  // dont le lookahead attend `\n` ou la fin de chaîne juste après les images).
  let html = esc(text.replace(/\r\n?/g, '\n'))
    .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>')
    .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>')
    .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');
  html = html.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, (_m, color, inner) => {
    const c = color.trim();
    return _CSS_COLOR_RE.test(c) ? `<span style="color:${c}">${inner}</span>` : inner;
  });
  // Petite image inline (à côté du texte) via [icon]URL[/icon]. Classe distincte
  // de .method-img => non concernée par la mise en ligne/centrage des grandes.
  // [icon sharp]URL[/icon] retire l'arrondi (utile pour une icône fine/haute).
  html = html.replace(/\[icon(\s+sharp)?\]([\s\S]*?)\[\/icon\]/gi,
    (_m, sharp, url) => _imgTag(url, 'method-icon', sharp ? 'border-radius:0' : '') ?? url.trim());
  // Image via balise explicite [img]URL[/img], ou [img native]URL[/img] pour
  // forcer l'affichage à la taille réelle (pas d'agrandissement)…
  html = html.replace(/\[img(\s+native)?\]([\s\S]*?)\[\/img\]/gi,
    (_m, native, url) => _imgTag(url, 'method-img', native ? 'width:auto;height:auto;max-width:100%;border-radius:0' : '') ?? url.trim());
  // …ou via un lien d'image collé directement (séparé par un espace ou un saut
  // de ligne). Espace entre deux liens => même ligne ; saut de ligne => l'une
  // sous l'autre (le séparateur est préservé via `pre`).
  html = html.replace(/(^|\s)(https:\/\/\S+)(?=\s|$)/g, (m, pre, url) => {
    const tag = _imgTag(url);
    return tag ? pre + tag : m;
  });
  // Centre toute ligne composée uniquement d'images (une seule ou plusieurs
  // côte à côte), sans affecter l'alignement du texte.
  html = html.replace(
    /(?:^|\n)[ \t]*((?:<img class="method-img"[^>]*>[ \t]*)+)(?=\n|$)/g,
    (_m, imgs) => `<span class="method-img-row">${imgs.trim()}</span>`
  );
  return html;
}

// Construit un bloc « Apparition » autonome (icônes de jeux + popover du mode
// d'obtention) à partir d'apparitions [{ game_slug, method }]. Le mode est porté
// par chaque bouton via data-method, ce qui rend le bloc indépendant (forme de
// base dans l'en-tête, ou forme régionale/spéciale dans sa colonne d'illustration).
// Renvoie '' s'il n'y a aucun jeu connu.
export function appearanceBlockHtml(appearances) {
  const methodBySlug = Object.fromEntries((appearances || []).map(a => [a.game_slug, a.method]));
  const slugs = new Set(Object.keys(methodBySlug));
  const games = GAMES.filter(g => slugs.has(g.slug));
  if (!games.length) return '';
  return `
    <div class="appearance">
      <span class="appearance-label">Apparition</span>
      <div class="appearance-games">
        ${games.map(g => `
          <button type="button" class="appearance-game" data-slug="${esc(g.slug)}" data-method="${esc(methodBySlug[g.slug] || '')}" title="${esc(g.name)}">
            <img src="${esc(g.iconUrl)}" alt="${esc(g.name)}" width="40" height="40" loading="lazy">
          </button>`).join('')}
      </div>
      <div class="appearance-popover" hidden role="dialog" aria-label="Mode d'obtention">
        <button type="button" class="appearance-popover__close" aria-label="Fermer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div class="appearance-popover__head">
          <img class="appearance-popover__icon" src="" alt="" width="26" height="26">
          <span class="appearance-popover__title"></span>
        </div>
        <p class="appearance-popover__method"></p>
      </div>
    </div>`;
}

// Câble tous les blocs « Apparition » présents dans un conteneur. Chaque bloc gère
// son propre popover (positionné relativement à .appearance) ; le mode d'obtention
// est lu depuis data-method du bouton cliqué.
export function wireAppearanceBlocks(root) {
  root.querySelectorAll('.appearance').forEach(appearanceEl => {
    const popover   = appearanceEl.querySelector('.appearance-popover');
    const popIcon   = popover.querySelector('.appearance-popover__icon');
    const popTitle  = popover.querySelector('.appearance-popover__title');
    const popMethod = popover.querySelector('.appearance-popover__method');
    let docCloser = null;

    const closePopover = () => {
      popover.hidden = true;
      appearanceEl.querySelectorAll('.appearance-game.is-active').forEach(b => b.classList.remove('is-active'));
      if (docCloser) { document.removeEventListener('click', docCloser); docCloser = null; }
    };

    appearanceEl.querySelectorAll('.appearance-game').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (btn.classList.contains('is-active')) { closePopover(); return; }
        const game   = GAMES.find(g => g.slug === btn.dataset.slug);
        const method = btn.dataset.method;
        popIcon.src          = game?.iconUrl || '';
        popIcon.alt          = game?.name || '';
        popTitle.textContent = game?.name || '';
        if (method) {
          popMethod.innerHTML = formatMethod(method);
        } else {
          popMethod.textContent = "Mode d'obtention non renseigné.";
        }
        popMethod.classList.toggle('appearance-popover__method--empty', !method);
        appearanceEl.querySelectorAll('.appearance-game.is-active').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        popover.hidden = false;
        if (!docCloser) {
          docCloser = ev => { if (!appearanceEl.contains(ev.target)) closePopover(); };
          setTimeout(() => document.addEventListener('click', docCloser), 0);
        }
      });
    });

    popover.querySelector('.appearance-popover__close').addEventListener('click', e => {
      e.stopPropagation();
      closePopover();
    });
  });
}
