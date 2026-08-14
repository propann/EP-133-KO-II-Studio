# Modelo de datos del secuenciador

## Longitud nativa de los patterns

El manual EP-133 OS 2.0 confirma que `LN.1` representa un pattern de un compás y que cada grupo acepta hasta `LN.99`. En `ep.project.v1`, cada pattern conserva explícitamente este valor en `bars`; no debe recalcularse solo desde la última nota. Un pattern vacío o deliberadamente más largo sigue teniendo una longitud.

La longitud es independiente para cada pareja grupo/pattern. El proyecto real de validación muestra `A01 = LN.2`, `C01 = LN.1` y `C02 = LN.4`. La duración de una escena sigue al grupo más largo y no debe copiarse arbitrariamente a A, B, C y D.

En el editor, cada compás mide 16 pasos × 60 px: `LN.1`, `LN.2` y `LN.4` miden 960, 1920 y 3840 px antes de desplazarse. La reserva de navegación aparece después de los compases reales y no sustituye la longitud `LN` elegida.

## Por qué existe este modelo

El juego educativo y el Studio compartían antes una forma mínima de objetivo: id, tiempo y pad. Después las exportaciones añadían velocidad y duración fijas. Eso impedía repetir fielmente un MIDI y preparar editores de velocidad, gate y microtiming.

## Nota canónica

`src/core/project/model.ts` define `SequencerNote`:

| Campo | Función |
|---|---|
| `id` | identidad estable del evento |
| `group` | grupo A, B, C o D del EP-133 |
| `beat` | posición en negras, convertible a 96 PPQN |
| `pad` | índice visual 0–11 |
| `note` | altura MIDI opcional para KEYS |
| `velocity` | velocidad MIDI 1–127 |
| `duration` | duración en negras, mínimo un tick a 96 PPQN |

`ProjectPatterns` siempre contiene los cuatro grupos. `emptyProjectPatterns()` es la única fábrica de esta estructura.

## Límites

Studio trabaja con `SequencerNote` de principio a fin. El importador MIDI conserva velocidad y duración; el exportador usa sus valores reales; `ep.project.v1` convierte posición y duración a 96 PPQN. El juego conserva su tipo `Target` porque sus estados HIT/MISS no deben contaminar un proyecto musical.

## Encima de la nota: PatternBank, Scene, Song

`src/core/project/song.ts` añade la composición:

| Tipo | Función |
|---|---|
| `PatternBank` | `SequencerNote[]` de los patterns 01–99 de todos los grupos; una clave indica que existe, aunque esté vacío |
| `SceneDefinition` | un pattern por grupo (o `null` = MUTE) y compás, para las escenas 1–99 |
| `song: number[]` | lista ordenada de Song Positions, cada una con un número de escena |

`patternsForScene(bank, scenes, sceneNumber)` es el único puente hacia `ProjectPatterns`. RhythmGrid, PianoRoll, PadStrip y `createMidiFile` siguen trabajando con una escena plana cada vez. `sceneIsUsed` exporta una escena si al menos un grupo no está en MUTE.

El exportador escribe todos los patterns y escenas usadas; la biblioteca los vuelve a leer en lugar de conservar solo la primera Song Position. Consulta `STRUCTURE_SONG_MODE.md`.

## Compatibilidad y verificación

Los ejercicios antiguos se convierten con velocidad 100 y duración de 0,25 negras. La normalización limita velocidad a 1–127 y duración a 1/96 como mínimo. `npm run test:exports` comprueba los ciclos de velocidad y duración, la conversión a 48 ticks, los valores antiguos y los límites.
