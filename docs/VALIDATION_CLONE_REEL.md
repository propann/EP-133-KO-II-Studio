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
