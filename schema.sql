-- ============================================================
-- SCHÉMA SUPABASE — PokéDex
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- (Dashboard → SQL Editor → New query)
-- ============================================================

-- ── Table principale ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pokemon (
  id             SERIAL PRIMARY KEY,
  number         INTEGER UNIQUE NOT NULL,        -- numéro national
  name_fr        TEXT    NOT NULL,
  name_en        TEXT    NOT NULL,
  generation     SMALLINT NOT NULL CHECK (generation BETWEEN 1 AND 9),
  image_url           TEXT,                       -- URL Cloudinary (ou fallback PokeAPI)
  shiny_artwork_url   TEXT,                       -- illustration shiny (artwork Cloudinary)
  description_fr      TEXT,                       -- description Pokédex en français
  evolves_from_number INTEGER,                    -- numéro du pré-évolution
  evolution_condition TEXT,                       -- condition d'évolution vers ce Pokémon (ex: 'Niv. 16')
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table des types ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pokemon_types (
  pokemon_id INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
  type_name  TEXT    NOT NULL,
  slot       SMALLINT NOT NULL CHECK (slot IN (1, 2)),
  PRIMARY KEY (pokemon_id, slot)
);

-- ── Index pour les performances ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pokemon_number     ON pokemon (number);
CREATE INDEX IF NOT EXISTS idx_pokemon_generation ON pokemon (generation);
CREATE INDEX IF NOT EXISTS idx_pokemon_name_fr    ON pokemon USING GIN (to_tsvector('french', name_fr));
CREATE INDEX IF NOT EXISTS idx_pokemon_name_en    ON pokemon USING GIN (to_tsvector('english', name_en));
CREATE INDEX IF NOT EXISTS idx_pokemon_types_name ON pokemon_types (type_name);

-- ── Row Level Security (RLS) ────────────────────────────────
-- Active la RLS sur les deux tables
ALTER TABLE pokemon       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon_types ENABLE ROW LEVEL SECURITY;

-- Politique lecture publique (anon + authenticated)
-- On n'autorise QUE le SELECT — pas de write depuis le client
CREATE POLICY "lecture_publique_pokemon"
  ON pokemon
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "lecture_publique_types"
  ON pokemon_types
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ⚠️ Aucune politique INSERT/UPDATE/DELETE côté client.
-- Le script populate.js utilise la clé ANON via l'interface Supabase.
-- Pour peupler la base, utilise le service_role KEY uniquement depuis
-- un environnement sécurisé (populate.js côté navigateur fonctionne
-- si tu ajoutes temporairement une policy INSERT pour anon, à supprimer ensuite).

-- Policy temporaire pour populate (à supprimer après peuplement) :
-- CREATE POLICY "insert_temporaire"
--   ON pokemon FOR INSERT TO anon WITH CHECK (true);
-- CREATE POLICY "insert_types_temporaire"
--   ON pokemon_types FOR INSERT TO anon WITH CHECK (true);

-- ── Méga-évolutions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pokemon_mega_evolutions (
  id             SERIAL PRIMARY KEY,
  pokemon_number INTEGER NOT NULL,               -- numéro du Pokémon de base
  name           TEXT    NOT NULL,               -- ex: 'Méga-Florizarre'
  condition_label TEXT   NOT NULL,               -- ex: 'Florizarrite'
  image_url      TEXT,                           -- icône pour la chaîne d'évolution
  item_image_url TEXT,                           -- image de la pierre/objet méga (ex: icône Florizarrite)
  artwork_url    TEXT,                           -- illustration principale affichée dans la modal
  description_fr TEXT,                           -- description Pokédex de la méga-évolution
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mega_number ON pokemon_mega_evolutions (pokemon_number);
ALTER TABLE pokemon_mega_evolutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lecture_publique_mega"
  ON pokemon_mega_evolutions FOR SELECT TO anon, authenticated USING (true);

-- ── Formes Gigamax ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pokemon_gigamax (
  id             SERIAL PRIMARY KEY,
  pokemon_number INTEGER NOT NULL,
  name           TEXT    NOT NULL,
  description_fr TEXT,
  artwork_url    TEXT,
  sort_order     SMALLINT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gigamax_number ON pokemon_gigamax (pokemon_number);
ALTER TABLE pokemon_gigamax ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lecture_publique_gigamax"
  ON pokemon_gigamax FOR SELECT TO anon, authenticated USING (true);

-- ── Table des variantes (mâle/femelle, shiny, formes custom) ─
CREATE TABLE IF NOT EXISTS pokemon_variants (
  id             SERIAL PRIMARY KEY,
  pokemon_number INTEGER  NOT NULL,
  variant_type   TEXT     NOT NULL,   -- 'male', 'female', 'shiny', 'shiny_female', 'custom'…
  label          TEXT     NOT NULL,   -- Texte affiché : 'Mâle', 'Femelle', 'Shiny'…
  image_url      TEXT     NOT NULL,   -- URL Cloudinary
  sort_order     SMALLINT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_number ON pokemon_variants (pokemon_number);

ALTER TABLE pokemon_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecture_publique_variants"
  ON pokemon_variants
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── Vue pratique : pokemon avec ses types ───────────────────
CREATE OR REPLACE VIEW pokemon_with_types AS
SELECT
  p.*,
  ARRAY_AGG(pt.type_name ORDER BY pt.slot) AS types
FROM pokemon p
LEFT JOIN pokemon_types pt ON pt.pokemon_id = p.id
GROUP BY p.id;
