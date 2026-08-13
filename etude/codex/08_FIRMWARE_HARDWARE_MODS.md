# Firmware et mods matériels — état de la veille

## 1. Firmware officiel et archives

Le firmware est transmis par USB et le guide officiel présente aussi l’USB comme chemin de mise à jour. Les archives communautaires peuvent aider à comparer des versions, mais elles ne prouvent ni l’authenticité, ni l’intégrité, ni la compatibilité d’un fichier.

Références : [guide matériel officiel](https://teenage.engineering/guides/ep-133/hardware-overview), [archive firmware communautaire](https://github.com/te-archive/ep-133_firmware).

Règle : ne jamais intégrer un firmware dans le dépôt, ne jamais le flasher depuis le Studio, ne jamais proposer un downgrade automatique.

## 2. Cross-flash EP-133 / EP-40

Des discussions récentes prétendent qu’un firmware EP-40/Riddim pourrait être envoyé à un EP-133. La source repérée est une discussion Reddit, pas une documentation reproductible ni une procédure sûre : [témoignage non validé](https://www.reddit.com/r/teenageengineering/comments/1vhreiy/turns_out_you_can_flash_the_riddim_firmware_onto/).

Statut : **C — rumeur/expérience communautaire à haut risque**.

Risques : appareil bloqué, mémoire ou capacités incompatibles, perte de données, impossibilité de retour, garantie annulée et confusion entre modèle 64 MB et variantes de la gamme EP.

## 3. DFU et récupération

Les outils SysEx identifient des commandes DFU, mais leur présence dans un bundle ne doit pas être interprétée comme une invitation à les utiliser. Une procédure de récupération doit être testée avec du matériel sacrifiable, une alimentation stable, un backup et une méthode de restauration indépendante.

Le Studio ne doit jamais exposer DFU dans un menu utilisateur ordinaire.

## 4. Mods mécaniques

Les recherches communautaires mentionnent surtout :

- remplacement ou amélioration du bouton de fader après les problèmes de premières séries ;
- overlays et stickers de raccourcis ;
- masques ou façades imprimées pour modifier la lisibilité ;
- accessoires de transport et supports ;
- teardown pour comprendre l’écran, les touches et les faders.

Ces modifications sont externes au logiciel. Elles peuvent toutefois inspirer des modes d’affichage, des fiches de raccourcis et une interface de diagnostic.

Références de contexte : [cheatsheet KO II](https://www.spongefile.com/ko-ii-ep-133-cheatsheet/), [discussion teardown](https://news.ycombinator.com/item?id=41176831), [guide officiel hardware overview](https://teenage.engineering/guides/ep-133/hardware-overview).

## 5. Modifications électriques

Aucune modification de tension, batterie, USB, MIDI TRS, écran, mémoire flash ou carte mère ne doit être recommandée sans schéma, mesure et procédure de sécurité électrique. Les images de teardown ne suffisent pas à établir un point de soudure ou une compatibilité.

