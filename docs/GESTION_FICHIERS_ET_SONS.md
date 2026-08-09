# Gestion des fichiers et des sons

## But

Permettre de créer, sauvegarder, charger et écouter un projet avec ou sans
EP-133, puis préparer un transfert matériel vérifiable.

## Formats prévus

| Format | Rôle | Écriture machine |
|---|---|---|
| `ep.project.v1.json` | description destinée au compilateur EP | non |
| `.mid` | échange de notes avec un DAW | non |
| `.ppak` | sauvegarde/projet EP compilé | import explicite |
| paquet de sons + manifeste | audio préparé et dépendances | transfert explicite |

Il n'y aura pas de format de composition propriétaire Rhythm Hero. Le JSON
`ep.project.v1` sert de source lisible avant compilation, le MIDI sert à
l'échange musical et `.pak/.ppak` reste le fichier de la machine. Voir
[`DECISION_FORMATS_PROJET.md`](DECISION_FORMATS_PROJET.md).

## Menu SAVE

Le bouton `SAVE` deviendra un bouton-menu contenant :

- Nouveau ;
- Sauvegarder ;
- Sauvegarder sous ;
- Ouvrir `.pak/.ppak` ;
- Importer MIDI ;
- Sauvegarder une copie `.ppak` ;
- Exporter MIDI ou JSON technique ;
- Dupliquer comme exercice ;
- Historique et récupération.

Les exercices livrés avec le jeu seront visibles mais protégés. Ils devront être
dupliqués avant modification.

## Deux banques de sons

### Ordinateur

Contient les sons libres/utilisateur réellement disponibles dans le navigateur.
Elle sert au mode hors ligne et à la préparation.

### Miroir de la machine

Contient d'abord les métadonnées lues en SysEx. L'audio n'est récupéré que sur
demande et reste privé dans le stockage local de l'utilisateur.

Un pad conserve une référence logique, par exemple :

```json
{
  "soundId": "user:kick-beton-01",
  "computerAsset": "sha256:…",
  "ep133Slot": 421,
  "fallback": "builtin:kick"
}
```

## Préparation d'un transfert

1. Lire l'identité et la mémoire de la machine.
2. Scanner les slots sans écriture.
3. Convertir le son dans un espace temporaire.
4. Afficher poids final, mémoire libre et emplacement proposé.
5. Pré-écouter le fichier converti.
6. Créer une sauvegarde si la cible est occupée.
7. Demander une confirmation contenant le numéro exact du slot.
8. Transférer seul, sans autre session FILE concurrente.
9. Relire et comparer le contenu et les métadonnées.
10. Mettre à jour le cache seulement après validation.

## Contraintes de droits

Le dépôt ne doit contenir ni exporter automatiquement la banque constructeur.
Les copies locales de sons restent sous la responsabilité de leur propriétaire.
Les sons distribués avec l'application devront être libres ou créés pour le
projet, avec leur licence documentée.
