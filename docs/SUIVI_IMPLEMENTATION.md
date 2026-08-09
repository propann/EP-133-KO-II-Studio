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

- 1.2b : décodage en lecture seule des TAR de projet. **Prochaine étape.** Aucun
  format propriétaire Rhythm Hero ne sera créé ; voir
  `DECISION_FORMATS_PROJET.md`.
- 1.3 : tests du transport et nettoyage garanti des timers MIDI/audio.
- 1.4 : découpage des pages Accueil, Jeu, Studio et Sons.
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

Limite volontaire : le contenu binaire des TAR de projet n'est pas encore
décodé dans le navigateur. L'étape 1.2b devra lire les pads, patterns et scènes
en conservant chaque champ inconnu ; l'inspecteur actuel ne compile et ne
réécrit aucune archive.
