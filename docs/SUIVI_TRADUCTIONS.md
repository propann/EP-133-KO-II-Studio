# Suivi des traductions — EP-133 KO II Studio

Dernière mise à jour : **11 août 2026**.

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
| Guides complets du dossier `docs/` | Complet | À faire | À faire | Les liens ouvrent actuellement les sources françaises |
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

- **11 août 2026** — création du système `FR / EN / ES`, mémorisation locale,
  traduction complète de l'accueil et du centre documentaire, traduction des
  trois README et création de ce registre.
