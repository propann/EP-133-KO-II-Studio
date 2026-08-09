# Validation — Save/Load du Studio

## Problème corrigé

Le bouton `SAVE` du Studio complet réutilisait auparavant la sauvegarde des
exercices pédagogiques. Il ne conservait que le groupe visible et fermait
l'éditeur. Cette action ne représentait donc pas un véritable projet Studio.

## Fonctionnement actuel

- `NOUVEAU` prépare un projet vide avec les groupes A, B, C et D ;
- `SAVE` sérialise le projet complet dans la bibliothèque locale du navigateur ;
- un second `SAVE` met à jour le projet ouvert au lieu de créer un doublon ;
- le sélecteur et `OUVRIR` restaurent le projet choisi ;
- une confirmation protège le projet affiché avant `NOUVEAU` ou `OUVRIR` s'il
  contient des notes ;
- la sauvegarde `USER` de l'éditeur pédagogique reste indépendante.

## Données conservées

Le document musical utilise le contrat intermédiaire `ep.project.v1`. La
bibliothèque locale ajoute seulement un identifiant et une date de mise à jour.
Elle ne crée pas un nouveau format musical propriétaire.

La restauration conserve :

- nom et tempo ;
- notes des quatre groupes A–D ;
- position à 96 PPQN, pad et hauteur mélodique ;
- vélocité et durée ;
- modes ONE, KEYS et LEGATO ;
- informations de pad lues sur la machine lorsqu'elles sont disponibles.

## Vérification automatisée

`npm run test:exports` effectue un aller-retour mémoire : génération du document,
sauvegarde locale, rechargement, puis comparaison du tempo, des notes, des
groupes, des vélocités, des durées et des modes de pad.

## Limites encore visibles

- pas encore de `Sauvegarder sous`, renommage, duplication ou suppression ;
- pas encore d'import de fichier depuis l'interface ;
- `.pak/.ppak` restent en lecture seule et ne sont pas encore ouverts dans le
  Studio ;
- une sauvegarde uniquement dans le navigateur doit encore être complétée par
  un téléchargement de fichier et une autosauvegarde de secours ;
- scènes multiples et pools de patterns restent à concevoir.
