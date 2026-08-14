# Cargar el proyecto 1 de la máquina

## Resultado del escaneo

El 9 de agosto de 2026 se leyó el proyecto 1 del EP-133 sin ninguna orden de escritura. El decodificador encontró tempo de 120 BPM, patterns A01–A03, B02–B03, C01–C03 y D01–D03, tres escenas S.01–S.03, una posición `L.01` que referencia `S.01` y ninguna alerta.

`S.01` referencia A01, B01, C01 y D01. B01 no existe en el archivo, por lo que el grupo B aparece correctamente vacío. No debe sustituirse por B02 o B03.

## Uso en Studio

Abre `FILE` y elige `DEVICE PROJECT 1`. Studio carga la primera Song Position y muestra 25 eventos en A01, ninguno en B01 ni C01, 6 en D01 y dos compases determinados por el pattern más largo. Cargar no modifica la máquina. Usa `SAVE AS` para crear una copia editable.

## Cadena de preparación

1. `tools/read_project.py` lee el hardware en un TAR local;
2. `tools/export-ep133-project-snapshot.mjs` decodifica el TAR;
3. la interfaz solo recibe `public/ep133-project-1.json`;
4. el sitio no incluye audio ni el archivo binario original.

El JSON es una instantánea. Para recuperar cambios posteriores hay que repetir el escaneo de solo lectura.
