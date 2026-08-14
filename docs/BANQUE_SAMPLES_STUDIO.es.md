# Banco de samples de la máquina en Studio

## Selección

El menú `FILE` tiene la opción `OPEN LOCAL BANK`. Selecciona la carpeta creada en:

```text
carpeta-elegida/clone/nombre-de-maquina/
```

El navegador lee `samples/` y `metadata/`, asociando cada PCM con su slot, por ejemplo `samples/324.pcm` y `metadata/324.json`.

Los archivos no se suben al sitio, a un servidor ni a GitHub. Studio recibe permiso temporal del navegador y los lee directamente del disco.

## Reproducción

- con EP-133 conectado: Studio envía notas MIDI a la máquina;
- con EP-133 desconectado: Studio reproduce el PCM local del clon;
- no se duplican los sonidos del ordenador y la máquina;
- el piano-roll aplica la altura MIDI respecto a la nota raíz del pad;
- la velocidad controla la ganancia;
- STOP corta también las fuentes PCM locales activas.

Los samples se decodifican bajo demanda. El formato nativo compatible es PCM con signo de 16 bits little-endian, 46.875 Hz por defecto, mono o estéreo según la metadata.

## Límite del navegador

La carpeta elegida se recuerda entre visitas mediante IndexedDB (`src/core/storage/directoryHandleStore.ts`). Si el permiso sigue vigente se reutiliza al recargar; si el navegador lo revoca aparece un botón RECONNECTAR explícito.

## También desde Sonidos y transferencia

`machineSampleBank.play(slot, …)` se usa también para preescuchar cada fila del banco de máquina, usando el slot y no el pad. Consulta `POINT_SONS_ET_TRANSFERT.md`.
