# Clon completo de la máquina

## Definición

Un clon completo contiene los nueve proyectos como archivos TAR originales, todos los slots de audio ocupados como PCM, metadata de cada slot, un hash SHA-256 para cada proyecto y sample, un manifiesto global con estado, errores y resumen, y el nombre y capacidad declarada de 64/128 MB. Un inventario JSON no es un «clon completo».

## Motor disponible

`tools/clone_ep133_readonly.py` copia estos datos sin escribir en la máquina. Recibe una carpeta de destino explícita y crea:

```text
carpeta-elegida/
└── clone/
    └── nombre-de-maquina/
        ├── manifest.json
        ├── clone.log
        ├── history/manifest-<fecha>.json
        ├── projects/P01.tar … P09.tar
        ├── samples/001.pcm …
        └── metadata/001.json …
```

La carpeta `clone` se crea si no existe y se reutiliza sin borrar nada. Cada máquina tiene su propio subdirectorio normalizado. Los archivos se escriben atómicamente; el manifiesto anterior se archiva en `history/` y los errores aislados no invalidan los datos ya copiados.

La sincronización conserva proyectos cuyo hash coincide y PCM cuyo tamaño y hash local coinciden. La metadata ligera se relee en cada pasada. El resumen separa proyectos modificados, sonidos nuevos o modificados, sonidos sin cambios y slots desaparecidos. Si la máquina no ofrece checksum PCM remoto, un reemplazo con el mismo tamaño y metadata solo puede detectarse descargándolo de nuevo; los slots desaparecidos no se borran automáticamente.

## Duración y progreso

El primer clon real de 527 sonidos duró **25 minutos y 20 segundos**. Anuncia entre **20 y 30 minutos** para la primera copia. El manifiesto muestra fase, contador, tiempo transcurrido, estimación y errores. Una reanudación suele ser más rápida porque no vuelve a descargar PCM ya validado.

### Validación de hardware — 9 de agosto de 2026

- estado final: `complete`;
- 9 proyectos en disco;
- 527 PCM, 56.214.010 bytes;
- 527 archivos de metadata;
- sin errores;
- aproximadamente 58 MB en total;
- destino: `Música/EP-133/clone/MI-EP-133/`.

```bash
/tmp/ep133-scan-venv/bin/python tools/clone_ep133_readonly.py \
  --out "/ruta/elegida" --name "MI EP-133" --capacity-mb 64
```

## Integración con Studio

`FILE → CLONE THE DEVICE` usa el puente HTTP local descrito en `PONT_LOCAL_CLONAGE.md`. El puente fija la carpeta principal al iniciar, escucha solo en `127.0.0.1`, lanza Python y expone el progreso sin permitir que la página elija otra ruta.

El clon completo y la sincronización incremental están validados en la máquina real: 30,7 segundos para reconocer 9 proyectos y 527 sonidos sin cambios, sin descargas ni errores. Los 536 hashes y las 527 metadatas se comprobaron después de forma independiente.

## Preparación de Time Machine

El clon inicial es el primer checkpoint. Las instantáneas siguientes reutilizarán archivos con hash sin cambios y guardarán solo contenido nuevo. Restaurar la máquina será una operación separada con diff, checkpoint adicional, confirmación y relectura.
