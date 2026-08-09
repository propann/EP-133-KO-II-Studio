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
- 1.6 : tests du score et de l'extension automatique. **Prochaine étape.**
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
