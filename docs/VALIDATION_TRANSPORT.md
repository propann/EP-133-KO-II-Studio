# Validation du transport audio et MIDI

Date : 9 août 2026.

## Risques corrigés

- Le jeu et l'éditeur partageaient le même timer de fin. L'arrêt de l'un
  pouvait donc annuler ou remplacer la fin de l'autre.
- Les timers de compte à rebours, fin, boucle et animation n'étaient pas tous
  nettoyés par les mêmes chemins de sortie.
- Un retour à l'accueil pouvait laisser une lecture active.
- Un déverrouillage audio asynchrone pouvait finir après STOP et relancer une
  ancienne session.
- Le PANIC MIDI ne couvrait que le canal 1.
- Le démontage de l'application détachait les entrées, mais ne libérait pas
  explicitement les instruments audio et les notes de sortie.

## Comportement retenu

- Timers de jeu et d'éditeur complètement séparés.
- Fonctions centrales `stopGameTransport` et `stopEditorTransport`.
- Chaque démarrage reçoit un numéro de génération ; tout résultat asynchrone
  appartenant à une génération arrêtée est ignoré.
- STOP annule les événements Tone.js, remet sa position à zéro et nettoie les
  identifiants programmés.
- Le retour à l'accueil arrête jeu, éditeur, audio, horloge et sortie MIDI.
- Le démontage libère les synthétiseurs, bus et effets Tone.js.
- Le PANIC vide la file de sortie lorsque l'API le permet, envoie MIDI STOP,
  puis All Notes Off et All Sound Off sur les 16 canaux.
- La disparition d'un port MIDI pendant STOP ne fait pas planter l'interface.

## Vérifications

`npm run test:transport` contrôle le mapping des limites 36–83 et les 33
messages du PANIC sur 16 canaux.

`npm run test:exports` garantit que la solidification du transport ne casse pas
les formats MIDI et EP-133. `npm run build` valide TypeScript et le bundle.

## Limite suivante

La boucle MIDI longue utilise encore la minuterie du navigateur. Elle est
correctement annulée, mais sa dérive doit être mesurée sur plusieurs minutes
avant de remplacer éventuellement l'ordonnancement par une fenêtre glissante
ancrée sur une horloge unique.
