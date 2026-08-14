# Validación — Save/Load del Studio

## Problema corregido

El botón `SAVE` del Studio completo reutilizaba antes el guardado de ejercicios. Solo conservaba el grupo visible y cerraba el editor; no representaba un proyecto real del Studio.

## Funcionamiento actual

- `NEW` prepara un proyecto vacío con los grupos A, B, C y D;
- `SAVE` serializa el proyecto completo en la biblioteca local del navegador;
- un segundo `SAVE` actualiza el proyecto abierto en lugar de crear un duplicado;
- el selector y `OPEN` restauran el proyecto elegido;
- el menú `FILE` reúne New, Open, Save, Save As, Rename, Duplicate, Delete y Export;
- una confirmación protege el proyecto antes de `NEW` u `OPEN` cuando contiene notas;
- el guardado `USER` del editor educativo sigue siendo independiente.

## Datos conservados

El documento musical usa el contrato intermedio `ep.project.v1`. La biblioteca local solo añade un identificador y una fecha de actualización; no crea un formato musical propietario.

Se conservan el nombre y tempo, las notas de los cuatro grupos A–D, la posición a 96 PPQN, pad, altura melódica, velocidad, duración, modos ONE/KEYS/LEGATO e información del pad leída en la máquina cuando está disponible.

## Verificación automática

`npm run test:exports` realiza un ciclo en memoria: genera el documento, lo guarda localmente, lo carga de nuevo y compara tempo, notas, grupos, velocidades, duraciones y modos de pad, incluidas escenas, Song y longitudes nativas por pattern.

## Auditoría del 12 de agosto de 2026 — Save → salir → volver a abrir

Las auditorías externas exigían que un proyecto importado y reabierto fuera idéntico. Se encontró y corrigió un bug real:

**Bug** — `serializePattern` escribía `note: target.note ?? 60` para cada golpe exportado, incluso para un golpe ONE sin altura melódica. Al volver a importarlo, `60` se convertía en una nota real. La segunda reproducción enviaba `midi.sendNote(60, ...)` en vez de `midi.sendPad(...)`, podía transponer el PCM local y hacía que el Arrangeur clasificara el pattern como melódico.

**Corrección** — `note` solo se escribe cuando el golpe realmente la contiene. Los documentos antiguos siguen siendo legibles y los nuevos ya no inventan ese campo.

**Verificado** — dos comprobaciones en `tools/check-project-exports.mjs` cubren la exportación directa y el ciclo mediante `localStorage`.

## Límites restantes

- la interfaz aún no importa archivos `.pak/.ppak` (solo JSON `ep.project.v1`);
- los guardados en `localStorage` necesitan todavía descarga de archivo y copia de seguridad automática;
- aún no hay historial de deshacer/rehacer para escenas y Song (sí existe para la edición de patterns).
