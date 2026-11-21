// Section « Formes » de la fiche : une carte par variante (sprite + bouton
// Non vu / Vu / Obtenu), rangées en lignes par sexe et en onglets (base, races
// de Tauros, formes spéciales, méga, régionales, Troizépi, gigamax).
//
// NB : le corps garde l'indentation d'origine d'openModal. Les gabarits HTML en
// dépendent (espaces compris) et les références de tests/modal le vérifient.
import { esc, spriteUrl } from '../../utils.js';
import {
  VARIANT_STATUS_META, SF_MALE_GROUPS, SF_GENDERED_GROUPS, SF_NO_DIMORPHISM_GROUPS, NO_BASE_FORM_NUMBERS,
  normalizeVariantUrl,
} from '../../domain/constants.js';
import { getVariantStatus } from '../../domain/completion.js';
import { paldeanLabel } from './paldea.js';

const MODAL_MALE_SVG   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
const MODAL_FEMALE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
const MODAL_ASEXUE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" width="16" height="16" aria-hidden="true"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;

/**
 * @param {object}   p                le Pokémon (number…)
 * @param {object[]} variants         pokemon_variants du Pokémon
 * @param {object[]} specialFormsList pokemon_special_forms du Pokémon
 * @param {object[]} paldeanRegionals races de Tauros (cf. paldeanRacesOf)
 * @returns {string} le HTML de la section, ou '' sans aucune forme
 */
export function buildFormsSectionHtml({ p, variants, specialFormsList, paldeanRegionals }) {
    function variantCard(v) {
      const status  = getVariantStatus(p.number, v.variant_type);
      const meta    = VARIANT_STATUS_META[status];
      const isShiny = ['shiny','asexue_shiny','shiny_male','shiny_female','shiny_mega','shiny_mega_x','shiny_mega_y','shiny_gigamax','alolan_shiny','alolan_shiny_male','alolan_shiny_female','alolan_asexue_shiny','galarian_shiny','galarian_shiny_male','galarian_shiny_female','galarian_asexue_shiny','hisuian_shiny','hisuian_shiny_male','hisuian_shiny_female','hisuian_asexue_shiny','troizepy_shiny'].includes(v.variant_type)
        || (v.variant_type.startsWith('paldean') && v.variant_type.includes('shiny'))
        || v.variant_type.includes('_shiny'); // Détecte aussi les formes spéciales shiny (ex: unown_a_shiny)
      const sparkles = isShiny ? `
        <span class="sparkle" style="top:-8px;left:18px;--sparkle-delay:0s;--sparkle-size:0.9rem;--sparkle-dur:2.2s">✦</span>
        <span class="sparkle" style="top:6px;right:-8px;--sparkle-delay:0.55s;--sparkle-size:0.65rem;--sparkle-dur:1.9s">✦</span>
        <span class="sparkle" style="top:50%;right:-9px;--sparkle-delay:1.1s;--sparkle-size:0.8rem;--sparkle-dur:2.5s">✦</span>
        <span class="sparkle" style="bottom:18px;left:-9px;--sparkle-delay:0.8s;--sparkle-size:0.7rem;--sparkle-dur:2s">✦</span>
        <span class="sparkle" style="bottom:-7px;left:38px;--sparkle-delay:1.5s;--sparkle-size:0.85rem;--sparkle-dur:2.3s">✦</span>` : '';
      return `
        <div class="variant-card${isShiny ? ' variant-card--shiny' : ''}" data-type="${esc(v.variant_type)}" data-status="${status}">
          ${sparkles}
          <div class="variant-img-wrap">
            <img src="${esc(normalizeVariantUrl(v.image_url))}" alt="${esc(v.label)}" loading="lazy">
          </div>
          <span class="variant-label">${esc(v.label)}</span>
          <button class="variant-status ${meta.cls}" data-pkmn="${p.number}" data-variant="${esc(v.variant_type)}">
            ${esc(meta.label)}
          </button>
        </div>`;
    }

    // isFemale : formes spéciales genrées (cf. SF_GENDERED_GROUPS). Le tiroir
    // enregistre la femelle sous le même type suffixé « _female ».
    function sfVariantCard(sf, isShiny, isFemale = false) {
      const vt     = (isShiny ? sf.form_key + '_shiny' : sf.form_key) + (isFemale ? '_female' : '');
      const label  = isShiny ? 'Shiny' : sf.form_label_fr;
      const iSrc   = isShiny
        ? (sf.image_url_shiny ? normalizeVariantUrl(sf.image_url_shiny) : spriteUrl(p.number, true))
        : (sf.image_url       ? normalizeVariantUrl(sf.image_url)       : spriteUrl(p.number, false));
      const status = getVariantStatus(p.number, vt);
      const meta   = VARIANT_STATUS_META[status];
      const sparkles = isShiny ? `
        <span class="sparkle" style="top:-8px;left:18px;--sparkle-delay:0s;--sparkle-size:0.9rem;--sparkle-dur:2.2s">✦</span>
        <span class="sparkle" style="top:6px;right:-8px;--sparkle-delay:0.55s;--sparkle-size:0.65rem;--sparkle-dur:1.9s">✦</span>
        <span class="sparkle" style="top:50%;right:-9px;--sparkle-delay:1.1s;--sparkle-size:0.8rem;--sparkle-dur:2.5s">✦</span>
        <span class="sparkle" style="bottom:18px;left:-9px;--sparkle-delay:0.8s;--sparkle-size:0.7rem;--sparkle-dur:2s">✦</span>
        <span class="sparkle" style="bottom:-7px;left:38px;--sparkle-delay:1.5s;--sparkle-size:0.85rem;--sparkle-dur:2.3s">✦</span>` : '';
      return `
        <div class="variant-card${isShiny ? ' variant-card--shiny' : ''}" data-type="${esc(vt)}" data-status="${status}">
          ${sparkles}
          <div class="variant-img-wrap"><img src="${esc(iSrc)}" alt="${esc(label)}" loading="lazy"></div>
          <span class="variant-label">${esc(label)}</span>
          <button class="variant-status ${meta.cls}" data-pkmn="${p.number}" data-variant="${esc(vt)}">${esc(meta.label)}</button>
        </div>`;
    }

    // Ligne badgée à partir de cartes DÉJÀ rendues (les formes spéciales ont leur
    // propre fabrique de carte, sfVariantCard).
    function variantRowHtml(badge, cards, forceWrap = false) {
      if (!cards.length) return '';
      const gridStyle = forceWrap ? ' style="max-width:800px"' : '';
      return `<div class="variants-row">
        <div class="variants-gender-col">${badge}</div>
        <div class="variants-grid"${gridStyle}>${cards.join('')}</div>
      </div>`;
    }

    // Ligne badgée à partir d'objets variante (table pokemon_variants).
    function variantRow(badge, subset, forceWrap = false) {
      return variantRowHtml(badge, subset.map(variantCard), forceWrap);
    }

    function regionalVariantRows(prefix, allVariants) {
      const neutral = allVariants.filter(v => [prefix, `${prefix}_shiny`].includes(v.variant_type));
      const asexue  = allVariants.filter(v => [`${prefix}_asexue`, `${prefix}_asexue_shiny`].includes(v.variant_type));
      const male    = allVariants.filter(v => [`${prefix}_male`, `${prefix}_shiny_male`].includes(v.variant_type));
      const female  = allVariants.filter(v => [`${prefix}_female`, `${prefix}_shiny_female`].includes(v.variant_type));
      return [
        variantRow(neutralBadge, neutral),
        variantRow(asexueBadge,  asexue),
        variantRow(maleBadge,    male),
        variantRow(femaleBadge,  female),
      ].join('');
    }

    const neutralVariants  = variants.filter(v => ['normal', 'shiny'].includes(v.variant_type));
    const asexueVariants   = variants.filter(v => ['asexue', 'asexue_shiny'].includes(v.variant_type));
    const maleVariants     = variants.filter(v => ['male', 'shiny_male'].includes(v.variant_type));
    const femaleVariants   = variants.filter(v => ['female', 'shiny_female'].includes(v.variant_type));
    const megaVariants     = variants.filter(v => ['mega', 'shiny_mega', 'mega_x', 'shiny_mega_x'].includes(v.variant_type));
    const megaYVariants    = variants.filter(v => ['mega_y', 'shiny_mega_y'].includes(v.variant_type));
    const gigamaxVariants  = variants.filter(v => ['gigamax', 'shiny_gigamax'].includes(v.variant_type));
    const alolanVariants   = variants.filter(v => ['alolan', 'alolan_shiny', 'alolan_asexue', 'alolan_asexue_shiny', 'alolan_male', 'alolan_shiny_male', 'alolan_female', 'alolan_shiny_female'].includes(v.variant_type));
    const galarianVariants = variants.filter(v => ['galarian', 'galarian_shiny', 'galarian_asexue', 'galarian_asexue_shiny', 'galarian_male', 'galarian_shiny_male', 'galarian_female', 'galarian_shiny_female'].includes(v.variant_type));
    const hisuianVariants  = variants.filter(v => ['hisuian', 'hisuian_shiny', 'hisuian_asexue', 'hisuian_asexue_shiny', 'hisuian_male', 'hisuian_shiny_male', 'hisuian_female', 'hisuian_shiny_female'].includes(v.variant_type));
    // Forme régionale « Paldea » classique et genrée (Axoloto) : region == 'paldean'
    // exactement, d'où des variant_type sans suffixe de race. À NE PAS confondre avec
    // les races de Tauros (paldean_combat/blaze/aqua), gérées à part via paldeanRegionals.
    const paldeaVariants   = variants.filter(v => ['paldean', 'paldean_shiny', 'paldean_asexue', 'paldean_asexue_shiny', 'paldean_male', 'paldean_shiny_male', 'paldean_female', 'paldean_shiny_female'].includes(v.variant_type));
    const troizepyVariants = variants.filter(v => ['troizepy', 'troizepy_shiny'].includes(v.variant_type));


    const neutralBadge = `<span class="gender-badge male">${MODAL_MALE_SVG}</span><span class="gender-badge female">${MODAL_FEMALE_SVG}</span>`;
    const maleBadge    = `<span class="gender-badge male">${MODAL_MALE_SVG}</span>`;
    const femaleBadge  = `<span class="gender-badge female">${MODAL_FEMALE_SVG}</span>`;
    const asexueBadge  = `<span class="gender-badge asexue">${MODAL_ASEXUE_SVG}</span>`;

    const SF_GROUP_ORDER = ['Pikachu Cosplayeur', 'Pikachu Casquette', 'Pikachu Partenaire', 'Spéciales'];
    const sfByGroup = {};
    for (const sf of specialFormsList) {
      const grp = sf.form_group || 'Formes spéciales';
      if (!sfByGroup[grp]) sfByGroup[grp] = [];
      sfByGroup[grp].push(sf);
    }
    const sfSortedGroups = [
      ...SF_GROUP_ORDER.filter(g => sfByGroup[g]),
      ...Object.keys(sfByGroup).filter(g => SF_GROUP_ORDER.indexOf(g) === -1).sort((a, b) => a.localeCompare(b, 'fr')),
    ];

    const baseFormsContent = [
      variantRow(neutralBadge, neutralVariants),
      variantRow(asexueBadge,  asexueVariants),
      variantRow(maleBadge,    maleVariants),
      variantRow(femaleBadge,  femaleVariants),
    ].join('');

    const megaFormsContent = megaVariants.length ? (() => {
      const isXType   = megaVariants.some(v => v.variant_type === 'mega_x' || v.variant_type === 'shiny_mega_x');
      const hasY      = megaYVariants.length > 0;
      const showBadge = isXType || hasY;
      const rowX      = showBadge
        ? variantRow(`<span class="gender-badge mega-x">X</span>`, megaVariants)
        : `<div class="variants-grid">${megaVariants.map(variantCard).join('')}</div>`;
      const rowY = hasY ? variantRow(`<span class="gender-badge mega-y">Y</span>`, megaYVariants) : '';
      return rowX + rowY;
    })() : '';

    // Onglets « Formes » par race de Paldea (variant_type = region et region_shiny).
    // Tauros est exclusivement mâle => badge mâle sur chaque race.
    const paldeanFormTabs = paldeanRegionals.map(r => {
      const raceVariants = variants.filter(v => v.variant_type === r.region || v.variant_type === `${r.region}_shiny`);
      return {
        id: r.region,
        label: paldeanLabel(r),
        html: `<div class="variants-rows-wrapper">${variantRow(maleBadge, raceVariants)}</div>`,
        show: !!raceVariants.length,
      };
    });

    const formTabList = [
      { id: 'base', label: 'Base', html: `<div class="variants-rows-wrapper">${baseFormsContent}</div>`, show: !NO_BASE_FORM_NUMBERS.has(p.number) && !!(neutralVariants.length || asexueVariants.length || maleVariants.length || femaleVariants.length) },
      ...paldeanFormTabs,
      ...sfSortedGroups.map(grp => {
        // Zarbi (Zarbidex) : structure custom avec badge asexué à gauche
        const isUnown = grp === 'Zarbidex';
        if (isUnown) {
          // Convertir les special forms en objets variant pour utiliser variantCard
          const unownVariants = sfByGroup[grp].flatMap(sf => {
            const normal = {
              variant_type: sf.form_key,
              label: sf.form_label_fr,
              image_url: sf.image_url || spriteUrl(p.number, false)
            };
            const shiny = {
              variant_type: sf.form_key + '_shiny',
              label: 'Shiny',
              image_url: sf.image_url_shiny || spriteUrl(p.number, true)
            };
            return [normal, shiny];
          });
          // Utiliser variantRow avec forceWrap pour limiter la largeur de la grille
          const html = `<div class="variants-rows-wrapper">${variantRow(asexueBadge, unownVariants, true)}</div>`;
          return { id: grp, label: grp, html, show: true };
        } else if (SF_GENDERED_GROUPS.has(grp)) {
          // Formes genrées : une ligne par sexe, comme les formes régionales.
          const rowFor = isFemale =>
            sfByGroup[grp].flatMap(sf => [sfVariantCard(sf, false, isFemale), sfVariantCard(sf, true, isFemale)]);
          // Sexes identiques : une seule ligne au badge mixte. Le statut posé sur la
          // femelle depuis le tiroir remonte quand même, getVariantStatus appariant
          // « X » et « X_female ».
          const html = SF_NO_DIMORPHISM_GROUPS.has(grp)
            ? `<div class="variants-rows-wrapper">${variantRowHtml(neutralBadge, rowFor(false))}</div>`
            : `<div class="variants-rows-wrapper">${variantRowHtml(maleBadge, rowFor(false))}${variantRowHtml(femaleBadge, rowFor(true))}</div>`;
          return { id: grp, label: grp, html, show: true };
        } else if (SF_MALE_GROUPS.has(grp)) {
          // Groupe exclusivement mâle (Ursaking Lune Vermeille, Pikachu Casquette) :
          // une seule ligne badgée mâle, comme les races de Tauros.
          const sfCards = sfByGroup[grp].flatMap(sf => [sfVariantCard(sf, false), sfVariantCard(sf, true)]);
          const html = `<div class="variants-rows-wrapper">${variantRowHtml(maleBadge, sfCards, sfByGroup[grp].length > 1)}</div>`;
          return { id: grp, label: grp, html, show: true };
        } else {
          const sfCards = sfByGroup[grp].flatMap(sf => [sfVariantCard(sf, false), sfVariantCard(sf, true)]);
          const html = `<div class="variants-grid variants-grid--2col">${sfCards.join('')}</div>`;
          return { id: grp, label: grp, html, show: true };
        }
      }),
      { id: 'mega',     label: 'Méga-Évolution',   html: `<div class="variants-rows-wrapper">${megaFormsContent}</div>`, show: !!megaVariants.length },
      { id: 'alola',    label: "Forme d'Alola",     html: `<div class="variants-rows-wrapper">${regionalVariantRows('alolan',   alolanVariants)}</div>`,   show: !!alolanVariants.length },
      { id: 'galar',    label: 'Forme de Galar',    html: `<div class="variants-rows-wrapper">${regionalVariantRows('galarian', galarianVariants)}</div>`, show: !!galarianVariants.length },
      { id: 'hisui',    label: "Forme d'Hisui",     html: `<div class="variants-rows-wrapper">${regionalVariantRows('hisuian',  hisuianVariants)}</div>`,  show: !!hisuianVariants.length },
      { id: 'paldea',   label: 'Forme de Paldea',   html: `<div class="variants-rows-wrapper">${regionalVariantRows('paldean',  paldeaVariants)}</div>`,   show: !!paldeaVariants.length },
      { id: 'troizepy', label: 'Pichu Troizépi',    html: `<div class="variants-rows-wrapper">${variantRow(femaleBadge, troizepyVariants)}</div>`, show: !!troizepyVariants.length },
      { id: 'gigamax',  label: 'Gigamax',            html: `<div class="variants-rows-wrapper"><div class="variants-grid">${gigamaxVariants.map(variantCard).join('')}</div></div>`, show: !!gigamaxVariants.length },
    ].filter(t => t.show);

    // Afficher les onglets même s'il n'y en a qu'un pour Zarbi (pour montrer "Zarbidex")
    const useFormsTabs = formTabList.length > 1 || (p.number === 201 && formTabList.length === 1);
    const variantsInnerHtml = useFormsTabs
      ? `<div class="illus-tabs forms-tabs-nav">
           ${formTabList.map((t, i) => `<button class="illus-tab-btn${i === 0 ? ' active' : ''}" data-forms-tab="${esc(t.id)}" aria-selected="${i === 0}">${esc(t.label)}</button>`).join('')}
         </div>
         ${formTabList.map((t, i) => `<div class="forms-tab-panel${i === 0 ? ' active' : ''}" data-forms-panel="${esc(t.id)}">${t.html}</div>`).join('')}`
      : (formTabList[0]?.html || '');

    return variants.length || specialFormsList.length
      ? `<div class="variants-section"><h4>Formes</h4>${variantsInnerHtml}</div>` : '';
}
