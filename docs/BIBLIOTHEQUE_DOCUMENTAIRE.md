# Bibliothèque documentaire

## Règle de publication

La page Documentation distingue trois catégories :

1. documentation originale du projet, librement versionnée dans ce dépôt ;
2. documentation officielle externe, référencée par un lien sans copie ;
3. ressources communautaires, intégrables uniquement après vérification de
   leur licence et attribution.

Un document accessible gratuitement n'est pas nécessairement sous licence
libre. Aucun PDF, dessin, sample, police ou capture d'un tiers ne doit être
ajouté au dépôt sur le seul motif qu'il est téléchargeable.

## Manuel étudié

- Fichier local : `/home/azoth/Documents/ep133_manual_os_2-0.pdf`
- Titre affiché : EP-133 User Guide, version 2.0
- Pagination : 258 pages
- Création du PDF : avril 2025
- Produit décrit sur la couverture : série 64 MB
- Statut dans le dépôt : **non copié, non redistribué**

Le manuel contient une section « Intellectual Property Rights » qui interdit
notamment la redistribution, la reproduction et l'affichage public du matériel
protégé, y compris les images. La page de l'application renvoie donc au guide
officiel en ligne.

## Principes graphiques observés et réinterprétés

La nouvelle page utilise des composants originaux fondés sur des principes de
mise en page généraux :

- fond gris très clair et grandes zones respirantes ;
- traits noirs fins et cadres techniques ;
- bandeaux noirs pour les titres de modules ;
- orange réservé aux commandes, alertes et mouvement ;
- numérotation courte des étapes ;
- schémas simples de touches et combinaisons ;
- typographie monospace déjà utilisée par Rhythm Hero ;
- grilles qui passent de deux colonnes à une colonne sur petit écran.

Aucune illustration du PDF n'est embarquée. Le mini EP-133, les touches, le
fader et l'afficheur de la page sont dessinés en HTML/CSS pour le projet.

## Documentation originale exposée dans l'application

La page forme désormais un centre documentaire en trois parties :

1. **Nos outils** : démarrage, Pattern & Song Studio, Save/Load, Sons &
   Transfert, clonage, pont local, Test Machine/MIDI et Rhythm Hero ;
2. **La machine** : mise en route Linux/Windows, chargement d'un projet réel,
   samples, formats et modèle de données ;
3. **Guide officiel** : liens externes vers le guide en ligne et les
   téléchargements Teenage Engineering, sans recopier leur contenu protégé.

Chaque fiche indique clairement quand une procédure est limitée à la lecture
seule ou exige une validation sur le matériel réel.

Depuis le 11 août 2026, l'accueil et le centre documentaire disposent d'un
sélecteur **FR / EN / ES**. Le choix est mémorisé localement et traduit la
navigation, les présentations et les fiches documentaires. Les fichiers
techniques complets restent pour l'instant rédigés en français sur GitHub ; la
traduction de leur contenu sera versionnée progressivement.

## Ressources communautaires à indexer plus tard

Les projets étudiés (`ep-series-sysex`, `EP133-skill`, export DAW et autres)
restent recensés dans `ANALYSE_ETUDE_CAHIER_CHARGES.md`. Avant d'afficher ou
d'intégrer leur contenu, vérifier : licence, version, produit EP-133/EP-40,
source primaire et niveau de validation sur matériel réel.

Une cartographie plus large et plus récente (dépôts EP-133/EP-40/EP-1320,
bibliothèques techniques génériques, formats DAW) est disponible dans le
dossier [`etude/`](../etude/00_INDEX.md) à la racine du dépôt, daté du 13 août
2026. Les décisions qui en découlent sont tracées dans
`REGISTRE_IDEES.md` (section « Écosystème externe et bibliothèques »).
