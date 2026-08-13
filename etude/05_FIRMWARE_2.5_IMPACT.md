# Impact du firmware EP-133 K.O. II 2.5 (juin 2026)

> Nos documents existants (`docs/REFERENCE_SYSEX_EP133.md`,
> `PROJECT_CONTEXT.md`) ont été rédigés et validés sur un état antérieur de
> la machine. Le firmware 2.5, gratuit, sorti en juin 2026, ajoute des
> fonctions qui touchent directement nos hypothèses documentées. Cette page
> liste chaque nouveauté et ce qu'elle change concrètement pour nous.

## Nouveautés du firmware 2.5

1. **Audio USB class-compliant** : le K.O. II peut désormais servir
   d'interface audio USB standard avec n'importe quel hôte conforme à la
   classe (mobile ou ordinateur), pour enregistrer des échantillons depuis
   une application externe directement sur la machine.
2. **Reverse d'échantillon** : possibilité d'inverser un sample pour créer
   un nouveau son.
3. **Contrôle du taux d'échantillonnage — trois options** :
   - `LO` : 26 250 Hz
   - `MID` : 32 000 Hz
   - `HI` : 46 875 Hz (c'est la valeur que nous documentions jusqu'ici comme
     unique fréquence native).
4. **Enregistrement mono prolongé** : jusqu'à 40 secondes en sacrifiant la
   stéréo.
5. **Arpégiateur** : nouvelle fonction, modes one-shot ou legato.
6. **Chop automatique à longueur égale** : découpage uniforme d'un sample.

## Impact direct sur nos documents et notre code

### `docs/REFERENCE_SYSEX_EP133.md` et `PROJECT_CONTEXT.md` — fréquence native

Ces documents affirment actuellement : « les WAV natifs observés sont mono
PCM 16 bits à 46 875 Hz », présenté comme LA fréquence native de la machine.
C'est encore vrai pour un sample enregistré/converti en mode `HI`, mais **ce
n'est plus la seule fréquence native possible** depuis le firmware 2.5 : un
utilisateur peut choisir `LO` (26 250 Hz) ou `MID` (32 000 Hz) au moment de
l'enregistrement, produisant un fichier natif à cette fréquence.

**Action recommandée** (à valider avant modification, comme toute règle
protocole du projet) : nuancer la phrase dans
`docs/REFERENCE_SYSEX_EP133.md` en documentant les trois fréquences
possibles selon le réglage choisi sur la machine au moment de
l'enregistrement, plutôt qu'une fréquence native unique. Notre analyseur WAV
(`wavAnalysis.ts`, `docs/REGISTRE_IDEES.md` Q-15) lit déjà la fréquence
depuis l'en-tête RIFF sans supposer de valeur fixe — le code est donc déjà
correct sur ce point ; c'est la **documentation** qui doit être corrigée
pour ne pas induire en erreur un futur agent ou contributeur qui la
lirait avant le code.

### `docs/REGISTRE_IDEES.md` A-03 — conversion 44,1 kHz

A-03 est déjà `CORRIGÉ` vers « cible native observée : PCM 16 bits à
46 875 Hz ». Avec le firmware 2.5, la bonne cible de conversion dépend du
mode d'enregistrement choisi par l'utilisateur sur la machine, pas d'une
valeur fixe. À rouvrir lors de l'implémentation réelle du pipeline de
conversion (Phase 4), pas immédiatement — mais il faut le savoir avant de
coder un resampler qui ne viserait que 46 875 Hz en dur (voir
[02_BIBLIOTHEQUES_TECHNIQUES.md](02_BIBLIOTHEQUES_TECHNIQUES.md#décodage-et-resampling-audio-conversion-vers-46-875-32-000-26-250-hz)
pour la bibliothèque recommandée, `libsamplerate-js`, qui accepte une
fréquence cible paramétrable — donc déjà compatible avec cette découverte).

### Nouvelles idées potentielles pour `docs/REGISTRE_IDEES.md`

Ces fonctions machine n'ont pas d'équivalent Studio aujourd'hui et
pourraient devenir de nouvelles lignes du registre (statut `EXPÉRIMENTER`,
à confirmer par capture SysEx réelle avant tout code, comme la règle du
projet l'exige) :
- **Reverse d'échantillon** côté Studio (opération non destructive sur une
  copie locale, avant tout transfert) — techniquement trivial en Web Audio
  (inversion d'un buffer PCM), mais à ne présenter que si la métadonnée
  correspondante dans le sample EP-133 est confirmée par capture réelle.
- **Auto-chop à longueur égale** — recoupe avec A-10 (« slicing sur
  grille/nombre fixe ») déjà `RETENU` dans le registre ; le firmware 2.5
  confirme que c'est une fonctionnalité native attendue par les
  utilisateurs, ce qui renforce (sans changer) la priorité déjà donnée à
  A-10.
- **Arpégiateur** — aucune ligne existante dans le registre ne le couvre.
  Pourrait devenir une nouvelle ligne `E-27` si une capture SysEx confirme
  un champ de pattern dédié ; sinon rester hors périmètre (le Studio ne doit
  pas deviner une structure non confirmée, règle déjà actée).

### `docs/BANQUE_SAMPLES_STUDIO.md` / capacité mémoire

Le contrôle de taux d'échantillonnage a un effet indirect sur l'occupation
mémoire (un sample `LO` occupe moins de place qu'un `HI` pour une durée
identique). Notre monitoring mémoire (F-07, déjà `RETENU` : « capacité
détectée, jamais supposée ») doit rester conscient que la taille d'un sample
ne se déduit plus d'une seule fréquence fixe — encore une fois, le principe
déjà acté (mesurer, ne pas supposer) couvre déjà ce cas ; c'est une
confirmation, pas un changement de règle.

## Ce que cette découverte ne change PAS

- Le format `.pak/.ppak` (ZIP + TAR) reste valide tel que documenté.
- Le préfixe SysEx `F0 00 20 76 33 40` et la structure FILE restent valides
  (aucune source consultée ne signale de rupture de protocole en 2.5, la
  vérification `kmorrill/ep-series-sysex` sur firmware 2.5.1 le confirme
  plutôt).
- Les règles de sécurité (lecture seule par défaut, aucune écriture sans
  confirmation) restent entièrement valables.

## Prochaine étape suggérée

Avant toute modification de code liée à ce document, suivre la même
procédure déjà décrite dans `docs/REFERENCE_SYSEX_EP133.md` : capturer un
sample enregistré en mode `LO` et un en mode `MID` sur la machine réelle,
comparer l'en-tête RIFF obtenu à celui d'un sample `HI` déjà analysé, et ne
corriger la documentation qu'après cette vérification — pas seulement sur la
base des annonces publiques du firmware.
