# Estado — Juego y Studio

Fecha: 9 de agosto de 2026.

La aplicación tiene dos secciones principales que comparten audio, MIDI e información de pads, pero responden a necesidades distintas: el juego debe ser inmediato y educativo; Studio puede ser más denso y preciso.

## Rhythm Hero — aprender y tocar

### Lo que funciona

- conexión MIDI sin calibración obligatoria y mapping de notas 36–83;
- juego libre audible fuera del ejercicio;
- cuenta atrás de un compás, preescucha y sesiones reales de puntuación;
- sonidos distintos en los 12 pads, controles modelo/jugador y baja latencia;
- partitura modelo y golpes del jugador superpuestos;
- ventana animada de dos compases y cursor;
- umbrales PERFECT/GOOD/MISS y combo probados;
- 39 estilos y cinco niveles sin acelerar automáticamente el tempo;
- cinco niveles Boom-Bap escritos a mano; los demás aún se generan.

### Zonas frágiles

1. Las notas esperadas no tocadas al final todavía no se convierten en MISS, por lo que la precisión puede ser demasiado generosa.
2. El contenido educativo es desigual: solo Boom-Bap tiene cinco niveles compuestos manualmente.
3. La generación sigue en `App.tsx` y debe pasar a un módulo educativo testeable.
4. `ScoreView` muestra siempre 32 pasos/dos compases; otras firmas necesitarán una vista más flexible.
5. El resumen final aún necesita datos por pad, anticipos/retardos, omisiones y progreso.

La prioridad es contar omisiones y después producir estilos en bloques de cinco niveles sin convertir el juego en un DAW.

## Studio EP-133 — crear y transferir

### Lo que funciona

Cuatro grupos A–D, orden físico de 12 pads, cuadrícula horizontal extensible, modos ONE/KEYS, piano-roll, notas canónicas con posición/pad/altura/velocidad/duración, reproducción en PC y máquina, loop, cursor, reloj MIDI, exportación MIDI, `ep.project.v1`, lectura de `.pak/.ppak` y TAR en solo lectura, y componentes visuales separados.

### Zonas frágiles

La importación de archivos aún necesita conexión con la interfaz; velocidad y duración se conservan pero no se editan gráficamente en todos los lugares; la gestión completa de pools, escenas, Song y deshacer/rehacer sigue evolucionando; parte del estado continúa en `App.tsx`.

El siguiente trabajo seguro es completar el ciclo de archivos antes de añadir gestos de edición profunda.

## Principios originales de partitura

Usa tres niveles: negro para contexto, gris para compás/cuadrícula y naranja solo para cursor, selección o acción inmediata. Una nota seleccionada puede mostrar:

```text
NOTE  C3     VELOCITY  104
GATE  24T    POSITION  01:03:12
```

Mantén el juego simple: dos compases, 12 pistas y superposición modelo/jugador. Los controles detallados de velocidad y gate pertenecen a Studio.
