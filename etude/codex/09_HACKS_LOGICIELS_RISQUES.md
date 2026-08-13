# Hacks logiciels, usages avancés et risques

## Hacks logiciels réutilisables comme idées

| Idée | Source | Niveau | Traitement Studio |
|---|---|---:|---|
| Capture de toutes les trames SysEx | Sample Tool, `ep-series-sysex`, `ep133-krate` | H0 | Oui, diagnostic local |
| Gestionnaire de samples par slots | `ep133-krate` | H2 si écriture | Étudier seulement la lecture et les tests |
| Génération de `.ppak` | `ep133-ppak` | H0 hors machine / H2 transfert | Utiliser d’abord pour export local |
| Export scènes/patterns vers DAW | `ep133-export-to-daw` | H0 | Oui, avec limites explicites |
| Contrôle automatisé/MCP | `mcp-koii`, `EP133-skill` | H1/H2 selon outil | Lecture et préparation uniquement |
| Boutons A–D suivis par SysEx | captures de notre machine + outils externes | H0 en réception | Oui, sans inventer de trame retour |

## Points techniques remarquables

`ep133-krate` indique notamment que le transfert audio utilise du PCM signé little-endian reconditionné en Packed7, que certaines métadonnées peuvent être obsolètes après suppression et que l’appareil peut rester dans un état de transfert nécessitant une réinitialisation. Ces observations sont utiles pour les tests de robustesse, pas pour contourner les sécurités.

Le même dépôt signale que le mapping B/C/D reste partiel et que plusieurs commandes restent inconnues. Cela confirme qu’un hack fonctionnant sur le groupe A ne doit pas être étendu automatiquement aux autres groupes.

## Hacks à ne pas exposer

- suppression ou remplacement de slots sans confirmation renforcée ;
- écriture de projet pendant lecture sans checkpoint ;
- commandes DFU et firmware ;
- trames fabriquées pour simuler une réponse machine ;
- exploitation d’un crash ou d’un statut d’erreur ;
- contournement d’une protection d’intégrité ou d’une signature ;
- automatisation qui choisit seule le port ou le projet cible.

## Procédure de recherche sûre

1. Capturer une opération officielle sur une machine de test.
2. Modifier une seule variable.
3. Comparer les octets et les états avant/après.
4. Rejouer uniquement une opération de lecture.
5. Consigner firmware, modèle, port, projet et résultat.
6. Séparer les résultats navigateur, simulation et appareil réel.

## Position produit

Nous pouvons documenter les hacks d’interopérabilité et fournir des exports ouverts. Nous ne devons pas présenter le Studio comme un outil de jailbreak, de cross-flash ou de réparation matérielle. Toute fonction expérimentale doit être isolée, désactivée par défaut et précédée d’un avertissement compréhensible.

