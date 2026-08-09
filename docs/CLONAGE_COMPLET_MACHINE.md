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

Le manifeste est écrit atomiquement après chaque élément. Une reprise conserve
un sample existant lorsque sa taille correspond, puis recalcule son hash. Les
erreurs isolées sont consignées sans rendre les données déjà copiées inutiles.

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
normalement plus rapide, car les PCM présents et de taille identique ne sont pas
retéléchargés.

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

## Branchement à terminer

La fenêtre `FICHIER → CLONER LA MACHINE` utilise une boîte de dialogue de dossier
native sur Chrome/Chromium. Elle crée réellement
`clone/nom-machine/manifest.json` sur le disque dur, sans upload vers le site.
Le navigateur ne peut toutefois pas lancer le moteur Python qui dialogue avec
le protocole fichier de la machine. Le prochain composant reste donc un pont
local installé, limité à la commande de clonage et affichant sa progression.

Le bouton ne devra annoncer « clone complet » qu'après contrôle des 9 projets,
du nombre de samples, des tailles et de tous les hashes.

## Préparation de la Time Machine

Le clone initial devient le premier checkpoint. Les snapshots suivants
réutiliseront les fichiers dont le hash est inchangé et ne stockeront que les
nouveaux contenus. Un retour vers la machine restera une opération distincte,
avec diff, checkpoint supplémentaire, confirmation et relecture.
