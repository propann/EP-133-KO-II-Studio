# Protocole SysEx et formats — synthèse Codex

## Ce qui est solidement exploitable

### Identité MIDI

La requête universelle d’identité observée dans les outils est :

```text
F0 7E 7F 06 01 F7
```

Elle doit rester le premier test de détection. Une réponse d’identité ne prouve pas que toutes les fonctions EP-133 sont disponibles.

### Préfixe Teenage Engineering

Les échanges propriétaires observés utilisent le préfixe :

```text
F0 00 20 76 33 40 ... F7
```

Le bundle du Sample Tool documente notamment les commandes GREET, ECHO et DFU, les statuts d’erreur et une structure de requête avec bit de requête, identifiant éventuel et payload compacté en valeurs 7 bits. Cette description est une base d’analyse, pas une autorisation d’envoyer une commande inconnue.

### Événements spontanés

Le Sample Tool distingue les réponses à une requête des SysEx spontanés. C’est important pour les boutons A–D : l’application doit écouter toutes les entrées SysEx, conserver la trame brute dans le journal et ne pas filtrer uniquement les réponses à une transaction initiée par le PC.

## Format projet et bibliothèque

- `.pak/.ppak` et leur TAR interne contiennent des ressources de projet, de pad, de pattern, de scène, de Song, d’automation, de mixage et de métadonnées.
- `ep133-ppak` fournit des offsets et identifiants utiles, mais les numéros de pad et l’ordre logique doivent être vérifiés contre les fixtures et le matériel.
- `ep-series-sysex` revendique la lecture/écriture/vérification de projets et bibliothèques complètes. Pour le Studio, la lecture et la conservation des octets bruts sont prioritaires ; l’écriture reste un chantier séparé.
- `ep133-krate` documente aussi un protocole de fichiers par slots et des transactions upload/get/metadata. Ses propres gaps sont instructifs : playback encore incomplet, requête device-info non confirmée, mapping B/C/D partiel et listing des projets non capturé.
- Le Sample Tool emploie aussi des flux de fichiers pour les sauvegardes et les sons. Une sauvegarde « projet seul » est fonctionnellement différente d’une sauvegarde complète.

## Sons et WAV

Le dépôt `ep_133_sysex_thingy` documente des WAV mono 16 bits à 46 875 Hz et un en-tête JSON de paramètres tels que playmode, rootnote, pitch, pan, amplitude, attack, release et time.mode. À traiter comme format observé dans ce dépôt : chaque nouvelle version doit être comparée à un export réel.

## Risques de protocole

1. Une trame correctement formée peut quand même être refusée par firmware.
2. Une commande de suppression, d’envoi ou de changement de projet peut modifier la machine.
3. Les messages MIDI ordinaires et les SysEx propriétaires sont deux familles à journaliser séparément.
4. L’absence de réponse n’indique pas toujours une panne : mauvais port, mauvais filtre, délai, interface Web MIDI ou message consommé par une autre application sont possibles.
5. La validation navigateur et la validation sur EP-133 réel doivent rester deux colonnes indépendantes dans les rapports.
6. Le fait que le groupe A soit mieux capturé que B/C/D confirme qu’un mapping observé sur A ne doit pas être généralisé automatiquement aux autres pages.

## Protocole de preuve recommandé

Pour chaque nouvelle trame : sauvegarder direction, port exact, horodatage, octets hexadécimaux, firmware, projet sélectionné et résultat visible. Commencer par identité et lecture non destructive. Ne tester une écriture qu’après sauvegarde et accord explicite.
