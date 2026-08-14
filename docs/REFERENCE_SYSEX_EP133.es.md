# Referencia técnica del EP-133 — MIDI, SysEx y samples

> Documento de trabajo basado en validaciones con un EP-133 real, código local del Studio y proyectos comunitarios públicos. No sustituye la validación en hardware. Las escrituras permanecen desactivadas hasta verificar checkpoint, relectura y recuperación.

## Fuentes estudiadas

Se revisaron [EP-133 Sample Tool](https://github.com/garrettjwilke/ep_133_sample_tool), [EP-133 MIDI SysEx Thingy](https://github.com/garrettjwilke/ep_133_sysex_thingy), el fork [pbarilla/ep_133_sample_tool](https://github.com/pbarilla/ep_133_sample_tool), [kmorrill/ep-series-sysex](https://github.com/kmorrill/ep-series-sysex) e [icherniukh/ep133-krate](https://github.com/icherniukh/ep133-krate). Este último confirma de forma independiente PCM little-endian con signo empaquetado en **Packed7**.

Los repositorios comunitarios son referencias de observación, no garantías de compatibilidad con todos los firmwares. Sus archivos `.syx` pueden modificar o borrar contenido.

## Detección e identificación

La petición MIDI Identity universal es:

```text
F0 7E 7F 06 01 F7
```

La respuesta estándar comienza por `F0 7E 7F 06 02 ... F7`. Después se emparejan entrada y salida y se envía un saludo propietario. El navegador puede exigir un gesto de usuario para `requestMIDIAccess`. Studio filtra los puertos cuyo nombre contiene `EP-133` para no enviar notas a `Midi Through`.

Los mensajes Teenage Engineering observados suelen usar `F0 00 20 76 33 40 ... F7`: `F0` inicia SysEx, `00 20 76` identifica al fabricante, `33` la familia EP-133, `40` el protocolo del Sample Tool y `F7` termina el mensaje. FILE usa la misma familia, un id de petición de dos bytes y el comando `05`.

## Transporte y codificación

Los datos binarios se empaquetan en grupos de siete bytes: un byte de flags conserva los bits 7 originales y los siete valores se envían con el bit 7 retirado. Studio ya dispone de `pack7` y `unpack7`. Los ids de petición permiten asociar respuestas; las transferencias pueden tener respuestas intermedias y necesitan un timeout largo.

Los SysEx espontáneos no tienen id de petición. Esto importa para los botones físicos A–D: la notificación debe cambiar el grupo React local sin reenviarse. El mapping debe comprobar prefijo TE, tipo de evento, proyecto activo y valor `active` releído; no basta con adivinar un byte.

## Comandos observados

La inicialización FILE suscribe eventos después de MIDI Identity y no debe enviarse hasta que el usuario inicie un diagnóstico. `GREET` (`1`) solicita metadata, `ECHO` (`2`) prueba el trayecto, `DFU` (`3`) controla el bootloader y es peligroso, y `127` agrupa comandos específicos. DFU debe permanecer fuera de la interfaz.

Para un proyecto con fid `P`: `projects = 2000`, `groups = P + 100`, A = `P + 200`, B = `P + 300`, C = `P + 400` y D = `P + 500`. La selección actual lee `active`, escribe la metadata del grupo y vuelve a leerla. Es la única escritura de metadata conectada; no modifica patterns, samples, archivos ni campos desconocidos.
