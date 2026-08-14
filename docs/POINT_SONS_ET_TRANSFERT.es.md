# Estado — Sonidos y transferencia

## Objetivo

La página Sonidos y transferencia explica la máquina antes de presentar operaciones de archivos. La relación principal es grupo → pad → slot → banco de sonidos.

## Principios del manual

El manual local OS 2.0 confirma cuatro grupos A–D, doce sonidos/pads por grupo, la selección de grupo y pad antes de asignar un sonido, los rangos 001–099 Kicks, 100–199 Snares, 200–299 Hi-hats, 300–399 Percussion, 400–499 Bass y 500–599 Melodic, y una memoria global de hasta 999 samples dentro de la capacidad de la máquina.

La interfaz sigue estas relaciones sin copiar ilustraciones, iconos ni páginas protegidas.

## Organización actual

- superficie dividida entre Grupos y pads y navegador de bancos;
- grupos A–D siempre visibles con el número de pads ocupados;
- grupos colocados verticalmente a la izquierda;
- 12 pads en una cuadrícula física 3 × 4: `7 8 9 / 4 5 6 / 1 2 3 / · 0 ENTER`;
- el pad seleccionado se ve directamente en la cuadrícula;
- un golpe en un EP-133 conectado selecciona su grupo e ilumina el pad;
- los pads virtuales priorizan la salida del EP-133, luego el PCM clonado y finalmente un sintetizador local de emergencia;
- un botón KEYS cambia el pad entre ONE y KEYS en el proyecto local compartido;
- inventario buscable por slot o nombre;
- DELETE es visible, pero la acción sobre la máquina permanece bloqueada hasta disponer de checkpoint, copia y relectura;
- la transferencia WAV sigue desactivada hasta contar con una cadena segura.

## Colores de los bancos

| Banco | Rango | Color |
|---|---:|---|
| Kick | 001–099 | naranja rojizo |
| Snare | 100–199 | naranja claro |
| Hi-hat | 200–299 | amarillo |
| Percussion | 300–399 | ciruela |
| Bass | 400–499 | azul profundo |
| Melodic | 500–599 | verde grisáceo |
| FX / User | 600–699 | violeta |
| User 1 | 700–799 | azul petróleo |
| User 2 | 800–899 | marrón claro |
| User 3 | 900–999 | gris |

Solo los seis primeros rangos tienen nombre en el manual. Los rangos 600–999 son zonas de trabajo de la aplicación, no nombres oficiales.

## Preparación de sincronización

Un sonido puede arrastrarse a un pad. La asignación permanece local y `SYNCHRONIZE` prepara y confirma el plan, pero todavía no escribe en la máquina. Reasignar un sonido existente añade cero bytes.

Para escribir habría que cargar el proyecto de la máquina, modificar el campo pad/slot sin perder bytes desconocidos, compilar el archivo, crear un checkpoint, pedir confirmación, escribir un borrador y leerlo de nuevo para compararlo. El recorrido completo aún no está validado.

## Biblioteca personal

La página gestiona muestras de la máquina y muestras personales. Un sonido personal puede arrastrarse a un pad o a una fila del banco marcada **SONIDO PERSONAL PROPUESTO**. `SYNCHRONIZE` copia los archivos pendientes a `<carpeta-de-trabajo>/a-importer/`, pero nunca escribe directamente en el EP-133.

Cada fila del banco tiene preescucha por slot y muestra un mensaje claro si no está cargada la carpeta del clon.

## Validación

Las comprobaciones de motor, transporte, formatos, límites de grupos, MIDI a pad, build y diff están superadas. La validación visual en Chrome/Chromium queda pendiente para pantallas anchas y estrechas. Un build o una prueba de navegador no valida el hardware.
