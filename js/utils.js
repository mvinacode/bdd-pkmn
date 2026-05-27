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
  { name: 'Parc Ball',    slug: 'parc-ball',    customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779666243/parc_ball_ypcqqg.png' },
  { name: 'Rapide Ball',  slug: 'quick-ball',   customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779669583/rapide_ball_m2brxb.png' },
  { name: 'Soin Ball',   slug: 'heal-ball',    customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779722922/soin_ball_szdgxf.png' },
  { name: 'Sombre Ball',  slug: 'dusk-ball',    customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779731066/sombre_ball_wm6o1p.png' },
  { name: 'Rêve Ball',    slug: 'dream-ball',   customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779759940/reve_ball_opjnxa.png' },
  { name: 'Ultra Ball',   slug: 'ultra-ball-custom', customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779829455/ultra_ball_ciwfom.png' },
  { name: 'Étrange Ball',       slug: 'etrange-ball',       customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779836157/etrange_wx0z4h.png' },
  { name: 'Poké Ball (Ancienne)',  slug: 'poke-ball-ancienne',  customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779839863/poke_ball_ancienne_ewtcwy.png' },
  { name: 'Super Ball (Ancienne)', slug: 'super-ball-ancienne', customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779887300/super_ball_ancienne_l0tjfi.png' },
  { name: 'Hyper Ball (Ancienne)', slug: 'hyper-ball-ancienne', customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779889427/hyper_ball_ancienne_tvfu1i.png' },
  { name: 'Masse Ball (Ancienne)', slug: 'masse-ball-ancienne', customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779890324/masse_ball_ancienne_iyvwiq.png' },
  { name: 'Mégamasse Ball',        slug: 'megamasse-ball',      customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779891449/megamasse_ball_wb6cza.png' },
  { name: 'Gigamasse Ball',        slug: 'gigamasse-ball',      customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779893098/gigamasse_ball_xmnm6z.png' },
  { name: 'Plume Ball',            slug: 'plume-ball',          customUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779829453/plume_ball_efk2is.png' },
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
  { name: 'Pokémon Violet',           slug: 'violet',      abbr: 'Violet',   iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779893340/pokemon_violet_nel5xl.png' },
  { name: 'Pokémon Écarlate',         slug: 'ecarlate',    abbr: 'Écarlate', iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779644647/pokemon_ecarlate_icon_futxba.png' },
  { name: 'Légendes Pokémon : Arceus',  slug: 'legendes-arceus',   abbr: 'Arceus',   iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779891563/legendes_pokemon_arceus_icon_ayeylt.png' },
  { name: 'Pokémon Perle Scintillante', slug: 'perle-scintillante', abbr: 'Perle',    iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779890262/pokemon_perle_scintillante_icon_bbdt9f.png' },
  { name: 'Pokémon Diamant Étincelant', slug: 'diamant-etincelant', abbr: 'Diamant',  iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779647806/pokemon_diamant_etincelant_icon_mhvpgl.png' },
  { name: 'Pokémon HOME',              slug: 'home',               abbr: 'HOME',     iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779647676/pokemon_home_icon_ja3vfq.png' },
  { name: 'Pokémon Bouclier',        slug: 'bouclier',    abbr: 'Bouclier', iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779644365/pokemon_bouclier_icon_tzqgfp.png' },
  { name: 'Pokémon Épée',            slug: 'epee',        abbr: 'Épée',     iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779646193/pokemon_epee_q42rre.png' },
  { name: "Pokémon Let's Go, Évoli",   slug: 'lets-go-evoli',  abbr: "Let's Go Évoli",  iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779889329/pokemon_let_s_go_evoli_icon_qgnkas.png' },
  { name: "Pokémon Let's Go, Pikachu", slug: 'lets-go-pikachu', abbr: "Let's Go Pikachu", iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779644943/pokemon_let_s_go_pikachu_icon_la54se.png' },
  { name: 'Pokémon GO',                slug: 'pokemon-go',      abbr: 'GO',       iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779651651/pokemon_go_icon_muwgte.png' },
  { name: 'Pokémon Ultra-Lune',          slug: 'ultra-lune',      abbr: 'Ultra-Lune',iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779887447/pokemon_ultra_lune_icon_vzbpsj.png' },
  { name: 'Pokémon Ultra-Soleil',        slug: 'ultra-soleil',    abbr: 'Ultra-Sol', iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779840127/pokemon_ultra_soleil_ypcr6n.png' },
  { name: 'Pokémon Lune',               slug: 'lune',            abbr: 'Lune',     iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779836279/pokemon_lune_wr0kkn.png' },
  { name: 'Pokémon Soleil',             slug: 'soleil',          abbr: 'Soleil',   iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779760088/pokemon_soleil_r6o19h.png' },
  { name: 'Pokémon Saphir Alpha',       slug: 'saphir-alpha',    abbr: 'Saphir α', iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779731368/pokemon_saphir_alpha_icon_bmztft.png' },
  { name: 'Pokémon Rubis Oméga',       slug: 'rubis-omega',     abbr: 'Rubis Ω', iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779723156/pokemon_rubis_omega_icon_laspo7.png' },
  { name: 'Banque Pokémon',            slug: 'banque',          abbr: 'Banque',   iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779644810/banque_pokemon_icon_r7odmb.png' },
  { name: 'Pokémon Y',                slug: 'pokemon-y',       abbr: 'Y',        iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779669718/pokemon_y_pgk823.png' },
  { name: 'Pokémon X',                slug: 'pokemon-x',       abbr: 'X',        iconUrl: 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1779666515/pokemon_x_uopvkn.png' },
];

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
