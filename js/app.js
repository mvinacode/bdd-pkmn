/**
 * APP.JS — Logique principale PokéDex.
 */

// ── Constantes ───────────────────────────────────────────────

const TYPE_FR = {
  normal:'Normal', fire:'Feu', water:'Eau', electric:'Électrik',
  grass:'Plante', ice:'Glace', fighting:'Combat', poison:'Poison',
  ground:'Sol', flying:'Vol', psychic:'Psy', bug:'Insecte',
  rock:'Roche', ghost:'Spectre', dragon:'Dragon', dark:'Ténèbres',
  steel:'Acier', fairy:'Fée',
};

const TYPE_IMAGES = {
  normal:  'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779645471/normal_ersviy.png',
  grass:   'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779555831/plante_mfw11z.png',
  poison:  'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779555976/poison_efsrlh.png',
  fire:    'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779555975/feu_v9z2lm.png',
  water:   'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779574460/eau_fruvvb.png',
  flying:  'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779555974/vol_u7plhv.png',
  dragon:  'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779555977/dragon_nbjoqm.png',
  dark:     'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779662872/tenebres_c99vof.png',
  bug:      'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779580557/insecte_rccof2.png',
  electric: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779759222/electrick_zuuwdo.png',
  psychic:  'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779823368/psy_sxgmlp.png',
  ice:      'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779833043/glace_rzyq3f.png',
  steel:    'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779833041/acier_zwph2k.png',
  ground:   'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779835148/sol_kqatjb.png',
  fairy:    'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779893032/fee_dfkdmp.png',
};

const CAPTURED_KEY         = 'pokedex_captured'; // legacy, conservé pour compatibilité

function formatCatchDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCatchDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
}
const MEGA_ICON_URL        = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779128811/mega_evolution_t9nlsa.svg';
const GIGAMAX_ICON_URL     = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779128704/gigantamax_yescyy.png';
const SHINY_ICON_URL       = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779139479/shiny_abqivl.png';
const BARON_ICON_URL       = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779139486/baron_jvi4lm.png';
const MALE_SVG             = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
const FEMALE_SVG           = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;

// ── État ─────────────────────────────────────────────────────

const state = {
  search: '', gen: 'all', type: 'all', sortBy: 'number',
  capturedOnly: false, statusFilter: 'all',
  from: 0, total: 0, loading: false, allLoaded: false, pokemon: [],
};

let catchByNumber = {};
let shinyCatchByNumber = {};
let seenSet  = new Set();
let seenMap  = {};     // { [pokemon_number]: { [variant_type]: { is_shiny, sprite_url, form_label, variant_type, caught_at, game } } }
let iconCache = {};    // { [pokemon_number]: { normal, shiny } }
let variantMap = {};       // { [pokemon_number]: { [variant_type]: image_url } } — source de vérité pour sprites
let specialFormsMap = {}; // { [pokemon_number]: { [form_key]: { form_key, form_label_fr, image_url, image_url_shiny, artwork_url, artwork_url_shiny } } }

let currentModalPokemonNumber = null;
let pendingIllusTab = null;

async function addToSeen(number, data) {
  // Mise à jour optimiste du cache (UI instantanée)
  if (!seenMap[number]) seenMap[number] = {};
  seenMap[number][data.variant_type] = { ...data };
  seenSet.add(number);
  // Persister en Supabase
  const { data: saved, error } = await upsertSeen({
    owner_uuid:     getOwnerUuid(),
    pokemon_number: number,
    variant_type:   data.variant_type,
    status:         data.status || 'seen',
    form_label:     data.form_label  || null,
    is_shiny:       data.is_shiny    || false,
    sprite_url:     data.sprite_url  || null,
    caught_at:      data.caught_at   || null,
    game:           data.game        || null,
  });
  if (error) console.error('[addToSeen]', error);
  if (saved) seenMap[number][data.variant_type] = saved; // récupère l'id DB
}

async function removeFormFromSeen(number, variantType) {
  const row = seenMap[number]?.[variantType];
  if (!row) return;
  // Mise à jour optimiste
  delete seenMap[number][variantType];
  if (!Object.keys(seenMap[number]).length) { delete seenMap[number]; seenSet.delete(number); }
  // Persister en Supabase
  const { error } = row.id
    ? await deleteSeenForm(row.id)
    : await deleteAllSeenForPokemon(getOwnerUuid(), number);
  if (error) console.error('[removeFormFromSeen]', error);
}

async function removeFromSeen(number) {
  delete seenMap[number];
  seenSet.delete(number);
  const { error } = await deleteAllSeenForPokemon(getOwnerUuid(), number);
  if (error) console.error('[removeFromSeen]', error);
}

// ── DOM ──────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

const els = {
  grid:         $('pokemon-grid'),
  loader:       $('loader'),
  emptyState:   $('empty-state'),
  setupState:   $('setup-state'),
  search:       $('search'),
  genFilters:   $('gen-filters'),
  typeFilters:  $('type-filters'),
  sort:         $('sort'),
  resetBtn:     $('reset-filters'),
  headerCount:  $('header-count'),
  capturedCount:$('captured-count'),
  capturedBtn:  $('captured-filter-btn'),
  modalOverlay: $('modal-overlay'),
  modal:        $('modal'),
  modalContent: $('modal-content'),
  modalClose:   $('modal-close'),
};


function updateCapturedCounter() {
  const count = Object.keys(catchByNumber).length;
  if (els.capturedCount) els.capturedCount.textContent = count;
}

async function loadCatchesMap() {
  const uuid = getOwnerUuid();
  const [catchRes, seenRes] = await Promise.all([
    fetchCatches(uuid).catch(() => ({ data: [] })),
    fetchSeen(uuid).catch(() => ({ data: [] })),
  ]);
  catchByNumber = {};
  shinyCatchByNumber = {};
  for (const c of (catchRes.data || [])) {
    if (!catchByNumber[c.pokemon_number]) catchByNumber[c.pokemon_number] = c;
    if (c.is_shiny) {
      const prev = shinyCatchByNumber[c.pokemon_number];
      if (!prev || new Date(c.created_at) > new Date(prev.created_at)) {
        shinyCatchByNumber[c.pokemon_number] = c;
      }
    }
  }
  seenMap = {};
  for (const s of (seenRes.data || [])) {
    if (!seenMap[s.pokemon_number]) seenMap[s.pokemon_number] = {};
    seenMap[s.pokemon_number][s.variant_type] = s;
  }
  seenSet = new Set(Object.keys(seenMap).map(Number));
  updateCapturedCounter();

  // Charger variantMap + specialFormsMap en arrière-plan pour ne pas bloquer l'affichage
  const allNums = [...new Set([
    ...Object.keys(catchByNumber).map(Number),
    ...Object.keys(seenMap).map(Number),
  ])];
  if (allNums.length) {
    Promise.all([
      fetchVariantMap(allNums),
      fetchSpecialFormsForNumbers(allNums),
    ]).then(([vMap, sfMap]) => {
      variantMap = vMap;
      specialFormsMap = sfMap;
      allNums
        .filter(n =>
          ALOLA_FORM_VT[catchByNumber[n]?.form_label] ||
          ALOLA_FORM_VT[shinyCatchByNumber[n]?.form_label] ||
          SPECIAL_FORM_VT[catchByNumber[n]?.form_label] ||
          SPECIAL_FORM_VT[shinyCatchByNumber[n]?.form_label]
        )
        .forEach(n => updateCardAfterCatch(n));
    }).catch(() => {});
  }
}

function updateCardAfterCatch(pokemonNumber) {
  const oldCard = els.grid.querySelector(`[data-number="${pokemonNumber}"]`);
  if (!oldCard) return;
  const pokemon = state.pokemon.find(p => p.number === pokemonNumber);
  if (!pokemon) return;
  oldCard.replaceWith(renderCard(pokemon, iconCache[pokemonNumber] || {}));
}

// ── Statuts variantes (dérivés du cache seenMap) ─────────────

function getVariantStatus(pokemonNumber, variantType) {
  const direct = seenMap[pokemonNumber]?.[variantType]?.status;
  if (direct) return direct;
  const seen = seenMap[pokemonNumber];
  if (!seen) return '';
  // Équivalences bidirectionnelles pour les Pokémon sans dimorphisme visuel
  if (variantType === 'normal')
    return seen['male']?.status || seen['female']?.status || '';
  if (variantType === 'male' || variantType === 'female')
    return seen['normal']?.status || '';
  if (variantType === 'shiny')
    return seen['shiny_male']?.status || seen['shiny_female']?.status || '';
  if (variantType === 'shiny_male' || variantType === 'shiny_female')
    return seen['shiny']?.status || '';
  if (variantType === 'alolan')
    return seen['alolan_male']?.status || seen['alolan_female']?.status || '';
  if (variantType === 'alolan_male' || variantType === 'alolan_female')
    return seen['alolan']?.status || '';
  if (variantType === 'alolan_shiny')
    return seen['alolan_shiny_male']?.status || seen['alolan_shiny_female']?.status || '';
  if (variantType === 'alolan_shiny_male' || variantType === 'alolan_shiny_female')
    return seen['alolan_shiny']?.status || '';
  return '';
}

async function cycleVariantStatus(pokemonNumber, variantType) {
  const current = getVariantStatus(pokemonNumber, variantType);
  const next    = { '': 'seen', 'seen': 'owned', 'owned': '' }[current];
  if (next === '') {
    await removeFormFromSeen(pokemonNumber, variantType);
  } else {
    const existing = seenMap[pokemonNumber]?.[variantType];
    await addToSeen(pokemonNumber, {
      variant_type: variantType,
      status:       next,
      form_label:   existing?.form_label || variantType,
      is_shiny:     variantType.includes('shiny'),
      sprite_url:   existing?.sprite_url || null,
      caught_at:    existing?.caught_at  || new Date().toISOString().slice(0, 10),
      game:         existing?.game       || null,
    });
  }
  return next || '';
}

const VARIANT_STATUS_META = {
  '':      { label: 'Non vu',  cls: '' },
  'seen':  { label: 'Vu',      cls: 'status-seen' },
  'owned': { label: 'Obtenu',  cls: 'status-owned' },
};

// ── Utilitaires ──────────────────────────────────────────────

function padNumber(n) { return String(n).padStart(4, '0'); }

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function typeBadge(typeName) {
  if (TYPE_IMAGES[typeName]) {
    return `<img class="type-badge type-badge-img" src="${esc(TYPE_IMAGES[typeName])}" alt="${esc(TYPE_FR[typeName] || typeName)}">`;
  }
  const label = TYPE_FR[typeName] || typeName;
  return `<span class="type-badge ${esc(typeName)}">${esc(label)}</span>`;
}

function normalizeVariantUrl(url) {
  return url.replace('/upload/', '/upload/e_trim:10/c_pad,w_128,h_128,b_rgb:ffffff00/');
}

// form_label (dans catches) → variant_type pour les formes spéciales (pokemon_special_forms)
const SPECIAL_FORM_VT = {
  'Pichu Troizépi Shiny': 'troizepy_shiny',
  'Pichu Troizépi':       'troizepy',
};

const ALOLA_FORM_VT = {
  'Alola Mâle Shiny':    'alolan_shiny_male',
  'Alola Femelle Shiny': 'alolan_shiny_female',
  'Alola Shiny':         'alolan_shiny',
  'Alola Unisexe Shiny': 'alolan_shiny',
  'Alola Mâle':          'alolan_male',
  'Alola Femelle':       'alolan_female',
  'Alola':               'alolan',
  'Alola Unisexe':       'alolan',
};

function getSpecialFormSprite(pokemonNumber, variantType) {
  const isShiny = variantType.endsWith('_shiny');
  const formKey = isShiny ? variantType.slice(0, -6) : variantType;
  const form = specialFormsMap[pokemonNumber]?.[formKey];
  if (!form) return null;
  return isShiny ? (form.image_url_shiny || form.image_url) : form.image_url;
}

function getAlolanSprite(pokemonNumber, variantType) {
  const variants = variantMap[pokemonNumber] || {};
  const chains = {
    'alolan_shiny_male':   ['alolan_shiny_male',   'alolan_shiny', 'alolan'],
    'alolan_shiny_female': ['alolan_shiny_female',  'alolan_shiny', 'alolan'],
    'alolan_shiny':        ['alolan_shiny',          'alolan'],
    'alolan_male':         ['alolan_male',            'alolan'],
    'alolan_female':       ['alolan_female',          'alolan'],
    'alolan':              ['alolan'],
  };
  for (const fvt of (chains[variantType] || [variantType])) {
    if (variants[fvt]) return variants[fvt];
  }
  return null;
}

function getImageUrl(number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${number}.png`;
}

function toRoman(n) {
  return {1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX'}[n] || String(n);
}

// ── Carte Pokémon ─────────────────────────────────────────────

function renderCard(pokemon, icons = {}) {
  const primaryType = pokemon.types?.[0] || '';
  const catch_  = catchByNumber[pokemon.number] || null;
  const isSeen  = seenSet.has(pokemon.number);
  const types   = (pokemon.types || []).map(typeBadge).join('');
  const cardState = catch_ ? 'caught' : isSeen ? 'seen' : 'unseen';

  const seenForms  = !catch_ && seenMap[pokemon.number] ? Object.values(seenMap[pokemon.number]) : [];
  const seenIsShiny = seenForms.length > 0 && seenForms.every(f => f.is_shiny);
  // Source de vérité : capture shiny la plus récente (par date) — évite l'ordre aléatoire de Object.values(seenMap)
  const recentShinyCatch = shinyCatchByNumber[pokemon.number] || null;
  const isShinyDisplay = recentShinyCatch ? true : (catch_ ? catch_.is_shiny : seenIsShiny);

  let imgSrc;
  if (isShinyDisplay) {
    const alolaVt   = ALOLA_FORM_VT[recentShinyCatch?.form_label];
    const specialVt = SPECIAL_FORM_VT[recentShinyCatch?.form_label];
    if (alolaVt) {
      const alolaUrl = getAlolanSprite(pokemon.number, alolaVt);
      imgSrc = alolaUrl ? normalizeVariantUrl(alolaUrl) : spriteUrl(pokemon.number, true);
    } else if (specialVt) {
      imgSrc = getSpecialFormSprite(pokemon.number, specialVt) || spriteUrl(pokemon.number, true);
    } else {
      imgSrc = icons.shiny ? normalizeVariantUrl(icons.shiny) : (recentShinyCatch?.sprite_url || catch_?.sprite_url || seenForms[0]?.sprite_url || spriteUrl(pokemon.number, true));
    }
  } else {
    const alolaVt   = ALOLA_FORM_VT[catch_?.form_label];
    const specialVt = SPECIAL_FORM_VT[catch_?.form_label];
    if (alolaVt) {
      const alolaUrl = getAlolanSprite(pokemon.number, alolaVt);
      imgSrc = alolaUrl ? normalizeVariantUrl(alolaUrl) : (icons.normal ? normalizeVariantUrl(icons.normal) : (catch_?.sprite_url || spriteUrl(pokemon.number, false)));
    } else if (specialVt) {
      imgSrc = getSpecialFormSprite(pokemon.number, specialVt) || catch_?.sprite_url || spriteUrl(pokemon.number, false);
    } else {
      imgSrc = icons.normal ? normalizeVariantUrl(icons.normal) : (catch_?.sprite_url || spriteUrl(pokemon.number, false));
    }
  }

  const seenFormsMap = seenMap[pokemon.number] || {};
  const SPECIAL_FORMS = [
    { key: 'shiny',   icon: SHINY_ICON_URL,   variants: ['shiny','shiny_male','shiny_female','alolan_shiny','alolan_shiny_male','alolan_shiny_female'] },
    { key: 'baron',   icon: BARON_ICON_URL,   variants: ['baron', 'shiny_baron'] },
    { key: 'mega',    icon: MEGA_ICON_URL,    variants: ['mega','mega_x','mega_y','shiny_mega','shiny_mega_x','shiny_mega_y'] },
    { key: 'gigamax', icon: GIGAMAX_ICON_URL, variants: ['gigamax','shiny_gigamax'] },
  ];
  const formStatuses = SPECIAL_FORMS.map(({ key, icon, variants }) => {
    const statuses = variants.map(vt => seenFormsMap[vt]?.status).filter(Boolean);
    let status = statuses.includes('owned') ? 'owned' : statuses.includes('seen') ? 'seen' : null;
    if (key === 'shiny' && catch_?.is_shiny) status = 'owned';
    return { key, icon, status };
  });
  const formIconsHtml = formStatuses
    .filter(({ status }) => !!status)
    .map(({ key, icon, status }) => `<img src="${esc(icon)}" alt="${key}" class="poke-form-icon poke-form-icon--${status}" width="18" height="18">`)
    .join('');
  const baronStatus = formStatuses.find(f => f.key === 'baron')?.status;
  const shinyStatus = formStatuses.find(f => f.key === 'shiny')?.status;
  const strictOk    = !window._strictComplete || (!!catch_ && shinyStatus === 'owned');
  const nonBaronForms = formStatuses.filter(f => f.key !== 'baron');

  // Détermine quelles formes existent en jeu pour ce Pokémon
  const pokemonVMap = variantMap[pokemon.number];
  const hasMegaInGame = !pokemonVMap
    ? true
    : ['mega','mega_x','mega_y'].some(vt => vt in pokemonVMap) || !!(specialFormsMap[pokemon.number] && Object.keys(specialFormsMap[pokemon.number]).length);

  const genderMode = window._genderFormsMode || 'none';
  const GENDER_GROUPS = [
    ['male', 'female'],
    ['shiny_male', 'shiny_female'],
    ['alolan_male', 'alolan_female'],
    ['alolan_shiny_male', 'alolan_shiny_female'],
  ];
  const GENDER_VTS_FLAT = new Set(GENDER_GROUPS.flat());

  // En mode 'any', les formes genrées en 'Vu' ne bloquent pas l'animation
  const allSeenOwned = Object.entries(seenFormsMap).every(([vt, f]) =>
    (genderMode === 'any' && GENDER_VTS_FLAT.has(vt)) ? true : f.status === 'owned'
  );

  // Variantes obtenues via le système de catch (absentes de seenFormsMap)
  const catchCoveredVts = new Set([
    ALOLA_FORM_VT[catch_?.form_label],
    ALOLA_FORM_VT[recentShinyCatch?.form_label],
    SPECIAL_FORM_VT[catch_?.form_label],
    SPECIAL_FORM_VT[recentShinyCatch?.form_label],
    ...(catch_?.is_shiny || recentShinyCatch ? ['shiny'] : []),
  ].filter(Boolean));

  // Seules les formes "collectables" sont vérifiées dans variantMap.
  // En mode 'any', les formes genrées alolan sont gérées par genderGroupsOk.
  const TRACKED_VT = new Set([
    'shiny',
    'alolan','alolan_shiny',
    ...(genderMode !== 'any' ? ['alolan_male','alolan_female','alolan_shiny_male','alolan_shiny_female'] : []),
    'mega','mega_x','mega_y','shiny_mega','shiny_mega_x','shiny_mega_y',
    'gigamax','shiny_gigamax',
    'troizepy','troizepy_shiny',
    ...(genderMode === 'all' ? [...GENDER_VTS_FLAT].filter(vt => !vt.startsWith('alolan')) : []),
  ]);
  const isVtOk = (vt) => {
    if (seenFormsMap[vt]?.status === 'owned' || catchCoveredVts.has(vt)) return true;
    // Équivalences bidirectionnelles (miroir de getVariantStatus)
    if (vt === 'shiny')
      return seenFormsMap['shiny_male']?.status === 'owned' || catchCoveredVts.has('shiny_male')
          || seenFormsMap['shiny_female']?.status === 'owned' || catchCoveredVts.has('shiny_female');
    if (vt === 'alolan')
      return seenFormsMap['alolan_male']?.status === 'owned' || catchCoveredVts.has('alolan_male')
          || seenFormsMap['alolan_female']?.status === 'owned' || catchCoveredVts.has('alolan_female');
    if (vt === 'alolan_shiny')
      return seenFormsMap['alolan_shiny_male']?.status === 'owned' || catchCoveredVts.has('alolan_shiny_male')
          || seenFormsMap['alolan_shiny_female']?.status === 'owned' || catchCoveredVts.has('alolan_shiny_female');
    return false;
  };
  const allVariantsOwned = !pokemonVMap
    ? true
    : [...TRACKED_VT].filter(vt => vt in pokemonVMap).every(isVtOk);

  // En mode 'any' : pour chaque groupe de formes genrées présent en jeu,
  // au moins une forme du groupe doit être obtenue.
  const genderGroupsOk = genderMode !== 'any' || GENDER_GROUPS.every(group => {
    const existsInGame = group.some(vt => (pokemonVMap && vt in pokemonVMap) || vt in seenFormsMap);
    if (!existsInGame) return true;
    return group.some(vt => seenFormsMap[vt]?.status === 'owned');
  });

  const isComplete = strictOk
    && (pokemon.can_be_baron === false
      ? allSeenOwned && allVariantsOwned && genderGroupsOk
      : baronStatus === 'owned')
    && formStatuses.every(f => !f.status || f.status === 'owned');

  const hasAnyGenderOwned = [...GENDER_VTS_FLAT].some(vt => seenFormsMap[vt]?.status === 'owned');
  const hasAnyForm = nonBaronForms.some(f => !!f.status)
    || (genderMode !== 'none' && hasAnyGenderOwned);

  const isAllForms = !isComplete
    && allSeenOwned
    && allVariantsOwned
    && genderGroupsOk
    && hasAnyForm
    && nonBaronForms.every(f => !f.status || f.status === 'owned')
    && (!hasMegaInGame || formStatuses.find(f => f.key === 'mega')?.status === 'owned');

  const card = document.createElement('article');
  card.className = 'poke-card poke-card--' + cardState + (isComplete ? ' poke-card--complete' : '') + (isAllForms ? ' poke-card--all-forms' : '');
  card.role = 'listitem';
  card.tabIndex = 0;
  card.dataset.number = pokemon.number;
  if (primaryType) card.dataset.primaryType = primaryType;
  if (pokemon.can_be_baron === false) card.dataset.canBeBaron = 'false';

  const catchBadgeHtml = catch_ ? (() => {
    const displayCatch = (isShinyDisplay && shinyCatchByNumber[pokemon.number]) ? shinyCatchByNumber[pokemon.number] : catch_;
    const ballEntry = BALLS.find(b => b.name === displayCatch.ball_name);
    const ballSrc   = ballEntry ? ballUrl(ballEntry.slug) : (displayCatch.ball_image_url || '');
    return `
    <div class="poke-catch-badge">
      <img class="poke-catch-ball-img" src="${esc(ballSrc)}" alt="${esc(displayCatch.ball_name)}" title="${esc(displayCatch.ball_name)}" width="22" height="22" loading="lazy">
      <span class="poke-catch-date-label">${esc(formatCatchDateShort(displayCatch.caught_at))}</span>
    </div>`;
  })() : '';

  const allFormsSparkles = (isAllForms && window._allFormsAnim === 'rainbow' && pokemon.can_be_baron === false) ? `
    <span class="sparkle" style="top:4px;left:10px;color:#ff5050;--sparkle-delay:0.3s;--sparkle-size:0.8rem;--sparkle-dur:2.2s">✦</span>
    <span class="sparkle" style="top:3px;right:10px;color:#ffcc00;--sparkle-delay:1s;--sparkle-size:0.6rem;--sparkle-dur:1.9s">✦</span>
    <span class="sparkle" style="top:40%;right:3px;color:#44dd66;--sparkle-delay:1.7s;--sparkle-size:0.7rem;--sparkle-dur:2.5s">✦</span>
    <span class="sparkle" style="bottom:22px;left:5px;color:#4488ff;--sparkle-delay:0.6s;--sparkle-size:0.65rem;--sparkle-dur:2.1s">✦</span>
    <span class="sparkle" style="bottom:8px;right:12px;color:#cc44ff;--sparkle-delay:1.4s;--sparkle-size:0.75rem;--sparkle-dur:2.4s">✦</span>
    <span class="sparkle" style="top:30%;left:4px;color:#ff8800;--sparkle-delay:2s;--sparkle-size:0.55rem;--sparkle-dur:2s">✦</span>
  ` : '';

  const completionSparkles = isComplete ? `
    <span class="sparkle" style="top:3px;left:14px;color:#ff5050;--sparkle-delay:0s;--sparkle-size:0.85rem;--sparkle-dur:2.1s">✦</span>
    <span class="sparkle" style="top:2px;right:12px;color:#ffcc00;--sparkle-delay:0.7s;--sparkle-size:0.65rem;--sparkle-dur:1.8s">✦</span>
    <span class="sparkle" style="top:38%;right:2px;color:#44dd66;--sparkle-delay:1.4s;--sparkle-size:0.75rem;--sparkle-dur:2.4s">✦</span>
    <span class="sparkle" style="bottom:20px;left:4px;color:#4488ff;--sparkle-delay:0.4s;--sparkle-size:0.7rem;--sparkle-dur:2s">✦</span>
    <span class="sparkle" style="bottom:6px;right:14px;color:#cc44ff;--sparkle-delay:1.1s;--sparkle-size:0.8rem;--sparkle-dur:2.3s">✦</span>
    <span class="sparkle" style="top:28%;left:6px;color:#ff8800;--sparkle-delay:1.8s;--sparkle-size:0.6rem;--sparkle-dur:1.9s">✦</span>
  ` : '';

  card.innerHTML = `
    ${completionSparkles}
    ${allFormsSparkles}
    ${catchBadgeHtml}
    <div class="poke-number">#${esc(padNumber(pokemon.number))}</div>
    <div class="poke-image-wrapper">
      <img class="poke-image loading" src="${esc(imgSrc)}" alt="${esc(pokemon.name_fr)}" loading="lazy" decoding="async" width="60" height="60">
    </div>
    <div class="poke-name">${esc(pokemon.name_fr)}</div>
    <div class="poke-types">${types}</div>
    ${formIconsHtml ? `<div class="poke-form-icons">${formIconsHtml}</div>` : ''}
  `;

  const img = card.querySelector('.poke-image');
  img.addEventListener('load',  () => img.classList.replace('loading', 'loaded'));
  img.addEventListener('error', () => img.classList.replace('loading', 'loaded'));

  if (catch_ || isSeen) {
    card.addEventListener('click',   () => openModal(pokemon.number));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(pokemon.number); });
  }

  return card;
}

// ── Grille ────────────────────────────────────────────────────

function renderGrid(pokemons, append = false, iconMap = {}) {
  if (!append) els.grid.innerHTML = '';
  if (pokemons.length === 0 && !append) {
    els.emptyState.hidden = false;
    return;
  }
  els.emptyState.hidden = true;
  const frag = document.createDocumentFragment();
  pokemons.forEach(p => frag.appendChild(renderCard(p, iconMap[p.number] || {})));
  els.grid.appendChild(frag);
}

// ── Chargement ────────────────────────────────────────────────

async function loadPokemon(append = false) {
  if (state.loading) return;
  state.loading = true;
  if (!append) { state.from = 0; state.allLoaded = false; }
  els.loader.hidden = false;

  try {
    let capturedNums = [];
    if (state.statusFilter === 'caught') capturedNums = Object.keys(catchByNumber).map(Number);
    else if (state.statusFilter === 'seen') capturedNums = [...seenSet].filter(n => !catchByNumber[n]);

    const { data, count, error } = await fetchPokemon({
      from:            state.from,
      to:              state.from + CONFIG.PAGE_SIZE - 1,
      search:          state.search,
      gen:             state.gen !== 'all' ? state.gen : null,
      type:            state.type !== 'all' ? state.type : null,
      sortBy:          state.sortBy,
      capturedOnly:    state.statusFilter !== 'all',
      capturedNumbers: capturedNums,
    });

    if (error?.message === 'Supabase non configuré') {
      els.setupState.hidden = false;
      els.loader.hidden = true;
      return;
    }
    if (error) {
      console.error('[App]', error.message);
      els.loader.hidden = true;
      return;
    }

    state.total     = count;
    state.from     += data.length;
    state.allLoaded = state.from >= count;
    if (append) state.pokemon.push(...data); else state.pokemon = data;

    const numbers = data.map(p => p.number);
    const cachedIconMap = Object.fromEntries(numbers.filter(n => iconCache[n]).map(n => [n, iconCache[n]]));
    renderGrid(data, append, cachedIconMap);
    els.headerCount.textContent = count;
    els.loader.hidden = state.allLoaded;

    // Si le loader est encore visible après le rendu, l'IntersectionObserver ne re-fire pas
    // (pas de changement d'état) → on re-vérifie manuellement
    if (!state.allLoaded) {
      requestAnimationFrame(() => {
        const rect = els.loader.getBoundingClientRect();
        if (rect.top < window.innerHeight + 200 && !state.loading) loadPokemon(true);
      });
    }

    // Icônes en arrière-plan → met à jour les cartes + sauvegarde le cache
    fetchCardIcons(numbers).then(iconRows => {
      const iconMap = {};
      for (const row of iconRows) {
        if (!iconMap[row.pokemon_number]) iconMap[row.pokemon_number] = {};
        const isShiny = row.variant_type === 'shiny' || row.variant_type === 'shiny_male' || row.variant_type === 'shiny_female';
        const ikey = isShiny ? 'shiny' : 'normal';
        if (!iconMap[row.pokemon_number][ikey]) iconMap[row.pokemon_number][ikey] = row.image_url;
      }
      const needsUpdate = numbers.filter(n => iconMap[n] && !cachedIconMap[n]);
      Object.assign(iconCache, iconMap);
      needsUpdate.forEach(n => updateCardAfterCatch(n));
    }).catch(() => {});

  } catch (err) {
    // Exception inattendue : on cache le loader et on loggue
    console.error('[loadPokemon]', err);
    els.loader.hidden = true;
  } finally {
    // Toujours remettre state.loading à false, quoi qu'il arrive
    state.loading = false;
  }
}

function resetAndReload() {
  state.from = 0; state.total = 0; state.allLoaded = false; state.pokemon = [];
  els.emptyState.hidden = true;
  els.setupState.hidden = true;
  loadPokemon(false);
}

// ── Évolution : rendu arbre ───────────────────────────────────

function evoPortrait(node, isCurrent, iconUrl = null, extraClass = '') {
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

function evoArrow(condition = '', itemImageUrl = null, bidirectional = false, isGigamax = false) {
  let conditionHtml = '';
  if (itemImageUrl) {
    const isStone     = !bidirectional && !isGigamax;
    const isStoneIce  = isStone && /glace/i.test(condition);
    const isStoneMoon = isStone && /lune/i.test(condition);
    const isStoneFire = isStone && /feu/i.test(condition);
    const textClass = (bidirectional || isGigamax) ? 'is-mega' : 'is-item';
    conditionHtml = `<div class="evo-condition-item${isGigamax ? ' is-gigamax' : ''}${isStone ? ' is-stone' : ''}${isStoneIce ? ' is-stone-ice' : ''}${isStoneMoon ? ' is-stone-moon' : ''}${isStoneFire ? ' is-stone-fire' : ''}">
      <img src="${esc(itemImageUrl)}" alt="${esc(condition)}" class="evo-item-img">
      <span class="evo-condition ${textClass}">${esc(condition)}</span>
    </div>`;
  } else if (condition) {
    const isNight     = condition.toLowerCase().includes('nuit');
    const isHappiness = condition.toLowerCase().includes('bonheur');
    const isItem      = condition && !condition.startsWith('Niv.') && !isNight && !isHappiness;
    const isStone     = isItem && /pierre\s/i.test(condition);
    const isStoneIce  = isStone && /glace/i.test(condition);
    const isStoneMoon = isStone && /lune/i.test(condition);
    const isStoneFire = isStone && /feu/i.test(condition);
    const conditionText = condition;
    conditionHtml = `<span class="evo-condition${isItem ? ' is-item' : ''}${isStone ? ' is-stone' : ''}${isStoneIce ? ' is-stone-ice' : ''}${isStoneMoon ? ' is-stone-moon' : ''}${isStoneFire ? ' is-stone-fire' : ''}${isNight ? ' is-night' : ''}${isHappiness ? ' is-happiness' : ''}">${esc(conditionText)}</span>`;
  }
  const arrowSvg = bidirectional
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8l4 4-4 4M7 8l-4 4 4 4M3 12h18"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  return `<div class="evo-arrow" aria-hidden="true">
    ${conditionHtml}
    ${arrowSvg}
  </div>`;
}

function evoGigamaxPortrait(gigamax) {
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

function evoMegaPortrait(mega) {
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

function evoRegionalPortrait(regional) {
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

function collectTreeNumbers(tree) {
  if (!tree) return [];
  return [tree.node.number, ...tree.children.flatMap(c => collectTreeNumbers(c))];
}

function buildEvolutionHtml(tree, currentNumber, megasByNumber = {}, iconByNumber = {}, gigamaxByNumber = {}, regionalsByNumber = {}) {
  if (!tree) return '';

  function renderNode(node, depth, excludeRegionals = false) {
    const isCurrent  = node.node.number === currentNumber;
    const iconUrl    = iconByNumber[node.node.number] || null;
    const portrait   = evoPortrait(node.node, isCurrent, iconUrl);
    const regionals  = excludeRegionals ? [] : (regionalsByNumber[node.node.number] || []);
    const megas         = node.children.length === 0 ? (megasByNumber[node.node.number] || []) : [];
    const gigamaxesLeaf = node.children.length === 0 ? (gigamaxByNumber[node.node.number] || []) : [];
    const gigamaxesBranch = node.children.length === 1 ? (gigamaxByNumber[node.node.number] || []) : [];
    const allBranches = [...megas, ...gigamaxesLeaf];

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
      const stageClass = allBranches.length > 1 ? 'evo-stage evo-stage-branching' : 'evo-stage';
      const regionalsHtml = regionals.length ? `<div class="evo-regionals">${regionals.map(evoRegionalPortrait).join('')}</div>` : '';
      return `<div class="${stageClass}">${portrait}${regionalsHtml}</div>${megaHtml}`;
    }

    if (node.children.length === 1) {
      const condition = node.children[0].node.evolution_condition || '';
      if (gigamaxesBranch.length > 0 && regionals.length === 0) {
        const nextNode      = node.children[0];
        const nextRegionals = regionalsByNumber[nextNode.node.number] || [];
        const nextMegas     = megasByNumber[nextNode.node.number] || [];
        const nextIconUrl   = iconByNumber[nextNode.node.number] || null;
        const nextPortrait  = evoPortrait(nextNode.node, nextNode.node.number === currentNumber, nextIconUrl);

        // Gigamax
        const gigaBranches = gigamaxesBranch.map(g =>
          `<div class="evo-branch-item">${evoArrow(g.condition_label || g.name, g.item_image_url || null, true, true)}${evoGigamaxPortrait(g)}</div>`
        ).join('');

        // Évolution principale + ses mégas en chaîne horizontale
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

        // Chaque forme régionale a sa propre pill de condition (ex : Pierre Foudre à Alola)
        const regionalBranches = nextRegionals.map(r => {
          const arrowCond = r.evolution_condition || condition;
          return `<div class="evo-branch-item">${evoArrow(arrowCond, r.evolution_item_image_url || null)}<div class="evo-stage">${evoRegionalPortrait(r)}</div></div>`;
        }).join('');

        const rootPortrait = evoPortrait(node.node, isCurrent, iconUrl, 'evo-portrait--root');
        return `<div class="evo-stage evo-stage--root-stretch">${rootPortrait}</div><div class="evo-branches-pikachu">${gigaBranches}${mainBranch}${regionalBranches}</div>`;
      }
      if (regionals.length > 0) {
        // Grille alignée : une ligne par forme (principale + régionales)
        const nextNode     = node.children[0];
        const nextRegionals = regionalsByNumber[nextNode.node.number] || [];
        const regionalRows  = regionals.map(r => {
          const matchingNext = nextRegionals.find(nr => nr.region === r.region);
          const arrowCond    = r.evolution_condition || matchingNext?.evolution_condition || condition;
          const arrowItemImg = r.evolution_item_image_url || matchingNext?.evolution_item_image_url || null;
          return `<div class="evo-stage">${evoRegionalPortrait(r)}</div>${evoArrow(arrowCond, arrowItemImg)}${matchingNext ? `<div class="evo-stage">${evoRegionalPortrait(matchingNext)}</div>` : '<div class="evo-stage"></div>'}`;
        }).join('');
        return `<div class="evo-chain-regional-grid"><div class="evo-stage">${portrait}</div>${evoArrow(condition, nextNode.node.evolution_item_image_url || null)}${renderNode(nextNode, depth + 1, true)}${regionalRows}</div>`;
      }
      return `<div class="evo-stage">${portrait}</div>${evoArrow(condition, node.children[0].node.evolution_item_image_url || null)}${renderNode(node.children[0], depth + 1)}`;
    }

    // Branches multiples (Évoli, etc.)
    const regionalsHtml = regionals.length ? `<div class="evo-regionals">${regionals.map(evoRegionalPortrait).join('')}</div>` : '';
    const branches = node.children.map(c => {
      const condition = c.node.evolution_condition || '';
      return `<div class="evo-branch-item">${evoArrow(condition, c.node.evolution_item_image_url || null)}${renderNode(c, depth + 1)}</div>`;
    }).join('');
    return `<div class="evo-stage">${portrait}${regionalsHtml}</div><div class="evo-branches">${branches}</div>`;
  }

  return `<div class="evolution-section">
    <h4>Chaîne d'évolution</h4>
    <div class="evo-chain">${renderNode(tree, 0)}</div>
  </div>`;
}

// ── Modal ─────────────────────────────────────────────────────

async function openModal(number) {
  currentModalPokemonNumber = number;
  els.modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  els.modalContent.innerHTML = '<div class="modal-loading"><div class="pokeball-loader"><div class="pb-top"></div><div class="pb-middle"><div class="pb-btn"></div></div><div class="pb-bottom"></div></div></div>';

  try {
  const [{ data: p }, evoTree, forms, variants, gigamax, specialFormsList] = await Promise.all([
    fetchPokemonByNumber(number),
    fetchEvolutionChain({ number, evolves_from_number: null }).catch(() => null),
    fetchForms(number),
    fetchVariants(number),
    fetchGigamax(number),
    fetchSpecialFormsByNumber(number).catch(() => []),
  ]);

  if (!p) { closeModal(); return; }

  // On refait fetchEvolutionChain avec les vraies données du Pokémon
  const realEvoTree   = await fetchEvolutionChain(p).catch(() => null);
  const treeNumbers   = collectTreeNumbers(realEvoTree);
  const [megaRows, iconRows, gigamaxChainRows, gigamaxIconRows, regionalRows] = await Promise.all([
    fetchMegaEvolutions(treeNumbers).catch(() => []),
    fetchVariantIcons(treeNumbers).catch(() => []),
    fetchGigamaxForChain(treeNumbers).catch(() => []),
    fetchGigamaxVariantIcons(treeNumbers).catch(() => []),
    fetchRegionalForms(treeNumbers).catch(() => []),
  ]);
  const megasByNumber = {};
  for (const m of megaRows) {
    if (!megasByNumber[m.pokemon_number]) megasByNumber[m.pokemon_number] = [];
    megasByNumber[m.pokemon_number].push(m);
  }
  const regionalsByNumber = {};
  for (const r of regionalRows) {
    if (!regionalsByNumber[r.pokemon_number]) regionalsByNumber[r.pokemon_number] = [];
    regionalsByNumber[r.pokemon_number].push(r);
  }
  const gigamaxSpriteMap = Object.fromEntries(gigamaxIconRows.map(r => [r.pokemon_number, r.image_url]));
  const gigamaxByNumber = {};
  for (const g of gigamaxChainRows) {
    if (!gigamaxByNumber[g.pokemon_number]) gigamaxByNumber[g.pokemon_number] = [];
    gigamaxByNumber[g.pokemon_number].push({ ...g, sprite_url: gigamaxSpriteMap[g.pokemon_number] || null });
  }
  const iconByNumber = Object.fromEntries(iconRows.map(r => [r.pokemon_number, r.image_url]));

  const captured   = !!catchByNumber[p.number];
  const catch_     = catchByNumber[p.number] || null;
  const ballEntry  = catch_ ? BALLS.find(b => b.name === catch_.ball_name) : null;
  const ballSrc    = ballEntry ? ballUrl(ballEntry.slug) : (catch_?.ball_image_url || '');
  const seenForms = seenMap[p.number] ? Object.values(seenMap[p.number]) : [];

  function seenFormIcon(vt) {
    const S = 14;
    const male   = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="${S}" height="${S}"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
    const female = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="${S}" height="${S}"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
    const shiny  = `<img src="${SHINY_ICON_URL}"   width="${S}" height="${S}" alt="Shiny">`;
    const mega   = `<img src="${MEGA_ICON_URL}"    width="${S}" height="${S}" alt="Méga">`;
    const gmax   = `<img src="${GIGAMAX_ICON_URL}" width="${S}" height="${S}" alt="Gigamax">`;
    const baron  = `<img src="${BARON_ICON_URL}"   width="${S}" height="${S}" alt="Baron">`;
    const genderless = `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="${S}" height="${S}"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;
    switch (vt) {
      case 'normal':        return genderless;
      case 'male':          return male;
      case 'female':        return female;
      case 'shiny':         return genderless + shiny;
      case 'shiny_male':    return male + shiny;
      case 'shiny_female':  return female + shiny;
      case 'mega': case 'mega_x': case 'mega_y':               return mega;
      case 'shiny_mega': case 'shiny_mega_x': case 'shiny_mega_y': return mega + shiny;
      case 'gigamax':       return gmax;
      case 'shiny_gigamax': return gmax + shiny;
      case 'baron':         return baron;
      case 'shiny_baron':   return baron + shiny;
      case 'alolan':              return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">Alola</span>`;
      case 'alolan_shiny':        return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">Alola</span>` + shiny;
      case 'alolan_male':         return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">A</span>` + male;
      case 'alolan_shiny_male':   return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">A</span>` + male + shiny;
      case 'alolan_female':       return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">A</span>` + female;
      case 'alolan_shiny_female': return `<span style="font-size:0.7rem;font-weight:600;color:#77b5fe">A</span>` + female + shiny;
      case 'troizepy':       return female + `<span style="font-size:0.7rem;font-weight:600;color:#c4a747">T</span>`;
      case 'troizepy_shiny': return female + `<span style="font-size:0.7rem;font-weight:600;color:#c4a747">T</span>` + shiny;
      default: {
        // Formes spéciales génériques — cherche dans specialFormsMap
        const sfEntry = Object.values(specialFormsMap).flatMap(m => Object.values(m)).find(f => f.form_key === vt || (f.form_key + '_shiny') === vt);
        const sfLabel = sfEntry ? sfEntry.form_label_fr + (vt.endsWith('_shiny') ? ' Shiny' : '') : vt;
        return `<span style="font-size:0.7rem;font-weight:600;color:var(--text-muted)">${esc(sfLabel)}</span>`;
      }
    }
  }

  const seenStatusHtml = seenForms.length ? `
    <div class="collect-banner collect-banner--seen">
      <div class="collect-banner__seen-inner">
        <div class="collect-banner__seen-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="13" height="13"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>
          Vus dans ta collection
        </div>
        <div class="collect-banner__seen-chips">
          ${seenForms.map(s => `
            <div class="seen-pill-v2${s.is_shiny ? ' seen-pill-v2--shiny' : ''}">
              <span class="seen-pill-v2__icon">${seenFormIcon(s.variant_type)}</span>
              ${s.caught_at ? `<span class="seen-pill-v2__date">${esc(formatCatchDate(s.caught_at))}</span>` : ''}
              ${s.game ? `<span class="seen-pill-v2__game">${esc(s.game)}</span>` : ''}
              <button class="seen-pill-v2__del modal-unsee-btn" data-pokemon-number="${p.number}" data-variant-type="${esc(s.variant_type)}" aria-label="Retirer des vus">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="9" height="9"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>`).join('')}
        </div>
      </div>
    </div>` : '';

  const ownedForms = seenMap[p.number]
    ? Object.values(seenMap[p.number]).filter(f => f.status === 'owned')
    : [];
  const captureIcons = ownedForms.length
    ? ownedForms.map(f => seenFormIcon(f.variant_type)).join('')
    : (() => {
        if (catch_?.is_shiny) return seenFormIcon('shiny');
        const fl = (catch_?.form_label || '').toLowerCase();
        if (fl.includes('mâle') || fl.includes('male'))     return seenFormIcon('male');
        if (fl.includes('femelle') || fl.includes('female')) return seenFormIcon('female');
        return seenFormIcon('normal');
      })();

  const capturePills = (ownedForms.length ? ownedForms : [{
      variant_type: catch_?.is_shiny ? 'shiny' : 'normal',
      is_shiny:     catch_?.is_shiny || false,
      caught_at:    catch_?.caught_at || null,
      game:         catch_?.game     || null,
    }]).map(f => `
    <div class="seen-pill-v2${f.is_shiny ? ' seen-pill-v2--shiny' : ''}">
      <span class="seen-pill-v2__icon">${seenFormIcon(f.variant_type)}</span>
      ${f.caught_at ? `<span class="seen-pill-v2__date">${esc(formatCatchDate(f.caught_at))}</span>` : ''}
      ${f.game ? `<span class="seen-pill-v2__game">${esc(f.game)}</span>` : ''}
      <button class="seen-pill-v2__del modal-capture-del" data-pokemon-number="${p.number}" data-variant-type="${esc(f.variant_type)}" data-catch-id="${esc(catch_?.id ?? '')}" aria-label="Retirer cette capture">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="9" height="9"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>`).join('');

  const collectStatusHtml = catch_ ? `
    <div class="collect-banner">
      <div class="collect-banner__ball">
        <img src="${esc(ballSrc)}" width="42" height="42" alt="${esc(catch_.ball_name)}">
      </div>
      <div class="collect-banner__seen-inner">
        <div class="collect-banner__seen-label">${esc(catch_.ball_name)}</div>
        <div class="collect-banner__seen-chips">${capturePills}</div>
      </div>
    </div>` : seenStatusHtml;
  const imgSrc     = p.image_url || getImageUrl(p.number);
  const types      = (p.types || []).map(typeBadge).join('');
  const evoHtml    = buildEvolutionHtml(realEvoTree, p.number, megasByNumber, iconByNumber, gigamaxByNumber, regionalsByNumber);

  const MALE_SVG   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
  const FEMALE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;

  function variantCard(v) {
    const status = getVariantStatus(p.number, v.variant_type);
    const meta   = VARIANT_STATUS_META[status];
    const isShiny  = ['shiny', 'shiny_male', 'shiny_female', 'shiny_mega', 'shiny_mega_x', 'shiny_mega_y', 'shiny_gigamax', 'alolan_shiny', 'alolan_shiny_male', 'alolan_shiny_female', 'troizepy_shiny'].includes(v.variant_type);
    const sparkles = isShiny
      ? `<span class="sparkle" style="top:-8px;left:18px;--sparkle-delay:0s;--sparkle-size:0.9rem;--sparkle-dur:2.2s">✦</span>
         <span class="sparkle" style="top:6px;right:-8px;--sparkle-delay:0.55s;--sparkle-size:0.65rem;--sparkle-dur:1.9s">✦</span>
         <span class="sparkle" style="top:50%;right:-9px;--sparkle-delay:1.1s;--sparkle-size:0.8rem;--sparkle-dur:2.5s">✦</span>
         <span class="sparkle" style="bottom:18px;left:-9px;--sparkle-delay:0.8s;--sparkle-size:0.7rem;--sparkle-dur:2s">✦</span>
         <span class="sparkle" style="bottom:-7px;left:38px;--sparkle-delay:1.5s;--sparkle-size:0.85rem;--sparkle-dur:2.3s">✦</span>`
      : '';
    return `
      <div class="variant-card" data-type="${esc(v.variant_type)}" data-status="${status}">
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

  function variantRow(badge, subset) {
    if (!subset.length) return '';
    return `<div class="variants-row">
      <div class="variants-gender-col">${badge}</div>
      <div class="variants-grid">${subset.map(variantCard).join('')}</div>
    </div>`;
  }

  const neutralVariants = variants.filter(v => ['normal', 'shiny'].includes(v.variant_type));
  const maleVariants    = variants.filter(v => ['male', 'shiny_male'].includes(v.variant_type));
  const femaleVariants  = variants.filter(v => ['female', 'shiny_female'].includes(v.variant_type));
  const megaVariants    = variants.filter(v => ['mega', 'shiny_mega', 'mega_x', 'shiny_mega_x'].includes(v.variant_type));
  const megaYVariants   = variants.filter(v => ['mega_y', 'shiny_mega_y'].includes(v.variant_type));
  const gigamaxVariants = variants.filter(v => ['gigamax', 'shiny_gigamax'].includes(v.variant_type));
  const alolanVariants   = variants.filter(v => ['alolan', 'alolan_shiny', 'alolan_male', 'alolan_shiny_male', 'alolan_female', 'alolan_shiny_female'].includes(v.variant_type));
  const troizepyVariants = variants.filter(v => ['troizepy', 'troizepy_shiny'].includes(v.variant_type));

  const neutralBadge = `<span class="gender-badge male">${MALE_SVG}</span><span class="gender-badge female">${FEMALE_SVG}</span>`;
  const maleBadge    = `<span class="gender-badge male">${MALE_SVG}</span>`;
  const femaleBadge  = `<span class="gender-badge female">${FEMALE_SVG}</span>`;
  const megaBadge    = `<span class="gender-badge mega">Méga-Évolution</span>`;

  const sexeLabel = 'Sexe';

  // Cartes de variante pour les formes de pokemon_special_forms
  function sfVariantCard(sf, isShiny) {
    const vt     = isShiny ? sf.form_key + '_shiny' : sf.form_key;
    const label  = isShiny ? 'Shiny' : sf.form_label_fr;
    const imgSrc = isShiny
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
        <div class="variant-img-wrap">
          <img src="${esc(imgSrc)}" alt="${esc(label)}" loading="lazy">
        </div>
        <span class="variant-label">${esc(label)}</span>
        <button class="variant-status ${meta.cls}" data-pkmn="${p.number}" data-variant="${esc(vt)}">
          ${esc(meta.label)}
        </button>
      </div>`;
  }

  // Groupement des formes spéciales pour la section Formes
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

  // Contenu des onglets Formes
  const baseFormsContent = [
    variantRow(neutralBadge, neutralVariants),
    variantRow(maleBadge,    maleVariants),
    variantRow(femaleBadge,  femaleVariants),
  ].join('');

  const megaFormsContent = megaVariants.length ? (() => {
    const isXType   = megaVariants.some(v => v.variant_type === 'mega_x' || v.variant_type === 'shiny_mega_x');
    const hasY      = megaYVariants.length > 0;
    const showBadge = isXType || hasY;
    const rowX = showBadge
      ? variantRow(`<span class="gender-badge mega-x">X</span>`, megaVariants)
      : `<div class="variants-grid">${megaVariants.map(variantCard).join('')}</div>`;
    const rowY = hasY ? variantRow(`<span class="gender-badge mega-y">Y</span>`, megaYVariants) : '';
    return rowX + rowY;
  })() : '';

  const formTabList = [
    {
      id: 'base', label: 'Base',
      html: `<div class="variants-rows-wrapper">${baseFormsContent}</div>`,
      show: !!(neutralVariants.length || maleVariants.length || femaleVariants.length),
    },
    ...sfSortedGroups.map(grp => ({
      id: grp, label: grp,
      html: `<div class="variants-grid variants-grid--2col">${sfByGroup[grp].flatMap(sf => [sfVariantCard(sf, false), sfVariantCard(sf, true)]).join('')}</div>`,
      show: true,
    })),
    {
      id: 'mega', label: 'Méga-Évolution',
      html: `<div class="variants-rows-wrapper">${megaFormsContent}</div>`,
      show: !!megaVariants.length,
    },
    {
      id: 'alola', label: "Forme d'Alola",
      html: `<div class="variants-rows-wrapper"><div class="variants-grid">${alolanVariants.map(variantCard).join('')}</div></div>`,
      show: !!alolanVariants.length,
    },
    {
      id: 'troizepy', label: 'Pichu Troizépi',
      html: `<div class="variants-rows-wrapper">${variantRow(femaleBadge, troizepyVariants)}</div>`,
      show: !!troizepyVariants.length,
    },
    {
      id: 'gigamax', label: 'Gigamax',
      html: `<div class="variants-rows-wrapper"><div class="variants-grid">${gigamaxVariants.map(variantCard).join('')}</div></div>`,
      show: !!gigamaxVariants.length,
    },
  ].filter(t => t.show);

  const useFormsTabs = formTabList.length > 1;

  const variantsInnerHtml = useFormsTabs
    ? `<div class="illus-tabs forms-tabs-nav">
         ${formTabList.map((t, i) => `<button class="illus-tab-btn${i === 0 ? ' active' : ''}" data-forms-tab="${esc(t.id)}" aria-selected="${i === 0}">${esc(t.label)}</button>`).join('')}
       </div>
       ${formTabList.map((t, i) => `<div class="forms-tab-panel${i === 0 ? ' active' : ''}" data-forms-panel="${esc(t.id)}">${t.html}</div>`).join('')}`
    : (formTabList[0]?.html || '');

  const variantsHtml = variants.length || specialFormsList.length
    ? `<div class="variants-section">
        <h4>Formes</h4>
        ${variantsInnerHtml}
       </div>`
    : '';

  const descHtml = p.description_fr
    ? `<p class="modal-description">"${esc(p.description_fr)}"</p>`
    : '';

  const MEGA_ICON    = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779128811/mega_evolution_t9nlsa.svg';
  const GIGAMAX_ICON = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779128704/gigantamax_yescyy.png';

  const megas     = megasByNumber[p.number] || [];
  const regionals = regionalsByNumber[p.number] || [];
  const specialForms = [
    ...megas.map(m => ({ name: m.name, artwork_url: m.artwork_url, shiny_artwork_url: m.shiny_artwork_url || '', description_fr: m.description_fr, types: m.types || '', isMega: true, isRegional: false, isSpecialForm: false, formKey: null, formIcon: MEGA_ICON })),
    ...regionals.map(r => ({ name: r.name, artwork_url: r.artwork_url, shiny_artwork_url: r.shiny_artwork_url || '', description_fr: r.description_fr, types: r.types || '', isMega: false, isRegional: true, isSpecialForm: false, formKey: null, formIcon: '' })),
    ...specialFormsList.map(sf => ({ name: sf.form_label_fr, artwork_url: sf.artwork_url || '', shiny_artwork_url: sf.artwork_url_shiny || '', description_fr: sf.description_fr || null, types: (p.types || []).join(','), isMega: false, isRegional: false, isSpecialForm: true, formKey: sf.form_key, formIcon: '', formGroup: sf.form_group || null })),
    ...gigamax.map(g => ({ name: g.name, artwork_url: g.artwork_url, shiny_artwork_url: g.shiny_artwork_url || '', description_fr: g.description_fr, types: (p.types || []).join(','), isMega: false, isRegional: false, isSpecialForm: false, formKey: null, formIcon: GIGAMAX_ICON })),
  ];

  function illustrationCol(name, artworkUrl, descriptionFr, extraClass = '', formTypes = '', shinyUrl = '', formIcon = '', extraAttrs = '') {
    const typeList = formTypes ? formTypes.split(',').map(t => t.trim()).filter(Boolean) : [];
    const typeBadges = typeList.map(t => typeBadge(t)).join('');
    const artImg  = artworkUrl ? `<img class="modal-artwork" src="${esc(artworkUrl)}" alt="${esc(name)}" width="200" height="200" loading="lazy">` : `<div class="modal-artwork modal-artwork--pending"></div>`;
    const shinImg = shinyUrl  ? `<img class="modal-artwork" src="${esc(shinyUrl)}"  alt="Shiny"       width="200" height="200" loading="lazy">` : `<div class="modal-artwork modal-artwork--pending"></div>`;
    const artworkHtml = shinyUrl || (!artworkUrl && !shinyUrl)
      ? `<div class="illus-artworks">
           <div class="illus-artwork-item">
             ${artImg}
             <span class="illus-artwork-label">${esc(name)}</span>
           </div>
           <div class="illus-artwork-item">
             ${shinImg}
             <span class="illus-artwork-label" style="color:var(--yellow)">Shiny</span>
           </div>
         </div>`
      : `${artImg}
         <span class="illus-col-name${extraClass.includes('is-mega') ? ' mega-label' : ''}">${esc(name)}</span>`;
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

  // ── Groupement des formes en onglets ─────────────────────────
  function getFormCategory(f) {
    if (f.isMega)        return 'Méga-Évolution';
    if (f.isRegional)    return 'Formes régionales';
    if (f.isSpecialForm) return f.formGroup || 'Formes spéciales';
    return 'Gigamax';
  }
  const formsByCategory = {};
  for (const f of specialForms) {
    const cat = getFormCategory(f);
    if (!formsByCategory[cat]) formsByCategory[cat] = [];
    formsByCategory[cat].push(f);
  }
  const CATEGORY_ORDER = ['Pikachu Cosplayeur', 'Pikachu Casquette', 'Pikachu Partenaire', 'Spéciales', 'Méga-Évolution', 'Formes régionales', 'Gigamax'];
  const illusCategories = [
    ...CATEGORY_ORDER.filter(c => formsByCategory[c]),
    ...Object.keys(formsByCategory).filter(c => CATEGORY_ORDER.indexOf(c) === -1).sort((a, b) => a.localeCompare(b, 'fr')),
  ];
  const useTabs = illusCategories.length > 1 || specialForms.length >= 4;

  function renderFormIllusCol(f) {
    return illustrationCol(
      f.name, f.artwork_url || '', f.description_fr,
      f.isRegional ? 'is-regional' : f.isMega ? 'is-mega' : f.isSpecialForm ? 'is-special-form' : 'is-gigamax',
      f.types || '', f.shiny_artwork_url || '', f.formIcon || '',
      f.isSpecialForm && f.formKey ? `data-sf-key="${esc(f.formKey)}"` : ''
    );
  }

  const baseIllusHtml = illustrationCol(p.name_fr, imgSrc, p.description_fr, '', (p.types || []).join(','), p.shiny_artwork_url || '');

  const illustrationsHtml = useTabs ? `
    <div class="illus-tabs">
      <div class="illus-tab-btns" role="tablist">
        <button class="illus-tab-btn active" data-tab="base" role="tab" aria-selected="true">Base</button>
        ${illusCategories.map(cat => `<button class="illus-tab-btn" data-tab="${esc(cat)}" role="tab" aria-selected="false">${esc(cat)}</button>`).join('')}
      </div>
      <div class="illus-tab-panel active" data-panel="base">
        <div class="illus-row">${baseIllusHtml}</div>
      </div>
      ${illusCategories.map(cat => `
        <div class="illus-tab-panel" data-panel="${esc(cat)}">
          <div class="illus-row">${formsByCategory[cat].map(renderFormIllusCol).join('')}</div>
        </div>`).join('')}
    </div>` : `
    <div class="illus-row">
      ${baseIllusHtml}
      ${specialForms.map(renderFormIllusCol).join('')}
    </div>`;

  // Injecte le banner dans le modal lui-même (hors modal-content) pour éviter le clipping overflow
  const existingBanner = els.modal.querySelector('.collect-banner');
  if (existingBanner) existingBanner.remove();
  if (collectStatusHtml) {
    const bannerEl = document.createElement('div');
    bannerEl.innerHTML = collectStatusHtml;
    els.modal.insertBefore(bannerEl.firstElementChild, els.modalContent);
  }

  els.modalContent.innerHTML = `
    <div class="modal-header">
      <div class="modal-header-main">
        <div class="modal-number">#${esc(padNumber(p.number))}</div>
        <h2 class="modal-name" id="modal-poke-name">${esc(p.name_fr)}</h2>
      </div>
      <div class="modal-header-actions">
        <span class="gen-badge">Gén. ${esc(toRoman(p.generation))}</span>
        <button class="modal-add-btn" id="modal-edit-btn" title="Modifier la collection">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          Modifier
        </button>
      </div>
    </div>

    ${illustrationsHtml}

    ${evoHtml}
    ${variantsHtml}
  `;

  // Onglets illustrations
  els.modalContent.querySelectorAll('.illus-tabs:not(.forms-tabs-nav) .illus-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      els.modalContent.querySelectorAll('.illus-tabs:not(.forms-tabs-nav) .illus-tab-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      els.modalContent.querySelectorAll('.illus-tab-panel').forEach(panel =>
        panel.classList.toggle('active', panel.dataset.panel === tab)
      );
    });
  });

  if (pendingIllusTab) {
    const targetBtn = els.modalContent.querySelector(`.illus-tab-btn[data-tab="${CSS.escape(pendingIllusTab)}"]`);
    if (targetBtn) targetBtn.click();
    pendingIllusTab = null;
  }

  // Onglets formes
  els.modalContent.querySelectorAll('.forms-tabs-nav .illus-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.formsTab;
      els.modalContent.querySelectorAll('.forms-tabs-nav .illus-tab-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      els.modalContent.querySelectorAll('.forms-tab-panel').forEach(panel =>
        panel.classList.toggle('active', panel.dataset.formsPanel === tab)
      );
    });
  });

  // Image fallback (illustration principale)
  const modalImg = els.modalContent.querySelector('.illus-col:first-child .modal-artwork');
  if (modalImg) modalImg.addEventListener('error', () => { modalImg.src = getImageUrl(p.number); });

  // Boutons "retirer des vus" — cherche dans tout le modal (banner inclus)
  els.modal.querySelectorAll('.modal-unsee-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Retirer cette forme des vus ?')) return;
      const num = parseInt(btn.dataset.pokemonNumber);
      const vt  = btn.dataset.variantType;
      removeFormFromSeen(num, vt);
      updateCardAfterCatch(num);
      closeModal();
    });
  });

  els.modal.querySelectorAll('.modal-capture-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Retirer cette capture ?')) return;
      const num     = parseInt(btn.dataset.pokemonNumber);
      const vt      = btn.dataset.variantType;
      const catchId = btn.dataset.catchId;
      await removeFormFromSeen(num, vt);
      const stillOwned = seenMap[num] && Object.values(seenMap[num]).some(f => f.status === 'owned');
      if (!stillOwned && catchId) {
        const { error } = await deleteCatch(catchId);
        if (error) { alert('Erreur lors de la suppression.'); return; }
        delete catchByNumber[num];
        delete shinyCatchByNumber[num];
        updateCapturedCounter();
      } else if (!stillOwned) {
        delete catchByNumber[num];
        delete shinyCatchByNumber[num];
        updateCapturedCounter();
      }
      updateCardAfterCatch(num);
      closeModal();
    });
  });

  $('modal-edit-btn')?.addEventListener('click', () => {
    closeModal();
    openDrawerWithPokemon(p.number);
  });

  // Statut d'une forme spéciale (mega/gigamax)
  function formStatus(num, formType) {
    const seenVariants = seenMap[num];
    if (seenVariants) {
      if (Object.entries(seenVariants).some(([vt, d]) => vt.includes(formType) && d.status === 'owned')) return 'caught';
      if (Object.keys(seenVariants).some(vt => vt.includes(formType))) return 'seen';
    }
    const c = catchByNumber[num];
    if (c && (c.variant_type?.includes(formType) || c.form_label?.toLowerCase().includes(formType === 'mega' ? 'méga' : 'gigamax'))) return 'caught';
    return 'unseen';
  }

  // Portraits chaîne d'évolution
  els.modalContent.querySelectorAll('.evo-portrait[data-number]').forEach(portrait => {
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
      if      (!catchByNumber[num] && seenSet.has(num)) img.classList.add('evo-portrait-nb');
      else if (!catchByNumber[num])                      img.classList.add('evo-portrait-silhouette');
    }
  });

  // Pills méga/gigamax — statut sur la pill
  const applyPillStatus = (portrait, pill) => {
    if (!portrait?.dataset.formType || !pill) return;
    const st = formStatus(parseInt(portrait.dataset.number), portrait.dataset.formType);
    pill.classList.add('evo-condition--' + st);
  };
  els.modalContent.querySelectorAll('.evo-branch-item').forEach(item =>
    applyPillStatus(item.querySelector('.evo-portrait[data-form-type]'), item.querySelector('.evo-condition-item'))
  );
  els.modalContent.querySelectorAll('.evo-portrait[data-form-type]').forEach(portrait => {
    if (portrait.closest('.evo-branch-item')) return;
    const prev = portrait.closest('.evo-stage')?.previousElementSibling;
    if (prev?.classList.contains('evo-arrow'))
      applyPillStatus(portrait, prev.querySelector('.evo-condition-item'));
  });

  // Artworks : silhouette/N&B/couleur selon statut vu ou capturé
  function refreshArtworks() {
    const forms   = seenMap[p.number] || {};
    const entries = Object.entries(forms);

    const isBaseCatch  = catch_ && !ALOLA_FORM_VT[catch_.form_label] && !SPECIAL_FORM_VT[catch_.form_label] && !/^(Méga|Gigamax|Baron)/.test(catch_.form_label || '');
    const captNormal = (isBaseCatch && !catch_.is_shiny) || entries.some(([vt, d]) => !vt.includes('shiny') && !vt.startsWith('alolan') && d.status === 'owned');
    const captShiny  = (isBaseCatch &&  catch_.is_shiny) || entries.some(([vt, d]) =>  vt.includes('shiny') && !vt.startsWith('alolan') && d.status === 'owned');
    const seenNormal = entries.some(([vt, d]) => !vt.includes('shiny') && !vt.startsWith('alolan') && d.status === 'seen');
    const seenShiny  = entries.some(([vt, d]) =>  vt.includes('shiny') && !vt.startsWith('alolan') && d.status === 'seen');

    function applyImg(img, owned, seen) {
      if (!img) return;
      img.classList.remove('modal-artwork--nb', 'modal-artwork--silhouette');
      if      (!owned && !seen) img.classList.add('modal-artwork--silhouette');
      else if (!owned)          img.classList.add('modal-artwork--nb');
    }

    els.modalContent.querySelectorAll('.illus-col-wrapper').forEach(wrapper => {
      const col       = wrapper.querySelector('.illus-col');
      const isMega     = col?.classList.contains('is-mega');
      const isGigamax  = col?.classList.contains('is-gigamax');
      const isRegional = col?.classList.contains('is-regional');
      const items     = wrapper.querySelectorAll('.illus-artwork-item');

      let ownedNorm, seenNorm, ownedShiny, seenShinyF;
      if (isMega) {
        ownedNorm  = entries.some(([vt, d]) => vt.includes('mega') && !vt.includes('shiny') && d.status === 'owned');
        seenNorm   = entries.some(([vt, d]) => vt.includes('mega') && !vt.includes('shiny') && d.status === 'seen');
        ownedShiny = entries.some(([vt, d]) => vt.includes('mega') &&  vt.includes('shiny') && d.status === 'owned');
        seenShinyF = entries.some(([vt, d]) => vt.includes('mega') &&  vt.includes('shiny') && d.status === 'seen');
      } else if (isGigamax) {
        ownedNorm  = entries.some(([vt, d]) => vt.includes('gigamax') && !vt.includes('shiny') && d.status === 'owned');
        seenNorm   = entries.some(([vt, d]) => vt.includes('gigamax') && !vt.includes('shiny') && d.status === 'seen');
        ownedShiny = entries.some(([vt, d]) => vt.includes('gigamax') &&  vt.includes('shiny') && d.status === 'owned');
        seenShinyF = entries.some(([vt, d]) => vt.includes('gigamax') &&  vt.includes('shiny') && d.status === 'seen');
      } else if (isRegional) {
        ownedNorm  = entries.some(([vt, d]) => vt.startsWith('alolan') && !vt.includes('shiny') && d.status === 'owned');
        seenNorm   = entries.some(([vt, d]) => vt.startsWith('alolan') && !vt.includes('shiny') && d.status === 'seen');
        ownedShiny = entries.some(([vt, d]) => vt.startsWith('alolan') &&  vt.includes('shiny') && d.status === 'owned');
        seenShinyF = entries.some(([vt, d]) => vt.startsWith('alolan') &&  vt.includes('shiny') && d.status === 'seen');
      } else if (col?.classList.contains('is-special-form')) {
        const sfKey = col.dataset.sfKey;
        if (sfKey) {
          ownedNorm  = entries.some(([vt, d]) => vt === sfKey           && d.status === 'owned');
          seenNorm   = entries.some(([vt, d]) => vt === sfKey           && d.status === 'seen');
          ownedShiny = entries.some(([vt, d]) => vt === sfKey + '_shiny' && d.status === 'owned');
          seenShinyF = entries.some(([vt, d]) => vt === sfKey + '_shiny' && d.status === 'seen');
        } else {
          ownedNorm = captNormal; seenNorm = seenNormal; ownedShiny = captShiny; seenShinyF = seenShiny;
        }
      } else {
        ownedNorm  = captNormal; seenNorm   = seenNormal;
        ownedShiny = captShiny;  seenShinyF = seenShiny;
      }

      if (items.length >= 2) {
        applyImg(items[0].querySelector('.modal-artwork'), ownedNorm,  seenNorm);
        applyImg(items[1].querySelector('.modal-artwork'), ownedShiny, seenShinyF);
      } else {
        applyImg(wrapper.querySelector('.modal-artwork'), ownedNorm || ownedShiny, seenNorm || seenShinyF);
      }
    });
  }
  refreshArtworks();

  function refreshEvoPortraits() {
    els.modalContent.querySelectorAll('.evo-portrait[data-number]').forEach(portrait => {
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
    els.modalContent.querySelectorAll('.evo-branch-item').forEach(item =>
      refreshPill(item.querySelector('.evo-portrait[data-form-type]'), item.querySelector('.evo-condition-item'))
    );
    els.modalContent.querySelectorAll('.evo-portrait[data-form-type]').forEach(portrait => {
      if (portrait.closest('.evo-branch-item')) return;
      const prev = portrait.closest('.evo-stage')?.previousElementSibling;
      if (prev?.classList.contains('evo-arrow'))
        refreshPill(portrait, prev.querySelector('.evo-condition-item'));
    });
  }

  // Clics sur les boutons de statut des variantes
  els.modalContent.querySelectorAll('.variant-status').forEach(btn => {
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

  // Clics sur les portraits d'évolution
  els.modalContent.querySelectorAll('.evo-portrait:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const num = parseInt(btn.dataset.number);
      openModal(num);
    });
  });

  // Anime les barres de stats
  requestAnimationFrame(() => {
    els.modalContent.querySelectorAll('.stat-bar-fill').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0';
      requestAnimationFrame(() => { bar.style.width = w; });
    });
  });
  } catch (err) {
    els.modalContent.innerHTML = `<div style="padding:40px;color:#ef5350;font-family:monospace;font-size:0.85rem;white-space:pre-wrap">${esc(String(err))}</div>`;
  }
}

function closeModal() {
  currentModalPokemonNumber = null;
  els.modalOverlay.hidden = true;
  document.body.style.overflow = '';
  els.modalContent.innerHTML = '';
  const banner = els.modal.querySelector('.collect-banner');
  if (banner) banner.remove();
}

// ── Filtres types ─────────────────────────────────────────────

async function populateTypeFilters() {
  const types = await fetchTypes();
  types.forEach(typeName => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.type = typeName;
    btn.textContent = TYPE_FR[typeName] || typeName;
    els.typeFilters.appendChild(btn);
  });
}

// ── Scroll infini ─────────────────────────────────────────────

const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !state.loading && !state.allLoaded) loadPokemon(true);
}, { rootMargin: '200px' });

observer.observe(els.loader);

// ── Événements ────────────────────────────────────────────────

els.search.addEventListener('input', debounce(e => {
  state.search = e.target.value.replace(/[<>'"]/g, '').trim();
  resetAndReload();
}, CONFIG.SEARCH_DEBOUNCE));

els.genFilters.addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  els.genFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  state.gen = btn.dataset.gen;
  resetAndReload();
});

els.typeFilters.addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  els.typeFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  state.type = btn.dataset.type;
  resetAndReload();
});

els.sort.addEventListener('change', e => { state.sortBy = e.target.value; resetAndReload(); });

if (els.capturedBtn) {
  els.capturedBtn.addEventListener('click', () => {
    state.capturedOnly = !state.capturedOnly;
    els.capturedBtn.classList.toggle('active', state.capturedOnly);
    resetAndReload();
  });
}

els.resetBtn.addEventListener('click', () => {
  state.search = ''; state.gen = 'all'; state.type = 'all';
  state.sortBy = 'number'; state.capturedOnly = false;
  els.search.value = ''; els.sort.value = 'number';
  if (els.capturedBtn) els.capturedBtn.classList.remove('active');
  els.genFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  els.genFilters.querySelector('[data-gen="all"]').classList.add('active');
  els.typeFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  els.typeFilters.querySelector('[data-type="all"]').classList.add('active');
  resetAndReload();
});

els.modalClose.addEventListener('click', closeModal);
els.modalOverlay.addEventListener('click', e => { if (e.target === els.modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !els.modalOverlay.hidden) closeModal(); });

// ── Init ──────────────────────────────────────────────────────

async function init() {
  bindDrawerEvents();
  try {
    await Promise.all([loadCatchesMap(), populateTypeFilters()]);
  } catch (err) {
    console.error('[init]', err);
  }
  loadPokemon(false);
}

initAuth().then(ok => { if (ok) init(); });

// ── Catch drawer (page principale) ───────────────────────────

let drawerPokemon    = null;
let drawerBall       = null;
let drawerGame       = null;
let drawerShiny      = false;
let drawerMode       = 'caught'; // 'caught' | 'seen'
let drawerForm       = null;     // { variant_type, label, image_url } | null (capture)
let drawerForms      = [];       // formes sélectionnées en mode "vu" (multi-select)
let drawerInitDone   = false;
let drawerSearchTmt  = null;

function openCatchDrawer(mode = 'caught') {
  const drawerEl = $('catch-drawer');
  if (!drawerEl) return;

  drawerPokemon = null;
  drawerBall    = null;
  drawerGame    = null;
  drawerShiny   = false;

  const searchInp = $('poke-search');
  const selectedEl = $('selected-pokemon');
  const dropdown  = $('poke-dropdown');
  const saveBtnEl = $('save-catch-btn');

  drawerForm  = null;
  drawerForms = [];
  if (searchInp)   { searchInp.value = ''; }
  if (selectedEl)  { selectedEl.hidden = true; selectedEl.innerHTML = ''; }
  if (dropdown)    { dropdown.hidden = true; }
  const formField = $('form-selector-field');
  if (formField) { formField.hidden = true; $('form-grid').innerHTML = ''; }
  $('catch-date').value = new Date().toISOString().slice(0, 10);
  const gameInp  = $('catch-game');  if (gameInp)  gameInp.value  = '';
  const notesInp = $('catch-notes'); if (notesInp) notesInp.value = '';
  saveBtnEl.disabled = false;
  saveBtnEl.textContent = mode === 'seen' ? 'Marquer comme vu' : 'Sauvegarder';

  if (!drawerInitDone) { initDrawerBallGrid(); initDrawerGameGrid(); drawerInitDone = true; }
  $('ball-grid').querySelectorAll('.ball-opt').forEach(b => b.classList.remove('selected'));
  $('game-grid')?.querySelectorAll('.game-opt').forEach(b => b.classList.remove('selected'));

  drawerMode = mode;
  const modeLabel = $('drawer-mode-label');
  if (modeLabel) modeLabel.textContent = mode === 'seen' ? 'Marquer comme vu' : 'Nouvelle capture';
  drawerEl.dataset.mode = mode;

  drawerEl.hidden = false;
  requestAnimationFrame(() => drawerEl.classList.add('open'));
  if (searchInp) searchInp.focus();
}

function closeCatchDrawer() {
  const drawerEl = $('catch-drawer');
  if (!drawerEl) return;
  drawerEl.classList.remove('open');
  drawerEl.addEventListener('transitionend', () => { drawerEl.hidden = true; }, { once: true });
  drawerPokemon = null;
  drawerBall    = null;
  drawerShiny   = false;
}

function getFormIcon(vt) {
  if (vt.includes('baron'))   return `<img src="${BARON_ICON_URL}"   width="28" height="28" alt="">`;
  if (vt.includes('shiny'))   return `<img src="${SHINY_ICON_URL}"   width="28" height="28" alt="">`;
  if (vt.includes('gigamax')) return `<img src="${GIGAMAX_ICON_URL}" width="28" height="28" alt="">`;
  if (vt.includes('mega'))    return `<img src="${MEGA_ICON_URL}"    width="28" height="28" alt="">`;
  if (vt === 'male')          return MALE_SVG;
  if (vt === 'female')        return FEMALE_SVG;
  return '';
}

function renderDrawerForms(variants, iconMap, megas = [], preselectedVts = []) {
  const field = $('form-selector-field');
  const grid  = $('form-grid');
  if (!field || !grid) return;

  const MALE_ICON     = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
  const FEMALE_ICON   = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
  const UNISEXE_ICON  = `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="26" height="26"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;

  const maleVariant   = variants.find(v => v.variant_type === 'male');
  const femaleVariant = variants.find(v => v.variant_type === 'female');

  const MALE_SM    = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
  const FEMALE_SM  = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
  const UNISEXE_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="20" height="20"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;
  const SHINY_SM   = `<img src="${SHINY_ICON_URL}" width="20" height="20" alt="">`;

  // Entrées fixes (toujours présentes pour tous les Pokémon)
  const entries = [
    { label: 'Mâle',          variant_type: 'male',         iconHtml: MALE_ICON,                sprite: maleVariant?.image_url   || iconMap.normal || null },
    { label: 'Mâle Shiny',    variant_type: 'shiny_male',   iconHtml: MALE_SM + SHINY_SM,       sprite: iconMap.shiny  || null },
    { label: 'Femelle',       variant_type: 'female',       iconHtml: FEMALE_ICON,              sprite: femaleVariant?.image_url || iconMap.normal || null },
    { label: 'Femelle Shiny', variant_type: 'shiny_female', iconHtml: FEMALE_SM + SHINY_SM,     sprite: iconMap.shiny  || null },
    { label: 'Unisexe',       variant_type: 'normal',       iconHtml: UNISEXE_ICON,             sprite: iconMap.normal || null },
    { label: 'Unisexe Shiny', variant_type: 'shiny',        iconHtml: UNISEXE_SM + SHINY_SM,    sprite: iconMap.shiny  || null },
    { label: 'Baron',         variant_type: 'baron',        iconHtml: `<img src="${BARON_ICON_URL}" width="28" height="28" alt="">`,                                                                              sprite: iconMap.normal || null },
    { label: 'Baron Shiny',   variant_type: 'shiny_baron',  iconHtml: `<img src="${BARON_ICON_URL}" width="22" height="22" alt=""><img src="${SHINY_ICON_URL}" width="20" height="20" alt="">`, sprite: iconMap.normal || null },
  ];

  // Mégas — toujours présents avec variante shiny (sprite si disponible en BDD)
  const MEGA_SM  = `<img src="${MEGA_ICON_URL}"    width="22" height="22" alt="">`;
  const GMAX_SM  = `<img src="${GIGAMAX_ICON_URL}" width="22" height="22" alt="">`;
  const SHINY_SM2 = `<img src="${SHINY_ICON_URL}"  width="20" height="20" alt="">`;
  const megasWithImg = megas.filter(m => m.image_url);
  if (megasWithImg.length > 0) {
    for (const m of megasWithImg) {
      const vt      = m.name?.toLowerCase().includes(' x') ? 'mega_x'
                    : m.name?.toLowerCase().includes(' y') ? 'mega_y' : 'mega';
      const vtShiny = vt === 'mega_x' ? 'shiny_mega_x' : vt === 'mega_y' ? 'shiny_mega_y' : 'shiny_mega';
      const label   = vt === 'mega_x' ? 'Méga-Évo. X' : vt === 'mega_y' ? 'Méga-Évo. Y' : 'Méga-Évolution';
      entries.push({ label,                 variant_type: vt,      iconHtml: `<img src="${MEGA_ICON_URL}" width="28" height="28" alt="">`, sprite: m.image_url });
      entries.push({ label: label+' Shiny', variant_type: vtShiny, iconHtml: MEGA_SM + SHINY_SM2, sprite: null });
    }
  } else {
    entries.push({ label: 'Méga-Évolution',       variant_type: 'mega',       iconHtml: `<img src="${MEGA_ICON_URL}" width="28" height="28" alt="">`, sprite: null });
    entries.push({ label: 'Méga-Évolution Shiny', variant_type: 'shiny_mega', iconHtml: MEGA_SM + SHINY_SM2, sprite: null });
  }

  // Gigamax — toujours présent avec variante shiny (sprite si disponible en BDD)
  const gmaxV      = variants.find(v => v.variant_type === 'gigamax');
  const gmaxShinyV = variants.find(v => v.variant_type === 'shiny_gigamax');
  entries.push({ label: 'Gigamax',       variant_type: 'gigamax',       iconHtml: `<img src="${GIGAMAX_ICON_URL}" width="28" height="28" alt="">`, sprite: gmaxV?.image_url      || null });
  entries.push({ label: 'Gigamax Shiny', variant_type: 'shiny_gigamax', iconHtml: GMAX_SM + SHINY_SM2,                                           sprite: gmaxShinyV?.image_url || null });

  // Pokémon exclusivement femelle : masquer les options Mâle et Unisexe
  const isFemaleOnly = !maleVariant && !!femaleVariant;
  if (isFemaleOnly) {
    const excludeVts = new Set(['male', 'shiny_male', 'normal', 'shiny']);
    entries.splice(0, entries.length, ...entries.filter(e => !excludeVts.has(e.variant_type)));
  }
  // Pokémon exclusivement mâle : masquer les options Femelle et Unisexe
  const isMaleOnly = !!maleVariant && !femaleVariant;
  if (isMaleOnly) {
    const excludeVts = new Set(['female', 'shiny_female', 'normal', 'shiny']);
    entries.splice(0, entries.length, ...entries.filter(e => !excludeVts.has(e.variant_type)));
  }

  const usePreselect = preselectedVts.length > 0;
  grid.innerHTML = entries.map((e, i) => {
    const sel = usePreselect && preselectedVts.includes(e.variant_type);
    return `<button class="form-opt${sel ? ' selected' : ''}" data-idx="${i}" data-vt="${esc(e.variant_type)}" title="${esc(e.label)}">
      <div class="form-opt-icon">${e.iconHtml}</div>
      <span>${esc(e.label)}</span>
    </button>`;
  }).join('');

  if (usePreselect) {
    drawerForms = entries.filter(e => preselectedVts.includes(e.variant_type));
    if (drawerMode === 'caught' && drawerForms.length > 0) selectDrawerForm(drawerForms[0]);
  } else {
    drawerForms = [];
  }

  grid.querySelectorAll('.form-opt').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      const entry = entries[parseInt(btn.dataset.idx)];
      if (btn.classList.contains('selected')) {
        if (!drawerForms.find(f => f.variant_type === entry.variant_type))
          drawerForms.push(entry);
        if (drawerMode === 'caught') selectDrawerForm(entry);
      } else {
        drawerForms = drawerForms.filter(f => f.variant_type !== entry.variant_type);
      }
    })
  );

  field.hidden = false;
}

function renderDrawerFormsAlolan(variants, alolanSprite) {
  const field = $('form-selector-field');
  const grid  = $('form-grid');
  if (!field || !grid) return;

  const MALE_ICON    = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
  const FEMALE_ICON  = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
  const UNISEXE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="26" height="26"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;
  const MALE_SM      = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
  const FEMALE_SM    = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
  const UNISEXE_SM   = `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="20" height="20"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;
  const SHINY_SM     = `<img src="${SHINY_ICON_URL}" width="20" height="20" alt="">`;

  const alolanMaleV      = variants.find(v => v.variant_type === 'alolan_male');
  const alolanFemaleV    = variants.find(v => v.variant_type === 'alolan_female');
  const alolanShinyMaleV = variants.find(v => v.variant_type === 'alolan_shiny_male');
  const alolanShinyFemV  = variants.find(v => v.variant_type === 'alolan_shiny_female');
  const alolanV          = variants.find(v => v.variant_type === 'alolan');
  const alolanShinyV     = variants.find(v => v.variant_type === 'alolan_shiny');

  const base      = alolanV?.image_url      || alolanSprite || null;
  const baseShiny = alolanShinyV?.image_url || base;
  const entries = [
    { label: 'Alola Mâle',          displayLabel: 'Mâle',          variant_type: 'alolan_male',         iconHtml: MALE_ICON,             sprite: alolanMaleV?.image_url      || base      },
    { label: 'Alola Mâle Shiny',    displayLabel: 'Mâle Shiny',    variant_type: 'alolan_shiny_male',   iconHtml: MALE_SM + SHINY_SM,    sprite: alolanShinyMaleV?.image_url || baseShiny },
    { label: 'Alola Femelle',       displayLabel: 'Femelle',       variant_type: 'alolan_female',       iconHtml: FEMALE_ICON,           sprite: alolanFemaleV?.image_url    || base      },
    { label: 'Alola Femelle Shiny', displayLabel: 'Femelle Shiny', variant_type: 'alolan_shiny_female', iconHtml: FEMALE_SM + SHINY_SM,  sprite: alolanShinyFemV?.image_url  || baseShiny },
    { label: 'Alola Unisexe',       displayLabel: 'Unisexe',       variant_type: 'alolan',              iconHtml: UNISEXE_ICON,          sprite: base      },
    { label: 'Alola Unisexe Shiny', displayLabel: 'Unisexe Shiny', variant_type: 'alolan_shiny',        iconHtml: UNISEXE_SM + SHINY_SM, sprite: baseShiny },
  ];

  grid.innerHTML = entries.map((e, i) => `
    <button class="form-opt" data-idx="${i}" data-vt="${esc(e.variant_type)}" title="${esc(e.label)}">
      <div class="form-opt-icon">${e.iconHtml}</div>
      <span>${esc(e.displayLabel || e.label)}</span>
    </button>`).join('');

  drawerForms = [];

  grid.querySelectorAll('.form-opt').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      const entry = entries[parseInt(btn.dataset.idx)];
      if (btn.classList.contains('selected')) {
        if (!drawerForms.find(f => f.variant_type === entry.variant_type)) drawerForms.push(entry);
        if (drawerMode === 'caught') selectDrawerForm(entry);
      } else {
        drawerForms = drawerForms.filter(f => f.variant_type !== entry.variant_type);
      }
    })
  );

  field.hidden = false;
}

function renderDrawerFormsSpecial(specialForm) {
  const field = $('form-selector-field');
  const grid  = $('form-grid');
  if (!field || !grid) return;

  const MALE_ICON   = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
  const MALE_SM     = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
  const FEMALE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
  const FEMALE_SM   = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
  const SHINY_SM    = `<img src="${SHINY_ICON_URL}" width="20" height="20" alt="">`;

  const isMale     = specialForm.form_group === 'Pikachu Casquette';
  const isGendered = specialForm.form_group === 'Pikachu Partenaire';
  const ICON    = isMale ? MALE_ICON   : FEMALE_ICON;
  const ICON_SM = isMale ? MALE_SM     : FEMALE_SM;
  const genderLabel = isMale ? 'Mâle' : 'Femelle';

  const label   = specialForm.form_label_fr;
  const vt      = specialForm.form_key;
  const vtShiny = specialForm.form_key + '_shiny';

  const entries = isGendered ? [
    { label: label,            displayLabel: 'Mâle',         variant_type: vt,                      iconHtml: MALE_ICON,            sprite: specialForm.image_url                               || null },
    { label: label + ' Shiny', displayLabel: 'Mâle Shiny',   variant_type: vtShiny,                 iconHtml: MALE_SM   + SHINY_SM, sprite: specialForm.image_url_shiny || specialForm.image_url || null },
    { label: label,            displayLabel: 'Femelle',       variant_type: vt      + '_female',     iconHtml: FEMALE_ICON,          sprite: specialForm.image_url                               || null },
    { label: label + ' Shiny', displayLabel: 'Femelle Shiny', variant_type: vtShiny + '_female',     iconHtml: FEMALE_SM + SHINY_SM, sprite: specialForm.image_url_shiny || specialForm.image_url || null },
  ] : [
    { label: label,            displayLabel: genderLabel,            variant_type: vt,      iconHtml: ICON,               sprite: specialForm.image_url                               || null },
    { label: label + ' Shiny', displayLabel: genderLabel + ' Shiny', variant_type: vtShiny, iconHtml: ICON_SM + SHINY_SM, sprite: specialForm.image_url_shiny || specialForm.image_url || null },
  ];

  grid.innerHTML = entries.map((e, i) => `
    <button class="form-opt" data-idx="${i}" data-vt="${esc(e.variant_type)}" title="${esc(e.label)}">
      <div class="form-opt-icon">${e.iconHtml}</div>
      <span>${esc(e.displayLabel)}</span>
    </button>`).join('');

  drawerForms = [];

  grid.querySelectorAll('.form-opt').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      const entry = entries[parseInt(btn.dataset.idx)];
      if (btn.classList.contains('selected')) {
        if (!drawerForms.find(f => f.variant_type === entry.variant_type)) drawerForms.push(entry);
        if (drawerMode === 'caught') selectDrawerForm(entry);
      } else {
        drawerForms = drawerForms.filter(f => f.variant_type !== entry.variant_type);
      }
    })
  );

  field.hidden = false;
}

function selectDrawerForm(v) {
  drawerForm  = v;
  drawerShiny = v.variant_type?.includes('shiny') || false;
  const img = $('drawer-poke-img');
  if (img && drawerPokemon) {
    let src;
    if (drawerPokemon.isAlolan && drawerPokemon.alolanSprite) {
      src = normalizeVariantUrl(drawerPokemon.alolanSprite);
    } else if (drawerPokemon.isSpecial && v.sprite) {
      src = normalizeVariantUrl(v.sprite);
    } else if (drawerShiny) {
      src = drawerPokemon.iconShiny  ? normalizeVariantUrl(drawerPokemon.iconShiny)  : spriteUrl(drawerPokemon.number, true);
    } else {
      src = drawerPokemon.iconNormal ? normalizeVariantUrl(drawerPokemon.iconNormal) : spriteUrl(drawerPokemon.number, false);
    }
    img.src = src;
  }
}

function initDrawerBallGrid() {
  const grid = $('ball-grid');
  if (!grid) return;
  grid.innerHTML = BALLS.map(b => `
    <button class="ball-opt" data-slug="${esc(b.slug)}" title="${esc(b.name)}">
      <img src="${esc(ballUrl(b.slug))}" alt="${esc(b.name)}" width="28" height="28">
      <span>${esc(b.name)}</span>
    </button>`).join('');
  grid.querySelectorAll('.ball-opt').forEach(btn =>
    btn.addEventListener('click', () => {
      drawerBall = BALLS.find(b => b.slug === btn.dataset.slug);
      grid.querySelectorAll('.ball-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    })
  );
}

function initDrawerGameGrid() {
  const grid = $('game-grid');
  if (!grid) return;
  grid.innerHTML = GAMES.map(g => `
    <button class="game-opt" data-slug="${esc(g.slug)}" title="${esc(g.name)}">
      ${g.iconUrl ? `<img src="${esc(g.iconUrl)}" alt="" width="28" height="28">` : ''}
      <span>${esc(g.name)}</span>
    </button>`).join('');
  grid.querySelectorAll('.game-opt').forEach(btn =>
    btn.addEventListener('click', () => {
      const alreadySelected = btn.classList.contains('selected');
      grid.querySelectorAll('.game-opt').forEach(b => b.classList.remove('selected'));
      if (!alreadySelected) {
        btn.classList.add('selected');
        drawerGame = GAMES.find(g => g.slug === btn.dataset.slug) || null;
        const gameInp = $('catch-game');
        if (gameInp) gameInp.value = '';
      } else {
        drawerGame = null;
      }
    })
  );
}

function bindDrawerEvents() {
  const drawerEl = $('catch-drawer');
  if (!drawerEl) return;

  $('add-catch-fab').addEventListener('click', openCatchDrawer);
  $('add-seen-btn').addEventListener('click', () => openCatchDrawer('seen'));

  // Filtres collection
  ['filter-seen-btn', 'filter-caught-btn'].forEach(id => {
    const btn = $(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const status = btn.dataset.status;
      if (state.statusFilter === status) {
        state.statusFilter = 'all';
        btn.classList.remove('active');
      } else {
        state.statusFilter = status;
        document.querySelectorAll('[data-status]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      resetAndReload();
    });
  });
  $('close-drawer-btn').addEventListener('click', closeCatchDrawer);
  $('drawer-overlay').addEventListener('click', closeCatchDrawer);

  // Recherche Pokémon
  const searchInp = $('poke-search');
  const dropdown  = $('poke-dropdown');
  if (searchInp) {
    searchInp.addEventListener('input', e => {
      clearTimeout(drawerSearchTmt);
      const q = e.target.value.trim();
      if (!q) { dropdown.hidden = true; return; }
      drawerSearchTmt = setTimeout(async () => {
        const { data } = await fetchPokemon({ search: q, from: 0, to: 7 });
        if (!data?.length) { dropdown.hidden = true; return; }

        const nums = data.map(p => p.number);
        const [allIcons, alolanRows, specialFormsData] = await Promise.all([
          fetchCardIcons(nums).catch(() => []),
          fetchAlolanVariantsForNumbers(nums).catch(() => []),
          fetchSpecialFormsForNumbers(nums).catch(() => ({})),
        ]);
        const iconMap = {};
        for (const r of allIcons) {
          if (!iconMap[r.pokemon_number]) iconMap[r.pokemon_number] = { normal: null, shiny: null };
          if ((r.variant_type === 'normal' || r.variant_type === 'male' || r.variant_type === 'female') && !iconMap[r.pokemon_number].normal)
            iconMap[r.pokemon_number].normal = r.image_url;
          else if ((r.variant_type === 'shiny' || r.variant_type === 'shiny_male' || r.variant_type === 'shiny_female') && !iconMap[r.pokemon_number].shiny)
            iconMap[r.pokemon_number].shiny = r.image_url;
        }
        const alolanSpriteMap = {};
        for (const r of alolanRows) alolanSpriteMap[r.pokemon_number] = r.image_url;

        // Construire la liste : Pokémon normal + entrée Alola + entrées formes spéciales
        const items = [];
        for (const p of data) {
          items.push({ p, isAlola: false, specialForm: null });
          if (alolanSpriteMap[p.number]) items.push({ p, isAlola: true, specialForm: null });
          for (const form of Object.values(specialFormsData[p.number] || {})) {
            items.push({ p, isAlola: false, specialForm: form });
          }
        }

        dropdown.innerHTML = items.map(({ p, isAlola, specialForm }) => {
          const ico         = iconMap[p.number];
          const alolaSprite = alolanSpriteMap[p.number] || null;
          const src = isAlola
            ? (alolaSprite ? normalizeVariantUrl(alolaSprite) : spriteUrl(p.number, false))
            : specialForm
            ? (specialForm.image_url ? normalizeVariantUrl(specialForm.image_url) : spriteUrl(p.number, false))
            : (ico?.normal ? normalizeVariantUrl(ico.normal)  : spriteUrl(p.number, false));
          const displayName = isAlola
            ? `${p.name_fr} · Alola`
            : specialForm
            ? `${p.name_fr} · ${specialForm.form_label_fr}`
            : p.name_fr;
          return `<button class="poke-result"
            data-number="${p.number}"
            data-name="${esc(p.name_fr)}"
            data-is-alola="${isAlola ? '1' : '0'}"
            data-alola-sprite="${esc(alolaSprite || '')}"
            data-special-form-key="${esc(specialForm?.form_key || '')}"
            data-special-form-label="${esc(specialForm?.form_label_fr || '')}">
            <img src="${esc(src)}" width="28" height="28" alt="" style="image-rendering:pixelated">
            <span>#${esc(padNumber(p.number))} ${esc(displayName)}</span>
          </button>`;
        }).join('');
        dropdown.hidden = false;

        dropdown.querySelectorAll('.poke-result').forEach(btn =>
          btn.addEventListener('click', async () => {
            const num            = parseInt(btn.dataset.number);
            const name           = btn.dataset.name;
            const isAlola        = btn.dataset.isAlola === '1';
            const alolaSprite    = btn.dataset.alolaSprite || null;
            const specialFormKey = btn.dataset.specialFormKey || null;
            const specialFormLbl = btn.dataset.specialFormLabel || null;
            const ico            = iconMap[num] || {};

            drawerPokemon = {
              number: num, name_fr: name,
              iconNormal: ico.normal || null, iconShiny: ico.shiny || null,
              isAlolan: isAlola, alolanSprite: alolaSprite,
              isSpecial: !!specialFormKey, specialFormKey, specialFormLabel: specialFormLbl,
            };

            const displayName = isAlola
              ? `${name} · Alola`
              : specialFormKey
              ? `${name} · ${specialFormLbl}`
              : name;
            const sfData = specialFormKey ? specialFormsData[num]?.[specialFormKey] : null;
            const src = isAlola
              ? (alolaSprite ? normalizeVariantUrl(alolaSprite) : spriteUrl(num, false))
              : sfData?.image_url
              ? normalizeVariantUrl(sfData.image_url)
              : (ico.normal ? normalizeVariantUrl(ico.normal) : spriteUrl(num, false));

            searchInp.value = displayName;
            dropdown.hidden = true;

            const sel = $('selected-pokemon');
            sel.innerHTML = `
              <img id="drawer-poke-img" src="${esc(src)}" width="52" height="52"
                   alt="${esc(displayName)}" style="image-rendering:pixelated">
              <div>
                <div style="font-size:0.65rem;color:var(--text-muted)">#${esc(padNumber(num))}</div>
                <div style="font-weight:700">${esc(displayName)}</div>
              </div>`;
            sel.hidden = false;

            drawerForm = null;
            if (isAlola) {
              const variantData = await fetchVariants(num).catch(() => []);
              renderDrawerFormsAlolan(variantData, alolaSprite);
            } else if (specialFormKey && sfData) {
              // Mettre à jour le cache local
              if (!specialFormsMap[num]) specialFormsMap[num] = {};
              specialFormsMap[num][specialFormKey] = sfData;
              renderDrawerFormsSpecial(sfData);
            } else {
              const [variantData, megaData] = await Promise.all([
                fetchVariants(num).catch(() => []),
                fetchMegaEvolutions([num]).catch(() => []),
              ]);
              renderDrawerForms(variantData, ico, megaData);
            }
          })
        );
      }, 280);
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('#poke-search-wrap')) dropdown.hidden = true;
    });
  }

  const gameInp = $('catch-game');
  if (gameInp) {
    gameInp.addEventListener('input', () => {
      drawerGame = null;
      $('game-grid')?.querySelectorAll('.game-opt').forEach(b => b.classList.remove('selected'));
    });
  }

  $('save-catch-btn').addEventListener('click', saveCatchFromMain);
}

async function saveCatchFromMain() {
  if (!drawerPokemon) { alert('Choisis un Pokémon.'); return; }

  if (drawerMode === 'seen') {
    const formsToMark = drawerForms.length ? drawerForms : (drawerForm ? [drawerForm] : []);
    if (!formsToMark.length) { alert('Choisis un Pokémon.'); return; }

    const saveBtn = $('save-catch-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Sauvegarde…';

    const savedSeenNum = drawerPokemon.number;
    const savedSeenVts = formsToMark.map(f => f.variant_type || '');
    const date = $('catch-date').value || new Date().toISOString().slice(0, 10);
    const game = drawerGame?.name || $('catch-game')?.value.trim() || null;
    try {
      for (const form of formsToMark) {
        const isShiny = form.variant_type?.includes('shiny') || false;
        const sprite  = form.sprite
          ? normalizeVariantUrl(form.sprite)
          : (isShiny
              ? (drawerPokemon.iconShiny  ? normalizeVariantUrl(drawerPokemon.iconShiny)  : spriteUrl(drawerPokemon.number, true))
              : (drawerPokemon.iconNormal ? normalizeVariantUrl(drawerPokemon.iconNormal) : spriteUrl(drawerPokemon.number, false)));
        await addToSeen(drawerPokemon.number, {
          variant_type: form.variant_type || 'normal',
          status:       getVariantStatus(drawerPokemon.number, form.variant_type) === 'owned' ? 'owned' : 'seen',
          form_label:   form.label || (isShiny ? 'Shiny' : 'Normale'),
          is_shiny:     isShiny,
          sprite_url:   sprite,
          caught_at:    date,
          game,
        });
      }
      updateCardAfterCatch(drawerPokemon.number);
      closeCatchDrawer();
      if (!els.modalOverlay.hidden && currentModalPokemonNumber === savedSeenNum) {
        if (savedSeenVts.some(vt => vt.includes('mega'))) pendingIllusTab = 'Méga-Évolution';
        else if (savedSeenVts.some(vt => vt.startsWith('alolan'))) pendingIllusTab = 'Formes régionales';
        else if (savedSeenVts.some(vt => vt.includes('gigamax'))) pendingIllusTab = 'Gigamax';
        openModal(savedSeenNum);
      }
    } catch (err) {
      console.error('[saveCatchFromMain seen]', err);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Marquer comme vu';
      alert('Erreur : ' + (err?.message || JSON.stringify(err)));
    }
    return;
  }

  if (!drawerBall) { alert('Choisis une Ball.'); return; }

  const formsToCapture = drawerForms.length ? drawerForms : (drawerForm ? [drawerForm] : []);
  if (!formsToCapture.length) return;

  const saveBtn = $('save-catch-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Sauvegarde…';

  const date  = $('catch-date').value || new Date().toISOString().slice(0, 10);
  const game  = drawerGame?.name || $('catch-game')?.value.trim() || null;
  const notes = $('catch-notes')?.value.trim() || null;

  let lastData  = null;
  let lastError = null;

  const sessionId = crypto.randomUUID();

  for (const form of formsToCapture) {
    const isShiny = form.variant_type?.includes('shiny') || false;
    const sprite  = form.sprite
      ? normalizeVariantUrl(form.sprite)
      : (isShiny
          ? (drawerPokemon.iconShiny  ? normalizeVariantUrl(drawerPokemon.iconShiny)  : spriteUrl(drawerPokemon.number, true))
          : (drawerPokemon.iconNormal ? normalizeVariantUrl(drawerPokemon.iconNormal) : spriteUrl(drawerPokemon.number, false)));
    const { data, error } = await insertCatch({
      owner_uuid:      getOwnerUuid(),
      pokemon_number:  drawerPokemon.number,
      pokemon_name_fr: drawerPokemon.name_fr,
      is_shiny:        isShiny,
      sprite_url:      sprite,
      form_label:      form.label || (isShiny ? 'Shiny' : 'Normale'),
      ball_name:       drawerBall.name,
      ball_image_url:  ballUrl(drawerBall.slug),
      caught_at:       date,
      game,
      notes,
      session_id:      sessionId,
    });
    if (error) { lastError = error; break; }
    lastData = data;
    await addToSeen(drawerPokemon.number, {
      variant_type: form.variant_type || 'normal',
      status:       'owned',
      form_label:   form.label || (isShiny ? 'Shiny' : 'Normale'),
      is_shiny:     isShiny,
      sprite_url:   sprite,
      caught_at:    date,
      game,
    });
  }

  if (lastError) {
    console.error(lastError);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Sauvegarder';
    alert('Erreur lors de la sauvegarde.');
    return;
  }

  const savedCatchNum = drawerPokemon.number;
  const savedCatchVts = formsToCapture.map(f => f.variant_type || '');
  catchByNumber[drawerPokemon.number] = lastData;
  if (lastData?.is_shiny) shinyCatchByNumber[drawerPokemon.number] = lastData;
  if (!variantMap[drawerPokemon.number]) {
    fetchVariantMap([drawerPokemon.number]).then(m => { Object.assign(variantMap, m); });
  }
  if (drawerPokemon.isSpecial && drawerPokemon.specialFormKey && !specialFormsMap[drawerPokemon.number]?.[drawerPokemon.specialFormKey]) {
    fetchSpecialFormsForNumbers([drawerPokemon.number]).then(m => { Object.assign(specialFormsMap, m); });
  }
  updateCapturedCounter();
  updateCardAfterCatch(drawerPokemon.number);
  closeCatchDrawer();
  if (!els.modalOverlay.hidden && currentModalPokemonNumber === savedCatchNum) {
    if (savedCatchVts.some(vt => vt.includes('mega'))) pendingIllusTab = 'Méga-Évolution';
    else if (savedCatchVts.some(vt => vt.startsWith('alolan'))) pendingIllusTab = 'Formes régionales';
    else if (savedCatchVts.some(vt => vt.includes('gigamax'))) pendingIllusTab = 'Gigamax';
    openModal(savedCatchNum);
  }
}

// ── Ouvre le drawer pré-rempli avec un Pokémon ────────────────

async function openDrawerWithPokemon(number) {
  const catch_ = catchByNumber[number] || null;
  const mode   = catch_ ? 'caught' : 'seen';

  let pokemon = state.pokemon.find(p => p.number === number);
  if (!pokemon) {
    const { data } = await fetchPokemonByNumber(number).catch(() => ({ data: null }));
    if (!data) return;
    pokemon = data;
  }

  const ico = iconCache[number] || {};

  openCatchDrawer(mode);

  drawerPokemon = {
    number:     pokemon.number,
    name_fr:    pokemon.name_fr,
    iconNormal: ico.normal || null,
    iconShiny:  ico.shiny  || null,
  };

  const src = drawerPokemon.iconNormal
    ? normalizeVariantUrl(drawerPokemon.iconNormal)
    : spriteUrl(pokemon.number, false);

  const searchInp = $('poke-search');
  const sel       = $('selected-pokemon');
  if (searchInp) searchInp.value = pokemon.name_fr;
  if (sel) {
    sel.innerHTML = `
      <img id="drawer-poke-img" src="${esc(src)}" width="52" height="52"
           alt="${esc(pokemon.name_fr)}" style="image-rendering:pixelated">
      <div>
        <div style="font-size:0.65rem;color:var(--text-muted)">#${esc(padNumber(pokemon.number))}</div>
        <div style="font-weight:700">${esc(pokemon.name_fr)}</div>
      </div>`;
    sel.hidden = false;
  }

  // Formes déjà enregistrées → pré-sélection
  const savedVts = seenMap[number] ? Object.keys(seenMap[number]) : [];

  const [variantData, megaData] = await Promise.all([
    fetchVariants(pokemon.number).catch(() => []),
    fetchMegaEvolutions([pokemon.number]).catch(() => []),
  ]);
  renderDrawerForms(variantData, ico, megaData, savedVts);

  // Pré-remplir ball, date, jeu
  if (catch_) {
    const ballEntry = BALLS.find(b => b.name === catch_.ball_name);
    if (ballEntry) {
      const ballBtn = $('ball-grid')?.querySelector(`[data-slug="${ballEntry.slug}"]`);
      if (ballBtn) {
        $('ball-grid').querySelectorAll('.ball-opt').forEach(b => b.classList.remove('selected'));
        ballBtn.classList.add('selected');
        drawerBall = ballEntry;
      }
    }
    if (catch_.caught_at) $('catch-date').value = catch_.caught_at;
    if (catch_.game) {
      const gameEntry = GAMES.find(g => g.name === catch_.game);
      if (gameEntry) {
        const gameBtn = $('game-grid')?.querySelector(`[data-slug="${gameEntry.slug}"]`);
        if (gameBtn) {
          $('game-grid').querySelectorAll('.game-opt').forEach(b => b.classList.remove('selected'));
          gameBtn.classList.add('selected');
          drawerGame = gameEntry;
        }
      } else {
        $('catch-game').value = catch_.game;
      }
    }
    if (catch_.notes) $('catch-notes').value = catch_.notes;
  } else if (savedVts.length > 0) {
    const firstForm = seenMap[number][savedVts[0]];
    if (firstForm?.caught_at) $('catch-date').value = firstForm.caught_at;
    if (firstForm?.game) {
      const gameEntry = GAMES.find(g => g.name === firstForm.game);
      if (gameEntry) {
        const gameBtn = $('game-grid')?.querySelector(`[data-slug="${gameEntry.slug}"]`);
        if (gameBtn) {
          $('game-grid').querySelectorAll('.game-opt').forEach(b => b.classList.remove('selected'));
          gameBtn.classList.add('selected');
          drawerGame = gameEntry;
        }
      } else {
        $('catch-game').value = firstForm.game;
      }
    }
  }
}

