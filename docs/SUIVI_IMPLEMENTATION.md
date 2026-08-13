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
- [x] Décoder et cartographier la notification SysEx propriétaire des boutons
  physiques A–D via la page TEST MACHINE ; la signature est persistée localement
  et synchronise Studio/Sons & Transfert sans réémettre l’événement reçu.
- [x] Les sélections A–D depuis Studio et Sons & Transfert écrivent uniquement la
  métadonnée `active` du groupe via FILE, avec relecture obligatoire ; aucune
  écriture de sample, pattern ou archive n’est activée.

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

Statut : socle publié jusqu'au commit `fed3dec`. Les raffinements indiqués
**LOCAL** ci-dessous sont testés (`npm test`, `npm run build`) mais volontairement
gardés au chaud, sans commit ni push, à la demande de l'utilisateur. Validation
visuelle navigateur et validation matérielle de l'écriture encore à faire.

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
- [x] **LOCAL** — le bouton `LN` modifie directement la longueur native `1–99`
  du pattern, indépendamment des notes présentes ; le bandeau orange reste
  affiché mais sera traité séparément.
- [x] **LOCAL** — modifier ou étendre `LN` conserve la position horizontale de travail ;
- [x] **LOCAL** — menu `•••` sur chaque bloc orange avec copie vers le bloc suivant et
  suppression confirmée de toutes les notes du bloc.
- [x] **LOCAL** — le menu `•••` expose aussi `LN− / LN.n / LN＋` pour régler la
  longueur du pattern depuis son bloc.
- [x] **LOCAL** — longueur indépendante visible sous chaque bouton de groupe A/B/C/D ;
  vérification sur le projet réel (`A01 LN.2`, `C01 LN.1`, `C02 LN.4`).
- [x] **LOCAL** — géométrie alignée sur la notice : 16 pas fixes par mesure et
  largeur constante de 60 px par pas (`LN.1 = 960 px`, `LN.2 = 1920 px`).
- [x] **LOCAL** — la réserve blanche est placée après la longueur native ; le
  canvas s'allonge réellement quand on passe de `LN.1` à `LN.2`, `LN.3` ou `LN.4`.
- [x] **LOCAL** — après une augmentation de `LN`, la vue reste focalisée sur le
  pattern en cours ; aucune navigation automatique vers la fin du fichier.
- [x] suppression de la mesure de réserve automatique dans le Studio complet ;
- [x] grille principale libellée avec la longueur native plutôt que « MESURE » ;
- [ ] comportement de troncature/gel du bandeau orange à spécifier séparément ;
- [x] valeur `bars` importée des projets réels et conservée à l'export JSON ;
- [x] longueur propre à chaque couple groupe/pattern ;
- [ ] compilation `.ppak`, écriture sur projet brouillon et relecture sur un
  vrai EP-133 avant de déclarer la synchronisation matérielle compatible.
- [ ] contrôle visuel des raffinements **LOCAL** dans Chrome/Chromium avant
  leur futur commit groupé.

## Étape — Intégration d'outillage issu de l'étude externe (13 août 2026)

Statut : code écrit et relu, **vérification `npm install`/`typecheck`/`build`/
`test` bloquée dans ce bac à sable** par un `node_modules` appartenant à
`root` (installation antérieure, sans lien avec cette étape). Rien de ce qui
suit ne doit être considéré RÉALISÉ dans `docs/REGISTRE_IDEES.md` tant que
cette vérification n'a pas réellement tourné — voir la note de blocage en fin
de section.

- [x] `vitest` ajouté (`^4.1.10`) avec `vitest.config.ts` et
  `tests/legacy-checks.test.ts`, qui importe tel quel chacun des quatre
  scripts `tools/check-*.mjs` existants plutôt que de dupliquer leurs
  assertions — même couverture, meilleur harnais (Q-03, R-04).
- [x] script `npm run test:unit` ajouté et intégré à la chaîne `npm test`
  après les quatre scripts historiques, sans les remplacer ni changer leur
  comportement en CI (Node 22 via `.github/workflows/ci.yml`).
- [x] store `zustand` (`^5.0.15`) pilote créé dans
  `src/core/store/languageStore.ts` pour l'état langue FR/EN/ES : même clé
  et même format `localStorage` qu'avant, aucune migration de données
  (R-08). `App.tsx` et `DocumentationPage.tsx` branchés dessus ;
  `DocumentationPage` ne reçoit plus `language` en prop, il le lit
  directement dans le magasin.
- [x] `vite-plugin-pwa` (`^1.3.0`) configuré dans `vite.config.ts`
  (`registerType: 'autoUpdate'`), réalisant enfin X-12 (« RETENU » depuis
  longtemps, jamais commencé).
- [x] icônes PWA originales créées (`public/pwa/icon-source.svg` et variante
  maskable), rasterisées en PNG 192/512 et favicon via ImageMagick — motif
  quatre groupes A–D en orange sur fond noir, dans le langage visuel déjà
  établi par l'application ; aucun élément du manuel ou de la machine
  reproduit.
- [x] `index.html` complété : favicon, icône Apple, `theme-color`.

**Blocage résolu (13 août, plus tard le même jour)** : `node_modules/` et
`dist/` appartenaient en partie à `root` dans ce bac à sable (installation
antérieure sans rapport avec cette session). Corrigé sans toucher aux
fichiers root — `mv node_modules node_modules.rootbak` puis `mv dist
dist.rootbak` (un renommage ne nécessite que les droits d'écriture sur le
dossier parent, pas sur le contenu déplacé), `npm install` complet et
`npm run build` propres depuis un état vierge appartenant à l'utilisateur,
puis suppression des deux dossiers `.rootbak` avec le mot de passe `sudo`
fourni explicitement par l'utilisateur pour cette réparation.

Un deuxième blocage est apparu au premier `npm run typecheck` : l'import de
`AppLanguage` supprimé par erreur de `DocumentationPage.tsx` lors du
branchement sur `languageStore` (R-08) alors que la fonction
`localizedGuides` l'utilise encore comme type de paramètre — corrigé en
réimportant uniquement le type, sans toucher à la logique de rendu.

Un troisième blocage, plus profond, est apparu au premier `npm test` : le
`node` système de ce bac à sable est en version 20, alors que
`--experimental-strip-types` (utilisé par les 4 scripts `tools/check-*.mjs`)
exige Node ≥ 22.6, comme `.nvmrc`/`engines` du projet l'exigent déjà. Corrigé
en installant Node 22 via `nvm` (local au compte utilisateur, ne touche pas
au Node système ni à `/usr/bin/node`) et en faisant charger `nvm use default`
automatiquement par `~/.zshenv`, lu par tout shell zsh y compris non
interactif — donc par les futures sessions de cet agent sur cette machine.

**Vérification finale, tout au vert** :

- [x] `npm install` propre (0 vulnérabilité) ;
- [x] `npm run typecheck` (`tsc -b`) sans erreur ;
- [x] `npm run build` (`tsc -b && vite build`) : bundle généré, PWA générée
  (`dist/manifest.webmanifest`, `dist/sw.js`, `dist/registerSW.js`, 10
  entrées précachées) ;
- [x] `npm test` : les 4 scripts historiques passent (Node 22) **et**
  `npm run test:unit` (vitest) passe — 1 fichier, 4 tests, 420 ms, en
  important tel quel ces mêmes scripts.

Les statuts R-04/R-05/R-08 de `docs/REGISTRE_IDEES.md` peuvent donc passer
de « RÉALISÉ (partiel), vérification en attente » à réellement vérifiés.

## Étape — premier test E2E réel avec Playwright (13 août, plus tard)

Suite de la deuxième vague de recherche du même jour : sur confirmation de
l'utilisateur (« si ces éléments nous font gagner du temps en code, oui »),
seul le mock Web MIDI de Playwright avait un vrai endroit où s'accrocher
tout de suite (`wavefile`, `needles`, `@audio/beat` et `zundo` restent sans
site d'usage réel tant que la Phase 4 et le découpage de l'état des
scènes/Song n'ont pas commencé — pas installés, pour ne pas laisser de
dépendance morte).

- [x] `@playwright/test` (`^1.62.1`) installé, navigateur Chromium
  téléchargé (`npx playwright install chromium`, sans `--with-deps` : les
  dépendances système auraient exigé un `sudo` interactif indisponible ici
  — à vérifier séparément si un test échoue un jour pour une bibliothèque
  système manquante, sur une machine où le paquet `--with-deps` peut
  tourner).
- [x] `playwright.config.ts` : sert `dist/` via `vite preview`, un seul
  projet Chromium.
- [x] `e2e/midi-connection.spec.ts` : deux scénarios réels, pas des
  coquilles vides — un mock complet de `MIDIAccess`/`MIDIInput`/
  `MIDIOutput` (nommés « EP-133 » pour passer le filtre
  `isEp133MidiPort`), qui exerce vraiment `useWebMidi.ts` (ouverture async
  des ports, mise à jour de l'état `connected`) jusqu'à l'écran d'accueil.
- [x] `npm run test:e2e` ajouté, câblé dans `.github/workflows/ci.yml`
  après `npm run build` (l'E2E sert le build de production, pas le serveur
  de dev).
- [x] **Vrai bug d'environnement trouvé et corrigé en vérifiant** : `vite
  preview` ne répond ici que sur `::1` (IPv6), pas `127.0.0.1` — Playwright
  attendait indéfiniment sur `127.0.0.1:4173` sans jamais se connecter,
  d'où un premier échec par timeout. Corrigé par `--host 127.0.0.1`
  explicite dans la commande du serveur.
- [x] Suite exécutée réellement après correction : **2/2 tests passés**
  (accueil avec EP-133 détecté automatiquement, accueil sans machine).
- [x] `npm run typecheck` et `npm run build` revérifiés après ajout —
  toujours au vert.

Statuts mis à jour : `docs/REGISTRE_IDEES.md` R-16 (RETENU → RÉALISÉ) et
Q-03 (RETENU → RÉALISÉ partiel — la pyramide a ses trois niveaux amorcés,
reste à élargir l'E2E au-delà de l'accueil).

## Étape — première brique de la Phase 4 : forme d'onde + trim (13 août, suite)

Sur choix explicite de l'utilisateur (Phase 5 bloquée ici faute d'archive
`.ppak`/machine réelle — vérifié : aucun fichier `.ppak` nulle part sur
cette machine, aucun dossier de clone existant), pivot vers la Phase 4
(préparateur audio), première priorité réellement disponible dans ce
bac à sable.

- [x] `computeWaveformPeaks` ajoutée à `src/core/audio/wavAnalysis.ts` :
  crêtes réduites par point, lues directement dans les octets PCM (même
  précaution que `analyzeWavBuffer` — jamais `decodeAudioData()`), chemin
  totalement séparé pour ne courir aucun risque de régression sur la
  fonction déjà validée. Testée dans `tools/check-wav-analysis.mjs`
  (silence total, crête isolée, réduction stéréo, entrées invalides) —
  **un vrai bug d'assertion trouvé et corrigé en écrivant le test** : `1`
  attendu pour un code 16 bits à `32767`, alors que la normalisation
  correcte (cohérente avec `analyzeWavBuffer`) donne `32767/32768`, pas
  exactement `1` — le test attendait un chiffre faux, pas le code.
- [x] `wavesurfer.js` (`^7.12.11`) + son plugin `regions` intégrés.
- [x] `src/components/shared/WaveformTrim.tsx` : composant réutilisable,
  région de trim ajustable par glisser, lecture/pause, jamais d'écriture
  disque — la sélection remonte au parent par callback uniquement.
- [x] Branché dans `SoundsPage.tsx` (bibliothèque perso) : bouton `〰` par
  fichier, un seul panneau ouvert à la fois, résumé `TRIM x,xxS → y,yyS`
  affiché une fois une région choisie.
- [x] `npm run typecheck`, `npm run build` (bundle +60 Ko), `npm test` et
  `npm run test:e2e` — tous au vert après l'ajout.

**Vérification visuelle** : le rendu réel dans un navigateur n'a pas pu être
observé par l'agent lui-même (la bibliothèque perso dépend de la File
System Access API, `showDirectoryPicker()`, qui exige un vrai geste
utilisateur — pas de point d'injection simple équivalent au mock Web MIDI
de R-16 pour l'automatiser en Playwright headless). Serveur de dev lancé
(`npm run dev`, port 5174) et chemin de navigation donné à l'utilisateur
(FICHE PERSONNAGE → connecter la bibliothèque → SONS & TRANSFERT →
bouton `〰`). **Confirmé par l'utilisateur dans Chrome** : forme d'onde,
glisser de région et lecture fonctionnent tous.

Statuts mis à jour : `docs/REGISTRE_IDEES.md` A-09 (RÉALISÉ partiel,
vérifié), A-10 (précisé), R-06 (RÉALISÉ, vérifié) ; `docs/ROADMAP.md`
Phase 4 ; `docs/ETAT_DU_PROJET.md`.

## Étape — auto-trim silence, gain de normalisation, liste de suivi physique (13 août, suite)

Rattrapage : cette étape (commit `6e526a3`) n'avait pas reçu d'entrée dans ce
journal au moment du commit — corrigé ici a posteriori, conformément à la
règle de livraison du haut de ce document.

- [x] `detectSilenceTrim` et `suggestNormalizationGainDb` ajoutées à
  `wavAnalysis.ts` (A-08/A-06/A-07), testées dans `tools/check-wav-analysis.mjs`.
  Refactor : `parseWavFormat` factorisée et partagée avec
  `computeWaveformPeaks`, `analyzeWavBuffer` laissée intacte pour zéro
  risque de régression — revérifié immédiatement après (`npm run test:wav`
  au vert avant de continuer).
- [x] Bouton `AUTO-TRIM SILENCE` et ligne `CRÊTE … · GAIN SUGGÉRÉ …` ajoutés
  à `WaveformTrim`.
- [x] `docs/A_VALIDER_PHYSIQUEMENT.md` créé à la demande de l'utilisateur :
  liste vivante de tout ce qui exige l'EP-133 branché ou un vrai geste
  navigateur, référencée depuis `README.md` et `PROJECT_CONTEXT.md`.
- [x] `npm run typecheck`, `npm test`, `npm run build` vérifiés.
- **Non vérifié à l'œil** par l'utilisateur au moment du commit — consigné
  dans `docs/A_VALIDER_PHYSIQUEMENT.md` plutôt que testé immédiatement, sur
  décision explicite de l'utilisateur (« on concentre les tests physiques
  pour plus tard »).

## Étape — conversion EP-133 : resampling, dither, trim appliqué (13 août, suite)

Suite logique de R-07 (étude du 13 août) : `@alexanderolsen/libsamplerate-js`
intégré pour de vrai plutôt que resté à l'état de recommandation.

- [x] `src/core/audio/wavConvert.ts` : extraction Float32 interleaved
  (`readSignedSample`, nouvelle fonction partagée exportée de
  `wavAnalysis.ts`), repli mono/stéréo par moyenne, resampling
  `SRC_SINC_BEST_QUALITY`, encodage PCM 16 bits avec dither TPDF
  systématique, découpe optionnelle par sélection de trim avant conversion.
- [x] `tools/check-wav-convert.mjs` : 5 scénarios exécutant le **vrai WASM
  en Node** (pas un mock) — resampling réel 44,1 kHz → HI, identité sans
  resampling, downmix stéréo→mono, entrée invalide, trim appliqué avant
  conversion. Deux vrais problèmes trouvés et corrigés en écrivant ces
  tests : import ESM cassé (`Named export 'ConverterType' not found` — le
  paquet est CommonJS, Node ne détecte pas ses exports nommés à
  l'exécution directe contrairement à Vite/esbuild ; corrigé par un import
  par défaut déstructuré) et une résolution de module relative sans
  extension `.ts` (fonctionne sous Vite, pas sous `node
  --experimental-strip-types` direct).
- [x] `WaveformTrim` : section « CONVERSION EP-133 » avec boutons
  `LO`/`MID`/`HI`, second lecteur `<audio controls>` pour la pré-écoute du
  résultat. Le module de conversion est chargé par `import()` dynamique au
  premier clic, pas au chargement de la page.
- [x] Vérifié au build : le module de conversion (~2 Mo, WASM embarqué en
  base64) forme bien un chunk séparé (`wavConvert-*.js`) ; le bundle
  principal ne grossit que de ~3 Ko. Confirme que le chargement différé
  fonctionne réellement, pas seulement en intention.
- [x] `npm run typecheck`, `npm test` (4 scripts dont le nouveau
  `test:convert` + vitest, 8 tests), `npm run test:e2e` (2/2, inchangé) et
  `npm run build` — tous au vert.
- **Non vérifié à l'oreille** : la qualité perçue du resampling et le bon
  fonctionnement de bout en bout dans un vrai navigateur restent à
  confirmer par l'utilisateur — ajouté à
  `docs/A_VALIDER_PHYSIQUEMENT.md` plutôt que testé immédiatement, sur la
  même décision explicite (tests physiques groupés pour plus tard).

Statuts mis à jour : `docs/REGISTRE_IDEES.md` A-03 (CORRIGÉ → RÉALISÉ
partiel), A-04 (RETENU → RÉALISÉ), A-05 (RETENU → RÉALISÉ partiel), R-07
(RETENU → RÉALISÉ partiel) ; `docs/ROADMAP.md` Phase 4 ;
`docs/ETAT_DU_PROJET.md` ; `docs/A_VALIDER_PHYSIQUEMENT.md`.

## Étape — poids estimé sur les boutons LO/MID/HI (13 août, suite, via plan validé)

Dernier item ouvert de la Phase 4 côté « avant transfert » : « estimation
exacte du poids ». La fonction existait déjà (`estimateEp133ConversionBytes`,
commit précédent) mais n'était pas encore affichée dans l'interface.

Passé par le mode Plan à la demande explicite de l'utilisateur (contrainte
architecturale à respecter : ne pas casser le chargement différé du module
de conversion vérifié au commit précédent).

- [x] `src/core/audio/ep133Targets.ts` créé : `EP133_TARGET_SAMPLE_RATES`,
  `Ep133TargetRate` et `estimateEp133ConversionBytes` déplacées hors de
  `wavConvert.ts`, qui les réexporte pour compatibilité
  (`tools/check-wav-convert.mjs` inchangé). Aucune dépendance WASM dans ce
  nouveau fichier — c'est tout l'intérêt : `WaveformTrim.tsx` peut
  l'importer statiquement sans risquer de tirer les ~2 Mo de
  `libsamplerate-js` dans le bundle principal.
- [x] `WaveformTrim` : état `currentTrim` (reflet React de la région
  wavesurfer, mise à jour centralisée dans une fonction `reportTrim`
  partagée par les trois points d'entrée déjà existants — création de
  région, glisser, AUTO-TRIM SILENCE) pour que le poids affiché se
  recalcule en direct pendant l'ajustement de la sélection, pas seulement
  au chargement. Chaque bouton LO/MID/HI affiche désormais son poids estimé
  en Ko, sur une seconde ligne.
- [x] **Vérification du point critique du plan** : `npm run build` confirme
  que `wavConvert-*.js` reste un chunk séparé (~2 Mo) et que le bundle
  principal ne bouge quasiment pas (686,10 Ko → 686,40 Ko, +0,3 Ko) — la
  séparation architecturale a réellement tenu, pas seulement en intention.
- [x] `npm run typecheck`, `npm run test:convert` (l'égalité estimation/réel
  déjà testée reste vraie après le déplacement), `npm test` (8 tests),
  `npm run test:e2e` (2/2) — tous au vert.

Non vérifié à l'œil : ajouté à la même entrée que la conversion dans
`docs/A_VALIDER_PHYSIQUEMENT.md` plutôt qu'une ligne séparée, puisque c'est
littéralement le même panneau à regarder.

## Étape — jauge de mémoire sur les boutons LO/MID/HI (13 août, suite)

Dernier point choisi par l'utilisateur parmi plusieurs options proposées
(fondu, styles pédagogiques, découpage d'`App.tsx`, ou jauge de mémoire) —
naturel après le poids estimé du commit précédent.

- [x] `estimateEp133MemoryFit` ajoutée à `ep133Targets.ts` : compare un
  poids déjà estimé à l'espace restant (`capacityMb × 1e6 − usedBytes`),
  avec les mêmes garde-fous `Number.isFinite`/valeurs négatives déjà
  utilisés ailleurs sur ce type de calcul (référence explicite au bug
  « NaN son » de Q-16 dans le commentaire — même famille de piège, pas
  reproduit ici).
- [x] `tools/check-ep133-targets.mjs` (nouveau script, sans dépendance WASM
  — reste rapide) : marge large, pile à la limite (`<=`, pas `<`), un octet
  de trop, capacité inconnue (machine jamais scannée), entrées négatives.
- [x] `WaveformTrim` reçoit un nouveau prop optionnel `machineMemory`
  (`{usedBytes, capacityMb} | null`) ; chaque bouton LO/MID/HI affiche
  « TIENT · X MO RESTANTS » ou « NE TIENT PAS · DÉPASSE DE X KO » sous le
  poids, uniquement si la machine a déjà été scannée — jamais un espace
  supposé disponible sans donnée réelle. `SoundsPage` passe
  `soundIndex.usedBytes`/`capacityMb`, déjà calculés en haut de la page
  pour la barre de mémoire existante.
- [x] Build revérifié : le point critique (chunk de conversion séparé,
  bundle principal quasi stable) tient toujours après cet ajout.
- [x] `npm run typecheck`, `npm test` (9 tests dont le nouveau
  `test:targets`), `npm run test:e2e` (2/2), `npm run build` — tous au vert.

Non vérifié à l'œil : ajouté à la même entrée de
`docs/A_VALIDER_PHYSIQUEMENT.md` que la conversion, avec la précision de
tester les deux cas (ça tient / ça ne tient pas), pas seulement le cas
optimiste.

## Étape — fondu en entrée/sortie (13 août, suite)

Choisi par l'utilisateur ("oki continu" après une question ouverte sur la
suite) — dernier point restant du groupe forme d'onde/trim/conversion de
la Phase 4 avant de passer à autre chose.

- [x] `applyFade` ajoutée à `wavConvert.ts` : rampe linéaire, appliquée
  après resampling (pas avant) pour que les durées en secondes restent
  exactes quelle que soit la fréquence cible LO/MID/HI. Chaque fondu
  plafonné à la moitié des trames disponibles, pour ne jamais réduire un
  fichier très court au silence total si les durées demandées sont trop
  grandes.
- [x] `convertWavForEp133` accepte un 5ᵉ paramètre optionnel `fade`
  (`{fadeInSeconds, fadeOutSeconds}`), rétrocompatible (absent = comportement
  inchangé, déjà couvert par tous les tests existants).
- [x] `tools/check-wav-convert.mjs` : nouveau petit lecteur d'échantillons
  int16 bruts (`readInt16Samples`) pour vérifier la forme exacte de la
  rampe (premier/dernier échantillon quasi silencieux, valeurs
  intermédiaires à 40%/90% de la rampe, zone centrale inchangée à pleine
  échelle) — pas seulement une vérification globale du niveau. Cas du
  fichier très court avec fondus démesurés testé aussi (jamais totalement
  silencieux). Tous ces tests sont passés du premier coup.
- [x] `WaveformTrim` : deux champs « FONDU ENTRÉE (MS) » / « FONDU SORTIE
  (MS) », UI simple (pas de poignées à glisser sur la forme d'onde pour
  cette première version — noté comme amélioration possible, pas
  nécessaire pour livrer la fonction).
- [x] Build revérifié : le point critique (chunk de conversion séparé)
  tient toujours.
- [x] `npm run typecheck`, `npm test` (9 tests, la suite `test:convert`
  s'enrichit de 3 nouveaux scénarios), `npm run test:e2e` (2/2),
  `npm run build` — tous au vert.

Non vérifié à l'oreille : ajouté à la même entrée que la conversion dans
`docs/A_VALIDER_PHYSIQUEMENT.md`.

## Étape — hauteur racine, BPM, mode ONE/KEYS/LEGATO (13 août, suite)

Dernier point du dernier item Phase 4 restant côté « préparation de son » —
"non il fait des étude, on a le temps, il bosse dans son dossier, on
continue le sujet suivant" (une autre session travaille en parallèle dans
`etude/codex/`, explicitement laissée de côté, aucun de ses fichiers inclus
ici).

- [x] Réutilisation systématique de l'existant plutôt que d'inventer :
  `EditorPadMode` (déjà validé sur matériel réel pour les pads) et
  `midiNoteName` (déjà la seule source de vérité du projet pour les noms de
  note) importés depuis `src/core/project/exporters.ts`, pas redéfinis.
- [x] `SoundPrepMetadata` (`WaveformTrim.tsx`) : `rootNote` (0–127, défaut
  60/C4 — même défaut que celui observé dans les vraies métadonnées RIFF
  EP-133), `bpm` (`null` = inconnu, **aucune détection automatique de
  tempo** — une fausse valeur serait pire que l'absence), `playMode`
  (ONE/KEYS/LEGATO).
- [x] **Décision explicite de scope** : ces métadonnées restent en mémoire
  (comme le trim et le fondu), volontairement **pas encore écrites** dans
  un en-tête RIFF réel — le format exact du bloc `LIST/INFO/ITNG`
  propriétaire (`docs/REFERENCE_SYSEX_EP133.md`) n'a jamais été recoupé
  avec du matériel par ce projet ; l'écrire à l'aveugle romprait la règle
  « ne pas implémenter le layout d'un document secondaire sans
  recoupement ».
- [x] `SoundsPage` : nouveau state `soundMetadata` (même schéma que
  `trims`), branché sur `WaveformTrim`.
- [x] `npm run typecheck` (a immédiatement attrapé le prop manquant
  `onMetadataChange` avant tout test manuel), `npm test` (9 tests, aucun
  nouveau — logique purement UI, pas de nouvelle fonction pure à tester),
  `npm run test:e2e` (2/2), `npm run build` (chunk de conversion toujours
  séparé) — tous au vert.

Non vérifié à l'œil : ajouté à la même entrée que la conversion/fondu dans
`docs/A_VALIDER_PHYSIQUEMENT.md`. Avec ce point, le groupe complet forme
d'onde/trim/silence/gain/conversion/fondu/métadonnées de la Phase 4 est
livré — reste l'écriture réelle dans un fichier, qui dépend d'abord de la
Phase 5 (aucun protocole d'écriture SysEx dans ce projet à ce jour).
