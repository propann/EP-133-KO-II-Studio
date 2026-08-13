# Licences, risques et réutilisation

## Règle générale

Étudier un dépôt n’autorise pas à copier son code, ses fixtures, ses samples, ses logos ou son firmware. Avant toute reprise : lire la licence du commit exact, vérifier les fichiers sans licence explicite et conserver les attributions requises.

## Cartographie initiale

| Source | Signal de licence | Traitement prudent |
|---|---|---|
| `ep-series-sysex` | licence permissive annoncée dans le dépôt | envisager une dépendance ou une réimplémentation attribuée après audit |
| `ep133-ppak` | MIT annoncée | code réutilisable sous conditions MIT ; valider les fixtures séparément |
| `ep133-export-to-daw` | AGPL annoncée | ne pas incorporer automatiquement dans l’application ; étudier l’interface et isoler tout composant éventuel |
| Sample Tool / forks | licence et statut variables ; dépôt original archivé | conserver comme référence, vérifier fichier par fichier |
| Firmware et ressources TE | droits non équivalents au code open source | ne pas embarquer, flasher ou redistribuer sans autorisation |
| Samples d’exemple | origine parfois propriétaire | ne pas les versionner dans le Studio sans preuve de droits |

## Risques fonctionnels

- écriture SysEx destructive ou mal formée ;
- remplacement du mauvais projet ;
- confusion entre sortie EP-133 et port virtuel ;
- lecture d’un format d’une autre version de firmware ;
- export présenté comme rendu audio exact ;
- dépendance à un dépôt archivé ou sans maintenance ;
- exposition d’une commande de modification via une action automatisée.

## Barrière de sécurité minimale

Le produit peut détecter, lire, journaliser, décoder, exporter et préparer une opération. Toute écriture doit être désactivée par défaut, précédée d’un backup vérifié, confirmée par l’utilisateur et accompagnée d’un résultat lisible. Les notes de cette étude ne constituent jamais une validation d’écriture.

