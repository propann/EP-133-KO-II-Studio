# EP-133 KO II Studio

[Français](README.md) · [English](README.en.md) · [Español](README.es.md)

**El estudio complementario de código abierto para el EP-133 K.O. II.**

EP-133 KO II Studio clona proyectos y sonidos, abre patterns reales, construye
escenas y Songs, trabaja sin conexión y prepara cambios verificados para el
hardware. Todo permanece local, inspeccionable y sin cuenta.

> **Máquina → Studio → creación → máquina.** El proyecto va más allá de mover
> samples: entiende y transforma la música guardada dentro del EP-133.

> Proyecto comunitario independiente. La lectura, la reproducción MIDI y la
> selección activa A–D están disponibles; las escrituras persistentes de
> proyectos o samples siguen bloqueadas hasta validar copia, confirmación y
> verificación posterior.

## Qué permite el Studio

- clonar los 9 proyectos, samples PCM, metadatos, hashes e historial incremental;
- leer `.pak/.ppak`, patterns, escenas, Songs, pads y tempo reales;
- editar patterns, notas KEYS, bancos, escenas y Song Positions;
- usar el EP-133, los samples clonados o el motor de audio interno;
- preparar escrituras protegidas y diagnosticar MIDI/SysEx.

## Funciones

### Pattern & Song Studio

- cuatro grupos A–D y 12 pads por grupo;
- secuenciador ampliable, piano roll KEYS, velocidad y duración;
- reproducción local o salida MIDI hacia la máquina;
- guardado local, biblioteca de proyectos y exportación MIDI/JSON;
- reproducción Song basada en escenas y patrones decodificados.

### Clon y biblioteca sonora

- exploración SysEx estrictamente en modo de solo lectura;
- copia local de los 9 proyectos, archivos PCM y metadatos;
- hashes SHA-256, reanudación y escrituras atómicas en disco;
- sincronización incremental e historial de manifiestos;
- reproducción de los samples clonados con el EP-133 desconectado.

La validación con la máquina real del 10 de agosto de 2026 reconoció **9
proyectos y 527 sonidos sin cambios en 30,7 segundos**, sin descargas ni errores.
Los 536 hashes se verificaron de forma independiente.

### Rhythm Hero — módulo incluido

El entrenador original permanece como herramienta secundaria: 39 estilos,
cinco niveles, partitura animada, puntuación y pads reales.

## Inicio rápido

Requisitos: una versión reciente de Node.js, npm y Chrome/Chromium para Web MIDI.

```bash
git clone https://github.com/propann/ep133-ko-ii-studio.git
cd ep133-ko-ii-studio
npm ci
npm run dev
```

Abre la dirección mostrada por Vite, normalmente `http://localhost:5173/`.

```bash
npm test
npm run build
```

Para explorar y clonar el hardware, consulta la guía en francés del
[puente local de clonado](docs/PONT_LOCAL_CLONAGE.md). El reproductor histórico
independiente permanece en `docs/ep133-pad-player.html` durante la migración de
sus ejercicios.

## Estado del proyecto

El Studio, Save/Load, la lectura de `.pak/.ppak`, el espejo sin
conexión, el clonado incremental y la jerarquía completa Patrones/Escenas/Song
(vistas Pattern Editor y Song Arranger) están operativos. Quedan pendientes el
avance automático de una Song Position a la siguiente durante la reproducción,
la edición avanzada de velocidad/gate, el inicio automático del servicio
local, la preparación de audio y la escritura segura en el dispositivo.

- [Estado detallado — francés](docs/ETAT_DU_PROJET.md)
- [Hoja de ruta — francés](docs/ROADMAP.md)
- [Registro de implementación — francés](docs/SUIVI_IMPLEMENTATION.md)
- [Arquitectura — francés](docs/ARCHITECTURE.md)
- [Validación del clon real — francés](docs/VALIDATION_CLONE_REEL.md)
- [Contexto y decisiones — francés](PROJECT_CONTEXT.md)

## Organización del repositorio

- `src/` — aplicación React, audio, MIDI, puntuación y proyectos;
- `public/` — ejercicios, datos públicos y fuentes MIDI;
- `docs/` — arquitectura, validaciones y guías;
- `exercises/` — recorrido pedagógico y catálogo;
- `handbook/` — atlas de finger drumming;
- `tools/` — escáneres, clonador, puente local y verificaciones.

## Seguridad y datos

- solo lectura por defecto para las operaciones SysEx;
- ningún sample propietario se guarda en Git;
- los clones permanecen en una carpeta privada elegida por el usuario;
- no hay eliminación ni restauración automática del dispositivo;
- los formatos y campos desconocidos se conservan, nunca se inventan.

## Licencia

El código del proyecto utiliza la licencia MIT, salvo indicación distinta de
alguna dependencia.

Teenage Engineering, EP-133 y K.O. II son marcas de sus respectivos
propietarios. Este proyecto no está afiliado ni respaldado por Teenage
Engineering.
