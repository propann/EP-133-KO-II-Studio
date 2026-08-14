# Validación del primer clon completo de hardware

## Resultado

El clon `MI EP-133` se creó el 9 de agosto de 2026 en una carpeta privada:

```text
/home/azoth/Música/EP-133/clone/MI-EP-133/
```

La lectura comenzó a las 21:27:38 UTC y terminó a las 21:52:58 UTC: **25 minutos y 20 segundos**.

| Elemento | Resultado |
|---|---:|
| Proyectos TAR | 9 |
| Samples PCM | 527 |
| Metadata JSON | 527 |
| Audio | 56.214.010 bytes |
| Tamaño | unos 58 MB |
| Errores | 0 |

## Comprobación independiente — 10 de agosto de 2026

Se releeyeron manifiesto y archivos: 536 hashes SHA-256 recalculados sin diferencias, ningún archivo ausente, 527 JSON de metadata válidos y estado final `complete`. La copia es una base local válida para Studio, permanece privada y no está versionada en Git.

## Validación incremental

El botón de Studio se conecta mediante el puente local. Una segunda pasada con el EP-133 real tardó 30,7 segundos: 9 proyectos sin cambios, 527 sonidos sin cambios, 0 bytes descargados, ninguna alta/cambio/borrado y ningún error.

El manifiesto usa `ep133.rhythm-hero.clone.v2`, modo `incremental` y estado `complete`. La comprobación independiente confirmó de nuevo los 536 hashes y los 527 JSON.
