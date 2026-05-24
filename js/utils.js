/**
 * UTILS.JS — Fonctions utilitaires partagées entre app.js et catches.js
 */


const BALLS = [
  { name: 'Poké Ball',    slug: 'poke-ball', customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779138950/poke_ball_gdlzec.png' },
  { name: 'Super Ball',   slug: 'great-ball',   customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779544047/super_ball_hljkjm.png' },
  { name: 'Hyper Ball',   slug: 'ultra-ball',   customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779557250/hyper_ball_gkxwfs.png' },
  { name: 'Master Ball',  slug: 'master-ball',  customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779568469/master_ball_cj1rzg.png' },
  { name: 'Safari Ball',  slug: 'safari-ball',  customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779568476/safari_ball_dqzmhg.png' },
  { name: 'Appât Ball',   slug: 'lure-ball',    customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779580833/appat_ball_abt6ht.png' },
  { name: 'Compét\'Ball', slug: 'sport-ball',   customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779582026/compet_ball_u51bqm.png' },
  { name: 'Copain Ball',  slug: 'friend-ball',  customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779583496/copain_ball_hghbhx.png' },
  { name: 'Love Ball',    slug: 'love-ball',    customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779631945/love_ball_lyb7p4.png' },
  { name: 'Lune Ball',    slug: 'moon-ball',    customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779632242/lune_ball_y1vigy.png' },
  { name: 'Masse Ball',   slug: 'heavy-ball',   customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779632373/masse_ball_w34nu6.png' },
  { name: 'Niveau Ball',  slug: 'niveau-ball',  customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779632508/niveau_ball_egczxn.png' },
  { name: 'Speed Ball',   slug: 'fast-ball',    customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779632633/speed_ball_mmnqgx.png' },
  { name: 'Bis Ball',     slug: 'repeat-ball',  customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779632763/bis_ball_acwciq.png' },
  { name: 'Chrono Ball',  slug: 'timer-ball',   customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779632819/chrono_ball_m6lo5c.png' },
  { name: 'Faiblo Ball',  slug: 'nest-ball',    customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779632918/faiblo_ball_xe40yd.png' },
  { name: 'Filet Ball',   slug: 'net-ball',     customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779633038/filet_ball_fpci4m.png' },
  { name: 'Honor Ball',   slug: 'honor-ball',   customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779633086/honor_ball_zakfok.png' },
  { name: 'Luxe Ball',    slug: 'luxury-ball',  customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779646088/luxe_ball_gim1kx.png' },
  { name: 'Scuba Ball',   slug: 'dive-ball',    customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779647360/scuba_ball_sasxeh.png' },
  { name: 'Mémoire Ball', slug: 'memoire-ball', customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779650888/memoire_ball_c7k3q5.png' },
  { name: 'Ball Sombre',  slug: 'dusk-ball'    },
  { name: 'Ball Rapide',  slug: 'quick-ball'   },
  { name: 'Ball Soin',    slug: 'heal-ball'    },
  { name: 'Ball Rêve',    slug: 'dream-ball'   },

  { name: 'Ball Faiblo',  slug: 'level-ball'   },
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

const GAMES = [
  { name: 'Légendes Pokémon : Z-A', slug: 'legendes-za', abbr: 'Z-A',      iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779641869/legendes_pkmn_z_a_icon_bqvbys.png' },
  { name: 'Pokémon Écarlate',         slug: 'ecarlate',    abbr: 'Écarlate', iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779644647/pokemon_ecarlate_icon_futxba.png' },
  { name: 'Pokémon Diamant Étincelant', slug: 'diamant-etincelant', abbr: 'Diamant',  iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779647806/pokemon_diamant_etincelant_icon_mhvpgl.png' },
  { name: 'Pokémon HOME',              slug: 'home',               abbr: 'HOME',     iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779647676/pokemon_home_icon_ja3vfq.png' },
  { name: 'Pokémon Bouclier',        slug: 'bouclier',    abbr: 'Bouclier', iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779644365/pokemon_bouclier_icon_tzqgfp.png' },
  { name: 'Pokémon Épée',            slug: 'epee',        abbr: 'Épée',     iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779646193/pokemon_epee_q42rre.png' },
  { name: "Pokémon Let's Go, Pikachu", slug: 'lets-go-pikachu', abbr: "Let's Go", iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779644943/pokemon_let_s_go_pikachu_icon_la54se.png' },
  { name: 'Banque Pokémon',            slug: 'banque',          abbr: 'Banque',   iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779644810/banque_pokemon_icon_r7odmb.png' },
];

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
