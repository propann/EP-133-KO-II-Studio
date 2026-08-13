# Journal de recherche — 13 août 2026

## Méthode

Recherche publique par variantes `EP-133`, `EP133`, `K.O. II`, `KOII`, `EP Series`, `EP-1320`, `SysEx`, `sample tool`, `ppak`, `DAWproject` et `MCP`, puis ouverture des dépôts directement identifiés et de leurs références croisées. Les résultats GitHub génériques sont très bruités ; les correspondances ont donc été retenues seulement lorsqu’elles contenaient du code, des fixtures, une documentation spécifique ou un lien communautaire crédible.

## Résultats principaux

- `ep-series-sysex` : meilleure piste pour le protocole complet et la vérification, mais les écritures restent hors périmètre sûr.
- `ep133-ppak` : meilleure piste pour le format binaire et les tests unitaires.
- Sample Tool et `ep_133_sysex_thingy` : références concrètes pour Web MIDI Electron, identité, sauvegardes, projets, samples et fixtures SysEx.
- `ep133-export-to-daw` : référence pour les exports et leurs limites audio.
- `ep133-krate` : dépôt récent, MIT, avec 188 commits, 486 tests sans machine et une spécification fondée sur des captures USB ; il confirme que les groupes B/C/D et plusieurs commandes restent incomplets.
- Forums et guides : utiles pour séparer comportement utilisateur, reverse engineering et preuve matérielle.

## Points non résolus

- compatibilité exacte de chaque commande selon version de firmware ;
- statut actuel de certains forks et dépôts sans métadonnées fiables ;
- couverture complète des contrôles physiques au-delà des messages déjà capturés ;
- écriture `.ppak` et retour matériel vérifié de bout en bout ;
- existence de dépôts privés, renommés ou non indexés par les recherches publiques.
- statut exact de `gabriel-roth/knockout`, cité comme antériorité mais actuellement introuvable à son URL historique.

## Conclusion de la session

La veille confirme qu’il existe assez de matière open source pour consolider la lecture, le diagnostic, le décodage et les exports. Elle ne justifie pas encore d’activer une écriture SysEx générale. La prochaine étape rationnelle est de transformer les sources en fixtures et tests de lecture, puis de documenter séparément chaque observation faite sur le vrai EP-133.
