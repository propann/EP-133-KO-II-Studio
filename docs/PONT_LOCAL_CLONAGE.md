# Pont local de clonage

## Rôle

Le Studio web ne peut pas lancer directement Python. Le pont local relie le
bouton `LANCER LE CLONE COMPLET` au moteur matériel en restant limité à
`127.0.0.1`.

Il expose trois opérations :

- `GET /health` : disponibilité et dossier racine fixé au démarrage ;
- `POST /clone/start` : lancement avec nom et capacité 64/128 Mo ;
- `GET /clone/status` : manifeste, progression et code de sortie.

Le chemin cible n'est jamais fourni par une requête web. Il est imposé au
démarrage du pont, ce qui empêche une page de demander une écriture ailleurs.

## Démarrage actuel

```bash
/tmp/ep133-scan-venv/bin/python tools/local_clone_bridge.py \
  --root /home/azoth/Musique/OP-133 --port 8765
```

Vite redirige uniquement `/bridge/*` vers le service local. Si le pont est
absent, la fenêtre conserve le mode manifeste local mais ne prétend pas lancer
le clone complet.

## Affichage dans le Studio

Lorsque le pont répond, la fenêtre affiche son dossier racine et le bouton
devient `LANCER LE CLONE COMPLET`. Après le clic :

- le bouton indique `CLONAGE EN COURS…` ;
- une barre affiche phase, compteur et pourcentage ;
- temps écoulé et estimation restante sont rafraîchis chaque seconde ;
- la fin affiche le nombre d'erreurs ;
- les détails complets restent dans `clone.log` et `manifest.json`.

## Limite actuelle

Le pont est lancé manuellement. La prochaine finition consiste à l'installer
comme service utilisateur démarré avec l'application, avec arrêt propre et
détection de version.
