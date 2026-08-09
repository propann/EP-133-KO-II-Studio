# Lancement local

Le player est un site statique : pas de base de données, pas de compte, pas de dépendance JavaScript. Python sert seulement les fichiers dans le navigateur.

## Windows — le plus simple

1. Télécharger ou cloner le dépôt.
2. Double-cliquer sur `start-windows.cmd`.
3. Chrome ou Edge ouvre automatiquement `http://127.0.0.1:8787/docs/ep133-pad-player.html`.
4. Fermer la petite fenêtre noire pour arrêter le serveur.

`127.0.0.1` est important : quand la connexion MIDI sera ajoutée, Chrome/Edge autorisent l'API MIDI sur cette adresse locale.

## Raspberry Pi — serveur d'entraînement local

Sur le Pi :

```bash
git clone https://github.com/propann/ep133-rhythm-hero.git
cd ep133-rhythm-hero
chmod +x tools/start-pi-local.sh
./tools/start-pi-local.sh
```

Depuis un autre appareil du même Wi-Fi, ouvrir :

```text
http://IP_DU_PI:8787/docs/ep133-pad-player.html
```

Pour connaître l'adresse du Pi :

```bash
hostname -I
```

Le Pi est idéal pour le cours, la partition et les sons de repère sur le réseau local. Pour analyser les frappes USB-MIDI du K.O. II, le premier test doit rester sur le PC auquel la machine est branchée, en `localhost`. Une interface servie par le Pi via une IP locale ne recevra pas automatiquement le MIDI du PC.

## Vérification rapide

- choisir un niveau ;
- choisir 1 à 4 mesures ;
- lancer la lecture ;
- frapper les pads affichés ;
- vérifier que la partition joueur s'écrit en ambre.

## État technique contrôlé

| Élément | État |
|---|---|
| Player HTML autonome | OK |
| 39 exercices et difficultés | OK |
| Mesures 1 à 4 et variations | OK |
| Partition joueur à l'écran | OK |
| Son de repère et VU-mètre | OK |
| MIDI USB réel / score précis | à tester sur le K.O. II |

Le serveur local ne rend pas le projet « hébergé ». Il évite simplement les problèmes de navigateur et prépare le terrain pour le MIDI local.
