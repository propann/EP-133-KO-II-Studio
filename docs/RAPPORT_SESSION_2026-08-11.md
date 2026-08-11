# Rapport de session — 11 août 2026

## Résumé

Session menée sur la branche `agent/jeu-niveau1-styles`, dans un worktree
git isolé du répertoire principal (voir « Méthode de travail » ci-dessous)
pour ne jamais interférer avec le travail en cours sur le Studio. Deux
volets : compléter le niveau 1 du catalogue Rhythm Hero avec de vraies
partitions, puis une refonte visuelle complète de l'écran de jeu à partir
d'une photo de façade K.O.II fournie par l'utilisateur, et enfin un nouveau
module d'écosystème — la fiche personnage — avec identité joueur, machines
EP-133 déclarées, scan/clone/connexion et bilan cumulé.

19 commits, `npm test` et `npm run build` au vert après chacun. Deux bugs
réels trouvés et corrigés en cours de route (pas des suppositions : chacun
reproduit avant correction). Diagnostic MIDI terminé en fin de session avec
le matériel réellement branché.

## Méthode de travail — répertoire partagé avec un autre agent

Découverte en cours de session : le répertoire principal
(`/home/azoth/ep133-rhythm-hero`) est partagé avec un agent travaillant en
parallèle sur le Studio (traductions, longueur native des patterns LN,
grille) — pas seulement le dépôt git, le **répertoire de travail physique**.
Un premier `git checkout -b` a failli faire atterrir les modifications non
committées de cet autre agent sur la mauvaise branche. Corrigé
immédiatement (retour à la branche d'origine, aucune perte), puis tout le
reste de la session s'est fait dans un `git worktree` séparé
(`git worktree add`), qui donne un répertoire de travail distinct sur la
même arborescence git — plus aucun risque de collision de fichiers en
direct, seul un conflit de fusion normal et gérable reste possible plus
tard. Node_modules du répertoire principal réutilisé par lien symbolique
pour éviter une réinstallation.

Playwright + Chromium installés dans un dossier isolé
(`scratchpad/pw-tools`, hors `node_modules` partagé) pour prendre de vraies
captures d'écran et exécuter des scénarios de bout en bout plutôt que de
deviner le rendu visuel.

## Rhythm Hero — niveau 1 complet

Boom-Bap était déjà validé ; House, Rock, Reggae et Minimal ont été écrits
à la main (5 niveaux, 6 mesures, variation en mesure 5, fill en mesure 6),
remplaçant la génération procédurale générique pour ces quatre styles :

- House niveau 3 reprend le motif exact de l'atlas de référence
  (`handbook/EP133_ATLAS_FINGER_DRUMMING.md`) ;
- Rock : alternance kick/snare franche dès le niveau 1 (« alternance
  simple », catalogue) ;
- Reggae niveau 1 est le *one drop* littéral (kick + snare ensemble sur le
  seul temps 3) ; le riddim complet et la basse dub arrivent aux niveaux
  suivants ;
- Minimal : particularité volontaire — à partir du niveau 2, la dernière
  mesure retire des frappes au lieu d'en ajouter, cohérent avec la
  compétence enseignée (« laisser des silences »).

`createBoomBapTargets`/`createSixBarExercise`/`STYLES` sortis d'`App.tsx`
vers `src/core/engine/patterns.ts`, justement pour réduire la zone de
collision avec le Studio dans le même fichier.

## Refonte visuelle de l'écran de jeu

Suite de retours itératifs, chacun vérifié par capture d'écran réelle
(avant/après quand pertinent) :

- pads et cadre de partition alignés sur le vocabulaire visuel déjà établi
  (`--ko-orange`, `--ko-amber`, coins arrondis, ombres dures) puis, à partir
  d'une photo de façade K.O.II fournie par l'utilisateur, rapprochés de la
  vraie forme des touches (keycaps très arrondis, légende imprimée SOUS la
  touche et non dedans) — **la photo elle-même n'a pas été utilisée comme
  source d'un avatar ou d'un asset** : c'est une photo produit Teenage
  Engineering protégée, retravailler l'image ne suffit pas à écarter le
  risque de droit d'auteur ; seule son inspiration (formes, hiérarchie) a
  été reprise, en CSS pur, comme le fait déjà `.ep133-face` sur le banc de
  test ;
- 12 pads recolorés individuellement (palette étendue à partir des accents
  orange/rose/bleu/rouge visibles sur la photo), reprise à l'identique sur
  la partition et les pastilles de piste ;
- partition restructurée en cartes de mesure arrondies et détachées (plus
  de bandeau « MESURE 1/2 » ni de ligne de numéros de pas), colonne des
  pistes vraiment sortie du conteneur qui défile (bug d'alignement
  identifié et corrigé : padding partagé manquant + bordure de carte qui
  grignotait 2px de hauteur) ;
- glisser-souris + molette pour naviguer dans la partition ;
- frappe jouée en surcouche translucide (au lieu de remplacer la couleur
  de famille du pas) ;
- ~90 lignes de CSS mort supprimées (ancien écran de jeu pré-refonte,
  vérifié par recherche de chaque classe dans `src/` avant suppression) ;
- mise en page finale : partition en pleine largeur en haut, pads à gauche
  et cadre ANALYSE (bilan de session compact) à droite en dessous — un
  essai intermédiaire en 3 colonnes (pads/espace réservé/partition) a été
  tenté puis abandonné, une seule mesure restait visible à la fois.

## Nouveau module — Fiche personnage

Accessible depuis l'accueil (carte dédiée, traduite FR/EN/ES), pas
seulement depuis le jeu — c'est un module de l'écosystème Studio :

- identité : pseudo + choix parmi 8 avatars géométriques originaux
  (`components/shared/Avatar.tsx`), jamais dérivés de la photo fournie ;
- plusieurs machines EP-133 déclarables (nom, mémoire), pas une seule —
  `playerProfile.ts` migre automatiquement l'ancien format à une seule
  machine sans perte ;
- bilan cumulé sur toutes les sessions de jeu (PERFECT/GOOD/MISS, meilleur
  combo, précision), alimenté par `App.tsx` au STOP de chaque session via
  un ref toujours à jour (évite de lire un score périmé) ;
- SCAN et CLONE distingués et **non dupliqués** : le clone (copie complète
  projets + PCM, pont local, 20-30 min) ouvre `MachineCloneDialog`, déjà
  entièrement fonctionnel ; le scan (état des lieux rapide — nombre de
  projets/sons, mémoire, chemin, sans les PCM) réutilise exactement
  `saveDeviceProfile` + `createDeviceClone` + `writeCloneManifest`, la même
  écriture de manifeste que `MachineCloneDialog` fait déjà en secours
  quand le pont n'est pas lancé ;
- bouton CONNECTER (MIDI) ajouté sur chaque carte machine — manquant à la
  première version ;
- dossier de travail mémorisé entre deux visites via IndexedDB (un
  `FileSystemDirectoryHandle` ne tient pas dans `localStorage`) : plus
  besoin de rouvrir le sélecteur à chaque fois, seulement de reconfirmer
  l'autorisation si le navigateur la redemande.

## Deux bugs réels trouvés et corrigés (pas des suppositions)

**Accès disque trop large.** `chooseLocalDirectory()` demandait
systématiquement `mode: 'readwrite'`, y compris pour une simple lecture
(dossier de travail). Corrigé : lecture par défaut, écriture demandée
explicitement seulement là où on écrit vraiment (clone, scan).

**Retour silencieux de SCANNER.** Signalé par l'utilisateur (« scanner
marche pas »), reproduit en isolant l'appel avant correction : le code
avalait sans un mot toute erreur `AbortError`, y compris quand l'échec
n'avait rien à voir avec une annulation volontaire. Le même clic qui
n'affichait rigoureusement rien affiche maintenant un message clair au bon
endroit (scopé par machine — avec plusieurs machines déclarées, l'erreur
s'affichait avant sur toutes les cartes, pas seulement la bonne). Le bouton
passe aussi en état « EN COURS… » désactivé pendant l'opération.

## Diagnostic MIDI réel — fin de session

L'EP-133 est branché sur la machine où tourne cet environnement de
développement, ce qui a permis un test direct plutôt qu'une supposition :

- `lsusb` : EP-133 détecté (`2367:8020`) ;
- `aconnect -l` : le client ALSA `EP-133 MIDI 1` n'a **aucune connexion
  active** — rien ne bloque le port en ce moment, aucune autre instance en
  concurrence détectée à cet instant précis ;
- test de connexion réel (Playwright avec permissions MIDI accordées) :
  **succès, statut affiché « EP‑133 CONNECTÉ »**. Le bouton CONNECTER et le
  code de connexion fonctionnent bien avec le matériel réel.

Conclusion transmise à l'utilisateur : si la page reste sur « NON CONNECTÉ »
malgré un port libre et un code qui fonctionne, le suspect le plus probable
devient l'autorisation MIDI du navigateur elle-même (Chrome ne redemande
pas after un refus — ça reste bloqué silencieusement tant que le site n'est
pas explicitement réautorisé dans ses paramètres).

**Effet de bord découvert pendant ce test, non corrigé** : dix occurrences
consécutives de `Error: Start time must be strictly greater than previous
start time` (planification audio Tone.js) juste après la connexion MIDI.
Préexistant, sans lien avec les modifications de cette session — signalé à
l'utilisateur, pas encore diagnostiqué en détail.

## Vérifications logicielles

- `npm test` (engine/transport/exports) : réussi après chacun des 19
  commits ;
- `npm run build` : réussi après chacun des 19 commits ;
- captures d'écran Playwright à chaque étape visuelle, avant/après quand
  pertinent (alignement, palette, layout) ;
- cycle complet testé en conditions réelles : jouer une session, frapper
  les pads, STOP manuel, retour accueil, fiche personnage affiche le bon
  bilan ;
- seul avertissement connu, déjà documenté avant cette session : bundle
  JavaScript principal au-dessus de 500 kB.

## État Git

19 commits sur `agent/jeu-niveau1-styles`, poussés au fil de l'eau vers
`origin`. Branche non fusionnée dans `agent/consolidation-suite-ep133` —
laissée à l'utilisateur ou à une session dédiée, pour éviter un merge
surprise pendant que l'autre agent travaille encore sur le Studio dans le
répertoire principal.

## Suite de session — bibliothèque perso et refonte de Sons & Transfert

Deuxième volet de la même journée, sur la même branche `agent/jeu-niveau1-
styles`, 8 commits supplémentaires. Point de départ : l'utilisateur a une
bibliothèque de sons personnelle sur disque (`/home/azoth/Musique/sample`,
55 490 fichiers WAV rangés par catégorie, 20 packs prêts pour la K.O. II —
voir `ORGANISATION.md` dans ce dossier), distincte du dossier de travail
machine (`/home/azoth/Musique/OP-133`, qui contient les clones
`EP-133-K.O.-II` et `MON-EP-133` déjà documentés dans
`FICHE_MACHINE_EP133.md`). Objectif : pouvoir la parcourir, l'écouter et
préparer son transfert vers la machine depuis l'appli.

**Itérations de disposition**, chacune vérifiée par capture d'écran
réelle et test Playwright de bout en bout (dossier factice via un faux
`showDirectoryPicker`, pour tester sans dialogue natif ni vrais fichiers) :

1. page dédiée `LocalSoundsPage` accessible depuis une carte d'accueil —
   construite, testée, puis **entièrement retirée** sur retour utilisateur :
   la bibliothèque devait vivre dans l'outil SONS & TRANSFERT existant
   (`SoundsPage`), pas à côté ;
2. bibliothèque perso fusionnée dans `SoundsPage` en 3ᵉ colonne à côté des
   pads et de la banque machine — retour : trop étroit, à mettre en bas ;
3. bandeau pleine largeur en bas — retour : plutôt à côté de la banque
   machine, avec le même concept d'affichage qu'elle, et les pads
   au-dessus ;
4. disposition finale : **GROUPES & PADS en bandeau pleine largeur en
   haut** ; **BANQUES DE SONS (machine) et BIBLIOTHÈQUE PERSO côte à côte
   en dessous**, toutes deux construites sur les mêmes classes CSS
   `.sound-bank-folders`/`.sound-bank-results` (dossiers à gauche avec un
   bouton REMONTER quand on n'est pas à la racine, fichiers filtrables et
   glissables à droite) — un même code visuel plutôt qu'une imitation, et
   les deux panneaux se retrouvent naturellement à la même taille (vérifié :
   595 px de haut mesurés en vrai des deux côtés).

**Glisser-déposer dans les deux sens**, testé avec un vrai cycle
`DragEvent` (pas seulement le repli clic) : un son de la bibliothèque
perso se dépose soit sur un pad (case orange, nom du fichier affiché),
soit directement sur un slot de la banque machine (ligne marquée « SON
PERSO PROPOSÉ · nom-du-fichier »). `SYNCHRONISER` copie alors réellement
les fichiers perso en attente dans `<dossier de travail>/a-importer/` —
une vraie préparation sur disque, honnête sur ses limites : aucun
protocole d'écriture SysEx n'existe dans ce projet, donc aucune écriture
directe sur l'EP-133 n'est jamais prétendue. Les réaffectations purement
machine (sans fichier perso) restent un plan verrouillé, comme avant.

**Bouton d'écoute ajouté sur la banque machine** : réutilise
`machineSampleBank.play()` (déjà utilisé pour l'écoute des pads du
Studio, voir `BANQUE_SAMPLES_STUDIO.md`) via une fonction dédiée côté
`App.tsx`, appliquée à un numéro de slot plutôt qu'à un pad. Contrairement
à l'écoute d'un pad, un slot brut n'a pas de repli synthétisé sensé — si
le dossier de travail n'est pas chargé, un message honnête remplace la
ligne quelques secondes (« AUCUN AUDIO LOCAL — charge le dossier de
travail depuis la FICHE PERSONNAGE ») plutôt qu'un clic silencieux.

**Réglages centralisés dans la Fiche personnage** : la bibliothèque perso
a son propre dossier (clé IndexedDB `local-library-folder`, distincte du
dossier de travail machine `sample-folder`), avec ses propres boutons
CONNECTER/CHANGER/RECONNECTER dans une nouvelle section BIBLIOTHÈQUE PERSO
de `PlayerProfilePage` — `SoundsPage` ne fait que lire ce dossier une fois
connecté, aucun sélecteur de dossier n'y a été laissé, conformément à la
consigne « tous les réglages de dossier dans la fiche perso ».

**Décluttering demandé explicitement** : suppression des sections « PROFIL
DE LA MACHINE » (formulaire nom/mémoire/dossier redondant avec la Fiche
personnage) et « TRANSFERT SÉCURISÉ » (bandeau d'instructions devenu
redondant, chaque son affiche déjà où le glisser) — avec nettoyage du code
et des ~35 lignes de CSS qui ne servaient qu'à elles, vérifié qu'aucun
autre composant ne les utilisait avant suppression.

**Campagne d'arrondissement étendue à toute la page** : boutons A–D,
cadre extérieur de la console (avec `overflow:hidden` pour que les
panneaux internes, eux carrés, se découpent proprement sur les coins
ronds — même principe que `.sound-bank-browser`), cadre des pads, boutons
CONNECTER/SYNCHRONISER, jauge de mémoire, champs RECHERCHER, et le bouton
← ACCUEIL du composant d'en-tête partagé par toutes les pages module.

Vérifications à chaque commit : `npm run build` + `npm test` au vert ;
Playwright avec faux `showDirectoryPicker` pour la navigation/écoute/
glisser-déposer réels (impossible de piloter le vrai dialogue natif du
système depuis Playwright) ; aucune erreur console à aucune étape.

## Priorités à la reprise

1. vérifier côté utilisateur les autorisations MIDI du navigateur
   (probable cause restante de « NON CONNECTÉ » malgré un port libre) ;
2. diagnostiquer l'erreur de planification audio Tone.js relevée en fin de
   session (préexistante, pas encore creusée) ;
3. fusionner `agent/jeu-niveau1-styles` dans `agent/consolidation-suite-ep133`
   une fois le travail Studio en cours stabilisé — s'attendre à un conflit
   sur `src/style.css` et `src/App.tsx`, partagés par les deux branches ;
4. mode KEYS mélodique pour Rhythm Hero — idée notée le 11/08, explicitement
   remise à plus tard, pas construite (voir mémoire
   `rhythm-hero-keys-mode-idea`) ;
5. étendre les vraies partitions aux niveaux suivants du catalogue (seul le
   niveau 1 est fait à la main, le reste utilise encore la génération
   procédurale générique) ;
6. écriture réelle vers l'EP-133 (import de sons perso, réaffectation de
   pad) reste entièrement verrouillée — aucun protocole SysEx d'écriture
   n'existe dans le projet ; `SYNCHRONISER` ne fait aujourd'hui qu'une
   copie sur disque (`a-importer/`), jamais un envoi à la machine ;
7. tri automatique par catégorie lors de l'import depuis la bibliothèque
   perso, évoqué puis explicitement non demandé pour l'instant.
