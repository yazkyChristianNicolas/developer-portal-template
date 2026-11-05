---
sidebar_position: 1
title: Convenciones
description: Formato de la API en el wire format real - snake_case, montos en centavos, fechas, paginación, idempotencia y errores.
---

# Convenciones

## Formato

- **JSON en `snake_case`**, tanto en requests como en respuestas.
- **Montos enteros en centavos**: `12100` es `121,00`.
- **Fechas y horas en ISO 8601**, en UTC: `2026-01-15T12:30:00Z`.
- **IDs opacos** con prefijo por recurso (`ord_…`, `cus_…`). Tratalos como strings.

## Paginación

Los listados usan paginación por offset con `page` (desde 1) y `size` (máximo 100):

```json
{
  "data": [ … ],
  "meta": { "page": 1, "size": 20, "total": 134 }
}
```

## Idempotencia

`POST /orders` acepta el header `Idempotency-Key`. Si repetís el request con la misma clave, recibís el mismo resultado sin crear un pedido nuevo. Usá un UUID por intento lógico.

## Errores

Los errores usan `application/problem+json` (RFC 7807) con un `code` numérico estable:

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "code": 409102,
  "detail": "El pedido ord_01HZZ está en estado PAID y no se puede cancelar."
}
```

- Manejá los errores por `code`: el texto de `detail` puede cambiar.
- El `code` empieza con el status HTTP.
- Todos los códigos están en el [catálogo de errores](../referencia/errores.mdx).
