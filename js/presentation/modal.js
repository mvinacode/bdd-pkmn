import { store } from '../store.js';
import { esc } from '../utils.js';
import { VARIANT_STATUS_META, padNumber, getImageUrl, toRoman } from '../domain/constants.js';
import { cycleVariantStatus } from '../application/catches.js';
import { loadModalData } from '../application/modal-data.js';
import { buildEvolutionHtml } from './evolution.js';
import { appearanceBlockHtml, wireAppearanceBlocks } from './modal/appearance.js';
import { buildFormsSectionHtml } from './modal/forms-section.js';
import { buildIllustrationsHtml } from './modal/illustrations.js';
import { paldeanLabel, paldeanRacesOf } from './modal/paldea.js';
import { paintArtworks, paintEvoStatuses, refreshEvoStatuses } from './modal/status-view.js';
import { openIllustrationTab, wireFormsTabs, wireIllustrationTabs } from './modal/tabs.js';

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

    // Capture au moment de l'ouverture : sert à colorer les illustrations.
    const catch_ = store.catchByNumber[p.number] || null;

    const imgSrc  = p.image_url || getImageUrl(p.number);
    const evoHtml = buildEvolutionHtml(realEvoTree, p.number, megasByNumber, iconByNumber, gigamaxByNumber, regionalsByNumber);

    const paldeanRegionals = paldeanRacesOf(regionalsByNumber[p.number]);
    const isPaldeanFamily = paldeanRegionals.length > 0;
    const variantsHtml = buildFormsSectionHtml({ p, variants, specialFormsList, paldeanRegionals });

    const illustrationsHtml = buildIllustrationsHtml({
      p, imgSrc, specialFormsList, gigamax, paldeanRegionals,
      megas:     megasByNumber[p.number] || [],
      regionals: regionalsByNumber[p.number] || [],
    });

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
    wireIllustrationTabs(modalContent, isPaldeanFamily ? setAppearanceForTab : null);
    if (store.pendingIllusTab) {
      openIllustrationTab(modalContent, store.pendingIllusTab);
      store.pendingIllusTab = null;
    }
    wireFormsTabs(modalContent);

    const modalImg = modalContent.querySelector('.illus-col:first-child .modal-artwork');
    if (modalImg) modalImg.addEventListener('error', () => { modalImg.src = getImageUrl(p.number); });

    paintEvoStatuses(modalContent);
    paintArtworks(modalContent, p.number, catch_);

    modalContent.querySelectorAll('.variant-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newStatus = await cycleVariantStatus(parseInt(btn.dataset.pkmn), btn.dataset.variant);
        const meta      = VARIANT_STATUS_META[newStatus];
        btn.className   = `variant-status ${meta.cls}`;
        btn.textContent = meta.label;
        const card = btn.closest('.variant-card');
        if (card) card.dataset.status = newStatus;
        paintArtworks(modalContent, p.number, catch_);
        refreshEvoStatuses(modalContent);
      });
    });

    modalContent.querySelectorAll('.evo-portrait:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => openModal(parseInt(btn.dataset.number)));
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
