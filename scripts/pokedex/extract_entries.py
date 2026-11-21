"""Extrait, pour chaque Pokémon, les descriptions Pokédex de sa forme de base.

Lit le wikitexte récupéré par fetch_pokepedia.py (page principale + sous-pages
de génération), isole les sections « Descriptions du Pokédex », ne garde que la
forme de base quand les entrées sont découpées par forme, nettoie la syntaxe
wiki et dédoublonne les textes identiques.

Usage : python -I extract_entries.py <noms.json> <pages.json> <sortie.json>
  sortie.json : { "313": { "name_fr": "Muciole", "entries": ["…", …] }, … }
"""
import json
import re
import sys

# Formes purement esthétiques ou sexes : toutes décrivent le Pokémon de base.
MERGE_ALL_FORMS = {
    "Mistigrix", "Wimessir", "Paragruel", "Fragroin", "Vivaldaim", "Haydaim",
    "Flabébé", "Floette", "Florges", "Prismillon", "Pitrouille", "Banshitrouye",
    "Charmilly", "Tapatoès", "Famignol", "Deusolourdo", "Sancoki", "Tritosor", "Bargantua",
}
# Formes à exclure même en fusion (variantes spéciales ou régionales).
EXCLUDED_FORMS = {"Éternelle", "Motif Blanc"}
# Forme de base quand ce n'est pas la première listée (l'ordre varie selon les pages).
BASE_FORM = {"Zygarde": "Forme 50 %", "Théffroi": "Contrefaçon", "Polthégeist": "Contrefaçon"}

HEADING = re.compile(r"^(=+)\s*(.*?)\s*\1\s*$")
# Notes des rédacteurs de Poképédia, pas des entrées du Pokédex.
EDITORIAL_NOTE = re.compile(r"^En l'absence de Pokédex national, ce Pokémon n'a pas de description", re.I)


def descriptions_section(wikitext):
    m = re.search(r"^(=+)\s*Descriptions du (?:\[\[Pokédex\]\]|Pokédex)\s*\1\s*$", wikitext, re.M)
    if not m:
        return None
    level = len(m.group(1))
    rest = wikitext[m.end():]
    end = re.search(r"^={2,%d}[^=]" % level, rest, re.M)
    return rest[:end.start()] if end else rest


def split_by_form(section):
    """[(nom de forme ou None, [lignes])] dans l'ordre de la page."""
    parts, current = [], (None, [])
    for line in section.splitlines():
        h = HEADING.match(line.strip())
        if h:
            parts.append(current)
            current = (h.group(2).strip(), [])
        else:
            current[1].append(line)
    parts.append(current)
    return [p for p in parts if p[0] is not None or any(l.strip() for l in p[1])]


def base_form_lines(species, section):
    parts = split_by_form(section)
    untitled = [l for name, lines in parts if name is None for l in lines]
    forms = [(name, lines) for name, lines in parts if name is not None]
    if not forms:
        return untitled
    if species in MERGE_ALL_FORMS:
        return untitled + [l for name, lines in forms if name not in EXCLUDED_FORMS for l in lines]
    wanted = BASE_FORM.get(species)
    chosen = next((lines for name, lines in forms if wanted and name.lower() == wanted.lower()), forms[0][1])
    return untitled + chosen


def clean(text):
    t = text
    t = re.sub(r"<ref[^>]*/>|<ref[^>]*>.*?</ref>", "", t, flags=re.S)
    t = re.sub(r"<sup>.*?</sup>", "", t, flags=re.S)
    t = re.sub(r"<br\s*/?>", " ", t)
    t = re.sub(r"</?[a-zA-Z][^>]*>", "", t)
    for _ in range(3):  # modèles imbriqués ({{PCap|[[Lumivole]]}})
        t = re.sub(r"\{\{(?:PCap|Sc|sc|Pc|pc|Petites capitales|nobr|Nobr)\|([^{}]*)\}\}", r"\1", t)
    t = re.sub(r"\[\[(?:[^]|]*\|)?([^]]*)\]\]", r"\1", t)
    t = re.sub(r"\{\{[^{}]*\}\}", "", t)
    t = t.replace("'''", "").replace("''", "")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def entries_of(lines):
    out = []
    for line in lines:
        s = line.strip()
        if s.startswith(":"):
            text = clean(s.lstrip(":"))
            if text and not EDITORIAL_NOTE.match(text):
                out.append(text)
    return out


def dedupe(entries):
    seen, out = set(), []
    for e in entries:
        key = re.sub(r"[\W_]+", "", e.lower())
        if key and key not in seen:
            seen.add(key)
            out.append(e)
    return out


def main(names_path, pages_path, out_path):
    pokemon = json.load(open(names_path, encoding="utf-8"))
    pages = json.load(open(pages_path, encoding="utf-8"))
    result = {}
    for p in pokemon:
        name = p["name_fr"]
        titles = [f"{name}/Génération {g}" for g in range(p["generation"], 9)] + [name]  # du plus ancien au plus récent
        entries = []
        for t in titles:
            section = descriptions_section(pages.get(t) or "")
            if section:
                entries += entries_of(base_form_lines(name, section))
        result[str(p["number"])] = {"name_fr": name, "entries": dedupe(entries)}
    json.dump(result, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    empty = [f'#{n} {v["name_fr"]}' for n, v in result.items() if not v["entries"]]
    counts = [len(v["entries"]) for v in result.values()]
    print(f"{len(result)} Pokémon ; entrées par Pokémon : min {min(counts)}, max {max(counts)}, "
          f"moyenne {sum(counts) / len(counts):.1f} ; sans entrée : {empty or 'aucun'}", file=sys.stderr)


if __name__ == "__main__":
    main(*sys.argv[1:4])
