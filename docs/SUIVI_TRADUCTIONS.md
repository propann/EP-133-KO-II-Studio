# Suivi des traductions — EP-133 KO II Studio

Dernière mise à jour : **13 août 2026**.

## Règles de suivi

- **Complet** : tous les textes visibles de la zone sont traduits.
- **Partiel** : navigation ou résumé traduit, mais certains écrans ou contenus
  liés restent en français.
- **À faire** : aucune traduction intégrée.
- Le français est la langue source. Toute nouvelle fonction visible doit être
  ajoutée à cette matrice avant d'être considérée comme documentée.
- Une traduction d'interface ne signifie pas que le comportement a été validé
  sur un vrai EP-133.

## Interface de l'application

| Zone | Français | Anglais | Espagnol | Remarque |
|---|---|---|---|---|
| Sélecteur et mémorisation de langue | Complet | Complet | Complet | Clé locale `ep133-ko-ii-studio:language:v1` |
| Page d'accueil / présentation | Complet | Complet | Complet | Cartes, état machine et pied de page |
| Centre de documentation | Complet | Complet | Complet | Navigation, résumés et fiches des guides |
| Pattern & Song Studio | Complet | À faire | À faire | Commandes et messages encore en français |
| Sons & Transfert | Complet | À faire | À faire | Commandes et avertissements encore en français |
| Test Machine / journal MIDI | Complet | À faire | À faire | Façade, aide et journal encore en français |
| Rhythm Hero | Complet | À faire | À faire | Barre, score et messages encore en français |
| Dialogues, alertes et confirmations | Complet | À faire | À faire | À centraliser dans le système i18n |

## Présentation GitHub

| Document | Français | Anglais | Espagnol | Remarque |
|---|---|---|---|---|
| Présentation principale | `README.md` complet | `README.en.md` complet | `README.es.md` complet | Liens de langue disponibles en tête |
| Installation rapide | Complet | Complet | Complet | Même procédure dans les trois README |
| Positionnement et fonctions | Complet | Complet | Complet | Studio principal, Rhythm Hero secondaire |

## Documentation technique

| Ensemble | Français | Anglais | Espagnol | Remarque |
|---|---|---|---|---|
| Fiches visibles dans l'application | Complet | Complet | Complet | Les résumés des cartes sont traduits |
| Guides complets du dossier `docs/` | Complet | Partiel | Partiel | Dix-neuf guides anglais et dix-neuf guides espagnols ajoutés ; les autres liens restent sur les sources françaises |
| Guide officiel Teenage Engineering | Lien externe | Lien externe | Lien externe | Aucun contenu constructeur n'est redistribué |
| Player historique `docs/ep133-pad-player.html` | Complet | À faire | À faire | À préserver jusqu'à migration des 39 exercices |

## Ordre de traduction recommandé

1. composants communs, boutons retour, alertes et confirmations ;
2. Pattern & Song Studio ;
3. Sons & Transfert ;
4. Test Machine et journal MIDI/SysEx ;
5. Rhythm Hero ;
6. guides techniques complets, en commençant par lancement, MIDI et clonage ;
7. player historique uniquement si sa traduction reste utile avant sa migration.

## Journal

- **13 août 2026** — traduction anglaise ajoutée pour `LANCEMENT_LOCAL.md`,
  `CONNEXION_ET_CALIBRATION_MIDI.md` et `CLONAGE_COMPLET_MACHINE.md`. Le centre
  de documentation ouvre désormais ces fichiers lorsqu'English est sélectionné.
- **13 août 2026** — poursuite de la traduction pour `STRUCTURE_SONG_MODE.md`,
  `VALIDATION_SAVE_LOAD_STUDIO.md`, `POINT_SONS_ET_TRANSFERT.md` et
  `PONT_LOCAL_CLONAGE.md`, en anglais et en espagnol. Le centre de documentation
  ouvre automatiquement les fichiers localisés disponibles.
- **13 août 2026** — traduction de `MISE_EN_ROUTE_LINUX.md`,
  `MISE_EN_ROUTE_WINDOWS.md`, `CHARGEMENT_PROJET_MACHINE.md`,
  `BANQUE_SAMPLES_STUDIO.md`, `DECISION_FORMATS_PROJET.md` et
  `MODELE_DONNEES_PROJET.md`, en anglais et en espagnol. Le routage EN/ES couvre
  désormais tous les guides affichés dans la bibliothèque principale.
- **13 août 2026** — traduction de `REFERENCE_SYSEX_EP133.md`,
  `POINT_JEU_ET_STUDIO.md`, `GESTION_FICHIERS_ET_SONS.md`,
  `ARCHITECTURE_MIROIR_MACHINE.md`, `VALIDATION_CLONE_REEL.md` et
  `VALIDATION_LECTEUR_PROJET_EP133.md`, en anglais et en espagnol.
- **11 août 2026** — création du système `FR / EN / ES`, mémorisation locale,
  traduction complète de l'accueil et du centre documentaire, traduction des
  trois README et création de ce registre.
