# Outils externes — fonctions à retenir

## Sample Tool Electron

Le dépôt de Garrett Wilke est une référence de flux : application locale hors ligne, sélection des ports MIDI, sauvegarde complète, sauvegarde de projet seul, gestion des échantillons et journal de debug SysEx. Son code active explicitement les permissions Web MIDI avec SysEx dans Electron (`midi` et `midiSysex`).

À retenir pour le Studio :

- afficher les ports exacts et éviter `Midi Through` par défaut ;
- afficher dernier message reçu/envoyé et direction ;
- séparer lecture, sauvegarde complète et sauvegarde projet ;
- confirmer visuellement toute action pouvant remplacer le contenu de la machine ;
- conserver un mode diagnostic utilisable hors connexion.

## Export vers DAW

`phones24/ep133-export-to-daw` montre une autre famille de besoins : dépôt d’un backup `.pak`, extraction des samples et des données musicales, export MIDI, export de scènes et formats DAWproject/Ableton/REAPER. Le projet précise qu’il ne fournit pas un streaming multicanal de type Overbridge et que certains effets, automations de fader et différences de time-stretch ne peuvent pas être reproduits exactement hors machine.

Conséquence : le Studio doit annoncer clairement « export de données » ou « lecture locale », sans promettre la parité audio avec le EP-133.

## Ponts automatisés et MCP

Les projets `EP133-skill` et `mcp-koii` montrent l’intérêt de rendre les données interrogeables par des outils automatisés. La frontière de sécurité est essentielle : les outils d’assistance peuvent lire, analyser et préparer un plan ; aucune écriture matérielle ne doit être implicite.

## UX et savoir utilisateur

Les guides de raccourcis et de gestes, comme `KOII-tips-and-tricks`, sont utiles pour vérifier les mots employés, les pages A–D et les attentes d’un musicien. Ils ne doivent pas être transformés en spécification SysEx sans capture instrumentée.

## Fonctionnalités à comparer dans notre produit

| Fonction | Valeur | Statut conseillé |
|---|---|---|
| Détection automatique | réduit les erreurs de port | priorité, lecture seule |
| Journal MIDI + SysEx brut | indispensable pour A–D et diagnostic | maintenir en permanence |
| Backup complet | filet de sécurité | valider séparément sur machine |
| Backup projet seul | évite d’écraser les sons | reproduire seulement après preuve |
| Export MIDI/DAW | utile même sans écriture EP-133 | navigateur + fichiers |
| Import `.pak/.ppak` | cœur du clone | fixtures puis vrais backups |
| Retour matériel | forte valeur mais risque élevé | dernière étape, opt-in |

