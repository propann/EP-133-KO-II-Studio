# Validación del lector de proyectos EP-133

Fecha: 9 de agosto de 2026  
Modo: solo lectura  
Producto: EP-133 K.O. II

## Objetivo

Verificar el decodificador TypeScript con un TAR sintético controlado y después con una copia real del proyecto 1 obtenida mediante el protocolo FILE de solo lectura.

## Resultado automático

`npm run test:exports` construye y relee un MIDI con varios grupos, tempo, velocidad y duración; un TAR con pad de 26 bytes, pattern con nota y automatización, miembro `scenes` de 712 bytes y tempo en `settings`; y un `.ppak` sintético con ese TAR y un WAV de prueba. Todas las expectativas se comparan con assertions.

## Resultado en la máquina de prueba

El proyecto 1 se copió a un archivo temporal de 68.096 bytes. El decodificador obtuvo:

| Elemento | Valor |
|---|---:|
| Miembros TAR | 68 |
| Pads | 48 |
| Patterns | 11 |
| Notas | 125 |
| Automatizaciones | 0 |
| Escenas definidas | 3 |
| Song Positions | 1 |
| Escena actual | 3 |
| Tempo | 120 BPM |
| Avisos | 0 |

El archivo temporal no se versiona porque puede contener datos personales. No se descargó ningún sonido ni se llamó a una escritura.

## Garantías y límites

Los miembros TAR desconocidos permanecen disponibles byte a byte en `members`; pads y eventos conservan sus arrays `raw`; tamaños o rangos incoherentes generan avisos; se aceptan pads nativos de 26 bytes y se señalan correctamente variantes de 27 bytes. `fx_settings` y asignaciones del fader aún no están expuestos, los eventos desconocidos se conservan pero no se interpretan, el lector no reescribe TAR ni garantiza `.ppak` generado, y SAVE/LOAD todavía no usa todas las funciones del lector.
