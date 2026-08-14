# Arquitectura — espejo local del EP-133

## Visión elegida

Sin conexión, la aplicación funciona como un clon de trabajo del EP-133. Con conexión, la máquina es fuente de verdad y superficie de control MIDI. El espejo no significa publicar el banco del fabricante: los datos y audios permanecen privados.

## Primera conexión

El asistente debe identificar la máquina, pedir un nombre local estable, elegir capacidad declarada 64/128 MB, leer la capacidad observable, elegir carpeta de samples, inventariar 999 slots y proyectos, ofrecer aparte la copia privada de audio y crear una instantánea inicial inmutable. Studio lo expone en `FILE → CLONE THE DEVICE` con la ruta obligatoria `carpeta-elegida/clone/nombre-de-maquina/`.

## Tres capas de datos

1. **Base de máquina** — último estado confirmado por lectura: identidad, capacidad, slots, metadata, proyectos, patterns, escenas, Song Positions y ajustes. El editor nunca la modifica directamente.
2. **Copia de trabajo** — estado editable offline. Los samples se resuelven en la carpeta privada del perfil; el audio ausente se señala y puede usar un fallback elegido explícitamente.
3. **Patch** — diferencia determinista entre base y copia: altas, cambios, movimientos, borrados, tamaño, slots afectados, espacio libre y proyectos dependientes.

## Sincronización segura

Una futura sincronización debe releer identidad, detectar cambios desde la instantánea, detenerse ante conflictos, crear un checkpoint recuperable, mostrar el patch y pedir confirmación, serializar escrituras, releer cada elemento, compararlo y solo entonces actualizar la base. La escritura permanece bloqueada hasta probar esta cadena en un proyecto borrador y slots reservados.

## Superficie de control

Se habilitan gradualmente pads, velocidad, grupos y transporte MIDI. Faders, teclas de modo, CC y estados de pantalla requieren capturas reales. No se muestra un LCD ficticio como estado fiable.

## Time Machine y límite web

La cronología con nombre y comparación de metadata existe; restauración local, patch de retorno, restauración de hardware y retención por hashes no están activadas. El navegador puede leer samples y escribir el manifiesto local, pero necesita un puente seguro o una aplicación instalable para el escaneo SysEx completo.
