# État du projet

> Mise à jour consolidée : 9 août 2026. La source principale est désormais
> l'application React/TypeScript. Le player HTML reste une référence historique.

## Socle validé

- Player autonome, sans dépendance JavaScript externe
- Interface inspirée du EP-133 K.O. II, pads et doigtés visibles
- 39 exercices classés sur 5 niveaux
- Tempo de 10 % à 150 %, sons de repère et VU-mètre
- Partition modèle multi-mesures, avec une grille de 16 pas par mesure et le
  numéro du pad dans chaque frappe attendue
- Parcours de 1 à 4 mesures ; les mesures 2 à 4 apportent des variations
- Partition joueur complète sur 1 à 4 mesures ; les frappes restent visibles
  dans leur mesure jusqu'à la fin de la session
- Lancement local préparé pour Windows et Raspberry Pi

## Vérification du 9 août 2026

| Contrôle | Résultat |
|---|---|
| Syntaxe JavaScript du player | OK |
| Syntaxe JavaScript de la version autonome | OK |
| Catalogue de 39 exercices | OK |
| Sélecteur 1 à 4 mesures | OK |
| Partition joueur / variations | OK |
| Affichage simultané des mesures 1 à 4 | OK |
| Conservation des frappes après changement de mesure | OK |
| Scripts Windows et Pi | OK (validation de syntaxe) |

## Partition multi-mesures

- Une mesure sélectionnée occupe toute la largeur utile.
- Deux à quatre mesures sont affichées deux par ligne sur écran large et une
  par ligne sur petit écran.
- Chaque mesure modèle utilise sa variation réelle.
- Le curseur orange se déplace uniquement dans la mesure active.
- La partition joueur utilise le même découpage et conserve toutes les frappes.
- Une nouvelle session vide les anciennes frappes ; la fin affiche `TERMINÉ`
  sans effacer la session qui vient d'être jouée.

## Parcours React par styles

- Les 39 styles historiques restent présents dans le sélecteur.
- Chaque style doit recevoir cinq partitions de difficulté croissante.
- Premier groupe finalisé : Boom-Bap niveaux 1 à 5, six mesures par niveau.
- Les niveaux Boom-Bap ont des patterns dédiés, des variations sur la cinquième
  mesure et un fill final adapté au niveau sur la sixième.
- Les autres styles restent jouables avec leur génération provisoire et seront
  remplacés progressivement par blocs de cinq partitions validées.

## Prochaine brique : validation complète du vrai jeu

1. Brancher le EP-133 par USB au PC Windows.
2. Relever les notes, canaux et vélocités réellement envoyés par chaque pad.
3. Connecter ces messages à la partition joueur.
4. Mesurer avance/retard et erreurs de pad.
5. Calculer score, combo et bilan d'exercice.

## Limites actuelles assumées

- Le player React reçoit le Web MIDI avec le mapping officiel validé. Le player
  autonome historique enregistre encore uniquement les clics virtuels.
- Le serveur Raspberry Pi est un serveur d'entraînement sur le réseau local. Il ne peut pas capturer tout seul le MIDI USB branché à un autre PC.
- Le score doit encore recevoir une campagne complète de tests de latence et de
  précision, même si le mapping physique est validé.

## Suite modulaire et studio

- Page d'accueil avec trois modules : jeu, studio et sons/transfert.
- Éditeur du jeu et studio complet séparés, chacun revenant à l'accueil.
- Studio sur groupes A–D avec 12 pistes, mesures horizontales extensibles,
  piano-roll KEYS, lecture, boucle, horloge et sortie MIDI vers l'EP-133.
- Export MIDI ou description `ep.project.v1` JSON.
- Scan SysEx en lecture seule validé sur la machine : 527 sons, 56,21 Mo,
  affectations de pads, noms, modes et notes racines.
- Inventaire du projet 1 affiché dans la page Sons & Transfert.
- Transfert sonore volontairement verrouillé jusqu'à la mise en place du calcul
  mémoire, de la sauvegarde, de la confirmation et de la relecture.

## Décision de consolidation

Le développement fonctionnel est temporairement ralenti pour découper le gros
composant d'interface, ajouter les tests, documenter les formats et construire
une vraie gestion Save/Load. La feuille de route détaillée se trouve dans
[`ROADMAP.md`](ROADMAP.md).

## Solidification en cours

- Étape 1.1 terminée : la génération MIDI et `ep.project.v1` est sortie de
  `App.tsx` vers `src/core/project/exporters.ts`.
- Une vérification automatisée couvre l'en-tête MIDI, le mapping d'un pad, une
  hauteur KEYS, les quatre patterns et le mode de pad exporté.
- Commande : `npm run test:exports`.
- Décision prise : ne pas créer de format natif Rhythm Hero. Le menu Save/Load
  utilisera `.pak/.ppak`, MIDI et le JSON technique `ep.project.v1`.
- Prochaine étape : charger ces formats avant de construire le menu complet.
