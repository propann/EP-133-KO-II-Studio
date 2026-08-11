# Suivi d'implémentation

Ce journal complète la feuille de route. Une étape n'est terminée que lorsque
le code, les vérifications et la documentation racontent la même chose.

## Règle de livraison

Pour chaque avancée :

1. choisir un périmètre court et vérifiable ;
2. noter les décisions et les limites ;
3. modifier le code sans mélanger un autre chantier ;
4. ajouter ou mettre à jour une vérification automatisée ;
5. lancer le build et contrôler le diff ;
6. mettre à jour `PROJECT_CONTEXT.md`, `docs/ETAT_DU_PROJET.md` et ce journal ;
7. créer un commit français dédié et le pousser sur la branche de travail.

## Correctif MIDI EP-133 — 10 août 2026

- [x] Exclure le port virtuel `Midi Through` des entrées et sorties machine.
- [x] Envoyer pads, notes, transport et PANIC uniquement vers l’EP-133.
- [x] Apprendre le canal MIDI depuis les messages entrants et le réutiliser en sortie.
- [x] Conserver le retour machine → écran pour les pads des groupes A–D (notes 36–83).
- [ ] Décoder proprement la notification SysEx propriétaire des boutons physiques A–D ; aucune écriture SysEx non documentée n’est activée.

Validation de fin de session : le test direct Python, note 45 sur canal 1, fait
sonner l’EP-133. La validation depuis la page web reste négative. Le prochain
travail doit donc instrumenter séparément entrée, sortie, dernier message reçu
et dernier message envoyé avant un nouveau changement de protocole.

Rapport complet : `docs/RAPPORT_SESSION_2026-08-10.md`.

## Étape 1.1 — formats de projet isolés

Statut : terminé le 9 août 2026.

Objectif : sortir de `App.tsx` la connaissance des formats MIDI et
`ep.project.v1` afin de pouvoir les tester sans démarrer l'interface.

Critères :

- [x] module `src/core/project/exporters.ts` ;
- [x] mapping des groupes et pads centralisé ;
- [x] génération MIDI vérifiée ;
- [x] description EP-133 JSON vérifiée ;
- [x] `App.tsx` utilise uniquement l'API du module ;
- [x] build et contrôle documentaire terminés.

Décisions :

- Le module exporte les types `EditorGroup`, `EditorPatterns` et
  `EditorPadMode` pour éviter les conventions concurrentes.
- Le MIDI conserve les hauteurs du piano-roll et applique le mapping officiel
  seulement aux frappes sans hauteur explicite.
- Le JSON crée toujours les quatre patterns A–D et une scène complète, y
  compris lorsque certains groupes sont silencieux.
- La commande `npm run test:exports` valide les signatures MIDI, les notes,
  les quatre groupes et le passage d'un pad en KEYS.

## Étapes suivantes

- 1.4a : pages Accueil et Sons. **Terminée.**
- 1.4b : composants visuels du Jeu. **Terminée.**
- 1.4c : isolation visuelle de l'éditeur Studio. **Terminée.**
- 1.5 : modèle de données unique pour notes, patterns et groupes. **Terminée.**
- 1.6 : tests du score et de l'extension automatique. **Terminée.**
- 1.7 : campagne manuelle Chrome/Chromium, écrans large et étroit.
  **Prochaine étape.**
- 2.1 : premier menu SAVE avec Nouveau, Sauvegarder et Charger.

## Décision d'architecture — étude « compagnon ultime »

Statut : analysée le 9 août 2026.

- [x] idées produit classées entre indispensable, majeur et expérimental ;
- [x] structures `.pak/.ppak`, pads et événements recoupées avec les travaux
  fondés sur des captures ;
- [x] format audio natif corrigé à 46 875 Hz PCM 16 bits ;
- [x] frontière de licence documentée pour les exports DAW sous AGPL-3.0 ;
- [x] architecture React/Vite conservée jusqu'à preuve qu'un paquet desktop est
  nécessaire ;
- [x] feuille de route amendée sans élargir la prochaine étape.

Le rapport complet est dans
`docs/ANALYSE_ETUDE_CAHIER_CHARGES.md`. Il fait foi lorsqu'une proposition de
l'étude contredit une structure observée ou le guide officiel.

## Étape 1.2a — lecteurs MIDI et conteneur EP-133

Statut : terminé le 9 août 2026.

Objectif : reconnaître et contrôler les fichiers avant de construire le menu
SAVE/LOAD, sans écrire sur la machine.

- [x] lecteur MIDI standard formats 0 et 1 à résolution PPQN ;
- [x] lecture du tempo, des Note On/Off, vélocités et durées ;
- [x] conversion des notes 36–83 vers les groupes et pads EP-133 ;
- [x] avertissement pour les notes étrangères et les notes ouvertes ;
- [x] validation du JSON intermédiaire `ep.project.v1` ;
- [x] ouverture ZIP `.pak/.ppak`, lecture de `meta.json` et inventaire des
  projets TAR et sons WAV ;
- [x] tests aller-retour avec un MIDI et une archive synthétique ;
- [x] build de production.

Limite à la clôture de cette sous-étape : le contenu binaire du TAR restait à
décoder. Ce point est traité par l'étape 1.2b ci-dessous. L'inspecteur ne compile
et ne réécrit toujours aucune archive.

## Étape 1.2b — décodage du TAR de projet

Statut : terminé le 9 août 2026.

- [x] lecteur TAR compatible avec le dialecte de la machine et contrôle des
  sommes de contrôle lorsqu'elles sont présentes ;
- [x] décodage des 48 pads, formats natifs 26 octets et variante 27 octets ;
- [x] décodage des patterns à 96 PPQN, notes et automations intercalées ;
- [x] décodage des scènes, signatures, scène courante et liste song ;
- [x] lecture du tempo dans `settings` ;
- [x] conservation des membres et enregistrements bruts ;
- [x] test synthétique et build ;
- [x] validation sur une copie en lecture seule du projet 1 réel.

Résultat réel : TAR de 68 096 octets, 68 membres, 48 pads, 11 patterns,
125 notes, 3 scènes, tempo 120 BPM et aucun avertissement. Le compte rendu est
dans `docs/VALIDATION_LECTEUR_PROJET_EP133.md`.

## Décision produit — registre des idées

Statut : créé le 9 août 2026 après la deuxième version de l'étude.

- [x] toutes les propositions audio, fichiers, séquenceur, contrôle live,
  exports et architecture possèdent un identifiant durable ;
- [x] les nouveaux gestes et raccourcis DAW sont triés par faisabilité ;
- [x] les conflits souris et clavier sont consignés avant implémentation ;
- [x] les valeurs techniques erronées sont corrigées sans perdre l'intention ;
- [x] la feuille de route reçoit uniquement les fonctions retenues ;
- [x] les fonctions reportées, expérimentales ou écartées restent visibles dans
  `docs/REGISTRE_IDEES.md`.

À la date de cette décision documentaire, la stabilisation du transport restait
la prochaine étape technique ; elle est clôturée ci-dessous.

## Étape 1.3 — transport audio/MIDI

Statut : terminé le 9 août 2026.

- [x] timers de jeu et d'éditeur séparés ;
- [x] arrêt centralisé pour le jeu et le studio ;
- [x] compte à rebours, fin, boucle et animations annulés sur tous les chemins ;
- [x] génération de session empêchant un démarrage asynchrone après STOP ;
- [x] retour accueil relié à l'arrêt complet ;
- [x] nettoyage Tone.js et MIDI au démontage ;
- [x] MIDI STOP, All Notes Off et All Sound Off sur 16 canaux ;
- [x] test `npm run test:transport`, tests formats et build réussis.

Le détail des risques et des garanties est dans
`docs/VALIDATION_TRANSPORT.md`.

## Étape 1.4a — pages Accueil et Sons

Statut : terminé le 9 août 2026.

- [x] `HomePage` extraite avec navigation par callbacks ;
- [x] `SoundsPage` extraite sans déplacer les accès MIDI ;
- [x] contrat `DeviceInventory` centralisé dans le noyau projet ;
- [x] classes CSS et contenu existants conservés ;
- [x] activation Entrée/Espace rendue explicite et sans défilement parasite ;
- [x] tests transport, formats et build réussis.

La stratégie et les frontières restantes sont décrites dans
`docs/DECOUPAGE_INTERFACE.md`.

## Étape 1.4b — composants visuels du jeu

Statut : terminé le 9 août 2026.

- [x] barre supérieure extraite ;
- [x] partition modèle/joueur extraite ;
- [x] panneau des 12 pads et VU-mètres extrait ;
- [x] mini-éditeur sonore extrait ;
- [x] ordre et libellés des pads centralisés ;
- [x] transport conservé dans un seul orchestrateur ;
- [x] tests transport, formats et build réussis.

## Étape 1.4c — composants visuels du studio

Statut : terminé le 9 août 2026.

- [x] barre de l'éditeur extraite ;
- [x] bande des 12 pads extraite ;
- [x] grille rythmique extraite ;
- [x] piano-roll extrait ;
- [x] composants limités au rendu et aux callbacks ;
- [x] état, transport et sauvegarde maintenus dans l'orchestrateur unique ;
- [x] tests transport, formats et build réussis.

## Étape 1.5 — modèle canonique du séquenceur

Statut : terminé le 9 août 2026.

- [x] type `SequencerNote` avec groupe, position, pad, hauteur, vélocité et
  durée ;
- [x] structure quatre groupes `ProjectPatterns` ;
- [x] adaptateurs pour les exercices pédagogiques existants ;
- [x] import MIDI raccordé au modèle ;
- [x] export MIDI raccordé aux vélocités et durées réelles ;
- [x] export `ep.project.v1` raccordé aux mêmes valeurs à 96 PPQN ;
- [x] lecture studio et sortie MIDI raccordées aux mêmes durées/vélocités ;
- [x] tests de conservation et de normalisation.

Le contrat et ses frontières sont documentés dans
`docs/MODELE_DONNEES_PROJET.md`.

## Étape 1.6 — score et extension automatique

Statut : terminé le 9 août 2026.

- [x] seuils PERFECT/GOOD/MISS et valeurs limites testés ;
- [x] BPM et conversion en millisecondes testés ;
- [x] sélection et consommation d'une cible testées ;
- [x] combo, meilleur combo et MISS testés ;
- [x] calcul des mesures utilisées extrait de React ;
- [x] mesure de réserve et extension automatique testées ;
- [x] suppression sans extension testée ;
- [x] tests transport, formats et build toujours réussis.

Voir `docs/VALIDATION_SCORE_ET_EXTENSION.md`.

## Module Documentation — première version

Statut : terminé le 9 août 2026.

- [x] manuel OS 2.0 local analysé, 258 pages ;
- [x] restriction de redistribution identifiée et respectée ;
- [x] quatrième module ajouté à l'accueil ;
- [x] page documentaire responsive créée ;
- [x] six guides français essentiels indexés ;
- [x] lien vers le guide officiel ;
- [x] afficheur, pads, groupes, touches et fader redessinés en HTML/CSS ;
- [x] principes graphiques consignés sans copier les illustrations protégées.

Voir `docs/BIBLIOTHEQUE_DOCUMENTAIRE.md`.

## Revue des deux sections principales

Statut : réalisée le 9 août 2026.

Le jeu et le Studio ont été évalués séparément avant de poursuivre le design
des partitions. Deux défauts prioritaires sont consignés : omissions non
comptées comme MISS à la fin du jeu et SAVE complet ne conservant pas encore un
véritable projet quatre groupes. Les concepts graphiques applicables au jeu et
au Studio sont détaillés dans `docs/POINT_JEU_ET_STUDIO.md`.

## Étape 2.1 — vrai Save/Load local du Studio

Statut : terminé le 9 août 2026.

- [x] `NOUVEAU` remet à zéro les quatre groupes ;
- [x] `SAVE` conserve un document complet `ep.project.v1` ;
- [x] un projet déjà ouvert est mis à jour sans duplication ;
- [x] la bibliothèque locale permet de sélectionner puis ouvrir un projet ;
- [x] nom, BPM, groupes, pads, notes, vélocités, durées et modes sont restaurés ;
- [x] confirmation avant de remplacer une composition contenant des notes ;
- [x] sauvegarde pédagogique USER maintenue séparément ;
- [x] aller-retour Save/Load couvert par les tests.

Voir `docs/VALIDATION_SAVE_LOAD_STUDIO.md`.

## Étape 2.2 — menu FICHIER du Studio

Statut : terminé le 9 août 2026.

- [x] commandes de projet regroupées sous `FICHIER` ;
- [x] Enregistrer et Enregistrer sous ;
- [x] Renommer et Dupliquer ;
- [x] Supprimer avec confirmation explicite ;
- [x] choix du projet local intégré au menu ;
- [x] export MIDI et `ep.project.v1` intégré au même menu ;
- [x] opérations de bibliothèque couvertes par les tests.

## Étape 2.3 — repères Song mode dans le Studio

Statut : première intégration terminée le 9 août 2026.

- [x] section 6.2 du manuel local relue ;
- [x] hiérarchie Projet → Patterns → Scène → Song Position documentée ;
- [x] repères `L.01`, `S.01` et `A01–D01` visibles dans l'éditeur ;
- [x] longueur de chaque pattern calculée ;
- [x] longueur de la position alignée sur le pattern le plus long ;
- [x] sélection du groupe directement depuis la structure du morceau ;
- [ ] vrais patterns, scènes et positions multiples de 01 à 99.

Voir `docs/STRUCTURE_SONG_MODE.md`.

## Étape 2.4 — chargement du projet 1 de l'EP-133

Statut : terminé le 9 août 2026.

- [x] projet 1 relu en lecture seule depuis la machine ;
- [x] 11 patterns et 3 scènes décodés sans avertissement ;
- [x] Song Position `L.01 → S.01` respectée au chargement ;
- [x] patterns absents laissés vides ;
- [x] bouton `PROJET 1 MACHINE` ajouté au menu FICHIER ;
- [x] ouverture protégée contre l'écrasement de la composition affichée ;
- [x] données réelles A01/B01/C01/D01 couvertes par les tests ;
- [x] aucune écriture MIDI/SysEx envoyée à l'EP-133.

Voir `docs/CHARGEMENT_PROJET_MACHINE.md`.

## Étape 3.1 — fondation du miroir de machine

Statut : première fondation terminée le 9 août 2026.

- [x] profil de machine nommé ;
- [x] choix explicite 64 ou 128 Mo ;
- [x] dossier privé de samples associé ;
- [x] scan global réel des slots en lecture seule ;
- [x] 527 sons et 56,21 Mo affichés ;
- [x] jauge calculée depuis la capacité déclarée ;
- [x] pads du projet séparés de l'inventaire global ;
- [x] modèle base machine → copie de travail → patch documenté ;
- [x] copie réelle des fichiers audio et métadonnées détaillées ;
- [ ] moteur de patch et synchronisation avec relecture.

Voir `docs/ARCHITECTURE_MIROIR_MACHINE.md`.

## Étape 3.2 — fenêtre Cloner la machine

Statut : fondation terminée le 9 août 2026.

- [x] commande ajoutée dans le menu FICHIER ;
- [x] fenêtre dédiée avec nom, mémoire et dossier samples ;
- [x] résumé des sons, de la mémoire et du projet scanné ;
- [x] manifeste de clone conservé localement ;
- [x] premier point `INSTANTANÉ INITIAL` créé ;
- [x] état audio explicitement marqué « pont local requis » ;
- [x] concept Time Machine documenté sans fausse restauration active.

## Étape 3.3 — moteur de clonage intégral

Statut : moteur, clone réel et branchement UI validés au 10 août 2026.

- [x] lecture des neuf projets ;
- [x] lecture de tous les slots sonores occupés ;
- [x] stockage PCM et métadonnées dans le dossier cible ;
- [x] hash SHA-256 de chaque fichier ;
- [x] manifeste atomique et progression récupérable ;
- [x] phase, compteur, temps écoulé et estimation restante dans le manifeste ;
- [x] durée réelle mesurée : 25 min 20 s, annonce initiale fixée à 20–30 min ;
- [x] arborescence canonique `clone/nom-machine/` créée automatiquement ;
- [x] reprise des samples déjà copiés et de taille identique ;
- [x] aucune commande d'écriture vers la machine ;
- [x] boîte de dialogue et pont local pour lancer le moteur depuis l'UI ;
- [x] campagne réelle complète sur les 527 sons, 9 projets et 0 erreur.

Voir `docs/CLONAGE_COMPLET_MACHINE.md`.

Contrôle indépendant des 536 hashes et 527 JSON :
`docs/VALIDATION_CLONE_REEL.md`.

## Étape 3.4 — bouton Studio raccordé au cloneur

Statut : raccord terminé, test par bouton à effectuer le 10 août 2026.

- [x] pont limité à `127.0.0.1` ;
- [x] dossier racine fixé au démarrage du pont ;
- [x] lancement du moteur par le bouton ;
- [x] refus d'un second clone concurrent ;
- [x] suivi du manifeste chaque seconde ;
- [x] phase, compteur, pourcentage, temps et estimation dans la fenêtre ;
- [x] journal persistant `clone.log` ;
- [x] pont démarré et contrôle `/health` réussi ;
- [x] seconde sauvegarde déclenchée depuis le bouton et validée.

Voir `docs/PONT_LOCAL_CLONAGE.md`.

## Étape 3.5 — banque machine hors ligne dans le Studio

Statut : première version terminée le 9 août 2026.

- [x] ligne `DOSSIER SAMPLES` ajoutée dans FICHIER ;
- [x] détection de `samples/NNN.pcm` et `metadata/NNN.json` ;
- [x] décodage PCM 16 bits mono/stéréo à la demande ;
- [x] préécoute des pads sans machine ;
- [x] lecture de la partition Studio sans machine ;
- [x] vélocité et transposition KEY prises en compte ;
- [x] priorité au MIDI matériel lorsque l'EP-133 est connecté ;
- [x] arrêt des sources locales avec le transport ;
- [ ] autorisation de dossier persistante via le pont local.
- [x] accès direct au HDD par boîte de dialogue native, sans upload ;
- [x] manifeste initial écrit dans `clone/nom-machine/` sur le disque ;

Voir `docs/BANQUE_SAMPLES_STUDIO.md`.

## Étape 3.6 — synchronisation incrémentale du miroir

Statut : terminé et validé sur la machine réelle le 10 août 2026.

- [x] schéma de manifeste `ep133.rhythm-hero.clone.v2` ;
- [x] archivage atomique du manifeste précédent dans `history/` ;
- [x] comparaison des projets par SHA-256 ;
- [x] contrôle des PCM existants par taille, hash du manifeste et hash local ;
- [x] relecture des métadonnées même lorsque le PCM reste local ;
- [x] écritures atomiques des projets, PCM, métadonnées et manifestes ;
- [x] bilan projets modifiés/inchangés et sons ajoutés/modifiés/inchangés/disparus ;
- [x] bilan incrémental exposé par le pont et affiché dans le Studio ;
- [x] endpoints `/health` et `/clone/status` contrôlés sur un pont temporaire ;
- [x] tests applicatifs, build, syntaxe Python et `git diff --check` réussis ;
- [x] premier essai UI : dépendance matérielle `mido` manquante détectée avant
  les samples, sans modification de la machine ni des fichiers déjà clonés ;
- [x] dépendances MIDI déclarées et reprise sur le dernier manifeste stable
  après une exécution interrompue ou invalide ;
- [x] échec de l'inventaire sonore converti en statut final `partial` ;
- [x] second passage déclenché depuis le bouton avec l'EP-133 connecté ;
- [x] durée réelle : 30,7 s ;
- [x] 9 projets inchangés, 527 sons inchangés et 0 octet téléchargé ;
- [x] 0 ajout, modification, suppression ou erreur ;
- [x] contrôle indépendant après synchronisation : 536 hashes conformes,
  aucun fichier manquant et 527 métadonnées JSON valides.

Limite documentée : la machine ne fournit pas de checksum PCM distant dans sa
liste. Un remplacement audio de même taille et de métadonnées identiques exige
un mode de vérification complète futur pour être détecté. Aucun fichier local
n'est supprimé automatiquement lorsqu'un slot disparaît.

## Présentation GitHub trilingue

Statut : terminé le 10 août 2026.

- [x] page principale française restructurée comme présentation produit ;
- [x] versions anglaise et espagnole de même portée ;
- [x] navigation de langue en tête des trois README ;
- [x] fonctionnalités, sécurité, validation matérielle et limites actuelles
  présentées sans promesse d'écriture non validée ;
- [x] installation, tests, architecture du dépôt et liens de suivi conservés.

## Refonte Sons & Transfert — vue machine

Statut : implémentation terminée, validation visuelle utilisateur en attente au
10 août 2026.

- [x] notice OS 2.0 relue pour les groupes, pads et plages sonores ;
- [x] groupes A–D visibles et sélectionnables ;
- [x] groupes A–D placés à gauche du pavé ;
- [x] grille physique des 12 pads avec mapping interne/visuel corrigé et testé ;
- [x] slot et nom visibles directement dans chaque pad ;
- [x] banques Kick, Snare, Hi-hat, Perc, Bass, Melodic, FX, User 1, User 2 et Extra ;
- [x] code couleur partagé entre pads, banques et résultats ;
- [x] filtre de banque et recherche par slot ou nom ;
- [x] suivi visuel des frappes MIDI avec sélection automatique du groupe/pad ;
- [x] pads virtuels jouables via MIDI machine, PCM local ou son de secours ;
- [x] panneau de détail sous les pads supprimé pour alléger la lecture ;
- [x] KEYS réduit à un interrupteur orange dans l'en-tête du pavé ;
- [x] menu déroulant remplacé par tous les dossiers visibles en boutons ;
- [x] dossiers réorganisés verticalement pour laisser la liste lisible ;
- [x] suppression affichée par ligne mais matériellement verrouillée avec motif ;
- [x] glisser-déposer son → pad avec affectations locales ;
- [x] pads et sons modifiés maintenus en orange ;
- [x] taux d'occupation par dossier et capacité globale affichés ;
- [x] mémoire actuelle/théorique et coût des affectations affichés ;
- [x] bouton SYNCHRONISER et confirmation du plan local ;
- [ ] compilation sûre du projet modifié depuis une archive machine réelle ;
- [ ] checkpoint, écriture sur projet brouillon et relecture binaire ;
- [x] profil, mémoire, MIDI et dossier local conservés ;
- [x] transfert matériel maintenu désactivé ;
- [x] tests, build et contrôle du diff réussis ;
- [ ] contrôle visuel Chrome/Chromium sur écran large et étroit.

Voir `docs/POINT_SONS_ET_TRANSFERT.md`.

## Étape 3.7 — revue de code indépendante : Studio et clonage

Statut : correctifs appliqués et validés le 10 août 2026 (`npm test`,
`npm run build`).

Une revue de code automatisée à effort « high » sur `src/` (4 lecteurs
indépendants, vérification adversariale par des agents séparés) a fait
remonter 10 constats retenus. 9 ont été corrigés :

- [x] chargement d'un projet Studio local malformé (`App.tsx`,
  `loadSelectedStudioProject`) : protégé par `try/catch`, message affiché au
  lieu de bloquer silencieusement l'éditeur ;
- [x] chargement du projet scanné sur la machine (`App.tsx`,
  `loadMachineProject`) : même protection ;
- [x] `MachineCloneDialog.createClone` : le clonage complet (requête au pont
  local, écriture du manifeste) est désormais protégé de bout en bout, et le
  garde-fou « aucun dossier ni pont choisi » revient avant toute écriture
  `localStorage` au lieu d'après ;
- [x] `storeStudioProject` (`studioLibrary.ts`) : repli sur un identifiant
  aléatoire manuel si `crypto.randomUUID()` est indisponible (contexte non
  sécurisé) ; l'écriture passe désormais par le même helper que
  rename/delete au lieu d'un `localStorage.setItem` dupliqué ;
- [x] `decodeEp133ProjectTar` (`importers.ts`) : un octet de scène active
  valant `0` est préservé au lieu d'être converti en `null` ;
- [x] glisser-déposer d'un son dans Sons & Transfert (`SoundsPage.tsx`) : une
  charge utile absente ne peut plus être coercée en slot `0` et effacer un
  pad par erreur ;
- [x] `useWebMidi.sendPad` : la table pad → note MIDI dupliquée est remplacée
  par l'import partagé `PAD_MIDI_NOTES` de `exporters.ts`.

Un constat a été laissé volontairement inchangé : le canal MIDI de sortie
réutilise le dernier canal reçu en entrée (`useWebMidi.ts`). C'est un choix
documenté et validé sur la machine réelle le 10 août (voir plus haut,
« diagnostic MIDI réel »), pas une régression à annuler à l'aveugle.

Nettoyage opérationnel associé : sept process `vite` orphelins (aucune
session interactive attachée) ont été arrêtés, il n'en reste qu'un.

## Étape 4.1 — Hiérarchie réelle Groupes → Patterns → Scènes → Song

Statut : modèle de données et deux vues Studio livrés le 10 août 2026,
`npm run build`/`npm test` au vert.

Le Studio ne connaissait qu'un pattern par groupe, une scène et une Song
Position implicites — `createEp133ProjectDocument` l'écrivait en dur et
`studioStateFromDocument` jetait le reste au chargement, alors que le format
machine réel (`.pak`/`.ppak`) supporte déjà nativement jusqu'à 99 patterns par
groupe, 99 scènes et 99 Song Positions (confirmé sur `public/ep133-project-1.json` :
groupe A a les patterns 01/02/03, groupe B seulement 02/03, 3 scènes).

- [x] `src/core/project/song.ts` : `PatternBank`, `SceneDefinition`,
  `sceneIsUsed` (réplique exactement la règle du décodeur réel), `patternsForScene` ;
- [x] `exporters.ts`/`studioLibrary.ts` : écriture et lecture de toute la
  banque/scènes/song, plus `currentScene`, au lieu de collapser à un pattern ;
  round-trip et rétrocompatibilité ancien format vérifiés dans
  `tools/check-project-exports.mjs` ;
- [x] sélecteur `PATTERN: [ A01 ▲▼ ]` dans la barre du Studio pour choisir le
  pattern édité au sein du groupe actif ;
- [x] switch `[ EDIT PATTERN ] / [ ARRANGEMENT ]` ;
- [x] `SongArranger.tsx` : storyboard horizontal des Song Positions, blocs de
  groupe colorés (convention Studio, pas un fait matériel confirmé),
  aperçu schématique dérivé des frappes (pas d'audio réel), `[DUP]`/`[DELETE]`,
  glisser-déposer pour réordonner les positions et affecter un pattern depuis
  le pool ; `SongModeBar.tsx` (figé à Song Position 1 / Scène 1) est retiré,
  entièrement absorbé ;
- [ ] avancée automatique d'une Song Position à la suivante pendant la
  lecture du morceau complet — hors scope, transport trop large pour ce
  chantier ; seule l'audition d'une scène à la fois est possible.

Voir `docs/STRUCTURE_SONG_MODE.md` et `docs/MODELE_DONNEES_PROJET.md`.

## Étape 4.2 — identité multilingue et suivi des traductions

Statut : première tranche livrée le 11 août 2026, tests et build réussis.

- [x] sélecteur `FR / EN / ES` après la marque KO II Studio ;
- [x] choix mémorisé dans le navigateur ;
- [x] page d'accueil traduite dans les trois langues ;
- [x] centre documentaire, navigation et fiches traduits ;
- [x] README français, anglais et espagnol ;
- [x] registre central créé dans `docs/SUIVI_TRADUCTIONS.md` ;
- [ ] composants communs et messages système ;
- [ ] Pattern & Song Studio ;
- [ ] Sons & Transfert ;
- [ ] Test Machine / MIDI ;
- [ ] Rhythm Hero ;
- [ ] contenu intégral des guides techniques en anglais et espagnol.

Le fond quadrillé de la présentation est désormais la toile de fond commune
de l'application, y compris pour l'éditeur plein écran et le banc de test.

## Étape 4.3 — longueur native des patterns `LN.n`

Statut : contrôle Studio livré le 11 août 2026, validation matérielle de
l'écriture encore verrouillée.

- [x] notice OS 2.0 vérifiée : `LN.1` = une mesure et longueur maximale 99 ;
- [x] contrôle `−  LN.n  ＋` ajouté à côté du pattern actif ;
- [x] sélecteur visuel `PATTERN A01` retiré pour laisser la priorité au réglage
  de longueur ; le pattern exact reste identifié dans le contexte et la Song ;
- [x] grille continue avec séparations verticales sombres à chaque temps et
  renforcées au début de chaque bloc de 16 pas, y compris dans le piano-roll ;
- [x] afficheur `LN.n` compact déplacé à côté de `BOUCLE ON/OFF`, sans libellé
  secondaire ; en-têtes de grille gris à vide et orange dès qu'ils contiennent
  au moins une note ;
- [x] toile d'édition blanche étendue à toute la largeur et toute la hauteur
  disponibles, même pour `LN.1`, sans créer de faux pas hors longueur.
- [x] une zone contenant des notes verrouille la borne minimale de `LN` : le
  bouton moins ne peut plus tronquer une partie déjà écrite ; son bandeau
  orange arrondi matérialise cette zone figée.
- [x] suppression de la mesure de réserve automatique dans le Studio complet ;
- [x] grille principale libellée avec la longueur native plutôt que « MESURE » ;
- [x] diminution protégée par confirmation si des notes seraient tronquées ;
- [x] valeur `bars` importée des projets réels et conservée à l'export JSON ;
- [x] longueur propre à chaque couple groupe/pattern ;
- [ ] compilation `.ppak`, écriture sur projet brouillon et relecture sur un
  vrai EP-133 avant de déclarer la synchronisation matérielle compatible.
