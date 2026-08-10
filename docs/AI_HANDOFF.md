# Passation IA — EP-133 Rhythm Hero

> Lire ce document avant toute modification. Le projet est volontairement petit et concret : ne pas le transformer en usine à gaz avant d'avoir fait fonctionner un premier exercice avec le vrai EP-133 K.O. II connecté.

## 1. Mission du projet

**EP-133 Rhythm Hero** est un coach de finger-drumming pour le Teenage Engineering **EP-133 K.O. II**. L'idée est proche de Melodics, mais pensée pour cette machine : le logiciel montre une partition courte, indique le pad et le doigt, joue une référence, écoute le joueur sur la vraie machine, puis explique simplement les erreurs et augmente la difficulté.

La boucle produit visée :

1. le joueur choisit un exercice ;
2. il écoute / regarde une mesure ;
3. il rejoue sur le K.O. II ;
4. le logiciel compare attendu et joué ;
5. il donne un retour exploitable ;
6. le tempo ou le nombre de mesures monte progressivement.

Le produit doit rester joyeux, immédiat, visuel et musical. Il ne doit jamais ressembler à un tableur de MIDI puni par l'administration.

## 2. État réel au 9 août 2026

### Fonctionnel maintenant

- Player web autonome, sans build ni dépendance JavaScript externe.
- Interface inspirée du K.O. II : gris chaud, orange, LCD ambré, noir, typographie technique.
- 39 rythmes / exercices sur 5 niveaux.
- Choix de difficulté et de style.
- Tempo de 10 % à 150 %.
- Sons de repère synthétiques simples et VU-mètre réactif.
- Partition modèle de 16 pas, avec le numéro du pad demandé dans chaque case.
- Affichage du doigt conseillé sur chaque pad.
- Choix de 1, 2, 3 ou 4 mesures.
- Variations ajoutées sur les mesures 2 à 4 pour éviter une boucle plate.
- Partition joueur sur la mesure en cours : les clics faits sur le pad virtuel se dessinent en ambre.
- Scripts de lancement Windows, Linux et Raspberry Pi.

### Pas encore fonctionnel — ne pas le présenter comme fait

- Aucune entrée Web MIDI réelle.
- Aucun mapping de notes, canaux ou vélocités du EP-133 validé.
- La partition joueur ne reçoit **pas encore** les frappes du matériel ; elle reçoit seulement les clics du player.
- Le score, la précision et le combo ne sont pas calculés sur le jeu réel.
- Pas de précompte fiable, pas de transport audio professionnel, pas de backing track Suno/MIDI intégré.
- Pas de sauvegarde de progression, compte, back-end, base de données ni hébergement public.
- Pas de `.ppak` / `.pak` généré ni promis compatible machine.

## 3. Dépôt et fichiers importants

| Chemin | Rôle |
|---|---|
| `src/ep133-pad-player.fragment.html` | **Source principale** éditable du player. HTML, CSS et JavaScript sont dans ce fragment. |
| `docs/ep133-pad-player.html` | Version HTML autonome à ouvrir dans Chrome/Edge. À régénérer après chaque modification du fragment. |
| `exercises/catalogue-exercices-v1.json` | Métadonnées des 39 exercices : niveau, BPM, compétence. Pas encore utilisée directement par le player. |
| `exercises/PARCOURS_EXERCICES_V1.md` | Programme pédagogique lisible des 39 exercices. |
| `handbook/EP133_ATLAS_FINGER_DRUMMING.md` | Documentation / partitions de référence. |
| `tools/serve_local.py` | Serveur Python standard-library, sans dépendance. |
| `tools/start-linux.sh` | Lancement principal sur PC Linux en `localhost`. |
| `tools/check-ep133-linux.sh` | Diagnostic USB / ALSA / PipeWire de la machine. |
| `start-windows.cmd` | Lancement Windows local. |
| `tools/start-pi-local.sh` | Lancement sur Raspberry Pi pour une borne réseau. |
| `docs/MISE_EN_ROUTE_LINUX.md` | Procédure Linux recommandée. |
| `docs/LANCEMENT_LOCAL.md` | Distinction Windows / Pi et limites réseau. |
| `docs/ROADMAP.md` | Vision et étapes prévues. |
| `docs/ETAT_DU_PROJET.md` | État technique vérifié. |

## 4. Règles de travail non négociables

1. **Modifier le fragment source, puis régénérer la version autonome.** Ne pas corriger uniquement `docs/ep133-pad-player.html`.
2. Avant de pousser, valider la syntaxe JavaScript du bloc `<script>` et la syntaxe des scripts Python / shell touchés.
3. Ne pas remplacer l'interface par React, Vite, Tailwind, Electron ou une autre pile par réflexe. La migration peut venir plus tard ; elle ne résout pas le MIDI.
4. Ne pas inventer le mapping MIDI du K.O. II. Il doit être relevé avec la machine réellement branchée.
5. Ne pas annoncer un score, une précision ou une compatibilité `.ppak` comme réels sans test matériel.
6. Ne pas écraser les couleurs, la disposition compacte ou le vocabulaire déjà validés par l'utilisateur sans raison précise.
7. Garder le français dans l'interface et la documentation utilisateur.
8. Préférer les petites modifications vérifiables à un grand refactor aveugle.
9. Documenter chaque brique livrée : ce dépôt doit rester transmissible.

## 5. Direction visuelle à préserver

L'outil s'inspire des produits Teenage Engineering, particulièrement le K.O. II :

- fond gris chaud : `#E6E4DF` ;
- façade : `#D9D7D1` ;
- orange actif : `#FF4400` ;
- LCD / repères : `#FFB000` ;
- texte et traits : `#1A1A1A` ;
- police monospace / manuel technique ;
- coins légèrement arrondis, ombres dures mais pas de rectangles agressifs partout ;
- texte noir lisible sur les pads ;
- type de son en haut dans le pad, doigt conseillé en bas.

La fenêtre de jeu est compacte. Les anciens boutons de groupes `A B C D` ont été retirés pour gagner de la hauteur. Ne pas les remettre dans la zone de jeu sans nouveau besoin clair.

## 6. Convention actuelle des pads

Le player affiche 12 pads :

| Rangée | Pads affichés |
|---|---|
| 1 | `7` — `8` — `9` |
| 2 | `4` — `5` — `6` |
| 3 | `1` — `2` — `3` |
| 4 | `.` — `0` — `ENTER` |

Cette dernière rangée est une convention visuelle explicitement demandée par l'utilisateur après correction du premier dessin. Ne pas la remplacer par `0 + -` sur simple supposition. Toute correspondance exacte avec les groupes et événements physiques doit être validée lors du relevé MIDI et, si besoin, avec une photo de la machine utilisée.

Le kit pédagogique courant est :

| Rôle | Pad visuel | Doigt affiché |
|---|---|---|
| Kick | `A-7` | pouce gauche |
| Snare | `A-9` | index droit |
| Hat | `A-5` | index gauche |
| Perc | `A-1` | annulaire gauche |

Les `A-` désignent le placement pédagogique actuel. Ils ne constituent pas encore un mapping MIDI prouvé.

## 7. Exercices et progression

- 39 exercices, niveaux 1 à 5.
- Une mesure = 16 pas / doubles croches (`1 e & a`).
- Le joueur peut demander de 1 à 4 mesures.
- Mesure 1 : pattern fondamental.
- Mesure 2 : petite réponse / percussion de fin.
- Mesure 3 : ajout de kick ou percussion.
- Mesure 4 : fin plus dense / fill léger.

La pédagogie doit introduire **une difficulté principale à la fois**. Pour chaque exercice futur, conserver : objectif, BPM, grille, rôle/pad/doigt, seuil de réussite et variante plus facile.

Point technique à connaître : les patterns joués sont encore codés dans l'objet JavaScript `grooves` du fragment. Le catalogue JSON contient des métadonnées séparées. Cette duplication est acceptable pour le prototype, mais deviendra une source d'erreurs : après la première validation MIDI, la prochaine refonte propre doit choisir une seule source de vérité JSON pour les patterns et les métadonnées.

## 8. Lancement recommandé

### PC Linux — chemin principal

Le K.O. II se branche directement sur le PC Linux. C'est la machine de développement et de test MIDI.

```bash
git clone https://github.com/propann/ep133-rhythm-hero.git
cd ep133-rhythm-hero
sudo apt update
sudo apt install -y python3 alsa-utils
chmod +x tools/start-linux.sh tools/check-ep133-linux.sh
./tools/check-ep133-linux.sh
./tools/start-linux.sh
```

Le player s'ouvre sur `http://127.0.0.1:8787/docs/ep133-pad-player.html`.

`localhost` est le bon choix pour le futur Web MIDI : le navigateur considère cette origine comme sûre. Ouvrir le fichier HTML directement fonctionne aujourd'hui pour le visuel, mais un serveur local prépare mieux le MIDI.

### Raspberry Pi — borne réseau, pas cerveau MIDI distant

Le Pi peut proposer le cours sur le réseau local avec `tools/start-pi-local.sh`. Il est utile pour une borne autonome ou une tablette. En revanche, si le K.O. II est branché au PC Linux, le Pi ne reçoit pas son MIDI par magie : il faut soit brancher l'EP-133 au Pi, soit construire plus tard un pont MIDI explicite. Ne pas faire croire que l'ouverture d'une URL sur le Pi suffit à capter le MIDI USB du PC.

## 9. Vérification matérielle déjà connue

Sur Linux, l'EP-133 a déjà été vu en USB avec :

```text
idVendor  0x2367  Teenage Engineering
idProduct 0x8020  EP-133
```

Il expose des interfaces USB Audio / Control / Streaming. Cela prouve la présence USB et audio, **pas encore** le mapping note/velocity exact requis pour le jeu.

## 10. Prochaine mission prioritaire — MIDI réel

Ne pas commencer par un grand redesign. Faire ceci, dans cet ordre :

1. Sur le PC Linux, lancer `./tools/check-ep133-linux.sh` avec le K.O. II branché.
2. Ajouter au player un panneau de diagnostic MIDI minimal : liste des ports, bouton connecter, journal des messages reçus.
3. Frapper lentement chaque pad / groupe et relever : note, vélocité, canal, note-off éventuel, horodatage.
4. Sauvegarder ce relevé dans `docs/MAPPING_MIDI_EP133.md` avec date, OS, navigateur et version de firmware connue.
5. Créer une table de traduction entre événement MIDI réel et pad pédagogique.
6. Alimenter la partition joueur avec ces événements réels.
7. Ensuite seulement, comparer la frappe à la subdivision attendue et calculer avance/retard, pad incorrect, miss, combo et score.

### Critère de fin de cette mission

Un seul exercice (Boom-bap fondation, 1 mesure, 86 BPM) doit pouvoir : détecter le pad réel, afficher la frappe dans la partition joueur et dire clairement si elle est au bon pas. Pas besoin d'un score glamour avant cela.

## 11. Trajectoire après le premier exercice MIDI

1. Stabiliser le moteur de timing avec une horloge unique, plutôt qu'une succession approximative de `setTimeout`.
2. Passer les exercices dans une source JSON unique.
3. Ajouter précompte, auto-miss, rapport de fin et progression locale.
4. Ajouter import / lecture de backing tracks et MIDI propres, notamment les projets Suno, sans verrouiller le jeu à Suno.
5. Construire les onglets envisagés : **Cours**, **Jeu**, **Création**, **Studio**, **Import MIDI**.
6. Étudier une version Raspberry Pi autonome après validation du flux MIDI et audio.

## 12. Commandes de contrôle utiles

Après une modification du fragment, régénérer l'export autonome avec l'outil de l'environnement de développement, puis vérifier le JavaScript. À défaut, vérifier au minimum que les deux fichiers restent cohérents :

```bash
node -e "const fs=require('fs'),vm=require('vm'); const s=fs.readFileSync('src/ep133-pad-player.fragment.html','utf8'); new vm.Script(s.match(/<script>([\\s\\S]*?)<\\/script>/)[1]); console.log('JS OK')"
python3 -m py_compile tools/serve_local.py
bash -n tools/start-linux.sh tools/check-ep133-linux.sh
```

## 13. Consigne de reprise pour une autre IA

Avant d'éditer : lire ce fichier, `README.md`, `docs/ROADMAP.md`, `docs/ETAT_DU_PROJET.md`, puis le fragment source. Annoncer précisément les fichiers qui seront modifiés. Ne pas supprimer de fonctionnalités visuelles existantes pour résoudre un problème de structure. Faire une modification, la vérifier, la documenter et seulement ensuite pousser.

La priorité est le **jeu réel sur le matériel**, pas l'ajout de panneaux décoratifs. Le projet a déjà son corps ; il lui faut maintenant des nerfs MIDI.
