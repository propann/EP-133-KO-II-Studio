# Configuración de Linux

Linux es el ordenador principal para tocar y probar el MIDI del EP-133 K.O. II.

## Instalación única

```bash
sudo apt update
sudo apt install -y git python3 alsa-utils
git clone https://github.com/propann/ep133-ko-ii-studio.git
cd ep133-ko-ii-studio
chmod +x tools/start-linux.sh tools/check-ep133-linux.sh
```

## Iniciar el reproductor

Conecta el K.O. II con un cable USB-C de datos y ejecuta:

```bash
cd ~/ep133-ko-ii-studio
./tools/start-linux.sh
```

El reproductor abre `http://127.0.0.1:8787/docs/ep133-pad-player.html`. Mantén el terminal abierto; `Ctrl+C` lo detiene.

## Comprobar el K.O. II

```bash
./tools/check-ep133-linux.sh
```

El resultado esperado incluye `2367:8020 Teenage Engineering EP-133` por USB y, según el sistema, un puerto MIDI ALSA.

## Función del PC Linux

El PC aloja el reproductor y recibe directamente el MIDI del K.O. II. Aquí se añadirán el mapping real, la precisión y la puntuación. El Raspberry Pi sirve como estación de clase en la red, pero no sustituye al PC mientras el K.O. II esté conectado a él.
