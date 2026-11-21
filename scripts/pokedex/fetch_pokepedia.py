"""Récupère le wikitexte des pages Poképédia d'une plage de Pokémon.

Pour chaque Pokémon : la page principale (générations récentes) et ses
sous-pages « <Nom>/Génération N » (générations anciennes), qui contiennent les
sections « Descriptions du Pokédex ». Les pages sont lues par lots via l'API
MediaWiki, avec une pause entre les requêtes pour ménager le serveur.

Usage : python -I fetch_pokepedia.py <noms.json> <sortie.json>
  noms.json : [{"number": 313, "name_fr": "Muciole", "generation": 3}, …]
  sortie.json : { "<titre de page>": "<wikitexte>" } (complété si déjà présent)
"""
import gzip
import json
import sys
import time
import urllib.parse
import urllib.request

API = "https://www.pokepedia.fr/api.php"
USER_AGENT = "bdd-pkmn-pokedex-fetch/1.0 (script personnel, lecture seule)"
BATCH = 20          # titres par requête
PAUSE_S = 1.0       # pause entre deux requêtes
LAST_SUBPAGE_GENERATION = 8   # la génération 9 est sur la page principale


def api_get(params):
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json", "formatversion": "2"})
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Encoding": "gzip"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read()
                if resp.headers.get("Content-Encoding") == "gzip":
                    raw = gzip.decompress(raw)
                return json.loads(raw.decode("utf-8"))
        except Exception as exc:  # réseau capricieux : on réessaie en ralentissant
            wait = 5 * (attempt + 1)
            print(f"  ! {exc} — nouvel essai dans {wait} s", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError(f"échec définitif : {url}")


def fetch_contents(titles):
    """Wikitexte de chaque titre existant (les redirections sont suivies)."""
    out = {}
    for i in range(0, len(titles), BATCH):
        batch = titles[i:i + BATCH]
        data = api_get({"action": "query", "prop": "revisions", "rvprop": "content",
                        "rvslots": "main", "redirects": "1", "titles": "|".join(batch)})
        query = data.get("query", {})
        # Titre demandé → titre réel (redirections et normalisations)
        alias = {t: t for t in batch}
        for key in ("normalized", "redirects"):
            for m in query.get(key, []):
                for src, dst in alias.items():
                    if dst == m["from"]:
                        alias[src] = m["to"]
        by_title = {p["title"]: p for p in query.get("pages", [])}
        for asked, real in alias.items():
            page = by_title.get(real)
            # None = page inexistante, mémorisée pour ne pas la redemander
            out[asked] = page["revisions"][0]["slots"]["main"]["content"] if page and not page.get("missing") else None
        print(f"  {min(i + BATCH, len(titles))}/{len(titles)} pages", file=sys.stderr)
        time.sleep(PAUSE_S)
    return out


def main(names_path, out_path):
    with open(names_path, encoding="utf-8") as f:
        pokemon = json.load(f)
    try:
        with open(out_path, encoding="utf-8") as f:
            pages = json.load(f)
    except FileNotFoundError:
        pages = {}

    wanted = []
    for p in pokemon:
        name = p["name_fr"]
        wanted.append(name)
        wanted += [f"{name}/Génération {g}" for g in range(p["generation"], LAST_SUBPAGE_GENERATION + 1)]
    todo = [t for t in wanted if t not in pages]
    print(f"{len(todo)} pages à lire ({len(wanted) - len(todo)} déjà en cache)", file=sys.stderr)
    pages.update(fetch_contents(todo))

    missing = [p["name_fr"] for p in pokemon if not pages.get(p["name_fr"])]
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(pages, f, ensure_ascii=False)
    print(f"{sum(1 for v in pages.values() if v)} pages enregistrées ; pages principales introuvables : {missing or 'aucune'}", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
