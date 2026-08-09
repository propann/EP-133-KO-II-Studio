# Banque de samples machine dans le Studio

## Sélection

Le menu `FICHIER` possède une ligne indépendante `OUVRIR BANQUE LOCALE`. Il faut
sélectionner le dossier de la machine créé dans :

```text
dossier choisi/clone/nom-machine/
```

Le navigateur parcourt ses sous-dossiers `samples/` et `metadata/`. Les PCM
sont associés à leur numéro de slot, par exemple `samples/324.pcm`, et les
métadonnées correspondantes sont lues depuis `metadata/324.json`.

Les fichiers ne sont pas téléversés vers le site, un serveur ou GitHub. Le
Studio reçoit une autorisation temporaire du navigateur et lit directement les
fichiers sur le disque dur.

## Lecture

- EP-133 connecté : le Studio envoie les notes MIDI vers la machine ;
- EP-133 débranché : le Studio lit les PCM locaux du clone ;
- aucun doublement PC + machine ;
- le piano-roll applique la hauteur MIDI relativement à la root note du pad ;
- la vélocité pilote le gain de lecture ;
- STOP coupe aussi toutes les sources PCM locales en cours.

Les samples sont décodés à la demande afin de ne pas charger immédiatement les
56,21 Mo en mémoire. Le format natif pris en charge est le PCM signé 16 bits
little-endian, avec fréquence 46 875 Hz par défaut et mono/stéréo selon les
métadonnées.

## Limite du navigateur

Pour des raisons de sécurité, le navigateur redemande actuellement le dossier après un
rechargement de page. Le futur pont local conservera l'autorisation associée au
profil de machine et reconnectera automatiquement sa banque privée.
