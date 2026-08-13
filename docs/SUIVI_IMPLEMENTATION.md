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

## Étape — analyse de l'étude parallèle `etude/codex/` (13 août, soir)

À la demande explicite de l'utilisateur (« on fait une analyse complète du
dossier, on réfléchit et on agit ») après avoir laissé l'autre session
travailler sans interférer (« il fait des étude, on a le temps, il bosse
dans son dossier »).

- [x] Les 10 fichiers de `etude/codex/` lus intégralement (catalogue de
  dépôts, protocole/formats, outils produit/UX, licences/risques, pistes
  prioritaires, journal de recherche, hacks/mods matériel et firmware).
- [x] **Rien repris sans vérification séparée** : les affirmations les plus
  concrètes (existence de `icherniukh/ep133-krate`, statut introuvable de
  `gabriel-roth/knockout`, existence de `neilbaldwin/KOII-tips-and-tricks`)
  revérifiées par une recherche indépendante avant toute reprise dans nos
  documents canoniques — pas un simple copier-coller d'une synthèse
  produite par une autre session.
- [x] `icherniukh/ep133-krate` confirmé réel : ajouté à
  `docs/REFERENCE_SYSEX_EP133.md` § Sources étudiées avec ses deux apports
  vérifiables (confirmation croisée de notre propre encodage Packed7 déjà
  implémenté, groupe A mieux capturé que B/C/D).
- [x] `gabriel-roth/knockout` confirmé introuvable par les deux études
  indépendamment. Désambiguïsation trouvée en creusant : un titre d'article
  grand public (avril 2025) utilise « Knockout » comme jeu de mots pour
  l'annonce de la mise à jour OS 2.0, sans rapport avec un dépôt.
- [x] Grille de confiance A/B/C/Interdit et niveaux de risque H0–H3 de
  l'étude parallèle retenus comme lexique complémentaire (R-19) — n'importe
  aucun changement de statut existant, un outil de qualification en plus.
- [x] `etude/00_INDEX.md`, `etude/01_ECOSYSTEME_EP133.md` et
  `docs/REGISTRE_IDEES.md` (R-17 à R-19) mis à jour avec ce qui a été
  vérifié. Aucun fichier de `etude/codex/` inclus dans les commits de cette
  session — dossier d'une autre session, laissé intact.

Aucun changement de code cette étape : synthèse et vérification de
recherche uniquement, pas de nouvelle fonctionnalité.

## Étape — journal de diagnostic téléchargeable (13 août, suite, via plan validé)

Suite directe de l'analyse ci-dessus : « on regarde ce qu'il y a de bon qui
pourrait nous faire gagner du temps ». Un item concret est ressorti de
`etude/codex/05_PISTES_PRIORITAIRES.md` § P0 (« exporter une session de
diagnostic anonymisée »), passé par le mode Plan avant implémentation.

- [x] `downloadDiagnosticLog` (`MachineTestPage.tsx`) : JSON client
  uniquement (`exportedAt`, `userAgent`, `connected`, `sysexEnabled`,
  `inputNames`, `observationCount`, `observations`), déclenché par
  `Blob` + `<a download>` temporaire, aucune écriture disque ni requête
  réseau. Zéro nouvelle plomberie : toutes les données étaient déjà des
  props de cette page.
- [x] **Distinction explicite documentée** avec la capture dev-only
  existante (`/__midi-capture`, `vite.config.ts`, écrit sur le disque du
  serveur, marquée temporaire dans son propre code) : le nouveau bouton
  fonctionne aussi en production et produit un fichier que l'utilisateur
  choisit explicitement de partager, sans rien changer à l'ancien
  mécanisme.
- [x] Bouton désactivé si `observations` est vide, rappel visible
  « Relis le fichier avant de le partager — il inclut les noms des ports
  MIDI détectés. ».
- [x] `npm run typecheck`, `npm test` (9 tests), `npm run build` — tous au
  vert.

Non vérifié dans un vrai navigateur (nécessite l'EP-133 branché pour avoir
des événements réels à exporter) — ajouté à
`docs/A_VALIDER_PHYSIQUEMENT.md`. Statut mis à jour : `docs/REGISTRE_IDEES.md`
R-20 (RÉALISÉ, vérification navigateur en attente).

## Étape — cadre de statut connexion en vert sur la page d'accueil (13 août)

Amont d'un chantier plus large (connexion automatique de la machine, demande
en cours), l'utilisateur a d'abord demandé un scope plus court et précis :
que le cadre de statut déjà présent sur la page d'accueil (`home-machine-status`,
qui affichait déjà « EP‑133 PRÊT À CONNECTER » ou « EP‑133 CONNECTÉ » sans
bouton) reflète visuellement l'état — cadre vert quand connecté, rien de plus.

- [x] Nouveau jeton `--ko-green` dans `src/style.css` (`:root`), cohérent
  avec les autres jetons de couleur déjà centralisés (`--ko-orange`, etc.).
- [x] `.home-machine-status.online` : bordure verte, fond légèrement teinté
  (`color-mix`), ombre portée verte au lieu de noire — appliqué sur le cadre
  entier, pas seulement le point lumineux (`i.online`, aussi repassé au vert
  au lieu de l'orange utilisé jusqu'ici).
- [x] `src/pages/HomePage.tsx` : la classe `online` est désormais posée sur
  le conteneur `home-machine-status` lui-même (`connected ? 'online' : ''`),
  pas seulement sur le point. Libellé simplifié : « CONNECTÉ » au lieu de
  « EP‑133 CONNECTÉ » (le nom de la machine est déjà dans l'en-tête au-dessus,
  redondant dans le cadre de statut) — répercuté en FR/EN/ES.
- [x] Aucun nouveau bouton, aucune suppression de bouton ailleurs pour
  l'instant : la page d'accueil n'a jamais eu de bouton « CONNECTER » — elle
  n'affichait qu'un statut passif, ce qui correspondait déjà à la demande
  « on peut supprimer tout les bouton connecter [...] dès la page de
  présentation ». Les boutons CONNECTER de Test Machine, Sons & Transfert,
  Game Toolbar et Editor Toolbar restent inchangés — chantier séparé, pas
  encore commencé.
- [x] `npm run typecheck`, `npm test` (9 tests), `npm run build` (bundle
  principal inchangé, ~689 Ko ; chunk `wavConvert` toujours isolé, ~2 Mo) —
  tous au vert.

Non vérifié dans un vrai navigateur (rendu du `color-mix`, contraste du vert
sur fond beige) — ajouté à `docs/A_VALIDER_PHYSIQUEMENT.md`.

## Étape — écran EP-133 comme journal MIDI, touches qui bougent, arrondis généralisés (13 août)

Trois demandes distinctes reçues coup sur coup pendant un test réel en
navigateur (page Test Machine et page d'accueil).

**Écran de la façade = journal MIDI, panneau de droite simplifié**

- [x] `MachineTestPage.tsx` : l'écran OLED simulé (`.ep133-display`)
  affiche désormais les 3 derniers messages MIDI reçus (type abrégé +
  hexadécimal tronqué à 21 caractères via `truncateHex`, comme un vrai
  petit écran ne pourrait pas tout montrer), au lieu du texte statique
  `1.33`/kind unique. Le fichier téléchargé (`downloadDiagnosticLog`)
  garde toujours l'intégralité des données, seul l'affichage est tronqué.
- [x] Le panneau `<aside className="midi-event-monitor">` perd sa longue
  liste déroulante détaillée (`.midi-event-list`, ~570px de haut) au
  profit d'un texte court renvoyant vers l'écran de la façade + le
  compteur + le bouton de téléchargement. CSS mort supprimé
  (`.midi-event-list` et ses sous-règles, `min-height:620px` fixe).

**Touches qui bougent au clic ou à la réception MIDI**

- [x] `.ep133-face button:active` et `.ep133-face button.received`
  (message MIDI réellement reçu correspondant à un contrôle mappé)
  translatent maintenant le bouton dans le sens de son ombre portée
  (3px pour les boutons standards, 4px pour les knobs ronds), au lieu de
  rester figés avec juste un changement de couleur. `transition:transform
  .06s` ajoutée sur la règle de base pour un mouvement net mais pas raide.

**Passe d'arrondis généralisée (au-delà de la page d'accueil déjà faite)**

- [x] ~60 règles CSS supplémentaires (dialogues, boutons, champs, badges,
  panneaux Documentation/Sons & Transfert/Clone machine/Editor/Test
  Machine) reçoivent `border-radius` via les jetons existants
  (`--radius`/`--radius-sm`/`--radius-xs` selon la taille de l'élément),
  identifiées par un script Python de parsing de blocs CSS (bordure
  complète sans `border-radius` dans le même bloc). Volontairement laissés
  carrés : résets `border:0`, séparateurs `border-top`/`border-bottom`
  seuls (`.file-menu-divider`, `.sound-bank-browser > nav button`), et les
  cellules à bordure partielle d'une grille tabulaire
  (`.sound-inventory article`, `border-width:0 1px 1px 0`) où arrondir
  casserait visuellement le carrelage.

Vérifié : `npm run typecheck`, `npm test` (9 tests), `npm run build`
(CSS +2 Ko gzip, bundle JS principal et chunk `wavConvert` isolé
inchangés) — tous au vert. Rendu réel des trois changements non vérifié à
l'œil — ajouté à `docs/A_VALIDER_PHYSIQUEMENT.md`.

## Correctif — la pastille restait verte après débranchement (13 août)

Remonté par l'utilisateur en testant en réel : machine débranchée, la
pastille de statut sur la page d'accueil restait verte. Vrai bug, pas un
problème d'affichage seul.

**Cause** : `attachInputs`/`attachOutputs` (`useWebMidi.ts`) filtraient les
ports MIDI **uniquement par nom** (`isEp133MidiPort`). Le navigateur ne
retire pas un port débranché de `access.inputs`/`access.outputs` — il passe
juste son `.state` à `'disconnected'`. Le filtre par nom seul laissait donc
toujours passer le port EP-133 fantôme, et `connected`/`outputConnected`
restaient bloqués à `true` même après débranchement, alors que
`access.onstatechange` redéclenchait pourtant bien `attachInputs`/
`attachOutputs` à chaque changement.

- [x] Ajout de `input.state === 'connected'` / `output.state === 'connected'`
  dans les deux filtres — un port débranché est désormais exclu, `inputs`/
  `outputs` tombent à zéro, `connected`/`outputConnected` repassent à
  `false` et le statut redevient « Entrée EP-133 introuvable ».
- [x] Le mock Playwright (`e2e/midi-connection.spec.ts`) posait déjà
  `state = 'connected'` sur ses faux ports — compatible sans modification.

Vérifié : `npm run typecheck`, `npm test` (9 tests), `npm run build`,
**`npm run test:e2e` (2/2, Chromium réel)** — tous au vert. Le
débranchement physique réel (est-ce que `onstatechange` se déclenche bien
sur ce navigateur/cette machine) reste à confirmer par l'utilisateur —
ajouté à `docs/A_VALIDER_PHYSIQUEMENT.md`.

## Correctif — statut de connexion incohérent d'une page à l'autre (13 août)

Remonté par l'utilisateur juste après le correctif ci-dessus : « quand
c'est connecté ici ça l'est pour toutes les pages, faut que ce soit
verrouillé ». Vérification du code : chaque page piochait effectivement
une valeur différente pour dire « la machine est connectée ».

**Avant** : `HomePage` utilisait `midi.connected || midi.outputConnected`,
`MachineTestPage` utilisait `midi.connected` seul (entrée), `SoundsPage`
et `EditorToolbar` utilisaient `midi.outputConnected` seul (sortie),
`GameToolbar` utilisait `midi.connected` seul, `PlayerProfilePage`
utilisait de nouveau `midi.connected || midi.outputConnected` en double
de la même expression. Cinq expressions différentes pour la même idée —
si l'entrée et la sortie ne basculaient pas exactement au même instant
(react à deux `setState` séparés dans `attachInputs`/`attachOutputs`),
chaque page pouvait effectivement afficher un statut différent.

- [x] `App.tsx` : une seule constante dérivée, `midiReady = midi.connected
  || midi.outputConnected`, calculée une fois juste après
  `useWebMidi(...)`. Les six props de statut (`HomePage.connected`,
  `MachineTestPage.connected`, `SoundsPage.midiConnected`,
  `PlayerProfilePage.machineConnected`, `GameToolbar.midiConnected`,
  `EditorToolbar.midiConnected`) branchées dessus — vérifié au préalable
  dans chaque composant que la prop ne sert qu'à l'affichage du bouton/
  badge CONNECTER, jamais à une décision fonctionnelle d'envoi.
- [x] **Volontairement laissé inchangé** : les six garde-fous fonctionnels
  d'`App.tsx` qui décident si un envoi MIDI/SysEx réel doit partir
  (`if (midi.outputConnected) …`) et le texte du pied de page Studio
  (« SON EP‑133 · <noms> » / « EP‑133 NON CONNECTÉ ») restent sur
  `midi.outputConnected` précisément — ce sont des faits techniques sur la
  capacité d'envoi, pas un badge de statut générique.

Vérifié : `npm run typecheck`, `npm test` (9 tests), `npm run build`,
`npm run test:e2e` (2/2, Chromium réel) — tous au vert. Reste à confirmer
en vrai navigateur, avec la machine branchée, que le statut est
maintenant identique sur toutes les pages en même temps.

## Étape — connexion SysEx automatique, journal MIDI retiré, bouton Test Machine remplacé par la pastille (13 août)

Trois demandes liées reçues à la suite, en continuation directe des deux
correctifs ci-dessus.

**Connexion SysEx automatique dès l'ouverture**

- [x] `useWebMidi.ts` : l'effet de détection automatique au montage
  n'utilise plus une demande `{sysex:false}` séparée et bridée — il
  appelle désormais directement `connectWithInputScope(false)`, exactement
  le même chemin que le bouton CONNECTER manuel (entrées + sorties +
  abonnement aux événements FILE). Si le navigateur a déjà autorisé le
  SysEx pour ce site (visite précédente), la machine apparaît connectée
  sans aucun clic. Si l'autorisation n'a jamais été accordée, la tentative
  échoue silencieusement (ou déclenche l'invite native du navigateur selon
  le moteur) et les boutons CONNECTER restants (Sons & Transfert, Studio,
  Rhythm Hero) servent de repli pour le premier geste explicite.
- [x] Garde-fou ajouté (`autoConnectAttemptedRef`) contre le double appel
  à `requestMIDIAccess` que React StrictMode déclenche en développement
  (deux invocations synchrones du même effet, avant que la première
  résolution n'ait eu le temps de remplir `accessRef`).
- [x] `npm run test:e2e` repasse par ce nouveau chemin sans modification
  du mock (qui ignore déjà l'objet d'options `{sysex}`) — 2/2 toujours au
  vert, y compris le scénario « EP-133 déjà autorisé ».

**Journal MIDI retiré du panneau latéral (déjà sur l'écran de la façade)**

- [x] `MachineTestPage.tsx` : l'`<aside className="midi-event-monitor">`
  disparaît entièrement — le journal vit maintenant uniquement sur l'écran
  OLED simulé (ajouté à l'étape précédente). Le bouton de téléchargement du
  journal de diagnostic (R-20) est relocalisé dans le pied de page, à côté
  d'EFFACER LA CARTOGRAPHIE, avec le compteur affiché dans son libellé et
  le rappel « relis avant de partager » conservé en `title` (infobulle).
  `.machine-test-layout` passe d'une grille à deux colonnes à une mise en
  page centrée à une seule colonne (façade seule). CSS mort supprimé
  (`.midi-event-monitor`, `.midi-event-hint`, `.midi-event-export` et
  sous-règles).

**Bouton « ACTIVER MIDI + SYSEX » remplacé par la pastille de la page d'accueil**

- [x] Le bouton cliquable de l'en-tête Test Machine est remplacé par le
  même composant de statut passif que la page d'accueil
  (`.home-machine-status`/`.online`, réutilisé tel quel) — cadre vert +
  « CONNECTÉ »/« MIDI + SYSEX » une fois connecté, plus de clic possible
  sur cette page. Le prop `onConnect` (qui déclenchait
  `midi.connectMonitor()`, le mode « surveiller tous les ports MIDI » y
  compris non-EP133) est retiré de `MachineTestPageProps` et de son
  câblage dans `App.tsx` — capacité de diagnostic annexe perdue de l'UI,
  acceptée sciemment : la connexion automatique ci-dessus couvre le cas
  normal, et les autres pages gardent un bouton CONNECTER classique pour
  le premier geste explicite si besoin.

Vérifié : `npm run typecheck`, `npm test` (9 tests), `npm run build`,
`npm run test:e2e` (2/2, Chromium réel) — tous au vert. Le comportement
réel du tout premier octroi SysEx (avec ou sans invite navigateur, avec ou
sans geste) n'a jamais été observé dans un vrai navigateur — ajouté à
`docs/A_VALIDER_PHYSIQUEMENT.md`.

## Correctif — l'écran affichait toujours « C » en surbrillance, jamais le vrai groupe (13 août)

Remonté par l'utilisateur en testant en réel (« faut aligner A B C D sur
l'écran aussi »). L'écran OLED simulé (`.display-groups`) affichait
`A / B / C(gras) / D` en dur depuis le début — le groupe D en gras ne
reflétait jamais réellement quel groupe A–D était actif sur la machine,
qu'il vienne d'un bouton physique A–D ou d'une sélection depuis le Studio.

- [x] `App.tsx` suit déjà `machineGroup` (mis à jour par la notification
  SysEx des boutons physiques A–D, et par toute sélection depuis le
  Studio/Sons & Transfert) — transmis en nouvelle prop à `MachineTestPage`.
- [x] `MachineTestPage.tsx` : `.display-groups` met désormais en
  surbrillance la lettre qui correspond réellement à `machineGroup`, au
  lieu du « C » figé.
- [x] Cliquer un bouton de groupe A–D **sur cette page** met aussi à jour
  l'état partagé (`setMachineGroup`) après confirmation de la machine —
  avant, ce clic passait par `midi.selectMachineGroup` directement, sans
  jamais remonter vers l'état global ; les autres pages (Studio, Sons &
  Transfert) ne voyaient donc jamais ce changement.

Vérifié : `npm run typecheck`, `npm test` (9 tests), `npm run build`,
`npm run test:e2e` (2/2, Chromium réel). Non vérifié avec un vrai bouton
physique A–D — ajouté à `docs/A_VALIDER_PHYSIQUEMENT.md`.

## Correctifs — bouton CONNECTER restauré, mode TEST retiré, flash garanti au retour machine (13 août)

Trois retours après un test réel avec la machine branchée.

**Le bouton CONNECTER manquait sur Test Machine**

- [x] Constat : la connexion SysEx automatique au chargement (commit
  précédent) peut échouer silencieusement si le navigateur exige un geste
  pour ce premier octroi — et la page Test Machine n'avait plus aucun
  moyen de déclencher ce geste après le remplacement du bouton par la
  simple pastille. Corrigé : la pastille reste affichée telle quelle une
  fois connectée, mais un bouton `CONNECTER L'EP‑133` / `ACTIVER SYSEX`
  réapparaît juste en dessous tant que `sysexEnabled` est faux — reprend
  `midi.connectMonitor()` (mode « surveiller tous les ports »), retiré par
  erreur au tour précédent.

**Mode TEST retiré (déjà actif par défaut)**

- [x] `configureMode` vaut `false` par défaut, ce qui EST déjà le mode
  test — le bouton `TEST` ne faisait donc que revenir à l'état initial.
  Confirmé par l'utilisateur (« ça marche en mode test, on enlève ce
  bouton test, on fait marcher tout le temps ») : un seul bouton
  `CONFIGURER` reste, qui bascule (entrer/sortir du mode configuration) au
  lieu de deux boutons TEST/CONFIGURER séparés.

**Un contrôle reçu de la machine ne « bougeait » pas comme au clic souris**

- [x] Cause : le clic souris reste visuellement actif tant que le bouton
  est maintenu (`:active` natif) ; un message MIDI réel, lui, ne l'était
  QUE tant qu'il restait « le plus récent » — si la machine envoie
  plusieurs messages en rafale pour une seule pression physique (ou si un
  autre message arrive juste après), le contrôle repassait normal avant
  d'être visible. Corrigé : chaque contrôle touché passe désormais dans un
  `Set` `recentlyReceived` pendant une fenêtre fixe de 220 ms,
  indépendamment des messages suivants (chaque message programme sa propre
  extinction — pas de cleanup d'effet qui annulerait celle du précédent).
  Remplace l'ancien `activeControls` (useMemo réactif à l'instant présent
  uniquement, retiré).
- [ ] **Reste un doute non résolu, volontairement pas deviné** : si le
  SysEx émis par un contrôle physique (hors A–D, déjà validés) contient un
  octet variable (compteur, checksum), sa signature ne correspondra
  jamais deux fois de suite et ce correctif de timing ne suffira pas — il
  faudrait alors comparer deux journaux de diagnostic téléchargés (deux
  pressions du même contrôle) pour le confirmer ou l'infirmer. Pas fait
  faute de matériel réel disponible ici.

Vérifié : `npm run typecheck`, `npm test` (9 tests), `npm run build`,
`npm run test:e2e` (2/2, Chromium réel). Rien de tout ça n'a été revu à
l'œil avec la machine branchée après ce correctif précis — ajouté à
`docs/A_VALIDER_PHYSIQUEMENT.md`.

## Étape — sauvegarde de la fiche personnage dans le dossier de travail (13 août)

Demande : « il faut trouver un moyen de la sauvegarder quelque part pour
qu'elle soit enregistrée [...] à partir de la sélection du dossier de
travail [...] la fiche de personnage, les réglages machine si il y en a ».
Investigation d'abord : les réglages machine (nom, capacité, historique de
scan) étaient **déjà** écrits sur disque via `writeCloneManifest`
(`clone/<machine>/manifest.json`, bouton SCANNER de la Fiche personnage,
existant avant ce chantier) — seule la fiche elle-même (pseudo, avatar,
machines déclarées, bilan cumulé) ne vivait que dans `localStorage`,
jamais sur le dossier de travail.

- [x] `src/core/storage/localFolders.ts` : `writePlayerProfile`/
  `readPlayerProfileFile`, même philosophie que `writeCloneManifest` —
  écrit/relit `profile.json` à la **racine** du dossier de travail (pas
  dans `clone/<machine>/`, puisqu'un profil peut déclarer plusieurs
  machines).
- [x] `src/core/project/playerProfile.ts` : extrait `normalizePlayerProfile(raw)`
  hors de `loadPlayerProfile` (même validation défensive, réutilisable
  pour une valeur venant d'un fichier relu, pas seulement de
  `localStorage`) — `loadPlayerProfile` devient un simple appelant.
- [x] `App.tsx` : trois nouveaux mécanismes, réutilisant exactement le
  dossier de travail déjà mémorisé (`sampleDirectoryHandleRef`, le même
  que SCAN/CLONE) :
  1. **Miroir silencieux** (`mirrorProfileToFolder`) : à chaque
     modification de la fiche, best-effort, seulement si la permission
     écriture est **déjà acquise** pour ce dossier (`hasStoredPermission`,
     jamais de prompt hors d'un geste explicite) — sinon la fiche reste
     seulement en `localStorage`, comme avant, aucune régression.
  2. **`saveProfileToFolder`** (geste explicite, bouton) : ouvre le
     dossier si besoin, réclame l'écriture, écrit `profile.json`,
     retour visible (chemin + heure, ou message d'erreur) — même schéma
     que `scanAndSaveMachine`.
  3. **`restoreProfileFromFolder`** (geste explicite, bouton) : relit
     `profile.json`, confirmation (`window.confirm`, même convention que
     les suppressions ailleurs dans l'app) avant d'écraser la fiche
     affichée, réécrit ensuite `localStorage` avec la version restaurée.
- [x] `PlayerProfilePage.tsx` : nouvelle section « SAUVEGARDE DE LA FICHE »
  avec les deux boutons et le retour visible, expliquant en clair que le
  miroir automatique ne marche que si le dossier est déjà autorisé en
  écriture.
- [x] `tools/check-player-profile.mjs` (nouveau, `npm run test:profile`,
  ajouté à `npm test` et à `tests/legacy-checks.test.ts`) : couvre
  `normalizePlayerProfile` (entrée corrompue, ancien format `gear`,
  round-trip fidèle, stats corrompues jamais un NaN affiché) et le
  round-trip `loadPlayerProfile`/`savePlayerProfile` via un stockage en
  mémoire.

Vérifié : `npm run typecheck`, `npm test` (10 tests, dont le nouveau),
`npm run build` (bundle principal +3 Ko, chunk `wavConvert` isolé
inchangé), `npm run test:e2e` (2/2, Chromium réel). **Non vérifié dans un
vrai navigateur** : l'écriture/lecture réelle de `profile.json` sur disque
(File System Access API) n'a jamais été testée avec un vrai dossier —
ajouté à `docs/A_VALIDER_PHYSIQUEMENT.md`.

## Étape — Studio : statut machine cohérent + projets sur le disque (13 août)

Suite directe du re-test réel de SCAN/CLONE : « le studio là c'est le plus
chaud [...] il faut vraiment qu'on soit raccord machine pareil on
sauvegarde dans les dossiers de l'ordi ». Passé par le mode Plan (plan
détaillé dans `/home/azoth/.claude/plans/velvety-swinging-frog.md`).

**Statut de connexion cohérent (`EditorToolbar.tsx`)**

- [x] Le bouton `editor-midi-out` toujours visible (juste un changement de
  texte/couleur) est remplacé par le même motif que
  `PlayerProfilePage`/`MachineTestPage` : badge passif vert
  (`.editor-midi-status.online`) une fois connecté, bouton `CONNECTER
  EP‑133` affiché seulement si déconnecté. `SoundsPage`/`GameToolbar`
  gardent volontairement l'ancien bouton — hors scope, pas demandé.

**Projets Studio miroités dans le dossier de travail**

Jusqu'ici, `STUDIO_LIBRARY_KEY` ne vivait qu'en `localStorage` — aucun
projet Studio n'avait jamais été écrit sur disque, contrairement à la
fiche personnage.

- [x] `src/core/storage/localFolders.ts` : `LocalDirectoryHandle` étendu
  avec `removeEntry` (méthode native manquante jusqu'ici) ;
  `writeStudioProjectFile`/`removeStudioProjectFile`/`listStudioProjectFileIds`
  — un fichier par projet, `studio/<id>.ep.project.json`, nommé par `id`
  (stable, jamais de collision ni de fichier orphelin après renommage).
  Même document `ep.project.v1` que l'export/import existant : un fichier
  miroité est directement réimportable via le bouton **Importer** déjà
  présent, pas de nouvelle UI de restauration nécessaire.
- [x] `App.tsx` : `mirrorStudioLibraryToFolder(library)` — réconciliation
  complète à chaque appel (écrit/actualise tous les projets, actifs et
  archivés ; supprime les fichiers dont l'id n'est plus dans la
  bibliothèque), best-effort et silencieux comme le miroir de la fiche
  personnage (n'écrit que si la permission écriture est déjà acquise,
  jamais de prompt surprise). `updateStudioLibrary(next)` devient le seul
  point d'appel à `setStudioLibrary` — remplace les 7 appels directs
  existants (`saveStudioProject`, `saveStudioProjectAs`,
  `renameSelectedStudioProject`, `duplicateSelectedStudioProject`,
  `deleteSelectedStudioProject`, `archiveSelectedStudioProject`,
  `importStudioProjectFiles`) sans changer leur logique.
- [x] Aucun nouveau bouton : le miroir se déclenche automatiquement sur
  Enregistrer/Enregistrer sous/Renommer/Dupliquer/Supprimer/Archiver/
  Importer, dès que le dossier de travail est déjà autorisé en écriture.

**Hors scope, assumé** : aucun test Node dédié à l'écriture/réconciliation
disque (File System Access API non mockable côté Node sans nouvelle
dépendance — même limite déjà acceptée pour `writeCloneManifest`/
`writePlayerProfile`).

Vérifié : `npm run typecheck`, `npm test` (10 tests), `npm run build`
(bundle principal +1 Ko), `npm run test:e2e` (2/2, Chromium réel). Le
dossier de travail réel de cette session (`/home/azoth/Musique/OP-133`)
est déjà autorisé en écriture (clone de tout à l'heure) — le premier
enregistrement de projet Studio après ce chantier devrait donc écrire son
fichier miroir sans nouvelle invite. **Non vérifié à l'œil** — ajouté à
`docs/A_VALIDER_PHYSIQUEMENT.md`.

## Phase 5 — première écriture réelle sur la machine (13 août 2026)

Demande directe : « il faut de quoi envoyer un fichier projet dans la
machine et tester ». Phase 5 de `docs/ROADMAP.md`, entièrement non
commencée jusqu'ici — écrire un projet est l'opération la plus sensible
du dépôt entier (règle du projet : jamais écrire sans checkpoint /
confirmation / relecture). Passé par le mode Plan, deux fois (contexte
puis choix du slot de test avec l'utilisateur — P09, confirmé sacrifiable
et vérifié réellement vide).

**Découverte** : `kmorrill/ep-series-sysex` (`epsysex`, déjà installé dans
`/tmp/ep133-scan-venv` pour le pont de clonage) est une bibliothèque
mature (MIT) qui fait exactement ça, avec des garde-fous déjà construits :
`compile_project(doc, base_archive=...)` (JSON → TAR, préserve tout ce qui
n'est pas explicitement décrit quand une base est fournie — notre format
`ep.project.v1` s'est révélé structurellement compatible sans adaptation),
`FileClient.read_project_archive`/`write_project_archive`/`reload_project`
(avec relecture de vérification à chaque écriture de métadonnée), un
verrou inter-processus et un préflight anti-boucle-de-debug avant toute
opération destructive.

**Risque identifié et respecté** : la bibliothèque documente elle-même que
deux sessions FILE simultanées (même deux lectures) peuvent faire entrer
le firmware dans une boucle de debug nécessitant un cycle d'alimentation.
Son verrou ne protège que contre d'autres process Python — l'utilisateur a
été prévenu explicitement de ne rien déclencher côté navigateur pendant
l'exécution du script.

**`tools/send_project_to_machine.py`** (nouveau, script CLI autonome —
pas de bouton web, geste humain explicite à chaque étape) : trois
commandes, `checkpoint` (lecture seule), `write --confirm` (écriture
réelle), `restore --from <checkpoint>` (jamais testée cette session).

- [x] **Étape A (lecture seule)** : identité machine confirmée
  (Teenage Engineering, family 32/member 1), lecture réelle du slot P09
  (4096 octets), checkpoint écrit sur disque, compilation hors ligne d'un
  document de test minimal (1 pad, 1 note) par-dessus le TAR réel lu.
  Rapport : P09 ne contenait que le squelette de répertoires (`pads`,
  `pads/a`-`d`, `patterns`), aucun membre de données — confirmé par
  **deux lecteurs TAR indépendants** (`epsysex.tar.iter_members` et le
  module `tarfile` standard de Python) avant de passer à l'écriture, à la
  demande explicite de l'utilisateur (« vérifie le fichier avant »).
- [x] **Étape B (écriture réelle)** : nouveau checkpoint pris juste avant
  écriture, `write_project_archive` sur P09, relecture immédiate —
  **identique octet à octet** à ce qui venait d'être écrit — puis
  `reload_project` : `activeProjectFid: 11000` (= `3000 + (9-1)×1000`,
  fid attendu pour P09), passage par P01 pour forcer un vrai rechargement
  (la « danse d'activation » documentée par la bibliothèque). **Confirmé
  visuellement par l'utilisateur directement sur la machine** — pas
  seulement un succès rapporté par le logiciel.
- [x] Checkpoints conservés : `/home/azoth/Musique/OP-133/checkpoints/`
  (deux fichiers, avant compilation-test et juste avant l'écriture réelle).

**Ce qui reste** (voir `docs/ROADMAP.md` Phase 5 et
`docs/A_VALIDER_PHYSIQUEMENT.md`) : un vrai projet Studio complet plutôt
qu'une note de test, scènes/Song/automation, le conteneur `.ppak`
autonome, la commande `restore` jamais exercée en réel, et un chemin
depuis l'app web plutôt qu'un script CLI manuel — délibérément pas
construit cette session, le risque d'une action en un clic était jugé
prématuré avant ce premier aller-retour réussi.

Vérifié : exécution réelle des deux étapes contre la machine physique,
relecture octet à octet automatique intégrée au script, et confirmation
humaine directe sur l'écran de la machine. Pas de suite `npm test`
concernée (script Python autonome, hors du pipeline JS).

## Phase 5 (suite) — upload d'un son réel, et le vrai bug trouvé derrière (13 août)

Demande : « on teste avec un son de démo, vérifier, et on scan la machine
pour voir si ça a marché ».

**`tools/send_project_to_machine.py write-sound`** (nouvelle commande) :
`synthesize_demo_wav()` génère un ton de test (440 Hz, 0,3 s, fondu en
douceur, 16 bits mono — aucun fichier audio n'était versionné dans ce
dépôt). `epsysex.dependencies.ensure_sound_dependencies()` détecte
automatiquement un slot son libre (interrogé en direct via
`list_sounds()`, jamais un slot occupé écrasé par erreur), upload le PCM
rééchantillonné à 46 875 Hz, **vérifié octet à octet par la bibliothèque
elle-même**. Le pad A2 du projet P09 est ensuite compilé pour référencer
ce slot et écrit/relu/activé avec les mêmes garanties que la première
écriture. Résultat réel : slot son 58 (libre parmi 527 occupés), 28 124
octets uploadés, écriture du projet vérifiée identique, activation
confirmée.

**Le vrai bug trouvé** : l'utilisateur a cliqué SCANNER (Fiche personnage)
pour vérifier — toujours 527 sons, « Aucun changement détecté ». Pas un
échec de l'upload : `public/ep133-sound-index.json` (ce que SCAN
republie) est un **fichier statique versionné, figé au 9 août**
(`scannedAt: "2026-08-09T20:56:20"`) — `deviceSoundIndex`/`deviceInventory`
sont chargés **une seule fois au démarrage** depuis ce fichier
(`useEffect(() => { fetch('/ep133-sound-index.json')... }, [])`, App.tsx),
jamais depuis une vraie requête à la machine connectée. SCAN ne faisait
donc que republier un instantané figé avec un nouvel horodatage, quoi
qu'il arrive sur la vraie machine. Confirmé indépendamment avec
`epsysex.FileClient.list_sounds()` en direct : **528 sons réels sur la
machine**, slot 58 présent, taille exacte (28124 octets) — l'upload avait
bien fonctionné, c'est le bouton SCAN qui mentait par construction.

**Correctif — SCAN interroge maintenant la machine en direct** :

- `src/core/midi/useWebMidi.ts` : `listMachineSounds()` — implémente la
  commande LIST FILE (`0x04`, paginée) en JavaScript, protocole identique
  à `epsysex.FileClient.list_sounds()` (kmorrill/ep-series-sysex) relu
  dans le code source Python pour reproduire l'octet exact. `getActiveProjectNumber()`
  — même lecture que `selectMachineGroup` (métadonnée `active` du dossier
  `/projects`, fid → numéro de projet), sans écrire.
- `src/App.tsx`, `scanAndSaveMachine` : si le SysEx est actif, interroge
  `listMachineSounds()`/`getActiveProjectNumber()` en direct et met à
  jour `deviceSoundIndex` avec le résultat réel avant d'écrire le
  manifeste ; sinon repli silencieux sur le dernier instantané connu
  (comportement inchangé pour qui n'a pas de connexion SysEx active —
  aucune régression).

Vérifié : `npm run typecheck`, `npm test` (10 tests), `npm run build`,
`npm run test:e2e` (2/2). **La lecture live elle-même (`listMachineSounds`/
`getActiveProjectNumber`) n'a pas encore été cliquée dans un vrai
navigateur** — c'est la toute première fois que ce chemin FILE existe
côté navigateur, à tester en cliquant SCANNER avec la machine branchée.
Ajouté à `docs/A_VALIDER_PHYSIQUEMENT.md`.

### Correctifs après le premier test réel (13 août, même jour)

Premier clic SCANNER en vrai : le manifeste écrit sur disque montrait déjà
528 sons et projet 9, corrects — mais l'écran affichait « PROJET P01 »
malgré tout. `deviceSoundIndex` (pilote le compteur de sons affiché) était
mis à jour dans le chemin live, `deviceInventory` (pilote le « PROJET
Pxx » affiché) ne l'était pas — deux états React distincts, un oubli.
Corrigé : `setDeviceInventory` mis à jour aussi dans `scanAndSaveMachine`
avec le numéro de projet lu en direct.

Ajouté au passage : `lastScanSave.liveOutcome` (`'live' | 'no-sysex' |
'sounds-failed' | 'project-failed'`), affiché juste sous le retour
habituel dans la Fiche personnage — sans ça, un SCAN qui retombe
silencieusement sur l'ancien instantané (SysEx pas actif, par exemple)
était indiscernable à l'écran d'un SCAN qui a vraiment interrogé la
machine. Trouvé utile dès ce premier test : ça a permis de confirmer que
le chemin live tournait bien plutôt que de deviner pourquoi le projet
affiché restait faux.

Vérifié : `npm run typecheck`, `npm test` (10 tests), `npm run build`,
`npm run test:e2e` (2/2). Reconfirmation à l'écran (pas seulement dans le
fichier) pas encore faite — ajouté à `docs/A_VALIDER_PHYSIQUEMENT.md`.

## Règle globale — tout bouton bouge au clic (13 août)

Demande explicite après un test réel des boutons SCAN/CLONER : « il faut
aussi qu'il bouge quand on clic dessus, c'est une règle pour tout les
boutons ». Jusqu'ici, le mouvement au clic n'avait été ajouté qu'au cas
par cas (`.pads button:active`, `.home-card:active`,
`.editor-home-button:active`, `.ep133-face button:active` — voir commits
précédents) ; la grande majorité des boutons de l'app (SCAN, CLONER,
CONNECTER, RESTAURER, etc.) n'avaient qu'un changement de couleur au
survol, jamais de mouvement au clic.

- [x] `src/style.css` : règle globale `button:active { transform:translate(2px,2px); box-shadow:none; }`,
  ajoutée en toute fin de feuille de style avec une spécificité
  volontairement minimale (élément + pseudo-classe) — sert de filet de
  sécurité par défaut. Tout bouton qui a déjà son propre `:active` plus
  spécifique (au moins deux composantes de classe) continue à l'utiliser
  sans changement ; seuls les boutons jusqu'ici sans traitement en
  héritent. `transition` déplacée sur la règle de base `button` pour que
  l'aller ET le retour soient animés, pas seulement l'entrée en `:active`.
- [x] Vérifié par raisonnement sur la spécificité CSS (pas de test
  automatisable pour un effet purement visuel) : chaque `:active` déjà
  existant dans la feuille de style a été recompté à la main pour
  confirmer qu'il reste prioritaire sur la règle globale.

Vérifié : `npm run build` (CSS compile sans erreur), `npm test` (10
tests), `npm run test:e2e` (2/2, Chromium réel) — aucun de ces trois ne
peut confirmer le rendu visuel réel. **Non vérifié à l'œil** — ajouté à
`docs/A_VALIDER_PHYSIQUEMENT.md`.
