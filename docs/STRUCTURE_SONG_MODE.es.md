# Estructura de la canción — modo Song del EP-133

## Fuente funcional

La sección 6.2 del manual OS 2.0 describe cuatro niveles:

1. un **proyecto** es la canción;
2. cada grupo A–D tiene **patterns**, numerados del 01 al 99;
3. una **escena** selecciona un pattern para cada grupo;
4. una **Song Position** coloca una escena en el orden de la canción.

Una Song Position dura lo mismo que el pattern más largo de su escena. Una lista puede contener hasta 99 posiciones. Esta regla guía nuestra interfaz, no una reproducción de la ilustración del manual.

## Modelo real del Studio

El Studio conserva toda la jerarquía:

- `PatternBank` (`src/core/project/song.ts`) guarda todos los patterns 01–99 de cada grupo. Los huecos son legales y se conservan.
- `SceneDefinition[]` guarda todas las escenas S.01–S.99; cada una elige un pattern por grupo o `null` (`MUTE`, o `0` en la máquina).
- `song: number[]` guarda la lista completa L.01–L.99 y el orden cronológico. Una escena es un recurso compartido: modificarla desde una de las posiciones también cambia las demás que la usan.

Las vistas se cambian con `[ EDIT PATTERN ] / [ ARRANGEMENT ]`:

- **Pattern Editor**: la cuadrícula existente y un selector `PATTERN: [ A01 ▲▼ ]` para elegir el número de pattern del grupo activo.
- **Song Arranger** (`SongArranger.tsx`): un storyboard horizontal con una tarjeta por Song Position y cuatro bloques de grupo. `[DUP]` crea una escena independiente; `[DELETE]` elimina la posición sin borrar una escena usada en otro lugar. Arrastrar y soltar reordena las posiciones y asigna patterns.

Los colores A/B/C/D del Arrangeur son una convención visual del Studio, no un hecho de hardware confirmado.

## Limitación asumida

La reproducción sigue limitada a una escena cada vez: `▶` reproduce la escena en un bucle simple. El avance automático entre Song Positions durante la reproducción completa **todavía no está implementado**; requeriría una reforma más amplia del transporte. El modelo de datos sí está completo y se importa y exporta fielmente.

El PDF oficial y sus ilustraciones no se redistribuyen. Solo se reutilizan conceptos funcionales y referencias de la máquina.
