# Validation du score et de l'extension automatique

Date : 9 août 2026.

## Score

La commande `npm run test:engine` vérifie :

- PERFECT jusqu'à ±35 ms inclus ;
- GOOD de 36 à 90 ms inclus ;
- MISS au-delà de 90 ms ;
- conversion correcte d'un écart rythmique en millisecondes selon le BPM ;
- choix de la cible disponible la plus proche sur le bon pad ;
- impossibilité de compter deux fois une cible déjà réussie ;
- incrément du combo et du meilleur combo ;
- remise du combo à zéro sur MISS ;
- exclusion des MISS du nombre de frappes précises et de l'écart cumulé.

Le moteur conserve actuellement la cible réussie en posant `hit = true` sur la
copie de session. Cette mutation est volontairement limitée à la session de
jeu ; le catalogue original n'est pas modifié.

## Extension de la partition

`src/core/project/editor.ts` centralise les calculs auparavant intégrés aux
gestionnaires de clics React :

- conversion d'un pas global vers son numéro de mesure ;
- calcul du nombre de mesures réellement utilisées ;
- ajout d'une mesure vide après une écriture dans la réserve.

Les tests confirment qu'une ancienne mesure n'agrandit pas la partition, qu'une
suppression ne l'agrandit pas et qu'une édition distante garde toujours une
mesure vide après la dernière mesure écrite.

## Commandes de validation

```bash
npm test
npm run build
```
