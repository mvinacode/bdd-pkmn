// État mutable partagé de l'application — source de vérité unique
export const store = {
  // Session (remplis par auth.js)
  ownerUuid: null,
  prefs:     { genderFormsMode: 'none', strictComplete: false, requireAllFormsForComplete: false },

  // Collection
  catchByNumber:    {},
  shinyCatchByNumber: {},
  seenSet:          new Set(),
  seenMap:          {},

  // Caches sprites/formes
  iconCache:        {},
  variantMap:       {},
  specialFormsMap:  {},
  regionalBaronMap: {},
  regionalFormsMap: {},

  // Modal
  currentModalPokemonNumber: null,
  pendingIllusTab:           null,

  // Drawer
  drawerPokemon:   null,
  drawerBall:      null,
  drawerGame:      null,
  drawerShiny:     false,
  drawerMode:      'caught',
  drawerForm:      null,
  drawerForms:     [],
  drawerInitDone:  false,
  drawerSearchTmt: null,

  // Filtres / pagination
  search:       '',
  gen:          'all',
  type:         'all',
  sortBy:       'number',
  statusFilter: 'all',
  from:         0,
  total:        0,
  loading:      false,
  allLoaded:    false,
  pokemon:      [],
};
