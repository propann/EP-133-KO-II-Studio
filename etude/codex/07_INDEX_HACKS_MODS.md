# Veille Codex — hacks et mods EP-133

> Dossier complémentaire séparé de la documentation produit. Aucun hack décrit ici n’est autorisé dans le parcours normal du Studio.

## Périmètre

Cette étude couvre :

- reverse engineering du protocole et outils non officiels ;
- détournements logiciels et automatisation ;
- firmware, cross-flash et downgrade ;
- mods mécaniques, overlays, faders et réparations ;
- accessoires DIY et usages créatifs qui ressemblent à des mods.

## Classement de sécurité

| Niveau | Signification |
|---|---|
| H0 | lecture, capture, export, analyse hors machine |
| H1 | MIDI ordinaire et fonctions officiellement exposées |
| H2 | écriture SysEx avec backup, machine de test et restauration |
| H3 | firmware, DFU, cross-flash, ouverture du boîtier ou modification électrique |

Le Studio reste au maximum en H0/H1 par défaut. H2 demande une procédure séparée. H3 ne doit pas être lancé depuis l’application.

## Sources principales

- [`ep-series-sysex`](https://github.com/kmorrill/ep-series-sysex) : protocole, formats, tests hardware et garde-fous.
- [`ep133-krate`](https://github.com/icherniukh/ep133-krate) : gestionnaire de samples, captures USB et gaps explicitement listés.
- [`ep133-ppak`](https://github.com/ZacharySBrown/ep133-ppak) : génération de projets et samples.
- [`ep_133_sample_tool`](https://github.com/garrettjwilke/ep_133_sample_tool) : outil officiel-like hors ligne et permission SysEx.
- [`te-archive/ep-133_firmware`](https://github.com/te-archive/ep-133_firmware) : archive firmware à traiter avec précaution.
- [OP Forum — développement tiers](https://op-forums.com/t/opening-up-the-ep-series-for-third-party-development/31759) : retours communautaires et validation annoncée sur appareils réels.

## Conclusion courte

Le hack utile pour notre projet est l’interopérabilité documentée : détecter, lire, capturer, décoder et exporter. Le cross-flash firmware et les mods électriques sont des sujets de recherche séparés, potentiellement irréversibles, et ne doivent pas être transformés en fonctionnalité produit.

