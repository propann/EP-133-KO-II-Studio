# Clonage complet de la machine

## Définition

Un clone complet contient réellement :

- les neuf projets de l'EP-133 sous forme d'archives TAR originales ;
- tous les slots audio occupés sous forme PCM ;
- les métadonnées de chaque slot ;
- un hash SHA-256 de chaque projet et sample ;
- un manifeste global avec état, erreurs et résumé ;
- le nom du profil et la capacité 64/128 Mo déclarée.

Un simple inventaire JSON n'est donc plus appelé « clone complet ».

## Moteur livré

`tools/clone_ep133_readonly.py` réalise cette copie sans aucune écriture vers la
machine. Il reçoit obligatoirement un dossier cible explicite et crée :

```text
dossier-choisi/
└── clone/
    └── nom-de-la-machine/
        ├── manifest.json
        ├── clone.log
        ├── history/
        │   └── manifest-<date>.json
        ├── projects/
        │   ├── P01.tar
        │   └── … P09.tar
        ├── samples/
        │   ├── 001.pcm
        │   └── …
        └── metadata/
            ├── 001.json
            └── …
```

Le dossier `clone` est créé automatiquement s'il n'existe pas. S'il existe,
il est réutilisé sans suppression. Chaque machine possède obligatoirement son
propre sous-dossier normalisé afin d'éviter de mélanger deux appareils.

Le manifeste, les projets, les PCM et les métadonnées sont écrits atomiquement.
Lorsqu'un manifeste précédent existe, il est archivé dans `history/` avant la
synchronisation. Les erreurs isolées sont consignées sans rendre les données
déjà copiées inutiles.

À partir du schéma `ep133.rhythm-hero.clone.v2`, une synchronisation conserve
les projets dont le hash local correspond au dernier manifeste et les PCM dont
la taille et le hash local correspondent. Les métadonnées légères sont relues à
chaque passage afin de détecter une modification sans télécharger à nouveau
l'audio. Le résumé distingue les projets modifiés, les sons ajoutés ou
modifiés, les sons inchangés et les slots disparus.

Limite connue : la liste de fichiers fournie par la machine n'expose pas de
checksum du PCM distant. Le moteur ne peut donc pas reconnaître sans
retéléchargement un remplacement audio ayant exactement la même taille et les
mêmes métadonnées. Les fichiers correspondant aux slots disparus sont conservés
sur disque ; leur absence est signalée sans suppression automatique.

## Durée et progression

Le premier clone réel de 527 sons a duré **25 minutes et 20 secondes**. Il faut
donc annoncer une fourchette prudente de **20 à 30 minutes** avant la première
copie. Le coût vient principalement des sessions de lecture SysEx, pas seulement
des 56,21 Mo transférés.

Le manifeste expose pendant l'opération :

- la phase `projects` ou `samples` ;
- le numéro courant et le total ;
- le temps écoulé ;
- une estimation du temps restant ;
- les erreurs déjà rencontrées.

La console affiche chaque projet et chaque slot immédiatement. Une reprise est
normalement plus rapide, car les PCM déjà validés par le manifeste et leur hash
local ne sont pas retéléchargés.

### Validation matérielle du 9 août 2026

- statut final : `complete` ;
- 9 projets sur disque ;
- 527 fichiers PCM, soit 56 214 010 octets ;
- 527 fichiers de métadonnées ;
- aucune erreur ;
- dossier total : environ 58 Mo ;
- destination : `Musique/OP-133/clone/MON-EP-133/`.

Exécution locale prévue :

```bash
/tmp/ep133-scan-venv/bin/python tools/clone_ep133_readonly.py \
  --out "/chemin/choisi" --name "MON EP-133" --capacity-mb 64
```

## Branchement au Studio

La fenêtre `FICHIER → CLONER LA MACHINE` est raccordée au moteur par le pont
HTTP local décrit dans `PONT_LOCAL_CLONAGE.md`. Le pont fixe le dossier parent à
son démarrage, écoute uniquement sur `127.0.0.1`, lance Python et expose la
progression sans permettre à la page web de choisir un autre chemin.

Le premier clone complet est validé. La synchronisation incrémentale et son
historique ont également été validés depuis le bouton sur la machine réelle :
30,7 secondes pour reconnaître 9 projets et 527 sons inchangés, sans
téléchargement ni erreur. Les 536 hashes et les 527 métadonnées ont ensuite été
contrôlés indépendamment.

## Préparation de la Time Machine

Le clone initial devient le premier checkpoint. Les snapshots suivants
réutiliseront les fichiers dont le hash est inchangé et ne stockeront que les
nouveaux contenus. Un retour vers la machine restera une opération distincte,
avec diff, checkpoint supplémentaire, confirmation et relecture.
