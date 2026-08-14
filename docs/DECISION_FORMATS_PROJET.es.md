# Decisión — formatos de proyecto

Fecha: 9 de agosto de 2026  
Estado: adoptada

## Decisión

El proyecto no creará un formato propietario de composición para Rhythm Hero. Los archivos ofrecidos al usuario pertenecerán al ecosistema EP-133 o usarán MIDI estándar.

## Formatos elegidos

### `.ppak` y `.pak`

Formatos de guardado y transferencia de la máquina. Hay que cargar un archivo existente como base antes de modificarlo para conservar campos desconocidos.

### `.mid`

Formato de intercambio de notas, tempos y duraciones con DAW. No contiene samples ni todos los ajustes propios del EP-133.

### `ep.project.v1.json`

Descripción técnica legible aceptada por el compilador open source `ep-series-sysex`. Es una representación intermedia para editar, probar y compilar, no un formato musical competidor.

## Menú FILE previsto

- abrir un guardado `.pak/.ppak`;
- importar `.mid`;
- guardar una copia `.ppak`;
- exportar MIDI;
- exportar JSON técnico para diagnóstico avanzado;
- enviar a un proyecto borrador después de checkpoint y confirmación.

## Consecuencias

Los ejercicios se pueden convertir a MIDI y a proyectos EP-133. La información pedagógica permanece en el catálogo interno. Ningún `.ppak` se anuncia como válido antes de compilarlo, revisarlo y probarlo en un slot guardado.

## Estado del lector

`src/core/project/importers.ts` admite MIDI 0 y 1, tempo, notas, velocidades y duraciones, valida `ep.project.v1` e inspecciona sin destruir `.pak/.ppak`, `meta.json`, proyectos TAR y sonidos WAV. También decodifica en solo lectura pads, notas, automatizaciones, escenas, Song y tempo, conservando miembros y campos originales. La conexión con SAVE permanece separada para probar primero el transporte y el ciclo de vida de archivos.
