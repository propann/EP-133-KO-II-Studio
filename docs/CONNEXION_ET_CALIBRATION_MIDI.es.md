# Conexión y calibración MIDI del EP-133

Esta guía comprueba qué envía realmente el EP-133 y asigna sus pads al juego sin suponer sus notas MIDI.

## Requisitos

- EP-133 K.O. II conectado directamente por USB;
- Chrome o Chromium reciente;
- aplicación abierta en `http://localhost:5173/`;
- servidor local iniciado con `npm run dev -- --host 0.0.0.0`.

Web MIDI necesita permiso del navegador. Para la primera prueba de hardware usa `localhost` en el ordenador conectado físicamente al EP-133.

## Comprobar la conexión

1. Enciende el EP-133 y espera a que termine de arrancar.
2. Recarga la página después de conectar el cable USB.
3. Pulsa **MIDI Connection** arriba a la derecha.
4. Acepta el permiso del navegador.
5. Toca un pad de la máquina.

La aplicación abre cada entrada MIDI antes de instalar su escucha. El botón debe mostrar `Connected: EP-133 MIDI 1`. El panel de diagnóstico muestra entrada, canal, nota y velocidad aunque el pad aún no esté asignado al juego.

## Solución de «NOT CONNECTED» persistente

Chrome necesita dos permisos separados para `requestMIDIAccess({ sysex: true })`: MIDI básico y SysEx completo. Ambos deben estar autorizados. Comprueba el icono de permisos de Chrome y confirma **Full MIDI (SysEx)**, no solo MIDI. Si se denegó antes, restablece el permiso y vuelve a cargar la página. `chrome://settings/content/midiDevices` permite comprobar que el origen usado no está bloqueado.

## Asignación automática de los 12 pads

La cuadrícula conserva la disposición física de cuatro filas de tres pads, también en pantallas estrechas. No hace falta calibración manual: A `36–47`, B `48–59`, C `60–71`, D `72–83`, en el orden `7 8 9 / 4 5 6 / 1 2 3 / . 0 ENTER`.

## Probar el juego

1. termina la calibración;
2. pulsa **Start session**;
3. toca siguiendo el ritmo;
4. comprueba PERFECT, GOOD, MISS y COMBO;
5. detén la sesión antes de cambiar la asignación.

## Enrutamiento de audio

El EP-133 se usa solo como entrada MIDI y no recibe mensajes MIDI OUT. El navegador produce metrónomo y sonidos; la velocidad entrante modula el volumen del ordenador. **PLAY** comienza con un compás de cuenta atrás y durante el juego la partitura modelo suena más baja que los golpes del jugador.

## Diagnóstico rápido

Si no aparece ninguna entrada, prueba otro cable de datos, evita hubs USB, cierra otros programas MIDI y reconecta. Si el puerto aparece pero no llegan golpes, comprueba la transmisión MIDI del EP-133 y registra navegador, versión, sistema y error de desarrollo. Si llegan golpes pero no cambia la puntuación, inicia la sesión y comprueba canal y nota bajo el pad.

## Banco MACHINE TEST

La página **MACHINE TEST** permite configurar un control con el siguiente mensaje recibido y probar después los controles asociados. Escucha todas las entradas y canales; Studio y juego siguen filtrados a puertos EP-133 para excluir `Midi Through`.

La selección A–D usa el protocolo SysEx FILE y solo modifica la metadata `active` del grupo con relectura obligatoria. No modifica archivos de proyecto, patterns, samples ni asignaciones. La recepción exhaustiva de controles, la ida y vuelta A–D y la ausencia de cambios de contenido siguen pendientes de validación en un EP-133 real.

Un build o una prueba de navegador no constituyen validación de hardware.
