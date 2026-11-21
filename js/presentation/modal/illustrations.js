// Illustrations de la fiche : artworks normal et shiny, description et types de
// la forme de base et de chaque forme (méga, régionales, spéciales, gigamax),
// en onglets par catégorie quand il y en a plusieurs.
//
// NB : le corps garde l'indentation d'origine d'openModal. Les gabarits HTML en
// dépendent (espaces compris) et les références de tests/modal le vérifient.
import { esc } from '../../utils.js';
import { MEGA_ICON_URL, GIGAMAX_ICON_URL, typeBadge } from '../../domain/constants.js';
import { paldeanLabel } from './paldea.js';

/**
 * @param {object}   p                le Pokémon
 * @param {string}   imgSrc           artwork de la forme de base
 * @param {object[]} megas            méga-évolutions du Pokémon
 * @param {object[]} regionals        formes régionales du Pokémon (races de Tauros triées)
 * @param {object[]} specialFormsList formes spéciales du Pokémon
 * @param {object[]} gigamax          forme(s) gigamax du Pokémon
 * @param {object[]} paldeanRegionals races de Tauros (cf. paldeanRacesOf)
 */
export function buildIllustrationsHtml({ p, imgSrc, megas, regionals, specialFormsList, gigamax, paldeanRegionals }) {
    const specialForms = [
      ...megas.map(m => ({ name: m.name, artwork_url: m.artwork_url, shiny_artwork_url: m.shiny_artwork_url || '', description_fr: m.description_fr, types: m.types || '', isMega: true,  isRegional: false, isSpecialForm: false, formKey: null, formIcon: MEGA_ICON_URL })),
      ...regionals.map(r => ({ name: r.name, artwork_url: r.artwork_url, shiny_artwork_url: r.shiny_artwork_url || '', description_fr: r.description_fr, types: r.types || '', isMega: false, isRegional: true,  isSpecialForm: false, formKey: r.region, raceLabel: (r.region || '').startsWith('paldean_') ? paldeanLabel(r) : null, formIcon: '' })),
      ...specialFormsList.map(sf => ({ name: sf.form_label_fr, artwork_url: sf.artwork_url || '', shiny_artwork_url: sf.artwork_url_shiny || '', description_fr: sf.description_fr || null, types: (p.types || []).join(','), isMega: false, isRegional: false, isSpecialForm: true, formKey: sf.form_key, formIcon: '', formGroup: sf.form_group || null })),
      ...gigamax.map(g => ({ name: g.name, artwork_url: g.artwork_url, shiny_artwork_url: g.shiny_artwork_url || '', description_fr: g.description_fr, types: (p.types || []).join(','), isMega: false, isRegional: false, isSpecialForm: false, formKey: null, formIcon: GIGAMAX_ICON_URL })),
    ];

    function illustrationCol(name, artworkUrl, descriptionFr, extraClass = '', formTypes = '', shinyUrl = '', formIcon = '', extraAttrs = '') {
      const typeList    = formTypes ? formTypes.split(',').map(t => t.trim()).filter(Boolean) : [];
      const typeBadges  = typeList.map(t => typeBadge(t)).join('');
      const artImg      = artworkUrl ? `<img class="modal-artwork" src="${esc(artworkUrl)}" alt="${esc(name)}" width="200" height="200" loading="lazy">` : `<div class="modal-artwork modal-artwork--pending"></div>`;
      const shinImg     = shinyUrl   ? `<img class="modal-artwork" src="${esc(shinyUrl)}"  alt="Shiny"  width="200" height="200" loading="lazy">` : `<div class="modal-artwork modal-artwork--pending"></div>`;
      // Si aucun artwork (ni normal ni shiny), n'affiche pas les onglets artwork
      const artworkHtml = (artworkUrl || shinyUrl)
        ? `<div class="illus-artworks">
             <div class="illus-artwork-item">${artImg}<span class="illus-artwork-label">${esc(name)}</span></div>
             <div class="illus-artwork-item">${shinImg}<span class="illus-artwork-label" style="color:var(--yellow)">Shiny</span></div>
           </div>`
        : `<span class="illus-col-name${extraClass.includes('is-mega') ? ' mega-label' : ''}">${esc(name)}</span>`;
      return `
        <div class="illus-col-wrapper">
          ${typeBadges ? `<div class="illus-col-types">${typeBadges}</div>` : '<div class="illus-col-types"></div>'}
          <div class="illus-col${extraClass ? ' ' + extraClass : ''}"${extraAttrs ? ' ' + extraAttrs : ''}>
            ${artworkHtml}
            ${descriptionFr ? `<p class="modal-description">"${esc(descriptionFr)}"</p>` : ''}
            ${formIcon ? `<img src="${esc(formIcon)}" alt="" class="illus-form-icon" loading="lazy">` : ''}
          </div>
        </div>`;
    }

    function getFormCategory(f) {
      if (f.isMega)        return 'Méga-Évolution';
      if (f.isRegional)    return f.raceLabel || 'Formes régionales';   // races Paldea => un onglet chacune
      if (f.isSpecialForm) return f.formGroup || 'Formes spéciales';
      return 'Gigamax';
    }
    // Filtre les formes qui ont au moins un artwork pour les illustrations
    const formsWithArtwork = specialForms.filter(f => f.artwork_url || f.shiny_artwork_url);
    const formsByCategory = {};
    for (const f of formsWithArtwork) {
      const cat = getFormCategory(f);
      if (!formsByCategory[cat]) formsByCategory[cat] = [];
      formsByCategory[cat].push(f);
    }
    const paldeanCatLabels = paldeanRegionals.map(paldeanLabel);   // dans l'ordre canonique des races
    const CATEGORY_ORDER = ['Pikachu Cosplayeur', 'Pikachu Casquette', 'Pikachu Partenaire', 'Spéciales', ...paldeanCatLabels, 'Méga-Évolution', 'Formes régionales', 'Gigamax'];
    const illusCategories = [
      ...CATEGORY_ORDER.filter(c => formsByCategory[c]),
      ...Object.keys(formsByCategory).filter(c => CATEGORY_ORDER.indexOf(c) === -1).sort((a, b) => a.localeCompare(b, 'fr')),
    ];
    const useTabs = illusCategories.length > 1 || formsWithArtwork.length >= 4;

    function renderFormIllusCol(f) {
      return illustrationCol(
        f.name, f.artwork_url || '', f.description_fr,
        f.isRegional ? 'is-regional' : f.isMega ? 'is-mega' : f.isSpecialForm ? 'is-special-form' : 'is-gigamax',
        f.types || '', f.shiny_artwork_url || '', f.formIcon || '',
        f.isSpecialForm && f.formKey ? `data-sf-key="${esc(f.formKey)}"`
          : f.isRegional && f.formKey ? `data-region="${esc(f.formKey)}"` : ''
      );
    }

    const baseIllusHtml    = illustrationCol(p.name_fr, imgSrc, p.description_fr, '', (p.types || []).join(','), p.shiny_artwork_url || '');
    return useTabs ? `
      <div class="illus-tabs">
        <div class="illus-tab-btns" role="tablist">
          <button class="illus-tab-btn active" data-tab="base" role="tab" aria-selected="true">Base</button>
          ${illusCategories.map(cat => `<button class="illus-tab-btn" data-tab="${esc(cat)}" role="tab" aria-selected="false">${esc(cat)}</button>`).join('')}
        </div>
        <div class="illus-tab-panel active" data-panel="base"><div class="illus-row">${baseIllusHtml}</div></div>
        ${illusCategories.map(cat => `
          <div class="illus-tab-panel" data-panel="${esc(cat)}">
            <div class="illus-row">${formsByCategory[cat].map(renderFormIllusCol).join('')}</div>
          </div>`).join('')}
      </div>` : `
      <div class="illus-row">
        ${baseIllusHtml}
        ${formsWithArtwork.map(renderFormIllusCol).join('')}
      </div>`;
}
