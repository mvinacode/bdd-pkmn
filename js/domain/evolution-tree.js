// Arbre d'évolution { node: { number, … }, children: [arbre…] } (cf. fetchEvolutionChain).

/** Numéros de tous les Pokémon de l'arbre, racine d'abord (parcours en profondeur). */
export function collectTreeNumbers(tree) {
  if (!tree) return [];
  return [tree.node.number, ...tree.children.flatMap(c => collectTreeNumbers(c))];
}
