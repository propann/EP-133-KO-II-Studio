# EP-133 Rhythm Hero

[Français](README.md) · [English](README.en.md) · [Español](README.es.md)

**Aprende, toca, compone y crea copias de seguridad — con o sin un EP-133.**

EP-133 Rhythm Hero es una suite local y de código abierto dedicada al Teenage
Engineering EP-133 K.O. II. Reúne un entrenador de finger drumming, un Studio
con cuatro grupos, una biblioteca de sonidos sin conexión y un sistema de
clonado de la máquina en modo de solo lectura.

> Proyecto comunitario independiente. La escritura en el dispositivo permanece
> desactivada hasta completar las protecciones de copia, confirmación y
> verificación posterior.

## ¿Por qué este proyecto?

El objetivo es hacer más visuales el aprendizaje y la creación: elegir un
ritmo, ver qué pads hay que tocar, interpretarlo en la máquina real, medir los
golpes adelantados o retrasados y convertir las ideas en composiciones
guardadas. La aplicación sigue funcionando con el EP-133 desconectado.

## Funciones

### Rhythm Hero

- 39 estilos rítmicos y cinco niveles de dificultad;
- partitura de varios compases con pads y digitación sugerida;
- Web MIDI, puntuación PERFECT / GOOD / MISS, combo y precisión;
- cuenta atrás, tempo ajustable y sonidos de práctica;
- editor de ejercicios USER con longitud ampliable.

### Studio EP-133

- cuatro grupos A–D y 12 pads por grupo;
- secuenciador ampliable, piano roll KEYS, velocidad y duración;
- reproducción local o salida MIDI hacia la máquina;
- guardado local, biblioteca de proyectos y exportación MIDI/JSON;
- reproducción Song basada en escenas y patrones decodificados.

### Espejo privado de la máquina

- exploración SysEx estrictamente en modo de solo lectura;
- copia local de los 9 proyectos, archivos PCM y metadatos;
- hashes SHA-256, reanudación y escrituras atómicas en disco;
- sincronización incremental e historial de manifiestos;
- reproducción de los samples clonados con el EP-133 desconectado.

La validación con la máquina real del 10 de agosto de 2026 reconoció **9
proyectos y 527 sonidos sin cambios en 30,7 segundos**, sin descargas ni errores.
Los 536 hashes se verificaron de forma independiente.

## Inicio rápido

Requisitos: una versión reciente de Node.js, npm y Chrome/Chromium para Web MIDI.

```bash
git clone https://github.com/propann/ep133-rhythm-hero.git
cd ep133-rhythm-hero
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

El juego, el Studio, Save/Load, la lectura de `.pak/.ppak`, el espejo sin
conexión y el clonado incremental están operativos. Quedan pendientes las
escenas y Song Positions múltiples, la edición avanzada de velocidad/gate, el
inicio automático del servicio local, la preparación de audio y la escritura
segura en el dispositivo.

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
