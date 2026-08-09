# Architecture — miroir local de l'EP-133

## Vision retenue

L'application doit fonctionner comme un clone de travail de l'EP-133 lorsque
la machine est débranchée. Lorsqu'elle est connectée, elle devient à la fois une
source de vérité matérielle et une surface de contrôle MIDI.

Le miroir local ne signifie pas copier ou publier la banque constructeur. Les
données et fichiers audio restent privés sur l'ordinateur de leur propriétaire.

## Première connexion

L'assistant doit suivre cet ordre :

1. détecter et identifier la machine ;
2. demander un nom local stable, car plusieurs EP peuvent être utilisés ;
3. choisir la capacité déclarée, 64 ou 128 Mo ;
4. lire la capacité réellement observable et signaler toute incohérence ;
5. choisir explicitement un dossier de samples sur l'ordinateur ;
6. inventorier les 999 slots possibles et tous les projets ;
7. proposer séparément la copie privée des fichiers audio ;
8. créer un instantané initial immuable servant de base aux comparaisons.

Le profil nommé, la capacité et le dossier choisi existent maintenant dans la
page Sons & Transfert. L'inventaire global réel contient 527 sons et 56,21 Mo.
La même préparation est accessible dans le Studio par
`FICHIER → CLONER LA MACHINE`. Elle crée un manifeste local et son
`INSTANTANÉ INITIAL`.

Tous les fichiers suivent l'arborescence obligatoire
`dossier choisi/clone/nom de la machine/`. Le dossier `clone` est créé
automatiquement et n'est jamais vidé lors d'une nouvelle opération.

## Trois couches de données

### 1. Base machine

Dernier état confirmé par lecture : identité, capacité, slots, métadonnées,
projets, patterns, scènes, Song Positions et réglages. Cette base n'est jamais
modifiée directement par l'éditeur.

### 2. Copie de travail

État modifiable hors ligne. Les samples sont résolus dans le dossier privé
associé au profil. Si l'audio d'un slot n'a pas été copié, l'interface l'indique
et utilise éventuellement un son PC de remplacement explicitement choisi.

### 3. Patch

Différence déterministe entre la base machine et la copie de travail : ajouts,
modifications, déplacements et suppressions. Un patch affiche sa taille, les
slots touchés, l'espace restant et les projets dépendants.

## Synchronisation sûre

Une synchronisation vers la machine devra obligatoirement :

1. relire son identité et vérifier qu'elle correspond au profil ;
2. détecter les changements réalisés sur la machine depuis l'instantané ;
3. arrêter en cas de conflit et proposer un choix explicite ;
4. créer un checkpoint récupérable ;
5. présenter le patch et demander confirmation ;
6. sérialiser les écritures, sans session concurrente ;
7. relire chaque élément écrit ;
8. comparer le résultat, puis seulement actualiser la base machine.

L'écriture reste verrouillée tant que cette chaîne complète n'est pas testée
sur un projet brouillon et des slots réservés.

## Surface de contrôle

À la connexion, les fonctions prouvées seront activées progressivement : pads,
vélocité, groupes et transport MIDI en premier. Le fader, les touches de mode,
les CC et les états d'écran ne seront ajoutés qu'après capture des messages
réels. Aucun miroir LCD fictif ne sera présenté comme un état matériel fiable.

## Time Machine — évolution prévue

Chaque synchronisation validée pourra créer un instantané immuable contenant
le manifeste, les projets, l'index des sons, leurs hashes et les références aux
fichiers audio privés. La future vue Time Machine devra permettre :

- une chronologie nommée et datée ;
- la comparaison de deux états ;
- la restauration locale d'un projet ou d'un sample isolé ;
- la préparation d'un patch de retour vers la machine ;
- une restauration matérielle uniquement après checkpoint et confirmation ;
- une rétention fondée sur les hashes plutôt que sur des copies audio inutiles.

Pour le moment, seul le premier point d'historique est créé. Aucun bouton de
restauration trompeur n'est activé.

## Limite de l'application web

Le navigateur peut demander à l'utilisateur de choisir un dossier, mais il ne
peut pas lancer librement un scan SysEx complet ni conserver partout un chemin
filesystem exploitable. Le produit complet aura donc besoin d'un pont local
sécurisé ou d'une application installable. Le frontend web demeure l'interface
et le moteur d'édition communs.
