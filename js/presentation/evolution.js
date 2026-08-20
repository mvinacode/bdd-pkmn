import { esc } from '../utils.js';
import { normalizeVariantUrl, getImageUrl, padNumber, toRoman, typeBadge } from '../domain/constants.js?v=5';
import { MEGA_ICON_URL, GIGAMAX_ICON_URL } from '../domain/constants.js?v=5';

export function collectTreeNumbers(tree) {
  if (!tree) return [];
  return [tree.node.number, ...tree.children.flatMap(c => collectTreeNumbers(c))];
}

export function evoPortrait(node, isCurrent, iconUrl = null, extraClass = '') {
  const img = iconUrl ? normalizeVariantUrl(iconUrl) : getImageUrl(node.number);
  return `
    <button class="evo-portrait${isCurrent ? ' evo-current' : ''}${extraClass ? ' ' + extraClass : ''}" data-number="${node.number}" aria-label="Voir ${esc(node.name_fr)}" ${isCurrent ? 'disabled' : ''}>
      <div class="evo-img-wrap">
        <img src="${esc(img)}" alt="${esc(node.name_fr)}" width="96" height="96" loading="lazy">
      </div>
      <span class="evo-name">${esc(node.name_fr)}</span>
      <span class="evo-number">#${esc(padNumber(node.number))}</span>
    </button>`;
}

export function evoArrow(condition = '', itemImageUrl = null, bidirectional = false, isGigamax = false, orientation = 'right') {
  let conditionHtml = '';
  // Une URL d'image collée à la fin du texte de condition (ex. « Bonheur, jour,
  // sans capacité https://.../fee.png ») est extraite pour être rendue comme
  // petite icône après le texte, plutôt qu'affichée en URL brute.
  let inlineIcon = '';
  const urlMatch = condition.match(/https?:\/\/\S+?\.(?:png|jpe?g|svg|webp|gif)/i);
  if (urlMatch) {
    inlineIcon = `<img src="${esc(urlMatch[0])}" alt="" class="evo-condition-icon" loading="lazy">`;
    condition = condition.replace(urlMatch[0], '').replace(/[\s,]+$/, '').trim();
  }
  if (itemImageUrl) {
    const isGalanoaBand = /(bracelet|couronne)\s+galanoa/i.test(condition);
    const isKingsRock   = /roche\s+royale/i.test(condition);
    const isTradeEvo    = /échange/i.test(condition) && !isKingsRock;
    const isTradeMetalCoat = isTradeEvo && /peau\s*m[ée]tal/i.test(condition);
    const isTradeProtector = isTradeEvo && /protecteur/i.test(condition);
    const isTradeDracoScale = isTradeEvo && /écaille\s+draco/i.test(condition);
    const isTradeElectriseur = isTradeEvo && /électriseur/i.test(condition);
    const isTradeMagmariseur = isTradeEvo && /magmariseur/i.test(condition);
    const isTradeAmeliorator = isTradeEvo && /am[ée]liorat/i.test(condition);
    const isTradeCdDouteux = isTradeEvo && /douteux/i.test(condition);
    const isStone      = !bidirectional && !isGigamax && !isGalanoaBand;
    const isStoneIce   = isStone && /glace/i.test(condition);
    const isStoneMoon  = isStone && /lune/i.test(condition);
    const isStoneFire  = isStone && /feu/i.test(condition);
    const isStoneLeaf  = isStone && /plante/i.test(condition);
    const isStoneSun   = isStone && /soleil/i.test(condition);
    const isStoneWater = isStone && /\beau\b/i.test(condition);
    const isStoneShiny = isStone && /éclat/i.test(condition);
    const isStoneNight = isStone && /nuit/i.test(condition);
    const isOvalStone  = /pierre\s+ovale/i.test(condition);
    const isObsidienne = /obsidienne/i.test(condition);
    const textClass = (bidirectional || isGigamax) ? 'is-mega' : 'is-item';
    conditionHtml = `<div class="evo-condition-item${isGigamax ? ' is-gigamax' : ''}${isStone ? ' is-stone' : ''}${isStoneIce ? ' is-stone-ice' : ''}${isStoneMoon ? ' is-stone-moon' : ''}${isStoneFire ? ' is-stone-fire' : ''}${isStoneLeaf ? ' is-stone-leaf' : ''}${isStoneSun ? ' is-stone-sun' : ''}${isStoneWater ? ' is-stone-water' : ''}${isStoneShiny ? ' is-stone-shiny' : ''}${isStoneNight ? ' is-stone-night' : ''}${isOvalStone ? ' is-oval-stone' : ''}${isObsidienne ? ' is-obsidienne' : ''}${isKingsRock ? ' is-kings-rock' : ''}${isTradeEvo && !isTradeMetalCoat && !isTradeProtector && !isTradeDracoScale && !isTradeElectriseur && !isTradeMagmariseur && !isTradeAmeliorator && !isTradeCdDouteux ? ' is-trade' : ''}${isTradeMetalCoat ? ' is-trade-metal-coat' : ''}${isTradeProtector ? ' is-trade-protector' : ''}${isTradeDracoScale ? ' is-trade-draco-scale' : ''}${isTradeElectriseur ? ' is-trade-electriseur' : ''}${isTradeMagmariseur ? ' is-trade-magmariseur' : ''}${isTradeAmeliorator ? ' is-trade-ameliorator' : ''}${isTradeCdDouteux ? ' is-trade-cd-douteux' : ''}${isGalanoaBand ? ' is-galanoa-band' : ''}">
      <img src="${esc(itemImageUrl)}" alt="${esc(condition)}" class="evo-item-img">
      <span class="evo-condition ${textClass}">${esc(condition)}${inlineIcon}</span>
    </div>`;
  } else if (condition) {
    const isNight     = condition.toLowerCase().includes('nuit');
    const isDay       = condition.toLowerCase().includes('jour');
    const isHappiness = condition.toLowerCase().includes('bonheur');
    const isRageMove  = /poing de col[eè]re/i.test(condition);
    const isRolloutMove = /roulade/i.test(condition);
    const isAncientPowerMove = /pouvoir antique/i.test(condition);
    const isCopieMove = /\bcopie\b/i.test(condition);
    const isCoupDoubleMove = /coup\s+double/i.test(condition);
    const isDoubleLaserMove = /double\s+laser/i.test(condition);
    const isHyperceuseMove = /hyperceuse/i.test(condition);
    const isGalanoaBand  = /(bracelet|couronne)\s+galanoa/i.test(condition);
    const isCritical  = /coup.{0,5}critique/i.test(condition);
    const isItem      = condition && !condition.startsWith('Niv.') && !isNight && !isHappiness && !isRageMove && !isRolloutMove && !isAncientPowerMove && !isCopieMove && !isCoupDoubleMove && !isDoubleLaserMove && !isHyperceuseMove && !isGalanoaBand && !isCritical;
    const isStone      = isItem && /pierre\s/i.test(condition);
    const isStoneIce   = isStone && /glace/i.test(condition);
    const isStoneMoon  = isStone && /lune/i.test(condition);
    const isStoneFire  = isStone && /feu/i.test(condition);
    const isStoneLeaf  = isStone && /plante/i.test(condition);
    const isStoneSun   = isStone && /soleil/i.test(condition);
    const isStoneWater = isStone && /\beau\b/i.test(condition);
    const isStoneShiny = isStone && /éclat/i.test(condition);
    const isOvalStone  = isItem && /pierre\s+ovale/i.test(condition);
    const isKingsRock    = /roche\s+royale/i.test(condition);
    const isTradeEvo     = /échange/i.test(condition) && !isKingsRock;
    const isTradeProtector = isTradeEvo && /protecteur/i.test(condition);
    const isTradeDracoScale = isTradeEvo && /écaille\s+draco/i.test(condition);
    const isTradeElectriseur = isTradeEvo && /électriseur/i.test(condition);
    const isTradeMagmariseur = isTradeEvo && /magmariseur/i.test(condition);
    const conditionInner = isRageMove
      ? esc(condition).replace(/Poing de Col[eè]re/i, '<span class="move-name">$&</span>')
      : isRolloutMove
      ? esc(condition).replace(/Roulade/i, '<span class="move-name">$&</span>')
      : isAncientPowerMove
      ? esc(condition).replace(/Pouvoir Antique/i, '<span class="move-name">$&</span>')
      : isCopieMove
      ? esc(condition).replace(/Copie/i, '<span class="move-name">$&</span>')
      : isCoupDoubleMove
      ? esc(condition).replace(/Coup\s+Double/i, '<span class="move-name">$&</span>')
      : isDoubleLaserMove
      ? esc(condition).replace(/Double\s+Laser/i, '<span class="move-name">$&</span>')
      : isHyperceuseMove
      ? esc(condition).replace(/Hyperceuse/i, '<span class="move-name">$&</span>')
      : esc(condition);
    // Passe « sans capacité » à la ligne (virgule conservée) pour garder la pill compacte
    const conditionDisplay = conditionInner.replace(/,\s*(sans\s+capacit[ée]s?)/i, ',<br>$1');
    conditionHtml = `<span class="evo-condition${isItem ? ' is-item' : ''}${isStone ? ' is-stone' : ''}${isStoneIce ? ' is-stone-ice' : ''}${isStoneMoon ? ' is-stone-moon' : ''}${isStoneFire ? ' is-stone-fire' : ''}${isStoneLeaf ? ' is-stone-leaf' : ''}${isStoneSun ? ' is-stone-sun' : ''}${isStoneWater ? ' is-stone-water' : ''}${isStoneShiny ? ' is-stone-shiny' : ''}${isOvalStone ? ' is-oval-stone' : ''}${isKingsRock ? ' is-kings-rock' : ''}${isTradeEvo && !isTradeProtector && !isTradeDracoScale && !isTradeElectriseur && !isTradeMagmariseur ? ' is-trade' : ''}${isTradeProtector ? ' is-trade-protector' : ''}${isTradeDracoScale ? ' is-trade-draco-scale' : ''}${isTradeElectriseur ? ' is-trade-electriseur' : ''}${isTradeMagmariseur ? ' is-trade-magmariseur' : ''}${isGalanoaBand ? ' is-galanoa-band' : ''}${isNight ? ' is-night' : ''}${isHappiness ? ' is-happiness' : ''}${isDay ? ' is-day' : ''}${isRageMove ? ' is-rage-move' : ''}${isRolloutMove ? ' is-rollout-move' : ''}${isAncientPowerMove ? ' is-ancient-power-move' : ''}${isCopieMove ? ' is-copie-move' : ''}${isCoupDoubleMove ? ' is-coup-double-move' : ''}${isDoubleLaserMove ? ' is-double-laser-move' : ''}${isHyperceuseMove ? ' is-hyperceuse-move' : ''}${isCritical ? ' is-critical' : ''}"><span class="evo-cond-body">${conditionDisplay}${inlineIcon}</span></span>`;
  } else if (inlineIcon) {
    // Condition réduite à sa seule icône (aucun texte restant après extraction)
    conditionHtml = `<span class="evo-condition">${inlineIcon}</span>`;
  }
  const isDown = orientation === 'down';
  const arrowSvg = bidirectional
    ? (isDown
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7l4-4 4 4M8 17l4 4 4-4M12 3v18"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8l4 4-4 4M7 8l-4 4 4 4M3 12h18"/></svg>`)
    : isDown
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M6 13l6 6 6-6"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  return `<div class="evo-arrow${isDown ? ' evo-arrow--down' : ''}" aria-hidden="true">${conditionHtml}${arrowSvg}</div>`;
}

export function evoGigamaxPortrait(gigamax) {
  const imgHtml = gigamax.sprite_url
    ? `<img src="${esc(normalizeVariantUrl(gigamax.sprite_url))}" alt="${esc(gigamax.name)}" width="96" height="96" loading="lazy">`
    : `<div class="evo-mega-placeholder">✦</div>`;
  return `
    <div class="evo-stage">
      <div class="evo-portrait evo-gigamax" data-number="${gigamax.pokemon_number}" data-form-type="gigamax">
        <div class="evo-img-wrap">${imgHtml}</div>
        <span class="evo-name">${esc(gigamax.name)}</span>
        <img src="${GIGAMAX_ICON_URL}" alt="Gigamax" class="evo-mega-icon" loading="lazy">
      </div>
    </div>`;
}

export function evoMegaPortrait(mega) {
  const imgHtml = mega.image_url
    ? `<img src="${esc(normalizeVariantUrl(mega.image_url))}" alt="${esc(mega.name)}" width="96" height="96" loading="lazy">`
    : `<div class="evo-mega-placeholder">✦</div>`;
  return `
    <div class="evo-stage">
      <div class="evo-portrait evo-mega" data-number="${mega.pokemon_number}" data-form-type="mega">
        <div class="evo-img-wrap">${imgHtml}</div>
        <span class="evo-name">${esc(mega.name)}</span>
        <img src="${MEGA_ICON_URL}" alt="Méga" class="evo-mega-icon" loading="lazy">
      </div>
    </div>`;
}

export function evoRegionalPortrait(regional) {
  const imgSrc = regional.image_url
    ? normalizeVariantUrl(regional.image_url)
    : (regional.artwork_url || null);
  const imgHtml = imgSrc
    ? `<img src="${esc(imgSrc)}" alt="${esc(regional.name)}" width="96" height="96" loading="lazy">`
    : `<div class="evo-mega-placeholder">✦</div>`;
  return `
    <button class="evo-portrait evo-regional" data-number="${regional.pokemon_number}" data-form-type="${esc(regional.region)}" disabled>
      <div class="evo-img-wrap">${imgHtml}</div>
      <span class="evo-name">${esc(regional.name)}</span>
    </button>`;
}

export function buildEvolutionHtml(tree, currentNumber, megasByNumber = {}, iconByNumber = {}, gigamaxByNumber = {}, regionalsByNumber = {}) {
  if (!tree) return '';

  function renderNode(node, depth, excludeRegionals = false) {
    const isCurrent = node.node.number === currentNumber;
    const iconUrl   = iconByNumber[node.node.number] || null;
    const portrait  = evoPortrait(node.node, isCurrent, iconUrl);
    const regionals = excludeRegionals ? [] : (regionalsByNumber[node.node.number] || []);
    const megas          = node.children.length === 0 ? (megasByNumber[node.node.number] || []) : [];
    const gigamaxesLeaf  = node.children.length === 0 ? (gigamaxByNumber[node.node.number] || []) : [];
    const gigamaxesBranch = node.children.length >= 1  ? (gigamaxByNumber[node.node.number] || []) : [];
    const allBranches    = [...megas, ...gigamaxesLeaf];

    let megaHtml = '';
    if (allBranches.length === 1) {
      if (megas.length === 1) {
        megaHtml = `${evoArrow(megas[0].condition_label, megas[0].item_image_url || null, true)}${evoMegaPortrait(megas[0])}`;
      } else {
        megaHtml = `${evoArrow(gigamaxesLeaf[0].condition_label || gigamaxesLeaf[0].name, gigamaxesLeaf[0].item_image_url || null, true, true)}${evoGigamaxPortrait(gigamaxesLeaf[0])}`;
      }
    } else if (allBranches.length > 1) {
      const branches = [
        ...megas.map(m => `<div class="evo-branch-item">${evoArrow(m.condition_label, m.item_image_url || null, true)}${evoMegaPortrait(m)}</div>`),
        ...gigamaxesLeaf.map(g => `<div class="evo-branch-item">${evoArrow(g.condition_label || g.name, g.item_image_url || null, true, true)}${evoGigamaxPortrait(g)}</div>`),
      ].join('');
      megaHtml = `<div class="evo-branches evo-branches-special">${branches}</div>`;
    }

    if (node.children.length === 0) {
      const stageClass   = allBranches.length > 1 ? 'evo-stage evo-stage-branching' : 'evo-stage';
      const regionalsHtml = regionals.length ? `<div class="evo-regionals${regionals.length > 1 ? ' evo-regionals--stacked' : ''}">${regionals.map(evoRegionalPortrait).join('')}</div>` : '';
      return `<div class="${stageClass}">${portrait}${regionalsHtml}</div>${megaHtml}`;
    }

    if (node.children.length === 1) {
      const condition = node.children[0].node.evolution_condition || '';
      if (gigamaxesBranch.length > 0) {
        const nextNode      = node.children[0];
        const nextRegionals = regionalsByNumber[nextNode.node.number] || [];
        const nextMegas     = megasByNumber[nextNode.node.number] || [];
        const nextIconUrl   = iconByNumber[nextNode.node.number] || null;
        const nextPortrait  = evoPortrait(nextNode.node, nextNode.node.number === currentNumber, nextIconUrl);
        const gigaBranches  = gigamaxesBranch.map(g =>
          `<div class="evo-branch-item">${evoArrow(g.condition_label || g.name, g.item_image_url || null, true, true)}${evoGigamaxPortrait(g)}</div>`
        ).join('');
        let raiChainWrapper;
        if (nextMegas.length === 0) {
          raiChainWrapper = `<div class="evo-stage">${nextPortrait}</div>`;
        } else if (nextMegas.length === 1) {
          raiChainWrapper = `<div class="evo-inline-chain"><div class="evo-stage">${nextPortrait}</div>${evoArrow(nextMegas[0].condition_label, nextMegas[0].item_image_url || null, true)}${evoMegaPortrait(nextMegas[0])}</div>`;
        } else {
          const mBranches = nextMegas.map(m =>
            `<div class="evo-branch-item">${evoArrow(m.condition_label, m.item_image_url || null, true)}${evoMegaPortrait(m)}</div>`
          ).join('');
          raiChainWrapper = `<div class="evo-inline-chain"><div class="evo-stage evo-stage--root-stretch">${nextPortrait}</div><div class="evo-branches evo-branches-special">${mBranches}</div></div>`;
        }
        const mainBranch = `<div class="evo-branch-item">${evoArrow(condition, nextNode.node.evolution_item_image_url || null)}${raiChainWrapper}</div>`;
        const regionalBranches = nextRegionals.map(r => {
          const arrowCond = r.evolution_condition || condition;
          return `<div class="evo-branch-item">${evoArrow(arrowCond, r.evolution_item_image_url || null)}<div class="evo-stage">${evoRegionalPortrait(r)}</div></div>`;
        }).join('');
        const rootPortrait = evoPortrait(node.node, isCurrent, iconUrl, 'evo-portrait--root');
        return `<div class="evo-stage evo-stage--root-stretch">${rootPortrait}</div><div class="evo-branches-pikachu">${gigaBranches}${mainBranch}${regionalBranches}</div>`;
      }
      // Cas asymétrique : l'enfant unique est terminal sous sa forme normale,
      // mais une de ses formes régionales ré-évolue vers le petit-enfant
      // (ex. Mime Jr → M. Mime [terminal] / M. Mime de Galar → M. Glaquette).
      // On éclate en deux branches : la normale s'arrête à l'enfant, la régionale
      // enchaîne forme régionale → petit-enfant avec leurs conditions propres.
      {
        const soleChild       = node.children[0];
        const childRegionals  = regionalsByNumber[soleChild.node.number] || [];
        const evolvingRegional = childRegionals.find(r =>
          r.evolution_into_number && soleChild.children.some(gc => gc.node.number === r.evolution_into_number)
        );
        if (soleChild.children.length === 1 && evolvingRegional) {
          const grandChild   = soleChild.children.find(gc => gc.node.number === evolvingRegional.evolution_into_number);
          const childIconUrl = iconByNumber[soleChild.node.number] || null;
          const childPortrait = evoPortrait(soleChild.node, soleChild.node.number === currentNumber, childIconUrl);
          const gcIconUrl    = iconByNumber[grandChild.node.number] || null;
          const gcPortrait   = evoPortrait(grandChild.node, grandChild.node.number === currentNumber, gcIconUrl);
          const normalBranch = `<div class="evo-branch-item">${evoArrow(condition, soleChild.node.evolution_item_image_url || null)}<div class="evo-stage">${childPortrait}</div></div>`;
          // Chaîne régionale (forme régionale → petit-enfant) regroupée dans une
          // seule cellule pour que la grille « alignée » empile les deux pills de
          // départ (col 1) à largeur identique l'une sous l'autre.
          const regionalChain = `<div class="evo-inline-chain"><div class="evo-stage">${evoRegionalPortrait(evolvingRegional)}</div>${evoArrow(grandChild.node.evolution_condition || '', grandChild.node.evolution_item_image_url || null)}<div class="evo-stage">${gcPortrait}</div></div>`;
          const regionalBranch = `<div class="evo-branch-item">${evoArrow(evolvingRegional.evolution_condition || '', evolvingRegional.evolution_item_image_url || null)}${regionalChain}</div>`;
          return `<div class="evo-stage">${portrait}</div><div class="evo-branches evo-branches-aligned">${normalBranch}${regionalBranch}</div>`;
        }
      }
      if (regionals.length > 0) {
        const nextNode      = node.children[0];
        const nextRegionals = regionalsByNumber[nextNode.node.number] || [];
        const isMultiLevel  = nextNode.children.length === 1;

        if (isMultiLevel) {
          // Grille 5 colonnes : [A] [→] [B] [→] [C] sur chaque ligne
          const nextNextNode      = nextNode.children[0];
          const condition2        = nextNextNode.node.evolution_condition || '';
          const nextNextIconUrl   = iconByNumber[nextNextNode.node.number] || null;
          const nextIconUrl2      = iconByNumber[nextNode.node.number] || null;
          const baseRow = [
            `<div class="evo-stage">${portrait}</div>`,
            evoArrow(condition, nextNode.node.evolution_item_image_url || null),
            `<div class="evo-stage">${evoPortrait(nextNode.node, nextNode.node.number === currentNumber, nextIconUrl2)}</div>`,
            evoArrow(condition2, nextNextNode.node.evolution_item_image_url || null),
            `<div class="evo-stage">${evoPortrait(nextNextNode.node, nextNextNode.node.number === currentNumber, nextNextIconUrl)}</div>`,
          ].join('');
          const nextNextRegionals = regionalsByNumber[nextNextNode.node.number] || [];
          const regionalRows = regionals.map(r => {
            const matchingNext     = nextRegionals.find(nr => nr.region === r.region);
            const matchingNextNext = nextNextRegionals.find(nr => nr.region === r.region);
            const arrowCond    = r.evolution_condition || matchingNext?.evolution_condition || condition;
            const arrowItemImg = r.evolution_item_image_url || matchingNext?.evolution_item_image_url || null;
            const arrowCond2    = matchingNextNext?.evolution_condition || condition2;
            const arrowItemImg2 = matchingNextNext?.evolution_item_image_url || nextNextNode.node.evolution_item_image_url || null;
            return [
              `<div class="evo-stage">${evoRegionalPortrait(r)}</div>`,
              evoArrow(arrowCond, arrowItemImg),
              `<div class="evo-stage">${matchingNext ? evoRegionalPortrait(matchingNext) : ''}</div>`,
              evoArrow(arrowCond2, arrowItemImg2),
              `<div class="evo-stage">${matchingNextNext ? evoRegionalPortrait(matchingNextNext) : ''}</div>`,
            ].join('');
          }).join('');
          return `<div class="evo-chain-regional-grid evo-chain-regional-grid--3stage">${baseRow}${regionalRows}</div>`;
        }

        // Grille régionale (chaîne 2 stades)
        const leafIconUrl  = iconByNumber[nextNode.node.number] || null;
        const leafPortrait = evoPortrait(nextNode.node, nextNode.node.number === currentNumber, leafIconUrl);
        const leafMegas    = megasByNumber[nextNode.node.number] || [];
        const leafGiga     = gigamaxByNumber[nextNode.node.number] || [];

        if (leafMegas.length === 1 && leafGiga.length === 0) {
          // 5 colonnes : Méga intégré à la grille sur la ligne du Pokémon de base uniquement
          const megaArrow    = evoArrow(leafMegas[0].condition_label, leafMegas[0].item_image_url || null, true);
          const megaPortrait = evoMegaPortrait(leafMegas[0]);
          const regionalRows = regionals.map(r => {
            const matchingNext = nextRegionals.find(nr => nr.region === r.region);
            const arrowCond    = r.evolution_condition || matchingNext?.evolution_condition || condition;
            const arrowItemImg = r.evolution_item_image_url || matchingNext?.evolution_item_image_url || null;
            return `<div class="evo-stage">${evoRegionalPortrait(r)}</div>${evoArrow(arrowCond, arrowItemImg)}${matchingNext ? `<div class="evo-stage">${evoRegionalPortrait(matchingNext)}</div>` : '<div class="evo-stage"></div>'}<div></div><div></div>`;
          }).join('');
          return `<div class="evo-chain-regional-grid evo-chain-regional-grid--3stage"><div class="evo-stage">${portrait}</div>${evoArrow(condition, nextNode.node.evolution_item_image_url || null)}<div class="evo-stage">${leafPortrait}</div>${megaArrow}${megaPortrait}${regionalRows}</div>`;
        }

        // 3 colonnes ; méga/gigas multiples en élément frère
        let leafBranchHtml = '';
        if (leafGiga.length === 1 && leafMegas.length === 0) {
          leafBranchHtml = `${evoArrow(leafGiga[0].condition_label || leafGiga[0].name, leafGiga[0].item_image_url || null, true, true)}${evoGigamaxPortrait(leafGiga[0])}`;
        } else if (leafMegas.length + leafGiga.length > 1) {
          const bs = [
            ...leafMegas.map(m => `<div class="evo-branch-item">${evoArrow(m.condition_label, m.item_image_url || null, true)}${evoMegaPortrait(m)}</div>`),
            ...leafGiga.map(g => `<div class="evo-branch-item">${evoArrow(g.condition_label || g.name, g.item_image_url || null, true, true)}${evoGigamaxPortrait(g)}</div>`),
          ].join('');
          leafBranchHtml = `<div class="evo-branches evo-branches-special">${bs}</div>`;
        }
        const allRegionalsClaim = regionals.length > 0 && regionals.every(r => r.evolution_into_number === nextNode.node.number);
        const regionalRows = regionals.map(r => {
          const claimsLeaf   = r.evolution_into_number === nextNode.node.number;
          const matchingNext = nextRegionals.find(nr => nr.region === r.region);
          const arrowCond    = r.evolution_condition || matchingNext?.evolution_condition || condition;
          const arrowItemImg = r.evolution_item_image_url || matchingNext?.evolution_item_image_url || null;
          const targetCell   = claimsLeaf
            ? `<div class="evo-stage">${leafPortrait}</div>`
            : (matchingNext ? `<div class="evo-stage">${evoRegionalPortrait(matchingNext)}</div>` : '<div class="evo-stage"></div>');
          return `<div class="evo-stage">${evoRegionalPortrait(r)}</div>${evoArrow(arrowCond, arrowItemImg)}${targetCell}`;
        }).join('');
        if (allRegionalsClaim) {
          return `<div class="evo-chain-regional-grid"><div class="evo-stage">${portrait}</div><div></div><div></div>${regionalRows}</div>${leafBranchHtml}`;
        }
        return `<div class="evo-chain-regional-grid"><div class="evo-stage">${portrait}</div>${evoArrow(condition, nextNode.node.evolution_item_image_url || null)}<div class="evo-stage">${leafPortrait}</div>${regionalRows}</div>${leafBranchHtml}`;
      }
      // Cible unique dont les formes régionales évoluent aussi depuis ce Pokémon
      // (ex. Noeunoeuf → Noadkoko / Noadkoko d'Alola) : racine étirée + une
      // branche par cible, chacune avec sa propre pill de condition
      const soleChild      = node.children[0];
      const soleRegionals  = excludeRegionals ? [] : (regionalsByNumber[soleChild.node.number] || []);
      const soleHasSpecials = (megasByNumber[soleChild.node.number] || []).length > 0
        || (gigamaxByNumber[soleChild.node.number] || []).length > 0;
      if (soleChild.children.length === 0 && !soleHasSpecials
          && soleRegionals.length > 0 && soleRegionals.every(r => r.evolution_condition)) {
        const leafIconUrl  = iconByNumber[soleChild.node.number] || null;
        const leafPortrait = evoPortrait(soleChild.node, soleChild.node.number === currentNumber, leafIconUrl);
        const branchesHtml = [
          `<div class="evo-branch-item">${evoArrow(condition, soleChild.node.evolution_item_image_url || null)}<div class="evo-stage">${leafPortrait}</div></div>`,
          ...soleRegionals.map(r =>
            `<div class="evo-branch-item">${evoArrow(r.evolution_condition, r.evolution_item_image_url || null)}<div class="evo-stage">${evoRegionalPortrait(r)}</div></div>`
          ),
        ].join('');
        return `<div class="evo-stage">${portrait}</div><div class="evo-branches evo-branches-aligned">${branchesHtml}</div>`;
      }
      return `<div class="evo-stage">${portrait}</div>${evoArrow(condition, node.children[0].node.evolution_item_image_url || null)}${renderNode(node.children[0], depth + 1, excludeRegionals)}`;
    }

    // Beaucoup d'évolitions terminales (ex. Évoli → ses évolitions) : disposition
    // en éventail — le Pokémon de base centré au-dessus, ses cibles réparties en
    // grille horizontale qui s'enroule, chacune avec sa propre flèche/pill. Un
    // éventuel Gigamax de la base y figure comme branche bidirectionnelle.
    const fanChildrenSimple = node.children.every(c =>
      c.children.length === 0
      && (megasByNumber[c.node.number] || []).length === 0
      && (gigamaxByNumber[c.node.number] || []).length === 0
      && (regionalsByNumber[c.node.number] || []).length === 0
    );
    if (node.children.length >= 4 && fanChildrenSimple && regionals.length === 0) {
      // Grille : rangée 1 = base (étirée sur les N colonnes d'évolitions) + Gigamax
      // éventuel dans une colonne supplémentaire à droite ; rangée 2 = les évolitions,
      // une par colonne. La base occupe donc exactement la largeur des évolitions et
      // grandit à chaque évolition ajoutée.
      const cols    = node.children.length;
      const hasGiga = gigamaxesBranch.length > 0;
      const baseCell = `<div class="evo-fan-base" style="grid-column:1/span ${cols};grid-row:1;"><div class="evo-stage">${portrait}</div></div>`;
      const gigaCell = gigamaxesBranch.map(g =>
        `<div class="evo-fan-giga" style="grid-column:${cols + 1};grid-row:1;">${evoArrow(g.condition_label || g.name, g.item_image_url || null, true, true)}${evoGigamaxPortrait(g)}</div>`
      ).join('');
      // Rangée 2 = flèches + pills (même rangée de grille → même hauteur pour
      // toutes) ; rangée 3 = portraits.
      const arrowCells = node.children.map((c, i) =>
        `<div class="evo-fan-arrow" style="grid-column:${i + 1};grid-row:2;">${evoArrow(c.node.evolution_condition || '', c.node.evolution_item_image_url || null, false, false, 'down')}</div>`
      ).join('');
      const portraitCells = node.children.map((c, i) => {
        const cIconUrl  = iconByNumber[c.node.number] || null;
        const cPortrait = evoPortrait(c.node, c.node.number === currentNumber, cIconUrl);
        return `<div class="evo-fan-portrait" style="grid-column:${i + 1};grid-row:3;"><div class="evo-stage">${cPortrait}</div></div>`;
      }).join('');
      const templateCols = `repeat(${cols}, auto)${hasGiga ? ' auto' : ''}`;
      return `<div class="evo-fan-grid" style="grid-template-columns:${templateCols};">${baseCell}${gigaCell}${arrowCells}${portraitCells}</div>`;
    }

    // Multi-branches + formes régionales sans Gigamax : grille unifiée 3 colonnes
    if (regionals.length > 0 && gigamaxesBranch.length === 0) {
      // Un enfant du Pokémon de base peut être en réalité l'évolution EXCLUSIVE
      // d'une forme régionale vers une nouvelle espèce (ex. Axoloto de Paldéa ->
      // Terraiste #980, alors qu'Axoloto -> Maraiste). Cet enfant est « revendiqué »
      // par la forme régionale via evolution_into_number : on le sort des branches
      // normales pour le rattacher à sa forme régionale, avec la pill de celle-ci.
      const claimedNums = new Set(
        regionals
          .filter(r => r.evolution_into_number && node.children.some(c => c.node.number === r.evolution_into_number))
          .map(r => r.evolution_into_number)
      );
      const mainChildren = node.children.filter(c => !claimedNums.has(c.node.number));

      const rootPortrait = evoPortrait(node.node, isCurrent, iconUrl);
      const normalCount  = Math.max(mainChildren.length, 1);

      const normalCells = mainChildren.map(c => {
        const cond      = c.node.evolution_condition || '';
        const cIconUrl  = iconByNumber[c.node.number] || null;
        const cPortrait = evoPortrait(c.node, c.node.number === currentNumber, cIconUrl);
        const cMegas    = megasByNumber[c.node.number] || [];
        let target;
        if (cMegas.length === 0) {
          target = `<div class="evo-stage">${cPortrait}</div>`;
        } else if (cMegas.length === 1) {
          target = `<div class="evo-inline-chain"><div class="evo-stage">${cPortrait}</div>${evoArrow(cMegas[0].condition_label, cMegas[0].item_image_url || null, true)}${evoMegaPortrait(cMegas[0])}</div>`;
        } else {
          const mBranches = cMegas.map(m => `<div class="evo-branch-item">${evoArrow(m.condition_label, m.item_image_url || null, true)}${evoMegaPortrait(m)}</div>`).join('');
          target = `<div class="evo-inline-chain"><div class="evo-stage evo-stage--root-stretch">${cPortrait}</div><div class="evo-branches evo-branches-special">${mBranches}</div></div>`;
        }
        return `${evoArrow(cond, c.node.evolution_item_image_url || null)}${target}`;
      }).join('');

      let rOffset = normalCount + 1;
      const regionalSections = regionals.map(r => {
        // Forme régionale qui évolue vers une nouvelle espèce revendiquée (enfant
        // sorti des branches normales) : une ligne « forme régionale -> espèce »,
        // avec la pill (condition) propre à la forme régionale.
        const claimedChild = r.evolution_into_number
          ? node.children.find(c => c.node.number === r.evolution_into_number)
          : null;
        if (claimedChild) {
          const cIconUrl  = iconByNumber[claimedChild.node.number] || null;
          const cPortrait = evoPortrait(claimedChild.node, claimedChild.node.number === currentNumber, cIconUrl);
          const cond      = r.evolution_condition || claimedChild.node.evolution_condition || '';
          const itemImg   = r.evolution_item_image_url || claimedChild.node.evolution_item_image_url || null;
          const startRow  = rOffset;
          rOffset += 1;
          return `<div class="evo-stage evo-stage--root-stretch" style="grid-row:${startRow};grid-column:1">${evoRegionalPortrait(r)}</div>${evoArrow(cond, itemImg)}<div class="evo-stage">${cPortrait}</div>`;
        }
        const rCount = mainChildren.length;
        const rCells = mainChildren.map(c => {
          const childRegionals = regionalsByNumber[c.node.number] || [];
          const match = childRegionals.find(nr => nr.region === r.region);
          if (!match) return '';
          const arrowCond    = match.evolution_condition || c.node.evolution_condition || '';
          const arrowItemImg = match.evolution_item_image_url || null;
          return `${evoArrow(arrowCond, arrowItemImg)}<div class="evo-stage">${evoRegionalPortrait(match)}</div>`;
        }).join('');
        const startRow = rOffset;
        rOffset += rCount;
        return `<div class="evo-stage evo-stage--root-stretch" style="grid-row:${startRow}/span ${rCount};grid-column:1">${evoRegionalPortrait(r)}</div>${rCells}`;
      }).join('');

      return `<div class="evo-dual-root-grid"><div class="evo-stage evo-stage--root-stretch" style="grid-row:1/span ${normalCount};grid-column:1">${rootPortrait}</div>${normalCells}${regionalSections}</div>`;
    }

    const regionalsHtml = regionals.length ? `<div class="evo-regionals${regionals.length > 1 ? ' evo-regionals--stacked' : ''}">${regionals.map(evoRegionalPortrait).join('')}</div>` : '';
    const branches = node.children.map(c => {
      const condition = c.node.evolution_condition || '';
      return `<div class="evo-branch-item">${evoArrow(condition, c.node.evolution_item_image_url || null)}${renderNode(c, depth + 1)}</div>`;
    }).join('');
    if (gigamaxesBranch.length > 0) {
      const gigaBranches = gigamaxesBranch.map(g =>
        `<div class="evo-branch-item">${evoArrow(g.condition_label || g.name, g.item_image_url || null, true, true)}${evoGigamaxPortrait(g)}</div>`
      ).join('');
      const pikaBranches = `<div class="evo-branches-pikachu">${gigaBranches}${branches}</div>`;
      if (regionals.length > 0) {
        const childrenWithRegionals = new Set(
          node.children.filter(c => (regionalsByNumber[c.node.number] || []).length > 0).map(c => c.node.number)
        );
        const claimedByExplicit = new Set(regionals.filter(r => r.evolution_into_number).map(r => r.evolution_into_number));
        const extraChildren = node.children.filter(c => !childrenWithRegionals.has(c.node.number) && !claimedByExplicit.has(c.node.number));
        let extraIdx = 0;
        const matches = regionals.map(r => {
          if (r.evolution_into_number) {
            const child = node.children.find(c => c.node.number === r.evolution_into_number);
            return { r, type: 'explicit', target: child || null };
          }
          const matchReg = node.children.flatMap(c => regionalsByNumber[c.node.number] || []).find(nr => nr.region === r.region);
          if (matchReg) return { r, type: 'regional', target: matchReg };
          const hChild = extraChildren[extraIdx] || null;
          if (hChild) extraIdx++;
          return { r, type: 'heuristic', target: hChild };
        });
        const claimedNums = new Set(matches.filter(m => (m.type === 'explicit' || m.type === 'heuristic') && m.target).map(m => m.target.node.number));
        const mainChildren = node.children.filter(c => !claimedNums.has(c.node.number));
        const numBranchRows = gigamaxesBranch.length + mainChildren.length;
        const rootStage = `<div class="evo-stage evo-stage--root-stretch" style="grid-row:1/span ${numBranchRows};grid-column:1">${portrait}</div>`;
        const gigaItems = gigamaxesBranch.map(g =>
          `<div></div>${evoArrow(g.condition_label || g.name, g.item_image_url || null, true, true)}${evoGigamaxPortrait(g)}`
        ).join('');
        const childItems = mainChildren.map(c =>
          `<div></div>${evoArrow(c.node.evolution_condition || '', c.node.evolution_item_image_url || null)}${renderNode(c, depth + 1, true)}`
        ).join('');
        const regionalItems = matches.map(({ r, type, target }) => {
          const arrowCond    = r.evolution_condition || '';
          const arrowItemImg = r.evolution_item_image_url || null;
          if (type === 'regional' && target) {
            const cond    = arrowCond || target.evolution_condition || '';
            const itemImg = arrowItemImg || target.evolution_item_image_url || null;
            return `<div class="evo-stage">${evoRegionalPortrait(r)}</div><div></div>${evoArrow(cond, itemImg)}<div class="evo-stage">${evoRegionalPortrait(target)}</div>`;
          }
          if ((type === 'explicit' || type === 'heuristic') && target) {
            const cond    = arrowCond || target.node.evolution_condition || '';
            const iconU   = iconByNumber[target.node.number] || null;
            return `<div class="evo-stage">${evoRegionalPortrait(r)}</div><div></div>${evoArrow(cond, arrowItemImg)}<div class="evo-stage">${evoPortrait(target.node, target.node.number === currentNumber, iconU)}</div>`;
          }
          return `<div class="evo-stage">${evoRegionalPortrait(r)}</div><div></div><div></div><div class="evo-stage"></div>`;
        }).join('');
        return `<div class="evo-chain-pikachu-regional">${rootStage}${gigaItems}${childItems}${regionalItems}</div>`;
      }
      const rootPortrait = evoPortrait(node.node, isCurrent, iconUrl, 'evo-portrait--root');
      return `<div class="evo-stage evo-stage--root-stretch">${rootPortrait}</div>${pikaBranches}`;
    }

    return `<div class="evo-stage">${portrait}${regionalsHtml}</div><div class="evo-branches">${branches}</div>`;
  }

  return `<div class="evolution-section">
    <h4>Chaîne d'évolution</h4>
    <div class="evo-chain">${renderNode(tree, 0)}</div>
  </div>`;
}
