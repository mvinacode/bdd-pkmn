/**
 * UTILS.JS — Fonctions utilitaires partagées entre app.js et catches.js
 */


const BALLS = [
  { name: 'Poké Ball',    slug: 'poke-ball', customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779138950/poke_ball_gdlzec.png' },
  { name: 'Super Ball',   slug: 'great-ball',   customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779544047/super_ball_hljkjm.png' },
  { name: 'Hyper Ball',   slug: 'ultra-ball',   customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779557250/hyper_ball_gkxwfs.png' },
  { name: 'Master Ball',  slug: 'master-ball',  customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779568469/master_ball_cj1rzg.png' },
  { name: 'Safari Ball',  slug: 'safari-ball',  customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779568476/safari_ball_dqzmhg.png' },
  { name: 'Ball Sombre',  slug: 'dusk-ball'    },
  { name: 'Ball Rapide',  slug: 'quick-ball'   },
  { name: 'Ball Chrono',  slug: 'timer-ball'   },
  { name: 'Ball Filet',   slug: 'net-ball'     },
  { name: 'Ball Plongée', slug: 'dive-ball'    },
  { name: 'Ball Nid',     slug: 'nest-ball'    },
  { name: 'Ball Répét',   slug: 'repeat-ball'  },
  { name: 'Ball Luxe',    slug: 'luxury-ball'  },
  { name: 'Ball Soin',    slug: 'heal-ball'    },
  { name: 'Ball Rêve',    slug: 'dream-ball'   },
  { name: 'Ball Amis',    slug: 'friend-ball'  },
  { name: 'Ball Lune',    slug: 'moon-ball'    },
  { name: 'Ball Faiblo',  slug: 'level-ball'   },
  { name: 'Ball Lasso',   slug: 'lure-ball'    },
  { name: 'Ball Amour',   slug: 'love-ball'    },
  { name: 'Ball Lourde',  slug: 'heavy-ball'   },
  { name: 'Ball Rapido',  slug: 'fast-ball'    },
];

function ballUrl(slug) {
  const custom = BALLS.find(b => b.slug === slug)?.customUrl;
  return custom || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;
}

function spriteUrl(number, shiny) {
  return shiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${number}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${number}.png`;
}

function getOwnerUuid() {
  return window._ownerUuid || null;
}

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
