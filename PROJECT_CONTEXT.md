# Contexte de travail — EP-133 KO II Studio

## Dépôt de référence

- Dépôt principal : `propann/ep133-ko-ii-studio`
- Ancien dépôt à absorber : `propann/Pad-Hero`
- Toute nouvelle évolution doit être faite dans le dépôt principal.
- Le dépôt `Pad-Hero` ne doit être supprimé sur GitHub qu'après validation du déploiement et accord explicite du propriétaire.

## Objectif produit

Créer le studio compagnon open source du Teenage Engineering EP-133 K.O. II :
cloner la machine, ouvrir ses projets et ses sons, éditer patterns, scènes et
Songs hors ligne, puis préparer un retour matériel vérifié. Le coach Rhythm
Hero reste inclus comme module secondaire d'apprentissage du finger-drumming.

## Décision de positionnement — 11 août 2026

- Nom produit : **EP-133 KO II Studio**.
- Slug GitHub cible : `propann/ep133-ko-ii-studio`.
- Le Studio, le clone, l'édition et le transfert constituent le produit principal.
- Rhythm Hero est conservé comme module pédagogique inclus.
- Les clés locales `ep133-rhythm-hero:*` restent temporairement inchangées afin
  de préserver les projets et mappings déjà enregistrés dans les navigateurs.
- Le suivi des interfaces et documents FR/EN/ES est centralisé dans
  `docs/SUIVI_TRADUCTIONS.md` et doit être mis à jour avec chaque traduction.

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

Le rapport consolidé de la session du 10 août 2026 est disponible dans
`docs/RAPPORT_SESSION_2026-08-10.md`. Point de reprise prioritaire : diagnostic
Web MIDI navigateur dans Sons & Transfert ; le test MIDI direct vers la machine
a réussi, mais la validation utilisateur de la communication web reste négative.

### Point de reprise sauvegardé — 10 août 2026

- Branche active : `agent/consolidation-suite-ep133`.
- Dernier commit publié : `7cea244` — « Consolider le clone et la gestion des sons EP-133 ».
- PR brouillon : <https://github.com/propann/ep133-ko-ii-studio/pull/1>.
- `npm test`, `npm run build`, `git diff --check` et GitGuardian réussissent.
- Le clone incrémental réel est validé ; ne pas recommencer ce chantier.
- La priorité est d’instrumenter Web MIDI dans Sons & Transfert : noms exacts des entrées/sorties, dernier message reçu, dernier message envoyé, canal et note.
- Le test Python direct note 45/canal 1 fait sonner l’EP-133 : câble, port, canal et réception machine sont validés.
- Les boutons physiques A–D seuls remontent du SysEx propriétaire ; ne pas envoyer de SysEx non documenté.
- Les réaffectations son → pad, suppressions et synchronisations restent locales/verrouillées jusqu’au checkpoint et à la relecture binaire.

- Diagnostic MIDI réel du 10 août : le navigateur ouvrait aussi `Midi Through`, ce qui pouvait annoncer une sortie connectée puis envoyer les pads au mauvais port. Entrées, sorties, notes, transport et PANIC ciblent maintenant uniquement l’EP-133. Le canal reçu de la machine est réutilisé en sortie. Les frappes de pads 36–83 pilotent A–D et le pad à l’écran. Les boutons physiques A–D seuls utilisent une notification SysEx propriétaire ; aucune écriture SysEx non documentée n’est activée.

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
- Le lecteur TypeScript ouvre MIDI, `.pak/.ppak` et le TAR interne. Il décode
  pads, patterns, automations, scènes, song et tempo en conservant les octets
  bruts. Le projet 1 réel a été relu sans avertissement ; voir
  `docs/VALIDATION_LECTEUR_PROJET_EP133.md`.
- Les transports jeu et studio possèdent des timers séparés et des arrêts
  centralisés. Toute session asynchrone arrêtée est invalidée ; le PANIC MIDI
  agit sur 16 canaux. Voir `docs/VALIDATION_TRANSPORT.md`.
- L'accueil et Sons & Transfert vivent dans `src/pages`. L'état et les actions
  matérielles restent orchestrés dans `App.tsx` jusqu'à l'extraction complète
  du jeu et du studio. Voir `docs/DECOUPAGE_INTERFACE.md`.
- Les composants visuels du jeu vivent dans `src/components/game`. Les
  constantes des pads viennent exclusivement de `src/core/project/pads.ts`.
- Les composants visuels du studio vivent dans `src/components/editor`.
  `App.tsx` conserve encore l'état de l'éditeur par décision explicite, jusqu'à
  l'adoption d'un modèle de projet unique.
- Le modèle canonique du studio est `SequencerNote` dans
  `src/core/project/model.ts`. Les cibles pédagogiques passent uniquement par
  `exerciseTargetsToNotes` et `notesToExerciseTargets`. Voir
  `docs/MODELE_DONNEES_PROJET.md`.
- Les règles d'extension de grille vivent dans `src/core/project/editor.ts` et
  le score dans `src/core/engine/scoring.ts`. Les deux sont contrôlés par
  `npm run test:engine`; voir `docs/VALIDATION_SCORE_ET_EXTENSION.md`.
- La page `DocumentationPage` expose nos guides français et une charte visuelle
  originale inspirée des principes généraux du manuel. Ne jamais versionner le
  PDF officiel ou ses illustrations sans licence explicite. Voir
  `docs/BIBLIOTHEQUE_DOCUMENTAIRE.md`.
- Le dernier point d'architecture sur les deux sections principales est dans
  `docs/POINT_JEU_ET_STUDIO.md`.
- Le Save/Load Studio local vit dans `src/core/project/studioLibrary.ts`. Il
  enveloppe le document musical `ep.project.v1` sans inventer de nouveau format.
  Voir `docs/VALIDATION_SAVE_LOAD_STUDIO.md`.
- Le menu `FICHIER` regroupe Nouveau, Ouvrir, Enregistrer, Enregistrer sous,
  Renommer, Dupliquer, Supprimer et Exporter.
- Le menu `FICHIER → Ouvrir` expose cinq compositions de démonstration
  versionnées (Groove, Lo-fi, Electro, Trap et Break), séparées des projets
  personnels et chargeables sans EP-133 pour tester patterns, scènes et Song.
- Priorités suivantes : import de fichier, Annuler/Rétablir, puis édition
  visuelle vélocité/gate.
- Le bandeau `SongModeBar` suit la hiérarchie du manuel : Song Position,
  Scène, puis patterns A–D. Voir `docs/STRUCTURE_SONG_MODE.md`. Ne jamais
  dessiner de fausses positions : la prochaine étape doit faire évoluer le
  modèle et le transport vers de vraies scènes multiples.
- `public/ep133-project-1.json` est l'instantané décodé du projet 1 réel. Le
  Studio charge la scène référencée par la première Song Position, jamais le
  dernier pattern trouvé. Voir `docs/CHARGEMENT_PROJET_MACHINE.md`.
- Le module Sons possède un profil local nommé, une capacité déclarée 64/128 Mo,
  un dossier de samples et l'inventaire global réel de 527 slots occupés. La
  cible est une architecture base machine → copie hors ligne → patch vérifié.
  Voir `docs/ARCHITECTURE_MIROIR_MACHINE.md`.
- Le Studio expose `FICHIER → CLONER LA MACHINE`. Le manifeste local contient
  un premier point d'historique. La Time Machine future doit dédupliquer par
  hash et ne restaurer le matériel qu'après checkpoint, diff et confirmation.
- `tools/clone_ep133_readonly.py` est le moteur du vrai clone complet. Il copie
  projets, PCM et métadonnées avec hashes et reprise. L'UI ne doit pas prétendre
  l'avoir exécuté avant le retour d'un pont local confirmé.
- Arborescence impérative des sauvegardes :
  `dossier choisi/clone/nom-machine/`. Ne jamais écrire les fichiers du clone
  directement à la racine choisie.
- `MachineSampleBank` résout les slots depuis le dossier de clone sélectionné.
  Priorité audio : MIDI machine connectée, sinon PCM local. Voir
  `docs/BANQUE_SAMPLES_STUDIO.md`.
- Les sélecteurs utilisent l'accès natif aux dossiers de Chrome/Chromium. Ne
  jamais employer « upload » : les PCM restent sur le HDD et seul le manifeste
  est écrit dans `clone/nom-machine/` par le navigateur.
- Premier clone privé validé : 9 projets, 527 PCM, 527 métadonnées, 536 hashes
  conformes et aucune erreur. Durée 25 min 20 s. Voir
  `docs/VALIDATION_CLONE_REEL.md`. Prochaine priorité : pont local et progression
  directement dans la fenêtre Studio.
- `tools/local_clone_bridge.py` raccorde le bouton au cloneur sur localhost.
  Vite proxifie `/bridge`. Le dossier racine est fixé au lancement et ne peut
  pas être choisi par une requête web. Voir `docs/PONT_LOCAL_CLONAGE.md`.
- Le cloneur prépare une synchronisation incrémentale au format manifeste v2 :
  ancien manifeste archivé, projets comparés par hash, PCM locaux contrôlés et
  métadonnées relues. Les écritures disque sont atomiques et aucun slot disparu
  n'est supprimé automatiquement. Le second passage matériel depuis le bouton
  est validé : 30,7 s, 9 projets et 527 sons inchangés, aucun téléchargement,
  aucune erreur et 536 hashes conformes après contrôle indépendant.
- Sons & Transfert adopte une vue machine : groupes A–D, grille physique de 12
  pads, détail d'affectation et navigateur de banques par plages colorées. Les
  plages confirmées viennent de la notice ; `EXTRA` reste volontairement neutre
  pour 900–999. Voir `docs/POINT_SONS_ET_TRANSFERT.md`.
- Dans cette vue, le mapping doit toujours passer par les helpers MIDI
  canoniques : pad interne 1–12 vers touches visuelles
  `7 8 9 / 4 5 6 / 1 2 3 / · 0 ENTER`. Les frappes matérielles suivent le
  groupe et le pad à l'écran ; ONE/KEYS ne modifie que le projet local.
- Les réaffectations son → pad sont préparées par glisser-déposer et restent
  orange jusqu'à synchronisation. Les taux d'occupation et la mémoire théorique
  font partie du diff. `SYNCHRONISER` ne doit écrire qu'après compilation depuis
  une archive réelle, checkpoint, confirmation et relecture binaire ; tant que
  ce cycle n'est pas validé, le bouton confirme seulement le plan local.
- Revue de code indépendante du 10 août : le chargement d'un projet Studio
  (local ou scanné sur la machine) est protégé par `try/catch` — un document
  incompatible affiche un message au lieu de bloquer l'éditeur en silence.
  Le clonage complet dans `MachineCloneDialog` est lui aussi protégé de bout en
  bout, et son garde-fou « aucun dossier/pont choisi » revient avant toute
  écriture `localStorage`. `crypto.randomUUID()` a un repli hors contexte
  sécurisé. Le glisser-déposer d'un son sans charge utile valide ne peut plus
  effacer un pad par erreur. Voir `docs/SUIVI_IMPLEMENTATION.md`.
- Le Studio stocke désormais la vraie hiérarchie du manuel : patterns 01–99
  par groupe (trous légaux préservés), scènes S.01–S.99, liste Song L.01–L.99
  (`src/core/project/song.ts`). Deux vues : Pattern Editor (sélecteur
  `PATTERN: [ A01 ▲▼ ]`) et Song Arranger (storyboard horizontal des Song
  Positions, `SongArranger.tsx`, remplace `SongModeBar`). Une scène est une
  ressource partagée entre Song Positions, fidèle au fonctionnement réel de
  la machine ; `[DUP]` en sort pour créer une variante indépendante. Limite
  assumée : la lecture reste bornée à une scène auditionnée à la fois, pas
  d'avancée automatique entre Song Positions. Voir
  `docs/STRUCTURE_SONG_MODE.md` et `docs/MODELE_DONNEES_PROJET.md`.

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

Toutes les propositions, y compris celles qui ne sont pas encore intégrées,
sont conservées avec un statut et un motif dans `docs/REGISTRE_IDEES.md`.

La présentation GitHub existe en français (`README.md`), anglais
(`README.en.md`) et espagnol (`README.es.md`). Les trois versions doivent rester
alignées sur l'état matériel réellement validé.

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
  `src/core/project/exporters.ts`; les lecteurs et inspecteurs vivent dans
  `src/core/project/importers.ts`. Ils sont vérifiés par
  `npm run test:exports`; ne pas les remettre dans les composants React.
- Ne pas créer de format de composition propriétaire Rhythm Hero. Les formats
  de référence sont `.pak/.ppak`, `.mid` et `ep.project.v1.json` comme source
  technique intermédiaire. Voir `docs/DECISION_FORMATS_PROJET.md`.
- L'analyse critique du cahier des charges étendu et ses corrections techniques
  sont consignées dans `docs/ANALYSE_ETUDE_CAHIER_CHARGES.md`.
