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

Le manifeste est écrit atomiquement après chaque élément. Une reprise conserve
un sample existant lorsque sa taille correspond, puis recalcule son hash. Les
erreurs isolées sont consignées sans rendre les données déjà copiées inutiles.

Exécution locale prévue :

```bash
/tmp/ep133-scan-venv/bin/python tools/clone_ep133_readonly.py \
  --out "/chemin/choisi" --name "MON EP-133" --capacity-mb 64
```

## Branchement à terminer

La fenêtre `FICHIER → CLONER LA MACHINE` prépare actuellement le profil et le
manifeste logique. Un navigateur web ne transmet pas le chemin système complet
du dossier sélectionné et ne peut pas lancer Python. Le prochain composant est
donc un pont local installé, limité à cette commande de lecture et affichant sa
progression. Il recevra le dossier sélectionné via une boîte de dialogue native.

Le bouton ne devra annoncer « clone complet » qu'après contrôle des 9 projets,
du nombre de samples, des tailles et de tous les hashes.

## Préparation de la Time Machine

Le clone initial devient le premier checkpoint. Les snapshots suivants
réutiliseront les fichiers dont le hash est inchangé et ne stockeront que les
nouveaux contenus. Un retour vers la machine restera une opération distincte,
avec diff, checkpoint supplémentaire, confirmation et relecture.
