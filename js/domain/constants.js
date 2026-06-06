import { esc } from '../utils.js';

export const TYPE_FR = {
  normal:'Normal', fire:'Feu', water:'Eau', electric:'Électrik',
  grass:'Plante', ice:'Glace', fighting:'Combat', poison:'Poison',
  ground:'Sol', flying:'Vol', psychic:'Psy', bug:'Insecte',
  rock:'Roche', ghost:'Spectre', dragon:'Dragon', dark:'Ténèbres',
  steel:'Acier', fairy:'Fée',
};

export const TYPE_IMAGES = {
  normal:  'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779645471/normal_ersviy.png',
  grass:   'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779555831/plante_mfw11z.png',
  poison:  'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779555976/poison_efsrlh.png',
  fire:    'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779555975/feu_v9z2lm.png',
  water:   'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779574460/eau_fruvvb.png',
  flying:  'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779555974/vol_u7plhv.png',
  dragon:  'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779555977/dragon_nbjoqm.png',
  fighting:'https://res.cloudinary.com/dkgfa4apm/image/upload/v1780260718/combat_evf0gc.png',
  ghost:   'https://res.cloudinary.com/dkgfa4apm/image/upload/v1780261056/spectre_t6b8l6.png',
  dark:    'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779662872/tenebres_c99vof.png',
  bug:     'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779580557/insecte_rccof2.png',
  electric:'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779759222/electrick_zuuwdo.png',
  psychic: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779823368/psy_sxgmlp.png',
  ice:     'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779833043/glace_rzyq3f.png',
  steel:   'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779833041/acier_zwph2k.png',
  ground:  'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779835148/sol_kqatjb.png',
  rock:    'https://res.cloudinary.com/dkgfa4apm/image/upload/v1780510452/roche_kfg7gw.png',
  fairy:   'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779893032/fee_dfkdmp.png',
};

export const MEGA_ICON_URL    = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779128811/mega_evolution_t9nlsa.svg';
export const GIGAMAX_ICON_URL = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779128704/gigantamax_yescyy.png';
export const SHINY_ICON_URL   = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779139479/shiny_abqivl.png';
export const BARON_ICON_URL   = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779139486/baron_jvi4lm.png';

// SVG icônes genre — stroke="currentColor" pour la modale
export const MALE_SVG   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
export const FEMALE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;

// Icônes colorées pour les sélecteurs de formes (drawer)
export const ICON_MALE_LG   = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
export const ICON_MALE_SM   = `<svg viewBox="0 0 24 24" fill="none" stroke="#5b9bd5" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="9.5" cy="14.5" r="5.5"/><line x1="13.5" y1="10.5" x2="20" y2="4"/><polyline points="16,4 20,4 20,8"/></svg>`;
export const ICON_FEMALE_LG = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
export const ICON_FEMALE_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="#e07fc0" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`;
export const ICON_UNISEX_LG = `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="26" height="26"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;
export const ICON_UNISEX_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" width="20" height="20"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="22"/></svg>`;
export const ICON_SHINY_SM  = `<img src="${SHINY_ICON_URL}" width="20" height="20" alt="">`;
export const ICON_BARON_LG  = `<img src="${BARON_ICON_URL}" width="28" height="28" alt="">`;
export const ICON_BARON_XS  = `<img src="${BARON_ICON_URL}" width="22" height="22" alt="">`;
export const ICON_MEGA_LG   = `<img src="${MEGA_ICON_URL}" width="28" height="28" alt="">`;
export const ICON_MEGA_SM   = `<img src="${MEGA_ICON_URL}" width="22" height="22" alt="">`;
export const ICON_GMAX_LG   = `<img src="${GIGAMAX_ICON_URL}" width="28" height="28" alt="">`;
export const ICON_GMAX_SM   = `<img src="${GIGAMAX_ICON_URL}" width="22" height="22" alt="">`;

export const SPECIAL_FORM_VT = {
  'Pichu Troizépi Shiny': 'troizepy_shiny',
  'Pichu Troizépi':       'troizepy',
};

export const ALOLA_FORM_VT = {
  'Alola Mâle Shiny':    'alolan_shiny_male',
  'Alola Femelle Shiny': 'alolan_shiny_female',
  'Alola Shiny':         'alolan_shiny',
  'Alola Asexué Shiny': 'alolan_shiny',
  'Alola Mâle':          'alolan_male',
  'Alola Femelle':       'alolan_female',
  'Alola':               'alolan',
  'Alola Asexué':       'alolan',
};

export const GALAR_FORM_VT = {
  'Galar Mâle Shiny':    'galarian_shiny_male',
  'Galar Femelle Shiny': 'galarian_shiny_female',
  'Galar Shiny':         'galarian_shiny',
  'Galar Asexué Shiny': 'galarian_shiny',
  'Galar Mâle':          'galarian_male',
  'Galar Femelle':       'galarian_female',
  'Galar':               'galarian',
  'Galar Asexué':       'galarian',
};

export const HISUI_FORM_VT = {
  'Hisui Mâle Shiny':    'hisuian_shiny_male',
  'Hisui Femelle Shiny': 'hisuian_shiny_female',
  'Hisui Shiny':         'hisuian_shiny',
  'Hisui Asexué Shiny': 'hisuian_shiny',
  'Hisui Mâle':          'hisuian_male',
  'Hisui Femelle':       'hisuian_female',
  'Hisui':               'hisuian',
  'Hisui Asexué':       'hisuian',
};

export const VARIANT_STATUS_META = {
  '':      { label: 'Non vu',  cls: '' },
  'seen':  { label: 'Vu',      cls: 'status-seen' },
  'owned': { label: 'Obtenu',  cls: 'status-owned' },
};

export const GENDER_GROUPS = [
  ['male', 'female'],
  ['shiny_male', 'shiny_female'],
  ['alolan_male', 'alolan_female'],
  ['alolan_shiny_male', 'alolan_shiny_female'],
  ['galarian_male', 'galarian_female'],
  ['galarian_shiny_male', 'galarian_shiny_female'],
  ['hisuian_male', 'hisuian_female'],
  ['hisuian_shiny_male', 'hisuian_shiny_female'],
];
export const GENDER_VTS_FLAT = new Set(GENDER_GROUPS.flat());

export function padNumber(n) { return String(n).padStart(4, '0'); }

export function formatCatchDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatCatchDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
}

export function normalizeVariantUrl(url) {
  return url.replace('/upload/', '/upload/e_trim:10/c_pad,w_128,h_128,b_rgb:ffffff00/');
}

export function getImageUrl(number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${number}.png`;
}

export function toRoman(n) {
  return {1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX'}[n] || String(n);
}

export function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function typeBadge(typeName) {
  if (TYPE_IMAGES[typeName]) {
    return `<img class="type-badge type-badge-img" src="${esc(TYPE_IMAGES[typeName])}" alt="${esc(TYPE_FR[typeName] || typeName)}">`;
  }
  const label = TYPE_FR[typeName] || typeName;
  return `<span class="type-badge ${esc(typeName)}">${esc(label)}</span>`;
}
