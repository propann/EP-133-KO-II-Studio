# Pistes prioritaires issues de la veille

Cette liste guide l’analyse future ; elle ne demande pas d’implémenter ces points dans cette étape.

## P0 — preuve et sécurité

1. Maintenir un détecteur automatique fondé sur les ports réels et la réponse d’identité.
2. Journaliser toutes les entrées MIDI et SysEx, y compris les événements spontanés des boutons A–D.
3. Exporter une session de diagnostic anonymisée : port, firmware déclaré, direction, hexadécimal, résultat.
4. Ajouter dans chaque rapport deux statuts : « navigateur » et « EP-133 réel ».

## P1 — lecture et comparaison

1. Comparer le lecteur local avec les offsets et tests de `ep133-ppak`.
2. Comparer les trames de lecture de `ep-series-sysex` avec celles capturées par le Studio.
3. Tester les changements de page A–D en lecture seule et vérifier que l’interface suit la machine.
4. Vérifier les WAV mono/16 bits/46 875 Hz et les métadonnées sans modifier la machine.
5. Lire les tests et captures de `ep133-krate` pour identifier ce qui manque encore sur B/C/D, sans envoyer ses opérations `put`, `rm` ou `rename`.

## P2 — exports et expérience

1. Évaluer les contrats MIDI, scènes et DAWproject de `ep133-export-to-daw`.
2. Ajouter une fiche de compatibilité expliquant les limites d’effets, de stretching et d’automation.
3. Utiliser les guides de gestes pour améliorer les libellés, sans en déduire de SysEx.
4. Garder une architecture hors ligne et des fichiers exportables avant toute idée de service hébergé.

## P3 — écriture expérimentale, uniquement après validation

Écrire un projet de test sans données personnelles, avec backup récupérable, confirmation explicite et relecture immédiate. Aucune commande de suppression, DFU ou firmware ne doit entrer dans le parcours normal. Une panne, un crash ou une divergence binaire annule la promotion de la fonction.
