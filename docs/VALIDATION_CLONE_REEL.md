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

## Prochaine priorité

Le moteur est validé, mais son lancement a encore été effectué hors de
l'interface. Le prochain chantier est le pont local : le bouton du Studio doit
lancer la commande, afficher le manifeste en direct et signaler clairement la
fin ou les erreurs.
