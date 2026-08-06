-- ============================================================
-- Insertion des formes de Zarbi (Unown) #201
-- ============================================================

-- 1. Supprime les anciennes données de Zarbi
DELETE FROM pokemon_variants WHERE pokemon_number = 201;
DELETE FROM pokemon_special_forms WHERE pokemon_number = 201;

-- 2. Ajoute les icônes de base dans pokemon_variants (pour la grille)
-- Zarbi est asexué (pas de différence mâle/femelle)
INSERT INTO pokemon_variants (pokemon_number, variant_type, label, image_url, sort_order) VALUES
(201, 'asexue', 'Normale', '', 1),
(201, 'asexue_shiny', 'Shiny', '', 2);

-- 3. Ajoute les 28 formes dans pokemon_special_forms (pour la modal)
INSERT INTO pokemon_special_forms (
  pokemon_number,
  form_key,
  form_label_fr,
  image_url,
  image_url_shiny,
  artwork_url,
  artwork_url_shiny,
  form_group,
  sort_order,
  description_fr
) VALUES
-- Formes A-Z
(201, 'unown_a', 'Forme A', '', '', '', '', 'Zarbidex', 1, NULL),
(201, 'unown_b', 'Forme B', '', '', '', '', 'Zarbidex', 2, NULL),
(201, 'unown_c', 'Forme C', '', '', '', '', 'Zarbidex', 3, NULL),
(201, 'unown_d', 'Forme D', '', '', '', '', 'Zarbidex', 4, NULL),
(201, 'unown_e', 'Forme E', '', '', '', '', 'Zarbidex', 5, NULL),
(201, 'unown_f', 'Forme F', '', '', '', '', 'Zarbidex', 6, NULL),
(201, 'unown_g', 'Forme G', '', '', '', '', 'Zarbidex', 7, NULL),
(201, 'unown_h', 'Forme H', '', '', '', '', 'Zarbidex', 8, NULL),
(201, 'unown_i', 'Forme I', '', '', '', '', 'Zarbidex', 9, NULL),
(201, 'unown_j', 'Forme J', '', '', '', '', 'Zarbidex', 10, NULL),
(201, 'unown_k', 'Forme K', '', '', '', '', 'Zarbidex', 11, NULL),
(201, 'unown_l', 'Forme L', '', '', '', '', 'Zarbidex', 12, NULL),
(201, 'unown_m', 'Forme M', '', '', '', '', 'Zarbidex', 13, NULL),
(201, 'unown_n', 'Forme N', '', '', '', '', 'Zarbidex', 14, NULL),
(201, 'unown_o', 'Forme O', '', '', '', '', 'Zarbidex', 15, NULL),
(201, 'unown_p', 'Forme P', '', '', '', '', 'Zarbidex', 16, NULL),
(201, 'unown_q', 'Forme Q', '', '', '', '', 'Zarbidex', 17, NULL),
(201, 'unown_r', 'Forme R', '', '', '', '', 'Zarbidex', 18, NULL),
(201, 'unown_s', 'Forme S', '', '', '', '', 'Zarbidex', 19, NULL),
(201, 'unown_t', 'Forme T', '', '', '', '', 'Zarbidex', 20, NULL),
(201, 'unown_u', 'Forme U', '', '', '', '', 'Zarbidex', 21, NULL),
(201, 'unown_v', 'Forme V', '', '', '', '', 'Zarbidex', 22, NULL),
(201, 'unown_w', 'Forme W', '', '', '', '', 'Zarbidex', 23, NULL),
(201, 'unown_x', 'Forme X', '', '', '', '', 'Zarbidex', 24, NULL),
(201, 'unown_y', 'Forme Y', '', '', '', '', 'Zarbidex', 25, NULL),
(201, 'unown_z', 'Forme Z', '', '', '', '', 'Zarbidex', 26, NULL),
-- Formes spéciales
(201, 'unown_exclamation', 'Forme !', '', '', '', '', 'Zarbidex', 27, NULL),
(201, 'unown_question', 'Forme ?', '', '', '', '', 'Zarbidex', 28, NULL);

-- Vérifications
SELECT 'pokemon_variants' as table_name, COUNT(*) as count FROM pokemon_variants WHERE pokemon_number = 201
UNION ALL
SELECT 'pokemon_special_forms', COUNT(*) FROM pokemon_special_forms WHERE pokemon_number = 201;

-- Aperçu des formes spéciales
SELECT form_key, form_label_fr, sort_order
FROM pokemon_special_forms
WHERE pokemon_number = 201
ORDER BY sort_order;
