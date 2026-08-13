# Déploiement Coolify

## Périmètre

Le conteneur héberge l'interface web statique du Studio. Il ne peut pas accéder
à l'USB, à ALSA, à PipeWire ou à un EP-133 branché sur l'ordinateur d'un
utilisateur. Le MIDI navigateur fonctionne uniquement si l'EP-133 est branché
sur la machine qui ouvre le site et si le navigateur autorise MIDI + SysEx.

Le clonage matériel et le pont `/bridge` restent donc des fonctions locales.
La version hébergée doit les présenter comme indisponibles ou demander
l'installation du pont local ; elle ne doit jamais simuler une connexion.

## Création de la ressource

Dans Coolify :

1. créer une ressource **Application** depuis le dépôt Git ;
2. choisir **Dockerfile** comme méthode de build ;
3. laisser le chemin du Dockerfile à `Dockerfile` ;
4. définir le port exposé sur `80` ;
5. choisir un domaine et activer HTTPS ;
6. déployer depuis `main`.

Le healthcheck est disponible sur `/healthz` et renvoie `ok`.

## Vérification locale du conteneur

```bash
docker build -t ep133-ko-ii-studio .
docker run --rm -p 8080:80 ep133-ko-ii-studio
curl http://127.0.0.1:8080/healthz
```

Le site est ensuite disponible sur `http://127.0.0.1:8080/`.

## Version Node

Le projet cible Node.js 22. Le fichier `.nvmrc`, la CI et l'image Docker
utilisent cette version afin que les tests TypeScript soient identiques en
local et en déploiement.

## Suite commerciale

Cette image ne contient aucun compte, paiement ni donnée utilisateur. Avant une
offre payante, ajouter séparément un backend d'authentification, une base de
données, une gestion d'abonnement et une politique de confidentialité. Les
projets et les samples doivent rester locaux par défaut tant que leur modèle de
stockage et leurs droits ne sont pas explicitement définis.

Cette piste est volontairement différée : le déploiement Docker sert d'abord à
disposer d'une version professionnelle, partageable et reproductible du
produit. La décision de transformer le Studio en service intervient après la
stabilisation du cœur métier.
