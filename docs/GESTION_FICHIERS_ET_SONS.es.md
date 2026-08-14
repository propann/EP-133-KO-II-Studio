# Gestión de archivos y sonidos

## Objetivo

Crear, guardar, cargar y escuchar un proyecto con o sin EP-133, y preparar una transferencia de hardware verificable.

## Formatos previstos

| Formato | Función | Escritura en máquina |
|---|---|---|
| `ep.project.v1.json` | descripción para el compilador EP | no |
| `.mid` | intercambio de notas con un DAW | no |
| `.ppak` | proyecto/guardado EP compilado | importación explícita |
| paquete de sonidos + manifiesto | audio preparado y dependencias | transferencia explícita |

No habrá un formato propietario de composición para Rhythm Hero. JSON es la fuente legible antes de compilar, MIDI sirve para el intercambio musical y `.pak/.ppak` sigue siendo el formato de la máquina. Consulta `DECISION_FORMATS_PROJET.md`.

## Menú FILE

El menú `SAVE` reúne New, Save, Save As, abrir `.pak/.ppak`, importar MIDI, guardar una copia `.ppak`, exportar MIDI o JSON técnico, duplicar como ejercicio e historial/recuperación. Los ejercicios incluidos están protegidos y deben duplicarse antes de modificarlos.

## Dos bancos de sonidos

### Ordenador

Sonidos libres o del usuario disponibles en el navegador para reproducción offline y preparación.

### Espejo de la máquina

Empieza con metadata SysEx. El audio se recupera bajo demanda y queda privado. Cada pad conserva una referencia lógica con id, hash del archivo del ordenador, slot EP-133 y fallback integrado explícito.

## Preparación de transferencia

Lee identidad y memoria, escanea slots sin escribir, convierte en una carpeta temporal, muestra tamaño/memoria/slot, preescucha el archivo, crea copia si el destino está ocupado, pide confirmación con el número exacto, transfiere sin otra sesión FILE, relee y compara, y solo después actualiza la caché.

## Derechos

El repositorio no debe contener ni exportar automáticamente el banco del fabricante. Las copias locales son responsabilidad de su propietario. Los sonidos distribuidos con la aplicación deben ser libres o creados para el proyecto y tener licencia documentada.
