// Onglets de la fiche : illustrations (Base, Méga-Évolution, races de Tauros…)
// et formes. Un clic active l'onglet et son panneau, et désactive les autres.

function wireTabs(root, { buttons, panels, buttonKey, panelKey, onChange }) {
  root.querySelectorAll(buttons).forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset[buttonKey];
      root.querySelectorAll(buttons).forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      root.querySelectorAll(panels).forEach(panel =>
        panel.classList.toggle('active', panel.dataset[panelKey] === tab)
      );
      onChange?.(tab);
    });
  });
}

/** Onglets d'illustrations. `onChange(tab)` est appelé après chaque bascule. */
export function wireIllustrationTabs(root, onChange) {
  wireTabs(root, {
    buttons: '.illus-tabs:not(.forms-tabs-nav) .illus-tab-btn', buttonKey: 'tab',
    panels: '.illus-tab-panel', panelKey: 'panel', onChange,
  });
}

/** Onglets de la section Formes. */
export function wireFormsTabs(root) {
  wireTabs(root, {
    buttons: '.forms-tabs-nav .illus-tab-btn', buttonKey: 'formsTab',
    panels: '.forms-tab-panel', panelKey: 'formsPanel',
  });
}

/** Ouvre l'onglet d'illustrations demandé (ex. après une capture de méga), s'il existe. */
export function openIllustrationTab(root, tab) {
  root.querySelector(`.illus-tab-btn[data-tab="${CSS.escape(tab)}"]`)?.click();
}
