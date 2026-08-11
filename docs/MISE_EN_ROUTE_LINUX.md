# Mise en route Linux

Linux devient la machine principale pour jouer et tester le MIDI du EP-133 K.O. II.

## Installation unique

```bash
sudo apt update
sudo apt install -y git python3 alsa-utils
git clone https://github.com/propann/ep133-ko-ii-studio.git
cd ep133-ko-ii-studio
chmod +x tools/start-linux.sh tools/check-ep133-linux.sh
```

## Lancer le player

Brancher le K.O. II avec un câble USB-C de données, puis :

```bash
cd ~/ep133-ko-ii-studio
./tools/start-linux.sh
```

Le player ouvre `http://127.0.0.1:8787/docs/ep133-pad-player.html` dans le navigateur. Conserver le terminal ouvert ; `Ctrl+C` l'arrête.

## Vérifier le K.O. II

```bash
./tools/check-ep133-linux.sh
```

Résultat attendu : une ligne USB `2367:8020 Teenage Engineering EP-133` et, selon le système, un port ALSA MIDI.

## Rôle du PC Linux

Le PC Linux héberge le player et reçoit directement le MIDI du K.O. II. C'est ici que seront ajoutés le mapping réel, la précision et le score.

Le Raspberry Pi reste utile comme borne de cours sur le réseau, mais il ne remplace pas le PC tant que le K.O. II est connecté au PC.
