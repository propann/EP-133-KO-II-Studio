# Configuración de Windows

## Objetivo

Conectar el EP-133 K.O. II al PC y preparar el registro del mapping MIDI real.

## Hardware

- EP-133 K.O. II encendido;
- cable USB-C de datos;
- Chrome o Edge reciente;
- un puerto USB directo del PC cuando sea posible.

## Comprobación

1. Conecta el K.O. II.
2. Abre el reproductor en Chrome o Edge.
3. Comprueba en el Administrador de dispositivos de Windows que aparece el dispositivo de audio/MIDI de Teenage Engineering.
4. En la futura versión MIDI del reproductor, selecciona el puerto EP-133.

## Registro antes de puntuar

Toca lentamente cada pad del grupo A y anota etiqueta, nota MIDI recibida, velocidad, canal y comportamiento al soltar. Repite con B, C y D. El resultado se convertirá en `docs/MAPPING_MIDI_EP133.md`.

## Si no aparece la máquina

- prueba otro cable USB-C de datos;
- evita hubs USB sin alimentación;
- reinicia el navegador después de conectar;
- comprueba los ajustes MIDI del K.O. II.
