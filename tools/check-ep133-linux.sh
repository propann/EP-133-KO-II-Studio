#!/usr/bin/env bash
set -u

echo "=== EP-133 USB ==="
if lsusb -d 2367:8020 2>/dev/null; then
  echo "EP-133 détecté sur USB."
else
  echo "EP-133 non détecté : vérifier le câble USB-C de données et le port."
fi

echo
echo "=== Ports ALSA MIDI ==="
if command -v aconnect >/dev/null 2>&1; then
  aconnect -l || true
else
  echo "aconnect absent : sudo apt install alsa-utils"
fi

echo
echo "=== Audio ==="
if command -v wpctl >/dev/null 2>&1; then
  wpctl status | grep -i -C 3 -E "EP-133|Teenage" || echo "Aucune entrée EP-133 dans PipeWire."
else
  echo "wpctl absent : vérification PipeWire ignorée."
fi

echo
echo "Ce contrôle confirme la présence matérielle. Le mapping des notes MIDI reste à relever dans la prochaine brique du player."
