# Validation du premier clone matériel complet

## Résultat

Le clone `MON EP-133` a été réalisé le 9 août 2026 dans le dossier privé :

```text
/home/azoth/Musique/OP-133/clone/MON-EP-133/
```

La lecture a commencé à 21:27:38 UTC et s'est terminée à 21:52:58 UTC, soit
**25 minutes et 20 secondes**.

| Élément | Résultat |
|---|---:|
| Projets TAR | 9 |
| Samples PCM | 527 |
| Métadonnées JSON | 527 |
| Audio | 56 214 010 octets |
| Taille du dossier | environ 58 Mo |
| Erreurs du moteur | 0 |

## Contrôle indépendant du 10 août 2026

Le manifeste et les fichiers ont été relus après la copie :

- 536 hashes SHA-256 recalculés, soit 9 projets et 527 PCM ;
- aucun hash différent ;
- aucun fichier manquant ;
- 527 métadonnées JSON analysées ;
- aucun JSON invalide ;
- statut final du manifeste : `complete`.

La sauvegarde constitue donc une base locale valide pour le Studio et le futur
système Time Machine. Elle reste privée et n'est pas versionnée dans Git.

## Évolution postérieure

Le premier clone décrit ci-dessus a été lancé hors interface. Depuis le commit
`61e9812`, le bouton du Studio est raccordé au moteur par un pont local et
affiche le manifeste en direct. Une synchronisation incrémentale avec historique
est en préparation le 10 août 2026.

### Validation incrémentale du 10 août 2026

Le second passage a été déclenché depuis le bouton du Studio avec l'EP-133
connecté. Résultat :

| Élément | Résultat |
|---|---:|
| Durée | 30,7 secondes |
| Projets inchangés | 9 |
| Sons inchangés | 527 |
| Octets téléchargés | 0 |
| Ajouts / modifications / suppressions | 0 |
| Erreurs | 0 |

Le manifeste final utilise le schéma `ep133.rhythm-hero.clone.v2`, le mode
`incremental` et le statut `complete`. Un contrôle indépendant postérieur a
recalculé les 536 hashes sans différence, confirmé l'absence de fichier
manquant et analysé les 527 métadonnées JSON sans erreur.

## Re-test du 13 août 2026 (régression après auto-connexion et refonte Test Machine)

Après les changements de connexion automatique et de statut unifié de cette
session (`midiReady`, correctif de la pastille bloquée en vert), re-clonage
complet demandé pour vérifier l'absence de régression. Le pont local avait
disparu entre deux sessions (`/tmp/ep133-scan-venv` est éphémère) : recréé
avec les mêmes paquets (`epsysex`, `mido`, `python-rtmidi`), même dossier
`--root /home/azoth/Musique/OP-133`.

| Élément | Résultat |
|---|---:|
| Durée | 24 min 47 s (1487,5 s) |
| Projets | 9/9, 0 erreur |
| Samples | 527/527, 0 erreur |
| Octets copiés | 56 214 010 (identique aux clones précédents) |

**SCAN testé en parallèle** (depuis la Fiche personnage, geste réel de
l'utilisateur pendant que le clone tournait) : manifeste `profile`/`history`
écrit avec les mêmes chiffres (527 sons, 56 214 010 octets, projet P01),
cohérent avec l'historique déjà présent dans ce fichier depuis des sessions
antérieures au 13 août.

**Fusion de dossier** : le clone a d'abord écrit dans `clone/MON-EP-133/`
(nom passé en ligne de commande par l'agent, absent du profil du navigateur),
alors que SCAN écrit sous `clone/<nom déclaré dans la Fiche personnage>/`
(`EP-133-K.O.-II` ici). Les deux dossiers coexistaient sous le même parent
(`OP-133`) sans se mélanger — pas un bug, juste deux noms différents pour
la même machine. Fusionnés manuellement après coup : contenu de
`MON-EP-133/` (samples/projects/metadata/history/clone.log) déplacé dans
`EP-133-K.O.-II/`, `manifest.json` du clone (schéma `clone.v2`, index détaillé)
renommé `clone-index.json` pour ne pas écraser le `manifest.json` du
navigateur (schéma différent, contient l'historique Time Machine côté JS —
un écrasement aurait fait échouer silencieusement `loadDeviceClone` faute de
champs `history`/`profile` reconnus). Un seul dossier machine au final,
historique navigateur intact (8 entrées).

**Enseignement pour la suite** : si un futur test relance le pont en ligne
de commande, utiliser exactement le nom déclaré dans la Fiche personnage
(`--name`) pour éviter cette fusion manuelle.
