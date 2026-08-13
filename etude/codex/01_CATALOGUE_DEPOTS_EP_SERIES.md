# Catalogue des dépôts EP Series

Inventaire de travail des projets publics trouvés par recherche GitHub, liens de forks et références communautaires. Les dates et licences sont à recontrôler avant toute redistribution.

## Dépôts directement utiles

| Dépôt | Apport principal | Statut / confiance | Décision d’étude |
|---|---|---|---|
| [kmorrill/ep-series-sysex](https://github.com/kmorrill/ep-series-sysex) | Lecture, écriture et vérification de projets et bibliothèques de sons ; Python et CLI | Projet central, A/B | Étudier l’adaptateur en lecture seule puis comparer les trames |
| [ZacharySBrown/ep133-ppak](https://github.com/ZacharySBrown/ep133-ppak) | Analyse binaire `.ppak`, offsets pads, identifiants de fichiers, tests | MIT indiqué, A | Utiliser comme oracle de décodage et jeu de fixtures |
| [garrettjwilke/ep_133_sample_tool](https://github.com/garrettjwilke/ep_133_sample_tool) | Outil Electron hors ligne : sauvegarde, sons, projet seul, debug SysEx | Archivé ; A | Référence UX et flux de sauvegarde, pas dépendance |
| [pbarilla/ep_133_sample_tool](https://github.com/pbarilla/ep_133_sample_tool) | Fork du Sample Tool, utile pour comparer les corrections | Fork ; B | Surveiller les divergences et les commits récupérables |
| [garrettjwilke/ep_133_sysex_thingy](https://github.com/garrettjwilke/ep_133_sysex_thingy) | Fixtures `.syx/.syx2`, identité, init, projet, échantillons | A pour les fichiers présents | Tester uniquement les requêtes non destructives |
| [phones24/ep133-export-to-daw](https://github.com/phones24/ep133-export-to-daw) | Export navigateur vers MIDI, Ableton, DAWproject, REAPER et scènes | AGPL indiqué, B | S’inspirer des contrats d’export, sans copier le code sans analyse licence |
| [icherniukh/ep133-krate](https://github.com/icherniukh/ep133-krate) | Gestionnaire CLI/TUI de samples, spécification capture-based, opérations par slots | MIT indiqué ; actif ; A/B | Étudier les séquences d’initialisation, Packed7 et les tests sans appeler l’écriture |
| [phones24/SimpleCC](https://github.com/phones24/SimpleCC) | Outil de contrôle MIDI/CC associé à l’écosystème | À recontrôler, C | Piste UX secondaire pour diagnostic et mappings |
| [DannyDesert/EP133-skill](https://github.com/DannyDesert/EP133-skill) | Documentation/compétences orientées EP-133 | MIT indiqué, B | Comparer les termes et limites documentées |
| [benjaminr/mcp-koii](https://github.com/benjaminr/mcp-koii) | Pont MCP autour du KO II | À recontrôler, C | Observer l’architecture d’outil, pas exposer d’écriture par défaut |

## Références et pistes adjacentes

| Référence | Valeur | Prudence |
|---|---|---|
| [te-archive/ep-133_firmware](https://github.com/te-archive/ep-133_firmware) | Archives et versions de firmware mentionnées dans l’écosystème | Ne pas redistribuer ni flasher sans licence et procédure vérifiée |
| [seajaysec/ep-unity](https://github.com/seajaysec/ep-unity) | Expérimentation autour de l’appareil | Considérer comme recherche ; aucune commande d’écriture à reprendre telle quelle |
| [gabriel-roth/knockout](https://github.com/gabriel-roth/knockout) | Ancienne référence citée comme travail antérieur | URL actuellement introuvable ; C | Conserver le nom comme piste historique, ne pas dépendre |
| [neilbaldwin/KOII-tips-and-tricks](https://github.com/neilbaldwin/KOII-tips-and-tricks) | Comportements, raccourcis et savoir utilisateur | Référence UX, pas spécification protocolaire |
| [Teenage Engineering — guide EP-133](https://teenage.engineering/guides/ep-133/supreme) | Référence officielle pour les concepts et gestes utilisateur | Ne pas copier le manuel ou ses illustrations |
| [OP Forum — third-party development](https://op-forums.com/t/opening-up-the-ep-series-for-third-party-development/31759) | Contexte communautaire et retours de tests réels | Témoignages à distinguer des reproductions locales |

## Dépôts non retenus comme dépendances

Les forks abandonnés, projets sans licence, dumps de firmware, outils dont l’action par défaut est destructive et projets ne fournissant qu’une vidéo ou une capture sont utiles pour la veille mais ne doivent pas devenir des dépendances du Studio.

## Limite de l’inventaire

GitHub ne fournit pas une recherche publique parfaitement exhaustive par appareil. Cet inventaire couvre les noms EP-133/EP133/KO II/EP Series repérés, les auteurs qui se citent entre eux et les forks connus au moment de la recherche. Il ne prétend pas énumérer chaque fork privé, branche ou dépôt mal indexé.
