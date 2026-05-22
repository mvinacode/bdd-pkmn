# PokéDex — Base de données

## Structure
```
bdd_pkmn/
├── index.html              ← page principale
├── schema.sql              ← schéma Supabase (à exécuter 1 fois)
├── css/
│   ├── styles.css          ← design global
│   └── types.css           ← couleurs par type Pokémon
└── js/
    ├── config.js           ← ⚠️ à remplir avec tes clés
    ├── supabase-client.js  ← requêtes DB
    ├── app.js              ← logique UI
    └── populate.js         ← script de peuplement (1 fois)
```

## Mise en place

### 1. Supabase
1. Crée un projet sur [supabase.com](https://supabase.com)
2. Va dans **SQL Editor** et exécute le contenu de `schema.sql`
3. Copie ton **Project URL** et ta **anon key** (Settings → API)
4. Colle-les dans `js/config.js`

### 2. Cloudinary
1. Crée un compte sur [cloudinary.com](https://cloudinary.com)
2. Copie ton **Cloud Name** dans `js/config.js`
3. Upload les images dans un dossier `pokemon/` (nommées `1.png`, `2.png`, etc.)

### 3. Peupler la base
1. Ouvre `index.html` dans un navigateur (via un serveur local)
2. Ouvre la console (F12)
3. Lance :
   ```js
   await populateDatabase(1, 151)   // Gen 1 pour tester
   await populateDatabase()          // Tous les 1025 Pokémon
   ```
   ⚠️ Active d'abord la policy INSERT temporaire dans Supabase (voir schema.sql)

### 4. Lancer le site
Ouvre `index.html` — utilise un serveur local pour éviter les restrictions CORS :
```bash
# Python
python -m http.server 8080

# Node
npx serve .
```
