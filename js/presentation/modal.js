import { store } from '../store.js';
import { esc } from '../utils.js';
import {
  MEGA_ICON_URL, GIGAMAX_ICON_URL, VARIANT_STATUS_META,
  padNumber, getImageUrl, toRoman, typeBadge,
} from '../domain/constants.js';
import { artworkStatus, evoFormStatus } from '../domain/modal-status.js';
import { cycleVariantStatus } from '../application/catches.js';
import { loadModalData } from '../application/modal-data.js';
import { buildEvolutionHtml } from './evolution.js';
import { appearanceBlockHtml, wireAppearanceBlocks } from './modal/appearance.js';
import { buildFormsSectionHtml } from './modal/forms-section.js';
import { paldeanLabel, paldeanRacesOf } from './modal/paldea.js';

// Type de colonne d'illustration (cf. illustrationCol), pour artworkStatus.
function artworkColumnOf(col) {
  if (col?.classList.contains('is-mega'))         return { kind: 'mega' };
  if (col?.classList.contains('is-gigamax'))      return { kind: 'gigamax' };
  if (col?.classList.contains('is-regional'))     return { kind: 'regional', region: col.dataset.region };
  if (col?.classList.contains('is-special-form')) return { kind: 'special', sfKey: col.dataset.sfKey };
  return { kind: 'base' };
}

export async function openModal(number) {
  const modalOverlay = document.getElementById('modal-overlay');
  const modal        = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modalOverlay || !modal || !modalContent) return;

  store.currentModalPokemonNumber = number;
  modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  modalContent.innerHTML = '<div class="modal-loading"><div class="pokeball-loader"><div class="pb-top"></div><div class="pb-middle"><div class="pb-btn"></div></div><div class="pb-bottom"></div></div></div>';

  try {
    const data = await loadModalData(number);
    if (!data) { closeModal(); return; }
    const {
      pokemon: p, variants, gigamax, specialForms: specialFormsList, appearances, formAppearances,
      evoTree: realEvoTree, megasByNumber, regionalsByNumber, gigamaxByNumber, iconByNumber,
    } = data;

    // Capture utilisée plus bas par refreshArtworks (état des artworks).
    const catch_ = store.catchByNumber[p.number] || null;

    const imgSrc  = p.image_url || getImageUrl(p.number);
    const evoHtml = buildEvolutionHtml(realEvoTree, p.number, megasByNumber, iconByNumber, gigamaxByNumber, regionalsByNumber);

    const paldeanRegionals = paldeanRacesOf(regionalsByNumber[p.number]);
    const isPaldeanFamily = paldeanRegionals.length > 0;
    const variantsHtml = buildFormsSectionHtml({ p, variants, specialFormsList, paldeanRegionals });

    const megas      = megasByNumber[p.number] || [];
    const regionals  = regionalsByNumber[p.number] || [];
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
    const illustrationsHtml = useTabs ? `
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

    // Apparitions indexées par onglet d'illustration : 'base' => forme de base,
    // libellé de race (= data-tab) => localisations de cette forme Paldea. Le bloc
    // de l'en-tête (.appearance-slot) est reconstruit à chaque changement d'onglet.
    const appearancesByTab = { base: appearances };
    if (isPaldeanFamily) {
      for (const r of paldeanRegionals) appearancesByTab[paldeanLabel(r)] = formAppearances[r.region] || [];
    }
    const appearanceHtml = appearanceBlockHtml(appearances);

    modalContent.innerHTML = `
      <div class="modal-header">
        <div class="modal-header-main">
          <div class="modal-number">#${esc(padNumber(p.number))}</div>
          <h2 class="modal-name" id="modal-poke-name">${esc(p.name_fr)}</h2>
        </div>
        <div class="appearance-slot">${appearanceHtml}</div>
        <div class="modal-header-actions">
          <span class="gen-badge">Gén. ${esc(toRoman(p.generation))}</span>
        </div>
      </div>
      ${illustrationsHtml}
      ${evoHtml}
      ${variantsHtml}
    `;

    // Fenêtres flottantes « Apparition » : base (en-tête) + chaque forme. Clic sur
    // une icône → popover du mode d'obtention. Chaque bloc est indépendant.
    wireAppearanceBlocks(modalContent);

    // Onglets illustrations. Pour la famille Paldea, le bloc « Apparition » de
    // l'en-tête est reconstruit selon la forme (onglet) sélectionnée.
    function setAppearanceForTab(tab) {
      const slot = modalContent.querySelector('.appearance-slot');
      if (!slot) return;
      slot.innerHTML = appearanceBlockHtml(appearancesByTab[tab] || appearancesByTab.base || []);
      wireAppearanceBlocks(slot);
    }
    modalContent.querySelectorAll('.illus-tabs:not(.forms-tabs-nav) .illus-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        modalContent.querySelectorAll('.illus-tabs:not(.forms-tabs-nav) .illus-tab-btn').forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        modalContent.querySelectorAll('.illus-tab-panel').forEach(panel =>
          panel.classList.toggle('active', panel.dataset.panel === tab)
        );
        if (isPaldeanFamily) setAppearanceForTab(tab);
      });
    });

    if (store.pendingIllusTab) {
      const targetBtn = modalContent.querySelector(`.illus-tab-btn[data-tab="${CSS.escape(store.pendingIllusTab)}"]`);
      if (targetBtn) targetBtn.click();
      store.pendingIllusTab = null;
    }

    // Onglets formes
    modalContent.querySelectorAll('.forms-tabs-nav .illus-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.formsTab;
        modalContent.querySelectorAll('.forms-tabs-nav .illus-tab-btn').forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        modalContent.querySelectorAll('.forms-tab-panel').forEach(panel =>
          panel.classList.toggle('active', panel.dataset.formsPanel === tab)
        );
      });
    });

    const modalImg = modalContent.querySelector('.illus-col:first-child .modal-artwork');
    if (modalImg) modalImg.addEventListener('error', () => { modalImg.src = getImageUrl(p.number); });

    const formStatus = (num, formType) => evoFormStatus(store.seenMap[num], store.catchByNumber[num], formType);

    modalContent.querySelectorAll('.evo-portrait[data-number]').forEach(portrait => {
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

    const applyPillStatus = (portrait, pill) => {
      if (!portrait?.dataset.formType || !pill) return;
      const st = formStatus(parseInt(portrait.dataset.number), portrait.dataset.formType);
      pill.classList.add('evo-condition--' + st);
    };
    modalContent.querySelectorAll('.evo-branch-item').forEach(item =>
      applyPillStatus(item.querySelector('.evo-portrait[data-form-type]'), item.querySelector('.evo-condition-item'))
    );
    modalContent.querySelectorAll('.evo-portrait[data-form-type]').forEach(portrait => {
      if (portrait.closest('.evo-branch-item')) return;
      const prev = portrait.closest('.evo-stage')?.previousElementSibling;
      if (prev?.classList.contains('evo-arrow'))
        applyPillStatus(portrait, prev.querySelector('.evo-condition-item'));
    });

    function refreshArtworks() {
      const forms = store.seenMap[p.number] || {};

      function applyImg(img, owned, seen) {
        if (!img) return;
        img.classList.remove('modal-artwork--nb', 'modal-artwork--silhouette');
        if      (!owned && !seen) img.classList.add('modal-artwork--silhouette');
        else if (!owned)          img.classList.add('modal-artwork--nb');
      }

      modalContent.querySelectorAll('.illus-col-wrapper').forEach(wrapper => {
        const col = wrapper.querySelector('.illus-col');
        const { ownedNormal, seenNormal, ownedShiny, seenShiny } = artworkStatus(forms, catch_, artworkColumnOf(col));
        const items = wrapper.querySelectorAll('.illus-artwork-item');
        if (items.length >= 2) {
          applyImg(items[0].querySelector('.modal-artwork'), ownedNormal, seenNormal);
          applyImg(items[1].querySelector('.modal-artwork'), ownedShiny,  seenShiny);
        } else {
          applyImg(wrapper.querySelector('.modal-artwork'), ownedNormal || ownedShiny, seenNormal || seenShiny);
        }
      });
    }
    refreshArtworks();

    function refreshEvoPortraits() {
      modalContent.querySelectorAll('.evo-portrait[data-number]').forEach(portrait => {
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
      const refreshPill = (portrait, pill) => {
        if (!portrait?.dataset.formType || !pill) return;
        const st = formStatus(parseInt(portrait.dataset.number), portrait.dataset.formType);
        pill.className = pill.className.replace(/\bevo-condition--\S+/g, '').trim();
        pill.classList.add('evo-condition--' + st);
      };
      modalContent.querySelectorAll('.evo-branch-item').forEach(item =>
        refreshPill(item.querySelector('.evo-portrait[data-form-type]'), item.querySelector('.evo-condition-item'))
      );
      modalContent.querySelectorAll('.evo-portrait[data-form-type]').forEach(portrait => {
        if (portrait.closest('.evo-branch-item')) return;
        const prev = portrait.closest('.evo-stage')?.previousElementSibling;
        if (prev?.classList.contains('evo-arrow'))
          refreshPill(portrait, prev.querySelector('.evo-condition-item'));
      });
    }

    modalContent.querySelectorAll('.variant-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pokemonNumber = parseInt(btn.dataset.pkmn);
        const variantType   = btn.dataset.variant;
        const newStatus     = await cycleVariantStatus(pokemonNumber, variantType);
        const meta          = VARIANT_STATUS_META[newStatus];
        btn.className       = `variant-status ${meta.cls}`;
        btn.textContent     = meta.label;
        const card = btn.closest('.variant-card');
        if (card) card.dataset.status = newStatus;
        refreshArtworks();
        refreshEvoPortraits();
      });
    });

    modalContent.querySelectorAll('.evo-portrait:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => openModal(parseInt(btn.dataset.number)));
    });

    requestAnimationFrame(() => {
      modalContent.querySelectorAll('.stat-bar-fill').forEach(bar => {
        const w = bar.style.width;
        bar.style.width = '0';
        requestAnimationFrame(() => { bar.style.width = w; });
      });
    });

  } catch (err) {
    const modalContent2 = document.getElementById('modal-content');
    if (modalContent2) modalContent2.innerHTML = `<div style="padding:40px;color:#ef5350;font-family:monospace;font-size:0.85rem;white-space:pre-wrap">${esc(String(err))}</div>`;
  }
}

export function closeModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');
  store.currentModalPokemonNumber = null;
  if (modalOverlay) modalOverlay.hidden = true;
  document.body.style.overflow = '';
  if (modalContent) modalContent.innerHTML = '';
}
