# Point d'étape — Sons & Transfert

## Intention

La page Sons & Transfert doit permettre de comprendre la machine avant de
présenter les opérations de fichiers. La vue précédente empilait profil,
inventaire global et pads sous forme de listes ; elle ne montrait pas clairement
la relation groupe → pad → slot → banque sonore.

## Principes repris de la notice

La notice OS 2.0 locale a été relue, en particulier les sections 4.1, 4.2, 8.1
et 10.2. Elle confirme :

- quatre groupes A–D ;
- douze sons/pads par groupe ;
- le choix d'un groupe puis d'un pad avant l'affectation d'un son ;
- les plages 001–099 Kicks, 100–199 Snares, 200–299 Hi-hats,
  300–399 Percussion, 400–499 Bass et 500–599 Melodic ;
- une mémoire globale pouvant contenir jusqu'à 999 samples, dans la limite de
  la capacité de la machine.

L'interface reprend ces relations et principes sans copier les illustrations,
icônes ou pages protégées de la notice.

## Nouvelle organisation

- façade principale séparée en panneau Groupes & Pads et navigateur de banques ;
- groupes A–D toujours visibles avec le nombre de pads renseignés ;
- groupes A–D placés verticalement à gauche de la grille comme sur la machine ;
- 12 pads dans une grille physique 3 × 4 avec correspondance canonique : les
  pads internes 1–12 portent les touches `7 8 9 / 4 5 6 / 1 2 3 / · 0 ENTER` ;
- sélection d'un pad directement visible sur le pavé, sans panneau de détail
  supplémentaire ;
- une frappe sur l'EP-133 connecté sélectionne son groupe et illumine son pad ;
- les pads virtuels sont jouables : sortie EP-133 en priorité, sinon PCM du
  clone, sinon synthèse locale de secours ;
- un bouton KEYS unique dans l'en-tête devient orange et bascule le pad
  sélectionné entre ONE et KEYS dans le projet local partagé avec le Studio ;
- tous les dossiers sonores sont visibles sous forme de boutons ; le dossier
  actif reste orange et ouvre sa liste ; les dossiers sont disposés
  verticalement à gauche des sons, avec uniquement leur nom pour rester compacts ;
- inventaire global recherchable par slot ou nom ;
- bouton SUPPRIMER visible par son, mais action matérielle verrouillée tant que
  checkpoint, sauvegarde du slot et relecture ne sont pas disponibles ;
- profil, mémoire, connexion MIDI et dossier du clone conservés ;
- transfert WAV toujours désactivé tant que la chaîne sécurisée n'existe pas.

## Code visuel des banques

| Banque | Plage | Couleur fonctionnelle |
|---|---:|---|
| Kick | 001–099 | orange rouge |
| Snare | 100–199 | orange clair |
| Hi-hat | 200–299 | jaune |
| Percussion | 300–399 | prune |
| Bass | 400–499 | bleu profond |
| Melodic | 500–599 | vert grisé |
| FX / User | 600–699 | violet |
| User 1 | 700–799 | bleu pétrole |
| User 2 | 800–899 | brun clair |
| User 3 | 900–999 | gris |

Les six premières plages sont les seules nommées par la notice. Les plages
600–999 sont donc présentées comme zones de travail utilisateur ; `FX / USER`,
`USER 1`, `USER 2` et `USER 3` sont une organisation de l'application, pas une
appellation officielle attribuée à l'EP-133.

Les notes MIDI 36–83 permettent de suivre automatiquement groupe et pad. Les
boutons physiques A–D ou KEYS utilisés seuls ne sont pas supposés émettre un
message MIDI tant qu'une mesure réelle ne l'a pas confirmé ; aucun CC fictif
n'est donc interprété.

## Préparation d'une synchronisation

- un son de la liste peut être glissé sur un pad ;
- l'affectation reste locale et le pad ainsi que le son restent orange ;
- les boutons de banques indiquent le taux d'occupation sur 100 emplacements
  (`TOUS` utilise la capacité globale de 999 slots) ;
- la jauge compare mémoire actuelle et mémoire théorique ; une réaffectation
  d'un son existant ajoute zéro octet ;
- `SYNCHRONISER` récapitule et confirme le plan, mais n'écrit pas encore sur la
  machine.

L'écriture exige encore : charger le projet machine comme base, modifier le
champ pad/slot sans perdre les octets inconnus, compiler l'archive, créer un
checkpoint, demander confirmation, écrire un projet brouillon puis relire et
comparer. La bibliothèque `epsysex` expose l'écriture d'une archive projet, mais
ce parcours complet n'est pas encore validé dans Rhythm Hero.

## Validation du 10 août 2026

- tests moteur, transport et formats réussis ;
- tests des bornes de groupes et du mapping MIDI → pad interne réussis ;
- build React/TypeScript réussi ;
- contrôle `git diff --check` réussi ;
- validation visuelle utilisateur à effectuer dans Chrome/Chromium sur écran
  large puis étroit.
