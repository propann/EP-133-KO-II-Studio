# Service hébergé et payant — document d'options

> Document de préparation, pas un plan validé. Créé le 13 août 2026 à la
> demande de l'utilisateur : « on prépare le job, on active quand l'outil
> est satisfaisant ». Rien ici n'est implémenté ni décidé dans le détail —
> c'est un cadrage pour que la prochaine conversation à ce sujet parte
> d'options claires plutôt que d'une page blanche. Le périmètre exact
> (qu'est-ce qui devient payant) est explicitement **non tranché** — voir
> [Décision à prendre](#décision-à-prendre-avant-tout-code) plus bas.

## Le point qui change tout : le matériel reste local

Le Studio parle en MIDI/SysEx directement au navigateur (Web MIDI) et, pour
l'écriture réelle, via `tools/local_clone_bridge.py` sur la machine de
l'utilisateur (voir [Pont local de clonage](PONT_LOCAL_CLONAGE.md)). Un
serveur hébergé — même payant — **ne peut pas accéder à l'EP-133 de
quelqu'un d'autre** : le port USB de l'utilisateur est branché à son
ordinateur, pas au serveur qui exécute le service. Ce n'est pas une
limite technique contournable, c'est la nature du MIDI/USB.

Conséquence directe : ce document ne peut pas répondre seul à « qu'est-ce
qui est payant ? » — ça dépend de ce que le service hébergé fait
réellement, ce qui reste à décider avec l'utilisateur (voir plus bas).

## Trois formes possibles, pas mutuellement exclusives

### A. Studio complet hébergé, pont local toujours nécessaire pour la machine

Le service payant donne accès à une instance en ligne du Studio (édition,
bibliothèque de projets, Rhythm Hero) — utilisable sans rien installer.
Pour parler à une vraie machine, l'abonné lance quand même
`local_clone_bridge.py` sur son propre ordinateur (le Studio en ligne s'y
connecterait comme le fait aujourd'hui le Studio local, via une adresse
que l'utilisateur configure — pas une découverte automatique à travers
Internet, qui poserait ses propres problèmes de sécurité réseau).

- **Avantage** : le plus proche de « payer pour l'outil », marché large
  (même sans EP-133 branché à ce moment précis).
  **Inconvénient** : nécessite un vrai backend + stockage de projets par
  utilisateur — le plus gros chantier des trois.

### B. Le logiciel de base reste gratuit et local, seule l'écriture matérielle est payante

Le Studio continue de tourner exactement comme aujourd'hui (gratuit, local,
open source) pour tout le monde. Seul le **pont d'écriture réelle**
(upload de son, réaffectation de pad, transfert de projet — la partie
qui touche vraiment le matériel) demande un compte et un abonnement actif
pour se débloquer.

- **Avantage** : chantier plus petit (pas de backend de projets à
  construire, juste vérifier un statut d'abonnement avant d'autoriser une
  écriture), cohérent avec l'esprit actuel du dépôt (gratuit et local par
  défaut).
  **Inconvénient** : paie-t-on vraiment pour un bouton, une fois que le
  reste est gratuit ? Discutable comme proposition de valeur.

### C. Le logiciel reste gratuit, seul le stockage cloud des projets est payant

Rien ne change dans le fonctionnement local. L'abonnement ne paie qu'une
synchronisation de la bibliothèque de projets entre plusieurs ordinateurs
(un peu comme un Dropbox dédié aux projets EP-133).

- **Avantage** : chantier le plus simple, le plus proche d'un service
  SaaS classique et bien compris (stockage + sync).
  **Inconvénient** : proposition de valeur plus modeste, marché plus
  restreint (seulement ceux qui travaillent depuis plusieurs machines).

## Décision à prendre avant tout code

L'utilisateur a choisi « pas encore décidé » pour le périmètre — cette
section reste donc une liste de questions ouvertes, pas des réponses :

- Est-ce qu'on mélange A/B/C (ex. Studio hébergé **et** écriture
  matérielle payante ensemble), ou un seul des trois pour commencer ?
- Le service gratuit/local actuel reste-t-il **entièrement** intact quoi
  qu'il arrive (c'est la promesse actuelle du README) ?
- Palier unique à ~2 €/mois, ou plusieurs paliers ?

## Comptes et paiement — principes de sécurité (valables quelle que soit l'option choisie)

L'utilisateur a insisté : « un compte sécurisé proprement pour pas
répandre les PayPal ». Le principe qui rend ça possible avant même
d'écrire une ligne de code : **ne jamais faire transiter ni stocker de
données de paiement par notre propre serveur.**

- **Paiement récurrent via PayPal Subscriptions** (pas les boutons de don
  simples) : PayPal héberge tout le flux de paiement (identifiants,
  moyens de paiement) sur ses propres pages. Notre backend ne reçoit
  jamais de numéro de carte ni d'identifiants PayPal — seulement un
  `subscriptionID` opaque renvoyé par PayPal après confirmation, et des
  notifications de statut via **webhook**.
- **Webhooks vérifiés, jamais fait confiance à un appel non signé** :
  chaque notification PayPal (paiement réussi, échoué, abonnement
  annulé) doit être vérifiée avec la signature fournie par l'API
  `/v1/notifications/verify-webhook-signature` de PayPal avant d'être
  traitée — sinon n'importe qui peut appeler l'endpoint et prétendre
  qu'un abonnement est payé.
- **Ce qu'on stocke côté serveur, et rien de plus** : identifiant de
  compte, e-mail (pour retrouver le compte et communiquer),
  `subscriptionID` PayPal, statut (`actif`/`impayé`/`annulé`), date de
  dernier paiement confirmé. Jamais de numéro de carte, jamais
  d'identifiants PayPal de l'utilisateur.
- **Comptes** : mot de passe jamais stocké en clair (hash + sel,
  bibliothèque éprouvée type `argon2`/`bcrypt` — jamais un algorithme
  maison), sessions via cookie `httpOnly`+`secure`, limite de tentatives
  de connexion, e-mail de vérification avant activation. Authentification
  par lien magique (sans mot de passe du tout) reste une option plus
  simple à sécuriser correctement si le nombre de comptes reste modeste —
  à évaluer plutôt que du mot de passe classique par défaut.
- **Secrets** : clés API PayPal (sandbox puis production) en variables
  d'environnement Coolify, jamais commitées, jamais dans les logs.
  Environnement sandbox et production strictement séparés (comptes PayPal
  différents), pour ne jamais tester avec de l'argent réel par erreur.
- **RGPD** : utilisateurs européens probables (produit francophone,
  matériel Teenage Engineering) — droit à l'export et à la suppression du
  compte à prévoir dès la conception, pas ajouté après coup.

## Ce qui manque aujourd'hui pour n'importe laquelle des trois options

Le dépôt actuel est un frontend statique (`vite build` → fichiers servis
par Nginx dans le `Dockerfile` existant) sans aucun backend. Un service à
comptes payants a besoin, au minimum :

- un petit service API (routes compte, session, statut d'abonnement,
  webhook PayPal) — Node/Express ou Fastify serait cohérent avec le reste
  du dépôt (déjà TypeScript partout) ;
- une base de données pour les comptes et abonnements (SQLite suffit pour
  démarrer vu le volume attendu, migrable vers Postgres si besoin) ;
- un point de bascule net entre le Studio gratuit actuel (aucune
  régression, continue de fonctionner sans compte) et les fonctions
  gagnées par un abonnement actif.

## Déploiement Coolify

Le `Dockerfile` actuel ne sert que le frontend. Un backend ajouterait un
second service Coolify (même dépôt, `Dockerfile` séparé ou multi-stage),
avec ses propres variables d'environnement (clés PayPal, secret de
session, chemin de la base de données) réglées dans Coolify — jamais dans
le dépôt. Le guide existant
([Déploiement Coolify](DEPLOIEMENT_COOLIFY.md)) documente déjà le service
frontend statique ; il faudra un guide compagnon pour le backend le jour
où le périmètre sera tranché.

## La page de présentation

La page de présentation Artifact créée le 13 août (captures d'écran
réelles du Studio) est explicitement gardée comme future page d'entrée
du service, telle quelle — pas de changement nécessaire pour l'instant.
Le jour où le périmètre est décidé, elle gagnera un bloc tarifs/CTA vers
l'inscription, sans avoir besoin d'être refaite depuis zéro.

## Statut

Rien n'est implémenté. Rien n'est activé. Ce document existe pour que la
prochaine conversation sur le sujet commence par « on choisit entre A/B/C »
plutôt que par une nouvelle exploration à froid. Voir aussi
[ROADMAP.md](ROADMAP.md), Phase 8.
