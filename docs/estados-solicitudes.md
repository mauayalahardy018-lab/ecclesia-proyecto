# Estados de solicitudes de espacio

El precio no aparece en el catálogo público. La persona conserva folio y clave; la clave solo se entrega al crear la solicitud y se guarda como hash. El personal local accede únicamente a solicitudes de sus iglesias.

```mermaid
stateDiagram-v2
    [*] --> solicitada
    solicitada --> en_revision: revisar
    solicitada --> cancelada: solicitante cancela
    en_revision --> cotizada: emitir precio privado
    en_revision --> sin_disponibilidad: no hay lugar
    en_revision --> cancelada: solicitante cancela
    cotizada --> aceptada: acepta antes de vencer
    cotizada --> rechazada: rechaza antes de vencer
    cotizada --> cancelada: cancela antes de aceptar
    cotizada --> vencida: 15 días sin respuesta
    aceptada --> [*]
    rechazada --> [*]
    sin_disponibilidad --> [*]
    cancelada --> [*]
    vencida --> [*]
```

P-10 debe confirmar si los 15 días son exactos desde la emisión o hasta el cierre del día local. La implementación inicial usa 15 periodos de 24 horas exactas.
