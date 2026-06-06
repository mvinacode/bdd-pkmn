import { esc } from '../utils.js';
import { normalizeVariantUrl, getImageUrl, padNumber, toRoman, typeBadge } from '../domain/constants.js';
import { MEGA_ICON_URL, GIGAMAX_ICON_URL } from '../domain/constants.js';

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

export function evoArrow(condition = '', itemImageUrl = null, bidirectional = false, isGigamax = false) {
  let conditionHtml = '';
  if (itemImageUrl) {
    const isStone      = !bidirectional && !isGigamax;
    const isStoneIce   = isStone && /glace/i.test(condition);
    const isStoneMoon  = isStone && /lune/i.test(condition);
    const isStoneFire  = isStone && /feu/i.test(condition);
    const isStoneLeaf  = isStone && /plante/i.test(condition);
    const isStoneSun   = isStone && /soleil/i.test(condition);
    const isStoneWater = isStone && /\beau\b/i.test(condition);
    const isKingsRock  = /roche\s+royale/i.test(condition);
    const isTradeEvo   = /échange/i.test(condition) && !isKingsRock;
    const textClass = (bidirectional || isGigamax) ? 'is-mega' : 'is-item';
    conditionHtml = `<div class="evo-condition-item${isGigamax ? ' is-gigamax' : ''}${isStone ? ' is-stone' : ''}${isStoneIce ? ' is-stone-ice' : ''}${isStoneMoon ? ' is-stone-moon' : ''}${isStoneFire ? ' is-stone-fire' : ''}${isStoneLeaf ? ' is-stone-leaf' : ''}${isStoneSun ? ' is-stone-sun' : ''}${isStoneWater ? ' is-stone-water' : ''}${isKingsRock ? ' is-kings-rock' : ''}${isTradeEvo ? ' is-trade' : ''}">
      <img src="${esc(itemImageUrl)}" alt="${esc(condition)}" class="evo-item-img">
      <span class="evo-condition ${textClass}">${esc(condition)}</span>
    </div>`;
  } else if (condition) {
    const isNight     = condition.toLowerCase().includes('nuit');
    const isHappiness = condition.toLowerCase().includes('bonheur');
    const isRageMove  = /poing de col[eè]re/i.test(condition);
    const isItem      = condition && !condition.startsWith('Niv.') && !isNight && !isHappiness && !isRageMove;
    const isStone      = isItem && /pierre\s/i.test(condition);
    const isStoneIce   = isStone && /glace/i.test(condition);
    const isStoneMoon  = isStone && /lune/i.test(condition);
    const isStoneFire  = isStone && /feu/i.test(condition);
    const isStoneLeaf  = isStone && /plante/i.test(condition);
    const isStoneSun   = isStone && /soleil/i.test(condition);
    const isStoneWater = isStone && /\beau\b/i.test(condition);
    const isKingsRock  = /roche\s+royale/i.test(condition);
    const isTradeEvo   = /échange/i.test(condition) && !isKingsRock;
    const conditionInner = isRageMove
      ? esc(condition).replace(/Poing de Col[eè]re/i, '<span class="move-name">$&</span>')
      : esc(condition);
    conditionHtml = `<span class="evo-condition${isItem ? ' is-item' : ''}${isStone ? ' is-stone' : ''}${isStoneIce ? ' is-stone-ice' : ''}${isStoneMoon ? ' is-stone-moon' : ''}${isStoneFire ? ' is-stone-fire' : ''}${isStoneLeaf ? ' is-stone-leaf' : ''}${isStoneSun ? ' is-stone-sun' : ''}${isStoneWater ? ' is-stone-water' : ''}${isKingsRock ? ' is-kings-rock' : ''}${isTradeEvo ? ' is-trade' : ''}${isNight ? ' is-night' : ''}${isHappiness ? ' is-happiness' : ''}${isRageMove ? ' is-rage-move' : ''}">${conditionInner}</span>`;
  }
  const arrowSvg = bidirectional
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8l4 4-4 4M7 8l-4 4 4 4M3 12h18"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  return `<div class="evo-arrow" aria-hidden="true">${conditionHtml}${arrowSvg}</div>`;
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
      const regionalsHtml = regionals.length ? `<div class="evo-regionals">${regionals.map(evoRegionalPortrait).join('')}</div>` : '';
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
      if (regionals.length > 0) {
        const nextNode      = node.children[0];
        const nextRegionals = regionalsByNumber[nextNode.node.number] || [];
        const isMultiLevel  = nextNode.children.length === 1;
        const subchainHtml  = isMultiLevel
          ? `<div class="evo-regional-subchain">${renderNode(nextNode, depth + 1, true)}</div>`
          : renderNode(nextNode, depth + 1, true);
        const regionalRows  = regionals.map(r => {
          const matchingNext = nextRegionals.find(nr => nr.region === r.region);
          const arrowCond    = r.evolution_condition || matchingNext?.evolution_condition || condition;
          const arrowItemImg = r.evolution_item_image_url || matchingNext?.evolution_item_image_url || null;
          let thirdCell;
          if (!matchingNext) {
            thirdCell = '<div class="evo-stage"></div>';
          } else if (isMultiLevel) {
            const nextNextNode      = nextNode.children[0];
            const nextNextRegionals = regionalsByNumber[nextNextNode.node.number] || [];
            const matchingNextNext  = nextNextRegionals.find(nr => nr.region === r.region);
            const arrowCond2    = matchingNext.evolution_condition || matchingNextNext?.evolution_condition || nextNextNode.node.evolution_condition || '';
            const arrowItemImg2 = matchingNext.evolution_item_image_url || matchingNextNext?.evolution_item_image_url || nextNextNode.node.evolution_item_image_url || null;
            thirdCell = `<div class="evo-regional-subchain"><div class="evo-stage">${evoRegionalPortrait(matchingNext)}</div>${evoArrow(arrowCond2, arrowItemImg2)}<div class="evo-stage">${matchingNextNext ? evoRegionalPortrait(matchingNextNext) : ''}</div></div>`;
          } else {
            thirdCell = `<div class="evo-stage">${evoRegionalPortrait(matchingNext)}</div>`;
          }
          return `<div class="evo-stage">${evoRegionalPortrait(r)}</div>${evoArrow(arrowCond, arrowItemImg)}${thirdCell}`;
        }).join('');
        return `<div class="evo-chain-regional-grid"><div class="evo-stage">${portrait}</div>${evoArrow(condition, nextNode.node.evolution_item_image_url || null)}${subchainHtml}${regionalRows}</div>`;
      }
      return `<div class="evo-stage">${portrait}</div>${evoArrow(condition, node.children[0].node.evolution_item_image_url || null)}${renderNode(node.children[0], depth + 1, excludeRegionals)}`;
    }

    const regionalsHtml = regionals.length ? `<div class="evo-regionals">${regionals.map(evoRegionalPortrait).join('')}</div>` : '';
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
