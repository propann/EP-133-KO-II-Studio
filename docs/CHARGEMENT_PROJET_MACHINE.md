# Chargement du projet 1 de la machine

## Résultat du scan

Le 9 août 2026, le projet 1 a été relu depuis l'EP-133 sans aucune commande
d'écriture. Le décodage donne :

- tempo : 120 BPM ;
- patterns présents : A01–A03, B02–B03, C01–C03 et D01–D03 ;
- trois scènes S.01, S.02 et S.03 ;
- Song mode : une position `L.01` qui référence `S.01` ;
- aucune alerte de décodage.

`S.01` référence A01, B01, C01 et D01. B01 n'existe pas dans l'archive : le
groupe B est donc correctement affiché vide. Il ne faut surtout pas lui
substituer B02 ou B03.

## Utilisation dans le Studio

Ouvrir `FICHIER`, puis choisir `PROJET 1 MACHINE`. Le Studio charge la première
Song Position et affiche :

- 25 événements sur A01 ;
- aucun événement sur B01 ;
- aucun événement sur C01 ;
- 6 événements sur D01 ;
- deux mesures pour la Song Position, déterminées par le pattern le plus long.

Le chargement ne modifie pas la machine. Une copie éditable peut ensuite être
créée avec `ENREGISTRER SOUS`.

## Chaîne de préparation

1. `tools/read_project.py` de la bibliothèque de protocole effectue la lecture
   matérielle dans un TAR local ;
2. `tools/export-ep133-project-snapshot.mjs` décode le TAR ;
3. seul le document musical lisible `public/ep133-project-1.json` est fourni à
   l'interface ;
4. ni échantillon audio ni archive binaire brute ne sont intégrés au site.

Le fichier JSON est un instantané. Pour récupérer des modifications faites
ensuite sur l'appareil, il faut relancer le scan en lecture seule.
