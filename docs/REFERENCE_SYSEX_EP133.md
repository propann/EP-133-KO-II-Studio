# Référence technique EP-133 — MIDI, SysEx et samples

> Document de travail fondé sur les validations effectuées avec un EP-133 réel,
> le code local du Studio et plusieurs dépôts communautaires publics. Il ne remplace
> pas une validation sur la machine. Les opérations d'écriture restent
> désactivées dans l'application tant qu'elles n'ont pas de checkpoint, de
> relecture et de restauration vérifiés.

## Sources étudiées

- [EP-133 Sample Tool](https://github.com/garrettjwilke/ep_133_sample_tool),
  outil Electron hors ligne, archivé le 1er août 2026.
- [EP-133 MIDI SysEx Thingy](https://github.com/garrettjwilke/ep_133_sysex_thingy),
  exemples `.syx`, observations WAV et notes de rétro-ingénierie.
- [Fork pbarilla/ep_133_sample_tool](https://github.com/pbarilla/ep_133_sample_tool),
  mis à jour en mai 2026 et annoncé compatible avec plusieurs appareils EP.
- Le projet MIT [kmorrill/ep-series-sysex](https://github.com/kmorrill/ep-series-sysex),
  déjà utilisé par le scanner local en lecture seule.
- [icherniukh/ep133-krate](https://github.com/icherniukh/ep133-krate)
  (MIT annoncée, localisé et vérifié le 13 août 2026, voir
  `etude/01_ECOSYSTEME_EP133.md`) : gestionnaire de samples fondé sur des
  captures USB-MIDI en direct. Confirme que le transfert audio empile du
  PCM signé little-endian dans le même encodage **Packed7** que nos
  fonctions `pack7`/`unpack7` (`src/core/midi/useWebMidi.ts`) — validation
  croisée indépendante, pas juste un nom similaire. Documente aussi
  explicitement que le groupe A est mieux capturé que B/C/D et que
  plusieurs commandes y restent inconnues : un mapping validé sur A ne doit
  jamais être supposé valable sur B/C/D sans capture séparée.

Les dépôts communautaires sont des références d’observation, pas une garantie
de compatibilité avec toutes les versions de firmware. Les fichiers `.syx`
fournis par leurs auteurs peuvent supprimer, remplacer ou modifier le contenu
de la machine.

## Détection et identification

### Identification MIDI universelle

Le Sample Tool commence par une requête MIDI Identity :

```text
F0 7E 7F 06 01 F7
```

Le préfixe `F0 7E 7F 06 02 ... F7` est la réponse d’identité standard MIDI.
L’outil associe ensuite l’entrée et la sortie qui correspondent au même
appareil, puis envoie une salutation propriétaire.

Dans le navigateur, l’application doit demander `requestMIDIAccess`. Une
première autorisation peut nécessiter un geste utilisateur. Une fois l’accès
accordé, les ports EP-133 peuvent être détectés automatiquement et suivis par
`statechange`. Le Studio filtre volontairement les ports dont le nom contient
`EP-133` afin de ne pas envoyer de notes à `Midi Through`.

### Préfixe SysEx Teenage Engineering

Les messages propriétaires observés utilisent généralement :

```text
F0 00 20 76 33 40 ... F7
```

Signification confirmée par le bundle du Sample Tool :

| Octet | Rôle |
|---|---|
| `F0` | début SysEx |
| `00 20 76` | identifiant constructeur Teenage Engineering |
| `33` | famille EP-133/EP Series observée |
| `40` | protocole TE utilisé par le Sample Tool |
| octet suivant | identifiant d’appareil ou commande |
| `F7` | fin SysEx |

Le protocole de fichier déjà implémenté dans `src/core/midi/useWebMidi.ts`
utilise la même famille, avec un identifiant de requête sur deux octets et une
commande `05` pour les échanges FILE.

## Transport et encodage

### Requêtes TE générales

Le Sample Tool construit les requêtes sous la forme conceptuelle suivante :

```text
F0 00 20 76 33 40
   device-id
   40 | request-id-high
   request-id-low
   command
   payload encodé
F7
```

Le bit `0x40` indique une requête. Le bit `0x20` signale que l’identifiant de
requête est présent. L’identifiant est limité à 12 bits et augmente pour
permettre l’association entre requête et réponse.

Les données binaires sont emballées par groupes de sept octets : un octet de
flags indique quels octets originaux avaient leur bit 7 positionné, puis les
sept valeurs sont transmises avec leur bit 7 retiré. Le Studio possède déjà
les fonctions équivalentes `pack7` et `unpack7`.

### Réponses et statuts

Les statuts généraux observés sont :

| Statut | Signification |
|---:|---|
| `0` | succès |
| `1` | erreur générale |
| `2` | commande inconnue |
| `3` | requête invalide |
| `0x10–0x3F` | erreur spécifique |
| `0x40+` | succès spécifique ou progression |

Le Sample Tool attend une réponse portant le même identifiant de requête. Les
réponses de transfert peuvent être intermédiaires ; il faut donc prévoir un
timeout long et ne pas considérer la première réponse comme la fin d’un
transfert.

### Événements spontanés — piste A–D

Le bundle officiel distingue deux chemins :

- un SysEx avec identifiant de requête est remis à la promesse qui attend la
  réponse correspondante ;
- un SysEx TE sans identifiant de requête est distribué comme événement MIDI
  spontané à l’interface.

Cette distinction est essentielle pour les boutons physiques A–D. Ils peuvent
donc notifier le changement de groupe sans envoyer de note MIDI et sans que le
Studio ait initié une requête. Notre hook reçoit déjà ces octets dans
`MidiObservation`, mais ne les interprète pas encore.

La procédure de validation à appliquer sur la machine réelle est :

1. ouvrir **TEST MACHINE** ;
2. connecter en mode diagnostic complet ;
3. relever le SysEx reçu après A, puis B, C et D ;
4. répéter deux fois chaque bouton ;
5. comparer les payloads et vérifier qu’aucun autre contrôle ne produit la
   même signature ;
6. seulement ensuite associer l’événement à `EDITOR_GROUPS`.

Le mapping ne doit pas se baser sur un seul octet supposé. Il doit vérifier le
préfixe TE, le type d’événement, le projet actif et la valeur `active` relue.
Une fois le format confirmé, le comportement cible sera :

```text
bouton physique A–D
        ↓
notification SysEx spontanée
        ↓
lecture du projet/groupe actif si nécessaire
        ↓
sélection locale du groupe React
        ↓
mise à jour de l’éditeur sans renvoyer la notification
```

Le dernier point évite une boucle : une notification reçue ne doit jamais être
réémise automatiquement vers la machine.

## Commandes observées

### Initialisation FILE

Les fichiers communautaires commencent souvent par une séquence équivalente à :

```text
F0 7E 7F 06 01 F7
F0 00 20 76 33 40 61 17 01 F7
F0 00 20 76 33 40 61 18 05 00 01 01 00 40 00 00 F7
```

Cette séquence initialise l’échange et l’abonnement aux événements dans les
exemples observés. Elle ne doit pas être envoyée par le Studio tant que la
session n’est pas explicitement engagée par l’utilisateur.

### Salutation et diagnostic

Le bundle du Sample Tool documente des commandes générales :

| Commande logique | Valeur observée | Usage |
|---|---:|---|
| `GREET` | `1` | demander les métadonnées de l’appareil |
| `ECHO` | `2` | vérifier le trajet aller/retour d’un payload |
| `DFU` | `3` | opérations de bootloader, dangereuses |
| produit spécifique | `127` | commandes propres à l’appareil |

La réponse `GREET` est une chaîne de métadonnées séparée par des points-
virgules, avec des champs comme `chip_id`, `mode`, `os_version`, `product`,
`serial`, `sku`, `sw_version` et `base_sku`.

Le Studio peut intégrer `GREET` et `ECHO` dans un futur diagnostic, mais les
commandes DFU doivent rester hors de portée de l’interface utilisateur.

### Sélection de projet

Un exemple communautaire sélectionne le projet 6 avec la métadonnée :

```json
{"active":8000}
```

Notre analyse précédente du protocole FILE a établi la logique suivante pour
un projet de fid `P` :

```text
projects : 2000
groups   : P + 100
groupe A : P + 200
groupe B : P + 300
groupe C : P + 400
groupe D : P + 500
```

La sélection A–D existante dans `useWebMidi.ts` fait une lecture préalable,
écrit `active`, puis relit la valeur. Cette écriture de métadonnée est la seule
écriture actuellement raccordée au Studio et doit rester protégée par sa
relecture.

### Affectation d’un son à un pad

Un exemple communautaire contient une écriture de métadonnée semblable à :

```json
{"sym":2}
```

pour le projet 3, la banque A et le pad 2. Cela confirme que l’affectation
son → pad est distincte du fichier audio lui-même. Le format exact du chemin et
des fids doit encore être recoupé avec une capture complète de l’outil officiel.

## Samples et WAV

### Contraintes audio observées

Les notes communautaires indiquent :

- fréquence : `46875 Hz` ;
- mono ;
- PCM 16 bits ;
- conversion type :

```bash
sox INPUT.wav -c 1 -r 46875 -b 16 OUTPUT.wav
```

Le Studio analyse déjà les WAV, mais ne convertit pas encore les fichiers vers
ce format cible.

### En-tête RIFF propriétaire

Un sample exporté par l’EP-133 conserve les données audio mais ajoute des
blocs RIFF `smpl` et `LIST/INFO/ITNG`. Le bloc texte contient actuellement un
objet de métadonnées de cette forme :

```json
{
  "sound.playmode": "oneshot",
  "sound.rootnote": 60,
  "sound.pitch": 0,
  "sound.pan": 0,
  "sound.amplitude": 100,
  "envelope.attack": 0,
  "envelope.release": 255,
  "time.mode": "off"
}
```

Le champ `rootnote` est particulièrement important pour le mode KEYS. Le
Studio doit préserver les métadonnées plutôt que reconstruire un sample à
partir de l’audio seul.

### Transfert de sample

Les exemples `.syx` contiennent des séquences fonctionnelles d’environ 700
octets pour un très petit sample et plus de 100 ko pour un sample complet.
Elles montrent qu’un transfert comprend plusieurs étapes et doit être traité
comme une transaction :

1. initialiser la session FILE ;
2. annoncer le slot cible et les métadonnées ;
3. transférer les blocs audio encodés ;
4. attendre les réponses intermédiaires ;
5. attendre la réponse finale ;
6. relire les métadonnées et le contenu ;
7. produire un hash et un rapport.

Le Studio ne doit pas envoyer ces fichiers `.syx` tels quels : ils contiennent
des slots et des données fixes, et certains écrasent les slots 001–004 ou 011.
Ils servent uniquement de fixtures d’analyse.

## Ce que nous pouvons intégrer sans risque immédiat

- documentation de `GREET`, `ECHO` et de l’identification MIDI ;
- analyseur de fichiers `.syx` en lecture seule ;
- affichage du numéro de requête, de la commande et du statut ;
- conversion WAV mono 16 bits 46 875 Hz ;
- lecture et écriture locale de l’en-tête RIFF propriétaire ;
- test d’un `ECHO` non destructif sur une machine de test ;
- export d’une capture SysEx pour comparaison avec l’outil officiel.

## Ce qui reste interdit dans l’application

- suppression de sample ;
- écrasement d’un slot sans checkpoint ;
- écriture d’affectation son → pad sans sauvegarde préalable ;
- changement de projet sans confirmation explicite ;
- entrée ou sortie DFU ;
- envoi automatique d’un fichier `.syx` récupéré sur Internet.

## Plan de validation matériel

1. Détecter l’EP-133 par Identity Request et relever la réponse.
2. Envoyer uniquement `GREET` et comparer les métadonnées.
3. Tester `ECHO` avec un payload vide ou neutre.
4. Lire les métadonnées du projet actif.
5. Capturer une sélection A–D depuis l’outil officiel et comparer les fids.
6. Capturer une affectation son → pad sans la reproduire.
7. Préparer un projet de test sauvegardé.
8. Tester un transfert audio vers un slot sacrifiable.
9. Relire le slot, comparer le WAV, les métadonnées et le hash.
10. N’autoriser une fonction Studio qu’après validation répétée sur deux
    opérations identiques.

## Statut dans EP-133 KO II Studio

| Domaine | État |
|---|---|
| Notes MIDI des pads | validé sur EP-133 réel |
| Détection automatique des ports nommés EP-133 | implémentée |
| FILE lecture de métadonnées | implémentée en lecture seule |
| Sélection de groupe A–D | implémentée avec relecture |
| Clone local projets/samples | validé sur machine réelle |
| Analyse WAV | implémentée |
| Conversion vers 46 875 Hz | à faire |
| Génération d’en-tête RIFF EP-133 | à faire |
| Écriture de sample | désactivée |
| Écriture de projet `.ppak` | désactivée |
| DFU/firmware | hors périmètre |
