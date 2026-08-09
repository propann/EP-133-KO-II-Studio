# Contexte de travail — EP-133 Rhythm Hero

## Dépôt de référence

- Dépôt principal : `propann/ep133-rhythm-hero`
- Ancien dépôt à absorber : `propann/Pad-Hero`
- Toute nouvelle évolution doit être faite dans le dépôt principal.
- Le dépôt `Pad-Hero` ne doit être supprimé sur GitHub qu'après validation du déploiement et accord explicite du propriétaire.

## Objectif produit

Créer un coach de finger-drumming pour le Teenage Engineering EP-133 K.O. II : apprendre un groove, le jouer sur les pads réels via Web MIDI, mesurer l'avance ou le retard, puis progresser en tempo.

## Fusion des deux prototypes

Le dépôt principal apporte :

- le player autonome historique dans `docs/ep133-pad-player.html` ;
- un parcours pédagogique de 39 exercices ;
- la documentation Linux, Windows et Raspberry Pi ;
- l'atlas et le cahier de finger-drumming.

Le dépôt `Pad-Hero` apporte :

- l'application React, Vite et TypeScript désormais placée à la racine ;
- les modules `src/core/audio`, `src/core/engine` et `src/core/midi` ;
- le scoring PERFECT / GOOD / MISS, combo et précision ;
- les sources MIDI Midnight Concrete dans `public/midi/zik-01` ;
- l'exercice JSON jouable dans `public/exercises`.

Le player HTML historique reste disponible comme référence fonctionnelle pendant la migration. Ne pas le supprimer avant que ses 39 exercices et ses fonctions pédagogiques soient repris dans l'application React.

## État technique au 9 août 2026

- Application moderne fusionnée dans le dépôt principal.
- Modifications locales de `Pad-Hero` conservées, notamment les champs de précision `totalDeltaMs` et `hits` du scoring.
- Build de production : `npm ci && npm run build`.
- Développement : `npm run dev`.
- Déploiement GitHub Pages : workflow `.github/workflows/deploy-pages.yml` sur chaque push vers `main`.
- Interface de diagnostic MIDI : elle affiche le port, le canal, la note et la
  vélocité. Le mapping officiel des groupes A à D est automatique, sans étape
  de calibration manuelle.
- Grille des 12 pads alignée sur la disposition physique du EP-133 : trois pads
  par rangée et quatre rangées, y compris sur écran étroit.
- Partition React inspirée du séquenceur EP-133 : deux mesures de 16 pas,
  quatre pistes, modèle et frappes joueur superposés, curseur actif et marques
  colorées selon le score.
- Player autonome historique corrigé pour afficher simultanément 1 à 4
  mesures, conserver les frappes joueur et terminer sans effacer la session.
- Routage audio React : le jeu utilise les sons de l'ordinateur ; le studio
  complet peut utiliser la sortie MIDI et les sons de l'EP-133 sans doublage.
- Une mesure de compte à rebours précède le jeu. La partition modèle produit un
  accompagnement discret, tandis que les frappes joueur sont plus présentes.
- Les contrôles, le MIDI et le score sont regroupés dans une barre supérieure
  compacte afin de réserver l'écran à la partition et aux pads.
- Double-clic sur un pad : mini-mixeur par pad avec volumes séparés pour le son
  du modèle et celui du joueur, accordage et préécoute.
- Kit audio complet sur les 12 pads : kick, clap, snare, open/closed hat, ride,
  trois percussions, shaker, basse et FX, avec une voix dédiée par pad.
- Façade compacte inspirée de la référence : pads réduits entre deux afficheurs
  LCD, partition sous le pavé et défilement automatique suivant la lecture.
- Barre descriptive supprimée. Sélecteur des 39 exercices intégré à la barre
  supérieure ; changement verrouillé pendant une session.
- Afficheurs latéraux convertis en VU-mètres : modèle orange et joueur ambre.
  Le vert a été retiré de l'interface pour respecter la palette EP-133.
- VU-mètres redessinés en cadrans analogiques à aiguille. La partition passe
  directement sous la barre supérieure ; les textes techniques sont retirés.
- Sélection pédagogique en deux niveaux : famille de style puis difficulté 1 à
  5. Chaque combinaison produit six mesures progressives et s'arrête à la fin.
- Mode jeu libre hors session : la connexion MIDI déverrouille l'audio ; toute
  frappe physique joue le son du pad et anime le VU-mètre joueur sans compter
  de score.
- Audio live optimisé : look-ahead Tone.js réduit à 10 ms, horloge immédiate
  pour les frappes et suppression du délai de 220 ms sur les pads virtuels.
- Tempo réglable hors session par glissement vertical maintenu sur l'afficheur
  BPM (50–200). La difficulté ne modifie jamais le tempo : elle agit uniquement
  sur la complexité rythmique, la densité, les syncopes et les fills.
- Pads 4/5/6 renforcés avec trois voix audibles distinctes : open hat long,
  closed hat court et ride longue. Les familles musicales utilisent désormais
  des patterns de kick, snare, hats et percussions réellement différenciés.
- La liste complète des 39 styles du catalogue est conservée. Production des
  partitions par blocs de cinq niveaux : le premier bloc Boom-Bap 1 à 5 est
  écrit manuellement sur six mesures, avec variations et fill final propres à
  chaque niveau. Les styles suivants seront affinés bloc par bloc.
- Bouton LECTURE placé entre MIDI et JOUER : préécoute de la partition modèle
  avec défilement, sans compte à rebours ni score ; le bouton devient STOP.
- Barre supérieure normalisée sur la hauteur de l'afficheur BPM. Niveau placé
  après le logo et réglable par glissement vertical dans un afficheur numérique
  compact ; le nombre futur de niveaux ne modifiera pas la largeur. Sélecteur
  de style élargi et boutons d'action équilibrés.
- Éditeur USER accessible après le logo : nom, mesures extensibles, grille 16 pas
  cliquable sur toutes les pistes, lecture/stop et sauvegarde dans localStorage.
  Les créations apparaissent dans un groupe USER du sélecteur de styles.
- L'éditeur n'impose plus de longueur maximale : ajout illimité de mesures,
  duplication de la mesure courante, effacement et suppression de la dernière.
  Navigation horizontale, lecture et sauvegarde suivent la longueur réelle.
- L'éditeur est une vue plein écran autonome dans l'application. Sa grille et
  la partition principale affichent les 12 pads complets, dans l'ordre physique
  du EP-133, afin qu'aucune piste utilisateur ne soit masquée.
- Éditeur simplifié en partition continue : plus de boutons de gestion des
  mesures. Une mesure de réserve vide est toujours affichée et une nouvelle est
  créée automatiquement dès qu'on y écrit. VU-mètre analogique intégré ; seule
  la longueur réellement écrite est lue et sauvegardée.
- Repères d'édition renforcés : bandes de pas alternées orange/gris par mesure
  et colonne des 12 noms de pistes figée à gauche pendant le défilement
  horizontal. Les libellés de la partition principale sont également figés.
- La partition de l'éditeur est désormais une grille horizontale unique : les
  mesures ne s'empilent plus. Chaque nouvelle mesure prolonge les 12 pistes vers
  la droite et l'éditeur défile automatiquement jusqu'à la zone de suite.
- Mapping physique des 12 pads et des groupes A–D validé ; conserver
  `docs/CONNEXION_ET_CALIBRATION_MIDI.md` pour le diagnostic et les nouvelles
  machines.
- Les pistes audio réelles ne sont pas versionnées.

## Évolutions consolidées

- Le mapping officiel et les frappes MIDI ont été validés avec l'EP-133 réel.
- L'application possède une page d'accueil séparant jeu, studio et sons.
- Le studio gère quatre groupes A–D, un séquenceur extensible, les modes ONE et
  KEYS, un piano-roll, la boucle et la sortie MIDI vers la machine.
- Le scanner `tools/scan_ep133_readonly.py`, fondé sur le projet MIT
  `kmorrill/ep-series-sysex`, lit le projet et les métadonnées sonores sans
  appeler d'opération d'écriture.
- Le cache `public/ep133-device.json` contient uniquement les métadonnées du
  projet de test, jamais les fichiers audio de la machine.
- L'export MIDI fonctionne. L'export JSON suit le contrat `ep.project.v1` ; la
  compilation `.ppak` et l'écriture matérielle restent à valider.

## Priorités

1. Découper `App.tsx`, centraliser le transport et ajouter des tests.
2. Transformer SAVE en vraie gestion Nouveau/Sauvegarder/Charger/Importer.
3. Unifier les exercices du jeu et les projets utilisateur dans une bibliothèque.
4. Concevoir les deux banques sonores : ordinateur et miroir privé EP-133.
5. Finaliser le préparateur audio et le contrôle de mémoire avant transfert.
6. Valider la compilation `.ppak` sur un projet brouillon sauvegardé.
7. Finaliser les cinq niveaux de chaque style pédagogique.
8. Archiver ou supprimer `Pad-Hero` uniquement après validation et accord.

La vision détaillée est dans `docs/ROADMAP.md`, la gestion des données dans
`docs/GESTION_FICHIERS_ET_SONS.md` et le futur chantier dans
`docs/VISION_OP1.md`.

## Règles de travail

- Ne jamais présenter un mapping MIDI supposé comme confirmé.
- Ne jamais utiliser 44,1 kHz comme format natif supposé : les WAV natifs
  observés sont mono PCM 16 bits à 46 875 Hz.
- L'EP-133 possède 12 pads par groupe. Les patterns internes sont à 96 PPQN,
  tandis que l'horloge MIDI externe est à 24 PPQN.
- Préserver les octets et champs inconnus d'une archive machine réelle ; ne pas
  implémenter le layout d'un document secondaire sans recoupement.
- `core/midi` capture les événements, `core/engine` calcule le jeu, `core/audio` gère le temps et le son.
- Préserver les sources MIDI et les documents pédagogiques.
- Avant chaque livraison : lancer le build, vérifier l'état Git et documenter les limites restantes.
- Chaque étape est enregistrée dans `docs/SUIVI_IMPLEMENTATION.md`.
- Les sérialisations MIDI et EP-133 vivent dans
  `src/core/project/exporters.ts` et sont vérifiées par
  `npm run test:exports`; ne pas les remettre dans les composants React.
- Ne pas créer de format de composition propriétaire Rhythm Hero. Les formats
  de référence sont `.pak/.ppak`, `.mid` et `ep.project.v1.json` comme source
  technique intermédiaire. Voir `docs/DECISION_FORMATS_PROJET.md`.
- L'analyse critique du cahier des charges étendu et ses corrections techniques
  sont consignées dans `docs/ANALYSE_ETUDE_CAHIER_CHARGES.md`.
