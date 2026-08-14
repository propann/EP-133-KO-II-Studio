# Étude SysEx, MIDI et contrôle externe — EP-133 K.O. II

> Étude de cadrage du 14 août 2026 pour décider jusqu’où l’EP-133 peut devenir
> une surface de contrôle du Studio et de Rhythm Hero. Les conclusions sont
> séparées en trois niveaux : documenté par Teenage Engineering, observé dans
> le dépôt ou les outils communautaires, et à capturer sur notre machine.

## Verdict exécutif

Oui, l’EP-133 peut déjà contrôler le Studio de façon utile, mais il faut
distinguer trois couches qui ne doivent pas être mélangées :

1. **MIDI musical stable** : les 12 pads, les groupes A–D, la vélocité, les
   notes KEYS, l’horloge, Start/Stop/Continue et Song Position.
2. **MIDI de paramètres documenté mais limité** : CC 1 (vibrato), CC 12/13
   (paramètres X/Y de l’effet punch-in), CC 64 (sustain pour les voix KEY et
   LEGATO). Ces CC sont documentés comme paramètres reçus par l’EP-133 ; cela
   ne prouve pas que les knobs physiques les émettent vers l’ordinateur.
3. **SysEx propriétaire** : identité, échange FILE, projets, samples,
   métadonnées et événements spontanés. Cette couche est puissante pour lire,
   sauvegarder et préparer des écritures, mais elle ne doit pas être devinée
   pour fabriquer une télécommande universelle.

La meilleure stratégie est donc de construire un **mode Apprentissage MIDI** :
le Studio enregistre chaque message entrant, l’utilisateur désigne l’action
voulue, puis l’application mémorise une règle vérifiable. On peut ainsi
exploiter immédiatement les pads et les transports, puis ajouter les boutons
et knobs uniquement quand une capture réelle démontre leur émission.

## 1. Ce que la documentation officielle permet d’affirmer

La page système officielle indique :

- canaux MIDI 1 à 16 ;
- mode global `ALL` : réception sur tous les canaux et émission sur le canal 1 ;
- sélection d’un canal précis, ou mode `OFF`/assigné par son ;
- MIDI Thru désactivé ou activé ;
- Start, Stop, Continue, Clock et Song Position ;
- notes 36–47 pour A, 48–59 pour B, 60–71 pour C et 72–83 pour D ;
- mode KEYS pouvant utiliser les notes 0–127 ;
- Bank Select CC 0/32 pour atteindre les sons 1–999 ;
- CC 1, 12, 13 et 64 pour certains paramètres.

La documentation officielle ne fournit pas de table complète disant que le
fader, les deux knobs, PLAY, TEMPO, SOUND ou MAIN transmettent chacun un
message vers USB-MIDI. Il faut donc les tester, pas les déduire de leur
présence à l’écran.

Source : [guide système officiel EP-133](https://teenage.engineering/guides/ep-133/system).

## 2. Les canaux : ce que signifie « plus de canaux »

L’EP-133 possède bien 16 canaux MIDI utilisables, mais il ne faut pas les
représenter comme 16 sorties indépendantes dans le navigateur : USB-MIDI reste
un port avec des messages adressés à différents canaux.

| Question | Réponse prudente |
|---|---|
| Un groupe A/B/C/D = un canal ? | Non. Par défaut, ce sont surtout des plages de notes. |
| Peut-on utiliser 16 canaux ? | Oui, selon le réglage global ou l’affectation MIDI de chaque son/pad. |
| Peut-on jouer les 4 groupes séparément depuis le Studio ? | Oui, par notes 36–83 ; le canal doit être géré selon le réglage de la machine. |
| Peut-on faire 16 pistes indépendantes dans le Studio ? | Oui côté modèle et routage logiciel ; la preuve matérielle doit vérifier le comportement des canaux choisis. |
| Les canaux donnent-ils accès à 16 groupes physiques ? | Non. Ils routent des messages, ils ne créent pas de nouveaux groupes de pads. |
| Peut-on recevoir tous les canaux ? | Oui en mode global `ALL`, mais cela peut rendre le diagnostic moins lisible. |

Conséquence produit : le Studio doit afficher séparément **groupe**, **pad** et
**canal MIDI**, au lieu de présenter « A = canal 1 ». Le scanner lit déjà le
canal de chaque pad ; il faut maintenant l’exposer dans le diagnostic et le
routage live.

## 3. Carte des contrôles exploitables

### Niveau A — immédiatement exploitable

| Contrôle machine | Message probable/confirmé | Utilisation Studio |
|---|---|---|
| Pads A–D | Note On/Off, vélocité | jouer un pad, sélectionner groupe, lancer un exercice, enregistrer une note |
| Mode KEYS | Note On/Off chromatique | jouer le piano-roll et le clavier du Studio |
| PLAY/STOP | Start/Stop/Continue ou événement propriétaire | transport du Studio, avec option de sécurité désactivable |
| Horloge | MIDI Clock | synchroniser lecture, curseur, boucle et jeu |
| Song Position | message système commun | positionner la lecture si le firmware l’envoie dans ce contexte |

### Niveau B — à vérifier par capture

| Contrôle | Hypothèse | Action de recherche |
|---|---|---|
| Fader | CC ou SysEx spontané, potentiellement aucun message | bouger lentement, rapidement, avec et sans SHIFT, dans plusieurs modes |
| Knob X/Y | CC, SysEx ou silence MIDI | tester en Sound Edit, FX punch-in, Pattern et Song |
| A/B/C/D | événement SysEx spontané déjà repéré dans le projet | capturer deux fois chaque bouton et décoder les invariants |
| TEMPO | message propriétaire ou aucun message | tapoter, tourner/maintenir si applicable, observer MIDI Clock séparément |
| SOUND/MAIN/ERASE/SHIFT | souvent interface locale seulement | capturer sans envoyer de commande en retour |
| REC/PLAY | transport standard + éventuel événement propriétaire | distinguer le message standard de la notification d’interface |

### Niveau C — à ne pas promettre

- écrire des réglages système par SysEx sans commande documentée et testée ;
- envoyer une commande inconnue « pour voir » sur la machine principale ;
- utiliser DFU, formatage, suppression de slot ou restauration sans checkpoint ;
- prétendre qu’un knob contrôle une cible parce qu’un logiciel externe affiche un
  CC similaire ;
- traiter un SysEx spontané comme une réponse FILE ;
- généraliser une trame capturée sur le groupe A aux groupes B, C ou D sans
  capture séparée.

## 4. SysEx : architecture comprise à ce jour

Les échanges propriétaires observés utilisent la famille :

```text
F0 00 20 76 33 40 ... F7
```

Les échanges FILE ajoutent un identifiant de requête et une commande. Les
données binaires sont emballées en groupes de sept octets avec un octet de
bits hauts, le même principe que `pack7`/`unpack7` du Studio. Le Studio sait
déjà distinguer les réponses FILE qui correspondent à une requête en attente.

Il existe deux flux à journaliser séparément :

```text
PC → EP-133 : requête FILE / lecture / écriture protégée
EP-133 → PC : réponse corrélée ou événement spontané
```

Les événements spontanés sont particulièrement importants pour les boutons de
groupe A–D. Une notification reçue doit modifier l’interface locale sans être
réémise automatiquement, afin d’éviter une boucle machine → Studio → machine.

## 5. Ce que le Studio doit devenir

### 5.1 Un analyseur, pas seulement un moniteur

Le journal MIDI existant doit évoluer vers une fiche par événement :

- horodatage relatif et absolu ;
- port exact ;
- direction entrée/sortie ;
- type : note, CC, realtime, système, SysEx ;
- canal ;
- octets bruts en hexadécimal ;
- préfixe reconnu ou `UNKNOWN` ;
- répétition et différence avec la capture précédente ;
- firmware, projet actif et mode de la machine si connus.

### 5.2 Un système d’apprentissage de commandes

Le parcours cible :

1. ouvrir **TEST MACHINE → APPRENDRE UN CONTRÔLE** ;
2. choisir une action Studio : lecture, arrêt, groupe suivant, scène suivante,
   pad sélectionné, vélocité, tempo, boucle, capture d’exercice ;
3. appuyer ou tourner un seul contrôle sur l’EP-133 ;
4. afficher les messages candidats avec leur signature ;
5. répéter le geste et demander une confirmation ;
6. enregistrer le mapping local avec port, canal, type et données ;
7. permettre de désactiver temporairement le mapping sans le supprimer.

La signature ne doit pas être uniquement l’hexadécimal complet : pour un CC,
elle doit séparer canal, numéro et plage de valeur ; pour une note, canal et
note ; pour un SysEx, préfixe, commande et octets variables.

### 5.3 Une couche d’actions à risque gradué

| Niveau | Exemple | Autorisation |
|---|---|---|
| 0 | afficher diagnostic, changer vue, sélectionner groupe local | automatique |
| 1 | lecture/stop du Studio, déclencher un exercice | mapping appris puis activable |
| 2 | envoyer une note, une horloge ou un CC vers l’EP-133 | port et cible affichés, bouton PANIC disponible |
| 3 | écrire projet, pad ou sample | checkpoint, confirmation, relecture et vérification |
| 4 | DFU, formatage, suppression | hors interface normale, jamais mappé |

## 6. Campagne de capture réelle

Cette campagne doit être réalisée sur la machine déjà connue, avec un projet
de test et un checkpoint lecture seule avant chaque série. Elle ne nécessite
aucune écriture SysEx.

### Série 0 — environnement

- noter version OS/firmware affichée par la machine ;
- noter le nom exact du port entrée et sortie ;
- désactiver les autres ports MIDI et `Midi Through` ;
- ouvrir TEST MACHINE avec SysEx autorisé ;
- exporter le journal avant toute déconnexion.

### Série 1 — messages de base

- appuyer une fois sur chaque pad A1–D12 ;
- répéter avec trois intensités ;
- tester Note On/Off, canal, note, vélocité et éventuel SysEx associé ;
- activer KEYS et jouer trois notes graves, médiums et aiguës ;
- presser PLAY, STOP, CONTINUE et vérifier Clock/Song Position.

### Série 2 — boutons de groupe

- A, B, C, D deux fois chacun ;
- mêmes boutons depuis plusieurs patterns ;
- comparer les messages après changement réel et après appui sans changement ;
- vérifier si l’événement contient la valeur du groupe ou seulement un identifiant.

### Série 3 — knobs et fader

Pour chaque contrôle, enregistrer : repos, mouvement lent, mouvement rapide,
valeurs min/max et retour en arrière. Répéter dans Pattern, Sound Edit, FX et
Song. La matrice doit distinguer « aucun message », CC stable, CC relatif,
SysEx variable et message standard.

### Série 4 — séparation émission/réception

- envoyer depuis le Studio CC 1, 12, 13, 64 sur les canaux 1, 2, 8 et 16 ;
- vérifier uniquement l’effet visible et le journal de retour ;
- ne pas conclure qu’un CC est bidirectionnel parce que l’EP-133 l’accepte ;
- documenter si la machine renvoie une valeur ou reste silencieuse.

### Série 5 — canaux

- régler un pad de test sur canal 1, puis 2, puis 16 ;
- tester réception en mode `ALL`, canal fixe et mode assigné ;
- vérifier si le pad émet sur son canal configuré ;
- tester deux pads de groupes différents sur des canaux distincts ;
- remettre les réglages initiaux et rescanner le projet.

## 7. Hypothèses et critères de preuve

| Hypothèse | État actuel | Pour la déclarer vraie |
|---|---|---|
| Les pads contrôlent le Studio | confirmé | déjà validé par notes réelles |
| A–D émettent un SysEx spontané | fortement étayé et déjà journalisé | même signature reproduite deux fois par groupe |
| Le fader est un CC | inconnu | capture sur trois positions et deux modes |
| X/Y émettent CC 12/13 | non prouvé | capture physique + comparaison des valeurs |
| Les 16 canaux sont indépendants | documenté au niveau MIDI | test émission/réception sur 1, 2 et 16 |
| SysEx peut changer toute l’interface | non prouvé | commande documentée ou réponse stable, jamais une intuition |
| Le Studio peut piloter le transport | plausible et partiellement confirmé | test réel sans double déclenchement ni boucle |

## 8. Feuille de route proposée

### P0 — instrumentation sûre

- conserver les trames brutes entrantes et sortantes dans le journal ;
- ajouter la direction, le canal et le regroupement par signature ;
- séparer réponses FILE et événements spontanés ;
- créer un export JSON de campagne avec hash du journal ;
- ajouter un filtre de port strict et un bouton PANIC visible.

### P1 — contrôleur Studio sans SysEx d’écriture

- apprentissage de notes, CC et realtime ;
- mapping local versionné et import/export JSON ;
- actions transport, groupes, scènes et lancement d’exercice ;
- mode « contrôler le Studio » séparé du mode « envoyer à la machine » ;
- affichage explicite des canaux 1–16 et du groupe/pad associé.

### P2 — SysEx lecture et diagnostic

- décoder les événements A–D avec une table versionnée ;
- intégrer GREET/ECHO uniquement comme tests non destructifs ;
- afficher firmware/SKU/identité quand la réponse est confirmée ;
- corréler les lectures FILE avec le journal et le checkpoint ;
- comparer les captures entre firmware sans écraser les anciennes.

### P3 — écriture protégée

- uniquement après validation d’un vrai projet complet ;
- checkpoint automatique, diff lisible, cible explicite ;
- relecture binaire complète et vérification des pads/sons/scènes/Song ;
- aucune commande inconnue dans l’interface utilisateur ;
- restauration testée séparément et documentée comme validation matérielle.

## Conclusion

Le « contrôleur magique » ne sera pas une liste de commandes SysEx inventées.
Ce sera un Studio qui comprend le signal réel, apprend les commandes que la
machine expose effectivement, exploite les 16 canaux sans confondre canaux et
groupes, et garde chaque action dangereuse derrière une preuve.

La première livraison utile après cette étude est donc l’**analyseur/apprenant
de contrôles**, pas l’envoi de SysEx inconnu. Dès que la machine est branchée,
la campagne Série 1 à 3 permettra de savoir rapidement si le fader, les knobs,
TEMPO et PLAY offrent réellement des commandes supplémentaires.

## Sources

- [Guide système officiel Teenage Engineering](https://teenage.engineering/guides/ep-133/system)
- [Guide MIDI EP-133](https://www.teenagemanual.com/ep-133/midi)
- [EP-133 MIDI CCs & NRPNs](https://midi.guide/d/teenage-engineering/ep-133-ko-ii/)
- [kmorrill/ep-series-sysex](https://github.com/kmorrill/ep-series-sysex)
- [garrettjwilke/ep_133_sysex_thingy](https://github.com/garrettjwilke/ep_133_sysex_thingy)
- [icherniukh/ep133-krate](https://github.com/icherniukh/ep133-krate)
- [Discussion de rétro-ingénierie EP Series](https://op-forums.com/t/opening-up-the-ep-series-for-third-party-development/31759)
- Références locales : [`REFERENCE_SYSEX_EP133.md`](REFERENCE_SYSEX_EP133.md),
  [`CONNEXION_ET_CALIBRATION_MIDI.md`](CONNEXION_ET_CALIBRATION_MIDI.md),
  [`A_VALIDER_PHYSIQUEMENT.md`](A_VALIDER_PHYSIQUEMENT.md),
  `src/core/midi/useWebMidi.ts`.
