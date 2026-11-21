"""Contrôle les condensations avant écriture en base.

Pour chaque Pokémon : texte présent, un seul paragraphe, longueur plausible,
aucune mention de jeu, et surtout correspondance avec SES entrées : le texte
doit partager plus de vocabulaire avec les entrées de son propre Pokémon
qu'avec celles de n'importe quel autre (détecte un texte rangé sous le mauvais
numéro). Fusionne aussi tous les fichiers condensations*.json en un seul.

Usage : python -I check_condensations.py <dossier .local/pokedex>
"""
import glob
import json
import os
import re
import sys
import unicodedata

GAME_WORDS = re.compile(
    r"\b(Pokémon (Rouge|Bleu|Jaune|Or|Argent|Cristal|Rubis|Saphir|Émeraude|Diamant|Perle|Platine|Noir|Blanc|"
    r"X|Y|Soleil|Lune|Épée|Bouclier|Écarlate|Violet|GO)|Let's Go|Légendes|version|Pokémon Ranger|Rumble)\b")
STOP = set("""le la les un une des du de d l au aux et ou en y à a est sont son sa ses leur leurs ce cet cette ces
qui que qu dont il ils elle elles on se s ne n pas plus par pour sur dans avec sans comme lorsqu lorsque quand
si mais même aussi très tout tous toute toutes peut peuvent fait faire être avoir ont été lui sont""".split())


def words(text):
    t = unicodedata.normalize("NFKD", text.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return {w for w in re.findall(r"[a-z]{4,}", t) if w not in STOP}


def main(folder):
    entries = json.load(open(os.path.join(folder, "entrees.json"), encoding="utf-8"))
    merged = {}
    for path in sorted(glob.glob(os.path.join(folder, "condensations*.json"))):
        for k, v in json.load(open(path, encoding="utf-8")).items():
            if k in merged and merged[k] != v:
                print(f"! #{k} en double avec deux textes différents ({os.path.basename(path)})")
            merged[k] = v

    vocab = {n: words(" ".join(v["entries"])) for n, v in entries.items()}
    problems = []
    for n, v in entries.items():
        text = merged.get(n)
        name = v["name_fr"]
        if not text:
            problems.append(f"#{n} {name} : texte manquant")
            continue
        if "\n" in text:
            problems.append(f"#{n} {name} : plusieurs lignes")
        if len(text) < 100 or len(text) > 1800:
            problems.append(f"#{n} {name} : longueur {len(text)}")
        if GAME_WORDS.search(text):
            problems.append(f"#{n} {name} : mention de jeu « {GAME_WORDS.search(text).group(0)} »")
        w = words(text)
        own = len(w & vocab[n]) / max(len(w), 1)
        best_other, best_score = max(((m, len(w & vocab[m]) / max(len(w), 1)) for m in vocab if m != n),
                                     key=lambda x: x[1])
        if best_score > own:
            problems.append(f"#{n} {name} : texte plus proche des entrées de #{best_other} "
                            f"{entries[best_other]['name_fr']} ({best_score:.2f} contre {own:.2f})")
        elif own < 0.35:
            problems.append(f"#{n} {name} : faible recoupement avec ses entrées ({own:.2f})")

    extra = sorted(set(merged) - set(entries), key=int)
    if extra:
        problems.append(f"numéros inattendus : {extra}")
    json.dump(dict(sorted(merged.items(), key=lambda kv: int(kv[0]))),
              open(os.path.join(folder, "condensations-toutes.json.tmp"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    lengths = [len(t) for t in merged.values()]
    print(f"{len(merged)}/{len(entries)} textes ; longueur min {min(lengths)}, max {max(lengths)}, "
          f"moyenne {sum(lengths) / len(lengths):.0f}")
    print("\n".join(problems) if problems else "aucun problème détecté")


if __name__ == "__main__":
    main(sys.argv[1])
