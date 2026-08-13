# Pont local de clonage

## Rôle

Le Studio web ne peut pas lancer directement Python. Le pont local relie le
bouton `LANCER LE CLONE COMPLET` au moteur matériel en restant limité à
`127.0.0.1`.

Il expose ces opérations :

- `GET /health` : disponibilité et dossier racine fixé au démarrage ;
- `POST /clone/start` : lancement avec nom et capacité 64/128 Mo ;
- `GET /clone/status` : manifeste, progression et code de sortie ;
- `GET /projects/list` (13 août) : les 9 emplacements de projet réels
  (présence, taille, drapeaux) — `FileClient.stat` par slot ;
- `GET /projects/read?slot=N` (13 août) : archive TAR complète d'un slot,
  encodée en base64 — utilisée pour importer un projet machine dans la
  bibliothèque locale (`decodeEp133ProjectTar`/`ep133ArchiveProjectToDocument`,
  `importers.ts`, décodeur déjà existant, pas de nouveau parseur) ;
- `POST /projects/write` (13 août) : corps `{slot, document}` — checkpoint
  automatique du slot cible, `compile_project(document, base_archive=<lu en
  direct>)`, écriture, relecture octet à octet, activation. Même séquence
  que `tools/send_project_to_machine.py write`, réutilisée directement
  (`checkpoint_project`/`write_project_verified`, importées, pas dupliquées)
  — testée à la main avant d'être exposée en HTTP (copie P01→P09 confirmée
  par l'utilisateur sur la machine).

Le chemin cible n'est jamais fourni par une requête web. Il est imposé au
démarrage du pont, ce qui empêche une page de demander une écriture ailleurs.
Les routes `/projects/*` passent par le même `FileClient` (donc le même
verrou inter-processus `epsysex.devicelock`) que `/clone/*` — aucune ne peut
tourner en même temps qu'un clone en cours, erreur claire plutôt qu'une
collision silencieuse.

## Utilisation dans Sons & Transfert (13 août)

`src/components/shared/ProjectTransfer.tsx` : deux colonnes glissables
(projets machine / démos + bibliothèque locale). Le glisser-déposer
**prépare** un transfert (le point de dépôt choisit le slot cible côté
machine) ; une confirmation explicite séparée déclenche l'écriture réelle,
avec la liste des emplacements qui seront remplacés affichée avant le
`window.confirm`. Aucune écriture au relâchement de la carte.

## Démarrage actuel

```bash
/tmp/ep133-scan-venv/bin/python tools/local_clone_bridge.py \
  --root /home/azoth/Musique/OP-133 --port 8765
```

L'environnement doit être créé avec `tools/requirements-scanner.txt`, qui
déclare le protocole `epsysex` ainsi que `mido` et le backend `python-rtmidi`
nécessaires aux entrées/sorties MIDI réelles.

Vite redirige uniquement `/bridge/*` vers le service local. Si le pont est
absent, la fenêtre conserve le mode manifeste local mais ne prétend pas lancer
le clone complet.

## Affichage dans le Studio

Lorsque le pont répond, la fenêtre affiche son dossier racine et le bouton
devient `LANCER LE CLONE COMPLET`. Après le clic :

- le bouton indique `CLONAGE EN COURS…` ;
- une barre affiche phase, compteur et pourcentage ;
- temps écoulé et estimation restante sont rafraîchis chaque seconde ;
- la fin affiche le nombre d'erreurs ;
- la fin distingue les changements et les sons inchangés ;
- les détails complets restent dans `clone.log` et `manifest.json`.

Lorsqu'un clone existe déjà, le moteur utilise le mode `incremental`, archive
le manifeste précédent dans `history/` et évite de réécrire les contenus
inchangés. Cette synchronisation reste strictement en lecture seule côté
EP-133.

## Limite actuelle

Le second passage depuis le bouton a été validé sur la machine réelle le
10 août 2026 : 30,7 secondes, 9 projets inchangés, 527 sons inchangés, aucun
téléchargement et aucune erreur. La finition suivante sera l'installation du
pont comme service utilisateur démarré avec l'application, avec arrêt propre et
détection de version.
