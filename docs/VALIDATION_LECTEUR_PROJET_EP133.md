# Validation du lecteur de projet EP-133

Date : 9 août 2026  
Mode : lecture seule  
Produit : EP-133 K.O. II

## But

Vérifier le décodeur TypeScript sur un TAR synthétique contrôlé, puis sur une
copie réelle du projet 1 obtenue par le protocole FILE en lecture seule.

## Résultat automatisé

La commande `npm run test:exports` construit puis relit :

- un MIDI avec plusieurs groupes, tempo, vélocité et durée ;
- un TAR contenant un pad de 26 octets, un pattern avec une note et une
  automation, un membre `scenes` de 712 octets et un `settings` avec tempo ;
- un conteneur `.ppak` synthétique contenant ce TAR et un son WAV factice.

Tous les champs attendus sont comparés par assertions.

## Résultat sur la machine de test

Le projet 1 a été copié vers un fichier temporaire de 68 096 octets. Le
décodeur a obtenu :

| Élément | Valeur |
|---|---:|
| Membres TAR | 68 |
| Pads | 48 |
| Patterns | 11 |
| Notes | 125 |
| Automations | 0 |
| Scènes définies | 3 |
| Positions de song | 1 |
| Scène courante | 3 |
| Tempo | 120 BPM |
| Avertissements | 0 |

Le fichier temporaire réel n'est pas versionné : il peut contenir des données
personnelles de projet. Aucun son n'a été téléchargé et aucune commande
d'écriture n'a été appelée.

## Garanties actuelles

- Les membres TAR inconnus restent disponibles octet pour octet dans
  `members`.
- Chaque pad et chaque événement décodé conserve aussi son tableau `raw`.
- Les tailles, compteurs, octets de sécurité et plages d'automation incohérents
  produisent un avertissement.
- Le lecteur accepte les pads natifs de 26 octets et signale proprement les
  variantes de 27 octets du Sample Tool.

## Limites

- `fx_settings` et les bases/assignations du fader ne sont pas encore exposés
  dans le modèle éditable.
- Les événements dont le type n'est pas confirmé sont conservés dans le membre
  brut et signalés, mais pas interprétés.
- Le lecteur ne réécrit aucun TAR et ne garantit encore aucun `.ppak` généré.
- L'interface SAVE/LOAD n'utilise pas encore ces fonctions.
