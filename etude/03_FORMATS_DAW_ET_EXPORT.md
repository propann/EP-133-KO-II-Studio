# Formats d'export DAW — état du 13 août 2026

> Complète `docs/REGISTRE_IDEES.md` (X-02 DAWproject, X-03 REAPER, X-04
> Ableton, tous `REPORTÉ`) et `docs/ROADMAP.md` (« Fonctions de DAW
> reportées »). Rien ici ne change leur statut : cette étude documente
> simplement ce qui existe pour préparer la décision quand ce chantier
> redémarrera, après stabilisation du lecteur `.ppak`.

## DAWproject (Bitwig/PreSonus)

- Dépôt : <https://github.com/bitwig/dawproject>
- **Licence permissive de type MIT** (confirmée cette session) — favorable à
  une implémentation indépendante en TypeScript.
- Format : XML + ZIP (structure lisible, pas de dépendance binaire opaque).
  L'implémentation de référence est en Java (annotations XML, génération de
  schéma par réflexion), mais **le format lui-même n'exige aucune
  dépendance Java** — un écrivain XML à la main en TypeScript est tout à
  fait réaliste, dans le même esprit que nos écrivains MIDI/TAR maison.
- Couverture : informations temporelles, pistes/canaux, données
  audio/note/automation, états des plugins.
- Adoption : Bitwig Studio ≥ 5.0.9, Studio One ≥ 6.5, Cubase 14, Cubasis
  3.7.1, VST Live 2.2 — écosystème réel, pas un format expérimental isolé.
- `phones24/ep133-export-to-daw` exporte déjà vers ce format depuis
  EP-133/EP-1320/EP-40, avec regroupement en 4 groupes (comme la machine) —
  preuve de faisabilité directe sur nos données.

**Recommandation** : rester le **premier candidat d'export DAW** dès que ce
chantier reprend (cohérent avec `docs/ANALYSE_ETUDE_CAHIER_CHARGES.md`, qui
le plaçait déjà en tête). La licence permissive du format lui-même permet
d'implémenter un écrivain XML/ZIP directement depuis le schéma publié,
plutôt que de dépendre d'une bibliothèque tierce à la licence incertaine.

## REAPER `.rpp`

- Format texte, structure arborescente proche de XML mais avec sa propre
  syntaxe (« chunks »), **lisible et modifiable à la main**.
- Bibliothèques trouvées :
  - [`rppp`](https://www.npmjs.com/package/rppp) (JS, npm) — parseur objet.
  - [`reaper-project-parser`](https://github.com/GriffinSauce/reaper-project-parser)
    (TypeScript) — lecture, écriture prévue « potentiellement » à terme.
  - Côté Python : [`rpp`](https://pypi.org/project/rpp/) (interface façon
    `xml.etree.ElementTree`), [`reathon`](https://github.com/jamesb93/reathon)
    (construction programmatique façon Python natif).

**Recommandation** : le format texte est assez simple pour un **écrivain
maison**, dans la continuité de notre philosophie (contrôle total, pas de
dépendance sur un format qui peut varier d'une version de REAPER à l'autre).
`reaper-project-parser` (TypeScript) peut servir de référence de lecture
pour valider notre propre sortie par comparaison, sans devenir une
dépendance de production. Toujours classé après DAWproject dans l'ordre de
priorité (cohérent avec `docs/ANALYSE_ETUDE_CAHIER_CHARGES.md`).

## Ableton `.als`

- Format : XML **compressé en gzip**, schéma non documenté officiellement
  par Ableton (rétro-ingénierie communautaire uniquement).
- `phones24/ep133-export-to-daw` l'exporte déjà avec un support étendu
  (enveloppe, trim, stretching, modes de lecture, export arrangement/clips
  de session, fader, FX send/return) — mais sous **licence AGPL-3.0**, donc
  son code ne peut pas être copié dans ce dépôt sans assumer les obligations
  associées (déjà acté dans `docs/ANALYSE_ETUDE_CAHIER_CHARGES.md` et
  `docs/REGISTRE_IDEES.md` X-04).

**Recommandation** : aucun changement. Reste `ÉCARTÉ V1`/`REPORTÉ` selon les
documents existants. Si ce chantier redémarre un jour, la bonne pratique
resterait une implémentation indépendante (clean-room) fondée sur la
structure XML observée par la communauté au sens large, pas sur le code
`phones24`.

## Référence d'architecture adjacente : openDAW

- Dépôt : <https://github.com/andremichelle/openDAW> (aussi
  <https://opendaw.org/>).
- DAW complet **dans le navigateur**, TypeScript/Node, licence **AGPL-3.0**,
  interface inspirée d'Ableton/Bitwig, synchronisation privée
  Google Drive/Dropbox en option.
- Intérêt pour nous : preuve qu'un DAW entier peut tourner en navigateur
  avec une architecture TypeScript proche de la nôtre (React + Web Audio).
  Utile comme **référence de conception** pour la partie « mixage/
  automation » que notre Roadmap reporte explicitement (« console de mixage
  avancée, automation complexe » listées dans les « Fonctions de DAW
  reportées »).
- Licence AGPL-3.0 : même contrainte que `phones24` — lecture et inspiration
  autorisées, copie de code interdite sans assumer les obligations.

**Recommandation** : `RÉFÉRENCER` uniquement, aucune action immédiate. À
regarder si/quand le Studio a besoin d'un vrai moteur d'automation ou de
mixage multipiste au-delà de ce qu'un export MIDI/DAWproject couvre déjà.

## Synthèse

| Format | Licence des refs trouvées | Statut recommandé |
|---|---|---|
| DAWproject | MIT (spec elle-même) | Premier candidat, écrivain maison à partir du schéma |
| REAPER `.rpp` | Libs MIT/permissives en lecture | Écrivain maison, libs en validation seulement |
| Ableton `.als` | Pas de lib libre trouvée ; réf. AGPL uniquement | Reporté, clean-room si un jour repris |
| openDAW | AGPL-3.0 | Référence de conception seulement |

Aucune de ces pistes ne change l'ordre déjà établi dans
`docs/ANALYSE_ETUDE_CAHIER_CHARGES.md` (« export MIDI reste prioritaire et
universel », DAWproject/REAPER avant Ableton). Cette étude le confirme avec
des sources plus précises plutôt que de le remettre en cause.
