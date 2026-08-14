# Iniciar localmente

El reproductor es un sitio estático: no necesita base de datos, cuenta ni dependencia JavaScript. Python solo sirve los archivos al navegador.

## Windows — opción sencilla

1. Descarga o clona el repositorio.
2. Haz doble clic en `start-windows.cmd`.
3. Chrome o Edge abre automáticamente `http://127.0.0.1:8787/docs/ep133-pad-player.html`.
4. Cierra la ventana negra pequeña para detener el servidor.

`127.0.0.1` es importante: cuando se añade MIDI, Chrome/Edge permiten la API MIDI en esta dirección local.

## Raspberry Pi — servidor local de entrenamiento

```bash
git clone https://github.com/propann/ep133-ko-ii-studio.git
cd ep133-ko-ii-studio
chmod +x tools/start-pi-local.sh
./tools/start-pi-local.sh
```

Desde otro dispositivo de la misma red Wi-Fi, abre `http://IP_DEL_PI:8787/docs/ep133-pad-player.html`. Para conocer la dirección usa `hostname -I`.

El Pi sirve para clases, partitura y sonidos de referencia en la red local. Para analizar el USB-MIDI del K.O. II, la primera prueba debe hacerse en el PC conectado físicamente a la máquina mediante `localhost`.

## Comprobación rápida

- elige un nivel;
- elige de 1 a 4 compases;
- inicia la reproducción;
- toca los pads mostrados;
- comprueba que la partitura del jugador aparece en ámbar.

## Estado técnico verificado

| Elemento | Estado |
|---|---|
| Reproductor HTML independiente | OK |
| 39 ejercicios y niveles | OK |
| Compases 1 a 4 y variaciones | OK |
| Partitura del jugador en pantalla | OK |
| Sonido guía y VU-metro | OK |
| USB-MIDI real / puntuación precisa | Pendiente de probar en el K.O. II |

El servidor local no convierte el proyecto en un servicio alojado; evita restricciones del navegador y prepara el MIDI local.
