# Feuille de route — EP-133 Rhythm Hero

## Vision

Construire une suite locale en français autour du Teenage Engineering EP-133 :

1. apprendre le rythme avec un jeu pédagogique ;
2. créer des exercices simples ;
3. composer dans un éditeur complet raccordé à la machine ;
4. gérer projets, partitions et banques de sons sans dépendre du matériel ;
5. préparer des fichiers contrôlés avant tout transfert vers l'appareil.

L'application doit rester utile lorsque l'EP-133 est déconnecté. Le matériel
apporte ses pads, ses sons et son séquenceur, mais ne doit pas être une condition
pour ouvrir, écouter ou modifier un projet.

## Principes non négociables

- Lecture seule par défaut lors d'un scan de la machine.
- Aucune écriture ou suppression sans cible précise, sauvegarde et confirmation.
- Ne jamais présenter un export expérimental comme garanti compatible.
- Une seule horloge pilote le son, le curseur, la boucle et le MIDI.
- Les données de projet restent ouvertes et documentées en JSON.
- Les valeurs binaires non confirmées sont préservées, jamais réinventées.
- Toute idée, même reportée ou écartée, reste tracée dans
  [REGISTRE_IDEES.md](REGISTRE_IDEES.md).
- Les sons de la machine ne sont pas copiés ou redistribués sans droit explicite.
- Le jeu et le studio restent deux outils séparés sur la page d'accueil.

## État consolidé — 9 août 2026

### Disponible

- Accueil modulaire : Rhythm Hero, Studio EP-133, Sons & Transfert.
- Jeu avec 39 styles, cinq difficultés, compte à rebours, score et Web MIDI.
- Éditeur du jeu à mesures extensibles et sauvegarde locale.
- Studio quatre groupes A–D, 12 pads par groupe et piano-roll KEYS.
- Lecture des sons par l'ordinateur ou par la sortie MIDI de l'EP-133.
- Lecture synchronisée, curseur, défilement, boucle et horloge MIDI.
- Export MIDI et description `ep.project.v1` JSON.
- Scan matériel en lecture seule : projet, pads, slots, noms, modes et notes
  racines. Le scan validé a trouvé 527 sons et 56,21 Mo sur la machine testée.
- Cache local de l'inventaire du projet 1, sans contenu audio.

### Expérimental ou incomplet

- Le JSON EP-133 doit encore être compilé et vérifié en `.ppak` sur une copie
  de projet de test.
- Le mode KEYS écrit les hauteurs MIDI, mais la durée, la vélocité et les
  articulations ne disposent pas encore de leurs éditeurs complets.
- Les modes ONE, KEYS et LEGATO lus sur la machine ne sont pas tous modifiables
  et persistés de bout en bout.
- Le bouton de transfert WAV reste volontairement désactivé.
- Les autres styles que Boom-Bap utilisent encore des partitions générées
  provisoires.
- Les tests automatisés sont insuffisants.

## Phase 1 — stabiliser avant d'ajouter

- [x] Découper `App.tsx` en pages et composants visuels isolés.
- [x] Définir un modèle canonique pour studio, groupes et notes, avec
  adaptateurs explicites pour les cibles de score du jeu.
- [x] Ajouter tests du score, des conversions MIDI et de l'extension automatique.
- [x] Ajouter une gestion centralisée du transport et nettoyer tous les timers.
- [ ] Tester manuellement Chrome/Chromium, écran large et petit écran.
- [ ] Mettre à jour systématiquement l'état du projet après chaque livraison.

**Validation :** build reproductible, aucune note bloquée, navigation et boucle
stables, restauration correcte d'une session locale.

## Phase 2 — menu SAVE / LOAD et bibliothèque de partitions

Transformer `SAVE` en menu de fichiers :

- [x] Nouveau projet quatre groupes avec protection avant remplacement.
- [x] Sauvegarder et Sauvegarder sous.
- [x] Charger un projet local `ep.project.v1` depuis la bibliothèque.
- [ ] Renommer, dupliquer, archiver et supprimer avec confirmation (tout est
  opérationnel sauf l'archivage).
- [ ] Ouvrir et sauvegarder des projets `.pak/.ppak`.
- [ ] Importer et exporter du MIDI standard.
- [ ] Garder `ep.project.v1` comme représentation technique intermédiaire.
- [ ] Lister les exercices officiels du jeu dans la même bibliothèque, en
  lecture seule, avec action « Dupliquer pour modifier ».
- [ ] Miniatures, date de modification, BPM, longueur et groupes utilisés.
- [ ] Autosauvegarde de secours et historique Annuler/Rétablir.

**Validation :** quitter, rouvrir une sauvegarde machine et retrouver une
composition identique sans machine connectée ; échanger ses notes en MIDI.

### Song mode et découpage du morceau

- [x] Afficher les repères machine `L.01`, `S.01`, `A01–D01`.
- [x] Calculer la longueur d'une position depuis le pattern le plus long.
- [ ] Gérer réellement les patterns A01–D99.
- [ ] Créer et éditer les scènes S.01–S.99.
- [ ] Ordonner les Song Positions L.01–L.99.
- [ ] Faire suivre la Song Position active par le transport et l'export.

## Phase 3 — deux banques de sons hors ligne

### Profil et miroir de machine

- [x] Profil local nommé avec choix 64/128 Mo.
- [x] Inventaire global en lecture seule des slots occupés et de leur taille.
- [x] Association explicite d'un dossier local de samples.
- [ ] Identifier automatiquement et durablement chaque machine.
- [ ] Scanner les 9 projets et toutes les métadonnées sonores.
- [ ] Copier les fichiers audio dans le dossier privé avec reprise et hash.
- [x] Moteur local de copie des 9 projets, PCM, métadonnées et hashes.
- [ ] Relier la fenêtre web au moteur par un pont local installé.
- [ ] Créer l'instantané initial immuable.
- [ ] Calculer un patch entre instantané et copie de travail.
- [ ] Détecter les conflits avant toute synchronisation.
- [x] Créer un manifeste local avec un premier instantané daté.
- [ ] Time Machine : chronologie, comparaison et restauration locale.
- [ ] Time Machine : patch de restauration matérielle avec checkpoint.

### Banque ordinateur

- Sons libres ou créés par l'utilisateur, versionnés par identifiant et hash.
- Pré-écoute Web Audio, tags, favoris et recherche.
- Kit de secours permettant de jouer tous les projets hors ligne.

### Banque miroir EP-133

- Inventaire des 999 slots et de la mémoire disponible.
- Noms, métadonnées et affectations des pads issus du scan.
- Audio téléchargé uniquement à la demande et conservé localement avec accord
  de l'utilisateur ; aucune banque constructeur distribuée dans Git.
- Indication claire : métadonnées seules, audio disponible localement ou son
  manquant.

### Résolution des sons

Chaque pad référence un son logique et deux sources possibles : son ordinateur
et slot EP-133. Le projet peut donc être écouté hors ligne puis rejoué avec le
son matériel quand la machine revient.

**Validation :** un projet scanné reste audible après déconnexion, sans intégrer
de fichiers audio propriétaires au dépôt.

## Phase 4 — éditeur et préparateur de sons

- [ ] Import WAV/AIFF, puis MP3/FLAC/OGG si le décodeur retenu le permet.
- [ ] Forme d'onde, trim, normalisation, fondu et détection du silence.
- [ ] Mono/stéréo, fréquence, hauteur racine, BPM, ONE/KEYS/LEGATO.
- [ ] Conversion native cible PCM 16 bits à 46 875 Hz et dither TPDF lorsque
  la réduction de profondeur le nécessite.
- [ ] Pré-écoute avant/après conversion.
- [ ] Conversion contrôlée vers le format accepté par l'EP-133.
- [ ] Estimation exacte du poids et jauge de mémoire avant transfert.
- [ ] Choix prioritaire d'un slot libre.
- [ ] Paquet de sons préparé, manifeste et contrôles d'intégrité.
- [ ] Analyse des doublons et sons orphelins en mode proposition uniquement.
- [ ] Sauvegarde du slot remplacé, confirmation explicite, écriture sérialisée
  puis lecture de vérification.

**Validation :** aucun transfert ne démarre si l'espace est insuffisant ou si
la cible occupée n'a pas été explicitement confirmée.

## Phase 5 — projets EP-133 complets

- [ ] Compiler le JSON avec `kmorrill/ep-series-sysex` (MIT).
- [ ] Générer `.ppak` hors ligne avec rapport de validation.
- [ ] Charger une sauvegarde existante comme base afin de préserver les champs
  inconnus et réglages non édités.
- [ ] Gérer patterns, scènes, song mode, vélocité, durée et automation.
- [ ] Ajouter l'historique Annuler/Rétablir avant les gestes destructifs.
- [ ] Piano-roll : sélection multiple, déplacement, redimensionnement du gate,
  quantification et édition de vélocité.
- [ ] Navigation longue partition : pan molette, zoom centré et défilement
  horizontal, avec équivalents clavier accessibles.
- [ ] Raccourcis limités à la grille ayant le focus : lecture, duplication,
  déplacement, transposition et résolution de grille.
- [ ] Associer les dépendances sonores et détecter les slots absents.
- [ ] Écrire uniquement dans un projet brouillon choisi par l'utilisateur.
- [ ] Checkpoint avant écriture, relecture binaire et restauration possible.

**Validation :** projet de test exporté, chargé, joué et relu sur le firmware de
la machine sans toucher aux autres projets.

## Phase 6 — contenu pédagogique

- [ ] Finaliser cinq partitions validées par style, par blocs de cinq.
- [ ] Historique local des scores et progression.
- [ ] Conseils ciblés sur timing, main, doigt et pad.
- [ ] Importer une composition du studio comme exercice du jeu.
- [ ] Dupliquer un exercice officiel vers USER sans modifier l'original.

## Phase 7 — extension OP-1

Le futur outil OP-1 reprendra la page d'accueil et les briques génériques, mais
gardera son protocole, ses moteurs et ses formats dans un module indépendant.
Voir [VISION_OP1.md](VISION_OP1.md).

## Fonctions de DAW reportées

Ces fonctions sont utiles, mais ne doivent pas retarder la solidité : console de
mixage avancée, plugins, mastering, automation complexe, time-stretch avancé,
arrangement audio multipiste et collaboration en ligne.

Les exports DAWproject et REAPER seront évalués avant les formats propriétaires.
Le projet `phones24/ep133-export-to-daw` constitue une preuve de faisabilité,
mais sa licence AGPL-3.0 impose une frontière juridique explicite. Voir
[ANALYSE_ETUDE_CAHIER_CHARGES.md](ANALYSE_ETUDE_CAHIER_CHARGES.md).
