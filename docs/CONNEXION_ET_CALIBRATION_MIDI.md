# Connexion et calibration MIDI du EP-133

Ce guide permet de vérifier ce que le EP-133 envoie réellement et d'associer
ses pads au jeu sans supposer les notes MIDI de la machine.

## Prérequis

- EP-133 K.O. II relié directement en USB à l'ordinateur ;
- Chrome ou Chromium récent ;
- application ouverte sur `http://localhost:5173/` ;
- serveur local lancé avec `npm run dev -- --host 0.0.0.0`.

Web MIDI nécessite l'autorisation du navigateur. Sur une autre machine du
réseau, certains navigateurs refusent Web MIDI sur une adresse HTTP non
sécurisée. Pour le premier test matériel, utiliser `localhost` sur l'ordinateur
auquel le EP-133 est physiquement branché.

## Vérifier la connexion

1. Allumer le EP-133 et attendre son démarrage complet.
2. Recharger la page après avoir branché le câble USB.
3. Cliquer sur **Connexion MIDI** en haut à droite.
4. Accepter la demande d'autorisation du navigateur.
5. Frapper un pad de la machine.

L'application ouvre explicitement chaque entrée MIDI avant d'installer son
écouteur. Le bouton doit ensuite indiquer `Connecté : EP-133 MIDI 1`.

Le panneau **Diagnostic MIDI en direct** doit afficher le nom de l'entrée, le
canal, la note et la vélocité. Cette observation brute est affichée même si le
pad n'est pas encore associé au jeu.

## Mapping automatique des 12 pads

La grille de l'application reprend la disposition physique du EP-133 : quatre
rangées horizontales de trois pads. Elle conserve cette disposition sur écran
étroit pour éviter qu'un changement de largeur ne déplace les pads.

Aucune calibration manuelle n'est nécessaire. L'application applique la table
officielle Teenage Engineering : A `36–47`, B `48–59`, C `60–71`, D `72–83`.
Dans chaque groupe, les notes sont automatiquement replacées dans l'ordre
physique `7 8 9 / 4 5 6 / 1 2 3 / . 0 ENTER`.

## Tester le jeu

1. terminer la calibration ;
2. cliquer sur **Démarrer la session** ;
3. frapper les pads en suivant le rythme ;
4. vérifier les résultats PERFECT, GOOD, MISS et COMBO ;
5. arrêter la session avant de modifier le mapping.

## Routage audio retenu

- Le EP-133 est utilisé uniquement comme entrée MIDI.
- Aucun message MIDI OUT n'est renvoyé vers la machine.
- Le navigateur produit le métronome et les sons correspondant aux pads.
- Le premier temps de chaque mesure utilise un clic plus aigu ; les trois
  autres temps utilisent un clic plus grave.
- La vélocité reçue du EP-133 module le volume du son joué par l'ordinateur.
- Le bouton JOUER lance d'abord une mesure vide de quatre temps. La partition
  commence sur la mesure suivante afin de laisser le temps de se préparer.
- Pendant le jeu, l'ordinateur joue aussi discrètement les notes de la
  partition modèle ; les frappes du joueur restent plus fortes.

Ce routage évite d'entendre simultanément le son interne du EP-133 et une copie
décalée provenant du jeu. Pour le test, écouter la sortie audio de l'ordinateur.

## Régler les sons des pads

Un double-clic sur un pad virtuel ouvre son mini-mixeur. Trois réglages sont
disponibles séparément pour chaque pad : volume du modèle, volume du joueur et
hauteur. Le bouton **Écouter** prévisualise le son même quand la session est
arrêtée. Un clic simple sur le pad reste un test rapide ou une frappe virtuelle.

Pendant la lecture, la fenêtre de partition défile automatiquement pour garder
le pas actif visible. Les pads sont encadrés par deux VU-mètres compacts : son
de la partition en orange à gauche et son du joueur en ambre à droite. Le
sélecteur de la barre supérieure donne accès aux 39 exercices du catalogue.

La partition affiche deux mesures côte à côte. Les cases orange indiquent les
frappes attendues et le curseur suit la lecture. Les frappes du joueur sont
superposées dans les mêmes cases sous forme de marque colorée : vert pour
PERFECT, ambre pour GOOD et rouge pour MISS. Cette superposition évite une
seconde grille et garde davantage de place pour le jeu.

## Diagnostic rapide

### Aucune entrée MIDI détectée

- essayer un autre câble USB capable de transporter les données ;
- éviter les hubs USB pendant le diagnostic ;
- fermer les autres logiciels pouvant monopoliser le port MIDI ;
- débrancher, rebrancher, puis cliquer de nouveau sur la connexion MIDI.

### Le port apparaît mais aucune frappe ne remonte

- vérifier que le EP-133 transmet bien le MIDI par USB ;
- tester un autre groupe de pads ;
- ouvrir les outils de développement du navigateur et relever l'erreur ;
- noter le navigateur, sa version et le système utilisé.

### Les frappes apparaissent mais le score ne change pas

- vérifier que le pad affiche un canal et une note sous son nom ;
- démarrer la session avant de frapper ;
- recalibrer le pad concerné ;
- vérifier que deux pads physiques ne produisent pas exactement la même paire
  canal/note dans le mode actuel du EP-133.

## Informations à consigner après le test

Pour chaque pad, relever : groupe, position, canal, note, vélocité minimale et
maximale observées. Indiquer également le nom exact du port MIDI, le navigateur
et toute différence après un changement de groupe ou de scène sur le EP-133.

## Banc TEST MACHINE — diagnostic temporaire du 11 août 2026

La page **TEST MACHINE**, accessible depuis l'accueil, reproduit la disposition
physique de la façade et possède deux modes :

- **CONFIGURER** : cliquer un contrôle, puis l'actionner sur la machine ; le
  message suivant est associé au contrôle dans `localStorage` ;
- **TEST** : les messages entrants surlignent les contrôles associés et les
  messages MIDI de canal appris peuvent être rejoués vers la machine.

Cette page demande l'accès Web MIDI avec SysEx et écoute volontairement toutes
les entrées et les 16 canaux. Le Studio et le jeu restent filtrés sur les ports
nommés EP-133 afin de ne pas réintroduire le problème `Midi Through`.

### Sélection officielle des groupes A–D

L'analyse du bundle public EP Sample Tool et du protocole MIT
`kmorrill/ep-series-sysex` montre que l'outil officiel ne change pas de groupe
avec une note ou un CC. Il utilise le protocole SysEx FILE :

1. initialisation FILE avec abonnement aux événements ;
2. lecture de la métadonnée `active` du nœud `/projects` (fid `2000`) ;
3. calcul du dossier `groups` et du fid A, B, C ou D dans le projet actif ;
4. fusion de `{"active": groupFid}` sur le dossier `groups` ;
5. relecture obligatoire de `active` et comparaison avec la valeur demandée.

Pour un projet de fid `P`, le dossier des groupes vaut `P + 100` et les groupes
A à D valent respectivement `P + 200`, `P + 300`, `P + 400` et `P + 500`.
L'implémentation navigateur est limitée à cette métadonnée d'interface : elle
ne modifie ni archive projet, ni pattern, ni sample, ni affectation de pad.

Observation réelle du 11 août : le journal de l'outil officiel a exposé
`{"active":4000}` pour le projet courant, `{"active":4500}` pour son groupe D
et `{"active":4510}` pour le pad actif du groupe D. Cela confirme sur la
machine réelle la séparation projet → groupe → pad et les fids calculés. Les
nombreuses réponses contenant `sym`, `sound.playmode`, `sample.start/end`, etc.
venaient du balayage de métadonnées de l'EP Sample Tool, pas de boutons de
façade supplémentaires.

### Capture locale provisoire

Pendant l'identification matérielle, Vite expose uniquement en développement
`POST /__midi-capture`. La page y envoie chaque observation brute et le serveur
l'ajoute à `tmp/ep133-midi-capture.ndjson`. Le fichier est ignoré par Git et
ne quitte pas l'ordinateur.

Après validation de la cartographie, supprimer :

- le plugin `temporary-midi-capture` de `vite.config.ts` ;
- les deux effets `fetch('/__midi-capture', ...)` de `MachineTestPage.tsx` ;
- l'entrée `tmp/ep133-midi-capture.ndjson` de `.gitignore` ;
- le dossier local `tmp/` s'il ne contient rien d'autre d'utile.

### Validation encore requise sur l'EP-133 réel

- réception exhaustive des messages de chaque contrôle ;
- A, B, C et D machine → page ;
- A, B, C et D page → machine avec relecture `active` correcte ;
- absence de modification des contenus musicaux et des samples.

Un build ou un test navigateur ne constitue pas une validation matérielle.
