# Puente local de clonación

## Función

El Studio web no puede lanzar Python directamente. El puente local conecta `LAUNCH COMPLETE CLONE` con el motor de hardware y queda limitado a `127.0.0.1`.

Expone:

- `GET /health`: disponibilidad y carpeta raíz fijada al iniciar;
- `POST /clone/start`: inicio con nombre y capacidad de 64/128 MB;
- `GET /clone/status`: manifiesto, progreso y código de salida.

La ruta de destino nunca llega desde una petición web. Se fija al iniciar el puente, de modo que una página no puede pedir una escritura en otro lugar.

## Inicio actual

```bash
/tmp/ep133-scan-venv/bin/python tools/local_clone_bridge.py \
  --root /home/azoth/Music/EP-133 --port 8765
```

Crea el entorno con `tools/requirements-scanner.txt`, que declara `epsysex`, `mido` y el backend `python-rtmidi` necesario para entradas y salidas MIDI reales.

Vite redirige únicamente `/bridge/*` al servicio local. Si el puente no está disponible, el diálogo conserva el modo de manifiesto local y no afirma haber iniciado un clon completo.

## Pantalla del Studio

Cuando responde el puente, el diálogo muestra su carpeta raíz y el botón pasa a `LAUNCH COMPLETE CLONE`. Después de pulsarlo:

- aparece `CLONING…`;
- una barra muestra fase, contador y porcentaje;
- el tiempo transcurrido y restante se actualizan cada segundo;
- el final muestra el número de errores;
- se distinguen cambios y sonidos sin cambios;
- los detalles completos permanecen en `clone.log` y `manifest.json`.

Si ya existe un clon, el motor usa `incremental`, archiva el manifiesto anterior en `history/` y evita reescribir contenido sin cambios. En el EP-133 sigue siendo estrictamente de solo lectura.

## Límite actual

La segunda pasada desde el botón se validó en hardware real el 10 de agosto de 2026: 30,7 segundos, 9 proyectos y 527 sonidos sin cambios, sin descargas ni errores. El siguiente paso es instalar el puente como servicio de usuario iniciado con la aplicación, con cierre limpio y detección de versión.
